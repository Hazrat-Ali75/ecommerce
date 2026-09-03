"use client";

import { useCartStore } from "@/store/cart-store";
import { formatBDT } from "@/lib/currency";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from "lucide-react";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, totalItems } = useCartStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer Container (pl-0 on mobile so it never shifts off-screen) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 z-50 pointer-events-none">
        <div className="w-full sm:w-[420px] max-w-full bg-white shadow-2xl flex flex-col h-full pointer-events-auto animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Your Cart ({totalItems()})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Your cart is empty</h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Explore our authentic Bangladeshi fashion, footwear, and gadgets collections.
                </p>
                <button
                  onClick={closeCart}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => {
                const isOutOfStock = item.stockQuantity <= 0;
                return (
                  <div key={`${item.productId}-${item.variantId}`} className="py-4 flex gap-3 sm:gap-4">
                    {/* Thumbnail */}
                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 border">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                            <Link href={`/product/${item.slug}`} onClick={closeCart} className="hover:text-primary">
                              {item.title}
                            </Link>
                          </h4>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-md transition-colors shrink-0"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-gray-500 font-medium">{item.brand}</p>

                        {/* Strict Variation Attribute Badges */}
                        {item.attributes && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.attributes.size && (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-700">
                                Size: {item.attributes.size.toUpperCase()}
                              </span>
                            )}
                            {item.attributes.gender && (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-700 capitalize">
                                {item.attributes.gender}
                              </span>
                            )}
                            {item.attributes.type && (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-700 capitalize">
                                {item.attributes.type}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs sm:text-sm font-black text-gray-900">
                          {formatBDT(item.price)}
                        </span>

                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            Out of stock
                          </span>
                        ) : (
                          /* Quantity Controls */
                          <div className="flex items-center border rounded-lg overflow-hidden bg-white shadow-xs">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.variantId,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              className="p-1 sm:p-1.5 hover:bg-gray-100 text-gray-600 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <span className="w-7 sm:w-8 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.variantId,
                                  Math.min(item.stockQuantity, item.quantity + 1)
                                )
                              }
                              disabled={item.quantity >= item.stockQuantity}
                              className="p-1 sm:p-1.5 hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t bg-gray-50 space-y-3.5 shrink-0">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatBDT(subtotal())}</span>
                </div>
                <div className="flex justify-between text-[11px] sm:text-xs text-gray-500">
                  <span>Delivery Fee</span>
                  <span>Calculated at checkout (৳60 / ৳120)</span>
                </div>
              </div>

              <div className="pt-2 border-t flex justify-between text-sm sm:text-base font-bold text-gray-900">
                <span>Estimated Total</span>
                <span className="text-primary font-black">{formatBDT(subtotal())}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="w-full inline-flex items-center justify-center py-2.5 px-3 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-primary/90 transition-colors shadow-xs"
                >
                  Checkout
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <p className="text-[10px] sm:text-[11px] text-center text-gray-400">
                Cash on Delivery & Instant Stripe Checkout supported
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
