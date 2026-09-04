"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { toast } from "sonner";
import { Lock, Mail, User, Phone, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck } from "lucide-react";
import { getFriendlyErrorMessage } from "@/lib/error-utils";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const { setAuth } = useAuthStore();
  const syncCart = useCartStore((state) => state.syncWithBackend);
  const syncWishlist = useWishlistStore((state) => state.syncWithBackend);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Bangladeshi phone regex: 11 digits starting with 013-019
  const bdPhoneRegex = /^01[3-9]\d{8}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (phone.trim() && !bdPhoneRegex.test(phone.trim())) {
      toast.error("Phone number must be a valid 11-digit Bangladeshi mobile number (013-019)");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });

      const { user, accessToken } = res.data;
      setAuth(user, accessToken);
      toast.success("Account created successfully! Welcome to BanglaShop.");

      // Sync guest cart & wishlist
      await Promise.all([syncCart(), syncWishlist()]);

      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      toast.error(
        getFriendlyErrorMessage(
          err,
          "Registration could not be completed. Please check your details and try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-16">
      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-9 shadow-card space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-2xl mx-auto mb-3 shadow-md shadow-emerald-700/20">
            ব
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join BanglaShop</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
            Create Account
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-xs mx-auto">
            {redirectUrl === "/checkout"
              ? "Register to complete your delivery order details"
              : "Join BanglaShop for authentic products & fast nationwide delivery"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Tanvir Ahmed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Bangladeshi Mobile Number (Optional)
            </label>
            <div className="relative">
              <input
                type="tel"
                placeholder="017XXXXXXXX (11 digits)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
              />
              <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              11 digits starting with 013 to 019
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 text-stone-400 hover:text-stone-700 absolute right-3 top-2.5 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create BanglaShop Account"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center border-t border-stone-100 text-xs text-stone-500">
          Already have an account?{" "}
          <Link
            href={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"}
            className="font-bold text-emerald-700 hover:underline"
          >
            Sign in
          </Link>
        </div>

        <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>By continuing, you agree to BanglaShop Terms & Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto p-16 text-center text-xs font-semibold text-stone-500">
          Loading registration...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
