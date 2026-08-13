'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar, Clock, User, Phone, Loader2, CheckCircle2, Ticket } from 'lucide-react'

/* Skill: animation.md — modal enter 150–200ms, ease-out, scale from 0.96 */
const EASE_OUT = [0.23, 1, 0.32, 1] as const

const inputClass =
  'block w-full rounded-xl border border-line bg-paper p-3 pl-10 text-sm text-ink outline-none transition-shadow placeholder:text-muted-ink/60 focus:border-gold focus:ring-2 focus:ring-gold/40'

const labelClass = 'mb-1.5 block text-sm font-medium text-ink'

const pad = (n: number) => n.toString().padStart(2, '0')

// Tomorrow's date as YYYY-MM-DD — the default viewing/move-in date.
function defaultDateStr() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`
}

// Current time as HH:MM — the default viewing time.
function defaultTimeStr() {
  const now = new Date()
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

export function BookingModal({ roomId, onClose }: { roomId: string, onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [refCode, setRefCode] = useState('')

  const [formData, setFormData] = useState({
    tenant_name: '',
    phone: '',
  })

  // Prefill with sensible defaults for faster testing. Lazy initializers are
  // safe here because the modal only mounts when opened.
  const [viewingDate, setViewingDate] = useState(defaultDateStr)
  const [viewingTime, setViewingTime] = useState(defaultTimeStr)
  const [moveInDate, setMoveInDate] = useState(defaultDateStr)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const viewing_time = `${viewingDate}T${viewingTime}`

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          tenant_name: formData.tenant_name,
          phone: formData.phone,
          viewing_time,
          move_in_date: moveInDate,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to book viewing')

      setRefCode(data.ref_code)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book viewing')
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
        aria-label="Book a viewing"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-card shadow-2xl"
      >
        <div className="relative border-b border-line p-6">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-2 text-muted-ink transition-colors hover:bg-soft hover:text-ink active:scale-95"
          >
            <X size={20} />
          </button>
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-gold">Zero broker fees</p>
          <h2 className="mt-2 text-center font-display text-2xl font-semibold text-ink">
            Book a Viewing
          </h2>
          <p className="mt-2 text-center text-sm text-muted-ink">
            The caretaker confirms your slot directly — no middlemen.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center p-8 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="animate-pulse-ring mb-4 grid size-16 place-items-center rounded-full bg-gold text-gold-ink"
            >
              <CheckCircle2 size={30} />
            </motion.div>
            <h3 className="mb-2 font-display text-xl font-semibold text-ink">Booking Confirmed!</h3>
            <p className="mb-5 text-sm text-muted-ink">
              Your viewing request has been sent to the caretaker.
            </p>
            <div className="w-full rounded-2xl border border-dashed border-line bg-soft p-4">
              <p className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-ink">
                <Ticket size={13} className="text-gold" />
                Booking Reference
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-ink">{refCode}</p>
            </div>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-brand py-3.5 font-semibold text-brand-ink shadow-lg shadow-brand/25 transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            <div>
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="size-4 text-muted-ink" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.tenant_name}
                  onChange={e => setFormData({ ...formData, tenant_name: e.target.value })}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Phone Number</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="size-4 text-muted-ink" />
                </div>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0712 345 678"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Viewing date + time — split so it's easier to enter */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Viewing Date</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="size-4 text-muted-ink" />
                  </div>
                  <input
                    type="date"
                    required
                    value={viewingDate}
                    onChange={e => setViewingDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Viewing Time</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Clock className="size-4 text-muted-ink" />
                  </div>
                  <input
                    type="time"
                    required
                    value={viewingTime}
                    onChange={e => setViewingTime(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Move-in Date</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="size-4 text-muted-ink" />
                </div>
                <input
                  type="date"
                  required
                  value={moveInDate}
                  onChange={e => setMoveInDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="mt-1 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="shine mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-4 font-semibold text-brand-ink shadow-lg shadow-brand/25 transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : null}
              {loading ? 'Booking…' : 'Confirm Booking'}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
