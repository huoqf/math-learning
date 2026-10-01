import { MATH_COLORS } from "@/theme";
import type { ScenarioVisualProps } from "./types";

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
          p_{currStep} = {pn.toFixed(3)}
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
          1 - pₙ = {pNotN.toFixed(3)}
        </text>
      </g>

      {/* 转移箭头：1→1 自保持 */}
      <path
        d={`M 125 75 Q ${leftW / 2} 45 ${leftW - 125} 75`}
        fill="none"
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2}
        markerEnd="url(#m-arrow-primary)"
      />
      <text
        x={leftW / 2}
        y={40}
        fontSize={fontScale(10)}
        fontWeight="bold"
        fill={MATH_COLORS.paramPrimary}
        textAnchor="middle"
      >
        自保持转移率 p₁₁ = {p11.toFixed(2)}
      </text>

      {/* 转移箭头：2→1 跨状态 */}
      <path
        d={`M ${leftW - 125} 115 Q ${leftW / 2} 145 125 115`}
        fill="none"
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2}
        markerEnd="url(#m-arrow-secondary)"
      />
      <text
        x={leftW / 2}
        y={150}
        fontSize={fontScale(10)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        跨状态转移率 p₂₁ = {p21.toFixed(2)}
      </text>
    </g>
  );
}
