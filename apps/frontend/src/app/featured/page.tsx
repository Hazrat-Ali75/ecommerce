"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { ProductCard } from "@/components/products/product-card";
import { Sparkles, Shuffle, ArrowLeft, ShoppingBag, Flame } from "lucide-react";

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

export default function FeaturedProductsPage() {
  const [shuffledProducts, setShuffledProducts] = useState<ProductItem[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  // In-memory Fisher-Yates shuffle
  const shuffleArray = (array: ProductItem[]) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["featured-products-random"],
    queryFn: async () => {
      // Fetch only featured products with random sort
      const res = await apiClient.get("/products?isFeatured=true&limit=50&sort=random");
      return res.data?.products || [];
    },
    staleTime: 0, // Always fresh on mount
  });

  // When data arrives, shuffle it to ensure purely random order on client load
  useEffect(() => {
    if (data && Array.isArray(data)) {
      setShuffledProducts(shuffleArray(data));
    }
  }, [data]);

  const handleManualShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setShuffledProducts((prev) => shuffleArray(prev));
      setIsShuffling(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gray-50/60 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="bg-white border rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Marketplace Spotlight
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    Random Discovery
                  </span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Featured Products
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
                Curated collection of featured authentic Bangladeshi fashion, footwear, and smart gadgets. Loaded in randomized discovery order with no category or attribute constraints.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleManualShuffle}
                disabled={isLoading || shuffledProducts.length <= 1}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Shuffle className={`w-4 h-4 text-amber-600 ${isShuffling ? "animate-spin" : ""}`} />
                <span>Shuffle Order</span>
              </button>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Browse Full Catalog</span>
              </Link>
            </div>
          </div>

          {/* Counts pill bar */}
          <div className="mt-6 pt-6 border-t flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700">Displaying:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-gray-100 font-black text-gray-900">
                {shuffledProducts.length} Featured Items
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Flame className="w-4 h-4 text-secondary" />
              <span>Free delivery on qualifying orders inside Dhaka (৳60) & across Bangladesh (৳120)</span>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-80 bg-white rounded-2xl border animate-pulse p-4 space-y-3"
              >
                <div className="h-44 bg-gray-100 rounded-xl" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="bg-white border rounded-3xl p-12 text-center space-y-3">
            <p className="text-sm font-bold text-red-600">Failed to load featured products</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
            >
              Try Again
            </button>
          </div>
        ) : shuffledProducts.length === 0 ? (
          <div className="bg-white border rounded-3xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-base font-bold text-gray-900">No Featured Products Yet</h3>
              <p className="text-xs text-gray-500">
                Check back soon or explore our complete catalog across fashion, footwear, and smart gadgets.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90"
            >
              <span>Explore Marketplace</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {shuffledProducts.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
