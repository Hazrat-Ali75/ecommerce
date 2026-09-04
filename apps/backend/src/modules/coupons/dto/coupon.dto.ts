import { z } from 'zod';
import { DiscountType } from '@prisma/client';

export const ValidateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').trim().toUpperCase(),
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
});

export type ValidateCouponDto = z.infer<typeof ValidateCouponSchema>;

export const CreateCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code cannot exceed 20 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, hyphens, and underscores')
    .transform((val) => val.toUpperCase().trim()),
  description: z.string().max(255).optional().nullable(),
  discountType: z.nativeEnum(DiscountType, {
    errorMap: () => ({ message: 'Discount type must be PERCENTAGE or FIXED_AMOUNT' }),
  }),
  discountValue: z.number().positive('Discount value must be greater than 0'),
  minOrderAmount: z.number().min(0, 'Minimum order amount cannot be negative').optional().nullable(),
  maxDiscount: z.number().min(0, 'Maximum discount cannot be negative').optional().nullable(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  usageLimit: z.number().int().positive('Usage limit must be a positive integer').optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CreateCouponDto = z.infer<typeof CreateCouponSchema>;

export const UpdateCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code cannot exceed 20 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, hyphens, and underscores')
    .transform((val) => val.toUpperCase().trim())
    .optional(),
  description: z.string().max(255).optional().nullable(),
  discountType: z.nativeEnum(DiscountType).optional(),
  discountValue: z.number().positive('Discount value must be greater than 0').optional(),
  minOrderAmount: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateCouponDto = z.infer<typeof UpdateCouponSchema>;

export const GetCouponsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export type GetCouponsQueryDto = z.infer<typeof GetCouponsQuerySchema>;
