import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'

export interface CanvasSizeOptions {
  presetCompensation?: number
}

export interface CanvasSize {
  width: number
  height: number
  scale: number
  rawScale: number
  px: (v: number) => number
  font: (v: number) => number
}

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v
}

export function useCanvasSize(
  initial: { width: number; height: number },
  options?: CanvasSizeOptions
): [RefObject<HTMLDivElement | null>, CanvasSize] {
  const containerRef = useRef<HTMLDivElement>(null)
  const [raw, setRaw] = useState({ width: initial.width, height: initial.height })

  useLayoutEffect(() => {
    const element = containerRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setRaw({ width: rect.width, height: rect.height })
    }
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        setRaw({ width, height })
      }
    })

    resizeObserver.observe(element)

    const rect = element.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setRaw({ width: rect.width, height: rect.height })
    }

    return () => {
      resizeObserver.unobserve(element)
      resizeObserver.disconnect()
    }
  }, [])

  const size: CanvasSize = useMemo(() => {
    const rawScale = Math.min(raw.width / initial.width, raw.height / initial.height)
    const compensation = options?.presetCompensation ?? 1.0
    const scale = rawScale * compensation
    return {
      width: raw.width,
      height: raw.height,
      scale,
      rawScale,
      px: (v: number) => v * scale,
      font: (v: number) => clamp(v * scale, 7, 16),
    }
  }, [raw.width, raw.height, initial.width, initial.height, options?.presetCompensation])

  return [containerRef, size]
}
