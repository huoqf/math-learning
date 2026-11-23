import React from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  MathPoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { SceneScale } from "@/hooks";
import { MATH_COLORS } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import { formatMathNumber } from "@/utils/mathFormat";
import type { LabelItem } from "@/utils/labelOverlap";
import {
  calcElimMethod,
  calcHomogMethod,
  calcOneSubstitution,
  calcSumProdMethod,
  type MultivarIneqMode,
} from "@/math/ineqMultivarExtrema";

interface IneqMultivarExtremaSceneProps {
  mode: MultivarIneqMode;
  params: Record<string, number>;
  scale: SceneScale;
  fontScale: (base: number) => number;
}

export const IneqMultivarExtremaScene: React.FC<
  IneqMultivarExtremaSceneProps
> = ({ mode, params, scale, fontScale }) => {
  let labelItems: LabelItem[] = [];
  let content: React.ReactNode = null;

  if (mode === "oneSub") {
    const res = calcOneSubstitution(
      params.coefP ?? 1,
      params.coefQ ?? 1,
      params.numM ?? 1,
      params.numN ?? 4,
      params.constC ?? 4,
      params.probeX ?? 1.2,
    );
    const lineFn = (x: number) => (res.c - res.p * x) / res.q;
    // 最优等高线 m/x + n/y = T_min => y = n / (T_min - m/x)
    const minLevelFn = (x: number) => {
      const denom = res.minVal - res.m / x;
      return denom > 0.04 ? res.n / denom : NaN;
    };

    const optD = mathToDesign(res.optX, res.optY, scale);
    const probeD = mathToDesign(res.probeX, res.probeY, scale);
    labelItems = [
      {
        key: "opt",
        text: `取等(${formatMathNumber(res.optX, 2)}, ${formatMathNumber(res.optY, 2)})`,
        x: optD.x,
        y: optD.y,
        color: MATH_COLORS.inequality,
      },
      {
        key: "probe",
        text: `试探(${formatMathNumber(res.probeX, 2)}, ${formatMathNumber(res.probeY, 2)})`,
        x: probeD.x,
        y: probeD.y,
        color: MATH_COLORS.paramSecondary,
      },
    ];

    content = (
      <>
        <FunctionGraph
          fn={lineFn}
          scale={scale}
          domain={[0.02, res.c / res.p]}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
        <FunctionGraph
          fn={minLevelFn}
          scale={scale}
          domain={[res.m / res.minVal + 0.05, scale.xMax]}
          color={MATH_COLORS.paramPrimary}
          strokeWidth={2.2}
          strokeDasharray="6 3"
        />
        <MathPoint
          cx={res.optX}
          cy={res.optY}
          scale={scale}
          color={MATH_COLORS.inequality}
          r={6}
        />
        <MathPoint
          cx={res.probeX}
          cy={res.probeY}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          r={5}
        />
      </>
    );
  } else if (mode === "elim") {
    const res = calcElimMethod(
      params.elimA ?? 1,
      params.elimB ?? 1,
      params.constC ?? 4,
      params.probeX ?? 1.2,
    );
    const hyperFn = (x: number) =>
      x > 0 ? res.kVal / (x + res.b) - res.a : NaN;
    const sumLineFn = (x: number) => res.minSum - x;

    const optD = mathToDesign(res.optX, res.optY, scale);
    labelItems = [
      {
        key: "opt",
        text: `最小和点(${formatMathNumber(res.optX, 2)}, ${formatMathNumber(res.optY, 2)})`,
        x: optD.x,
        y: optD.y,
        color: MATH_COLORS.inequality,
      },
    ];

    content = (
      <>
        <FunctionGraph
          fn={hyperFn}
          scale={scale}
          domain={[0.05, scale.xMax]}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
        <FunctionGraph
          fn={sumLineFn}
          scale={scale}
          domain={[0, scale.xMax]}
          color={MATH_COLORS.paramPrimary}
          strokeWidth={2}
          strokeDasharray="6 3"
        />
        {res.optX > 0 && res.optY > 0 && (
          <MathPoint
            cx={res.optX}
            cy={res.optY}
            scale={scale}
            color={MATH_COLORS.inequality}
            r={6}
          />
        )}
        <MathPoint
          cx={res.probeX}
          cy={res.probeY}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          r={5}
        />
      </>
    );
  } else if (mode === "homog") {
    const res = calcHomogMethod(params.homogK ?? 4, params.ratioT ?? 1.5);
    const nikeFn = (t: number) => (t > 0.05 ? t + res.k / t : NaN);
    const optD = mathToDesign(res.optT, res.minVal, scale);
    const curD = mathToDesign(res.ratioT, res.currentVal, scale);

    labelItems = [
      {
        key: "opt",
        text: `最低点(${formatMathNumber(res.optT, 2)}, ${formatMathNumber(res.minVal, 2)})`,
        x: optD.x,
        y: optD.y,
        color: MATH_COLORS.inequality,
      },
      {
        key: "cur",
        text: `当前(${formatMathNumber(res.ratioT, 2)}, ${formatMathNumber(res.currentVal, 2)})`,
        x: curD.x,
        y: curD.y,
        color: MATH_COLORS.paramSecondary,
      },
    ];

    content = (
      <>
        <FunctionGraph
          fn={nikeFn}
          scale={scale}
          domain={[0.15, scale.xMax]}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
        <MathPoint
          cx={res.optT}
          cy={res.minVal}
          scale={scale}
          color={MATH_COLORS.inequality}
          r={6}
        />
        <MathPoint
          cx={res.ratioT}
          cy={res.currentVal}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          r={5.5}
        />
      </>
    );
  } else {
    const res = calcSumProdMethod(params.constC ?? 4, params.probeX ?? 1.2);
    const constraintFn = (x: number) =>
      x > 0 && x < res.c ? (res.c - x) / (1 + x) : NaN;
    const minSumLine = (x: number) => res.minSum - x;
    const optD = mathToDesign(res.optXForSum, res.optXForSum, scale);

    labelItems = [
      {
        key: "opt",
        text: `对称取等(${formatMathNumber(res.optXForSum, 2)}, ${formatMathNumber(res.optXForSum, 2)})`,
        x: optD.x,
        y: optD.y,
        color: MATH_COLORS.inequality,
      },
    ];

    content = (
      <>
        <FunctionGraph
          fn={constraintFn}
          scale={scale}
          domain={[0.02, res.c - 0.02]}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
        <FunctionGraph
          fn={minSumLine}
          scale={scale}
          domain={[0, scale.xMax]}
          color={MATH_COLORS.paramPrimary}
          strokeWidth={2}
          strokeDasharray="6 3"
        />
        <MathPoint
          cx={res.optXForSum}
          cy={res.optXForSum}
          scale={scale}
          color={MATH_COLORS.inequality}
          r={6}
        />
        <MathPoint
          cx={res.probeX}
          cy={res.probeY}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          r={5}
        />
      </>
    );
  }

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={true} />
      {content}
      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
};
