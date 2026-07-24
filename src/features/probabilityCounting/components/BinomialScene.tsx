import { useMemo } from "react";
import { MATH_COLORS, withAlpha } from "../../../theme";
import {
  getPascalTriangle,
  getAllBinomialTerms,
} from "../../../math/probabilityCounting";
import type { SceneCommonProps } from "./types";

export function BinomialScene({
  params,
  onParamChange,
  fontScale = (v) => v,
}: SceneCommonProps) {
  const n = Math.floor(params.n ?? 5);
  const k = Math.min(Math.floor(params.k ?? 2), n);
  const a = params.a ?? 1;
  const b = params.b ?? 1;

  const W = 840;

  const pascalTriangle = useMemo(() => {
    return getPascalTriangle(Math.min(n, 8));
  }, [n]);

  const binomialTerms = useMemo(() => {
    return getAllBinomialTerms(n, a, b);
  }, [n, a, b]);

  return (
    <g transform="translate(0, 10)">
      {/* 背景分隔线 */}
      <line
        x1={40}
        y1={422}
        x2={W - 40}
        y2={422}
        stroke={MATH_COLORS.grid}
        strokeDasharray="4 4"
        strokeWidth={1}
      />

      {/* 杨辉三角节点与连线 */}
      {pascalTriangle.map((row, r) => {
        const count = row.length;
        const startY = 45;
        const rowGap = 42;
        const nodeRadius = 18;
        const y = startY + r * rowGap;

        return (
          <g key={`row-${r}`}>
            {/* 行标 */}
            <text
              x={65}
              y={y + 5}
              fill={r === n ? MATH_COLORS.paramPrimary : MATH_COLORS.textMuted}
              fontSize={fontScale(12)}
              fontWeight={r === n ? "bold" : "normal"}
            >
              n = {r}
            </text>

            {row.map((val, c) => {
              const totalWidth = (count - 1) * 54;
              const x = W / 2 - totalWidth / 2 + c * 54;

              const isCurrentRow = r === n;
              const isSelectedNode = isCurrentRow && c === k;

              return (
                <g
                  key={`node-${r}-${c}`}
                  onClick={() => {
                    onParamChange("n", r);
                    onParamChange("k", c);
                  }}
                  className="cursor-pointer transition-all duration-300"
                >
                  {/* 递推连线 */}
                  {r > 0 && (
                    <g>
                      {c > 0 && (
                        <line
                          x1={x}
                          y1={y}
                          x2={W / 2 - ((r - 1) * 54) / 2 + (c - 1) * 54}
                          y2={y - rowGap}
                          stroke={
                            isSelectedNode
                              ? MATH_COLORS.paramPrimary
                              : MATH_COLORS.pascalLinkLine
                          }
                          strokeWidth={isSelectedNode ? 2.5 : 1}
                          strokeOpacity={isSelectedNode ? 1 : 0.4}
                        />
                      )}
                      {c < r && (
                        <line
                          x1={x}
                          y1={y}
                          x2={W / 2 - ((r - 1) * 54) / 2 + c * 54}
                          y2={y - rowGap}
                          stroke={
                            isSelectedNode
                              ? MATH_COLORS.paramPrimary
                              : MATH_COLORS.pascalLinkLine
                          }
                          strokeWidth={isSelectedNode ? 2.5 : 1}
                          strokeOpacity={isSelectedNode ? 1 : 0.4}
                        />
                      )}
                    </g>
                  )}

                  {/* 选中发光环 */}
                  {isSelectedNode && (
                    <circle
                      cx={x}
                      cy={y}
                      r={nodeRadius + 6}
                      fill={MATH_COLORS.pascalSelectedGlow}
                      stroke={MATH_COLORS.paramPrimary}
                      strokeWidth={2}
                      className="animate-pulse"
                    />
                  )}

                  {/* 节点底色圆 */}
                  <circle
                    cx={x}
                    cy={y}
                    r={nodeRadius}
                    fill={
                      isSelectedNode
                        ? MATH_COLORS.paramPrimary
                        : isCurrentRow
                          ? withAlpha(MATH_COLORS.paramSecondary, 0.15)
                          : MATH_COLORS.pascalNodeBg
                    }
                    stroke={
                      isSelectedNode
                        ? MATH_COLORS.paramPrimary
                        : isCurrentRow
                          ? MATH_COLORS.paramSecondary
                          : MATH_COLORS.pascalNodeBorder
                    }
                    strokeWidth={isSelectedNode || isCurrentRow ? 2 : 1}
                  />

                  {/* 数值 */}
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fill={
                      isSelectedNode ? MATH_COLORS.white : MATH_COLORS.labelText
                    }
                    fontSize={fontScale(val > 99 ? 10 : 12)}
                    fontWeight={isSelectedNode ? "bold" : "normal"}
                  >
                    {val}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* 下方柱状图：对比 C_n^k 与 实际项系数 A_k */}
      <g transform="translate(60, 455)">
        {binomialTerms.map((term, index) => {
          const numTerms = binomialTerms.length;
          const barGroupWidth = Math.min(680 / numTerms, 70);
          const x = index * barGroupWidth + 20;

          const isSelected = index === k;

          const maxCoeff = Math.max(
            ...binomialTerms.map((t) => Math.abs(t.termCoeff)),
            ...binomialTerms.map((t) => t.binomialCoeff),
            1,
          );

          const binomHeight = (term.binomialCoeff / maxCoeff) * 105;
          const termAbsHeight = (Math.abs(term.termCoeff) / maxCoeff) * 105;

          const isNegative = term.termCoeff < 0;

          return (
            <g
              key={`bar-${index}`}
              onClick={() => onParamChange("k", index)}
              className="cursor-pointer"
            >
              {isSelected && (
                <rect
                  x={x - 4}
                  y={-10}
                  width={barGroupWidth - 8}
                  height={150}
                  fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeDasharray="3 3"
                  rx={6}
                />
              )}

              <rect
                x={x}
                y={115 - binomHeight}
                width={barGroupWidth / 2 - 4}
                height={Math.max(binomHeight, 3)}
                fill={
                  isSelected
                    ? MATH_COLORS.barFill
                    : withAlpha(MATH_COLORS.barFill, 0.45)
                }
                rx={3}
              />

              <rect
                x={x + barGroupWidth / 2 - 2}
                y={115 - termAbsHeight}
                width={barGroupWidth / 2 - 4}
                height={Math.max(termAbsHeight, 3)}
                fill={
                  isNegative
                    ? MATH_COLORS.tangentLine
                    : isSelected
                      ? MATH_COLORS.functionTransformed
                      : withAlpha(MATH_COLORS.functionTransformed, 0.5)
                }
                rx={3}
              />

              <text
                x={x + barGroupWidth / 2 - 3}
                y={132}
                textAnchor="middle"
                fill={
                  isSelected
                    ? MATH_COLORS.paramPrimary
                    : MATH_COLORS.labelTextLight
                }
                fontSize={fontScale(11)}
                fontWeight={isSelected ? "bold" : "normal"}
              >
                T{index + 1}
              </text>

              <text
                x={x + barGroupWidth / 2 - 3}
                y={115 - Math.max(binomHeight, termAbsHeight) - 5}
                textAnchor="middle"
                fill={
                  isNegative ? MATH_COLORS.tangentLine : MATH_COLORS.labelText
                }
                fontSize={fontScale(9)}
                fontWeight="bold"
              >
                {term.termCoeff}
              </text>
            </g>
          );
        })}
      </g>
    </g>
  );
}
