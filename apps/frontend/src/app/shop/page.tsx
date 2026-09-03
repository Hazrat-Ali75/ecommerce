"use client";

import { useState, useTransition, Suspense, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ProductCard } from "@/components/products/product-card";
import { formatBDT } from "@/lib/currency";
import {
  Filter,
  Clock,
  ChevronDown,
  X,
  RotateCcw,
  Sparkles,
  Check,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Flame,
  SlidersHorizontal,
  Layers,
} from "lucide-react";

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  brand: string;
  basePrice: number;
  discountPrice: number | null;
  category: { id: string; name: string; slug: string; type: string };
  images: Array<{ url: string; isPrimary: boolean }>;
  variants: Array<{ stockQuantity: number }>;
}

interface ProductsResponse {
  products: ProductItem[];
  facets: {
    brands: string[];
    priceRange: { min: number; max: number };
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const CATEGORIES = [
  { name: "All Categories", slug: "" },
  { name: "Fashion & Apparel", slug: "fashion-apparel" },
  { name: "Footwear & Sneakers", slug: "footwear-sneakers" },
  { name: "Electronics & Gadgets", slug: "electronics-gadgets" },
];

const GENDERS = [
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Kids", value: "kids" },
];

const ELECTRONICS_TYPES = [
  { label: "Smartwatch", value: "watch" },
  { label: "Fast Charger", value: "charger" },
  { label: "Power Bank", value: "power bank" },
  { label: "Earbuds & TWS", value: "earbuds" },
];

const ARRIVAL_TIME_OPTIONS = [
  { label: "Latest Arrivals (Newest)", value: "newest", icon: Sparkles },
  { label: "Oldest Arrivals", value: "oldest", icon: Clock },
  { label: "Price: Low to High", value: "price-asc", icon: ArrowDownWideNarrow },
  { label: "Price: High to Low", value: "price-desc", icon: ArrowUpNarrowWide },
  { label: "Most Popular", value: "popular", icon: Flame },
];

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // URL State
  const currentCategory = searchParams.get("category") || "";
  const currentGender = searchParams.get("gender") || "";
  const currentBrand = searchParams.get("brand") || "";
  const currentType = searchParams.get("type") || "";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentSearch = searchParams.get("search") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Mobile Bottom Sheet / Modal States
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Local price inputs
  const [localMinPrice, setLocalMinPrice] = useState(currentMinPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(currentMaxPrice);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch products
  const { data, isLoading, isError } = useQuery<ProductsResponse>({
    queryKey: [
      "shop-products",
      currentCategory,
      currentGender,
      currentBrand,
      currentType,
      currentMinPrice,
      currentMaxPrice,
      currentSort,
      currentSearch,
      currentPage,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCategory) params.set("categorySlug", currentCategory);
      if (currentGender) params.set("gender", currentGender);
      if (currentBrand) params.set("brand", currentBrand);
      if (currentType) params.set("electronicsType", currentType);
      if (currentMinPrice) params.set("minPrice", currentMinPrice);
      if (currentMaxPrice) params.set("maxPrice", currentMaxPrice);
      if (currentSort) params.set("sort", currentSort);
      if (currentSearch) params.set("search", currentSearch);
      params.set("page", currentPage.toString());
      params.set("limit", "12");

      const res = await apiClient.get(`/products?${params.toString()}`);
      return res.data;
    },
  });

  const updateParam = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.set("page", "1");
    startTransition(() => {
      router.push(`/shop?${params.toString()}`);
    });
  };

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam({
      minPrice: localMinPrice || null,
      maxPrice: localMaxPrice || null,
    });
  };

  const clearAllFilters = () => {
    setLocalMinPrice("");
    setLocalMaxPrice("");
    startTransition(() => {
      router.push("/shop");
    });
  };

  const activeFiltersCount = [
    currentCategory,
    currentGender,
    currentBrand,
    currentType,
    currentMinPrice || currentMaxPrice,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0 || Boolean(currentSearch);
  const selectedCategoryObj = CATEGORIES.find((c) => c.slug === currentCategory);
  const selectedSortObj =
    ARRIVAL_TIME_OPTIONS.find((s) => s.value === currentSort) || ARRIVAL_TIME_OPTIONS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* 1. TOP HEADING */}
      <div className="space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
            {selectedCategoryObj?.slug ? selectedCategoryObj.name : "All Products"}
          </h1>
          <span className="text-xs sm:text-sm font-semibold text-gray-500">
            {data ? `${data.pagination.total} Authentic Products in Catalog` : "Loading..."}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-gray-500">
          Curated Bangladeshi fashion, footwear, and smart gadgets with nationwide cash on delivery.
        </p>
      </div>

      {/* 2. THREE-SECTION DIV (LEFT: FILTER BUTTON, MIDDLE: PRICE RANGE, RIGHT: ARRIVAL TIME / SORT) */}
      <div className="bg-white border rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 items-center">
          {/* LEFT SECTION (4 cols): Filter Input & Trigger Button */}
          <div className="sm:col-span-1 md:col-span-4">
            <button
              onClick={() => setFilterModalOpen(true)}
              className={`w-full flex items-center justify-between py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-bold transition-all shadow-xs ${
                currentCategory || filterModalOpen
                  ? "bg-primary text-white border-primary"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {selectedCategoryObj?.slug
                    ? selectedCategoryObj.name
                    : "Filter by Category"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-secondary text-white text-[11px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 shrink-0 opacity-70" />
              </div>
            </button>
          </div>

          {/* MIDDLE SECTION (4 cols): Price Range Inputs */}
          <div className="sm:col-span-1 md:col-span-4">
            <form onSubmit={handleApplyPrice} className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">
                  ৳
                </span>
                <input
                  type="number"
                  placeholder="Min"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  className="w-full bg-gray-50 border rounded-xl sm:rounded-2xl py-2 sm:py-2.5 pl-7 pr-2 text-xs sm:text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <span className="text-xs text-gray-400 font-bold">-</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">
                  ৳
                </span>
                <input
                  type="number"
                  placeholder="Max"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  className="w-full bg-gray-50 border rounded-xl sm:rounded-2xl py-2 sm:py-2.5 pl-7 pr-2 text-xs sm:text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                type="submit"
                className="py-2 sm:py-2.5 px-3.5 bg-gray-900 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold hover:bg-gray-800 transition-colors shrink-0 shadow-xs"
              >
                Apply
              </button>
            </form>
          </div>

          {/* RIGHT SECTION (4 cols): Impressive Arrival Time / Sort Dropdown */}
          <div className="sm:col-span-2 md:col-span-4 relative" ref={sortRef}>
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="w-full flex items-center justify-between py-2.5 sm:py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-gray-800 transition-all shadow-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <selectedSortObj.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{selectedSortObj.label}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-gray-500 transition-transform duration-200 ${
                  sortDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Impressive Dropdown Popover (Desktop: floating popover, Mobile: slide up bottom sheet) */}
            {sortDropdownOpen && (
              <>
                {/* Mobile Backdrop */}
                <div
                  className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 md:hidden"
                  onClick={() => setSortDropdownOpen(false)}
                />

                <div className="fixed md:absolute bottom-0 md:bottom-auto left-0 md:left-auto right-0 md:right-0 md:top-full md:mt-2 w-full md:w-64 bg-white rounded-t-3xl md:rounded-2xl shadow-2xl md:shadow-xl border border-gray-100 p-3 sm:p-2 z-50 animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-top-2 duration-200">
                  <div className="md:hidden flex items-center justify-between px-3 py-2 border-b mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Sort Products
                    </span>
                    <button
                      onClick={() => setSortDropdownOpen(false)}
                      className="p-1 rounded-full text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {ARRIVAL_TIME_OPTIONS.map((opt) => {
                      const isSelected = currentSort === opt.value;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            updateParam({ sort: opt.value });
                            setSortDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 md:p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                            isSelected
                              ? "bg-primary/10 text-primary font-bold"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`w-4 h-4 ${isSelected ? "text-primary" : "text-gray-400"}`}
                            />
                            <span>{opt.label}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ACTIVE FILTER PILLS (Visible below controls) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400 font-bold">Active:</span>
            {currentCategory && (
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {selectedCategoryObj?.name}
                <button
                  onClick={() => updateParam({ category: null, gender: null, brand: null, type: null })}
                  className="hover:opacity-75"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {currentGender && (
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-gray-100 text-gray-800 text-xs font-bold capitalize">
                {currentGender}
                <button
                  onClick={() => updateParam({ gender: null })}
                  className="hover:opacity-75"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {currentBrand && (
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-gray-100 text-gray-800 text-xs font-bold">
                {currentBrand}
                <button
                  onClick={() => updateParam({ brand: null })}
                  className="hover:opacity-75"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {currentType && (
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-gray-100 text-gray-800 text-xs font-bold capitalize">
                {currentType}
                <button
                  onClick={() => updateParam({ type: null })}
                  className="hover:opacity-75"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {(currentMinPrice || currentMaxPrice) && (
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-gray-100 text-gray-800 text-xs font-bold">
                ৳{currentMinPrice || "0"} - ৳{currentMaxPrice || "Any"}
                <button
                  onClick={() => {
                    setLocalMinPrice("");
                    setLocalMaxPrice("");
                    updateParam({ minPrice: null, maxPrice: null });
                  }}
                  className="hover:opacity-75"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* 3. IMPRESSIVE CATEGORY-WISE DETAILED FILTER DRAWER / MODAL (Mobile Bottom Sheet & Desktop Modal) */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setFilterModalOpen(false)}
          />

          <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col z-10 animate-in fade-in slide-in-from-bottom-6 duration-300">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h2 className="text-base sm:text-lg font-black text-gray-900">
                  Filter Products
                </h2>
              </div>
              <button
                onClick={() => setFilterModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Step 1: Select Category */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2.5">
                  1. Choose Category
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {CATEGORIES.map((cat) => {
                    const isSelected = currentCategory === cat.slug;
                    return (
                      <button
                        key={cat.slug}
                        onClick={() =>
                          updateParam({
                            category: cat.slug || null,
                            gender: null,
                            brand: null,
                            type: null,
                          })
                        }
                        className={`p-3 rounded-xl sm:rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-primary bg-primary/5 text-primary font-black"
                            : "border-gray-200 text-gray-700 hover:border-gray-300 font-semibold"
                        }`}
                      >
                        <span className="text-xs sm:text-sm">{cat.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Category-Wise Detailed Options */}
              {currentCategory && (
                <div className="space-y-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                      2. Detailed Options for &quot;{selectedCategoryObj?.name}&quot;
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      Refine selection
                    </span>
                  </div>

                  {/* Detailed Option: Gender (for Fashion & Footwear) */}
                  {currentCategory !== "electronics-gadgets" && (
                    <div>
                      <span className="text-xs font-bold text-gray-700 block mb-2">
                        Target Gender
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {GENDERS.map((g) => {
                          const isSelected = currentGender === g.value;
                          return (
                            <button
                              key={g.value}
                              onClick={() =>
                                updateParam({ gender: isSelected ? null : g.value })
                              }
                              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all ${
                                isSelected
                                  ? "border-primary bg-primary text-white shadow-xs"
                                  : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white"
                              }`}
                            >
                              {g.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Detailed Option: Gadget Subtype (for Electronics) */}
                  {currentCategory === "electronics-gadgets" && (
                    <div>
                      <span className="text-xs font-bold text-gray-700 block mb-2">
                        Gadget Subtype
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {ELECTRONICS_TYPES.map((t) => {
                          const isSelected = currentType === t.value;
                          return (
                            <button
                              key={t.value}
                              onClick={() =>
                                updateParam({ type: isSelected ? null : t.value })
                              }
                              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all ${
                                isSelected
                                  ? "border-primary bg-primary text-white shadow-xs"
                                  : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white"
                              }`}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Detailed Option: Brand */}
                  {data?.facets?.brands && data.facets.brands.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-gray-700 block mb-2">
                        Brand
                      </span>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                        {data.facets.brands.map((brandName) => {
                          const isSelected =
                            currentBrand.toLowerCase() === brandName.toLowerCase();
                          return (
                            <button
                              key={brandName}
                              onClick={() =>
                                updateParam({ brand: isSelected ? null : brandName })
                              }
                              className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all ${
                                isSelected
                                  ? "border-primary bg-primary text-white shadow-xs"
                                  : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white"
                              }`}
                            >
                              {brandName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t bg-gray-50 flex items-center justify-between gap-3">
              <button
                onClick={clearAllFilters}
                className="py-3 px-4 text-xs sm:text-sm font-bold text-gray-600 hover:text-red-600"
              >
                Clear All
              </button>
              <button
                onClick={() => setFilterModalOpen(false)}
                className="flex-1 py-3 px-6 bg-primary text-white text-xs sm:text-sm font-black rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 text-center"
              >
                Show Results {data?.pagination?.total ? `(${data.pagination.total})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRODUCTS GRID LOADED BELOW WITH RESPONSIVE PAGINATION */}
      <main>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-2xl sm:rounded-3xl h-72 sm:h-80" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16 bg-red-50 rounded-2xl p-6">
            <p className="text-sm font-semibold text-red-600">
              Failed to load products. Please check your connection.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : data?.products && data.products.length > 0 ? (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {data.products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="mt-10 sm:mt-14 flex items-center justify-center gap-1.5 sm:gap-2">
                {[...Array(data.pagination.totalPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => updateParam({ page: pageNum.toString() })}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                        currentPage === pageNum
                          ? "bg-primary text-white shadow-md shadow-primary/25 scale-105"
                          : "bg-white border text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-24 bg-gray-50 rounded-3xl p-6 sm:p-8 border">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              No products match your current filters. Try resetting the criteria.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-3 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl hover:bg-primary/90 transition-all shadow-xs"
            >
              Show All Products
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-8 animate-pulse text-sm text-gray-500">Loading catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
