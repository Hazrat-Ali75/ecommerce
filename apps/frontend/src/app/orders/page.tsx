"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";
import { formatBDT } from "@/lib/currency";
import { useAuthStore } from "@/store/auth-store";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  ShoppingBag,
  CreditCard,
  Banknote,
  Search,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface OrderItemProduct {
  slug?: string;
  images: Array<{ url: string }>;
}

interface OrderItemData {
  id: string;
  productId: string;
  variantId?: string | null;
  productTitleSnapshot: string;
  variantInfoSnapshot?: Record<string, string> | null;
  skuSnapshot: string;
  unitPrice: number | string;
  quantity: number;
  totalPrice: number | string;
  product?: OrderItemProduct | null;
}

interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryZone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district?: string;
    notes?: string;
  };
  subtotal: number | string;
  deliveryFee: number | string;
  discount: number | string;
  totalAmount: number | string;
  paymentMethod: "CASH_ON_DELIVERY" | "STRIPE";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  orderStatus:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "RETURNED";
  trackingNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  items: OrderItemData[];
  statusHistory?: Array<{
    status: string;
    note?: string | null;
    createdAt: string;
  }>;
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace("/login?redirect=/orders");
    }
  }, [mounted, isAuthenticated, router]);

  const { data: orders = [], isLoading, isError, refetch } = useQuery<CustomerOrder[]>({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const res = await apiClient.get("/orders/my-orders");
      return res.data;
    },
    enabled: mounted && isAuthenticated,
  });

  const handleCopyOrderNumber = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedNumber(orderNumber);
    toast.success(`Copied ${orderNumber} to clipboard!`);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-600">Loading your account orders...</p>
        </div>
      </div>
    );
  }

  // Filter orders by status and search keywords
  const filteredOrders = orders.filter((ord) => {
    if (statusFilter === "ACTIVE") {
      if (["DELIVERED", "CANCELLED", "RETURNED"].includes(ord.orderStatus)) return false;
    } else if (statusFilter === "DELIVERED") {
      if (ord.orderStatus !== "DELIVERED") return false;
    } else if (statusFilter === "CANCELLED") {
      if (ord.orderStatus !== "CANCELLED") return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchNumber = ord.orderNumber.toLowerCase().includes(query);
      const matchItem = ord.items.some((i) =>
        i.productTitleSnapshot.toLowerCase().includes(query)
      );
      const matchCourier = ord.trackingNumber?.toLowerCase().includes(query);
      return matchNumber || matchItem || matchCourier;
    }

    return true;
  });

  const getStatusBadge = (status: CustomerOrder["orderStatus"]) => {
    switch (status) {
      case "DELIVERED":
        return {
          label: "Delivered",
          icon: CheckCircle2,
          className: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      case "SHIPPED":
        return {
          label: "Shipped",
          icon: Truck,
          className: "bg-purple-50 text-purple-800 border-purple-200",
        };
      case "OUT_FOR_DELIVERY":
        return {
          label: "Out for Delivery",
          icon: Truck,
          className: "bg-indigo-50 text-indigo-800 border-indigo-200",
        };
      case "PROCESSING":
        return {
          label: "Processing Hub",
          icon: Package,
          className: "bg-blue-50 text-blue-800 border-blue-200",
        };
      case "CONFIRMED":
        return {
          label: "Confirmed",
          icon: CheckCircle2,
          className: "bg-sky-50 text-sky-800 border-sky-200",
        };
      case "PENDING":
        return {
          label: "Pending Verification",
          icon: Clock,
          className: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          icon: XCircle,
          className: "bg-red-50 text-red-800 border-red-200",
        };
      case "RETURNED":
        return {
          label: "Returned",
          icon: RotateCcw,
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
      default:
        return {
          label: status,
          icon: Clock,
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white border rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
                  My Orders
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  {orders.length} Total
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Logged in as <span className="font-semibold text-gray-800">{user?.name}</span> ({user?.email})
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/track"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs sm:text-sm font-bold transition-colors"
              >
                <Truck className="w-4 h-4 text-primary" />
                <span>Track Order Status</span>
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t">
            <div className="bg-gray-50 rounded-2xl p-3 border">
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Placed</p>
              <p className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">{orders.length}</p>
            </div>
            <div className="bg-blue-50/60 rounded-2xl p-3 border border-blue-100">
              <p className="text-[10px] sm:text-[11px] font-bold text-blue-700 uppercase tracking-wider">Active In-Transit</p>
              <p className="text-base sm:text-lg font-bold text-blue-900 mt-0.5">
                {orders.filter((o) => ["CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY"].includes(o.orderStatus)).length}
              </p>
            </div>
            <div className="bg-emerald-50/60 rounded-2xl p-3 border border-emerald-100">
              <p className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Delivered</p>
              <p className="text-base sm:text-lg font-bold text-emerald-900 mt-0.5">
                {orders.filter((o) => o.orderStatus === "DELIVERED").length}
              </p>
            </div>
            <div className="bg-amber-50/60 rounded-2xl p-3 border border-amber-100">
              <p className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending</p>
              <p className="text-base sm:text-lg font-bold text-amber-900 mt-0.5">
                {orders.filter((o) => o.orderStatus === "PENDING").length}
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white border rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { key: "ALL", label: "All Orders" },
              { key: "ACTIVE", label: "Active Deliveries" },
              { key: "DELIVERED", label: "Delivered" },
              { key: "CANCELLED", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  statusFilter === tab.key
                    ? "bg-primary text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order ID or item..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border rounded-xl text-xs focus:bg-white focus:outline-primary transition-colors"
            />
          </div>
        </div>

        {/* Orders Listing */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-white rounded-3xl border animate-pulse p-6" />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-white border rounded-3xl p-12 text-center space-y-3">
            <p className="text-sm font-bold text-red-600">Failed to load order history</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border rounded-3xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-base font-bold text-gray-900">
                {searchQuery || statusFilter !== "ALL" ? "No matching orders" : "No orders yet"}
              </h3>
              <p className="text-xs text-gray-500">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your search terms or filter selection."
                  : "You haven't placed any orders yet. Discover authentic Bangladeshi lifestyle products today!"}
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((ord) => {
              const statusCfg = getStatusBadge(ord.orderStatus);
              const StatusIcon = statusCfg.icon;
              const isExpanded = expandedOrders[ord.id];

              return (
                <div
                  key={ord.id}
                  className="bg-white border rounded-3xl shadow-xs overflow-hidden transition-all hover:border-gray-300"
                >
                  {/* Top Bar of Order Card */}
                  <div className="p-4 sm:p-6 bg-gray-50/70 border-b flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Order Number & Copy */}
                      <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border">
                        <span className="text-[11px] font-bold text-gray-400 uppercase">Order</span>
                        <span className="font-mono font-bold text-xs sm:text-sm text-gray-900">
                          {ord.orderNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyOrderNumber(ord.orderNumber)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-900 transition-colors"
                          title="Copy Order ID"
                        >
                          {copiedNumber === ord.orderNumber ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Date Placed */}
                      <span className="text-xs text-gray-500">
                        {new Date(ord.createdAt).toLocaleString("en-BD", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    {/* Status Pill & Tracking CTA */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.className}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusCfg.label}</span>
                      </span>

                      {/* Direct Live Track Button */}
                      <Link
                        href={`/track?orderNumber=${encodeURIComponent(
                          ord.orderNumber
                        )}&phone=${encodeURIComponent(ord.customerPhone)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Delivery</span>
                      </Link>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="divide-y">
                      {ord.items.map((item) => {
                        const imgUrl = item.product?.images?.[0]?.url;
                        const attributes = item.variantInfoSnapshot || {};

                        return (
                          <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border">
                                {imgUrl ? (
                                  <Image
                                    src={imgUrl}
                                    alt={item.productTitleSnapshot}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Package className="w-6 h-6" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                  {item.productTitleSnapshot}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  {attributes.size && (
                                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                                      Size: {attributes.size}
                                    </span>
                                  )}
                                  {attributes.gender && (
                                    <span className="text-[10px] capitalize font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                      {attributes.gender}
                                    </span>
                                  )}
                                  {attributes.type && (
                                    <span className="text-[10px] capitalize font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                      {attributes.type}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-mono text-gray-400">
                                    SKU: {item.skuSnapshot}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-xs sm:text-sm font-bold text-gray-900">
                                {formatBDT(Number(item.totalPrice))}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium">
                                {item.quantity} × {formatBDT(Number(item.unitPrice))}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Expandable Order Details (Logistics, Courier, Address) */}
                    {isExpanded && (
                      <div className="pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50/50 p-4 rounded-2xl animate-in fade-in duration-200">
                        {/* Shipping Destination */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-gray-800">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span>Delivery Destination</span>
                          </div>
                          <p className="text-gray-700 font-semibold">{ord.shippingAddress?.fullName}</p>
                          <p className="text-gray-500 font-mono">{ord.shippingAddress?.phone}</p>
                          <p className="text-gray-600">{ord.shippingAddress?.address}</p>
                          <p className="text-gray-500 font-medium">
                            {ord.shippingAddress?.city}
                            {ord.shippingAddress?.district ? `, ${ord.shippingAddress.district}` : ""}
                          </p>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                              ord.deliveryZone === "INSIDE_DHAKA"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-blue-50 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {ord.deliveryZone === "INSIDE_DHAKA"
                              ? "Inside Dhaka (৳60 • 24–48h)"
                              : "Outside Dhaka (৳120 • 3–5 Days across 64 districts)"}
                          </span>
                        </div>

                        {/* Payment & Courier Info */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-gray-800">
                            <CreditCard className="w-3.5 h-3.5 text-primary" />
                            <span>Payment & Logistics Info</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Method:</span>
                            <span className="font-bold text-gray-800">
                              {ord.paymentMethod === "CASH_ON_DELIVERY"
                                ? "Cash on Delivery (COD)"
                                : "Stripe Online Payment"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Payment Status:</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ord.paymentStatus === "PAID"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {ord.paymentStatus}
                            </span>
                          </div>

                          {/* Courier Tracking */}
                          {ord.trackingNumber ? (
                            <div className="pt-2">
                              <p className="text-[10px] uppercase font-bold text-gray-400">
                                Courier Consignment Number
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono font-bold text-gray-900 bg-white px-2 py-1 rounded border">
                                  {ord.trackingNumber}
                                </span>
                                <Link
                                  href={`/track?orderNumber=${encodeURIComponent(ord.orderNumber)}`}
                                  className="text-[11px] font-bold text-primary hover:underline"
                                >
                                  View Milestones →
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-400 pt-2 italic">
                              Courier consignment tracking ID will be assigned upon dispatch.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bottom Totals & Expand Toggle */}
                    <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleExpand(ord.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        <span>{isExpanded ? "Hide Details" : "View Full Details"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Total Amount</p>
                          <p className="text-base sm:text-lg font-bold text-gray-900">
                            {formatBDT(Number(ord.totalAmount))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
