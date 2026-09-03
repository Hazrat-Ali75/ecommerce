import { formatBDT } from "@/lib/currency";
import { ShoppingBag, Truck, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top Banner Ticker */}
      <div className="bg-emerald-800 text-white text-xs font-medium py-2 px-4 text-center">
        ⚡ Free Delivery inside Dhaka on orders over {formatBDT(2000)} | Cash on Delivery Available Across All 64 Districts
      </div>

      {/* Hero Welcome Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800 mb-6">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>Bangladeshi Multi-Category Marketplace</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">
          Welcome to <span className="text-emerald-700">BanglaCart</span>
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
          Shop authentic <strong>Fashion & Apparel</strong>, <strong>Footwear & Sneakers</strong>, and <strong>Electronics & Gadgets</strong> with Cash on Delivery nationwide.
        </p>

        {/* 3 Main Categories Preview Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Category 01</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Fashion & Apparel</h3>
            <p className="text-sm text-slate-500 mt-2">Men, Women & Kids collections with sizes S through XXL.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Category 02</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Footwear & Sneakers</h3>
            <p className="text-sm text-slate-500 mt-2">Men, Women & Kids shoes with sizes 5 through 10.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Category 03</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Electronics & Gadgets</h3>
            <p className="text-sm text-slate-500 mt-2">Watches (Men & Women), Chargers, Power Banks, and Earbuds.</p>
          </div>
        </div>

        {/* Value Prop Badges */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-white border border-slate-100 flex flex-col items-center">
            <Truck className="w-6 h-6 text-emerald-600 mb-2" />
            <span className="text-sm font-semibold text-slate-800">Inside Dhaka {formatBDT(60)}</span>
            <span className="text-xs text-slate-500">24–48 Hours Delivery</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-100 flex flex-col items-center">
            <Truck className="w-6 h-6 text-blue-600 mb-2" />
            <span className="text-sm font-semibold text-slate-800">Outside Dhaka {formatBDT(120)}</span>
            <span className="text-xs text-slate-500">All 64 Districts (3-5 Days)</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-100 flex flex-col items-center">
            <ShoppingBag className="w-6 h-6 text-purple-600 mb-2" />
            <span className="text-sm font-semibold text-slate-800">Cash on Delivery</span>
            <span className="text-xs text-slate-500">Pay at Your Doorstep</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-100 flex flex-col items-center">
            <ShieldCheck className="w-6 h-6 text-rose-600 mb-2" />
            <span className="text-sm font-semibold text-slate-800">Stripe Instant Pay</span>
            <span className="text-xs text-slate-500">Encrypted Card Checkout</span>
          </div>
        </div>
      </div>
    </main>
  );
}
