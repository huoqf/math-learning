/**
 * src/features/sequence/components/SequenceArithmeticSnToAnScene.tsx
 * 已知 S_n 求 a_n（选择性必修二 4.1）—— 作差法的几何证据
 *
 * 画面只有一件事：S_n 的第 n 个点与第 n−1 个点之间的**竖直落差**，
 * 就是通项 a_n。于是「a_n = S_n − S_{n−1}」不是背出来的公式，
 * 而是学生自己从图上量出来的高度差。
 *
 * n = 1 处没有 S_0，只能用 a_1 = S_1；一旦题给的 S_n 带常数项 C，
 * 这根「从 0 到 S_1」的竖条就不再等于 a_1 —— 用警示色单独标出，
 * 这就是「必须分段」在画面上的样子。
 */
import React from "react";
import { CoordinateGrid } from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale, ViewportInfo } from "@/hooks";
import { calcSnToAn } from "@/math/sequence";
import { formatMathNumber } from "@/utils/mathFormat";

interface SequenceArithmeticSnToAnSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  highlightN?: number;
  onSelectN?: (n: number) => void;
}

export const SequenceArithmeticSnToAnScene: React.FC<
  SequenceArithmeticSnToAnSceneProps
> = ({ params, scale, fontScale, highlightN = 1 }) => {
  const a1 = params.a1 ?? 5;
  const d = params.d ?? -1.5;
  const N = Math.max(4, Math.min(12, Math.round(params.N ?? 8)));
  const C = params.snConst ?? 0;

  const res = calcSnToAn(a1, d, N, C);
  if (!res.isValid) return null;

  const snPoints = res.terms.map((t) => ({
    ...t,
    pt: mathToDesign(t.n, t.Sn, scale),
  }));

  const zeroY = mathToDesign(0, 0, scale).y;

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* S_n 的折线：抛物线形状，说明 S_n 本身不是等差 */}
      <polyline
        points={snPoints.map((p) => `${p.pt.x},${p.pt.y}`).join(" ")}
        fill="none"
        stroke={withAlpha(MATH_COLORS.sequenceSum, 0.45)}
        strokeWidth={1.6}
        strokeDasharray="6 4"
      />

      {/* 每一步的竖直落差：高度差 = 该步的通项 a_n */}
      {snPoints.map((p) => {
        const isFirst = p.n === 1;
        // n = 1 的竖条从 0 量到 S_1：只有当 C = 0 时它才等于 a_1
        const fromY =
          isFirst && p.n === 1 ? zeroY : (snPoints[p.n - 2]?.pt.y ?? zeroY);
        const broken = isFirst && !res.isFirstTermConsistent;
        return (
          <g key={`bar-${p.n}`}>
            <line
              x1={p.pt.x}
              y1={fromY}
              x2={p.pt.x}
              y2={p.pt.y}
              stroke={broken ? MATH_COLORS.degeneracy : MATH_COLORS.sequence}
              strokeWidth={broken ? 3 : 2}
              opacity={broken ? 1 : 0.85}
            />
            <text
              x={p.pt.x + 6}
              y={(fromY + p.pt.y) / 2}
              fontSize={fontScale(10)}
              fill={broken ? MATH_COLORS.degeneracy : MATH_COLORS.sequence}
            >
              {isFirst
                ? `S₁=${formatMathNumber(p.Sn)}`
                : `a${p.n}=${formatMathNumber(p.anFromSn ?? 0)}`}
            </text>
          </g>
        );
      })}

      {/* S_n 散点 */}
      {snPoints.map((p) => (
        <circle
          key={`sn-${p.n}`}
          cx={p.pt.x}
          cy={p.pt.y}
          r={p.n === highlightN ? 5 : 3.4}
          fill={MATH_COLORS.sequenceSum}
          stroke={p.n === highlightN ? MATH_COLORS.sequenceHighlight : "none"}
          strokeWidth={p.n === highlightN ? 2 : 0}
        />
      ))}

      {/* 首项与作差式的落差可视化：两条等高的参考线，差距一眼可辨 */}
      {!res.isFirstTermConsistent && (
        <>
          <line
            x1={mathToDesign(0.55, res.a1FromSn, scale).x}
            y1={mathToDesign(0.55, res.a1FromSn, scale).y}
            x2={mathToDesign(1.75, res.a1FromSn, scale).x}
            y2={mathToDesign(1.75, res.a1FromSn, scale).y}
            stroke={MATH_COLORS.degeneracy}
            strokeWidth={1.4}
            strokeDasharray="4 3"
          />
          <line
            x1={mathToDesign(0.55, res.a1FromFormula, scale).x}
            y1={mathToDesign(0.55, res.a1FromFormula, scale).y}
            x2={mathToDesign(1.75, res.a1FromFormula, scale).x}
            y2={mathToDesign(1.75, res.a1FromFormula, scale).y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={1.4}
            strokeDasharray="4 3"
          />
          <text
            x={mathToDesign(1.85, res.a1FromSn, scale).x}
            y={mathToDesign(1.85, res.a1FromSn, scale).y}
            fontSize={fontScale(10)}
            fill={MATH_COLORS.degeneracy}
          >
            {`S₁ = ${formatMathNumber(res.a1FromSn)}`}
          </text>
          <text
            x={mathToDesign(1.85, res.a1FromFormula, scale).x}
            y={mathToDesign(1.85, res.a1FromFormula, scale).y}
            fontSize={fontScale(10)}
            fill={MATH_COLORS.paramTertiary}
          >
            {`作差式取 n=1 → ${formatMathNumber(res.a1FromFormula)}`}
          </text>
        </>
      )}
    </g>
  );
};
