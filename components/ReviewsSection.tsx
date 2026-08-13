'use client'

import { useState } from 'react'
import { Star, Lock, MessageSquareText } from 'lucide-react'
import { timeAgo } from '@/lib/time'

export type Review = {
  id: string
  room_id: string
  tenant_name: string
  rating: number
  comment: string | null
  created_at: string
}

type ReviewsSectionProps = {
  roomId: string
  initialReviews: Review[]
  average: number | null
  count: number
  unlocked: boolean
}

function Stars({ value, size = 15 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'fill-gold text-gold' : 'text-muted-ink/30'}
        />
      ))}
    </span>
  )
}

export function ReviewsSection({ roomId, initialReviews, average, count, unlocked }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [avg, setAvg] = useState<number | null>(average)
  const [total, setTotal] = useState(count)

  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  const refresh = async () => {
    try {
      const res = await fetch(`/api/reviews?roomId=${roomId}`)
      if (!res.ok) return
      const data = await res.json()
      setReviews(data.reviews)
      setAvg(data.average)
      setTotal(data.count)
    } catch {
      /* keep the stale list on network errors */
    }
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    setFeedback(null)
    if (name.trim().length < 2) {
      setFeedback({ kind: 'error', text: 'Please enter your name (at least 2 characters).' })
      return
    }
    if (rating < 1) {
      setFeedback({ kind: 'error', text: 'Please pick a star rating.' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          tenant_name: name.trim(),
          rating,
          comment: comment.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFeedback({ kind: 'error', text: data.error || 'Failed to save your review.' })
        return
      }
      setFeedback({ kind: 'success', text: 'Thanks! Your review has been saved.' })
      setComment('')
      await refresh()
    } catch {
      setFeedback({ kind: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-3xl border border-line bg-card p-6 shadow-md shadow-brand/5 md:p-8">
      {/* Header: average + count */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h2 className="font-display text-2xl font-semibold text-ink">Tenant reviews</h2>
        {total > 0 && avg != null ? (
          <div className="flex items-center gap-2">
            <Stars value={avg} />
            <span className="font-display text-lg font-semibold text-ink">{avg.toFixed(1)}</span>
            <span className="text-sm text-muted-ink">
              · {total} {total === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-ink">No reviews yet</span>
        )}
      </div>

      {/* Review form (paid pass holders only) */}
      {unlocked ? (
        <form onSubmit={submitReview} className="mb-8 rounded-2xl border border-line bg-soft p-5">
          <p className="mb-4 text-sm font-semibold text-ink">Share your experience</p>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Your name"
            className="mb-3 w-full rounded-xl border border-line bg-card px-4 py-2.5 text-sm text-ink outline-none transition-shadow placeholder:text-muted-ink/60 focus:ring-2 focus:ring-gold/50"
          />

          <div className="mb-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`${i} star${i === 1 ? '' : 's'}`}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  size={24}
                  className={i <= (hovered || rating) ? 'fill-gold text-gold' : 'text-muted-ink/30'}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-xs font-semibold text-muted-ink">{rating}/5</span>
            )}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Optional comment (max 500 characters)"
            className="mb-3 w-full resize-none rounded-xl border border-line bg-card px-4 py-2.5 text-sm text-ink outline-none transition-shadow placeholder:text-muted-ink/60 focus:ring-2 focus:ring-gold/50"
          />

          {feedback && (
            <p
              className={`mb-3 text-sm font-medium ${
                feedback.kind === 'error' ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {feedback.text}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="shine rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Submit review'}
          </button>
        </form>
      ) : (
        <p className="mb-8 flex items-center gap-2 rounded-2xl border border-line bg-soft px-5 py-4 text-sm text-muted-ink">
          <Lock size={15} className="shrink-0 text-gold" />
          Unlock this room to leave a review.
        </p>
      )}

      {/* Review list */}
      {reviews.length > 0 ? (
        <ul className="space-y-6">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-line pb-6 last:border-none last:pb-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-gold/15 font-display text-sm font-semibold text-gold">
                  {review.tenant_name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{review.tenant_name}</p>
                  <p className="text-xs text-muted-ink">{timeAgo(review.created_at)}</p>
                </div>
                <span className="ml-auto">
                  <Stars value={review.rating} size={14} />
                </span>
              </div>
              {review.comment && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-ink">
                  {review.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-soft text-muted-ink">
            <MessageSquareText size={20} />
          </span>
          <p className="mt-3 text-sm text-muted-ink">
            Be the first to review this room.
          </p>
        </div>
      )}
    </section>
  )
}
