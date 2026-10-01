import { MATH_COLORS, withAlpha } from "@/theme";
import type { ScenarioVisualProps } from "./types";

/** 模型 4：乒乓加赛 · 发球权局势轮换 */
export function ScenarioGamePingpong({
  pn,
  pNotN,
  currStep,
  p11,
  p21,
  lambda,
  tVal,
  fontScale,
  leftW,
  opacity,
}: ScenarioVisualProps) {
  return (
    <g transform="translate(0, 42)" opacity={opacity}>
      {/* 甲发球局 */}
      <g transform="translate(24, 35)">
        <rect
          x={0}
          y={0}
          width={145}
          height={180}
          rx={10}
          fill={withAlpha(MATH_COLORS.function, 0.06)}
          stroke={MATH_COLORS.function}
          strokeWidth={1.8}
        />
        <text
          x={72}
          y={26}
          fontSize={fontScale(11.5)}
          fontWeight="bold"
          fill={MATH_COLORS.function}
          textAnchor="middle"
        >
          甲发球局 (Aₙ)
        </text>
        <text
          x={72}
          y={46}
          fontSize={fontScale(10)}
          fill={MATH_COLORS.labelText}
          textAnchor="middle"
        >
          局势率 p_{currStep} = {pn.toFixed(3)}
        </text>
        <text
          x={72}
          y={95}
          fontSize={fontScale(10)}
          fill={MATH_COLORS.labelTextLight}
          textAnchor="middle"
        >
          甲拥有发球进攻优势
        </text>
        <rect
          x={12}
          y={130}
          width={121}
          height={32}
          rx={5}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.function}
        />
        <text
          x={72}
          y={150}
          fontSize={fontScale(9.5)}
          fontWeight="bold"
          fill={MATH_COLORS.function}
          textAnchor="middle"
        >
          甲发甲得分 p₁₁ = {p11.toFixed(2)}
        </text>
      </g>

      {/* 乙发球局 */}
      <g transform={`translate(${leftW - 169}, 35)`}>
        <rect
          x={0}
          y={0}
          width={145}
          height={180}
          rx={10}
          fill={withAlpha(MATH_COLORS.paramSecondary, 0.06)}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={1.8}
        />
        <text
          x={72}
          y={26}
          fontSize={fontScale(11.5)}
          fontWeight="bold"
          fill={MATH_COLORS.paramSecondary}
          textAnchor="middle"
        >
          乙发球局 (Āₙ)
        </text>
        <text
          x={72}
          y={46}
          fontSize={fontScale(10)}
          fill={MATH_COLORS.labelText}
          textAnchor="middle"
        >
          局势率 1 - pₙ = {pNotN.toFixed(3)}
        </text>
        <text
          x={72}
          y={95}
          fontSize={fontScale(10)}
          fill={MATH_COLORS.labelTextLight}
          textAnchor="middle"
        >
          乙发球甲反拉攻防
        </text>
        <rect
          x={12}
          y={130}
          width={121}
          height={32}
          rx={5}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.paramSecondary}
        />
        <text
          x={72}
          y={150}
          fontSize={fontScale(9.5)}
          fontWeight="bold"
          fill={MATH_COLORS.paramSecondary}
          textAnchor="middle"
        >
          乙发甲反得分 p₂₁ = {p21.toFixed(2)}
        </text>
      </g>

      {/* 局势轮换动态说明 */}
      <text
        x={leftW / 2}
        y={235}
        fontSize={fontScale(9)}
        fill={MATH_COLORS.labelTextLight}
        textAnchor="middle"
      >
        公比 λ = p₁₁ - p₂₁ = {lambda.toFixed(2)}，数列单调趋近于平衡概率{" "}
        {tVal.toFixed(2)}
      </text>
    </g>
  );
}
