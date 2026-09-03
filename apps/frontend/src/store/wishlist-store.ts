import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export interface WishlistItem {
  productId: string;
  title: string;
  slug: string;
  brand: string;
  price: number;
  image: string | null;
  inStock: boolean;
}

interface WishlistState {
  items: WishlistItem[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  syncWithBackend: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      isInWishlist: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },

      toggleWishlist: (item) => {
        const { items } = get();
        const exists = items.some((i) => i.productId === item.productId);

        if (exists) {
          set({ items: items.filter((i) => i.productId !== item.productId) });
          toast.info(`Removed ${item.title} from wishlist`);
        } else {
          set({ items: [...items, item] });
          toast.success(`Added ${item.title} to wishlist`);
        }

        get().syncWithBackend();
      },

      syncWithBackend: async () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (!token) return;

        const productIds = get().items.map((i) => i.productId);
        try {
          await apiClient.post("/wishlist/sync", { productIds });
        } catch {
          // Ignore background sync errors
        }
      },
    }),
    {
      name: "banglacart-wishlist",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
