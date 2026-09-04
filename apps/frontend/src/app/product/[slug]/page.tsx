"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Star,
  Plus,
  Minus,
  AlertCircle,
  Share2,
  CreditCard,
  Ruler,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { ProductReviews } from "@/components/products/product-reviews";

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

const APPAREL_SIZE_ORDER = ["s", "m", "l", "xl", "xxl"];
const FOOTWEAR_SIZE_ORDER = ["5", "6", "7", "8", "9", "10"];

export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-stone-100 rounded-3xl" />
          <div className="space-y-6">
            <div className="h-6 bg-stone-100 rounded-lg w-28" />
            <div className="h-10 bg-stone-100 rounded-xl w-3/4" />
            <div className="h-8 bg-stone-100 rounded-lg w-1/3" />
            <div className="h-20 bg-stone-100 rounded-2xl" />
            <div className="h-12 bg-stone-100 rounded-xl w-1/2" />
            <div className="h-14 bg-stone-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display font-bold text-stone-900 mb-2">Product Not Found</h2>
        <p className="text-sm text-stone-500 mb-6">The product you are looking for is either unavailable or has been moved.</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-700/20"
        >
          Explore BanglaShop Collection
        </Link>
      </div>
    );
  }

  const isFashion = product.category.type === "FASHION";
  const isFootwear = product.category.type === "FOOTWEAR";
  const isElectronics = product.category.type === "ELECTRONICS";
  const hasSizes = isFashion || isFootwear;

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);

  // Active pricing calculation
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
  const savings = hasDiscount ? originalPrice - activePrice : 0;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - activePrice) / originalPrice) * 100) : 0;

  const availableStock = selectedVariant
    ? selectedVariant.stockQuantity
    : product.variants.length > 0
    ? product.variants.reduce((acc, v) => acc + v.stockQuantity, 0)
    : 99;

  const inWishlist = isInWishlist(product.id);

  // Sort variants logically (S, M, L... or 5, 6, 7...)
  const sortedVariants = [...product.variants].sort((a, b) => {
    const sizeA = (a.attributes.size || "").toLowerCase();
    const sizeB = (b.attributes.size || "").toLowerCase();
    const orderList = isFootwear ? FOOTWEAR_SIZE_ORDER : APPAREL_SIZE_ORDER;
    const idxA = orderList.indexOf(sizeA);
    const idxB = orderList.indexOf(sizeB);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return sizeA.localeCompare(sizeB);
  });

  const handleAddToCart = (redirectAfter = false) => {
    if (hasSizes && !selectedVariantId) {
      toast.error("Please select your size before adding to cart");
      return;
    }

    if (isElectronics && product.variants.some((v) => v.attributes.gender) && !selectedVariantId) {
      toast.error("Please select an edition option before adding to cart");
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

    if (redirectAfter) {
      router.push("/checkout");
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const nextImage = () => {
    if (product.images.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product.images.length > 1) {
      setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 sm:pb-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-stone-500 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-emerald-700 transition-colors font-medium">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <Link href="/shop" className="hover:text-emerald-700 transition-colors font-medium">
          Shop
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <Link
          href={`/shop?category=${product.category.slug}`}
          className="hover:text-emerald-700 transition-colors font-medium"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <span className="text-stone-900 font-semibold truncate max-w-[200px] sm:max-w-md">
          {product.title}
        </span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* ========================================================================= */}
        {/* LEFT: IMAGE GALLERY                                                       */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-stone-50 rounded-3xl overflow-hidden border border-stone-200/80 shadow-card group">
            <Image
              src={product.images[selectedImageIndex]?.url || product.images[0]?.url}
              alt={product.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {hasDiscount && (
                <span className="bg-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md tracking-wider uppercase">
                  {discountPercent}% OFF
                </span>
              )}
              {availableStock <= 5 && availableStock > 0 && (
                <span className="bg-amber-500 text-stone-950 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md">
                  Only {availableStock} Left
                </span>
              )}
            </div>

            {/* Next / Prev Navigation Buttons */}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-stone-800 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-stone-800 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail switcher */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                    selectedImageIndex === idx
                      ? "border-emerald-600 ring-2 ring-emerald-600/30 scale-105"
                      : "border-stone-200 opacity-70 hover:opacity-100 hover:border-stone-300"
                  }`}
                  aria-label={`Thumbnail ${idx + 1}`}
                >
                  <Image src={img.url} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT: PRODUCT DETAILS, STRICT SIZE PILLS & CONVERSION                     */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          {/* Header Info */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <Link
                href={`/shop?brand=${encodeURIComponent(product.brand)}`}
                className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors"
              >
                {product.brand}
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-full border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-stone-800 transition-colors"
                  aria-label="Share product"
                >
                  <Share2 className="w-4 h-4" />
                </button>
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
                  className={`p-2.5 rounded-full border transition-all ${
                    inWishlist
                      ? "bg-rose-50 border-rose-200 text-rose-600"
                      : "border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-stone-800"
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? "fill-rose-600 text-rose-600" : ""}`} />
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-stone-900 mt-2 leading-tight tracking-tight">
              {product.title}
            </h1>

            {/* Rating Anchor Link */}
            <div className="mt-2.5 flex items-center gap-3">
              <a
                href="#reviews-section"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-emerald-700 transition-colors group"
              >
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="font-semibold text-stone-700 group-hover:underline">
                  Verified Reviews
                </span>
              </a>
              <span className="text-stone-300">•</span>
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                100% Authentic
              </span>
            </div>
          </div>

          {/* Pricing Block */}
          <div className="bg-stone-50/70 border border-stone-200/80 rounded-2xl p-4 sm:p-5 space-y-2">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                {formatBDT(activePrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base sm:text-lg text-stone-400 line-through">
                    {formatBDT(originalPrice)}
                  </span>
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    Save {formatBDT(savings)} ({discountPercent}% OFF)
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-stone-500">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>All prices inclusive of Bangladesh VAT. Official warranty applicable.</span>
            </div>
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm text-stone-600 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* ========================================================================= */}
          {/* STRICT SIZE PILLS: Fashion & Apparel or Footwear                         */}
          {/* ========================================================================= */}
          {hasSizes && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Select Size {isFootwear ? "(BD / UK)" : "(Apparel)"}
                  </span>
                  <span className="text-xs text-rose-500 font-bold">*</span>
                </div>

                <div className="flex items-center gap-3">
                  {selectedVariant && (
                    <span className="text-xs font-semibold text-emerald-700">
                      {selectedVariant.stockQuantity > 0
                        ? `In Stock (${selectedVariant.stockQuantity} left)`
                        : "Out of Stock"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(true)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Size Guide</span>
                  </button>
                </div>
              </div>

              {/* Sizing Pills */}
              <div className="flex flex-wrap gap-2.5">
                {sortedVariants.map((variant) => {
                  const size = variant.attributes.size || "";
                  const isSelected = selectedVariantId === variant.id;
                  const isOut = variant.stockQuantity <= 0;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      disabled={isOut}
                      className={`min-w-12 h-11 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center border-2 transition-all ${
                        isSelected
                          ? "border-emerald-700 bg-emerald-700 text-white shadow-md shadow-emerald-700/20 scale-105"
                          : isOut
                          ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed line-through opacity-60"
                          : "border-stone-200 bg-white text-stone-800 hover:border-emerald-600 hover:bg-stone-50"
                      }`}
                    >
                      {size.toUpperCase()}
                    </button>
                  );
                })}
              </div>

              {!selectedVariantId && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Please choose a size to check live inventory and enable Add to Cart.</span>
                </p>
              )}
            </div>
          )}

          {/* Electronics Watch Edition Selector */}
          {isElectronics && product.variants.some((v) => v.attributes.gender) && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Target Edition
              </span>
              <div className="flex gap-2.5">
                {product.variants.map((variant) => {
                  const gender = variant.attributes.gender;
                  const isSelected = selectedVariantId === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all capitalize ${
                        isSelected
                          ? "border-emerald-700 bg-emerald-700 text-white shadow-md shadow-emerald-700/20"
                          : "border-stone-200 bg-white text-stone-800 hover:border-emerald-600"
                      }`}
                    >
                      {gender} Edition
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity and Action Buttons */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center border border-stone-200 rounded-2xl p-1 bg-stone-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-white rounded-xl text-stone-600 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-stone-900">{quantity}</span>
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
                  className="p-2 hover:bg-white rounded-xl text-stone-600 disabled:opacity-30 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add To Cart Primary CTA */}
              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                disabled={hasSizes && !selectedVariantId}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-700 text-white font-bold text-sm sm:text-base hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-700/20 transition-all active:scale-[0.99]"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{hasSizes && !selectedVariantId ? "Select Size First" : "Add to Cart"}</span>
              </button>

              {/* Buy Now Direct Checkout */}
              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                disabled={hasSizes && !selectedVariantId}
                className="hidden sm:flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-stone-900 text-white font-bold text-sm sm:text-base hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.99]"
              >
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BANGLADESHI LOGISTICS & REASSURANCE CARD                                  */}
          {/* ========================================================================= */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-950">
              <Truck className="w-4 h-4 text-emerald-700" />
              <span>Bangladeshi Logistics & Delivery Standard</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="bg-white/90 border border-emerald-100 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
                  Inside Dhaka (Capital)
                </span>
                <span className="text-sm font-extrabold text-stone-900">Flat ৳60</span>
                <span className="text-[11px] text-stone-500 block mt-0.5">Estimated 24–48 Hours</span>
              </div>
              <div className="bg-white/90 border border-emerald-100 rounded-2xl p-3">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
                  Outside Dhaka (Nationwide)
                </span>
                <span className="text-sm font-extrabold text-stone-900">Flat ৳120</span>
                <span className="text-[11px] text-stone-500 block mt-0.5">3–5 Days across 64 Districts</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-stone-700 pt-2 border-t border-emerald-100">
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-medium">COD & Stripe Cards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-medium">7-Day Easy Returns</span>
              </div>
            </div>
          </div>

          {/* Full Description */}
          <div className="pt-6 border-t border-stone-200 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
              Product Overview & Specifications
            </h3>
            <div className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line space-y-2">
              {product.description}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CUSTOMER REVIEWS & FEEDBACK                                               */}
      {/* ========================================================================= */}
      <ProductReviews productId={product.id} productTitle={product.title} />

      {/* ========================================================================= */}
      {/* SIZE GUIDE MODAL DIALOG                                                   */}
      {/* ========================================================================= */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-emerald-700" />
                <h3 className="font-display text-xl font-bold text-stone-900">
                  {isFootwear ? "Footwear Size Chart (BD / UK)" : "Apparel Size Chart"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                aria-label="Close size guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isFootwear ? (
              <div className="space-y-3">
                <p className="text-xs text-stone-500">
                  Bangladeshi footwear adheres to standard UK / BD sizing metrics.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-stone-700 font-bold border-b">
                      <tr>
                        <th className="py-2.5 px-3">BD / UK</th>
                        <th className="py-2.5 px-3">EU</th>
                        <th className="py-2.5 px-3">US</th>
                        <th className="py-2.5 px-3">Foot Length</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-600">
                      <tr><td className="py-2 px-3 font-bold text-stone-900">5</td><td className="py-2 px-3">39</td><td className="py-2 px-3">6</td><td className="py-2 px-3">24.5 cm</td></tr>
                      <tr><td className="py-2 px-3 font-bold text-stone-900">6</td><td className="py-2 px-3">40</td><td className="py-2 px-3">7</td><td className="py-2 px-3">25.4 cm</td></tr>
                      <tr><td className="py-2 px-3 font-bold text-stone-900">7</td><td className="py-2 px-3">41</td><td className="py-2 px-3">8</td><td className="py-2 px-3">26.0 cm</td></tr>
                      <tr><td className="py-2 px-3 font-bold text-stone-900">8</td><td className="py-2 px-3">42</td><td className="py-2 px-3">9</td><td className="py-2 px-3">26.8 cm</td></tr>
                      <tr><td className="py-2 px-3 font-bold text-stone-900">9</td><td className="py-2 px-3">43</td><td className="py-2 px-3">10</td><td className="py-2 px-3">27.5 cm</td></tr>
                      <tr><td className="py-2 px-3 font-bold text-stone-900">10</td><td className="py-2 px-3">44</td><td className="py-2 px-3">11</td><td className="py-2 px-3">28.3 cm</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-stone-500">
                  All measurements are in inches. Regular fit tailoring designed for comfort.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-stone-700 font-bold border-b">
                      <tr>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Chest (in)</th>
                        <th className="py-2.5 px-3">Length (in)</th>
                        <th className="py-2.5 px-3">Shoulder (in)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-600">
                      <tr><td className="py-2 px-3 font-bold text-stone-900">S</td><td className="py-2 px-3">36 - 38</td><td className="py-2 px-3">27</td><td className="py-2 px-3">16.5</td></tr>
                      <tr><td className="py-2 px-3 font-bold text-stone-900">M</td><td className="py-2 px-3">38 - 40</td><td className="py-2 px-3">28</td><td className="py-2 px-3">17.5</td></tr>
                      <tr><td className="py-2 px-3 font-bold text-stone-900">L</td><td className="py-2 px-3">40 - 42</td><td className="py-2 px-3">29</td><td className="py-2 px-3">18.5</td></tr>
                      <tr><td className="py-2 px-3 font-bold text-stone-900">XL</td><td className="py-2 px-3">42 - 44</td><td className="py-2 px-3">30</td><td className="py-2 px-3">19.5</td></tr>
                      <tr><td className="py-2 px-3 font-bold text-stone-900">XXL</td><td className="py-2 px-3">44 - 46</td><td className="py-2 px-3">31</td><td className="py-2 px-3">20.5</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
              >
                Close Size Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE STICKY BUY BAR                                                     */}
      {/* ========================================================================= */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3.5 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl z-40 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] text-stone-500 font-bold uppercase block tracking-wider">
            {selectedVariant ? `Size ${selectedVariant.attributes.size?.toUpperCase()}` : "Total"}
          </span>
          <span className="text-base font-extrabold text-stone-900 truncate block">
            {formatBDT(activePrice * quantity)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleAddToCart(false)}
          disabled={hasSizes && !selectedVariantId}
          className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-800 disabled:opacity-40 shadow-md shadow-emerald-700/20 transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{hasSizes && !selectedVariantId ? "Select Size Above" : "Add to Cart"}</span>
        </button>
      </div>
    </div>
  );
}
