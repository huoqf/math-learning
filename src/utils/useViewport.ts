import { useMemo } from 'react'
import type { CanvasSize } from './useCanvasSize'

export interface ViewportOptions {
  designWidth: number
  designHeight: number
  overlayLeft?: number
  overlayRight?: number
  overlayTop?: number
  overlayBottom?: number
  presetCompensation?: number
}

export interface ViewportInfo {
  visibleX: number
  visibleY: number
  visibleW: number
  visibleH: number
  centerX: number
  centerY: number
  scale: number
  tx: number
  ty: number
  transform: string
  designVisibleW: number
  designVisibleH: number
  designLeft: number
  designTop: number
}

export function useViewport(
  canvas: CanvasSize,
  options: ViewportOptions,
): ViewportInfo {
  const {
    designWidth,
    designHeight,
    overlayLeft = 0,
    overlayRight = 0,
    overlayTop = 0,
    overlayBottom = 0,
  } = options

  const compensation = options.presetCompensation
    ?? (canvas.rawScale > 0 ? canvas.scale / canvas.rawScale : 1.0)

  return useMemo(() => {
    const visibleX = overlayLeft
    const visibleY = overlayTop
    const visibleW = Math.max(0, canvas.width - overlayLeft - overlayRight)
    const visibleH = Math.max(0, canvas.height - overlayTop - overlayBottom)

    const rawScale = Math.min(
      visibleW / designWidth,
      visibleH / designHeight,
    )
    const scale = rawScale * compensation

    const centerX = visibleX + visibleW / 2
    const centerY = visibleY + visibleH / 2

    const tx = visibleX + (visibleW - designWidth * scale) / 2
    const ty = visibleY + (visibleH - designHeight * scale) / 2
    const transform = `translate(${tx} ${ty}) scale(${scale})`

    return {
      visibleX,
      visibleY,
      visibleW,
      visibleH,
      centerX,
      centerY,
      scale,
      tx,
      ty,
      transform,
      designVisibleW: visibleW / scale,
      designVisibleH: visibleH / scale,
      designLeft: -tx / scale,
      designTop: -ty / scale,
    }
  }, [
    canvas.width,
    canvas.height,
    designWidth,
    designHeight,
    overlayLeft,
    overlayRight,
    overlayTop,
    overlayBottom,
    compensation,
  ])
}
