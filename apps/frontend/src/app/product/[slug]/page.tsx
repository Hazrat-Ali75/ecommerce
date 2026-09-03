"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatBDT } from "@/lib/currency";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import {
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Star,
  Plus,
  Minus,
  AlertCircle,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

interface Variant {
  id: string;
  sku: string;
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
  attributes: Record<string, string>;
}

interface ProductDetails {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  basePrice: number;
  discountPrice?: number | null;
  brand: string;
  category: { id: string; name: string; slug: string; type: "FASHION" | "FOOTWEAR" | "ELECTRONICS" };
  images: Array<{ id: string; url: string; isPrimary: boolean; altText?: string }>;
  variants: Variant[];
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    user: { name: string; avatarUrl?: string };
  }>;
}

export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();

  const { data: product, isLoading, isError } = useQuery<ProductDetails>({
    queryKey: ["product", slug],
    queryFn: async () => {
      const res = await apiClient.get(`/products/${slug}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-gray-100 rounded-3xl" />
          <div className="space-y-6">
            <div className="h-8 bg-gray-100 rounded-lg w-3/4" />
            <div className="h-6 bg-gray-100 rounded-lg w-1/4" />
            <div className="h-24 bg-gray-100 rounded-xl" />
            <div className="h-12 bg-gray-100 rounded-xl w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">The requested product could not be located.</p>
        <Link href="/shop" className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl">
          Back to Shop
        </Link>
      </div>
    );
  }

  const isFashion = product.category.type === "FASHION";
  const isFootwear = product.category.type === "FOOTWEAR";
  const isElectronics = product.category.type === "ELECTRONICS";

  // Check if sizing applies
  const hasSizes = isFashion || isFootwear;

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);

  // Active price based on selection or product base
  const activePrice = selectedVariant
    ? selectedVariant.discountPrice
      ? Number(selectedVariant.discountPrice)
      : Number(selectedVariant.price)
    : product.discountPrice
    ? Number(product.discountPrice)
    : Number(product.basePrice);

  const originalPrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(product.basePrice);

  const hasDiscount = activePrice < originalPrice;

  const availableStock = selectedVariant
    ? selectedVariant.stockQuantity
    : product.variants.length > 0
    ? product.variants.reduce((acc, v) => acc + v.stockQuantity, 0)
    : 99;

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    // If product has size variants, user MUST select one first (Rule 5)
    if (hasSizes && !selectedVariantId) {
      toast.error("Please select your size before adding to cart");
      return;
    }

    // For electronics watches with gender
    if (isElectronics && product.variants.some((v) => v.attributes.gender) && !selectedVariantId) {
      toast.error("Please select an option before adding to cart");
      return;
    }

    const primaryImg = product.images[0]?.url || null;

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id || product.variants[0]?.id || null,
      title: product.title,
      slug: product.slug,
      brand: product.brand,
      price: activePrice,
      image: primaryImg,
      attributes: selectedVariant?.attributes || null,
      quantity,
      stockQuantity: selectedVariant?.stockQuantity || availableStock,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pb-24 sm:pb-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-primary">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* ========================================================================= */}
        {/* LEFT: IMAGE GALLERY                                                       */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-50 rounded-3xl overflow-hidden border">
            <Image
              src={product.images[selectedImageIndex]?.url || product.images[0]?.url}
              alt={product.title}
              fill
              priority
              className="object-cover"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                SALE
              </span>
            )}
          </div>

          {/* Thumbnail switcher */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    selectedImageIndex === idx
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img.url} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT: PRODUCT DETAILS & STRICT SIZE PILLS                                */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {product.brand}
              </span>
              <button
                onClick={() =>
                  toggleWishlist({
                    productId: product.id,
                    title: product.title,
                    slug: product.slug,
                    brand: product.brand,
                    price: activePrice,
                    image: product.images[0]?.url || null,
                    inStock: availableStock > 0,
                  })
                }
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${inWishlist ? "fill-red-500 text-red-500" : ""}`} />
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1 leading-tight">
              {product.title}
            </h1>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 pb-4 border-b">
            <span className="text-3xl font-black text-gray-900">
              {formatBDT(activePrice)}
            </span>
            {hasDiscount && (
              <span className="text-base text-gray-400 line-through">
                {formatBDT(originalPrice)}
              </span>
            )}
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              Inclusive of all VAT
            </span>
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* ========================================================================= */}
          {/* RULE 5: INTERACTIVE SIZE SELECTION PILLS WITH LIVE STOCK                   */}
          {/* ========================================================================= */}
          {hasSizes && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  Select Size {isFootwear ? "(BD / UK)" : "(Apparel)"}
                </span>
                {selectedVariant && (
                  <span className="text-xs font-semibold text-emerald-700">
                    {selectedVariant.stockQuantity > 0
                      ? `In Stock (${selectedVariant.stockQuantity} available)`
                      : "Out of Stock"}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((variant) => {
                  const size = variant.attributes.size;
                  const isSelected = selectedVariantId === variant.id;
                  const isOut = variant.stockQuantity <= 0;

                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      disabled={isOut}
                      className={`min-w-12 h-11 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-white shadow-md shadow-primary/20 scale-105"
                          : isOut
                          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                          : "border-gray-200 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {size.toUpperCase()}
                    </button>
                  );
                })}
              </div>

              {!selectedVariantId && (
                <p className="text-xs text-amber-600 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Please choose a size to check stock and enable Add to Cart
                </p>
              )}
            </div>
          )}

          {/* Electronics Watch Gender Selection (if watch) */}
          {isElectronics && product.variants.some((v) => v.attributes.gender) && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Target Edition
              </span>
              <div className="flex gap-2.5">
                {product.variants.map((variant) => {
                  const gender = variant.attributes.gender;
                  const isSelected = selectedVariantId === variant.id;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all capitalize ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"
                      }`}
                    >
                      {gender} Edition
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector & Add to Cart Button */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center border-2 rounded-xl p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold">{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity(
                      Math.min(
                        selectedVariant?.stockQuantity || availableStock,
                        quantity + 1
                      )
                    )
                  }
                  disabled={quantity >= (selectedVariant?.stockQuantity || availableStock)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 disabled:opacity-30 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add To Cart CTA Button */}
              <button
                onClick={handleAddToCart}
                disabled={hasSizes && !selectedVariantId}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-primary text-white font-bold text-sm sm:text-base hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20 transition-all"
              >
                <ShoppingBag className="w-5 h-5" />
                {hasSizes && !selectedVariantId ? "Select Size First" : "Add to Cart"}
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RULE 7: BANGLADESHI TIERED DELIVERY NOTICE                                */}
          {/* ========================================================================= */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
              <Truck className="w-4 h-4 text-primary" />
              <span>Bangladeshi Logistics & Delivery Fees</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1 border-t">
              <div>
                <strong>Inside Dhaka:</strong> Flat ৳60 (24–48h)
              </div>
              <div>
                <strong>Outside Dhaka:</strong> Flat ৳120 (3–5 days)
              </div>
            </div>
            <p className="text-[11px] text-gray-500">
              Delivering to all 64 districts nationwide • Cash on Delivery & Stripe Cards available
            </p>
          </div>

          {/* Full Description */}
          <div className="pt-6 border-t space-y-2">
            <h3 className="text-sm font-bold text-gray-900">Product Description</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl z-40 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-gray-500 font-bold uppercase block">
            {selectedVariant ? `Size ${selectedVariant.attributes.size?.toUpperCase()}` : "Price"}
          </span>
          <span className="text-base font-black text-gray-900">
            {formatBDT(activePrice * quantity)}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={hasSizes && !selectedVariantId}
          className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-40 shadow-md shadow-primary/20 transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          {hasSizes && !selectedVariantId ? "Select Size Above" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
