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
} from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/store/auth-store";

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
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-600">Verifying customer credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
          Track Your Order
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Enter your order number (e.g. BD-260903-XXXX) to view live delivery progress
        </p>
      </div>

      {/* Tracking Search Input Card */}
      <form
        onSubmit={handleTrackSubmit}
        className="bg-white border rounded-2xl p-6 shadow-xs max-w-xl mx-auto mb-10 space-y-4"
      >
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Order Number *</label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="e.g. BD-260903-XXXX"
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm font-mono text-gray-900 pl-10 focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
            <Package className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Mobile Number (Optional verification)
          </label>
          <input
            type="tel"
            placeholder="01XXXXXXXXX (11 digits)"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          Track Order Status
        </button>
      </form>

      {/* Results View */}
      {isLoading && (
        <div className="animate-pulse bg-gray-50 rounded-2xl p-12 text-center text-sm text-gray-500">
          Fetching live tracking information...
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center text-red-700 space-y-2 max-w-xl mx-auto">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
          <p className="text-sm font-bold">Unable to Locate Order</p>
          <p className="text-xs text-red-600">
            {getFriendlyErrorMessage(
              error,
              "We couldn't find an order matching that number. Please check your order number and phone number."
            )}
          </p>
        </div>
      )}

      {order && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Order Header Summary */}
          <div className="bg-white border rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-gray-500 font-semibold">Tracking Order</span>
              <h2 className="text-base sm:text-lg font-bold font-mono text-gray-900">{order.orderNumber}</h2>
              <p className="text-xs text-gray-500">
                Placed on {new Date(order.createdAt).toLocaleDateString("en-BD", { dateStyle: "medium" })}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-gray-500 font-semibold block">Total Amount</span>
              <span className="text-base sm:text-lg font-bold text-primary">{formatBDT(order.totalAmount)}</span>
              <span className="text-[11px] block font-bold text-gray-600 capitalize">
                {order.paymentMethod.replace(/_/g, " ")} ({order.paymentStatus})
              </span>
            </div>
          </div>

          {/* Delivery Window & Status Banner */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-semibold">
              <Truck className="w-4 h-4 text-primary shrink-0" />
              <span>{order.estimatedDelivery}</span>
            </div>
            {order.trackingNumber && (
              <div className="bg-white px-3 py-1 rounded-lg border text-gray-700 font-mono text-xs">
                Courier Tracking: <strong>{order.trackingNumber}</strong>
              </div>
            )}
          </div>

          {/* Responsive Stepper Timeline (Horizontal on desktop, Vertical on mobile) */}
          {!isCancelled ? (
            <div className="bg-white border rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-3">
                Delivery Milestones & Progress
              </h3>

              {/* Desktop Horizontal Stepper */}
              <div className="hidden sm:flex relative items-center justify-between pt-2">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 w-full z-0" />
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-500"
                  style={{ width: `${(Math.max(0, currentStep) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={step.status} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? "bg-primary text-white ring-4 ring-primary/20 shadow-md"
                            : "bg-white border-2 border-gray-300 text-gray-400"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[11px] mt-2 font-bold text-center ${
                          isCurrent ? "text-primary font-extrabold" : isDone ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Vertical Stepper */}
              <div className="sm:hidden space-y-4 pt-2">
                {steps.map((step, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={step.status} className="flex items-start gap-3 relative">
                      {idx !== steps.length - 1 && (
                        <div
                          className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-px ${
                            idx < currentStep ? "bg-primary" : "bg-gray-200"
                          }`}
                        />
                      )}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-all ${
                          isDone
                            ? "bg-primary text-white shadow-xs"
                            : "bg-white border-2 border-gray-300 text-gray-400"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className="pt-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold ${
                              isCurrent ? "text-primary font-extrabold text-sm" : isDone ? "text-gray-900" : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary animate-pulse">
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
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center text-red-700 text-xs font-bold">
              This order has been CANCELLED.
            </div>
          )}

          {/* Itemized Order Items */}
          <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-3">
              Order Items ({order.items.length})
            </h3>

            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-4">
                  <div className="relative w-14 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0 border">
                    {item.image && <Image src={item.image} alt={item.title} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900">{item.title}</h4>
                    <p className="text-[11px] text-gray-500 font-mono">SKU: {item.sku}</p>
                    {item.variantInfo?.size && (
                      <span className="inline-block mt-0.5 text-[10px] font-bold bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                        Size: {item.variantInfo.size.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold text-gray-900 block">{formatBDT(item.totalPrice)}</span>
                    <span className="text-gray-400">Qty: {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Items Subtotal</span>
                <span className="font-bold text-gray-900">{formatBDT(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>
                  Delivery Charge ({order.deliveryZone === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka"})
                </span>
                <span className="font-bold text-gray-900">{formatBDT(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-bold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span className="text-primary font-bold">{formatBDT(order.totalAmount)}</span>
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
    <Suspense fallback={<div className="max-w-4xl mx-auto p-12 text-center">Loading tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
