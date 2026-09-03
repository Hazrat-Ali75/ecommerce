import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(userId: string) {
    const wishlist = await this.prisma.wishlist.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
                category: {
                  select: { id: true, name: true, slug: true, type: true },
                },
                variants: {
                  select: {
                    id: true,
                    stockQuantity: true,
                    price: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return wishlist.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt,
      product: {
        id: item.product.id,
        title: item.product.title,
        slug: item.product.slug,
        brand: item.product.brand,
        basePrice: item.product.basePrice,
        discountPrice: item.product.discountPrice,
        category: item.product.category,
        primaryImage: item.product.images[0]?.url || null,
        inStock: item.product.variants.some((v) => v.stockQuantity > 0),
      },
    }));
  }

  async toggleItem(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const wishlist = await this.prisma.wishlist.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    if (existing) {
      await this.prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
      return { inWishlist: false, message: 'Removed from wishlist' };
    } else {
      await this.prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
      });
      return { inWishlist: true, message: 'Added to wishlist' };
    }
  }

  async syncWishlist(userId: string, productIds: string[]) {
    if (!productIds || productIds.length === 0) {
      return this.getWishlist(userId);
    }

    const wishlist = await this.prisma.wishlist.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    for (const productId of productIds) {
      await this.prisma.wishlistItem
        .upsert({
          where: {
            wishlistId_productId: {
              wishlistId: wishlist.id,
              productId,
            },
          },
          create: {
            wishlistId: wishlist.id,
            productId,
          },
          update: {},
        })
        .catch(() => null);
    }

    return this.getWishlist(userId);
  }
}
