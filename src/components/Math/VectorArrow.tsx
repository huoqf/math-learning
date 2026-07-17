import React from 'react'
import type { SceneScale } from '@/hooks/useSceneScale'
import { mathToDesign } from '@/utils/coordinate'
import { MATH_COLORS } from '@/theme'

interface VectorArrowProps {
  /** 起点数学坐标 [x, y] */
  from: [number, number]
  /** 终点数学坐标 [x, y] */
  to: [number, number]
  /** 场景比例尺 */
  scale: SceneScale
  /** 箭头颜色，默认 vectorPrimary */
  color?: string
  /** 线宽 */
  strokeWidth?: number
  /** 箭头头部长度 (px) */
  headLength?: number
  /** 箭头头部宽度 (px) */
  headWidth?: number
  /** 标签文本，显示在箭头中点附近 */
  label?: string
  /** 标签偏移量 [dx, dy] (px)，相对于箭头中点 */
  labelOffset?: [number, number]
  /** 标签字号 */
  labelSize?: number
  /** 虚线样式，如 "6 3" */
  strokeDasharray?: string
}

export const VectorArrow: React.FC<VectorArrowProps> = ({
  from,
  to,
  scale,
  color = MATH_COLORS.vectorPrimary,
  strokeWidth = 2,
  headLength = 10,
  headWidth = 6,
  label,
  labelOffset = [0, -8],
  labelSize = 11,
  strokeDasharray,
}) => {
  const startPt = mathToDesign(from[0], from[1], scale)
  const endPt = mathToDesign(to[0], to[1], scale)

  // 计算箭头方向向量
  const dx = endPt.x - startPt.x
  const dy = endPt.y - startPt.y
  const len = Math.sqrt(dx * dx + dy * dy)

  // 向量长度过短时不渲染箭头头部
  if (len < 1) return null

  const ux = dx / len
  const uy = dy / len

  // 箭头头部两个侧翼点（三角形）
  const tipX = endPt.x
  const tipY = endPt.y
  const baseX = tipX - ux * headLength
  const baseY = tipY - uy * headLength
  const wing1X = baseX - uy * (headWidth / 2)
  const wing1Y = baseY + ux * (headWidth / 2)
  const wing2X = baseX + uy * (headWidth / 2)
  const wing2Y = baseY - ux * (headWidth / 2)

  // 标签位置：箭头中点 + 偏移
  const midX = (startPt.x + endPt.x) / 2 + labelOffset[0]
  const midY = (startPt.y + endPt.y) / 2 + labelOffset[1]

  return (
    <g>
      {/* 向量线段 */}
      <line
        x1={startPt.x}
        y1={startPt.y}
        x2={tipX}
        y2={tipY}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
      />
      {/* 箭头头部 */}
      <polygon
        points={`${tipX},${tipY} ${wing1X},${wing1Y} ${wing2X},${wing2Y}`}
        fill={color}
      />
      {/* 起点圆点 */}
      <circle
        cx={startPt.x}
        cy={startPt.y}
        r={3}
        fill={color}
      />
      {/* 标签 */}
      {label && (
        <text
          x={midX}
          y={midY}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={labelSize}
          fontWeight={600}
          fontFamily="monospace"
          className="select-none"
        >
          {label}
        </text>
      )}
    </g>
  )
}
