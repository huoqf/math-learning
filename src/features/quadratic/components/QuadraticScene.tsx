import React from 'react'
import type { SceneScale } from '@/hooks/useSceneScale'
import { CoordinateGrid, FunctionGraph } from '@/components/Math'
import { mathToDesign } from '@/utils/coordinate'
import { solveQuadratic } from '@/math/quadratic'
import { MATH_COLORS } from '@/theme'

interface QuadraticSceneProps {
  params: {
    a: number
    b: number
    c: number
  }
  scale: SceneScale
}

export const QuadraticScene: React.FC<QuadraticSceneProps> = ({
  params,
  scale,
}) => {
  const { a, b, c } = params
  const res = solveQuadratic(a, b, c)

  // 1. 对称轴设计坐标
  const axisLine = React.useMemo(() => {
    if (res.axisX === null) return null
    const topPt = mathToDesign(res.axisX, scale.yMax, scale)
    const bottomPt = mathToDesign(res.axisX, scale.yMin, scale)
    return (
      <line
        x1={topPt.x}
        y1={topPt.y}
        x2={bottomPt.x}
        y2={bottomPt.y}
        stroke={MATH_COLORS.asymptote}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
    )
  }, [res.axisX, scale])

  // 2. 顶点设计坐标
  const vertexMark = React.useMemo(() => {
    if (res.vertexX === null || res.vertexY === null) return null
    const pt = mathToDesign(res.vertexX, res.vertexY, scale)
    return (
      <g>
        <circle
          cx={pt.x}
          cy={pt.y}
          r={5}
          fill={MATH_COLORS.focusPoint}
          stroke={MATH_COLORS.white}
          strokeWidth={1.5}
          className="shadow-sm"
        />
        <text
          x={pt.x}
          y={a > 0 ? pt.y + 16 : pt.y - 10}
          textAnchor="middle"
          fill={MATH_COLORS.labelText}
          className="text-[10px] font-semibold font-mono select-none"
        >
          {`P(${res.vertexX.toFixed(1)}, ${res.vertexY.toFixed(1)})`}
        </text>
      </g>
    )
  }, [res.vertexX, res.vertexY, scale, a])

  // 3. Y 轴交点 (0, c)
  const yInterceptMark = React.useMemo(() => {
    const pt = mathToDesign(0, c, scale)
    return (
      <g>
        <circle
          cx={pt.x}
          cy={pt.y}
          r={4.5}
          fill={MATH_COLORS.vectorSecondary}
          stroke={MATH_COLORS.white}
          strokeWidth={1.5}
        />
        <text
          x={pt.x + 8}
          y={pt.y + 3}
          textAnchor="start"
          fill={MATH_COLORS.labelText}
          className="text-[10px] font-semibold font-mono select-none"
        >
          {`(0, ${c.toFixed(1)})`}
        </text>
      </g>
    )
  }, [c, scale])

  // 4. 实根（X 轴交点）
  const rootMarks = React.useMemo(() => {
    return res.roots.filter(r => Number.isFinite(r)).map((rootVal, i) => {
      const pt = mathToDesign(rootVal, 0, scale)
      return (
        <g key={`root-${i}`}>
          <circle
            cx={pt.x}
            cy={pt.y}
            r={4.5}
            fill={MATH_COLORS.vectorResult}
            stroke={MATH_COLORS.white}
            strokeWidth={1.5}
          />
          <text
            x={pt.x}
            y={pt.y - 8}
            textAnchor="middle"
            fill={MATH_COLORS.labelText}
            className="text-[10px] font-semibold font-mono select-none"
          >
            {`x${i + 1}=${rootVal.toFixed(1)}`}
          </text>
        </g>
      )
    })
  }, [res.roots, scale])

  return (
    <g>
      {/* 坐标轴背景 */}
      <CoordinateGrid scale={scale} />

      {/* 对称轴线 */}
      {axisLine}

      {/* 抛物线主线 */}
      <FunctionGraph
        fn={(x) => a * x * x + b * x + c}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.5}
      />

      {/* Y 轴交点标记 */}
      {yInterceptMark}

      {/* 抛物线顶点标记 */}
      {vertexMark}

      {/* 零点/实数根标记 */}
      {rootMarks}
    </g>
  )
}
