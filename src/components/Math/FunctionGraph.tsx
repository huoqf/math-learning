import React from 'react'
import type { SceneScale } from '@/hooks/useSceneScale'
import { mathToDesign } from '@/utils/coordinate'

interface FunctionGraphProps {
  fn: (x: number) => number
  scale: SceneScale
  color: string
  strokeWidth?: number
  strokeDasharray?: string
  samples?: number
}

export const FunctionGraph: React.FC<FunctionGraphProps> = ({
  fn,
  scale,
  color,
  strokeWidth = 2,
  strokeDasharray,
  samples = 300,
}) => {
  const { xMin, xMax, yMin, yMax } = scale

  const pathD = React.useMemo(() => {
    const step = (xMax - xMin) / samples
    let d = ''
    let isDrawing = false

    // 为防止局部斜率极大导致的锯齿，在定义域内对 x 进行等距高密度采样
    for (let i = 0; i <= samples; i++) {
      const x = xMin + i * step
      let y = NaN

      try {
        y = fn(x)
      } catch {
        y = NaN
      }

      // 验证有效性：必须是有限实数，并且在纵向显示区间做一定代偿容错（防止溢出渲染溢出边界太多）
      const isValid =
        Number.isFinite(y) &&
        !Number.isNaN(y) &&
        y >= yMin - (yMax - yMin) * 2 &&
        y <= yMax + (yMax - yMin) * 2

      if (isValid) {
        const pt = mathToDesign(x, y, scale)
        if (!isDrawing) {
          d += `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
          isDrawing = true
        } else {
          d += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
        }
      } else {
        // 无效点，断开曲线连接
        isDrawing = false
      }
    }

    return d
  }, [fn, scale, xMin, xMax, yMin, yMax, samples])

  if (!pathD) return null

  return (
    <path
      d={pathD}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}
