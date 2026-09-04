"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Star, ShoppingBag } from "lucide-react";
import { formatBDT } from "@/lib/currency";
import { useWishlistStore } from "@/store/wishlist-store";

export interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  brand: string;
  basePrice: number | string;
  discountPrice?: number | string | null;
  category?: { name: string; slug: string } | null;
  images?: Array<{ url: string; isPrimary?: boolean }>;
  variants?: Array<{ stockQuantity: number }>;
}

export function ProductCard({
  id,
  title,
  slug,
  brand,
  basePrice,
  discountPrice,
  category,
  images,
  variants,
}: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlistStore();

  const primaryImage =
    images?.find((img) => img.isPrimary)?.url ||
    images?.[0]?.url ||
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop";

  const numBasePrice = Number(basePrice);
  const numDiscountPrice = discountPrice ? Number(discountPrice) : null;
  const hasDiscount = numDiscountPrice && numDiscountPrice < numBasePrice;
  const discountPercent = hasDiscount
    ? Math.round(((numBasePrice - numDiscountPrice) / numBasePrice) * 100)
    : 0;

  const totalStock = variants?.reduce((acc, v) => acc + v.stockQuantity, 0) ?? 99;
  const isOutOfStock = totalStock <= 0;

  const inWishlist = isInWishlist(id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      productId: id,
      title,
      slug,
      brand,
      price: hasDiscount ? numDiscountPrice : numBasePrice,
      image: primaryImage,
      inStock: !isOutOfStock,
    });
  };

  return (
    <div className="group relative bg-white border border-gray-200/80 hover:border-emerald-500/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between">
      {/* Thumbnail Container */}
      <Link href={`/product/${slug}`} className="relative block aspect-square bg-gray-50 overflow-hidden">
        <Image
          src={primaryImage}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-bdred text-white text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs tracking-tight">
            -{discountPercent}% OFF
          </span>
        )}

        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 text-center">
            <span className="bg-white/95 text-gray-900 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all shadow-xs ${
            inWishlist
              ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
              : "bg-white/90 text-gray-600 hover:bg-white hover:text-rose-600"
          }`}
          aria-label="Add to wishlist"
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${inWishlist ? "fill-rose-600 text-rose-600" : ""}`} />
        </button>
      </Link>

      {/* Info Container */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1 gap-1">
            <span className="font-bold text-primary tracking-wider uppercase text-[10px] sm:text-[11px] truncate">
              {brand}
            </span>
            {category && (
              <span className="text-gray-400 text-[10px] sm:text-[11px] truncate max-w-[90px]">
                {category.name}
              </span>
            )}
          </div>

          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            <Link href={`/product/${slug}`}>{title}</Link>
          </h3>
        </div>

        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold text-gray-900">
                {formatBDT(hasDiscount ? numDiscountPrice : numBasePrice)}
              </span>
              {hasDiscount && (
                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                  {formatBDT(numBasePrice)}
                </span>
              )}
            </div>
          </div>

          <Link
            href={`/product/${slug}`}
            className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0 shadow-xs"
            aria-label="View product details"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
