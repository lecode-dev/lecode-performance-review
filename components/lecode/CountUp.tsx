'use client'

import { useEffect, useState } from 'react'

const REDUCED =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

function useCountUp(target: number | null, { duration = 750, delay = 0 }: { duration?: number; delay?: number } = {}) {
  const [v, setV] = useState<number | null>(REDUCED ? target : 0)

  useEffect(() => {
    if (target == null) { setV(null); return }
    if (REDUCED) { setV(target); return }

    let raf = 0
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const p = Math.min(1, (now - start) / duration)
      const e = 1 - Math.pow(1 - p, 3)
      setV(target * e)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setV(target)
    }
    const to = setTimeout(() => { raf = requestAnimationFrame(tick) }, delay)
    const safety = setTimeout(() => setV(target), delay + duration + 120)
    return () => { clearTimeout(to); clearTimeout(safety); cancelAnimationFrame(raf) }
  }, [target, duration, delay])

  return v
}

export function CountUp({ end, decimals = 0, duration = 750, suffix = '' }: { end: number | null; decimals?: number; duration?: number; suffix?: string }) {
  const v = useCountUp(end, { duration })
  if (v == null) return <span>—</span>
  return <span>{v.toFixed(decimals)}{suffix}</span>
}
