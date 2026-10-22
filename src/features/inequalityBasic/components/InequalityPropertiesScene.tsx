/**
 * src/features/inequalityBasic/components/InequalityPropertiesScene.tsx
 * 等式与不等式的性质（必修一 2.1）—— 三条基线并置的大小关系实验台
 *
 * 三条基线各代表一次「同样两个数、做不同运算」的结果：
 *   上：a 与 b 原样            中：同加 c          下：同乘 c
 * 学生只需看「两个色块谁在左谁在右」：同加之后左右次序必然不变，
 * 同乘负数之后次序整体翻转（相当于数轴关于原点对称）——这就是变向的几何真相。
 *
 * 本场景不画曲线、不画面积，只保留数轴与点，避免把「性质」讲成「函数」。
 */
import React from "react";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks";
import type { ViewportInfo } from "@/utils/useViewport";
import { analyzeInequalityProperties } from "@/math/inequalityProperties";
import { formatMathNumber } from "@/utils/mathFormat";

interface Props {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  onParamChange: (key: string, value: number) => void;
}

/** 三条基线的数学纵坐标：上、中、下 */
const ROW_Y = [2.4, 0, -2.4] as const;

export const InequalityPropertiesScene: React.FC<Props> = ({
  params,
  scale,
  fontScale,
}) => {
  const a = params.pA ?? 3;
  const b = params.pB ?? -1;
  const c = params.pC ?? -2;
  const res = analyzeInequalityProperties(a, b, c);

  const rows = [
    {
      key: "raw",
      title: "原数",
      xa: a,
      xb: b,
      colorA: MATH_COLORS.paramPrimary,
      colorB: MATH_COLORS.paramSecondary,
      tag: `a = ${formatMathNumber(a)}`,
      tagB: `b = ${formatMathNumber(b)}`,
    },
    {
      key: "sum",
      title: `同加 c = ${formatMathNumber(c)}`,
      xa: res.sumA,
      xb: res.sumB,
      colorA: MATH_COLORS.paramPrimary,
      colorB: MATH_COLORS.paramSecondary,
      tag: `a+c = ${formatMathNumber(res.sumA)}`,
      tagB: `b+c = ${formatMathNumber(res.sumB)}`,
    },
    {
      key: "prod",
      title: `同乘 c = ${formatMathNumber(c)}`,
      xa: res.prodA,
      xb: res.prodB,
      colorA: res.isProdReversed
        ? MATH_COLORS.degeneracy
        : MATH_COLORS.paramPrimary,
      colorB: res.isProdReversed
        ? MATH_COLORS.degeneracy
        : MATH_COLORS.paramSecondary,
      tag: `ac = ${formatMathNumber(res.prodA)}`,
      tagB: `bc = ${formatMathNumber(res.prodB)}`,
    },
  ];

  return (
    <g>
      {rows.map((row, idx) => {
        const y = ROW_Y[idx];
        const pA = mathToDesign(row.xa, y, scale);
        const pB = mathToDesign(row.xb, y, scale);
        const axisLeft = mathToDesign(scale.xMin, y, scale);
        const axisRight = mathToDesign(scale.xMax, y, scale);
        return (
          <g key={row.key}>
            {/* 该行的数轴基线 */}
            <line
              x1={axisLeft.x}
              y1={axisLeft.y}
              x2={axisRight.x}
              y2={axisRight.y}
              stroke={MATH_COLORS.axis}
              strokeWidth={1.4}
            />
            <text
              x={axisLeft.x + 6}
              y={axisLeft.y - fontScale(8)}
              fontSize={fontScale(11)}
              fill={MATH_COLORS.labelTextLight}
            >
              {row.title}
            </text>

            {/* 两点之间的差：长度即 |a − b|，方向指示谁大 */}
            <line
              x1={pB.x}
              y1={pB.y}
              x2={pA.x}
              y2={pA.y}
              stroke={withAlpha(row.colorA, 0.35)}
              strokeWidth={6}
            />

            <circle cx={pA.x} cy={pA.y} r={4.5} fill={row.colorA} />
            <text
              x={pA.x}
              y={pA.y - fontScale(10)}
              fontSize={fontScale(11)}
              textAnchor="middle"
              fill={row.colorA}
            >
              {row.tag}
            </text>

            <circle cx={pB.x} cy={pB.y} r={4.5} fill={row.colorB} />
            <text
              x={pB.x}
              y={pB.y + fontScale(18)}
              fontSize={fontScale(11)}
              textAnchor="middle"
              fill={row.colorB}
            >
              {row.tagB}
            </text>
          </g>
        );
      })}

      {/* 结论条：不变向 / 变向一眼可见 */}
      <text
        x={mathToDesign(scale.xMin, 0, scale).x + 6}
        y={mathToDesign(0, 0, scale).y + fontScale(78)}
        fontSize={fontScale(12)}
        fill={
          res.isProdReversed ? MATH_COLORS.degeneracy : MATH_COLORS.labelText
        }
      >
        {`a ${res.relation === "gt" ? ">" : res.relation === "lt" ? "<" : "="} b ，同加后仍 ${res.sumRelation === "gt" ? ">" : res.sumRelation === "lt" ? "<" : "="} ，同乘后 ${res.prodRelation === "gt" ? ">" : res.prodRelation === "lt" ? "<" : "="}${res.isProdReversed ? "（变向）" : ""}`}
      </text>
    </g>
  );
};
