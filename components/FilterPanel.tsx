'use client'

import { useEffect, useState } from 'react'
import {
  X,
  Search,
  SlidersHorizontal,
  Home,
  Banknote,
  Sparkles,
  CalendarCheck,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { useTheme } from '@/lib/useTheme'

export type Filters = {
  query: string
  type: string
  maxRent: string
  amenities: string[]
  availableOnly: boolean
}

type FilterPanelProps = {
  isOpen: boolean
  onClose: () => void
  filters: Filters
  setFilters: (updates: Partial<Filters>) => void
  onReset: () => void
}

const PROPERTY_TYPES = ['Single Room', 'Bedsitter', '1 Bedroom', '2 Bedroom']
const AMENITIES = ['Pool', 'Garden', 'Gym', 'Parking', 'Smart Home', 'Security']

export function FilterPanel({
  isOpen,
  onClose,
  filters,
  setFilters,
  onReset,
}: FilterPanelProps) {
  const { theme, setTheme } = useTheme()
  const [pulse, setPulse] = useState(false)

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => document.body.classList.remove('overflow-hidden')
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    setPulse(true)
    setTimeout(() => setPulse(false), 150)
    onClose()
  }

  const toggleAmenity = (amenity: string) => {
    const next = filters.amenities.includes(amenity)
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity]
    setFilters({ amenities: next })
  }

  const panelTransform = isOpen
    ? 'translate-x-0 duration-[400ms] ease-spring-enter'
    : 'translate-x-full duration-[300ms] ease-spring-exit'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-md transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } ${pulse ? 'scale-[1.02]' : 'scale-100'} origin-center`}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] flex flex-col bg-white/95 dark:bg-[rgba(22,22,24,0.96)] backdrop-blur-xl border-l border-zinc-200/80 dark:border-white/[0.06] shadow-[-10px_0_40px_rgba(0,0,0,0.08)] dark:shadow-[-10px_0_40px_rgba(0,0,0,0.45)] transition-transform ${panelTransform} ${
          isOpen ? 'panel-open' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Filter residences"
      >
        {/* Header */}
        <div className="panel-item flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-rose-600" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Filters
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors active:scale-95"
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          {/* Search */}
          <div className="panel-item relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Search
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => setFilters({ query: e.target.value })}
                placeholder="Area, building, or keyword..."
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-rose-500/30 transition-all"
              />
            </div>
          </div>

          {/* Property Type */}
          <div className="panel-item">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              <Home size={14} /> Property Type
            </label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => {
                const selected = filters.type === type
                return (
                  <button
                    key={type}
                    onClick={() =>
                      setFilters({ type: selected ? '' : type })
                    }
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                      selected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-rose-500/50 hover:shadow-sm dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800'
                    }`}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Price Range */}
          <div className="panel-item">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              <Banknote size={14} /> Max Rent (KES)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={filters.maxRent}
                onChange={(e) => setFilters({ maxRent: e.target.value })}
                placeholder="e.g. 150000"
                className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-rose-500/30 transition-all"
              />
            </div>
          </div>

          {/* Amenities */}
          <div className="panel-item">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              <Sparkles size={14} /> Amenities
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AMENITIES.map((amenity) => {
                const selected = filters.amenities.includes(amenity)
                return (
                  <button
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                      selected
                        ? 'bg-rose-600/10 text-rose-600 border-rose-600/40'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-rose-500/40 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800'
                    }`}
                  >
                    {selected ? '✓ ' : ''}
                    {amenity}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="panel-item flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <CalendarCheck size={16} className="text-rose-600" />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Available now
              </span>
            </div>
            <button
              onClick={() =>
                setFilters({ availableOnly: !filters.availableOnly })
              }
              className={`relative w-12 h-7 rounded-full border transition-colors duration-300 ease-spring-enter ${
                filters.availableOnly
                  ? 'bg-rose-600 border-rose-600'
                  : 'bg-zinc-200 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700'
              }`}
              aria-pressed={filters.availableOnly}
            >
              <span
                className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-toggle ${
                  filters.availableOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Appearance */}
          <div className="panel-item">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Appearance
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              {(['light', 'dark', 'system'] as const).map((mode) => {
                const active = theme === mode
                return (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                      active
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    {mode === 'light' && <Sun size={13} />}
                    {mode === 'dark' && <Moon size={13} />}
                    {mode === 'system' && <Monitor size={13} />}
                    <span className="capitalize">{mode}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="panel-item px-6 py-5 border-t border-zinc-100 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex gap-3">
            <button
              onClick={() => {
                onReset()
                onClose()
              }}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-[0.97]"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/25 transition-all active:scale-[0.97]"
            >
              Apply
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
