"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit3,
  MessageSquare,
  Loader2,
  Sparkles,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import { toast } from "sonner";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  isVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

interface ProductReviewsProps {
  productId: string;
  productTitle: string;
}

export function ProductReviews({ productId, productTitle }: ProductReviewsProps) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  const [isWriting, setIsWriting] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // 1. Fetch reviews & stats
  const { data, isLoading } = useQuery<{
    reviews: ReviewItem[];
    stats: ReviewStats;
  }>({
    queryKey: ["reviews", productId, filterRating],
    queryFn: async () => {
      const url = filterRating
        ? `/reviews/product/${productId}?rating=${filterRating}`
        : `/reviews/product/${productId}`;
      const res = await apiClient.get(url);
      return res.data;
    },
  });

  // 2. Check user purchase/review status
  const { data: userStatus } = useQuery<{
    hasPurchased: boolean;
    hasReviewed: boolean;
    review: ReviewItem | null;
  }>({
    queryKey: ["user-review-status", productId, user?.id],
    queryFn: async () => {
      if (!isAuthenticated) return { hasPurchased: false, hasReviewed: false, review: null };
      const res = await apiClient.get(`/reviews/user/check/${productId}`);
      return res.data;
    },
    enabled: isAuthenticated,
  });

  // 3. Submit or update review mutation
  const reviewMutation = useMutation({
    mutationFn: async (payload: { rating: number; comment?: string }) => {
      const res = await apiClient.post("/reviews", {
        productId,
        rating: payload.rating,
        comment: payload.comment || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Thank you! Your review has been published.");
      setIsWriting(false);
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["user-review-status", productId] });
    },
    onError: (err: unknown) => {
      toast.error(getFriendlyErrorMessage(err, "Failed to submit your review. Please try again."));
    },
  });

  // 4. Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      await apiClient.delete(`/reviews/${reviewId}`);
    },
    onSuccess: () => {
      toast.info("Your review was deleted.");
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["user-review-status", productId] });
    },
    onError: (err: unknown) => {
      toast.error(getFriendlyErrorMessage(err, "Failed to delete review."));
    },
  });

  const handleOpenWrite = () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to share your customer review");
      return;
    }
    if (userStatus?.review) {
      setSelectedRating(userStatus.review.rating);
      setComment(userStatus.review.comment || "");
    } else {
      setSelectedRating(5);
      setComment("");
    }
    setIsWriting(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRating < 1 || selectedRating > 5) {
      toast.error("Please select a star rating between 1 and 5");
      return;
    }
    reviewMutation.mutate({
      rating: selectedRating,
      comment: comment.trim() || undefined,
    });
  };

  const reviews = data?.reviews || [];
  const stats = data?.stats || {
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };

  const RATING_LABELS: Record<number, string> = {
    5: "5 Stars - Outstanding Experience",
    4: "4 Stars - Very Good Quality",
    3: "3 Stars - Average / Met Expectations",
    2: "2 Stars - Dissatisfied",
    1: "1 Star - Poor Experience",
  };

  return (
    <section id="reviews-section" className="pt-12 sm:pt-16 border-t border-stone-200 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Feedback</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight">
            Verified Customer Reviews ({stats.totalReviews})
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Authentic experiences shared by shoppers across Bangladesh
          </p>
        </div>

        {!isWriting && (
          <button
            type="button"
            onClick={handleOpenWrite}
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-2xl hover:bg-emerald-800 transition-all shadow-md shadow-emerald-700/20 shrink-0 self-start sm:self-auto"
          >
            <Edit3 className="w-4 h-4" />
            <span>{userStatus?.hasReviewed ? "Edit Your Review" : "Write a Review"}</span>
          </button>
        )}
      </div>

      {/* Summary Score & Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-stone-50/80 border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* Left: Big Score (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b lg:border-b-0 lg:border-r border-stone-200/80">
          <div className="text-5xl sm:text-6xl font-display font-extrabold text-stone-900 tracking-tight">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0"}
          </div>
          <div className="flex items-center gap-1 text-amber-500 my-2.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= Math.round(stats.averageRating) ? "fill-current text-amber-500" : "text-stone-300"
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-stone-600">
            {stats.totalReviews > 0
              ? `Overall rating from ${stats.totalReviews} verified ${stats.totalReviews === 1 ? "review" : "reviews"}`
              : "No customer reviews yet"}
          </p>

          {userStatus?.hasPurchased && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>You purchased this item</span>
            </div>
          )}
        </div>

        {/* Right: Star Distribution Bars (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-center space-y-2.5 px-2 sm:px-6">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.ratingDistribution[star] || 0;
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

            return (
              <button
                key={star}
                type="button"
                onClick={() => setFilterRating(filterRating === star ? null : star)}
                className={`flex items-center gap-3 text-xs group text-left py-1.5 rounded-xl px-3 transition-colors ${
                  filterRating === star
                    ? "bg-white shadow-xs font-bold border border-stone-200"
                    : "hover:bg-white/70"
                }`}
              >
                <span className="w-12 flex items-center gap-1 font-bold text-stone-700">
                  {star} <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </span>

                <div className="flex-1 h-2.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-10 text-right text-stone-500 font-medium">{count}</span>
              </button>
            );
          })}

          {filterRating !== null && (
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setFilterRating(null)}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Clear {filterRating}★ filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Write a Review Drawer / Form */}
      {isWriting && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border-2 border-emerald-600/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl shadow-emerald-700/5 transition-all animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {userStatus?.hasReviewed ? "Edit Your Review" : "Write a Customer Review"}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Reviewing: <strong className="text-stone-900">{productTitle}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="text-xs font-bold text-stone-400 hover:text-stone-700 px-2 py-1 rounded-lg"
            >
              Cancel
            </button>
          </div>

          {/* Star Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
              Overall Rating *
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-stone-300 hover:scale-110 transition-transform focus:outline-hidden"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= (hoverRating || selectedRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-stone-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-stone-700">
                {RATING_LABELS[hoverRating || selectedRating]}
              </span>
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Your Feedback (Optional)
              </label>
              <span className="text-[11px] text-stone-400">{comment.length} / 1000</span>
            </div>
            <textarea
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the product quality, fit, or delivery in your area? Share your honest review."
              className="w-full text-xs sm:text-sm p-4 border border-stone-200 rounded-2xl bg-stone-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-colors"
            />
          </div>

          {userStatus?.hasPurchased && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200/70 rounded-2xl text-xs text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Verified Buyer badge will be automatically displayed with your review.
              </span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="px-5 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewMutation.isPending}
              className="px-6 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md shadow-emerald-700/20"
            >
              {reviewMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{userStatus?.hasReviewed ? "Save Changes" : "Submit Review"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-stone-100 rounded-3xl" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-14 bg-stone-50/60 rounded-3xl border border-dashed border-stone-200 p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">No reviews found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {filterRating !== null
                ? `There are no ${filterRating}-star reviews for this product yet.`
                : "Be the first customer to share your experience with this item!"}
            </p>
            {!isWriting && (
              <button
                type="button"
                onClick={handleOpenWrite}
                className="mt-2 px-5 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors shadow-md shadow-emerald-700/20"
              >
                Write First Review
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-stone-100 bg-white border border-stone-200/80 rounded-3xl px-6 sm:px-8">
            {reviews.map((rev) => {
              const isOwner = user?.id === rev.user.id;
              const initials = rev.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              const formattedDate = new Date(rev.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <div key={rev.id} className="py-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-stone-900">{rev.user.name}</h4>
                          {rev.isVerified && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              Verified Buyer
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-400">{formattedDate}</span>
                      </div>
                    </div>

                    {/* Owner Action (Delete / Edit) */}
                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleOpenWrite}
                          className="p-2 text-stone-400 hover:text-emerald-700 rounded-lg hover:bg-stone-50 transition-colors"
                          title="Edit review"
                          aria-label="Edit review"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete your review?")) {
                              deleteMutation.mutate(rev.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-50 transition-colors"
                          title="Delete review"
                          aria-label="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(rev.rating)].map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>

                  {/* Review Text */}
                  {rev.comment && (
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                      {rev.comment}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
