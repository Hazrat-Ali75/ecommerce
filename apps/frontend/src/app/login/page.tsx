"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { getFriendlyErrorMessage } from "@/lib/error-utils";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const { setAuth } = useAuthStore();
  const syncCart = useCartStore((state) => state.syncWithBackend);
  const syncWishlist = useWishlistStore((state) => state.syncWithBackend);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post("/auth/login", { email, password });
      const { user, accessToken } = res.data;

      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.name}!`);

      // Sync guest cart & wishlist with backend
      await Promise.all([syncCart(), syncWishlist()]);

      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      toast.error(
        getFriendlyErrorMessage(err, "Unable to sign in. Please verify your email and password.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white border rounded-3xl p-8 shadow-xs space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl mx-auto mb-3">
            ব
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Sign In</h1>
          <p className="text-xs text-gray-500">
            {redirectUrl === "/checkout"
              ? "Sign in to complete your checkout and delivery details"
              : "Access your orders, saved addresses, and wishlist"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 pl-10 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">Password</label>
              <Link href="/forgot-password" className="text-[11px] font-semibold text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pl-10 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
          >
            {loading ? "Signing in..." : "Sign In to BanglaCart"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t text-xs text-gray-500">
          Don’t have an account?{" "}
          <Link
            href={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"}
            className="font-bold text-primary hover:underline"
          >
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto p-12 text-center">Loading sign in...</div>}>
      <LoginContent />
    </Suspense>
  );
}
