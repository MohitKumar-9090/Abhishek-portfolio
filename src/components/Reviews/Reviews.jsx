import { Send, Star, Trash2 } from "lucide-react";
import Section from "../ui/Section";
import { REVIEWS_SECTION } from "./reviewsData";
import "./reviews.css";

export default function ReviewsSection({
  submitReview,
  reviewForm,
  setReviewForm,
  reviewSubmitting,
  reviewStatus,
  reviews,
  handleDeleteReview,
  deletingReviewId
}) {
  return (
    <Section id={REVIEWS_SECTION.id} title={REVIEWS_SECTION.title} subtitle={REVIEWS_SECTION.subtitle}>
      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={submitReview} className="space-y-4 rounded-2xl border border-sky-300/40 bg-slate-900/70 p-5">
          <h3 className="font-heading text-2xl font-bold text-white">Share Your Experience</h3>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Your Name *</label>
            <input
              placeholder="Enter your name"
              value={reviewForm.name}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-xl border border-sky-300/30 bg-slate-950/80 p-3 text-slate-100 placeholder:text-slate-400"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Email Address *</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={reviewForm.email}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-xl border border-sky-300/30 bg-slate-950/80 p-3 text-slate-100 placeholder:text-slate-400"
              required
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-200">Rating *</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setReviewForm((prev) => ({ ...prev, rating: n }))}
                  className="rounded p-1"
                >
                  <Star className={n <= reviewForm.rating ? "fill-amber-300 text-amber-300" : "text-slate-500"} size={28} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Your Review *</label>
            <textarea
              placeholder="Share your thoughts about my work..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
              className="min-h-32 w-full rounded-xl border border-sky-300/30 bg-slate-950/80 p-3 text-slate-100 placeholder:text-slate-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={reviewSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-glow via-accent to-glow px-4 py-3 text-base font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={16} />
            {reviewSubmitting ? "Submitting..." : "Submit Review"}
          </button>
          <p className="text-sm text-cyan-200">{reviewStatus}</p>
        </form>

        <div className="max-h-[380px] space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-slate-800/70 p-4">
          {reviews.length ? (
            reviews.map((item) => (
              <article key={item.id} className="rounded-lg border border-white/10 bg-slate-900 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-semibold text-white">{item.name}</p>
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(item)}
                    disabled={deletingReviewId === item.id}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-300/60 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={12} />
                    {deletingReviewId === item.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
                <p className="mb-1 text-amber-300">{`${"\u2605".repeat(item.rating)}${"\u2606".repeat(5 - item.rating)}`}</p>
                <p className="text-sm text-slate-300">{item.comment}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </article>
            ))
          ) : (
            <p className="text-slate-400">No reviews yet.</p>
          )}
        </div>
      </div>
    </Section>
  );
}
