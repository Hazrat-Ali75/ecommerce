import { z } from 'zod';

export const SyncWishlistSchema = z.object({
  productIds: z.array(z.string().cuid()),
});

export type SyncWishlistDto = z.infer<typeof SyncWishlistSchema>;
