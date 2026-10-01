import { MATH_COLORS, withAlpha } from "@/theme";
import type { ScenarioVisualProps } from "./types";

/** 模型 3：摸球置换 · 白球池与黑球池 */
export function ScenarioUrnReplace({
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
      {/* 白球池 (事件 A_n) */}
      <g transform="translate(24, 30)">
        <rect
          x={0}
          y={0}
          width={140}
          height={190}
          rx={10}
          fill={withAlpha(MATH_COLORS.function, 0.06)}
          stroke={MATH_COLORS.function}
          strokeWidth={1.8}
        />
        <text
          x={70}
          y={26}
          fontSize={fontScale(12)}
          fontWeight="bold"
          fill={MATH_COLORS.function}
          textAnchor="middle"
        >
          白球池 (Aₙ)
        </text>
        <text
          x={70}
          y={46}
          fontSize={fontScale(10)}
          fill={MATH_COLORS.labelText}
          textAnchor="middle"
        >
          当前概率 p_{currStep} = {pn.toFixed(3)}
        </text>

        {/* 示意白球图元 */}
        <circle
          cx={45}
          cy={80}
          r={16}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.function}
          strokeWidth={2}
        />
        <circle
          cx={95}
          cy={80}
          r={16}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.function}
          strokeWidth={2}
        />
        <circle
          cx={70}
          cy={120}
          r={18}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.function}
          strokeWidth={2}
        />
        <text
          x={70}
          y={125}
          fontSize={fontScale(10)}
          fill={MATH_COLORS.function}
          textAnchor="middle"
        >
          白球
        </text>

        <rect
          x={12}
          y={150}
          width={116}
          height={26}
          rx={5}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.function}
        />
        <text
          x={70}
          y={167}
          fontSize={fontScale(9.5)}
          fontWeight="bold"
          fill={MATH_COLORS.function}
          textAnchor="middle"
        >
          摸白放回率 p₁₁ = {p11.toFixed(2)}
        </text>
      </g>

      {/* 黑球池 (对立事件 Ā_n) */}
      <g transform={`translate(${leftW - 164}, 30)`}>
        <rect
          x={0}
          y={0}
          width={140}
          height={190}
          rx={10}
          fill={withAlpha(MATH_COLORS.paramSecondary, 0.06)}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={1.8}
        />
        <text
          x={70}
          y={26}
          fontSize={fontScale(12)}
          fontWeight="bold"
          fill={MATH_COLORS.paramSecondary}
          textAnchor="middle"
        >
          黑球池 (Āₙ)
        </text>
        <text
          x={70}
          y={46}
          fontSize={fontScale(10)}
          fill={MATH_COLORS.labelText}
          textAnchor="middle"
        >
          对立概率 1 - pₙ = {pNotN.toFixed(3)}
        </text>

        {/* 示意黑球图元 */}
        <circle
          cx={45}
          cy={80}
          r={16}
          fill={MATH_COLORS.axis}
          stroke={MATH_COLORS.labelText}
        />
        <circle
          cx={95}
          cy={80}
          r={16}
          fill={MATH_COLORS.axis}
          stroke={MATH_COLORS.labelText}
        />
        <circle
          cx={70}
          cy={120}
          r={18}
          fill={MATH_COLORS.axis}
          stroke={MATH_COLORS.labelText}
        />
        <text
          x={70}
          y={125}
          fontSize={fontScale(10)}
          fill={MATH_COLORS.white}
          textAnchor="middle"
        >
          黑球
        </text>

        <rect
          x={12}
          y={150}
          width={116}
          height={26}
          rx={5}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.paramSecondary}
        />
        <text
          x={70}
          y={167}
          fontSize={fontScale(9.5)}
          fontWeight="bold"
          fill={MATH_COLORS.paramSecondary}
          textAnchor="middle"
        >
          换白注入率 p₂₁ = {p21.toFixed(2)}
        </text>
      </g>

      {/* 顶置换箭头 */}
      <path
        d={`M ${leftW - 164} 60 Q ${leftW / 2} 40 164 60`}
        fill="none"
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2}
        markerEnd="url(#m-arrow-secondary)"
      />
      <text
        x={leftW / 2}
        y={38}
        fontSize={fontScale(9.5)}
        fontWeight="bold"
        fill={MATH_COLORS.paramSecondary}
        textAnchor="middle"
      >
        摸出黑球以概率 p₂₁ 换入白球
      </text>
    </g>
  );
}
