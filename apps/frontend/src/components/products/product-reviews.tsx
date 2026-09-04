"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, ShieldCheck, CheckCircle2, Trash2, Edit3, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { getFriendlyErrorMessage } from "@/lib/error-utils";
import { toast } from "sonner";
import Link from "next/link";

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

  // 1. Fetch live reviews & stats for this product
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

  // 2. Check if current user already submitted a review or bought the product
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
      toast.info("Please sign in to write a review");
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
    5: "5 Stars - Excellent",
    4: "4 Stars - Very Good",
    3: "3 Stars - Average",
    2: "2 Stars - Poor",
    1: "1 Star - Terrible",
  };

  return (
    <section id="reviews-section" className="pt-10 border-t space-y-8">
      {/* SECTION TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Customer Reviews ({stats.totalReviews})
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Genuine experiences from verified buyers across Bangladesh
          </p>
        </div>

        {!isWriting && (
          <button
            onClick={handleOpenWrite}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 shrink-0"
          >
            <Edit3 className="w-4 h-4" />
            <span>{userStatus?.hasReviewed ? "Edit Your Review" : "Write a Review"}</span>
          </button>
        )}
      </div>

      {/* RATING SUMMARY CARD & DISTRIBUTION BARS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gray-50 border border-gray-100 rounded-3xl p-6 sm:p-8">
        {/* Left: Big Score (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0"}
          </div>
          <div className="flex items-center gap-1 text-amber-500 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= Math.round(stats.averageRating) ? "fill-current text-amber-500" : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-gray-600">
            {stats.totalReviews > 0
              ? `Based on ${stats.totalReviews} verified ${stats.totalReviews === 1 ? "review" : "reviews"}`
              : "No reviews yet"}
          </p>

          {userStatus?.hasPurchased && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>You purchased this item</span>
            </div>
          )}
        </div>

        {/* Right: Star Breakdown Progress Bars (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-center space-y-2 px-2 sm:px-6">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.ratingDistribution[star] || 0;
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

            return (
              <button
                key={star}
                type="button"
                onClick={() => setFilterRating(filterRating === star ? null : star)}
                className={`flex items-center gap-3 text-xs group text-left py-1 rounded-lg px-2 transition-colors ${
                  filterRating === star ? "bg-white shadow-xs font-bold" : "hover:bg-white/60"
                }`}
              >
                <span className="w-12 flex items-center gap-1 font-bold text-gray-700">
                  {star} <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </span>

                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-10 text-right text-gray-500 font-medium">{count}</span>
              </button>
            );
          })}

          {filterRating !== null && (
            <div className="pt-2 text-right">
              <button
                onClick={() => setFilterRating(null)}
                className="text-xs font-bold text-primary hover:underline"
              >
                Clear {filterRating}★ filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WRITE A REVIEW CARD (EXPANDABLE) */}
      {isWriting && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border-2 border-primary/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-lg shadow-primary/5 transition-all animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {userStatus?.hasReviewed ? "Edit Your Review" : "Write a Customer Review"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Reviewing: <strong className="text-gray-900">{productTitle}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg"
            >
              Cancel
            </button>
          </div>

          {/* Interactive Star Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">Overall Rating *</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-gray-300 hover:scale-110 transition-transform focus:outline-hidden"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= (hoverRating || selectedRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-gray-700 ml-2">
                {RATING_LABELS[hoverRating || selectedRating]}
              </span>
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700">Review Feedback (Optional)</label>
              <span className="text-[11px] text-gray-400">{comment.length} / 1000</span>
            </div>
            <textarea
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike? How was the size, material, or delivery in your area?"
              className="w-full text-xs sm:text-sm p-3.5 border rounded-2xl bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {userStatus?.hasPurchased && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Verified Purchase badge will be automatically attached because you purchased this item.
              </span>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="px-5 py-2.5 border rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewMutation.isPending}
              className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md shadow-primary/20"
            >
              {reviewMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{userStatus?.hasReviewed ? "Save Changes" : "Submit Review"}</span>
            </button>
          </div>
        </form>
      )}

      {/* REVIEWS LIST */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed p-6 space-y-3">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-900">No reviews found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {filterRating !== null
                ? `There are no ${filterRating}-star reviews for this product yet.`
                : "Be the first customer to share your thoughts on this product!"}
            </p>
            {!isWriting && (
              <button
                onClick={handleOpenWrite}
                className="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors"
              >
                Write First Review
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
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
                <div key={rev.id} className="py-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-gray-900">{rev.user.name}</h4>
                          {rev.isVerified && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Verified Buyer
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">{formattedDate}</span>
                      </div>
                    </div>

                    {/* Owner Action (Delete / Edit) */}
                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleOpenWrite}
                          className="p-1.5 text-gray-400 hover:text-primary rounded-lg transition-colors"
                          title="Edit review"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete your review?")) {
                              deleteMutation.mutate(rev.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(rev.rating)].map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>

                  {/* Review Text */}
                  {rev.comment && (
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
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
