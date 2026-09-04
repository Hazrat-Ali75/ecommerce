"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatBDT } from "@/lib/currency";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

interface OrderTrackingData {
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryZone: string;
  estimatedDelivery: string;
  trackingNumber: string | null;
  createdAt: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  timeline: Array<{
    status: string;
    note: string | null;
    date: string;
  }>;
  items: Array<{
    id: string;
    title: string;
    sku: string;
    variantInfo: Record<string, string> | null;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    image: string | null;
  }>;
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [copiedConsignment, setCopiedConsignment] = useState(false);

  const urlOrderNumber = searchParams.get("orderNumber") || "";
  const [orderNumberInput, setOrderNumberInput] = useState(urlOrderNumber);
  const [phoneInput, setPhoneInput] = useState("");

  const [activeQuery, setActiveQuery] = useState({
    orderNumber: urlOrderNumber,
    phone: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      const search = window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent("/track" + search)}`);
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (urlOrderNumber) {
      setActiveQuery({ orderNumber: urlOrderNumber, phone: "" });
      setOrderNumberInput(urlOrderNumber);
    }
  }, [urlOrderNumber]);

  const { data: order, isLoading, isError, error } = useQuery<OrderTrackingData>({
    queryKey: ["track-order", activeQuery.orderNumber, activeQuery.phone],
    queryFn: async () => {
      if (!activeQuery.orderNumber) return null;
      const params = new URLSearchParams();
      params.set("orderNumber", activeQuery.orderNumber.trim());
      if (activeQuery.phone) params.set("phone", activeQuery.phone.trim());

      const res = await apiClient.get(`/orders/track?${params.toString()}`);
      return res.data;
    },
    enabled: Boolean(activeQuery.orderNumber),
    retry: false,
  });

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumberInput.trim()) {
      setActiveQuery({
        orderNumber: orderNumberInput.trim(),
        phone: phoneInput.trim(),
      });
      router.push(`/track?orderNumber=${encodeURIComponent(orderNumberInput.trim())}`);
    }
  };

  const handleCopyConsignment = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedConsignment(true);
    toast.success(`Copied courier tracking number: ${num}`);
    setTimeout(() => setCopiedConsignment(false), 2000);
  };

  const steps = [
    { label: "Ordered", status: "PENDING" },
    { label: "Confirmed", status: "CONFIRMED" },
    { label: "Processing", status: "PROCESSING" },
    { label: "Shipped", status: "SHIPPED" },
    { label: "Out for Delivery", status: "OUT_FOR_DELIVERY" },
    { label: "Delivered", status: "DELIVERED" },
  ];

  const getStepIndex = (currentStatus: string) => {
    switch (currentStatus) {
      case "PENDING":
        return 0;
      case "CONFIRMED":
        return 1;
      case "PROCESSING":
        return 2;
      case "SHIPPED":
        return 3;
      case "OUT_FOR_DELIVERY":
        return 4;
      case "DELIVERED":
        return 5;
      default:
        return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.orderStatus) : -1;
  const isCancelled = order?.orderStatus === "CANCELLED";

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-stone-600">Verifying customer credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6 sm:mb-8">
        <Link href="/" className="hover:text-emerald-700 transition-colors font-medium">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <Link href="/orders" className="hover:text-emerald-700 transition-colors font-medium">
          My Orders
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <span className="text-stone-900 font-semibold">Track Delivery</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Courier Tracking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-stone-900 tracking-tight">
          Track Your Delivery
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto">
          Enter your order reference number (e.g. BD-XXXXXX) to monitor nationwide delivery milestones
        </p>
      </div>

      {/* Tracking Input Card */}
      <form
        onSubmit={handleTrackSubmit}
        className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-7 shadow-card max-w-xl mx-auto mb-10 space-y-4"
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
            Order Reference *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="e.g. BD-XXXXXX"
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-xs sm:text-sm font-mono text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
            />
            <Package className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
            Phone Number (Optional verification)
          </label>
          <input
            type="tel"
            placeholder="01XXXXXXXXX"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="w-full px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <Search className="w-4 h-4" />
          <span>Track Order Status</span>
        </button>
      </form>

      {/* Loading */}
      {isLoading && (
        <div className="bg-stone-50 rounded-3xl p-12 text-center text-sm font-semibold text-stone-500 animate-pulse border border-stone-200">
          Fetching live courier dispatch updates...
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 sm:p-8 text-center text-rose-800 space-y-2 max-w-xl mx-auto">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-600" />
          <p className="text-sm font-bold">Unable to Locate Order</p>
          <p className="text-xs text-rose-700 leading-relaxed">
            {getFriendlyErrorMessage(
              error,
              "We couldn't find an order matching that reference. Please verify your order number or phone number and try again."
            )}
          </p>
        </div>
      )}

      {/* Results View */}
      {order && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
          {/* Order Header Summary Card */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-7 shadow-card flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-0.5">
                Tracking Order
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-mono text-stone-900">
                {order.orderNumber}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleDateString("en-BD", { dateStyle: "medium" })}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-stone-500 font-semibold block">Total Amount</span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-800">
                {formatBDT(order.totalAmount)}
              </span>
              <span className="text-[11px] block font-bold text-stone-600 capitalize mt-0.5">
                {order.paymentMethod.replace(/_/g, " ")} ({order.paymentStatus})
              </span>
            </div>
          </div>

          {/* Delivery Window & Courier Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-950 font-medium">
              <Truck className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>{order.estimatedDelivery}</span>
            </div>
            {order.trackingNumber && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs">
                <span className="text-stone-500 font-medium text-[11px]">Courier Tracking:</span>
                <strong className="font-mono text-stone-900 text-xs">{order.trackingNumber}</strong>
                <button
                  type="button"
                  onClick={() => handleCopyConsignment(order.trackingNumber!)}
                  className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-emerald-700 transition-colors"
                  title="Copy courier ID"
                >
                  {copiedConsignment ? (
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Progress Stepper */}
          {!isCancelled ? (
            <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-card space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
                Delivery Milestones & Timeline
              </h3>

              {/* Desktop Stepper */}
              <div className="hidden sm:flex relative items-center justify-between pt-3 pb-2">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-stone-200 w-full z-0" />
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-700 z-0 transition-all duration-500"
                  style={{ width: `${(Math.max(0, currentStep) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={step.status} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? "bg-emerald-700 text-white ring-4 ring-emerald-700/20 shadow-md scale-105"
                            : "bg-white border-2 border-stone-300 text-stone-400"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[11px] mt-2.5 font-bold text-center ${
                          isCurrent
                            ? "text-emerald-800 font-extrabold"
                            : isDone
                            ? "text-stone-900"
                            : "text-stone-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Stepper */}
              <div className="sm:hidden space-y-4 pt-1">
                {steps.map((step, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={step.status} className="flex items-start gap-3 relative">
                      {idx !== steps.length - 1 && (
                        <div
                          className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-px ${
                            idx < currentStep ? "bg-emerald-700" : "bg-stone-200"
                          }`}
                        />
                      )}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-all ${
                          isDone
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "bg-white border-2 border-stone-300 text-stone-400"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className="pt-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold ${
                              isCurrent ? "text-emerald-800 font-extrabold" : isDone ? "text-stone-900" : "text-stone-400"
                            }`}
                          >
                            {step.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-pulse">
                              Current Status
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center text-rose-800 text-xs font-bold">
              This order was cancelled. Please reach out to BanglaShop customer service if you need support.
            </div>
          )}

          {/* Itemized Order Items */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-7 shadow-card space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
              Order Items ({order.items.length})
            </h3>

            <div className="divide-y divide-stone-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center gap-4">
                  <div className="relative w-14 h-14 bg-stone-50 rounded-xl overflow-hidden shrink-0 border border-stone-200">
                    {item.image && <Image src={item.image} alt={item.title} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">{item.title}</h4>
                    <p className="text-[11px] text-stone-400 font-mono">SKU: {item.sku}</p>
                    {item.variantInfo?.size && (
                      <span className="inline-block mt-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md uppercase">
                        Size: {item.variantInfo.size.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-extrabold text-stone-900 block">{formatBDT(item.totalPrice)}</span>
                    <span className="text-stone-400">Qty: {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-stone-900">{formatBDT(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>
                  Delivery Charge ({order.deliveryZone === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka"})
                </span>
                <span className="font-bold text-stone-900">{formatBDT(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                <span>Total Amount</span>
                <span className="text-emerald-800 font-extrabold">{formatBDT(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto p-16 text-center text-sm font-semibold text-stone-500">
          Loading tracker...
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
