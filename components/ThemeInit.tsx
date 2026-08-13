'use client'

import { useTheme } from '@/lib/useTheme'

export function ThemeInit() {
  // Mounts the theme class on <html> from localStorage / system preference.
  useTheme()
  return null
}
