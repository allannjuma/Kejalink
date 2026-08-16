'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Home as HomeIcon,
  Sun,
  Moon,
  Monitor,
  ArrowRight,
  Search,
  KeyRound,
  ShieldCheck,
} from 'lucide-react'
import { useTheme } from '@/lib/useTheme'
import { Reveal } from '@/components/Reveal'

/* ── Navbar ───────────────────────────────────────────────────── */

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mounted flag avoids a hydration mismatch on the theme icon
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cycle = () => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')
  const ThemeIcon = !mounted ? Monitor : theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <motion.header
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-paper/80 shadow-[0_1px_0_0_var(--line),0_8px_30px_-12px_rgba(0,0,0,0.15)] backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-ink shadow-lg shadow-brand/25 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
            <HomeIcon size={18} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Keja<span className="text-gold">link</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-ink md:flex">
          {[
            ['Listings', '#listings'],
            ['How it works', '#how-it-works'],
            ['All homes', '/search'],
            ['Favorites', '/favorites'],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-gold after:transition-all after:duration-300 hover:text-ink hover:after:w-full"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={cycle}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-ink transition-colors hover:text-ink"
            title="Theme: click to cycle light → dark → system"
            aria-label={`Theme: ${mounted ? theme : 'system'}. Click to cycle light, dark, system`}
          >
            <ThemeIcon size={16} key={mounted ? theme : 'ssr'} />
            <span className="hidden capitalize sm:inline">{mounted ? theme : 'theme'}</span>
          </button>
          <Link
            href="/search"
            className="shine rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 transition-transform active:scale-95"
          >
            View all listings
          </Link>
        </div>
      </div>
    </motion.header>
  )
}

/* ── How it works ─────────────────────────────────────────────── */

const STEPS = [
  {
    icon: Search,
    title: 'Browse verified homes',
    body: 'Every listing is visited and confirmed by our team — no fake photos, no ghost agents.',
  },
  {
    icon: KeyRound,
    title: 'Unlock for KES 150',
    body: 'One tiny fee reveals the exact location and the caretaker’s direct phone number.',
  },
  {
    icon: ShieldCheck,
    title: 'Move in, broker-free',
    body: 'Deal straight with the caretaker. No middlemen, no viewing fees, no surprises.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6">
      <Reveal className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">How it works</p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Home hunting, minus the hustle
        </h2>
      </Reveal>

      <div className="relative mt-14 grid gap-6 md:grid-cols-3">
        <div aria-hidden className="absolute left-[16.6%] right-[16.6%] top-12 hidden border-t-2 border-dashed border-line md:block" />
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 140}>
            <div className="group relative h-full rounded-3xl border border-line bg-card p-7 text-center shadow-md shadow-brand/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-brand/10">
              <div className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-brand text-brand-ink shadow-lg shadow-brand/25 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                <step.icon size={28} />
                <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-gold text-xs font-bold text-gold-ink shadow">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-ink">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ── CTA banner ───────────────────────────────────────────────── */

export function WhyBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <Reveal>
        <div className="art-pattern relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#111827] p-10 text-center shadow-2xl shadow-[#111827]/30 sm:p-16">
          <div className="animate-blob absolute -left-20 -top-20 size-64 rounded-full bg-[#FF385C]/25 blur-3xl" />
          <div className="animate-blob-slow absolute -bottom-24 -right-16 size-72 rounded-full bg-[#FF385C]/15 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Your next home is already verified. Go get it.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[#9CA3AF]">
              Join thousands of Kenyans who skipped the brokers and found a place they love — for the price of a chapati lunch.
            </p>
            <Link
              href="/search"
              className="shine group mt-8 inline-flex items-center gap-2 rounded-2xl bg-gold px-7 py-3.5 text-sm font-bold text-gold-ink shadow-xl shadow-black/20 transition-transform hover:scale-105 active:scale-95"
            >
              Start browsing
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ── Footer ───────────────────────────────────────────────────── */

export function Footer() {
  return (
    <footer className="border-t border-line bg-card/60 py-10 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-ink sm:flex-row sm:px-6">
        <p className="font-display text-lg font-semibold text-ink">
          Keja<span className="text-gold">link</span>
        </p>
        <p>Find your next home, zero broker fees.</p>
        <p className="text-xs">Made with 💚 in Kenya</p>
      </div>
    </footer>
  )
}
