import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function CategoryGrid() {
  const categories = [
    {
      title: "Fashion & Apparel",
      subtitle: "Men, Women & Kids",
      slug: "fashion-apparel",
      image:
        "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop",
      tag: "Traditional & Modern",
    },
    {
      title: "Footwear & Sneakers",
      subtitle: "Sizes 5 to 10 in Stock",
      slug: "footwear-sneakers",
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
      tag: "Apex, Bata & Lotto",
    },
    {
      title: "Electronics & Gadgets",
      subtitle: "Watches, Chargers & TWS",
      slug: "electronics-gadgets",
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
      tag: "Official Warranty",
    },
  ];

  return (
    <section className="py-6">
      <div className="flex items-end justify-between mb-6 gap-2 border-b pb-4">
        <div>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary block mb-1">
            Curated Bangladeshi Collections
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Shop by Category
          </h2>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-emerald-700 transition-colors pb-1 group"
        >
          <span>View All Products</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/shop?category=${cat.slug}`}
            className="group relative h-80 sm:h-96 rounded-3xl overflow-hidden shadow-xs hover:shadow-card-hover transition-all duration-500 border border-gray-100"
          >
            <Image
              src={cat.image}
              alt={cat.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/40 to-transparent" />

            <div className="absolute inset-0 p-6 sm:p-7 flex flex-col justify-end">
              <span className="inline-block w-fit px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                {cat.tag}
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1.5 group-hover:text-emerald-300 transition-colors">
                {cat.title}
              </h3>
              <p className="text-xs text-gray-300 mb-4">{cat.subtitle}</p>

              <div className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl w-fit group-hover:bg-primary group-hover:text-white transition-all shadow-xs">
                <span>Explore Collection</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
