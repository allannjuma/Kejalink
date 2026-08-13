'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'theme'

function isDark(theme: Theme): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyClass(theme: Theme) {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  if (isDark(theme)) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

function getSnapshot(): Theme {
  if (typeof window === 'undefined') return 'system'
  try {
    return (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'system'
  } catch {
    return 'system'
  }
}

function getServerSnapshot(): Theme {
  return 'system'
}

function subscribe(callback: () => void) {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY) callback()
  }
  const handleMatch = () => {
    if (getSnapshot() === 'system') callback()
  }

  window.addEventListener('storage', handleStorage)
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', handleMatch)

  return () => {
    window.removeEventListener('storage', handleStorage)
    mq.removeEventListener('change', handleMatch)
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Keep the <html> class in sync with the current theme.
  useEffect(() => {
    applyClass(theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(THEME_KEY, next)
    applyClass(next)
    window.dispatchEvent(new StorageEvent('storage', { key: THEME_KEY }))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const resolved = isDark(theme) ? 'dark' : 'light'

  return { theme, resolved, setTheme, toggleTheme }
}
