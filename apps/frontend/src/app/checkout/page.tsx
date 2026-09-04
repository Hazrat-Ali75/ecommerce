"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import { formatBDT } from "@/lib/currency";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import { toast } from "sonner";
import {
  Truck,
  Banknote,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShoppingBag,
  Tag,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
  } = useCartStore();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.info("Please sign in to proceed with checkout");
      router.push("/login?redirect=/checkout");
    }
  }, [isAuthenticated, isLoading, router]);

  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [deliveryZone, setDeliveryZone] = useState<"INSIDE_DHAKA" | "OUTSIDE_DHAKA">("INSIDE_DHAKA");
  const [division, setDivision] = useState("Dhaka");
  const [district, setDistrict] = useState("Dhaka");
  const [streetAddress, setStreetAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_DELIVERY" | "STRIPE">("CASH_ON_DELIVERY");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delivery fee based on zone
  const deliveryFee = deliveryZone === "INSIDE_DHAKA" ? 60 : 120;
  const currentSubtotal = subtotal();
  const discountAmount = getDiscountAmount();
  const totalAmount = Math.max(0, currentSubtotal - discountAmount) + deliveryFee;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const res = await apiClient.post("/coupons/validate", {
        code: couponInput.trim().toUpperCase(),
        subtotal: currentSubtotal,
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

      toast.success(res.data.message || `Coupon '${res.data.code}' applied!`);
      setCouponInput("");
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err, "Invalid promo code"));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Bangladeshi phone regex: 11 digits starting with 013-019
  const bdPhoneRegex = /^01[3-9]\d{8}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!phone.trim() || !bdPhoneRegex.test(phone.trim())) {
      toast.error("Please enter a valid 11-digit Bangladeshi mobile number (e.g., 01712345678)");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!streetAddress.trim() || streetAddress.trim().length < 5) {
      toast.error("Please enter a detailed street address");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          deliveryZone,
          division: division.trim(),
          district: district.trim(),
          streetAddress: streetAddress.trim(),
        },
        paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || null,
          quantity: i.quantity,
        })),
      };

      const res = await apiClient.post("/orders/checkout", payload);
      const createdOrder = res.data;

      // Clear local cart
      clearCart();

      if (paymentMethod === "CASH_ON_DELIVERY") {
        toast.success(`Order ${createdOrder.orderNumber} placed successfully!`);
        router.push(`/order-success?orderNumber=${createdOrder.orderNumber}`);
      } else if (paymentMethod === "STRIPE") {
        toast.loading("Redirecting to secure Stripe Checkout...");
        const stripeRes = await apiClient.post(`/payments/stripe/create-session/${createdOrder.id}`);
        if (stripeRes.data?.checkoutUrl) {
          window.location.href = stripeRes.data.checkoutUrl;
        } else {
          router.push(`/order-success?orderNumber=${createdOrder.orderNumber}`);
        }
      }
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err, "We couldn't complete your order. Please check your delivery information and try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your Shopping Cart is Empty</h2>
        <p className="text-sm text-gray-500 mb-6">
          Add some authentic Bangladeshi products before proceeding to checkout.
        </p>
        <Link href="/shop" className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 mb-6 sm:mb-8 tracking-tight">
        Secure Checkout
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Form: Shipping & Delivery & Payment (7 cols) */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          {/* Section 1: Customer & Shipping Address */}
          <div className="bg-white border rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-5 shadow-xs">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              1. Delivery Address (Bangladeshi Logistics)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Uddin"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-base sm:text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Bangladeshi Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX (11 digits)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-base sm:text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-[11px] text-gray-400">Must start with 013 to 019</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="you@example.com (for order & tracking confirmation)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-base sm:text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* RULE 7: TIERED DELIVERY ZONE SELECTION */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Select Delivery Zone *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setDeliveryZone("INSIDE_DHAKA")}
                  className={`p-3.5 sm:p-4 border-2 rounded-xl sm:rounded-2xl cursor-pointer flex flex-col justify-between transition-all ${
                    deliveryZone === "INSIDE_DHAKA"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs sm:text-sm text-gray-900">Inside Dhaka (Capital)</span>
                    <span className="text-xs sm:text-sm font-bold text-primary">৳60</span>
                  </div>
                  <span className="text-[11px] sm:text-xs text-gray-500">Estimated 24–48 Hours</span>
                </label>

                <label
                  onClick={() => setDeliveryZone("OUTSIDE_DHAKA")}
                  className={`p-3.5 sm:p-4 border-2 rounded-xl sm:rounded-2xl cursor-pointer flex flex-col justify-between transition-all ${
                    deliveryZone === "OUTSIDE_DHAKA"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs sm:text-sm text-gray-900">Outside Dhaka</span>
                    <span className="text-xs sm:text-sm font-bold text-primary">৳120</span>
                  </div>
                  <span className="text-[11px] sm:text-xs text-gray-500">3–5 Days (All 64 Districts)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Division *</label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-base sm:text-sm text-gray-900"
                >
                  <option value="Dhaka">Dhaka</option>
                  <option value="Chittagong">Chittagong</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Khulna">Khulna</option>
                  <option value="Barisal">Barisal</option>
                  <option value="Rangpur">Rangpur</option>
                  <option value="Mymensingh">Mymensingh</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">District / City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhaka, Chittagong, Sylhet"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-base sm:text-sm text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Detailed Street Address *
              </label>
              <textarea
                required
                rows={2}
                placeholder="House #, Road #, Area, Upazila/Thana"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-base sm:text-sm text-gray-900"
              />
            </div>
          </div>

          {/* Section 2: Payment Method (Rule 9: Dual Support) */}
          <div className="bg-white border rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-primary" />
              2. Payment Method
            </h2>

            <div className="space-y-3">
              <label
                onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                className={`p-4 border-2 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                  paymentMethod === "CASH_ON_DELIVERY"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-primary flex items-center justify-center font-bold">
                    ৳
                  </div>
                  <div>
                    <span className="font-bold text-sm text-gray-900 block">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-xs text-gray-500">Pay cash when you receive the parcel</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Always Available
                </span>
              </label>

              <label
                onClick={() => setPaymentMethod("STRIPE")}
                className={`p-4 border-2 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                  paymentMethod === "STRIPE"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-gray-900 block">
                      Stripe Online Payment
                    </span>
                    <span className="text-xs text-gray-500">Debit / Credit Card (Visa, MasterCard)</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Instant Checkout
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Card: Order Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border rounded-2xl p-6 space-y-5 sticky top-24">
            <h3 className="text-base font-bold text-gray-900 border-b pb-3">Order Summary</h3>

            {/* Items List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 pr-1">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="py-3 flex items-center gap-3">
                  <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 border">
                    {item.image && <Image src={item.image} alt={item.title} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-gray-900 truncate">{item.title}</h4>
                    <p className="text-[11px] text-gray-500">
                      Qty: {item.quantity} {item.attributes?.size && `• Size: ${item.attributes.size.toUpperCase()}`}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gray-900">
                    {formatBDT(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Promo Code Input or Applied Badge */}
            <div className="pt-2">
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
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Promo Code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2 text-xs font-semibold uppercase bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponInput.trim()}
                    className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
                  >
                    {isApplyingCoupon && <Loader2 className="w-3 h-3 animate-spin" />}
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 pt-2 border-t text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-900">{formatBDT(currentSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon Discount ({appliedCoupon?.code})
                  </span>
                  <span>-{formatBDT(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>
                  Delivery Charge (
                  {deliveryZone === "INSIDE_DHAKA" ? "Inside Dhaka (৳60)" : "Outside Dhaka (৳120)"})
                </span>
                <span className="font-semibold text-gray-900">{formatBDT(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-bold text-gray-900 pt-2 border-t">
                <span>Total Amount</span>
                <span className="text-primary text-base sm:text-lg font-extrabold">{formatBDT(totalAmount)}</span>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                "Processing Order..."
              ) : paymentMethod === "CASH_ON_DELIVERY" ? (
                "Confirm Cash on Delivery Order"
              ) : (
                "Proceed to Stripe Payment"
              )}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[11px] text-gray-400 text-center space-y-1">
              <p>Safe and encrypted checkout</p>
              <p>Delivery across all 64 districts in Bangladesh</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
