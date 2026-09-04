"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Tags, Package, ShieldCheck, CheckCircle2 } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  type: "FASHION" | "FOOTWEAR" | "ELECTRONICS";
  description?: string | null;
  _count?: { products: number };
}

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useQuery<CategoryItem[]>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await apiClient.get("/categories");
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Categories & Domain Governance</h2>
        <p className="text-xs text-gray-500">
          Core product categories with strict variation invariants
        </p>
      </div>

      {/* Strict Domain Rules Callout */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-emerald-900">Strict Business Rule Invariant</h4>
          <p className="text-xs text-emerald-800">
            Per the marketplace business specification, product variations across this system are strictly confined to these three categories with zero unauthorized attributes. Color, material, RAM, and storage fields are strictly forbidden.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border animate-pulse" />
          ))
        ) : (
          categories.map((cat) => {
            const isFashion = cat.slug === "fashion-apparel";
            const isFootwear = cat.slug === "footwear-sneakers";
            const isElectronics = cat.slug === "electronics-gadgets";

            return (
              <div
                key={cat.id}
                className="bg-white border rounded-2xl p-6 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      {cat.type}
                    </span>
                    <span className="text-xs font-bold text-gray-500 font-mono">
                      {cat._count?.products || 0} Products
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900">{cat.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">{cat.slug}</p>

                  <div className="pt-3 border-t space-y-2">
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                      Permitted Variations:
                    </span>
                    {isFashion && (
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Gender: <strong>men, women, kids</strong></span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Size: <strong>s, m, l, xl, xxl</strong> (PDP only)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Brand: <strong>Text string</strong></span>
                        </li>
                      </ul>
                    )}
                    {isFootwear && (
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Gender: <strong>men, women, kids</strong></span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Shoe Size: <strong>5, 6, 7, 8, 9, 10</strong> (PDP only)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Brand: <strong>Text string</strong></span>
                        </li>
                      </ul>
                    )}
                    {isElectronics && (
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Type: <strong>watch, charger, power bank, earbuds</strong></span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Watch Gender: <strong>men, women</strong></span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Brand: <strong>Text string</strong></span>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between text-xs text-gray-400">
                  <span>System Managed</span>
                  <Tags className="w-4 h-4" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
