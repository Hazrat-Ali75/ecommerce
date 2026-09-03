import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  GetProductsQueryDto,
  validateVariantAttributes,
} from './dto/product.dto';
import { Prisma, CategoryType } from '@prisma/client';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public Catalog Query with strict filtering:
   * Category, Gender, Brand, Price Range, Electronics Type, Search.
   * NEVER filter by size in catalog query (size is selected on PDP only).
   */
  async findAll(query: GetProductsQueryDto) {
    const {
      categorySlug,
      categoryId,
      gender,
      brand,
      electronicsType,
      minPrice,
      maxPrice,
      search,
      isFeatured,
      sort,
      page,
      limit,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    // 1. Category Filter
    if (categorySlug) {
      where.category = { slug: categorySlug };
    } else if (categoryId) {
      where.categoryId = categoryId;
    }

    // 2. Featured Filter
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    // 3. Brand Filter
    if (brand) {
      const brands = brand.split(',').map((b) => b.trim());
      where.brand = { in: brands, mode: 'insensitive' };
    }

    // 4. Price Slider Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };
    }

    // 5. Search Filter
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { brand: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { has: searchTerm.toLowerCase() } },
      ];
    }

    // 6. Variant Attribute Filters (Gender or Electronics Type)
    // NOTE: Size is NEVER filtered here per Rule 4!
    const variantConditions: Prisma.ProductVariantWhereInput[] = [];

    if (gender) {
      variantConditions.push({
        attributes: {
          path: ['gender'],
          equals: gender,
        },
      });
    }

    if (electronicsType) {
      variantConditions.push({
        attributes: {
          path: ['type'],
          equals: electronicsType,
        },
      });
    }

    if (variantConditions.length > 0) {
      where.variants = {
        some: {
          AND: variantConditions,
        },
      };
    }

    // Sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sort) {
      case 'price-asc':
        orderBy = { basePrice: 'asc' };
        break;
      case 'price-desc':
        orderBy = { basePrice: 'desc' };
        break;
      case 'popular':
        orderBy = { viewsCount: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'random':
        // Shuffled after retrieval
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [products, total, facets] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true, type: true },
          },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
          variants: {
            select: {
              id: true,
              sku: true,
              price: true,
              discountPrice: true,
              stockQuantity: true,
              attributes: true,
            },
          },
          _count: {
            select: { reviews: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
      this.getCategoryFacets(categorySlug || categoryId),
    ]);

    // If random order requested, randomize product order using Fisher-Yates
    if (sort === 'random' && products.length > 1) {
      for (let i = products.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [products[i], products[j]] = [products[j], products[i]];
      }
    }

    return {
      products,
      facets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Product Details by Slug (PDP):
   * Includes all size variants with live stock for PDP pills.
   */
  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        variants: {
          orderBy: { sku: 'asc' },
        },
        reviews: {
          where: { isVerified: true },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException(`Product '${slug}' not found`);
    }

    // Increment view count asynchronously
    this.prisma.product
      .update({
        where: { id: product.id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch(() => null);

    return product;
  }

  /**
   * Create Product with strict category variation validation
   */
  async create(dto: CreateProductDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with id '${dto.categoryId}' not found`);
    }

    const existingSlug = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException(`Product with slug '${dto.slug}' already exists`);
    }

    const existingSku = await this.prisma.product.findUnique({
      where: { skuPrefix: dto.skuPrefix },
    });

    if (existingSku) {
      throw new ConflictException(`SKU prefix '${dto.skuPrefix}' is already in use`);
    }

    // STRICT VARIATION VALIDATION: Verify each variant against category type
    for (const variant of dto.variants) {
      try {
        validateVariantAttributes(category.type, variant.attributes);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Invalid variant attributes';
        throw new BadRequestException(
          `Variant '${variant.sku}' failed validation for category ${category.name} (${category.type}): ${errorMsg}`
        );
      }
    }

    // Auto-generate slug and skuPrefix if not explicitly provided
    const baseSlug = (dto.slug && dto.slug.trim())
      ? dto.slug.trim()
      : dto.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const finalSlug = dto.slug ? dto.slug.trim() : `${baseSlug}-${rand}`;

    const finalSkuPrefix = (dto.skuPrefix && dto.skuPrefix.trim())
      ? dto.skuPrefix.trim().toUpperCase()
      : `${dto.brand.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const finalDescription = (dto.description && dto.description.trim())
      ? dto.description.trim()
      : 'Authentic Bangladeshi marketplace product with official warranty.';

    // Create in a database transaction
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          title: dto.title.trim(),
          slug: finalSlug,
          description: finalDescription,
          shortDescription: dto.shortDescription?.trim() || null,
          basePrice: dto.basePrice,
          discountPrice: dto.discountPrice || null,
          brand: dto.brand.trim(),
          skuPrefix: finalSkuPrefix,
          categoryId: dto.categoryId,
          isFeatured: dto.isFeatured ?? false,
          isActive: dto.isActive ?? true,
          tags: dto.tags || [],
        },
      });

      // Create images
      if (dto.images && dto.images.length > 0) {
        await tx.productImage.createMany({
          data: dto.images.map((img, index) => ({
            productId: product.id,
            url: img.url,
            publicId: img.publicId || `img_${Date.now()}_${index}`,
            altText: img.altText || product.title,
            isPrimary: img.isPrimary ?? index === 0,
            sortOrder: img.sortOrder ?? index,
          })),
        });
      }

      // Create variants
      await tx.productVariant.createMany({
        data: dto.variants.map((v) => ({
          productId: product.id,
          sku: v.sku.trim(),
          price: v.price,
          discountPrice: v.discountPrice || null,
          stockQuantity: v.stockQuantity,
          imageUrl: v.imageUrl || null,
          attributes: v.attributes as Prisma.InputJsonValue,
        })),
      });

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          images: true,
          variants: true,
        },
      });
    });
  }

  /**
   * Update Product
   */
  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!existing) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    const categoryType = dto.categoryId
      ? (await this.prisma.category.findUnique({ where: { id: dto.categoryId } }))?.type ||
        existing.category.type
      : existing.category.type;

    // Validate variants if provided
    if (dto.variants && dto.variants.length > 0) {
      for (const variant of dto.variants) {
        try {
          validateVariantAttributes(categoryType, variant.attributes);
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Invalid variant attributes';
          throw new BadRequestException(`Variant '${variant.sku}' failed validation: ${errorMsg}`);
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          ...(dto.title && { title: dto.title.trim() }),
          ...(dto.slug && { slug: dto.slug.trim() }),
          ...(dto.description && { description: dto.description.trim() }),
          ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription || null }),
          ...(dto.basePrice && { basePrice: dto.basePrice }),
          ...(dto.discountPrice !== undefined && { discountPrice: dto.discountPrice || null }),
          ...(dto.brand && { brand: dto.brand.trim() }),
          ...(dto.categoryId && { categoryId: dto.categoryId }),
          ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(dto.tags && { tags: dto.tags }),
        },
      });

      // If new images array provided, replace images
      if (dto.images && dto.images.length > 0) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: dto.images.map((img, index) => ({
            productId: id,
            url: img.url,
            publicId: img.publicId,
            altText: img.altText || dto.title || existing.title,
            isPrimary: img.isPrimary ?? index === 0,
            sortOrder: img.sortOrder ?? index,
          })),
        });
      }

      // If new variants array provided, replace variants
      if (dto.variants && dto.variants.length > 0) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        await tx.productVariant.createMany({
          data: dto.variants.map((v) => ({
            productId: id,
            sku: v.sku.trim(),
            price: v.price,
            discountPrice: v.discountPrice || null,
            stockQuantity: v.stockQuantity,
            imageUrl: v.imageUrl || null,
            attributes: v.attributes as Prisma.InputJsonValue,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          images: true,
          variants: true,
        },
      });
    });
  }

  /**
   * Delete Product (Soft delete)
   */
  async delete(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, message: `Product '${product.title}' has been deactivated.` };
  }

  /**
   * Admin paginated product list
   */
  async getAdminProducts(
    page: number = 1,
    limit: number = 15,
    search?: string,
    categoryType?: CategoryType
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(categoryType && { category: { type: categoryType } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { skuPrefix: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true, type: true } },
          images: {
            select: { id: true, url: true, isPrimary: true, sortOrder: true },
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
          variants: {
            select: { id: true, sku: true, stockQuantity: true, price: true, attributes: true },
          },
          _count: {
            select: { orderItems: true, reviews: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Computes available filter facets (unique brands, price min/max) for catalog sidebar
   */
  private async getCategoryFacets(categoryIdentifier?: string) {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (categoryIdentifier) {
      where.OR = [{ categoryId: categoryIdentifier }, { category: { slug: categoryIdentifier } }];
    }

    const [brandsData, priceMinMax] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: { brand: true },
        distinct: ['brand'],
        orderBy: { brand: 'asc' },
      }),
      this.prisma.product.aggregate({
        where,
        _min: { basePrice: true },
        _max: { basePrice: true },
      }),
    ]);

    return {
      brands: brandsData.map((b) => b.brand),
      priceRange: {
        min: priceMinMax._min.basePrice ? Number(priceMinMax._min.basePrice) : 0,
        max: priceMinMax._max.basePrice ? Number(priceMinMax._max.basePrice) : 20000,
      },
    };
  }
}
