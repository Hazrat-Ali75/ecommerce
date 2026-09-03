import { z } from 'zod';

export const AddToCartSchema = z.object({
  productId: z.string().cuid('Valid productId is required'),
  variantId: z.string().cuid().optional().nullable(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});

export type AddToCartDto = z.infer<typeof AddToCartSchema>;

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>;

export const SyncCartItemSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional().nullable(),
  quantity: z.number().int().min(1),
});

export const SyncCartSchema = z.object({
  items: z.array(SyncCartItemSchema),
});

export type SyncCartDto = z.infer<typeof SyncCartSchema>;
