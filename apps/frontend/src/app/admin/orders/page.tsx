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
  ExternalLink,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  FileText,
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
      toast.success("Order status updated successfully!");
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
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PROCESSING":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">Order Fulfillment</h2>
          <p className="text-xs text-gray-500">
            Dispatch, courier assignment, and customer fulfillment across 64 districts
          </p>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white border rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by order number (BD-2026-...), phone, or name..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2 text-gray-700 focus:outline-emerald-600"
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
      <div className="bg-white border rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading orders...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600 text-xs">
            Failed to load orders.{" "}
            <button onClick={() => refetch()} className="underline font-bold">
              Retry
            </button>
          </div>
        ) : data?.orders.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-900">No matching orders found</h3>
            <p className="text-xs text-gray-500">Try adjusting your search criteria or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Customer & Phone</th>
                  <th className="py-3 px-4">Delivery Zone</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status & Courier</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Order ID */}
                    <td className="py-3 px-4">
                      <p className="font-mono font-black text-gray-900">{ord.orderNumber}</p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(ord.createdAt).toLocaleString("en-BD", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">{ord.customerName}</p>
                      <p className="text-[11px] text-gray-500 font-mono">{ord.customerPhone}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-xs">
                        {ord.shippingAddress.streetAddress}, {ord.shippingAddress.district}
                      </p>
                    </td>

                    {/* Zone */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {ord.deliveryZone === "INSIDE_DHAKA"
                          ? "Inside Dhaka (৳60)"
                          : "Outside Dhaka (৳120)"}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">{formatBDT(ord.totalAmount)}</p>
                      <p className="text-[10px] text-gray-400">
                        Fee: {formatBDT(ord.deliveryFee)} ({ord._count?.items || 1} items)
                      </p>
                    </td>

                    {/* Payment */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900 block">
                        {ord.paymentMethod === "CASH_ON_DELIVERY" ? "COD" : "Stripe"}
                      </span>
                      <span
                        className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          ord.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>

                    {/* Status & Courier */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          ord.orderStatus
                        )}`}
                      >
                        {ord.orderStatus}
                      </span>
                      {ord.trackingNumber && (
                        <p className="text-[10px] font-mono text-gray-500 mt-0.5 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-indigo-600" />
                          <span>{ord.trackingNumber}</span>
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenStatusModal(ord)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 rounded-xl text-xs font-bold transition-colors"
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
          <div className="p-4 border-t flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
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
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Update Order: {activeOrder.orderNumber}
                </h3>
                <p className="text-xs text-gray-500">
                  Customer: {activeOrder.customerName} ({activeOrder.customerPhone})
                </p>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              {/* Order Status Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Order Milestone Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-emerald-600"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {newStatus === "CANCELLED" && (
                  <p className="text-[11px] text-red-600 font-medium pt-1">
                    ⚠️ Marking as CANCELLED will automatically restore variant stock back into inventory.
                  </p>
                )}
              </div>

              {/* Courier Tracking Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  Bangladeshi Courier Tracking Number (Optional)
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g., STDFST-902381 or PATHAO-482019"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-emerald-600"
                />
                <p className="text-[10px] text-gray-400">
                  Customers can look up live updates on the public /track order page with this number.
                </p>
              </div>

              {/* Milestone Note */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Milestone Note</label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g., Handed over to courier delivery agent in Mirpur Dhaka hub."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-emerald-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-xs"
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
