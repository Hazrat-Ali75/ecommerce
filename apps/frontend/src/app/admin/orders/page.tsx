"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatBDT } from "@/lib/currency";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import {
  Search,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  XCircle,
  RotateCcw,
  Edit,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { AdminModal } from "@/components/ui/admin-modal";

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryZone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
  shippingAddress: {
    streetAddress: string;
    division: string;
    district: string;
    postalCode?: string;
  };
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
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
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
  _count?: { items: number };
}

interface AdminOrdersResponse {
  orders: AdminOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ALL_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Status Update Modal State
  const [activeOrder, setActiveOrder] = useState<AdminOrder | null>(null);
  const [newStatus, setNewStatus] = useState<string>("CONFIRMED");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const { data, isLoading, isError, refetch } = useQuery<AdminOrdersResponse>({
    queryKey: ["admin-orders", page, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await apiClient.get(`/orders/admin/all?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 20000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      trackingNumber,
      note,
    }: {
      id: string;
      status: string;
      trackingNumber?: string;
      note?: string;
    }) => {
      await apiClient.patch(`/orders/admin/${id}/status`, {
        status,
        trackingNumber: trackingNumber?.trim() || undefined,
        note: note?.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Order status and courier details updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics-summary"] });
      setActiveOrder(null);
    },
    onError: (err) => {
      toast.error(getFriendlyErrorMessage(err, "Failed to update order status"));
    },
  });

  const handleOpenStatusModal = (order: AdminOrder) => {
    setActiveOrder(order);
    setNewStatus(order.orderStatus);
    setTrackingNumber(order.trackingNumber || "");
    setAdminNote("");
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    updateStatusMutation.mutate({
      id: activeOrder.id,
      status: newStatus,
      trackingNumber,
      note: adminNote,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "PENDING":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "CONFIRMED":
        return "bg-teal-50 text-teal-800 border-teal-200";
      case "PROCESSING":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-stone-100 text-stone-800 border-stone-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BanglaShop Logistics</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
            Order Fulfillment & Courier Dispatch
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage dispatches, consignments, and delivery execution across 64 districts
          </p>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-4 sm:p-5 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by order number (BD-XXXXXX), phone, or customer..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-stone-50 border border-stone-200 text-xs font-bold rounded-2xl px-3.5 py-2.5 text-stone-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          >
            <option value="ALL">All Statuses</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-stone-200/80 rounded-3xl shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs font-semibold text-stone-400">Loading orders...</div>
        ) : isError ? (
          <div className="p-10 text-center text-rose-600 text-xs">
            Failed to load orders.{" "}
            <button onClick={() => refetch()} className="underline font-bold">
              Retry
            </button>
          </div>
        ) : data?.orders.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <ShoppingCart className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-900">No matching orders found</h3>
            <p className="text-xs text-stone-500">Try adjusting your search criteria or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-100">
                <tr>
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer & Phone</th>
                  <th className="py-3.5 px-4">Delivery Zone</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status & Courier</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data?.orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/60 transition-colors">
                    {/* Order ID */}
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-stone-900">{ord.orderNumber}</p>
                      <p className="text-[11px] text-stone-400">
                        {new Date(ord.createdAt).toLocaleString("en-BD", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-stone-900">{ord.customerName}</p>
                      <p className="text-[11px] text-stone-500 font-mono">{ord.customerPhone}</p>
                      <p className="text-[10px] text-stone-400 truncate max-w-xs">
                        {ord.shippingAddress.streetAddress}, {ord.shippingAddress.district}
                      </p>
                    </td>

                    {/* Zone */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-stone-700">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        {ord.deliveryZone === "INSIDE_DHAKA"
                          ? "Inside Dhaka (৳60)"
                          : "Outside Dhaka (৳120)"}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-stone-900">{formatBDT(ord.totalAmount)}</p>
                      <p className="text-[10px] text-stone-400">
                        Fee: {formatBDT(ord.deliveryFee)} ({ord._count?.items || 1} items)
                      </p>
                    </td>

                    {/* Payment */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-stone-900 block">
                        {ord.paymentMethod === "CASH_ON_DELIVERY" ? "COD" : "Stripe"}
                      </span>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                          ord.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>

                    {/* Status & Courier */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          ord.orderStatus
                        )}`}
                      >
                        {ord.orderStatus}
                      </span>
                      {ord.trackingNumber && (
                        <p className="text-[10px] font-mono text-stone-500 mt-0.5 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-indigo-600" />
                          <span>{ord.trackingNumber}</span>
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(ord)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Update</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="p-4 sm:p-5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STATUS UPDATE & COURIER TRACKING MODAL */}
      <AdminModal
        isOpen={!!activeOrder}
        onClose={() => setActiveOrder(null)}
        maxWidth="max-w-lg"
      >
        {activeOrder && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-stone-900">
                  Update Order: {activeOrder.orderNumber}
                </h3>
                <p className="text-xs text-stone-500">
                  Customer: {activeOrder.customerName} ({activeOrder.customerPhone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveOrder(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              {/* Order Status Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Order Milestone Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {newStatus === "CANCELLED" && (
                  <p className="text-[11px] text-rose-600 font-medium pt-1">
                    ⚠️ Marking as CANCELLED will automatically restore variant stock back into inventory.
                  </p>
                )}
              </div>

              {/* Courier Tracking Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Bangladeshi Courier Consignment ID (Optional)
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. STDFST-902381 or PATHAO-482019"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
                <p className="text-[10px] text-stone-400">
                  Customers can look up live updates on the public /track order page with this number.
                </p>
              </div>

              {/* Milestone Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Milestone Dispatch Note
                </label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Handed over to delivery rider at Mirpur Dhaka hub."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 shadow-md shadow-emerald-700/20"
                >
                  {updateStatusMutation.isPending ? "Saving..." : "Update Milestone"}
                </button>
              </div>
            </form>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
