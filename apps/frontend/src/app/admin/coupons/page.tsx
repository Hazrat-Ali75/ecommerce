"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatBDT } from "@/lib/currency";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import {
  Ticket,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Percent,
  Banknote,
  Loader2,
  Copy,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AdminModal } from "@/components/ui/admin-modal";

interface CouponItem {
  id: string;
  code: string;
  description?: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  startDate: string;
  endDate?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  _count?: { orders: number; usages: number };
}

interface CouponsResponse {
  coupons: CouponItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<string>("10");
  const [minOrderAmount, setMinOrderAmount] = useState<string>("");
  const [maxDiscount, setMaxDiscount] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  // 1. Fetch paginated coupons
  const { data, isLoading } = useQuery<CouponsResponse>({
    queryKey: ["admin-coupons", page, search, activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (search.trim()) params.set("search", search.trim());
      if (activeFilter) params.set("isActive", activeFilter);

      const res = await apiClient.get(`/coupons/admin/all?${params.toString()}`);
      return res.data;
    },
  });

  // 2. Create coupon mutation
  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiClient.post("/coupons/admin", payload);
      return res.data;
    },
    onSuccess: (newCoupon) => {
      toast.success(`Coupon '${newCoupon.code}' created successfully!`);
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (err: unknown) => {
      toast.error(getFriendlyErrorMessage(err, "Failed to create coupon"));
    },
  });

  // 3. Update coupon mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const res = await apiClient.patch(`/coupons/admin/${id}`, payload);
      return res.data;
    },
    onSuccess: (updated) => {
      toast.success(`Coupon '${updated.code}' updated successfully!`);
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (err: unknown) => {
      toast.error(getFriendlyErrorMessage(err, "Failed to update coupon"));
    },
  });

  // 4. Delete coupon mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/coupons/admin/${id}`);
    },
    onSuccess: () => {
      toast.success("Coupon deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (err: unknown) => {
      toast.error(getFriendlyErrorMessage(err, "Failed to delete coupon"));
    },
  });

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode("");
    setDescription("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("10");
    setMinOrderAmount("");
    setMaxDiscount("");
    setEndDate("");
    setUsageLimit("");
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (c: CouponItem) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description || "");
    setDiscountType(c.discountType);
    setDiscountValue(String(c.discountValue));
    setMinOrderAmount(c.minOrderAmount ? String(c.minOrderAmount) : "");
    setMaxDiscount(c.maxDiscount ? String(c.maxDiscount) : "");
    setEndDate(c.endDate ? c.endDate.split("T")[0] : "");
    setUsageLimit(c.usageLimit ? String(c.usageLimit) : "");
    setIsActive(c.isActive);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCoupon(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    if (discountType === "PERCENTAGE" && val > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    const payload: Record<string, unknown> = {
      code: code.trim().toUpperCase(),
      description: description.trim() || undefined,
      discountType,
      discountValue: val,
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
      isActive,
    };

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const copyCode = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopiedCode(c);
    toast.success(`Copied code "${c}" to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const coupons = data?.coupons || [];
  const pagination = data?.pagination || { page: 1, limit: 15, totalItems: 0, totalPages: 1 };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-primary" />
            <span>Coupons & Promotion Codes</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create and manage customer discounts, percentage off, and BDT promos.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border shadow-2xs">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by coupon code or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Statuses (Active & Inactive)</option>
            <option value="true">Active Coupons Only</option>
            <option value="false">Inactive Coupons Only</option>
          </select>
        </div>
      </div>

      {/* COUPONS TABLE */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount Type & Value</th>
                <th className="py-3 px-4">Conditions</th>
                <th className="py-3 px-4">Redemptions</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-6 bg-gray-100 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <Ticket className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">No coupons found</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Create a new coupon code to reward your customers.
                    </p>
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const isExpired = c.endDate && new Date(c.endDate) < new Date();
                  const isLimitReached = c.usageLimit && c.usedCount >= c.usageLimit;

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-gray-900 text-white px-2.5 py-1 rounded-lg text-xs tracking-wider">
                            {c.code}
                          </span>
                          <button
                            onClick={() => copyCode(c.code)}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded-md transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === c.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {c.description && (
                          <span className="text-[11px] text-gray-500 font-sans block mt-1 line-clamp-1">
                            {c.description}
                          </span>
                        )}
                      </td>

                      {/* Type & Value */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          {c.discountType === "PERCENTAGE" ? (
                            <>
                              <Percent className="w-3.5 h-3.5 text-primary" />
                              <span>{c.discountValue}% OFF</span>
                            </>
                          ) : (
                            <>
                              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{formatBDT(c.discountValue)} FLAT</span>
                            </>
                          )}
                        </div>
                        {c.maxDiscount && (
                          <span className="text-[10px] text-gray-500 block mt-0.5">
                            Capped at {formatBDT(c.maxDiscount)}
                          </span>
                        )}
                      </td>

                      {/* Conditions */}
                      <td className="py-3.5 px-4 text-[11px] text-gray-600">
                        {c.minOrderAmount ? (
                          <div>Min Subtotal: <strong>{formatBDT(c.minOrderAmount)}</strong></div>
                        ) : (
                          <span className="text-gray-400">No minimum subtotal</span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {c.usedCount}
                            {c.usageLimit ? ` / ${c.usageLimit}` : " uses"}
                          </span>
                        </div>
                        {c.usageLimit && (
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                isLimitReached ? "bg-red-500" : "bg-primary"
                              }`}
                              style={{ width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                        {c.endDate ? (
                          <div className={`flex items-center gap-1 ${isExpired ? "text-red-600 font-bold" : ""}`}>
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(c.endDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Never expires</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" />
                            Expired
                          </span>
                        ) : isLimitReached ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Limit Reached
                          </span>
                        ) : c.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active Status */}
                          <button
                            onClick={() =>
                              updateMutation.mutate({
                                id: c.id,
                                payload: { isActive: !c.isActive },
                              })
                            }
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              c.isActive
                                ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={c.isActive ? "Deactivate coupon" : "Activate coupon"}
                          >
                            {c.isActive ? "Deactivate" : "Activate"}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit coupon"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Delete coupon "${c.code}"?`)) {
                                deleteMutation.mutate(c.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-xs">
            <span className="text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} coupons)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-1.5 border rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 border rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <AdminModal isOpen={modalOpen} onClose={closeModal} maxWidth="max-w-xl">
        <div className="flex items-center justify-between border-b pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-gray-900">
              {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Promo Coupon"}
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* Code */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">Coupon Code *</label>
            <input
              type="text"
              placeholder="e.g. EID2026 or SAVE15"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              className="w-full p-2.5 font-mono uppercase font-bold text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <span className="text-[10px] text-gray-400 mt-0.5 block">
              Uppercase letters, numbers, and hyphens only (3-20 characters).
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Eid special 15% discount across fashion and footwear"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Discount Type *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED_AMOUNT")}
                className="w-full p-2.5 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed BDT (৳)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Discount Value * {discountType === "PERCENTAGE" ? "(%)" : "(৳ BDT)"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
                className="w-full p-2.5 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Min Order & Max Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Min Order Subtotal (৳ BDT)
              </label>
              <input
                type="number"
                placeholder="Optional (e.g. 500)"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                className="w-full p-2.5 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Max Discount Cap (৳ BDT)
              </label>
              <input
                type="number"
                placeholder="Optional cap for % discounts"
                value={maxDiscount}
                disabled={discountType === "FIXED_AMOUNT"}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className="w-full p-2.5 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-40"
              />
            </div>
          </div>

          {/* Expiration Date & Usage Limit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Total Usage Limit</label>
              <input
                type="number"
                placeholder="Unlimited if blank"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                className="w-full p-2.5 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="font-bold text-gray-700 cursor-pointer">
              Coupon is active and ready for use
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md shadow-primary/20"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              <span>{editingCoupon ? "Save Changes" : "Create Coupon"}</span>
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
