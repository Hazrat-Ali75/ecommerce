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
            <div className="flex items-end justify-between gap-2 border-b pb-4">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary block mb-1">
                  Festive & Everyday Elegance
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Authentic Bangladeshi Fashion
                </h2>
              </div>
              <Link
                href="/shop?category=fashion-apparel"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-emerald-700 transition-colors pb-1 group"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
            <div className="flex items-end justify-between gap-2 border-b pb-4">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary block mb-1">
                  Genuine Leather & Sport
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Trending Footwear & Sneakers
                </h2>
              </div>
              <Link
                href="/shop?category=footwear-sneakers"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-emerald-700 transition-colors pb-1 group"
              >
                <span>Browse All Shoes</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
            <div className="flex items-end justify-between gap-2 border-b pb-4">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary block mb-1">
                  100% Original Sourced
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Electronics & Smart Gadgets
                </h2>
              </div>
              <Link
                href="/shop?category=electronics-gadgets"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-emerald-700 transition-colors pb-1 group"
              >
                <span>View All Gadgets</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
        <section className="bg-gradient-to-r from-emerald-900 via-primary to-emerald-950 text-white rounded-3xl p-6 sm:p-10 md:p-12 relative overflow-hidden shadow-xl border border-emerald-800/50">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-xl space-y-3 sm:space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-emerald-200 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              Nationwide Delivery Network
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              Delivering to all 64 districts across Bangladesh
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Inside Dhaka <span className="font-bold text-white">৳60</span> (24–48 hours) • Outside Dhaka{" "}
              <span className="font-bold text-white">৳120</span> (3–5 days). Enjoy seamless Cash on Delivery and live consignment tracking.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/track"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-950 text-xs sm:text-sm font-bold hover:bg-gray-100 transition-colors shadow-md"
              >
                <span>Track Your Parcel</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-colors"
              >
                <span>Explore Catalog</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
