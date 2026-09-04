"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart-store";
import { formatBDT } from "@/lib/currency";
import { apiClient } from "@/lib/api-client";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import { toast } from "sonner";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Truck,
  Tag,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalItems,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
  } = useCartStore();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    try {
      setIsApplying(true);
      const res = await apiClient.post("/coupons/validate", {
        code: couponInput.trim().toUpperCase(),
        subtotal: subtotal(),
      });

      applyCoupon({
        couponId: res.data.couponId,
        code: res.data.code,
        description: res.data.description,
        discountType: res.data.discountType,
        discountValue: res.data.discountValue,
        discountAmount: res.data.discountAmount,
        minOrderAmount: res.data.minOrderAmount,
        maxDiscount: res.data.maxDiscount,
      });

      toast.success(res.data.message || `Coupon ${res.data.code} applied successfully!`);
      setCouponInput("");
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err, "Invalid promo code"));
    } finally {
      setIsApplying(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 h-64 bg-gray-100 rounded-2xl" />
          <div className="lg:col-span-4 h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">Your Shopping Cart is Empty</h1>
        <p className="text-xs sm:text-sm text-gray-500 mb-6">
          Explore our authentic Bangladeshi fashion, footwear, and electronics.
        </p>
        <Link href="/shop" className="px-6 py-3 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl">
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex items-center justify-between pb-6 border-b mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
            Shopping Cart ({totalItems()})
          </h1>
          <p className="text-xs text-gray-500 mt-1">Review your selected items before checkout</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-red-600 hover:text-red-700"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Items List (8 cols) */}
        <div className="lg:col-span-8 divide-y divide-gray-100 border-t border-b">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variantId}`} className="py-4 sm:py-5 flex gap-3 sm:gap-6 items-center">
              <div className="relative w-18 h-18 sm:w-24 sm:h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0 border">
                {item.image && <Image src={item.image} alt={item.title} fill className="object-cover" />}
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-primary">{item.brand}</span>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                  <Link href={`/product/${item.slug}`}>{item.title}</Link>
                </h3>

                {/* Attributes (Size, Gender, Type) */}
                {item.attributes && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {item.attributes.size && (
                      <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-gray-100 text-gray-800">
                        Size: {item.attributes.size.toUpperCase()}
                      </span>
                    )}
                    {item.attributes.gender && (
                      <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-gray-100 text-gray-800 capitalize">
                        {item.attributes.gender}
                      </span>
                    )}
                  </div>
                )}

                <div className="text-sm sm:text-base font-bold text-gray-900 mt-1.5 sm:mt-2">
                  {formatBDT(item.price)}
                </div>
              </div>

              {/* Quantity Adjuster */}
              <div className="flex items-center border rounded-xl p-1">
                <button
                  onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                  disabled={item.quantity >= item.stockQuantity}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right">
                <span className="text-sm sm:text-base font-bold text-primary block">
                  {formatBDT(item.price * item.quantity)}
                </span>
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="text-gray-400 hover:text-red-500 mt-1 p-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-gray-50 border rounded-2xl p-6 space-y-5 sticky top-24">
            <h3 className="text-base font-bold text-gray-900 border-b pb-3">Summary</h3>

            {/* Promo Code Input or Applied Badge */}
            <div className="pb-1">
              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">
                        {appliedCoupon.code} applied
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        {appliedCoupon.discountType === "PERCENTAGE"
                          ? `${appliedCoupon.discountValue}% discount`
                          : `৳${appliedCoupon.discountValue} flat discount`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                    title="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2 text-xs font-semibold uppercase bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isApplying || !couponInput.trim()}
                    className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
                  >
                    {isApplying && <Loader2 className="w-3 h-3 animate-spin" />}
                    Apply
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">{formatBDT(subtotal())}</span>
              </div>

              {getDiscountAmount() > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon Discount ({appliedCoupon?.code})
                  </span>
                  <span>-{formatBDT(getDiscountAmount())}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Estimated Delivery</span>
                <span>Inside Dhaka ৳60 • Outside ৳120</span>
              </div>

              <div className="flex justify-between text-sm sm:text-base font-bold text-gray-900 pt-3 border-t">
                <span>Estimated Total</span>
                <span className="text-primary text-base sm:text-lg font-extrabold">
                  {formatBDT(Math.max(0, subtotal() - getDiscountAmount()))}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="pt-3 border-t flex items-center gap-2 text-[11px] text-gray-500">
              <Truck className="w-4 h-4 text-primary shrink-0" />
              <span>Flat shipping: Dhaka ৳60 (24-48h), Outside ৳120 (3-5d)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
