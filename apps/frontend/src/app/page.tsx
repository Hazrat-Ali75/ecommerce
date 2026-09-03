import Link from "next/link";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { CategoryGrid } from "@/components/home/category-grid";
import { TrustSignals } from "@/components/home/trust-signals";
import { ProductCard } from "@/components/products/product-card";
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
      fetch(`${apiUrl}/products?categorySlug=fashion-apparel&limit=4`, { next: { revalidate: 60 } }),
      fetch(`${apiUrl}/products?categorySlug=footwear-sneakers&limit=4`, { next: { revalidate: 60 } }),
      fetch(`${apiUrl}/products?categorySlug=electronics-gadgets&limit=4`, { next: { revalidate: 60 } }),
      fetch(`${apiUrl}/banners`, { next: { revalidate: 300 } }),
    ]);

    const fashion = fashionRes.status === "fulfilled" && fashionRes.value.ok ? await fashionRes.value.json() : null;
    const footwear = footwearRes.status === "fulfilled" && footwearRes.value.ok ? await footwearRes.value.json() : null;
    const electronics = electronicsRes.status === "fulfilled" && electronicsRes.value.ok ? await electronicsRes.value.json() : null;
    const banners = bannersRes.status === "fulfilled" && bannersRes.value.ok ? await bannersRes.value.json() : null;

    return {
      fashionProducts: fashion?.products || [],
      footwearProducts: footwear?.products || [],
      electronicsProducts: electronics?.products || [],
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
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Festive & Everyday Style</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Authentic Bangladeshi Fashion
              </h2>
            </div>
            <Link
              href="/shop?category=fashion-apparel"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline"
            >
              Explore Collection
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {fashionProducts.map((p: ProductItem) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}

      {/* 5. TRENDING FOOTWEAR & SNEAKERS */}
      {footwearProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary mb-1">
                <Flame className="w-4 h-4" />
                <span>Sizes 5 to 10 in Stock</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Trending Footwear & Sneakers
              </h2>
            </div>
            <Link
              href="/shop?category=footwear-sneakers"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline"
            >
              Browse All Shoes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {footwearProducts.map((p: ProductItem) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}

      {/* 6. SMART ELECTRONICS & GADGETS */}
      {electronicsProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                <Zap className="w-4 h-4" />
                <span>Fast Charging & Smart Wearables</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Electronics & Smart Gadgets
              </h2>
            </div>
            <Link
              href="/shop?category=electronics-gadgets"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline"
            >
              View All Gadgets
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {electronicsProducts.map((p: ProductItem) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}

      {/* 7. BANGLADESH LOGISTICS & ORDER TRACKING BANNER */}
      <section className="bg-primary text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">
            Nationwide Reliable Delivery
          </span>
          <h2 className="text-2xl sm:text-4xl font-black leading-tight">
            Delivering across all 64 districts in Bangladesh
          </h2>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Inside Dhaka ৳60 (24–48 hours) • Outside Dhaka ৳120 (3–5 days). Track your order status in real time anytime using your order number.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/track"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary text-xs sm:text-sm font-bold hover:bg-gray-100 transition-colors shadow-sm"
            >
              Track Your Parcel
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-foreground/10 border border-white/20 text-white text-xs sm:text-sm font-semibold hover:bg-primary-foreground/20 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
