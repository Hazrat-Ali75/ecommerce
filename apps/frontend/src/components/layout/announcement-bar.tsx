"use client";

import { Truck, ShieldCheck, Banknote } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 text-xs sm:text-sm font-medium">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-secondary shrink-0" />
          <span>
            <strong>Fast Delivery:</strong> Inside Dhaka ৳60 (24–48h) • Outside Dhaka ৳120 (3–5 days across 64 districts)
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs text-primary-foreground/90">
          <span className="flex items-center gap-1">
            <Banknote className="w-3.5 h-3.5 text-secondary" />
            Cash on Delivery Available
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
            100% Authentic Products
          </span>
        </div>
      </div>
    </div>
  );
}
