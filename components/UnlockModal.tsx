'use client'

import { useState } from 'react'
import { X, Smartphone, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UnlockModal({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState('')
  const [hours, setHours] = useState<24 | 48>(48)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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
      
      // If it's mocked, it might be instant, so we refresh the page after 2 seconds
      setTimeout(() => {
        router.refresh()
        onClose()
      }, 3000)
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
            Unlock Premium Access
          </h2>
          <p className="text-sm text-center text-zinc-500 mt-2">
            View exact locations, caretaker contacts, and book viewings instantly.
          </p>
        </div>

        {success ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Smartphone size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-zinc-900 dark:text-zinc-100">Check your phone!</h3>
            <p className="text-zinc-500 dark:text-zinc-400">
              An M-Pesa prompt has been sent to <strong>{phone}</strong>. Enter your PIN to complete the payment.
            </p>
            <p className="text-xs text-zinc-400 mt-4">Unlocking in a few seconds...</p>
          </div>
        ) : (
          <form onSubmit={handlePay} className="p-6">
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setHours(24)}
                className={`flex-1 p-4 rounded-2xl border-2 text-center transition-all ${
                  hours === 24 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                  : 'border-zinc-200 text-zinc-600 hover:border-emerald-200 dark:border-zinc-800 dark:text-zinc-400'
                }`}
              >
                <div className="text-sm font-medium mb-1">24 Hours</div>
                <div className="text-xl font-bold">KES 150</div>
              </button>
              <button
                type="button"
                onClick={() => setHours(48)}
                className={`flex-1 p-4 rounded-2xl border-2 text-center transition-all ${
                  hours === 48 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                  : 'border-zinc-200 text-zinc-600 hover:border-emerald-200 dark:border-zinc-800 dark:text-zinc-400'
                }`}
              >
                <div className="text-sm font-medium mb-1">48 Hours</div>
                <div className="text-xl font-bold">KES 200</div>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                M-Pesa Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Smartphone className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="block w-full pl-10 p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !phone}
              className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : null}
              {loading ? 'Processing...' : 'Pay with M-Pesa'}
            </button>
            
            <p className="text-center text-xs text-zinc-500 mt-4">
              💸 Full refund if a listing is fake or taken
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
