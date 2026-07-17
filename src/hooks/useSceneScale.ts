import { useMemo } from 'react'
import type { ViewportInfo } from '@/utils/useViewport'

export interface SceneScale {
  scaleX: number
  scaleY: number
  scale: number
  originX: number
  originY: number
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

interface UseSceneScaleOptions {
  vp: ViewportInfo
  xRange: [number, number]
  yRange: [number, number]
}

export function useSceneScale({
  vp,
  xRange,
  yRange
}: UseSceneScaleOptions): SceneScale {
  return useMemo(() => {
    const [xMin, xMax] = xRange
    const [yMin, yMax] = yRange

    const designW = vp.visibleW / vp.scale
    const designH = vp.visibleH / vp.scale

    const left = -vp.tx / vp.scale
    const top = -vp.ty / vp.scale

    const scaleX = designW / (xMax - xMin)
    const scaleY = designH / (yMax - yMin)
    const scale = Math.min(scaleX, scaleY)

    // 计算数学原点 (0,0) 对应在设计坐标系下的位置
    const originX = left + (0 - xMin) / (xMax - xMin) * designW
    const originY = top + (yMax - 0) / (yMax - yMin) * designH

    return {
      scaleX: scale,
      scaleY: scale,
      scale,
      originX,
      originY,
      xMin,
      xMax,
      yMin,
      yMax
    }
  }, [vp.visibleW, vp.visibleH, vp.tx, vp.ty, vp.scale, xRange, yRange])
}
