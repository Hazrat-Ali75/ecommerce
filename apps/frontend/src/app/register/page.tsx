"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { toast } from "sonner";
import { Lock, Mail, User, Phone, ArrowRight } from "lucide-react";
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
      toast.success("Account created successfully! Welcome to BanglaCart.");

      // Sync guest cart & wishlist
      await Promise.all([syncCart(), syncWishlist()]);

      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      toast.error(
        getFriendlyErrorMessage(err, "Registration could not be completed. Please check your details and try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white border rounded-3xl p-8 shadow-xs space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl mx-auto mb-3">
            ব
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create Account</h1>
          <p className="text-xs text-gray-500">
            {redirectUrl === "/checkout"
              ? "Register to complete your delivery order details"
              : "Join BanglaCart for genuine products & fast delivery"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Tanvir Ahmed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 pl-10 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
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
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Bangladeshi Mobile Number (Optional)
            </label>
            <div className="relative">
              <input
                type="tel"
                placeholder="01712345678 (11 digits)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 pl-10 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
            <span className="text-[11px] text-gray-400">11 digits starting with 013-019</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="At least 8 characters"
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
            {loading ? "Creating Account..." : "Create BanglaCart Account"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t text-xs text-gray-500">
          Already have an account?{" "}
          <Link
            href={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"}
            className="font-bold text-primary hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto p-12 text-center">Loading registration...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
