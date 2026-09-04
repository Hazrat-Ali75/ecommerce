"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWishlistStore } from "@/store/wishlist-store";
import { formatBDT } from "@/lib/currency";
import {
  Heart,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const { items, toggleWishlist } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="h-8 bg-stone-100 rounded-lg w-48 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-stone-100 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Heart className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 mb-3">
          Your Wishlist is Empty
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mb-8 leading-relaxed">
          Bookmark your favorite Panjabis, Sarees, Sneakers, or Tech Gadgets to easily find and purchase them later.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-700/20"
        >
          <span>Discover Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6 sm:mb-8">
        <Link href="/" className="hover:text-emerald-700 transition-colors font-medium">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <Link href="/shop" className="hover:text-emerald-700 transition-colors font-medium">
          Shop
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <span className="text-stone-900 font-semibold">Wishlist</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Saved Collections</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-stone-900 tracking-tight">
            My Wishlist ({items.length} {items.length === 1 ? "item" : "items"})
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Saved items remain preserved on your device until you are ready to order
          </p>
        </div>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item) => (
          <div
            key={item.productId}
            className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 flex flex-col justify-between group"
          >
            <Link
              href={`/product/${item.slug}`}
              className="relative aspect-square bg-stone-50 block overflow-hidden"
            >
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleWishlist(item);
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-rose-600 shadow-md hover:scale-110 transition-all"
                aria-label="Remove from wishlist"
                title="Remove from wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Link>

            <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                  {item.brand}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-2 leading-snug mt-1 hover:text-emerald-700 transition-colors">
                  <Link href={`/product/${item.slug}`}>{item.title}</Link>
                </h3>
              </div>

              <div className="pt-2">
                <div className="font-extrabold text-sm sm:text-base text-stone-900">
                  {formatBDT(item.price)}
                </div>

                <Link
                  href={`/product/${item.slug}`}
                  className="w-full mt-3 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  <span>View Product</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
