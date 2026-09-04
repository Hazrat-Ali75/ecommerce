import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10">
          {/* Brand Info */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-800 to-primary flex items-center justify-center text-white font-black text-lg shadow-xs">
                ব
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Bangla<span className="text-emerald-400 font-black">Shop</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Bangladesh’s premier online shopping destination for genuine Fashion & Apparel, Footwear, and Smart Electronics with nationwide fast delivery.
            </p>
            <div className="text-xs text-gray-400 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Gulshan-2, Dhaka-1212, Bangladesh</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>+880 1700-000000 (9 AM – 10 PM)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>support@banglashop.com</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h5 className="text-sm font-bold text-white mb-4">Shop Collections</h5>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <Link href="/shop?category=fashion-apparel" className="hover:text-emerald-300 transition-colors">
                  Fashion & Apparel (Men, Women, Kids)
                </Link>
              </li>
              <li>
                <Link href="/shop?category=footwear-sneakers" className="hover:text-emerald-300 transition-colors">
                  Footwear & Sneakers (Sizes 5–10)
                </Link>
              </li>
              <li>
                <Link href="/shop?category=electronics-gadgets" className="hover:text-emerald-300 transition-colors">
                  Smartwatches & Wearables
                </Link>
              </li>
              <li>
                <Link href="/shop?category=electronics-gadgets" className="hover:text-emerald-300 transition-colors">
                  Fast Chargers & Power Banks
                </Link>
              </li>
              <li>
                <Link href="/shop?category=electronics-gadgets" className="hover:text-emerald-300 transition-colors">
                  TWS Earbuds & Audio
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h5 className="text-sm font-bold text-white mb-4">Customer Care</h5>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <Link href="/track" className="hover:text-emerald-300 transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-emerald-300 transition-colors">
                  View Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-emerald-300 transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-emerald-300 transition-colors">
                  Shipping & Delivery Rates
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Logistics */}
          <div>
            <h5 className="text-sm font-bold text-white mb-4">Payment & Logistics</h5>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              We deliver across all 64 districts in Bangladesh with reliable courier partners.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
              <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg border border-gray-700/80 text-emerald-400 font-medium">
                Cash on Delivery (COD)
              </span>
              <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg border border-gray-700/80 text-gray-300 font-medium">
                Stripe Cards
              </span>
              <span className="px-2.5 py-1 bg-gray-800/80 rounded-lg border border-gray-700/80 text-gray-300 font-medium">
                Visa / MasterCard
              </span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 mt-4 border-t border-gray-800 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} BanglaShop.All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
