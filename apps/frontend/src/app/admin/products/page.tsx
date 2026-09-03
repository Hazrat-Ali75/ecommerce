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
  Layers,
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
  const [pageSize, setPageSize] = useState<number>(15); // Supports 12 or 15 products per page
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
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">Product Catalog</h2>
          <p className="text-xs text-gray-500">
            Manage authentic Fashion, Footwear, and Smart Gadgets inventory
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Filters, Search & Page Size Toolbar */}
      <div className="bg-white border rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title, brand, or SKU..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-emerald-600 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-xl px-3 py-2 text-gray-700 focus:outline-emerald-600"
            >
              <option value="ALL">All Categories</option>
              <option value="FASHION">Fashion & Apparel</option>
              <option value="FOOTWEAR">Footwear & Sneakers</option>
              <option value="ELECTRONICS">Electronics & Gadgets</option>
            </select>
          </div>

          {/* Page Size Toggle: 12 vs 15 items */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1 border">
            <span className="text-[10px] font-bold text-gray-500 px-1.5">Show:</span>
            <button
              type="button"
              onClick={() => {
                setPageSize(12);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                pageSize === 12
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
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
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                pageSize === 15
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              15
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading catalog items...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600 text-xs">
            Failed to load products.{" "}
            <button onClick={() => refetch()} className="underline font-bold">
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Package className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-900">No products found</h3>
            <p className="text-xs text-gray-500">Try adjusting your search keywords or category filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Variants & Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => {
                  const primaryImg = product.images?.[0]?.url;
                  const variants = product.variants || [];
                  const totalStock = variants.reduce(
                    (acc, v) => acc + (v.stockQuantity || 0),
                    0
                  );

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border">
                            {primaryImg ? (
                              <Image
                                src={primaryImg}
                                alt={product.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 line-clamp-1">{product.title}</p>
                            <p className="text-[11px] text-gray-500 font-medium">
                              Brand: <span className="font-semibold text-gray-700">{product.brand}</span>
                            </p>
                            <Link
                              href={`/product/${product.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:underline mt-0.5"
                            >
                              <span>View in Store</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            product.category?.type === "FASHION"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : product.category?.type === "FOOTWEAR"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {product.category?.name || "General"}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900">{formatBDT(product.basePrice)}</p>
                        {product.discountPrice && (
                          <p className="text-[10px] text-emerald-600 font-semibold">
                            Sale: {formatBDT(product.discountPrice)}
                          </p>
                        )}
                      </td>

                      {/* Variants & Stock Matrix */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="font-bold text-gray-900">
                            {totalStock} in stock{" "}
                            <span className="text-[10px] text-gray-400 font-normal">
                              ({variants.length} variant{variants.length !== 1 ? "s" : ""})
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {variants.slice(0, 4).map((v) => (
                              <span
                                key={v.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                  v.stockQuantity <= 5
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-gray-100 text-gray-700"
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
                              <span className="text-[10px] text-gray-400 font-medium self-center">
                                +{variants.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeletingId(product.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
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
          <div className="p-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
            <span>
              Showing Page {data.pagination.page} of {Math.max(1, data.pagination.totalPages)} (
              {data.pagination.total} total products, {pageSize} per page)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
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
                      onClick={() => setPage(pNum)}
                      className={`w-7 h-7 rounded-lg font-bold text-xs ${
                        page === pNum
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "border hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
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
          <div className="flex items-center gap-3 text-red-600">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Delete Product</h3>
              <p className="text-xs text-gray-500">Are you sure you want to delete this product?</p>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            This will remove the product and all its variants from the store. Past customer orders will preserve their historical snapshots.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setDeletingId(null)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
