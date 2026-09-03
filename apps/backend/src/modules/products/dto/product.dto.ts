import { z } from 'zod';
import { CategoryType } from '@prisma/client';

// ============================================================================
// STRICT VARIATION SCHEMAS (ZERO EXTRA ATTRIBUTES PERMITTED)
// ============================================================================

/**
 * Fashion & Apparel:
 * Allowed: gender (men, women, kids), size (s, m, l, xl, xxl)
 */
export const FashionVariantAttributesSchema = z
  .object({
    gender: z.enum(['men', 'women', 'kids'], {
      errorMap: () => ({ message: 'Fashion gender must be men, women, or kids' }),
    }),
    size: z.enum(['s', 'm', 'l', 'xl', 'xxl'], {
      errorMap: () => ({ message: 'Fashion size must be s, m, l, xl, or xxl' }),
    }),
  })
  .strict({
    message:
      'Fashion variants cannot contain extra attributes (no color, material, etc.). Only gender and size are allowed.',
  });

export type FashionVariantAttributes = z.infer<typeof FashionVariantAttributesSchema>;

/**
 * Footwear & Sneakers:
 * Allowed: gender (men, women, kids), size ("5", "6", "7", "8", "9", "10")
 */
export const FootwearVariantAttributesSchema = z
  .object({
    gender: z.enum(['men', 'women', 'kids'], {
      errorMap: () => ({ message: 'Footwear gender must be men, women, or kids' }),
    }),
    size: z.enum(['5', '6', '7', '8', '9', '10'], {
      errorMap: () => ({ message: 'Footwear size must be 5, 6, 7, 8, 9, or 10' }),
    }),
  })
  .strict({
    message:
      'Footwear variants cannot contain extra attributes (no color, material, etc.). Only gender and size are allowed.',
  });

export type FootwearVariantAttributes = z.infer<typeof FootwearVariantAttributesSchema>;

/**
 * Electronics & Gadgets:
 * Allowed:
 *  - watch: type 'watch', gender ('men' | 'women')
 *  - charger: type 'charger'
 *  - power bank: type 'power bank'
 *  - earbuds: type 'earbuds'
 */
const WatchAttributesSchema = z
  .object({
    type: z.literal('watch'),
    gender: z.enum(['men', 'women'], {
      errorMap: () => ({ message: 'Watch target gender must be men or women' }),
    }),
  })
  .strict({
    message: 'Watch variants only allow type: "watch" and gender: "men" | "women"',
  });

const ChargerAttributesSchema = z
  .object({
    type: z.literal('charger'),
  })
  .strict({
    message: 'Charger variants cannot contain extra attributes',
  });

const PowerBankAttributesSchema = z
  .object({
    type: z.literal('power bank'),
  })
  .strict({
    message: 'Power bank variants cannot contain extra attributes',
  });

const EarbudsAttributesSchema = z
  .object({
    type: z.literal('earbuds'),
  })
  .strict({
    message: 'Earbuds variants cannot contain extra attributes',
  });

export const ElectronicsVariantAttributesSchema = z.discriminatedUnion('type', [
  WatchAttributesSchema,
  ChargerAttributesSchema,
  PowerBankAttributesSchema,
  EarbudsAttributesSchema,
]);

export type ElectronicsVariantAttributes = z.infer<typeof ElectronicsVariantAttributesSchema>;

// Helper validator function enforcing category variation boundary
export function validateVariantAttributes(
  categoryType: CategoryType,
  attributes: unknown
): FashionVariantAttributes | FootwearVariantAttributes | ElectronicsVariantAttributes {
  switch (categoryType) {
    case CategoryType.FASHION:
      return FashionVariantAttributesSchema.parse(attributes);
    case CategoryType.FOOTWEAR:
      return FootwearVariantAttributesSchema.parse(attributes);
    case CategoryType.ELECTRONICS:
      return ElectronicsVariantAttributesSchema.parse(attributes);
    default:
      throw new Error(`Unsupported category type: ${categoryType}`);
  }
}

// ============================================================================
// PRODUCT IMAGES & VARIANTS
// ============================================================================

export const ProductImageInputSchema = z.object({
  url: z.string().url('Must be a valid image URL'),
  publicId: z.string().min(1, 'Cloudinary publicId is required'),
  altText: z.string().optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export type ProductImageInput = z.infer<typeof ProductImageInputSchema>;

export const ProductVariantInputSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  price: z.number().positive('Price must be greater than 0'),
  discountPrice: z.number().positive('Discount price must be positive').optional().nullable(),
  stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative'),
  imageUrl: z.string().url().optional().nullable(),
  attributes: z.record(z.unknown()), // validated per category at service level
});

export type ProductVariantInput = z.infer<typeof ProductVariantInputSchema>;

// ============================================================================
// CREATE & UPDATE PRODUCT DTOs
// ============================================================================

export const CreateProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().optional(),
  basePrice: z.number().positive('Base price must be greater than 0'),
  discountPrice: z.number().positive().optional().nullable(),
  brand: z.string().min(2, 'Brand is required'),
  skuPrefix: z.string().min(2, 'SKU prefix is required'),
  categoryId: z.string().cuid('Valid categoryId is required'),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  images: z.array(ProductImageInputSchema).min(1, 'At least one product image is required'),
  variants: z.array(ProductVariantInputSchema).min(1, 'At least one product variant is required'),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;

// ============================================================================
// CATALOG FILTERING & QUERY SCHEMA
// RULE: NEVER include size in catalog query! Size is selected on PDP only.
// ============================================================================

export const GetProductsQuerySchema = z.object({
  categorySlug: z.string().optional(),
  categoryId: z.string().optional(),
  gender: z.enum(['men', 'women', 'kids']).optional(),
  brand: z.string().optional(),
  electronicsType: z.enum(['watch', 'charger', 'power bank', 'earbuds']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  search: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'rating', 'popular']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type GetProductsQueryDto = z.infer<typeof GetProductsQuerySchema>;
