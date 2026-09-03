"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, ArrowRight, Truck } from "lucide-react";
import { Suspense } from "react";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "BD-XXXXXX";

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">
        Order Confirmed
      </span>

      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 tracking-tight">
        Thank you for your order!
      </h1>

      <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto">
        Your order has been recorded. We have sent a confirmation email with all details and tracking updates.
      </p>

      <div className="bg-gray-50 border rounded-2xl p-6 mb-8 text-left space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <span className="text-xs text-gray-500 font-semibold">Order Number</span>
          <span className="font-mono text-sm font-black text-primary">{orderNumber}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600">
          <Truck className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong>Delivery Window:</strong> Inside Dhaka (24–48 hours) • Outside Dhaka (3–5 days across 64 districts)
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href={`/track?orderNumber=${orderNumber}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
        >
          Track This Order
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/shop"
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto p-12 text-center">Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
