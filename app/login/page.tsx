'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const inputClass =
  'min-h-11 rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-emerald-500 focus:outline-none'

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'super_admin' | 'building_admin'>('building_admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (isSignUp) {
      // Call server-side route that uses the Admin API (no email confirmation required)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })

      const result = await res.json()
      if (!res.ok) {
        setLoading(false)
        setError(result.error || 'Registration failed')
        return
      }

      setSuccess('Account created! Logging you in...')
    } else {
      // Login flow
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setLoading(false)
        setError(signInError.message)
        return
      }
    }

    // After success (either login or auto-login from signup)
    // Send each role to its own panel
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      // Sometimes signup requires email confirmation, so user might be null here
      if (isSignUp) {
        setError('Check your email to confirm your account (if enabled in Supabase).')
      }
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    setLoading(false)

    if (profile?.role === 'super_admin') router.push('/admin')
    else if (profile?.role === 'building_admin') router.push('/dashboard')
    else router.push('/')
  }

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-emerald-50/40 p-4">
      <main className="w-full max-w-sm rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-zinc-900">
          {isSignUp ? 'Create Admin Account' : 'Log in'}
        </h1>
        <p className="mb-6 text-sm text-zinc-500">KejaLink caretakers &amp; admins</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1 ml-1">Sign up as</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'super_admin' | 'building_admin')}
                  className={inputClass + ' w-full bg-white cursor-pointer'}
                >
                  <option value="building_admin">🏠 Building Admin (Caretaker)</option>
                  <option value="super_admin">🛡️ Super Admin</option>
                </select>
              </div>
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />
          
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600 font-medium">{success}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="min-h-11 rounded-xl bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 mt-2"
          >
            {loading ? 'Please wait…' : (isSignUp ? 'Sign Up' : 'Log in')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
              setSuccess('')
            }}
            className="text-emerald-600 font-medium hover:underline"
          >
            {isSignUp ? 'Log in' : 'Create one'}
          </button>
        </div>
      </main>
    </div>
  )
}
