import { z } from 'zod';

export const CreateReviewSchema = z.object({
  productId: z.string().cuid('Valid product ID is required'),
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  comment: z
    .string()
    .max(1000, 'Review comment must be at most 1000 characters')
    .optional()
    .nullable(),
});

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;

export const UpdateReviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars')
    .optional(),
  comment: z
    .string()
    .max(1000, 'Review comment must be at most 1000 characters')
    .optional()
    .nullable(),
});

export type UpdateReviewDto = z.infer<typeof UpdateReviewSchema>;

export const GetProductReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export type GetProductReviewsQueryDto = z.infer<typeof GetProductReviewsQuerySchema>;

export const GetAdminReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
  search: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isVerified: z.enum(['true', 'false']).optional(),
});

export type GetAdminReviewsQueryDto = z.infer<typeof GetAdminReviewsQuerySchema>;
