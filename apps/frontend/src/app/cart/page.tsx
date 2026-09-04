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
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ChevronRight,
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
        <div className="h-8 bg-stone-100 rounded-lg w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 h-64 bg-stone-100 rounded-3xl" />
          <div className="lg:col-span-4 h-64 bg-stone-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-700 shadow-xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 mb-3">
          Your Shopping Cart is Empty
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mb-8 leading-relaxed">
          Looks like you haven&apos;t added anything to your cart yet. Explore our authentic Bangladeshi apparel, footwear, and gadgets.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-700/20"
        >
          <span>Explore BanglaShop</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const currentSubtotal = subtotal();
  const currentDiscount = getDiscountAmount();
  const calculatedTotal = Math.max(0, currentSubtotal - currentDiscount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6 sm:mb-8">
        <Link href="/" className="hover:text-emerald-700 transition-colors font-medium">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <Link href="/shop" className="hover:text-emerald-700 transition-colors font-medium">
          Shop
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <span className="text-stone-900 font-semibold">Shopping Cart</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BanglaShop Bag</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-stone-900 tracking-tight">
            Shopping Cart ({totalItems()} {totalItems() === 1 ? "item" : "items"})
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Review your authentic items before moving to delivery & checkout
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm("Are you sure you want to clear your shopping cart?")) {
              clearCart();
            }
          }}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 self-start sm:self-auto hover:underline"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* ========================================================================= */}
        {/* LEFT: CART ITEMS LIST (8 cols)                                            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 divide-y divide-stone-100 border-t border-b border-stone-200">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId}`}
              className="py-5 sm:py-6 flex gap-4 sm:gap-6 items-center"
            >
              {/* Product Thumbnail */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-stone-50 rounded-2xl overflow-hidden shrink-0 border border-stone-200 shadow-xs">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  {item.brand}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 truncate hover:text-emerald-700 transition-colors">
                  <Link href={`/product/${item.slug}`}>{item.title}</Link>
                </h3>

                {/* Sizing and Attributes */}
                {item.attributes && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {item.attributes.size && (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 uppercase">
                        Size: {item.attributes.size.toUpperCase()}
                      </span>
                    )}
                    {item.attributes.gender && (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-stone-100 text-stone-700 capitalize">
                        {item.attributes.gender}
                      </span>
                    )}
                  </div>
                )}

                <div className="text-sm sm:text-base font-extrabold text-stone-900 mt-2">
                  {formatBDT(item.price)}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center border border-stone-200 rounded-xl p-1 bg-stone-50/80">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                  className="p-1 hover:bg-white rounded-lg text-stone-600 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-stone-900">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                  disabled={item.quantity >= item.stockQuantity}
                  className="p-1 hover:bg-white rounded-lg text-stone-600 disabled:opacity-30 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Line Total & Remove */}
              <div className="text-right">
                <span className="text-sm sm:text-base font-extrabold text-emerald-800 block">
                  {formatBDT(item.price * item.quantity)}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="text-stone-400 hover:text-rose-600 mt-1 p-1 rounded-md transition-colors"
                  title="Remove item"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT: ORDER SUMMARY CARD (4 cols)                                        */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4">
          <div className="bg-stone-50/80 border border-stone-200/80 rounded-3xl p-6 space-y-5 sticky top-24 shadow-card">
            <h3 className="text-base font-bold uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-3">
              Order Summary
            </h3>

            {/* Promo Code Input or Active Badge */}
            <div className="pb-1">
              {appliedCoupon ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block">
                        {appliedCoupon.code} Applied
                      </span>
                      <span className="text-[11px] text-emerald-800">
                        {appliedCoupon.discountType === "PERCENTAGE"
                          ? `${appliedCoupon.discountValue}% discount savings`
                          : `৳${appliedCoupon.discountValue} flat savings`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                    title="Remove coupon"
                    aria-label="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Promo Code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-bold uppercase bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isApplying || !couponInput.trim()}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
                  >
                    {isApplying && <Loader2 className="w-3 h-3 animate-spin" />}
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs border-t border-stone-200 pt-3">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-stone-900">{formatBDT(currentSubtotal)}</span>
              </div>

              {currentDiscount > 0 && (
                <div className="flex justify-between text-rose-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon Savings ({appliedCoupon?.code})
                  </span>
                  <span>-{formatBDT(currentDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>Estimated Delivery</span>
                <span className="text-right font-medium">Dhaka ৳60 • Outside ৳120</span>
              </div>

              <div className="flex justify-between text-sm sm:text-base font-bold text-stone-900 pt-3 border-t border-stone-200">
                <span>Subtotal (Excl. Shipping)</span>
                <span className="text-emerald-800 text-lg sm:text-xl font-extrabold">
                  {formatBDT(calculatedTotal)}
                </span>
              </div>
            </div>

            {/* Proceed CTA */}
            <Link
              href="/checkout"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20 active:scale-[0.99]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Bangladeshi Logistics Reassurance */}
            <div className="pt-3 border-t border-stone-200 space-y-2 text-[11px] text-stone-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Flat rate delivery: Inside Dhaka ৳60 | Outside ৳120</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Nationwide Cash on Delivery (COD) & Stripe Secure Card</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>7-Day Easy Return Policy across Bangladesh</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
