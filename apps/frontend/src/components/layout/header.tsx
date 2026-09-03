"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useAuthStore } from "@/store/auth-store";
import { SearchAutocomplete } from "./search-autocomplete";
import {
  ShoppingBag,
  Heart,
  Menu,
  X,
  LogOut,
  Package,
  ShieldAlert,
  Compass,
  ChevronRight,
  Truck,
} from "lucide-react";

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { openCart, totalItems } = useCartStore();
  const wishlistItems = useWishlistStore((state) => state.items);
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close desktop dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-6">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-xs">
                  ব
                </div>
                <span className="text-lg sm:text-xl font-black tracking-tight text-gray-900">
                  Bangla<span className="text-primary">Cart</span>
                </span>
              </Link>

              {/* Shop Link */}
              <Link
                href="/shop"
                className="hidden md:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-700 hover:text-primary transition-colors py-1.5 px-3 rounded-xl hover:bg-gray-50"
              >
                <Compass className="w-4 h-4 text-primary" />
                Shop All
              </Link>
            </div>

            {/* Centered Search Bar (Desktop & Tablet) */}
            <div className="flex-1 max-w-xl px-2 hidden sm:block">
              <SearchAutocomplete />
            </div>

            {/* Right Action Icons (Wishlist, Cart, User) */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Wishlist Link */}
              <Link
                href="/wishlist"
                className="relative p-2 sm:p-2.5 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {mounted && wishlistItems.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-secondary text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Cart Drawer Trigger */}
              <button
                onClick={openCart}
                className="relative p-2 sm:p-2.5 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
                aria-label="Open Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {mounted && totalItems() > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                    {totalItems()}
                  </span>
                )}
              </button>

              {/* User Account / Auth Dropdown */}
              {mounted && isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
                    aria-label="User profile menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center ring-2 ring-primary/20">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {/* Dropdown: Mobile Bottom Sheet & Desktop Popover */}
                  {userMenuOpen && (
                    <>
                      {/* Mobile Backdrop */}
                      <div
                        className="fixed inset-0 bg-black/50 z-50 md:hidden"
                        onClick={() => setUserMenuOpen(false)}
                      />

                      {/* Popover Card */}
                      <div className="fixed md:absolute bottom-0 md:bottom-auto left-0 md:left-auto right-0 md:right-0 md:top-full md:mt-2 w-full md:w-64 bg-white rounded-t-3xl md:rounded-2xl shadow-2xl md:shadow-xl border border-gray-100 p-4 sm:p-2 z-50 animate-in fade-in slide-in-from-bottom-6 md:slide-in-from-top-2 duration-200">
                        <div className="p-3 bg-gray-50 rounded-xl mb-2 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary text-white font-black text-sm flex items-center justify-center shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                            <Link
                              href="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <ShieldAlert className="w-4 h-4" />
                                <span>Admin Dashboard</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-primary/60" />
                            </Link>
                          )}

                          <Link
                            href="/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span>My Orders</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </Link>

                          <Link
                            href="/track"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Truck className="w-4 h-4 text-gray-400" />
                              <span>Track Order</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </Link>

                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-2.5 p-2.5 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Log Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-xs"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search Input (Visible on phones below top bar) */}
          <div className="sm:hidden pb-3">
            <SearchAutocomplete />
          </div>

          {/* 100% Solid, Opaque Mobile Dropdown Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white shadow-2xl relative z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-4 space-y-3">
                <nav className="flex flex-col space-y-1">
                  <Link
                    href="/shop"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-sm font-bold text-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <Compass className="w-5 h-5 text-primary" />
                      <span>Browse All Products</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>

                  <Link
                    href="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-sm font-bold text-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-secondary" />
                      <span>Saved Wishlist</span>
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                      ({mounted ? wishlistItems.length : 0})
                    </span>
                  </Link>

                  <Link
                    href="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-sm font-bold text-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                      <span>Shopping Cart</span>
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                      ({mounted ? totalItems() : 0})
                    </span>
                  </Link>

                  <Link
                    href="/track"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm font-bold text-gray-800 border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-primary" />
                      <span>Track Your Order</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </nav>

                {/* Bottom Auth area */}
                <div className="border-t border-gray-100 pt-3">
                  {!mounted || !isAuthenticated ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-2.5 px-3 bg-gray-100 text-gray-800 text-xs font-bold rounded-xl text-center hover:bg-gray-200"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-2.5 px-3 bg-primary text-white text-xs font-bold rounded-xl text-center shadow-xs hover:bg-primary/90"
                      >
                        Register
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-primary bg-primary/5"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            <span>Admin Dashboard</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-primary/60" />
                        </Link>
                      )}
                      <Link
                        href="/orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-gray-800 bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-500" />
                          <span>My Orders</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          logout();
                        }}
                        className="w-full py-2.5 px-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 hover:bg-red-100"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Dimmed backdrop over page/carousel when mobile menu is open */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
