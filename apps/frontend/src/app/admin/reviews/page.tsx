"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import {
  Star,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Filter,
  ShieldCheck,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface AdminReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  isVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  product: {
    id: string;
    title: string;
    slug: string;
    brand: string;
  };
}

interface AdminReviewsResponse {
  reviews: AdminReviewItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("");

  const { data, isLoading } = useQuery<AdminReviewsResponse>({
    queryKey: ["admin-reviews", page, search, ratingFilter, verifiedFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (search.trim()) params.set("search", search.trim());
      if (ratingFilter) params.set("rating", ratingFilter);
      if (verifiedFilter) params.set("isVerified", verifiedFilter);

      const res = await apiClient.get(`/reviews/admin/all?${params.toString()}`);
      return res.data;
    },
  });

  const toggleVerifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/reviews/admin/${id}/toggle-verify`);
      return res.data;
    },
    onSuccess: (updated) => {
      toast.success(
        updated.isVerified ? "Review marked as Verified Buyer" : "Verified status removed"
      );
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (err: unknown) => {
      toast.error(getFriendlyErrorMessage(err, "Failed to toggle verification status"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/reviews/admin/${id}`);
    },
    onSuccess: () => {
      toast.success("Review deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (err: unknown) => {
      toast.error(getFriendlyErrorMessage(err, "Failed to delete review"));
    },
  });

  const reviews = data?.reviews || [];
  const pagination = data?.pagination || { page: 1, limit: 15, totalItems: 0, totalPages: 1 };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>Product Reviews Moderation</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Monitor, inspect, and moderate customer ratings and verified buyer badges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl">
            {pagination.totalItems} Total Reviews
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border shadow-2xs">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by product, customer name, email, or comment..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Rating Filter */}
        <div className="sm:col-span-3">
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Ratings (1 - 5 Stars)</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars Only</option>
            <option value="3">3 Stars Only</option>
            <option value="2">2 Stars Only</option>
            <option value="1">1 Star Only</option>
          </select>
        </div>

        {/* Verified Filter */}
        <div className="sm:col-span-3">
          <select
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Verification Statuses</option>
            <option value="true">Verified Buyers Only</option>
            <option value="false">Unverified Only</option>
          </select>
        </div>
      </div>

      {/* REVIEWS TABLE */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Review Comment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
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
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">No reviews found</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Try adjusting your search query or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => {
                  const dateStr = new Date(rev.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={rev.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Product */}
                      <td className="py-3.5 px-4 font-medium max-w-[200px]">
                        <div className="truncate text-gray-900 font-bold">{rev.product.title}</div>
                        <div className="flex items-center gap-1 text-[11px] text-primary">
                          <span>{rev.product.brand}</span>
                          <Link
                            href={`/product/${rev.product.slug}`}
                            target="_blank"
                            className="hover:underline inline-flex items-center"
                          >
                            <ExternalLink className="w-3 h-3 text-gray-400 ml-0.5" />
                          </Link>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 max-w-[160px]">
                        <div className="font-semibold text-gray-900 truncate">{rev.user.name}</div>
                        <div className="text-[11px] text-gray-500 truncate">{rev.user.email}</div>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? "fill-current" : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold mt-0.5 block">
                          {rev.rating} / 5 Stars
                        </span>
                      </td>

                      {/* Comment */}
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <p className="text-gray-700 line-clamp-2 text-xs leading-relaxed">
                          {rev.comment ? `"${rev.comment}"` : <em className="text-gray-400">No written feedback</em>}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleVerifyMutation.mutate(rev.id)}
                          disabled={toggleVerifyMutation.isPending}
                          className="group/btn"
                          title="Click to toggle verified status"
                        >
                          {rev.isVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Verified Buyer
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer">
                              <XCircle className="w-3 h-3 text-gray-400" />
                              Unverified
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap text-[11px]">
                        {dateStr}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Delete review from "${rev.user.name}"?`)) {
                              deleteMutation.mutate(rev.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-xs">
            <span className="text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} reviews)
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
    </div>
  );
}
