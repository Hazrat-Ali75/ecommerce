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
  Lock,
  ChevronRight,
  Sparkles,
  MapPin,
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
  const { user, isAuthenticated, isLoading, hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !hasHydrated) return;

    if (!isLoading && !isAuthenticated) {
      toast.info("Please sign in to proceed with checkout");
      router.push("/login?redirect=/checkout");
    }
  }, [isAuthenticated, isLoading, mounted, hasHydrated, router]);

  useEffect(() => {
    if (user) {
      if (!fullName && user.name) setFullName(user.name);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user, fullName, email, phone]);

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
      toast.error("Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678)");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!streetAddress.trim() || streetAddress.trim().length < 5) {
      toast.error("Please provide a detailed street address (House, Road, Area)");
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

      // Clear local cart state
      clearCart();

      if (paymentMethod === "CASH_ON_DELIVERY") {
        toast.success(`Order ${createdOrder.orderNumber} placed successfully!`);
        router.push(`/order-success?orderNumber=${createdOrder.orderNumber}`);
      } else if (paymentMethod === "STRIPE") {
        toast.loading("Redirecting to secure Stripe Checkout...");
        const frontendUrl =
          typeof window !== "undefined" ? window.location.origin : undefined;
        const stripeRes = await apiClient.post(
          `/payments/stripe/create-session/${createdOrder.id}`,
          { frontendUrl }
        );
        if (stripeRes.data?.checkoutUrl) {
          window.location.href = stripeRes.data.checkoutUrl;
        } else {
          router.push(`/order-success?orderNumber=${createdOrder.orderNumber}`);
        }
      }
    } catch (err: unknown) {
      toast.error(
        getFriendlyErrorMessage(
          err,
          "We couldn't complete your order. Please check your delivery information and try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !hasHydrated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mx-auto mb-3" />
        <p className="text-xs sm:text-sm text-stone-500">Preparing secure checkout...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-700 shadow-xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 mb-3">
          Your Shopping Cart is Empty
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mb-8 leading-relaxed">
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-700/20"
        >
          <span>Browse Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6 sm:mb-8">
        <Link href="/" className="hover:text-emerald-700 transition-colors font-medium">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <Link href="/cart" className="hover:text-emerald-700 transition-colors font-medium">
          Cart
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <span className="text-stone-900 font-semibold">Checkout</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-stone-900 tracking-tight">
            Express & Secure Checkout
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Fast delivery across all 64 districts with Cash on Delivery & Stripe card options
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* ========================================================================= */}
        {/* LEFT FORM: SHIPPING & DELIVERY & PAYMENT (7 cols)                         */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          {/* Section 1: Customer & Delivery Address */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-card">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h2 className="text-base sm:text-lg font-display font-bold text-stone-900 flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-emerald-700" />
                <span>1. Bangladeshi Delivery Address</span>
              </h2>
              <span className="text-xs text-stone-400 font-medium">Step 1 of 2</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Bangladeshi Mobile Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
                  />
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block">
                  11 digits starting with 013 to 019
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com (for order updates & digital receipt)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
              />
            </div>

            {/* RULE 7: TIERED DELIVERY ZONE SELECTION */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Delivery Logistics Zone *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setDeliveryZone("INSIDE_DHAKA")}
                  className={`p-4 sm:p-5 border-2 rounded-2xl text-left flex flex-col justify-between transition-all ${
                    deliveryZone === "INSIDE_DHAKA"
                      ? "border-emerald-700 bg-emerald-50/70 shadow-md shadow-emerald-700/5"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs sm:text-sm text-stone-900">
                      Inside Dhaka (Capital)
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                      ৳60 Flat
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-emerald-700" />
                    Estimated 24–48 Hours
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryZone("OUTSIDE_DHAKA")}
                  className={`p-4 sm:p-5 border-2 rounded-2xl text-left flex flex-col justify-between transition-all ${
                    deliveryZone === "OUTSIDE_DHAKA"
                      ? "border-emerald-700 bg-emerald-50/70 shadow-md shadow-emerald-700/5"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs sm:text-sm text-stone-900">
                      Outside Dhaka (Nationwide)
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                      ৳120 Flat
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-emerald-700" />
                    3–5 Days (All 64 Districts)
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Division *
                </label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  District / City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhaka, Gazipur, Sylhet"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Detailed Street Address *
              </label>
              <textarea
                required
                rows={2}
                placeholder="House / Flat #, Road #, Area / Thana, Landmark"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Delivery Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Call before delivery, leave with reception"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
              />
            </div>
          </div>

          {/* Section 2: Payment Method (Rule 9: COD & Stripe) */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-card">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h2 className="text-base sm:text-lg font-display font-bold text-stone-900 flex items-center gap-2.5">
                <Banknote className="w-5 h-5 text-emerald-700" />
                <span>2. Payment Option</span>
              </h2>
              <span className="text-xs text-stone-400 font-medium">Step 2 of 2</span>
            </div>

            <div className="space-y-3">
              {/* Cash on Delivery */}
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                className={`w-full p-4 sm:p-5 border-2 rounded-2xl cursor-pointer flex items-center justify-between transition-all text-left ${
                  paymentMethod === "CASH_ON_DELIVERY"
                    ? "border-emerald-700 bg-emerald-50/70 shadow-md shadow-emerald-700/5"
                    : "border-stone-200 hover:border-stone-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg shrink-0">
                    ৳
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-stone-900 block">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-xs text-stone-500">
                      Pay cash to delivery rider when parcel reaches your doorstep
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-full shrink-0">
                  Available Nationwide
                </span>
              </button>

              {/* Stripe Online Card */}
              <button
                type="button"
                onClick={() => setPaymentMethod("STRIPE")}
                className={`w-full p-4 sm:p-5 border-2 rounded-2xl cursor-pointer flex items-center justify-between transition-all text-left ${
                  paymentMethod === "STRIPE"
                    ? "border-emerald-700 bg-emerald-50/70 shadow-md shadow-emerald-700/5"
                    : "border-stone-200 hover:border-stone-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-stone-900 block">
                      Stripe Online Card Payment
                    </span>
                    <span className="text-xs text-stone-500">
                      Debit / Credit Card (Visa, MasterCard, American Express)
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full shrink-0">
                  Instant Confirmation
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT CARD: ORDER SUMMARY (5 cols)                                        */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-stone-50/80 border border-stone-200/80 rounded-3xl p-6 sm:p-7 space-y-5 sticky top-24 shadow-card">
            <h3 className="text-base font-bold uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-semibold text-stone-500 lowercase">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </h3>

            {/* Cart Items List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-stone-200/60 pr-1 scrollbar-thin">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="py-3.5 flex items-center gap-3">
                  <div className="relative w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 border border-stone-200">
                    {item.image && (
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 truncate">{item.title}</h4>
                    <p className="text-[11px] text-stone-500">
                      Qty: {item.quantity} {item.attributes?.size && `• Size: ${item.attributes.size.toUpperCase()}`}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-stone-900">
                    {formatBDT(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Promo Code Input or Active Badge */}
            <div className="pt-1">
              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                <div className="flex gap-2">
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
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponInput.trim()}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
                  >
                    {isApplyingCoupon && <Loader2 className="w-3 h-3 animate-spin" />}
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 pt-3 border-t border-stone-200 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-stone-900">{formatBDT(currentSubtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon Savings ({appliedCoupon?.code})
                  </span>
                  <span>-{formatBDT(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>
                  Delivery Fee (
                  {deliveryZone === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka"})
                </span>
                <span className="font-bold text-stone-900">{formatBDT(deliveryFee)}</span>
              </div>

              <div className="flex justify-between text-sm sm:text-base font-bold text-stone-900 pt-3 border-t border-stone-200">
                <span>Total Payable</span>
                <span className="text-emerald-800 text-xl font-extrabold">
                  {formatBDT(totalAmount)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-700 text-white font-bold text-sm sm:text-base hover:bg-emerald-800 disabled:opacity-50 transition-all shadow-lg shadow-emerald-700/20 active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : paymentMethod === "CASH_ON_DELIVERY" ? (
                <>
                  <Truck className="w-5 h-5" />
                  <span>Confirm COD Order • {formatBDT(totalAmount)}</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Pay with Stripe • {formatBDT(totalAmount)}</span>
                </>
              )}
            </button>

            <div className="pt-2 text-[11px] text-stone-500 text-center space-y-1">
              <p className="flex items-center justify-center gap-1.5 font-medium text-stone-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                BanglaShop Authentic Product & Payment Guarantee
              </p>
              <p>Delivery across 64 districts • 7-day hassle-free returns</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
