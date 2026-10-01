import { MATH_COLORS, withAlpha } from "@/theme";
import type { ScenarioVisualProps } from "./types";

/** 模型 1：三人传球 (2020高考真题) · 对称合并乙丙 */
export function ScenarioPassBall3({
  pn,
  pNotN,
  currStep,
  fontScale,
  leftW,
  opacity,
}: ScenarioVisualProps) {
  return (
    <g transform="translate(0, 42)" opacity={opacity}>
      {/* 对称合并群背景框 (包围乙与丙) */}
      <rect
        x={22}
        y={145}
        width={leftW - 44}
        height={96}
        rx={10}
        fill={withAlpha(MATH_COLORS.paramSecondary, 0.06)}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={1.2}
        strokeDasharray="4 3"
      />
      <text
        x={32}
        y={162}
        fontSize={fontScale(10)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
      >
        【对称合并】对立事件 Āₙ：球在乙或丙手中 (概率 1 - pₙ)
      </text>

      {/* 节点：甲 (事件 A_n) */}
      <circle
        cx={leftW / 2}
        cy={52}
        r={32}
        fill={MATH_COLORS.white}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2.5}
      />
      <text
        x={leftW / 2}
        y={46}
        fontSize={fontScale(13)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
        textAnchor="middle"
      >
        甲 (Aₙ)
      </text>
      <text
        x={leftW / 2}
        y={64}
        fontSize={fontScale(10.5)}
        fill={MATH_COLORS.labelText}
        textAnchor="middle"
      >
        p_{currStep} = {pn.toFixed(3)}
      </text>

      {/* 节点：乙 */}
      <circle
        cx={85}
        cy={198}
        r={24}
        fill={MATH_COLORS.white}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={1.8}
      />
      <text
        x={85}
        y={196}
        fontSize={fontScale(11.5)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        乙
      </text>
      <text
        x={85}
        y={212}
        fontSize={fontScale(9)}
        fill={MATH_COLORS.labelTextLight}
        textAnchor="middle"
      >
        {(pNotN / 2).toFixed(3)}
      </text>

      {/* 节点：丙 */}
      <circle
        cx={leftW - 85}
        cy={198}
        r={24}
        fill={MATH_COLORS.white}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={1.8}
      />
      <text
        x={leftW - 85}
        y={196}
        fontSize={fontScale(11.5)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        丙
      </text>
      <text
        x={leftW - 85}
        y={212}
        fontSize={fontScale(9)}
        fill={MATH_COLORS.labelTextLight}
        textAnchor="middle"
      >
        {(pNotN / 2).toFixed(3)}
      </text>

      {/* 传球弧线：甲传出 (各 0.50) */}
      <path
        d={`M ${leftW / 2 - 22} 74 Q ${leftW / 2 - 60} 115 85 174`}
        fill="none"
        stroke={withAlpha(MATH_COLORS.paramPrimary, 0.6)}
        strokeWidth={1.8}
        markerEnd="url(#m-arrow-primary)"
      />
      <path
        d={`M ${leftW / 2 + 22} 74 Q ${leftW / 2 + 60} 115 ${leftW - 85} 174`}
        fill="none"
        stroke={withAlpha(MATH_COLORS.paramPrimary, 0.6)}
        strokeWidth={1.8}
        markerEnd="url(#m-arrow-primary)"
      />
      <text
        x={leftW / 2}
        y={106}
        fontSize={fontScale(9.5)}
        fill={MATH_COLORS.paramPrimary}
        textAnchor="middle"
      >
        甲必传给乙或丙 (甲留存 p₁₁ = 0)
      </text>

      {/* 传球弧线：回传给甲 (条件概率各 0.50) */}
      <path
        d={`M 98 178 Q ${leftW / 2 - 25} 130 ${leftW / 2 - 12} 86`}
        fill="none"
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2}
        markerEnd="url(#m-arrow-secondary)"
      />
      <path
        d={`M ${leftW - 98} 178 Q ${leftW / 2 + 25} 130 ${leftW / 2 + 12} 86`}
        fill="none"
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2}
        markerEnd="url(#m-arrow-secondary)"
      />
      <text
        x={leftW / 2}
        y={128}
        fontSize={fontScale(10)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        回传甲概率 p₂₁ = 1/2 = 0.50
      </text>

      {/* 乙丙互传说明 */}
      <line
        x1={112}
        y1={198}
        x2={leftW - 112}
        y2={198}
        stroke={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
        strokeWidth={1.5}
        strokeDasharray="2 2"
      />
      <text
        x={leftW / 2}
        y={193}
        fontSize={fontScale(8.5)}
        fill={MATH_COLORS.labelTextLight}
        textAnchor="middle"
      >
        乙 ↔ 丙 互传 (各 1/2，不影响对立事件总和)
      </text>
    </g>
  );
}
