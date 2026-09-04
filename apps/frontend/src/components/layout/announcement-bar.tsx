"use client";

import { Truck, ShieldCheck, Banknote, PhoneCall } from "lucide-react";

export function AnnouncementBar() {
  return (
    <aside
      aria-label="Promotional announcements"
      className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white text-[11px] sm:text-xs font-medium border-b border-emerald-800/40 relative z-50 py-2 px-3 sm:px-6"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Primary Logistics Guarantee */}
        <div className="flex items-center gap-2 truncate">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-700/80 text-emerald-200 shrink-0">
            <Truck className="w-3 h-3 text-emerald-300" />
          </span>
          <p className="truncate">
            <strong className="text-emerald-200 font-bold">Fast Delivery:</strong>{" "}
            Inside Dhaka <span className="font-bold text-white">৳60</span> (24–48h) • Outside Dhaka{" "}
            <span className="font-bold text-white">৳120</span> (3–5 days across 64 districts)
          </p>
        </div>

        {/* Right: Trust & Support Badges */}
        <div className="hidden md:flex items-center gap-5 shrink-0 text-[11px] text-emerald-100/90 font-medium">
          <span className="inline-flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-emerald-300" />
            <span>Cash on Delivery Nationwide</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>100% Authentic Brands</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-200 font-semibold border-l border-emerald-700/60 pl-4">
            <PhoneCall className="w-3 h-3 text-emerald-300" />
            <span>+880 1700-000000</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
