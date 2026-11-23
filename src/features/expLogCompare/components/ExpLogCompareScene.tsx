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
  calcCompareTriplet,
  calcLogOperations,
  safeLogBase,
  type ExpLogCompareMode,
} from "@/math/expLogCompare";

interface ExpLogCompareSceneProps {
  mode: ExpLogCompareMode;
  activeScenario: string;
  params: Record<string, number>;
  scale: SceneScale;
  fontScale: (base: number) => number;
}

export const ExpLogCompareScene: React.FC<ExpLogCompareSceneProps> = ({
  mode,
  activeScenario,
  params,
  scale,
  fontScale,
}) => {
  const a = params.baseA ?? 2.0;
  const m = params.valM ?? 2.0;
  const n = params.valN ?? 3.0;
  const xSample = params.xSample ?? 0.6;

  if (mode === "logOps") {
    const res = calcLogOperations(a, m, n, params.newBaseC ?? 3.0);
    const logFn = (x: number) => safeLogBase(a, x);

    const points =
      res.validity === "ok"
        ? [
            {
              key: "M",
              text: `M(${formatMathNumber(m, 1)}, ${formatMathNumber(res.logAM, 2)})`,
              mx: m,
              my: res.logAM,
              color: MATH_COLORS.paramSecondary,
            },
            {
              key: "N",
              text: `N(${formatMathNumber(n, 1)}, ${formatMathNumber(res.logAN, 2)})`,
              mx: n,
              my: res.logAN,
              color: MATH_COLORS.paramTertiary,
            },
            {
              key: "MN",
              text: `MN(${formatMathNumber(m * n, 1)}, ${formatMathNumber(res.logAMN, 2)})`,
              mx: m * n,
              my: res.logAMN,
              color: MATH_COLORS.function,
            },
          ]
        : [];

    const labelItems: LabelItem[] = points
      .filter((pt) => Number.isFinite(pt.my) && pt.mx <= scale.xMax)
      .map((pt) => {
        const d = mathToDesign(pt.mx, pt.my, scale);
        return {
          key: pt.key,
          text: pt.text,
          x: d.x,
          y: d.y,
          color: pt.color,
        };
      });

    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={true} />
        {res.validity === "ok" && (
          <>
            <FunctionGraph
              fn={logFn}
              scale={scale}
              domain={[0.04, scale.xMax]}
              color={MATH_COLORS.function}
              strokeWidth={2.5}
            />
            {points.map((pt) => {
              if (!Number.isFinite(pt.my) || pt.mx > scale.xMax) return null;
              const p0 = mathToDesign(pt.mx, 0, scale);
              const p1 = mathToDesign(pt.mx, pt.my, scale);
              const py = mathToDesign(0, pt.my, scale);
              return (
                <g key={pt.key}>
                  <line
                    x1={p0.x}
                    y1={p0.y}
                    x2={p1.x}
                    y2={p1.y}
                    stroke={pt.color}
                    strokeWidth={1.3}
                    strokeDasharray="4 3"
                  />
                  <line
                    x1={py.x}
                    y1={py.y}
                    x2={p1.x}
                    y2={p1.y}
                    stroke={pt.color}
                    strokeWidth={1.3}
                    strokeDasharray="4 3"
                  />
                  <MathPoint
                    cx={pt.mx}
                    cy={pt.my}
                    scale={scale}
                    color={pt.color}
                    r={5.5}
                  />
                </g>
              );
            })}
            <SceneLabelGroup items={labelItems} fontScale={fontScale} />
          </>
        )}
      </g>
    );
  }

  // medianBridge 或 monotoneCompare
  const tripletKey =
    mode === "monotoneCompare"
      ? activeScenario === "monotoneCross"
        ? "monotoneCross"
        : "free"
      : activeScenario === "bridge01" || activeScenario === "bridgeHalf"
        ? activeScenario
        : "free";
  const res = calcCompareTriplet(tripletKey, a, xSample);

  const labelItems: LabelItem[] = res.items.map((item) => {
    const d = mathToDesign(item.xCoord, item.value, scale);
    return {
      key: item.symbol,
      text: `${item.symbol} ≈ ${formatMathNumber(item.value, 3)}`,
      x: d.x,
      y: d.y,
      color:
        item.symbol === "A"
          ? MATH_COLORS.paramPrimary
          : item.symbol === "B"
            ? MATH_COLORS.paramSecondary
            : MATH_COLORS.paramTertiary,
    };
  });

  const expBase = res.items.find((i) => i.curveType === "exp")?.base ?? a;
  const logBase = res.items.find((i) => i.curveType === "log")?.base ?? a;
  const showLogCurve = res.items.some((i) => i.curveType === "log");

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={true} />

      {/* 中间值搭桥水平线 */}
      {res.bridgeLines.map((yVal) => {
        const left = mathToDesign(scale.xMin, yVal, scale);
        const right = mathToDesign(scale.xMax, yVal, scale);
        return (
          <g key={`bridge-${yVal}`}>
            <line
              x1={left.x}
              y1={left.y}
              x2={right.x}
              y2={right.y}
              stroke={CANVAS_COLORS.labelTextLight}
              strokeWidth={1.4}
              strokeDasharray="5 4"
            />
            <text
              x={right.x - 10}
              y={left.y - 6}
              textAnchor="end"
              fontSize={fontScale(11.5)}
              fontWeight="700"
              fill={CANVAS_COLORS.labelTextLight}
            >
              桥梁线 y = {formatMathNumber(yVal, 1)}
            </text>
          </g>
        );
      })}

      {res.validity === "ok" && (
        <>
          <FunctionGraph
            fn={(x) => Math.pow(expBase, x)}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.2}
          />
          {showLogCurve && (
            <FunctionGraph
              fn={(x) => safeLogBase(logBase, x)}
              scale={scale}
              domain={[0.04, scale.xMax]}
              color={MATH_COLORS.paramSecondary}
              strokeWidth={2.2}
            />
          )}
          <FunctionGraph
            fn={(x) =>
              x > 0
                ? Math.pow(x, tripletKey === "monotoneCross" ? 0.4 : 0.5)
                : NaN
            }
            scale={scale}
            domain={[0.01, scale.xMax]}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={2}
            strokeDasharray="6 3"
          />

          {res.items.map((item) => {
            const c =
              item.symbol === "A"
                ? MATH_COLORS.paramPrimary
                : item.symbol === "B"
                  ? MATH_COLORS.paramSecondary
                  : MATH_COLORS.paramTertiary;
            return (
              <MathPoint
                key={item.symbol}
                cx={item.xCoord}
                cy={item.value}
                scale={scale}
                color={c}
                r={5.5}
              />
            );
          })}

          <SceneLabelGroup items={labelItems} fontScale={fontScale} />
        </>
      )}
    </g>
  );
};
