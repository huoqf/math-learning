import React from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  MathPoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { SceneScale } from "@/hooks";
import { CANVAS_COLORS, MATH_COLORS } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { formatMathNumber } from "@/utils/mathFormat";
import type { LabelItem } from "@/utils/labelOverlap";
import {
  evalPiecewiseNested,
  evalQuadraticAbs,
  solveNestedEquation,
  type NestedFuncMode,
} from "@/math/nestedFuncZeros";

interface NestedFuncZerosSceneProps {
  mode: NestedFuncMode;
  params: Record<string, number>;
  scale: SceneScale;
  fontScale: (base: number) => number;
}

export const NestedFuncZerosScene: React.FC<NestedFuncZerosSceneProps> = ({
  mode,
  params,
  scale,
  fontScale,
}) => {
  const a = params.targetA ?? 0.6;
  const b = params.paramB ?? 2.0;
  const c = params.shiftC ?? 0.0;
  const isPiecewise = mode === "piecewiseNested";

  const res = solveNestedEquation(mode, a, b, c);
  const fn = (x: number) =>
    isPiecewise ? evalPiecewiseNested(x, c) : evalQuadraticAbs(x, b, c);

  const leftA = mathToDesign(scale.xMin, a, scale);
  const rightA = mathToDesign(scale.xMax, a, scale);

  const labelItems: LabelItem[] = [
    ...res.outerRoots
      .filter((t) => t >= scale.xMin && t <= scale.xMax)
      .map((t, idx) => {
        const d = mathToDesign(t, a, scale);
        return {
          key: `outer-${idx}`,
          text: `t${idx + 1}=${formatMathNumber(t, 2)}`,
          x: d.x,
          y: d.y,
          color: MATH_COLORS.paramSecondary,
        };
      }),
  ];

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={true} />

      {/* 函数主曲线 */}
      {isPiecewise ? (
        <>
          <FunctionGraph
            fn={fn}
            scale={scale}
            domain={[scale.xMin, 0]}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
          />
          <FunctionGraph
            fn={fn}
            scale={scale}
            domain={[0.02, scale.xMax]}
            color={MATH_COLORS.function}
            strokeWidth={2.5}
          />
        </>
      ) : (
        <FunctionGraph
          fn={fn}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
      )}

      {/* 外层扫描水平线 y = a */}
      <line
        x1={leftA.x}
        y1={leftA.y}
        x2={rightA.x}
        y2={rightA.y}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2}
      />
      <text
        x={rightA.x - 10}
        y={leftA.y - 7}
        textAnchor="end"
        fontSize={fontScale(12)}
        fontWeight="700"
        fill={MATH_COLORS.paramPrimary}
      >
        外层扫线 y = {formatMathNumber(a, 2)}
      </text>

      {/* 内层展开水平线 y = t_k */}
      {res.branches.map((br, bIdx) => {
        if (br.tValue < scale.yMin || br.tValue > scale.yMax) return null;
        const pL = mathToDesign(scale.xMin, br.tValue, scale);
        const pR = mathToDesign(scale.xMax, br.tValue, scale);
        return (
          <g key={`branch-${bIdx}`}>
            <line
              x1={pL.x}
              y1={pL.y}
              x2={pR.x}
              y2={pR.y}
              stroke={MATH_COLORS.paramTertiary}
              strokeWidth={1.4}
              strokeDasharray="5 4"
            />
            {br.innerRoots.map((rx, rIdx) =>
              rx >= scale.xMin && rx <= scale.xMax ? (
                <MathPoint
                  key={`in-${bIdx}-${rIdx}`}
                  cx={rx}
                  cy={br.tValue}
                  scale={scale}
                  color={MATH_COLORS.inequality}
                  r={5}
                />
              ) : null,
            )}
          </g>
        );
      })}

      {/* 外层交点 */}
      {res.outerRoots.map((t, idx) =>
        t >= scale.xMin && t <= scale.xMax ? (
          <MathPoint
            key={`out-${idx}`}
            cx={t}
            cy={a}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            r={6}
          />
        ) : null,
      )}

      {/* 左上角统计微标 */}
      <rect
        x={22}
        y={22}
        width={210}
        height={40}
        rx={10}
        fill={CANVAS_COLORS.white}
        stroke={MATH_COLORS.inequality}
        strokeWidth={1.6}
      />
      <text
        x={127}
        y={47}
        textAnchor="middle"
        fontSize={fontScale(13)}
        fontWeight="800"
        fill={MATH_COLORS.inequality}
      >
        复合零点总根数：{res.totalCount} 个
      </text>

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
};
