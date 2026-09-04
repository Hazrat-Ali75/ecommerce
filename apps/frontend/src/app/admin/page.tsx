"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatBDT } from "@/lib/currency";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  MapPin,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  deliveryZone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
  paymentMethod: "CASH_ON_DELIVERY" | "STRIPE";
  paymentStatus: string;
  orderStatus: string;
  itemsCount: number;
  createdAt: string;
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  lowStockCount: number;
  ordersByStatus: Record<string, number>;
  ordersByZone: {
    insideDhaka: number;
    outsideDhaka: number;
  };
  recentOrders: RecentOrder[];
  dailyRevenue: Array<{ date: string; revenue: number; ordersCount: number }>;
  topProducts: Array<{
    id: string;
    title: string;
    slug: string;
    brand: string;
    totalQuantitySold: number;
    totalRevenue: number;
    image: string | null;
  }>;
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<AnalyticsData>({
    queryKey: ["admin-analytics-summary"],
    queryFn: async () => {
      const res = await apiClient.get("/analytics/summary");
      return res.data;
    },
    refetchInterval: 30000, // 30s auto-refresh
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-stone-200 p-6" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-3xl border border-stone-200" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center text-rose-800 max-w-xl mx-auto space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-base font-bold font-display">Failed to load live analytics data</h3>
        <p className="text-xs text-rose-700">Please check your network connection or server status.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const maxDailyRevenue = Math.max(...data.dailyRevenue.map((d) => d.revenue), 1);
  const totalZoneOrders = (data.ordersByZone.insideDhaka + data.ordersByZone.outsideDhaka) || 1;
  const insideDhakaPct = Math.round((data.ordersByZone.insideDhaka / totalZoneOrders) * 100);
  const outsideDhakaPct = 100 - insideDhakaPct;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header bar with live indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BanglaShop Executive Control</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
            Operations & Logistics Overview
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time sales, order volume, and fulfillment metrics across all 64 districts
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 hover:border-emerald-600 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-emerald-700" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* 1. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-5 sm:p-6 shadow-card space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sales (BDT)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base shadow-xs">
              ৳
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display text-stone-900 tracking-tight">
              {formatBDT(data.totalRevenue)}
            </p>
            <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-700" />
              <span>Paid & delivered orders</span>
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-5 sm:p-6 shadow-card space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display text-stone-900 tracking-tight">
              {data.totalOrders}
            </p>
            <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-blue-600" />
              <span>{data.deliveredOrders} delivered successfully</span>
            </p>
          </div>
        </div>

        {/* Pending Action Orders */}
        <div
          className={`border rounded-3xl p-5 sm:p-6 shadow-card space-y-3 ${
            data.pendingOrders > 0
              ? "bg-amber-50/60 border-amber-200/80"
              : "bg-white border-stone-200/80"
          }`}
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Fulfillment</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display text-amber-950 tracking-tight">
              {data.pendingOrders}
            </p>
            <p className="text-[11px] text-amber-800 font-medium mt-1">
              {data.pendingOrders > 0 ? "Requires confirmation & dispatch" : "All orders up to date"}
            </p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div
          className={`border rounded-3xl p-5 sm:p-6 shadow-card space-y-3 ${
            data.lowStockCount > 0
              ? "bg-rose-50/60 border-rose-200/80"
              : "bg-white border-stone-200/80"
          }`}
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock Alert</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display text-rose-950 tracking-tight">
              {data.lowStockCount}
            </p>
            <p className="text-[11px] text-rose-800 font-medium mt-1">
              {data.lowStockCount > 0 ? "≤ 5 units remaining in stock" : "Inventory levels healthy"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. CHARTS & LOGISTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 14-Day Revenue Timeline */}
        <div className="lg:col-span-2 bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-7 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                14-Day Revenue Trend
              </h3>
              <p className="text-xs text-stone-500">Daily sales revenue in Bangladeshi Taka (৳)</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
              Last 14 Days
            </span>
          </div>

          {!data.dailyRevenue || data.dailyRevenue.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-stone-400">
              No revenue history recorded yet for the last 14 days
            </div>
          ) : (
            <div className="h-48 flex items-stretch gap-1 sm:gap-2 pt-8 pb-1">
              {data.dailyRevenue.map((d) => {
                const heightPct =
                  d.revenue > 0
                    ? Math.max(12, Math.round((d.revenue / maxDailyRevenue) * 100))
                    : 6;
                const dayLabel = d.date.split("-").slice(1).join("/");
                return (
                  <div
                    key={d.date}
                    className="h-full flex-1 flex flex-col items-center group relative min-w-0"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-[11px] py-1 px-2.5 rounded-xl pointer-events-none whitespace-nowrap z-20 shadow-xl font-medium">
                      <span className="font-bold">{d.date}:</span> {formatBDT(d.revenue)}
                      <span className="text-stone-300 ml-1 font-normal">
                        ({d.ordersCount} {d.ordersCount === 1 ? "order" : "orders"})
                      </span>
                    </div>

                    {/* Bar track */}
                    <div className="w-full flex-1 flex items-end justify-center">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                          d.revenue > 0
                            ? "bg-emerald-700 group-hover:bg-emerald-600 shadow-xs"
                            : "bg-stone-100 group-hover:bg-stone-200"
                        }`}
                      />
                    </div>

                    {/* Date Label */}
                    <span className="text-[10px] text-stone-400 group-hover:text-stone-700 font-medium truncate w-full text-center mt-2 shrink-0">
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Logistics & Delivery Distribution */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-7 shadow-card space-y-5">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
              Bangladeshi Logistics Distribution
            </h3>
            <p className="text-xs text-stone-500">Tiered delivery volume across zones</p>
          </div>

          <div className="space-y-4">
            {/* Inside Dhaka */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-stone-700">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Inside Dhaka (৳60)</span>
                </span>
                <span className="font-bold text-stone-900">
                  {data.ordersByZone.insideDhaka} orders ({insideDhakaPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-700 rounded-full"
                  style={{ width: `${insideDhakaPct}%` }}
                />
              </div>
            </div>

            {/* Outside Dhaka */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-stone-700">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Outside Dhaka (৳120)</span>
                </span>
                <span className="font-bold text-stone-900">
                  {data.ordersByZone.outsideDhaka} orders ({outsideDhakaPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${outsideDhakaPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Status Breakdown Pills */}
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Status Breakdown
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                <span className="text-stone-600">Pending</span>
                <span className="font-bold text-amber-700">{data.ordersByStatus["PENDING"] || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                <span className="text-stone-600">Confirmed</span>
                <span className="font-bold text-teal-700">{data.ordersByStatus["CONFIRMED"] || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                <span className="text-stone-600">Processing</span>
                <span className="font-bold text-blue-700">{data.ordersByStatus["PROCESSING"] || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                <span className="text-stone-600">Shipped</span>
                <span className="font-bold text-purple-700">{data.ordersByStatus["SHIPPED"] || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                <span className="text-stone-600">Delivered</span>
                <span className="font-bold text-emerald-700">{data.ordersByStatus["DELIVERED"] || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                <span className="text-stone-600">Cancelled</span>
                <span className="font-bold text-rose-700">{data.ordersByStatus["CANCELLED"] || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RECENT ORDERS & TOP PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-7 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                Recent Customer Orders
              </h3>
              <p className="text-xs text-stone-500">Latest orders placed nationwide</p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-y border-stone-100">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-stone-900">
                        <Link href="/admin/orders" className="hover:text-emerald-700">
                          {ord.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-stone-900">{ord.customerName}</p>
                        <p className="text-[11px] text-stone-500">{ord.customerPhone}</p>
                      </td>
                      <td className="py-3 px-3 text-stone-600">
                        {ord.deliveryZone === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka"}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-stone-900">
                        {formatBDT(ord.totalAmount)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.orderStatus === "DELIVERED"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : ord.orderStatus === "PENDING"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : ord.orderStatus === "CANCELLED"
                              ? "bg-rose-50 text-rose-800 border border-rose-200"
                              : "bg-blue-50 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performing Products */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-7 shadow-card space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
              Top Performing Products
            </h3>
            <p className="text-xs text-stone-500">Highest volume items</p>
          </div>

          <div className="space-y-3">
            {data.topProducts.length === 0 ? (
              <p className="py-8 text-center text-xs text-stone-400">No sales data recorded yet.</p>
            ) : (
              data.topProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-colors"
                >
                  <div className="relative w-12 h-12 rounded-xl bg-stone-50 overflow-hidden shrink-0 border border-stone-200">
                    {p.image ? (
                      <Image src={p.image} alt={p.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">{p.title}</p>
                    <p className="text-[11px] text-stone-500">
                      {p.brand} • {p.totalQuantitySold} sold
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-stone-900">{formatBDT(p.totalRevenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
