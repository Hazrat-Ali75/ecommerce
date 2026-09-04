import Link from "next/link";
import { Truck, ShieldCheck, Banknote, Clock, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-gray-800">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">৳60 / ৳120 Delivery</h4>
              <p className="text-[11px] sm:text-xs text-gray-400">Dhaka 24-48h, Nationwide 3-5d</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">Cash on Delivery</h4>
              <p className="text-[11px] sm:text-xs text-gray-400">Pay at your doorstep</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">100% Authentic</h4>
              <p className="text-[11px] sm:text-xs text-gray-400">Original brand guarantee</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">Live Tracking</h4>
              <p className="text-[11px] sm:text-xs text-gray-400">Track order by number & phone</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10">
          {/* Brand Info */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">
                ব
              </div>
              <span className="text-lg font-bold text-white">BanglaCart</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Bangladesh’s premier online shopping destination for genuine Fashion & Apparel, Footwear, and Smart Electronics.
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Gulshan-2, Dhaka-1212, Bangladesh</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>+880 1700-000000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>support@banglacart.com</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h5 className="text-sm font-bold text-white mb-4">Shop Categories</h5>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link href="/shop?category=fashion-apparel" className="hover:text-white transition-colors">
                  Fashion & Apparel (Men, Women, Kids)
                </Link>
              </li>
              <li>
                <Link href="/shop?category=footwear-sneakers" className="hover:text-white transition-colors">
                  Footwear & Sneakers (Sizes 5–10)
                </Link>
              </li>
              <li>
                <Link href="/shop?category=electronics-gadgets" className="hover:text-white transition-colors">
                  Smartwatches & Wearables
                </Link>
              </li>
              <li>
                <Link href="/shop?category=electronics-gadgets" className="hover:text-white transition-colors">
                  Fast Chargers & Power Banks
                </Link>
              </li>
              <li>
                <Link href="/shop?category=electronics-gadgets" className="hover:text-white transition-colors">
                  TWS Earbuds & Audio
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h5 className="text-sm font-bold text-white mb-4">Customer Care</h5>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link href="/track" className="hover:text-white transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  View Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-white transition-colors">
                  Shipping & Delivery Info
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Logistics */}
          <div>
            <h5 className="text-sm font-bold text-white mb-4">Payment & Logistics</h5>
            <p className="text-xs text-gray-400 mb-3">
              We deliver to all 64 districts across Bangladesh with verified delivery partners.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
              <span className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">
                Cash on Delivery
              </span>
              <span className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">
                Stripe Cards
              </span>
              <span className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">
                Visa / MasterCard
              </span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 mt-4 border-t border-gray-800 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} BanglaCart. Built with Next.js 16, NestJS 12, and PostgreSQL. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
