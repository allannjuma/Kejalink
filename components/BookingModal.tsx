'use client'

import { useState } from 'react'
import { X, Calendar, Clock, User, Phone, Loader2, CheckCircle2 } from 'lucide-react'

export function BookingModal({ roomId, onClose }: { roomId: string, onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [refCode, setRefCode] = useState('')

  const [formData, setFormData] = useState({
    tenant_name: '',
    phone: '',
    viewing_time: '',
    move_in_date: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, ...formData })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to book viewing')

      setRefCode(data.ref_code)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="relative p-6 border-b border-zinc-100 dark:border-zinc-800">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="text-xl font-bold text-center text-zinc-900 dark:text-zinc-100">
            Book a Viewing
          </h2>
        </div>

        {success ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-zinc-900 dark:text-zinc-100">Booking Confirmed!</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              Your viewing request has been sent to the caretaker.
            </p>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4 w-full">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Booking Reference</p>
              <p className="text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100">{refCode}</p>
            </div>
            <button 
              onClick={onClose}
              className="mt-6 w-full py-3 bg-zinc-900 text-white rounded-xl font-medium dark:bg-white dark:text-zinc-900"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.tenant_name}
                  onChange={e => setFormData({ ...formData, tenant_name: e.target.value })}
                  placeholder="John Doe"
                  className="block w-full pl-10 p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0712 345 678"
                  className="block w-full pl-10 p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Viewing Time
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input
                    type="datetime-local"
                    required
                    value={formData.viewing_time}
                    onChange={e => setFormData({ ...formData, viewing_time: e.target.value })}
                    className="block w-full pl-10 p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Move-in Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.move_in_date}
                    onChange={e => setFormData({ ...formData, move_in_date: e.target.value })}
                    className="block w-full pl-10 p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/30 dark:text-red-400 mt-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full py-4 px-4 bg-zinc-900 hover:bg-black text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : null}
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
