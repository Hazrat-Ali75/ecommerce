"use client";

import { useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import { Mail, ArrowLeft, CheckCircle2, ArrowRight, ShieldCheck, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      await apiClient.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setSubmittedEmail(email.trim().toLowerCase());
      toast.success("Password reset link dispatched!");

      // 30-second cooldown
      setCooldown(30);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error(
        getFriendlyErrorMessage(
          err,
          "Failed to process your request. Please check your email and try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (cooldown > 0 || !submittedEmail) return;
    setEmail(submittedEmail);
    setSubmittedEmail(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-stone-50/50">
      <div className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-9 shadow-card space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Mail className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Account Security</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
            Forgot Password?
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-xs mx-auto leading-relaxed">
            Enter your registered email address and we&apos;ll send you a secure link to reset your BanglaShop password.
          </p>
        </div>

        {submittedEmail ? (
          /* Confirmation State */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-5 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Check Your Inbox
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  We sent a secure password reset link to:
                </p>
                <p className="text-xs font-mono font-bold text-emerald-900 mt-1 break-all bg-white py-1 px-2 rounded-lg border border-emerald-200 inline-block">
                  {submittedEmail}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-stone-600 bg-stone-50 rounded-2xl p-4 border border-stone-200">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>The link will expire in <strong>1 hour</strong> for security reasons.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>If you don&apos;t see the message, please check your spam or junk folder.</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0}
                className="w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
              >
                {cooldown > 0
                  ? `Resend available in ${cooldown}s`
                  : "Didn't receive email? Try again"}
              </button>

              <Link
                href="/login"
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Request Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Account Email Address *
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-3 border-t border-stone-100">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
