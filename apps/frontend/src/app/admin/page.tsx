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
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border p-6 animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border animate-pulse" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-700 max-w-xl mx-auto space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="text-base font-bold">Failed to load live analytics data</h3>
        <p className="text-xs text-red-600">Please check your network connection or server status.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700"
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
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">Operations Overview</h2>
          <p className="text-xs text-gray-500">Live operational data and order metrics across Bangladesh</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 1. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ৳
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {formatBDT(data.totalRevenue)}
            </p>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Paid & delivered orders</span>
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {data.totalOrders}
            </p>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-blue-600" />
              <span>{data.deliveredOrders} fulfilled successfully</span>
            </p>
          </div>
        </div>

        {/* Pending Action Orders */}
        <div className={`border rounded-2xl p-5 shadow-xs space-y-3 ${
          data.pendingOrders > 0 ? "bg-amber-50/50 border-amber-200" : "bg-white"
        }`}>
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-amber-900 tracking-tight">
              {data.pendingOrders}
            </p>
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              {data.pendingOrders > 0 ? "Requires confirmation & dispatch" : "All orders up to date"}
            </p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className={`border rounded-2xl p-5 shadow-xs space-y-3 ${
          data.lowStockCount > 0 ? "bg-red-50/50 border-red-200" : "bg-white"
        }`}>
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock Variants</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-red-900 tracking-tight">
              {data.lowStockCount}
            </p>
            <p className="text-[11px] text-red-700 font-medium mt-1">
              {data.lowStockCount > 0 ? "≤ 5 items remaining in stock" : "Inventory levels healthy"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. CHARTS & LOGISTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 14-Day Revenue Timeline */}
        <div className="lg:col-span-2 bg-white border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">14-Day Revenue Trend</h3>
              <p className="text-xs text-gray-500">Daily sales revenue in Bangladeshi Taka (৳)</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Last 14 Days
            </span>
          </div>

          <div className="h-44 flex items-end gap-1.5 pt-4">
            {data.dailyRevenue.map((d) => {
              const heightPct = Math.max(8, Math.round((d.revenue / maxDailyRevenue) * 100));
              const dayLabel = d.date.split("-").slice(1).join("/");
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                    {d.date}: {formatBDT(d.revenue)} ({d.ordersCount} orders)
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-md transition-all ${
                      d.revenue > 0 ? "bg-emerald-600 group-hover:bg-emerald-500" : "bg-gray-100"
                    }`}
                  />
                  <span className="text-[9px] text-gray-400 truncate w-full text-center">
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Logistics & Delivery Distribution */}
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Bangladeshi Logistics Distribution</h3>
            <p className="text-xs text-gray-500">Tiered delivery volume across zones</p>
          </div>

          <div className="space-y-4">
            {/* Inside Dhaka */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Inside Dhaka (৳60)
                </span>
                <span className="font-bold text-gray-900">{data.ordersByZone.insideDhaka} orders ({insideDhakaPct}%)</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${insideDhakaPct}%` }}
                />
              </div>
            </div>

            {/* Outside Dhaka */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-gray-700">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  Outside Dhaka (৳120)
                </span>
                <span className="font-bold text-gray-900">{data.ordersByZone.outsideDhaka} orders ({outsideDhakaPct}%)</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${outsideDhakaPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Status Breakdown Pills */}
          <div className="pt-2 border-t space-y-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status Breakdown</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-gray-50 flex items-center justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-bold text-amber-700">{data.ordersByStatus["PENDING"] || 0}</span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 flex items-center justify-between">
                <span className="text-gray-600">Confirmed</span>
                <span className="font-bold text-blue-700">{data.ordersByStatus["CONFIRMED"] || 0}</span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 flex items-center justify-between">
                <span className="text-gray-600">Processing</span>
                <span className="font-bold text-purple-700">{data.ordersByStatus["PROCESSING"] || 0}</span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 flex items-center justify-between">
                <span className="text-gray-600">Shipped</span>
                <span className="font-bold text-indigo-700">{data.ordersByStatus["SHIPPED"] || 0}</span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 flex items-center justify-between">
                <span className="text-gray-600">Delivered</span>
                <span className="font-bold text-emerald-700">{data.ordersByStatus["DELIVERED"] || 0}</span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 flex items-center justify-between">
                <span className="text-gray-600">Cancelled</span>
                <span className="font-bold text-red-700">{data.ordersByStatus["CANCELLED"] || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RECENT ORDERS & TOP PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recent Customer Orders</h3>
              <p className="text-xs text-gray-500">Latest orders placed across Bangladesh</p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-y">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-gray-900">
                        <Link href="/admin/orders" className="hover:text-primary">
                          {ord.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-gray-900">{ord.customerName}</p>
                        <p className="text-[11px] text-gray-500">{ord.customerPhone}</p>
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {ord.deliveryZone === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka"}
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-900">
                        {formatBDT(ord.totalAmount)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.orderStatus === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.orderStatus === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : ord.orderStatus === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
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

        {/* Top Selling Products */}
        <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Top Performing Products</h3>
            <p className="text-xs text-gray-500">Highest volume items</p>
          </div>

          <div className="space-y-3">
            {data.topProducts.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">No sales data yet.</p>
            ) : (
              data.topProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="relative w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border">
                    {p.image ? (
                      <Image src={p.image} alt={p.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{p.title}</p>
                    <p className="text-[11px] text-gray-500">{p.brand} • {p.totalQuantitySold} sold</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-gray-900">{formatBDT(p.totalRevenue)}</p>
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
