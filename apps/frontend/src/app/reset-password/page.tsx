"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[@$!%*?&#^()_-]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const isMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Password reset token is missing. Please request a new link.");
      return;
    }

    if (!isPasswordValid) {
      toast.error("Please meet all password requirements.");
      return;
    }

    if (!isMatch) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post("/auth/reset-password", {
        token: token.trim(),
        newPassword,
      });

      setIsSuccess(true);
      toast.success("Your password has been reset successfully!");
    } catch (err) {
      toast.error(
        getFriendlyErrorMessage(
          err,
          "Password reset failed. The link may be invalid or expired."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-gray-50/50">
        <div className="w-full max-w-md bg-white border rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Invalid Reset Link</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            This password reset link is missing a security token or is malformed. Please request a new link.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm font-bold rounded-xl transition-colors"
          >
            <span>Request New Reset Link</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-gray-50/50">
      <div className="w-full max-w-md bg-white border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Please enter and confirm your new secure password below.
          </p>
        </div>

        {isSuccess ? (
          /* Success View */
          <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-emerald-950">
                  Password Reset Complete!
                </h3>
                <p className="text-xs text-emerald-700 mt-1">
                  Your account password has been successfully updated. All active sessions have been securely refreshed.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full py-3 px-4 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Sign In to Your Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Reset Password Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-10 pr-10 bg-gray-50 border rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-primary transition-colors"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-400 hover:text-gray-600 absolute right-2.5 top-2.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-10 bg-gray-50 border rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-primary transition-colors"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
              {confirmPassword.length > 0 && !isMatch && (
                <p className="text-[11px] font-bold text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Password Requirement Checklist */}
            <div className="bg-gray-50 border rounded-2xl p-3.5 space-y-1.5 text-[11px]">
              <p className="font-bold text-gray-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Password Requirements:
              </p>
              <div className="grid grid-cols-2 gap-1 text-gray-500">
                <span className={hasMinLength ? "text-emerald-600 font-bold" : ""}>
                  • 8+ characters
                </span>
                <span className={hasUpper ? "text-emerald-600 font-bold" : ""}>
                  • Uppercase letter
                </span>
                <span className={hasLower ? "text-emerald-600 font-bold" : ""}>
                  • Lowercase letter
                </span>
                <span className={hasNumber ? "text-emerald-600 font-bold" : ""}>
                  • Number (0-9)
                </span>
                <span className={hasSpecial ? "text-emerald-600 font-bold col-span-2" : "col-span-2"}>
                  • Special character (@, $, !, %, *, ?, #, &)
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid || !isMatch}
              className="w-full py-3 px-4 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs text-gray-500">Loading password reset...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
