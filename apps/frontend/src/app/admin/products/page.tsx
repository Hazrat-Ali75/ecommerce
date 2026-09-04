"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatBDT } from "@/lib/currency";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AdminModal } from "@/components/ui/admin-modal";

interface AdminVariant {
  id: string;
  sku: string;
  price: number;
  stockQuantity: number;
  attributes: Record<string, string>;
}

interface AdminProduct {
  id: string;
  title: string;
  slug: string;
  brand: string;
  basePrice: number;
  discountPrice?: number | null;
  category: {
    id: string;
    name: string;
    type: "FASHION" | "FOOTWEAR" | "ELECTRONICS";
  };
  images: Array<{ id: string; url: string; isPrimary: boolean }>;
  variants: AdminVariant[];
  createdAt: string;
}

interface AdminProductsResponse {
  products: AdminProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<AdminProductsResponse>({
    queryKey: ["admin-products", page, pageSize, categoryFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", pageSize.toString());
      if (categoryFilter !== "ALL") params.set("categoryType", categoryFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await apiClient.get(`/products/admin/all?${params.toString()}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics-summary"] });
      setDeletingId(null);
    },
    onError: (err) => {
      toast.error(getFriendlyErrorMessage(err, "Failed to delete product"));
      setDeletingId(null);
    },
  });

  const products = data?.products || [];

  return (
    <div className="space-y-6">
      {/* Header & New Product Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BanglaShop Inventory</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
            Product Catalog
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage authentic Fashion & Apparel, Footwear, and Smart Gadgets inventory
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Filters, Search & Page Size Toolbar */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-4 sm:p-5 shadow-card flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title, brand, or SKU..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-stone-50 border border-stone-200 text-xs font-bold rounded-2xl px-3.5 py-2.5 text-stone-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              <option value="ALL">All Categories</option>
              <option value="FASHION">Fashion & Apparel</option>
              <option value="FOOTWEAR">Footwear & Sneakers</option>
              <option value="ELECTRONICS">Electronics & Gadgets</option>
            </select>
          </div>

          {/* Page Size Toggle: 12 vs 15 items */}
          <div className="flex items-center bg-stone-100 p-1 rounded-2xl gap-1 border border-stone-200">
            <span className="text-[10px] font-bold text-stone-500 px-2">Show:</span>
            <button
              type="button"
              onClick={() => {
                setPageSize(12);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                pageSize === 12
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              12
            </button>
            <button
              type="button"
              onClick={() => {
                setPageSize(15);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                pageSize === 15
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              15
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-stone-200/80 rounded-3xl shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs font-semibold text-stone-400">
            Loading catalog inventory...
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-rose-600 text-xs">
            Failed to load products.{" "}
            <button onClick={() => refetch()} className="underline font-bold">
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Package className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-900">No products found</h3>
            <p className="text-xs text-stone-500">Try adjusting your search criteria or category filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-100">
                <tr>
                  <th className="py-3.5 px-5">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Base Price</th>
                  <th className="py-3.5 px-4">Variants & Stock</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((product) => {
                  const primaryImg = product.images?.[0]?.url;
                  const variants = product.variants || [];
                  const totalStock = variants.reduce(
                    (acc, v) => acc + (v.stockQuantity || 0),
                    0
                  );

                  return (
                    <tr key={product.id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-14 h-14 rounded-2xl bg-stone-50 overflow-hidden shrink-0 border border-stone-200 shadow-xs">
                            {primaryImg ? (
                              <Image
                                src={primaryImg}
                                alt={product.title}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 line-clamp-1 text-xs sm:text-sm">
                              {product.title}
                            </p>
                            <p className="text-[11px] text-stone-500 font-medium">
                              Brand: <strong className="text-stone-700">{product.brand}</strong>
                            </p>
                            <Link
                              href={`/product/${product.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:underline mt-0.5"
                            >
                              <span>View in Store</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            product.category?.type === "FASHION"
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : product.category?.type === "FOOTWEAR"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {product.category?.name || "General"}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="py-4 px-4">
                        <p className="font-extrabold text-stone-900">{formatBDT(product.basePrice)}</p>
                        {product.discountPrice && (
                          <p className="text-[10px] text-emerald-700 font-bold">
                            Sale: {formatBDT(product.discountPrice)}
                          </p>
                        )}
                      </td>

                      {/* Variants & Stock Matrix */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <p className="font-bold text-stone-900">
                            {totalStock} in stock{" "}
                            <span className="text-[10px] text-stone-400 font-normal">
                              ({variants.length} variant{variants.length !== 1 ? "s" : ""})
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {variants.slice(0, 4).map((v) => (
                              <span
                                key={v.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                                  v.stockQuantity <= 5
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-stone-100 text-stone-700"
                                }`}
                              >
                                {v.attributes?.size?.toUpperCase() ||
                                  v.attributes?.type ||
                                  v.attributes?.gender ||
                                  "Default"}
                                : {v.stockQuantity}
                              </span>
                            ))}
                            {variants.length > 4 && (
                              <span className="text-[10px] text-stone-400 font-medium self-center">
                                +{variants.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-2 rounded-xl text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeletingId(product.id)}
                            className="p-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {data && (
          <div className="p-4 sm:p-5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
            <span>
              Showing Page {data.pagination.page} of {Math.max(1, data.pagination.totalPages)} (
              {data.pagination.total} total items, {pageSize} per page)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 disabled:opacity-40 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={`w-8 h-8 rounded-xl font-bold text-xs transition-colors ${
                        page === pNum
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "border border-stone-200 hover:bg-stone-50 text-stone-700"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 disabled:opacity-40 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AdminModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Delete Product</h3>
              <p className="text-xs text-stone-500">Are you sure you want to delete this product?</p>
            </div>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            This will remove the product and all associated variants from the store. Past customer orders will preserve their historical line item snapshots.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeletingId(null)}
              className="px-4 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              disabled={deleteMutation.isPending}
              className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
