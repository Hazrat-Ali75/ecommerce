import { z } from 'zod';

export const CreateBannerSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  subtitle: z.string().optional(),
  badgeText: z.string().optional(),
  imageUrl: z.string().url('Must be a valid image URL'),
  linkUrl: z.string().min(1, 'Link URL is required'),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type CreateBannerDto = z.infer<typeof CreateBannerSchema>;

export const UpdateBannerSchema = CreateBannerSchema.partial();
export type UpdateBannerDto = z.infer<typeof UpdateBannerSchema>;
