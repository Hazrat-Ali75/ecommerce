import { z } from 'zod';
import { CategoryType } from '@prisma/client';

export const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  type: z.nativeEnum(CategoryType, {
    errorMap: () => ({ message: 'Category type must be FASHION, FOOTWEAR, or ELECTRONICS' }),
  }),
  parentId: z.string().cuid().optional().nullable(),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
