import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export interface CartItem {
  id?: string;
  productId: string;
  variantId?: string | null;
  title: string;
  slug: string;
  brand: string;
  price: number;
  image: string | null;
  attributes?: Record<string, string> | null;
  quantity: number;
  stockQuantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null | undefined) => void;
  clearCart: () => void;
  subtotal: () => number;
  totalItems: () => number;
  syncWithBackend: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (newItem) => {
        const { items } = get();
        const existingIndex = items.findIndex(
          (i) => i.productId === newItem.productId && i.variantId === (newItem.variantId || null)
        );

        if (existingIndex > -1) {
          const existing = items[existingIndex];
          const newQty = existing.quantity + newItem.quantity;
          if (newQty > existing.stockQuantity) {
            toast.error(`Only ${existing.stockQuantity} items available in stock`);
            return;
          }

          const updated = [...items];
          updated[existingIndex] = { ...existing, quantity: newQty };
          set({ items: updated, isOpen: true });
          toast.success(`Updated ${newItem.title} in your cart`);
        } else {
          if (newItem.quantity > newItem.stockQuantity) {
            toast.error(`Only ${newItem.stockQuantity} items available in stock`);
            return;
          }
          set({ items: [...items, newItem], isOpen: true });
          toast.success(`Added ${newItem.title} to your cart`);
        }

        // Background sync if logged in
        get().syncWithBackend();
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        const { items } = get();
        const updated = items.map((item) => {
          if (item.productId === productId && item.variantId === (variantId || null)) {
            if (quantity > item.stockQuantity) {
              toast.error(`Only ${item.stockQuantity} items available in stock`);
              return item;
            }
            return { ...item, quantity };
          }
          return item;
        });

        set({ items: updated });
        get().syncWithBackend();
      },

      removeItem: (productId, variantId) => {
        const { items } = get();
        const updated = items.filter(
          (i) => !(i.productId === productId && i.variantId === (variantId || null))
        );
        set({ items: updated });
        toast.info("Item removed from cart");
        get().syncWithBackend();
      },

      clearCart: () => {
        set({ items: [] });
      },

      subtotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },

      totalItems: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      syncWithBackend: async () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (!token) return;

        const payload = get().items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || null,
          quantity: i.quantity,
        }));

        try {
          await apiClient.post("/cart/sync", { items: payload });
        } catch {
          // Ignore background sync errors for guest
        }
      },
    }),
    {
      name: "banglacart-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
