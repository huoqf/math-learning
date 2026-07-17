import { useCanvasSize, useViewport } from '@/utils'
import type { CanvasSize, CanvasSizeOptions } from '@/utils/useCanvasSize'
import type { ViewportInfo } from '@/utils/useViewport'
import type { RefObject } from 'react'

export interface CanvasPreset {
  readonly width: number
  readonly height: number
}

export interface UseAnimationViewportOptions {
  preset: CanvasPreset
  overlayRight?: number
  overlayLeft?: number
  overlayTop?: number
  overlayBottom?: number
  presetCompensation?: number
}

export interface AnimationViewportResult {
  containerRef: RefObject<HTMLDivElement | null>
  canvasSize: CanvasSize
  vp: ViewportInfo
  preset: CanvasPreset
}

export function useAnimationViewport({
  preset,
  overlayRight = 0,
  overlayLeft = 0,
  overlayTop = 0,
  overlayBottom = 0,
  presetCompensation,
}: UseAnimationViewportOptions): AnimationViewportResult {
  const sizeOptions: CanvasSizeOptions | undefined =
    presetCompensation !== undefined ? { presetCompensation } : undefined

  const [containerRef, canvasSize] = useCanvasSize(preset, sizeOptions)

  const vp = useViewport(canvasSize, {
    designWidth: preset.width,
    designHeight: preset.height,
    overlayRight,
    overlayLeft,
    overlayTop,
    overlayBottom,
  })

  return { containerRef, canvasSize, vp, preset }
}
