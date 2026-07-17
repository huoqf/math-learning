import { useState, useEffect } from 'react'
import { BREAKPOINT } from '@/theme/spacing'

type Tier = 'mobile' | 'tablet' | 'compact' | 'standard'

function getTier(w: number): Tier {
  if (w >= BREAKPOINT.desktop) return 'standard'
  if (w >= BREAKPOINT.tablet)  return 'compact'
  if (w >= BREAKPOINT.mobile)  return 'tablet'
  return 'mobile'
}

export function useBreakpoint(): Tier {
  const [tier, setTier] = useState<Tier>(() => getTier(window.innerWidth))
  useEffect(() => {
    const el = document.documentElement
    const ro = new ResizeObserver(() => setTier(getTier(el.clientWidth)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return tier
}
