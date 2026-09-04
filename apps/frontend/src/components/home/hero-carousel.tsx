"use client";

import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string | null;
  badgeText: string | null;
  imageUrl: string;
  linkUrl: string;
}

const DEFAULT_BANNERS: BannerItem[] = [
  {
    id: "1",
    title: "Festive Collection & Eid Grand Sale",
    subtitle: "Up to 50% off on exquisite Jamdani Silk Sarees, Embroidered Cotton Panjabi, and Festive Kurtas.",
    badgeText: "Aarong & Yellow • Festive 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=85&w=1920&auto=format&fit=crop",
    linkUrl: "/shop?category=fashion-apparel",
  },
  {
    id: "2",
    title: "Premium Footwear & Sneakers",
    subtitle: "Genuine leather loafers, running sneakers, and comfort slip-ons. Sizes 5 to 10 in stock with nationwide COD.",
    badgeText: "Apex, Bata & Lotto • 100% Original",
    imageUrl:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=85&w=1920&auto=format&fit=crop",
    linkUrl: "/shop?category=footwear-sneakers",
  },
  {
    id: "3",
    title: "Next-Gen Smart Gadgets & Audio",
    subtitle: "AMOLED smartwatches, 65W GaN fast chargers, 100W power banks, and ANC wireless earbuds with official warranty.",
    badgeText: "Anker, Xiaomi & Haylou • Official",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=85&w=1920&auto=format&fit=crop",
    linkUrl: "/shop?category=electronics-gadgets",
  },
];

export function HeroCarousel({ initialBanners }: { initialBanners?: BannerItem[] }) {
  const banners = initialBanners && initialBanners.length > 0 ? initialBanners : DEFAULT_BANNERS;
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 25 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();

    // Auto-advance every 5.5s
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5500);

    return () => clearInterval(interval);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative w-full overflow-hidden bg-gray-900 group shadow-lg">
      <div className="overflow-hidden w-full" ref={emblaRef}>
        <div className="flex w-full">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="relative flex-[0_0_100%] min-w-0 w-full h-[380px] sm:h-[480px] md:h-[560px]"
            >
              {/* Crisp, Vibrant Full-Resolution Background Image */}
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                priority={index === 0}
                className="object-cover opacity-90 brightness-95 group-hover:scale-102 transition-transform duration-1000 ease-out"
              />

              {/* Sophisticated Left Gradient to Keep Right Image Crystal Clear */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-950/45 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-black/20" />

              {/* Text Container with generous side padding to stay clear of navigation arrows */}
              <div className="relative h-full max-w-7xl mx-auto px-10 sm:px-16 lg:px-20 flex flex-col justify-center">
                {selectedIndex === index ? (
                  <div
                    key={`${banner.id}-${selectedIndex}`}
                    className="max-w-[260px] xs:max-w-[290px] sm:max-w-md md:max-w-xl space-y-2 sm:space-y-3"
                  >
                    {banner.badgeText && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary text-white text-[9px] sm:text-xs font-bold uppercase tracking-wider shadow-md w-fit">
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-secondary" />
                        {banner.badgeText}
                      </div>
                    )}

                    <h1 className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both ease-out font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                      {banner.title}
                    </h1>

                    {banner.subtitle && (
                      <p className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both ease-out text-xs sm:text-sm md:text-base text-white/90 font-medium leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] line-clamp-2 sm:line-clamp-none">
                        {banner.subtitle}
                      </p>
                    )}

                    <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-450 fill-mode-both ease-out pt-2 sm:pt-3">
                      <Link
                        href={banner.linkUrl}
                        className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-primary text-white text-xs sm:text-sm font-bold hover:brightness-110 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-emerald-950/40 w-fit"
                      >
                        <span>Explore Collection</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[260px] xs:max-w-[290px] sm:max-w-md md:max-w-xl space-y-2 opacity-0 pointer-events-none">
                    <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                      {banner.title}
                    </h1>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-80 sm:opacity-70 sm:group-hover:opacity-100 transition-all duration-200 shadow-xl"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <button
        onClick={scrollNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-80 sm:opacity-70 sm:group-hover:opacity-100 transition-all duration-200 shadow-xl"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* Pagination Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => emblaApi?.scrollTo(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              selectedIndex === idx
                ? "w-9 bg-primary shadow-md shadow-primary/40 ring-2 ring-white/50"
                : "w-2.5 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to banner slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
