import { MATH_COLORS, withAlpha } from "@/theme";
import type { ScenarioVisualProps } from "./types";
import { formatMathNumber, formatMathProb } from "@/utils/mathFormat";

/** 模型 5：自由探索 · 二状态通用转移 */
export function ScenarioFreeExplore({
  pn,
  pNotN,
  currStep,
  p11,
  p21,
  fontScale,
  leftW,
  opacity,
}: ScenarioVisualProps) {
  return (
    <g transform="translate(0, 42)" opacity={opacity}>
      {/* 状态 1 */}
      <g transform="translate(40, 50)">
        <circle
          cx={45}
          cy={45}
          r={40}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={2.5}
        />
        <text
          x={45}
          y={40}
          fontSize={fontScale(13)}
          fontWeight="bold"
          fill={MATH_COLORS.paramPrimary}
          textAnchor="middle"
        >
          状态 1 (Aₙ)
        </text>
        <text
          x={45}
          y={58}
          fontSize={fontScale(11)}
          fill={MATH_COLORS.labelText}
          textAnchor="middle"
        >
          p_{currStep} = {formatMathProb(pn)}
        </text>
      </g>

      {/* 状态 2 */}
      <g transform={`translate(${leftW - 130}, 50)`}>
        <circle
          cx={45}
          cy={45}
          r={40}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={2.5}
        />
        <text
          x={45}
          y={40}
          fontSize={fontScale(13)}
          fontWeight="bold"
          fill={MATH_COLORS.paramSecondary}
          textAnchor="middle"
        >
          状态 2 (Āₙ)
        </text>
        <text
          x={45}
          y={58}
          fontSize={fontScale(11)}
          fill={MATH_COLORS.labelText}
          textAnchor="middle"
        >
          1 - pₙ = {formatMathProb(pNotN)}
        </text>
      </g>

      {/* 左侧自环：1→1 自保持 */}
      <path
        d="M 55 68 C 12 42 12 148 55 122"
        fill="none"
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2}
        markerEnd="url(#m-arrow-primary)"
      />
      <text
        x={22}
        y={34}
        fontSize={fontScale(9.5)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
        textAnchor="start"
      >
        自保持 p₁₁={formatMathNumber(p11)}
      </text>

      {/* 顶部跨状态弧：1→2 流出 */}
      <path
        d={`M 125 75 Q ${leftW / 2} 45 ${leftW - 125} 75`}
        fill="none"
        stroke={withAlpha(MATH_COLORS.paramPrimary, 0.75)}
        strokeWidth={1.8}
        strokeDasharray="4 2"
        markerEnd="url(#m-arrow-primary)"
      />
      <text
        x={leftW / 2}
        y={42}
        fontSize={fontScale(9.5)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
        textAnchor="middle"
      >
        跨状态流出 1-p₁₁ = {formatMathNumber(1 - p11)}
      </text>

      {/* 底部跨状态弧：2→1 流入 */}
      <path
        d={`M ${leftW - 125} 115 Q ${leftW / 2} 145 125 115`}
        fill="none"
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2}
        markerEnd="url(#m-arrow-secondary)"
      />
      <text
        x={leftW / 2}
        y={152}
        fontSize={fontScale(9.5)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        跨状态转移 p₂₁ = {formatMathNumber(p21)}
      </text>

      {/* 右侧自环：2→2 自保持 */}
      <path
        d={`M ${leftW - 55} 68 C ${leftW - 12} 42 ${leftW - 12} 148 ${leftW - 55} 122`}
        fill="none"
        stroke={withAlpha(MATH_COLORS.paramSecondary, 0.75)}
        strokeWidth={1.8}
        strokeDasharray="4 2"
        markerEnd="url(#m-arrow-secondary)"
      />
      <text
        x={leftW - 22}
        y={34}
        fontSize={fontScale(9.5)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="end"
      >
        留存 1-p₂₁={formatMathNumber(1 - p21)}
      </text>
    </g>
  );
}
