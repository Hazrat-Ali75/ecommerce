"use client";

import { useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import { Mail, ArrowLeft, CheckCircle2, ArrowRight, ShieldCheck, Clock } from "lucide-react";
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
      toast.success("Password reset instructions sent!");

      // Start 30-second cooldown before allowing re-send
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
          "Failed to process your request. Please try again."
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
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-gray-50/50">
      <div className="w-full max-w-md bg-white border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Forgot Password?
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Enter your registered email address and we&apos;ll send you a secure link to reset your password.
          </p>
        </div>

        {submittedEmail ? (
          /* Confirmation View */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Check Your Inbox
                </h3>
                <p className="text-xs text-emerald-700 mt-1">
                  We sent a password reset link to:
                </p>
                <p className="text-xs font-mono font-bold text-emerald-900 mt-0.5 break-all">
                  {submittedEmail}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-500 bg-gray-50 rounded-2xl p-4 border">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>The link will expire in <strong>1 hour</strong> for security reasons.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>If you don&apos;t see the email, be sure to check your spam or junk folder.</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 text-xs font-bold rounded-xl transition-colors"
              >
                {cooldown > 0
                  ? `Resend available in ${cooldown}s`
                  : "Didn't receive email? Try another email"}
              </button>

              <Link
                href="/login"
                className="w-full py-2.5 px-4 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-xs flex items-center justify-center gap-2"
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
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Account Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-10 bg-gray-50 border rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-primary transition-colors"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
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

            <div className="text-center pt-3 border-t">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
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
