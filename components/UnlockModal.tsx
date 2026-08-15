'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Smartphone, Loader2, CheckCircle2, ShieldCheck, BadgeCheck, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

/* Skill: animation.md — modal enter 150–200ms, ease-out, scale from 0.96 */
const EASE_OUT = [0.23, 1, 0.32, 1] as const

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 90000

export function UnlockModal({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState('')
  const [hours, setHours] = useState<24 | 48>(48)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [waitedTooLong, setWaitedTooLong] = useState(false)
  const router = useRouter()
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll the status endpoint until Daraja's callback settles the pass.
  useEffect(() => {
    if (!checkoutId || confirmed) return

    const startedAt = Date.now()
    pollTimer.current = setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        if (pollTimer.current) clearInterval(pollTimer.current)
        setWaitedTooLong(true)
        return
      }
      try {
        const res = await fetch(`/api/mpesa/status?checkout_request_id=${encodeURIComponent(checkoutId)}`)
        const data = await res.json()
        if (data.status === 'paid') {
          if (pollTimer.current) clearInterval(pollTimer.current)
          setConfirmed(true)
          setTimeout(() => {
            router.refresh()
            onClose()
          }, 1500)
        } else if (data.status === 'failed') {
          if (pollTimer.current) clearInterval(pollTimer.current)
          setSuccess(false)
          setCheckoutId(null)
          setError('Payment was cancelled or declined. No charge was made — try again.')
        }
      } catch {
        /* transient network error — keep polling */
      }
    }, POLL_INTERVAL_MS)

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [checkoutId, confirmed, router, onClose])

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setWaitedTooLong(false)
    setLoading(true)

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, hours }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment failed to initiate')

      setSuccess(true)

      if (data.mock) {
        // Mock mode: pass is instantly paid, just refresh.
        setConfirmed(true)
        setTimeout(() => {
          router.refresh()
          onClose()
        }, 2500)
      } else {
        // Real Daraja: wait for the callback via polling.
        setCheckoutId(data.checkoutRequestId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Unlock premium access"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-card shadow-2xl"
      >
        <div className="relative border-b border-line p-6">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-2 text-muted-ink transition-colors hover:bg-soft hover:text-ink active:scale-95"
          >
            <X size={20} />
          </button>
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-gold">Kejalink Pass</p>
          <h2 className="mt-2 text-center font-display text-2xl font-semibold text-ink">
            Unlock Premium Access
          </h2>
          <p className="mt-2 text-center text-sm text-muted-ink">
            View exact locations, caretaker contacts, and book viewings instantly.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center p-8 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className={`mb-4 grid size-16 place-items-center rounded-full ${
                confirmed ? 'animate-pulse-ring bg-gold text-gold-ink' : 'bg-gold/15 text-gold'
              }`}
            >
              {confirmed ? <CheckCircle2 size={30} /> : <Smartphone size={30} />}
            </motion.div>

            {confirmed ? (
              <>
                <h3 className="mb-2 font-display text-xl font-semibold text-ink">Payment confirmed!</h3>
                <p className="text-sm text-muted-ink">Unlocking your pass…</p>
              </>
            ) : (
              <>
                <h3 className="mb-2 font-display text-xl font-semibold text-ink">Check your phone!</h3>
                <p className="text-sm text-muted-ink">
                  An M-Pesa prompt has been sent to <strong className="text-ink">{phone}</strong>.
                  Enter your PIN to complete the payment.
                </p>
                <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-ink">
                  <Loader2 size={12} className="animate-spin" />
                  Waiting for M-Pesa confirmation…
                </p>
                {waitedTooLong && (
                  <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-gold/30 bg-gold/10 p-3 text-left text-xs text-muted-ink">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-gold" />
                    Still waiting. If you already entered your PIN, the unlock will apply
                    automatically once Safaricom confirms — you can close this and refresh.
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handlePay} className="p-6">
            {/* Plan picker */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              {([
                { value: 24 as const, price: 150, tag: null },
                { value: 48 as const, price: 200, tag: 'Best value' },
              ]).map((plan) => {
                const active = hours === plan.value
                return (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => setHours(plan.value)}
                    aria-pressed={active}
                    className={`relative rounded-2xl border-2 p-4 text-left transition-all duration-150 active:scale-[0.97] ${
                      active
                        ? 'border-gold bg-gold/10 shadow-md shadow-gold/10'
                        : 'border-line bg-paper hover:border-gold/40'
                    }`}
                  >
                    {plan.tag && (
                      <span className="absolute -top-2.5 right-3 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-ink shadow">
                        {plan.tag}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${active ? 'text-ink' : 'text-muted-ink'}`}>
                        {plan.value} Hours
                      </span>
                      <span
                        className={`grid size-5 place-items-center rounded-full border-2 transition-colors ${
                          active ? 'border-gold bg-gold text-gold-ink' : 'border-line'
                        }`}
                      >
                        {active && <CheckCircle2 size={12} />}
                      </span>
                    </div>
                    <div className="mt-1 font-display text-2xl font-semibold text-ink">
                      KES {plan.price}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-ink">M-Pesa Number</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Smartphone className="size-5 text-[#4CAF50]" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="block w-full rounded-xl border border-line bg-paper p-3 pl-10 text-ink outline-none transition-shadow placeholder:text-muted-ink/60 focus:border-gold focus:ring-2 focus:ring-gold/40"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !phone}
              className="shine flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-4 font-semibold text-brand-ink shadow-lg shadow-brand/25 transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : null}
              {loading ? 'Processing…' : `Pay KES ${hours === 24 ? 150 : 200} with M-Pesa`}
            </button>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-ink">
              <ShieldCheck size={13} className="text-gold" />
              Full refund if a listing is fake or taken
            </p>
            <p className="mt-1.5 flex items-center justify-center gap-1.5 text-center text-xs text-muted-ink">
              <BadgeCheck size={13} className="text-gold" />
              Verified in person by the Kejalink team
            </p>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
