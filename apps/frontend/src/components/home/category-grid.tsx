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
    <section className="py-12">
      <div className="flex items-end justify-between mb-6 gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-lg md:text-xl font-extrabold text-gray-900 tracking-tight truncate">
            Explore Categories
          </h2>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary hover:underline shrink-0 pb-0.5 whitespace-nowrap"
        >
          <span>View All</span>
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/shop?category=${cat.slug}`}
            className="group relative h-80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <Image
              src={cat.image}
              alt={cat.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />

            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <span className="text-[11px] font-bold tracking-wider uppercase text-secondary mb-1">
                {cat.tag}
              </span>
              <h3 className="text-xl font-bold text-white mb-1">{cat.title}</h3>
              <p className="text-xs text-gray-300 mb-4">{cat.subtitle}</p>

              <div className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/20 backdrop-blur-md px-3.5 py-2 rounded-lg w-fit group-hover:bg-primary transition-colors">
                Explore Now
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
