"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { formatBDT } from "@/lib/currency";

interface SearchProductResult {
  id: string;
  title: string;
  slug: string;
  brand: string;
  basePrice: number;
  discountPrice: number | null;
  images: Array<{ url: string; isPrimary: boolean }>;
  category: { name: string; slug: string };
}

export function SearchAutocomplete() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProductResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get(`/products?search=${encodeURIComponent(query.trim())}&limit=5`);
        setResults(res.data?.products || []);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search authentic Panjabis, Sneakers, Gadgets, Brands..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            className="w-full bg-gray-100 hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/40 rounded-full py-2.5 pl-11 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition-all shadow-xs focus:ring-4 focus:ring-primary/10 focus:outline-hidden"
          />

          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />

          {isLoading ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setIsOpen(false);
              }}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </form>

      {/* Live Autocomplete Results Dropdown */}
      {isOpen && (query.trim().length >= 2 || results.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
          {results.length > 0 ? (
            <div>
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b">
                Products ({results.length})
              </div>
              <div className="divide-y divide-gray-50">
                {results.map((product) => {
                  const image =
                    product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url;
                  const price = product.discountPrice ? Number(product.discountPrice) : Number(product.basePrice);

                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl transition-colors group"
                    >
                      <div className="relative w-11 h-11 bg-gray-100 rounded-lg overflow-hidden shrink-0 border">
                        {image && (
                          <Image
                            src={image}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-primary uppercase">{product.brand}</span>
                          <span className="text-[10px] text-gray-400">• {product.category.name}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-gray-900 truncate group-hover:text-primary">
                          {product.title}
                        </h4>
                      </div>
                      <span className="text-xs font-extrabold text-gray-900 shrink-0">
                        {formatBDT(price)}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 border-t mt-1">
                <Link
                  href={`/shop?search=${encodeURIComponent(query.trim())}`}
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  View all results for &quot;{query.trim()}&quot;
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : !isLoading ? (
            <div className="p-6 text-center text-xs text-gray-500">
              No products found for &quot;<strong>{query.trim()}</strong>&quot;.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
