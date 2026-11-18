import { MATH_COLORS, withAlpha } from "@/theme";
import type { ScenarioVisualProps } from "./types";
import { formatMathProb } from "@/utils/mathFormat";

/** 模型 2：四人传球 · 对称合并其他三人 */
export function ScenarioPassBall4({
  pn,
  currStep,
  fontScale,
  leftW,
  opacity,
}: ScenarioVisualProps) {
  return (
    <g transform="translate(0, 42)" opacity={opacity}>
      {/* 对称合并群背景框 (包围乙/丙/丁) */}
      <rect
        x={18}
        y={145}
        width={leftW - 36}
        height={96}
        rx={10}
        fill={withAlpha(MATH_COLORS.paramSecondary, 0.06)}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={1.2}
        strokeDasharray="4 3"
      />
      <text
        x={28}
        y={162}
        fontSize={fontScale(10)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
      >
        【对称合并】对立事件 Āₙ：球在乙/丙/丁手中 (共 3 人)
      </text>

      {/* 节点：甲 */}
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
        p_{currStep} = {formatMathProb(pn)}
      </text>

      {/* 乙、丙、丁 3 节点 */}
      {[
        { label: "乙", x: 65 },
        { label: "丙", x: leftW / 2 },
        { label: "丁", x: leftW - 65 },
      ].map((p, idx) => (
        <g key={idx}>
          <circle
            cx={p.x}
            cy={198}
            r={22}
            fill={MATH_COLORS.white}
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={1.8}
          />
          <text
            x={p.x}
            y={202}
            fontSize={fontScale(11)}
            fontWeight="bold"
            fill={MATH_COLORS.paramSecondary}
            textAnchor="middle"
          >
            {p.label}
          </text>
        </g>
      ))}

      {/* 甲向乙/丙/丁传出弧线（每条等概率 1/3） */}
      <path
        d={`M ${leftW / 2 - 26} 72 Q ${leftW / 2 - 68} 112 65 174`}
        fill="none"
        stroke={withAlpha(MATH_COLORS.paramPrimary, 0.55)}
        strokeWidth={1.6}
        markerEnd="url(#m-arrow-primary)"
      />
      <path
        d={`M ${leftW / 2 + 26} 72 Q ${leftW / 2 + 68} 112 ${leftW - 65} 174`}
        fill="none"
        stroke={withAlpha(MATH_COLORS.paramPrimary, 0.55)}
        strokeWidth={1.6}
        markerEnd="url(#m-arrow-primary)"
      />

      {/* 回传甲中心箭线与白底保护标签（避免箭头直接穿字） */}
      <path
        d={`M ${leftW / 2} 176 L ${leftW / 2} 86`}
        fill="none"
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2.2}
        markerEnd="url(#m-arrow-secondary)"
      />
      <rect
        x={leftW / 2 - 84}
        y={96}
        width={168}
        height={16}
        rx={4}
        fill={withAlpha(MATH_COLORS.white, 0.92)}
      />
      <text
        x={leftW / 2}
        y={107}
        fontSize={fontScale(9)}
        fill={MATH_COLORS.paramPrimary}
        textAnchor="middle"
      >
        甲必传另 3 人之一 (p₁₁ = 0)
      </text>
      <rect
        x={leftW / 2 + 8}
        y={119}
        width={132}
        height={18}
        rx={4}
        fill={withAlpha(MATH_COLORS.white, 0.92)}
      />
      <text
        x={leftW / 2 + 12}
        y={131}
        fontSize={fontScale(9.5)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
      >
        回传甲 p₂₁ = 1/3 ≈ 0.333
      </text>
      <text
        x={leftW / 2}
        y={230}
        fontSize={fontScale(8.5)}
        fill={MATH_COLORS.labelTextLight}
        textAnchor="middle"
      >
        四人地位对称，最终各状态概率均趋于同一平衡值 t = 0.25
      </text>
    </g>
  );
}
