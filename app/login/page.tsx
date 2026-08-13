'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Home,
  CalendarCheck,
  Flag,
  BadgeCheck,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const inputClass =
  'min-h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 pl-11 text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

const features = [
  {
    icon: Home,
    title: 'List rooms & apartments',
    desc: 'Publish vacancies with photos, rent, and amenities in minutes.',
  },
  {
    icon: CalendarCheck,
    title: 'Track bookings',
    desc: 'See viewing requests and tenant confirmations at a glance.',
  },
  {
    icon: Flag,
    title: 'Handle reports',
    desc: 'Respond to maintenance issues and keep tenants happy.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified leads',
    desc: 'Connect directly with serious renters — no broker fees.',
  },
]

export default function CaretakerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setLoading(false)
      setError(signInError.message)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      setLoading(false)
      setError('Unable to retrieve user. Please try again.')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    setLoading(false)

    if (profileError) {
      setError(profileError.message)
      return
    }

    if (profile?.role === 'super_admin') router.push('/admin')
    else if (profile?.role === 'building_admin') router.push('/dashboard')
    else router.push('/')
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Enter your email above, then click Forgot password.')
      return
    }

    setLoading(true)
    setError('')
    setResetSent(false)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
    } else {
      setResetSent(true)
    }
  }

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Left — caretaker homepage / value prop */}
      <section className="flex flex-1 flex-col justify-center bg-emerald-600 px-6 py-12 text-white sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-md">
              <ShieldCheck size={26} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight">Kejalink</span>
          </div>

          <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            The simple way to manage your rental properties
          </h1>
          <p className="mt-4 max-w-lg text-emerald-100">
            Log in to your caretaker dashboard to list rooms, manage bookings, and
            respond to tenant reports — all in one place.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl bg-emerald-700/40 p-4 backdrop-blur-sm"
              >
                <feature.icon size={22} className="mb-2 text-emerald-200" />
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-emerald-100">{feature.desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm text-emerald-200">
            Need an account? Only property admins can create caretaker logins.{' '}
            <Link href="/" className="font-medium text-white underline hover:text-emerald-100">
              Browse listings
            </Link>
          </p>
        </div>
      </section>

      {/* Right — login form */}
      <section className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
        <main className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg shadow-zinc-200/50 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShieldCheck size={28} strokeWidth={2.5} />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900">
              Caretaker login
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-700">
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-zinc-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="font-medium text-emerald-700 transition-colors hover:text-emerald-800 disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {resetSent && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                Check your inbox for a password-reset link.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-medium text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? (
                'Logging in…'
              ) : (
                <>
                  Log in to dashboard
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Super admin?{' '}
            <Link
              href="/login"
              className="font-medium text-emerald-700 transition-colors hover:text-emerald-800"
            >
              Use this same login
            </Link>
          </p>
        </main>
      </section>
    </div>
  )
}
