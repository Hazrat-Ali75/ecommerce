import Link from "next/link";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { CategoryGrid } from "@/components/home/category-grid";
import { TrustSignals } from "@/components/home/trust-signals";
import { ProductCard } from "@/components/products/product-card";
import { ReviewShowcase } from "@/components/home/review-showcase";
import { ArrowRight, Sparkles, Zap, ShieldCheck, Flame } from "lucide-react";

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
async function getHomeData() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  try {
    const [fashionRes, footwearRes, electronicsRes, bannersRes] = await Promise.allSettled([
      fetch(`${apiUrl}/products?categorySlug=fashion-apparel&isFeatured=true&limit=4`, { next: { revalidate: 60 } }),
      fetch(`${apiUrl}/products?categorySlug=footwear-sneakers&isFeatured=true&limit=4`, { next: { revalidate: 60 } }),
      fetch(`${apiUrl}/products?categorySlug=electronics-gadgets&isFeatured=true&limit=4`, { next: { revalidate: 60 } }),
      fetch(`${apiUrl}/banners`, { next: { revalidate: 300 } }),
    ]);

    const fashion = fashionRes.status === "fulfilled" && fashionRes.value.ok ? await fashionRes.value.json() : null;
    const footwear = footwearRes.status === "fulfilled" && footwearRes.value.ok ? await footwearRes.value.json() : null;
    const electronics = electronicsRes.status === "fulfilled" && electronicsRes.value.ok ? await electronicsRes.value.json() : null;
    const banners = bannersRes.status === "fulfilled" && bannersRes.value.ok ? await bannersRes.value.json() : null;

    return {
      fashionProducts: (fashion?.products || []).slice(0, 4),
      footwearProducts: (footwear?.products || []).slice(0, 4),
      electronicsProducts: (electronics?.products || []).slice(0, 4),
      banners: banners || [],
    };
  } catch {
    return {
      fashionProducts: [],
      footwearProducts: [],
      electronicsProducts: [],
      banners: [],
    };
  }
}

export default async function HomePage() {
  const { fashionProducts, footwearProducts, electronicsProducts, banners } = await getHomeData();

  return (
    <div className="w-full space-y-12 pb-16">
      {/* 1. FULL WIDTH HERO CAROUSEL */}
      <section className="w-full overflow-hidden">
        <HeroCarousel initialBanners={banners.length > 0 ? banners : undefined} />
      </section>

      {/* CONSTRAINED CONTAINER FOR CONTENT SECTIONS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* 2. TRUST SIGNALS (BANGLADESHI MARKET INVARIANTS) */}
        <TrustSignals />

        {/* 3. CATEGORY SHOWCASE CARDS */}
        <CategoryGrid />

        {/* 4. FEATURED BANGLADESHI FASHION */}
        {fashionProducts.length > 0 && (
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-lg md:text-xl font-extrabold text-gray-900 tracking-tight truncate">
                  Authentic Bangladeshi Fashion
                </h2>
              </div>
              <Link
                href="/shop?category=fashion-apparel"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary hover:underline shrink-0 pb-0.5 whitespace-nowrap"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              {fashionProducts.slice(0, 4).map((p: ProductItem) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </section>
        )}

        {/* 5. TRENDING FOOTWEAR & SNEAKERS */}
        {footwearProducts.length > 0 && (
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-lg md:text-xl font-extrabold text-gray-900 tracking-tight truncate">
                  Trending Footwear & Sneakers
                </h2>
              </div>
              <Link
                href="/shop?category=footwear-sneakers"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary hover:underline shrink-0 pb-0.5 whitespace-nowrap"
              >
                <span>Browse All Shoes</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              {footwearProducts.slice(0, 4).map((p: ProductItem) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </section>
        )}

        {/* 6. SMART ELECTRONICS & GADGETS */}
        {electronicsProducts.length > 0 && (
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-lg md:text-xl font-extrabold text-gray-900 tracking-tight truncate">
                  Electronics & Smart Gadgets
                </h2>
              </div>
              <Link
                href="/shop?category=electronics-gadgets"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary hover:underline shrink-0 pb-0.5 whitespace-nowrap"
              >
                <span>View All Gadgets</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              {electronicsProducts.slice(0, 4).map((p: ProductItem) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </section>
        )}

        {/* 7. ATTRACTIVE CUSTOMER REVIEWS & TESTIMONIAL SHOWCASE */}
        <ReviewShowcase />

        {/* 8. BANGLADESH LOGISTICS & ORDER TRACKING BANNER */}
        <section className="bg-primary text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-xl space-y-2.5 sm:space-y-3.5">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-secondary block">
              Nationwide Reliable Delivery
            </span>
            <h2 className="text-base sm:text-2xl md:text-3xl font-extrabold leading-snug">
              Delivering across all 64 districts in Bangladesh
            </h2>
            <p className="text-[11px] sm:text-xs text-white/85 leading-relaxed">
              Inside Dhaka ৳60 (24–48 hours) • Outside Dhaka ৳120 (3–5 days). Track your order status in real time anytime using your order number.
            </p>
            <div className="pt-1.5 flex flex-wrap gap-2.5">
              <Link
                href="/track"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-white text-primary text-[11px] sm:text-xs font-bold hover:bg-gray-100 transition-colors shadow-xs"
              >
                <span>Track Your Parcel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-primary-foreground/15 border border-white/25 text-white text-[11px] sm:text-xs font-semibold hover:bg-primary-foreground/25 transition-colors"
              >
                <span>Start Shopping</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
