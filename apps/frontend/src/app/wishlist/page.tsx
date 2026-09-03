"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWishlistStore } from "@/store/wishlist-store";
import { formatBDT } from "@/lib/currency";
import { Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const { items, toggleWishlist } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-48 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Your Wishlist is Empty</h1>
        <p className="text-sm text-gray-500 mb-6">
          Bookmark your favorite Panjabis, Sarees, Sneakers, and Gadgets to view them here.
        </p>
        <Link href="/shop" className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl">
          Discover Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          My Wishlist ({items.length})
        </h1>
        <p className="text-xs text-gray-500 mt-1">Products you saved for later</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.productId} className="bg-white border rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between group">
            <Link href={`/product/${item.slug}`} className="relative aspect-square bg-gray-50 block overflow-hidden">
              {item.image && (
                <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleWishlist(item);
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-red-500 shadow-xs transition-colors"
                aria-label="Remove from wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Link>

            <div className="p-4 space-y-2">
              <span className="text-[11px] font-bold text-primary">{item.brand}</span>
              <h3 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">
                <Link href={`/product/${item.slug}`}>{item.title}</Link>
              </h3>
              <div className="font-extrabold text-sm text-gray-900">{formatBDT(item.price)}</div>

              <Link
                href={`/product/${item.slug}`}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
              >
                View Product
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
