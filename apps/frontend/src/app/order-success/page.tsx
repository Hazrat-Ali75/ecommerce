"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Truck,
  Copy,
  Check,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "BD-XXXXXX";
  const [copied, setCopied] = useState(false);

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    toast.success(`Copied order number ${orderNumber} to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
      {/* Success Animated Badge */}
      <div className="w-20 h-20 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs border border-emerald-100 animate-in zoom-in-50 duration-300">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>BanglaShop Order Confirmed</span>
      </div>

      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-stone-900 mb-3 tracking-tight">
        Thank you for your order!
      </h1>

      <p className="text-xs sm:text-sm text-stone-500 mb-8 max-w-md mx-auto leading-relaxed">
        Your order has been safely placed. We have dispatched a confirmation email and SMS with all tracking details.
      </p>

      {/* Order Info Card */}
      <div className="bg-stone-50/80 border border-stone-200/80 rounded-3xl p-6 sm:p-7 mb-8 text-left space-y-4 shadow-card">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <span className="text-xs text-stone-500 font-semibold block">Order Reference</span>
            <span className="font-mono text-base sm:text-lg font-extrabold text-stone-900">
              {orderNumber}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyOrderNumber}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:border-emerald-600 rounded-xl text-xs font-bold text-stone-700 transition-colors shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-400" />
                <span>Copy ID</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-start gap-3 text-xs text-stone-600 pt-1">
          <Truck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-stone-900 block">Bangladeshi Delivery Windows:</span>
            <span>
              <strong>Inside Dhaka:</strong> Flat ৳60 (24–48 hours) •{" "}
              <strong>Outside Dhaka:</strong> Flat ৳120 (3–5 days across 64 districts)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-stone-200 text-[11px] text-stone-500">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Cash on Delivery riders accept cash payment upon physical parcel inspection.</span>
        </div>
      </div>

      {/* Action CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
        <Link
          href={`/track?orderNumber=${encodeURIComponent(orderNumber)}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-700/20 active:scale-[0.99]"
        >
          <Package className="w-4 h-4" />
          <span>Track Live Progress</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/shop"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-stone-200 hover:bg-stone-50 text-xs font-bold uppercase tracking-wider text-stone-800 rounded-2xl transition-colors shadow-xs"
        >
          <ShoppingBag className="w-4 h-4 text-stone-500" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto p-16 text-center text-sm font-semibold text-stone-500">
          Loading order confirmation...
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
