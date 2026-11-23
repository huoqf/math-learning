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
  calcGrowthRace,
  calcPiecewiseBilling,
  calcScatterFitting,
  type FuncGrowthMode,
} from "@/math/funcGrowthModeling";

interface FuncGrowthModelingSceneProps {
  mode: FuncGrowthMode;
  fitModel: "linear" | "quadratic" | "exponential";
  params: Record<string, number>;
  scale: SceneScale;
  fontScale: (base: number) => number;
}

export const FuncGrowthModelingScene: React.FC<
  FuncGrowthModelingSceneProps
> = ({ mode, fitModel, params, scale, fontScale }) => {
  const a = params.baseA ?? 1.8;
  const powerN = params.powerN ?? 2;
  const linearK = params.linearK ?? 3.0;
  const xProbe = params.xProbe ?? 4.5;
  const usage = params.usage ?? 6.5;
  const rate1 = params.rate1 ?? 2.0;
  const rate2 = params.rate2 ?? 3.5;
  const rate3 = params.rate3 ?? 5.0;
  const gainScale = params.gainScale ?? 1.0;

  // 预先计算所有可能用到的 labelItems，严禁在条件分支内调用任何 Hook
  let labelItems: LabelItem[] = [];
  let content: React.ReactNode = null;

  if (mode === "growthRace") {
    const res = calcGrowthRace(a, powerN, linearK, xProbe);
    const probeLeft = mathToDesign(res.xProbe, 0, scale);
    const probeTop = mathToDesign(res.xProbe, scale.yMax, scale);

    const racePoints = [
      {
        key: "exp",
        text: `指数=${formatMathNumber(res.yExp, 1)}`,
        y: res.yExp,
        color: MATH_COLORS.paramPrimary,
      },
      {
        key: "pow",
        text: `幂=${formatMathNumber(res.yPower, 1)}`,
        y: res.yPower,
        color: MATH_COLORS.paramSecondary,
      },
      {
        key: "lin",
        text: `一次=${formatMathNumber(res.yLinear, 1)}`,
        y: res.yLinear,
        color: MATH_COLORS.paramTertiary,
      },
      {
        key: "log",
        text: `对数=${formatMathNumber(res.yLog, 1)}`,
        y: res.yLog,
        color: MATH_COLORS.function,
      },
    ];

    labelItems = racePoints
      .filter((pt) => pt.y <= scale.yMax && pt.y >= scale.yMin)
      .map((pt) => {
        const d = mathToDesign(res.xProbe, pt.y, scale);
        return { key: pt.key, text: pt.text, x: d.x, y: d.y, color: pt.color };
      });

    content = (
      <>
        <FunctionGraph
          fn={(x) => Math.pow(res.a, x)}
          scale={scale}
          domain={[0, scale.xMax]}
          color={MATH_COLORS.paramPrimary}
          strokeWidth={2.5}
        />
        <FunctionGraph
          fn={(x) => Math.pow(x, res.powerN)}
          scale={scale}
          domain={[0, scale.xMax]}
          color={MATH_COLORS.paramSecondary}
          strokeWidth={2.3}
        />
        <FunctionGraph
          fn={(x) => res.linearK * x}
          scale={scale}
          domain={[0, scale.xMax]}
          color={MATH_COLORS.paramTertiary}
          strokeWidth={2.2}
        />
        <FunctionGraph
          fn={(x) => (x > 0.05 ? Math.log(x) / Math.log(res.a) : NaN)}
          scale={scale}
          domain={[0.05, scale.xMax]}
          color={MATH_COLORS.function}
          strokeWidth={2.2}
          strokeDasharray="6 3"
        />

        <line
          x1={probeLeft.x}
          y1={probeLeft.y}
          x2={probeTop.x}
          y2={probeTop.y}
          stroke={CANVAS_COLORS.labelTextLight}
          strokeWidth={1.4}
          strokeDasharray="5 4"
        />

        {racePoints.map((pt) =>
          pt.y <= scale.yMax && pt.y >= scale.yMin ? (
            <MathPoint
              key={pt.key}
              cx={res.xProbe}
              cy={pt.y}
              scale={scale}
              color={pt.color}
              r={5.5}
            />
          ) : null,
        )}
      </>
    );
  } else if (mode === "piecewiseBilling") {
    const res = calcPiecewiseBilling(usage, rate1, rate2, rate3);
    const billingFn = (x: number) =>
      x < 0 ? NaN : calcPiecewiseBilling(x, rate1, rate2, rate3).totalCost;
    const costAt4 = calcPiecewiseBilling(4, rate1, rate2, rate3).totalCost;
    const costAt8 = calcPiecewiseBilling(8, rate1, rate2, rate3).totalCost;

    const pCur = mathToDesign(res.usage, res.totalCost, scale);
    const p4 = mathToDesign(4, costAt4, scale);
    const p8 = mathToDesign(8, costAt8, scale);
    const pCurX = mathToDesign(res.usage, 0, scale);
    const pCurY = mathToDesign(0, res.totalCost, scale);

    labelItems = [
      {
        key: "t1",
        text: `(4, ${formatMathNumber(costAt4, 1)})`,
        x: p4.x,
        y: p4.y,
        color: MATH_COLORS.paramSecondary,
      },
      {
        key: "t2",
        text: `(8, ${formatMathNumber(costAt8, 1)})`,
        x: p8.x,
        y: p8.y,
        color: MATH_COLORS.paramTertiary,
      },
      {
        key: "cur",
        text: `P(${formatMathNumber(res.usage, 1)}, ${formatMathNumber(res.totalCost, 1)})`,
        x: pCur.x,
        y: pCur.y,
        color: MATH_COLORS.paramPrimary,
      },
    ];

    content = (
      <>
        <FunctionGraph
          fn={billingFn}
          scale={scale}
          domain={[0, scale.xMax]}
          color={MATH_COLORS.function}
          strokeWidth={2.6}
        />
        <line
          x1={pCurX.x}
          y1={pCurX.y}
          x2={pCur.x}
          y2={pCur.y}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={1.3}
          strokeDasharray="4 3"
        />
        <line
          x1={pCurY.x}
          y1={pCurY.y}
          x2={pCur.x}
          y2={pCur.y}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={1.3}
          strokeDasharray="4 3"
        />
        <MathPoint
          cx={4}
          cy={costAt4}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          r={4.5}
        />
        <MathPoint
          cx={8}
          cy={costAt8}
          scale={scale}
          color={MATH_COLORS.paramTertiary}
          r={4.5}
        />
        <MathPoint
          cx={res.usage}
          cy={res.totalCost}
          scale={scale}
          color={MATH_COLORS.paramPrimary}
          r={6}
        />
      </>
    );
  } else {
    const res = calcScatterFitting(fitModel, gainScale);
    const predPt = mathToDesign(res.nextX, res.nextPred, scale);
    labelItems = [
      {
        key: "pred",
        text: `预测(${res.nextX}, ${formatMathNumber(res.nextPred, 1)})`,
        x: predPt.x,
        y: predPt.y,
        color: MATH_COLORS.inequality,
      },
    ];

    content = (
      <>
        <FunctionGraph
          fn={res.predict}
          scale={scale}
          domain={[0, scale.xMax]}
          color={MATH_COLORS.paramPrimary}
          strokeWidth={2.5}
        />

        {/* 残差垂线与散点 */}
        {res.points.map((pt, idx) => {
          const dObs = mathToDesign(pt.x, pt.y, scale);
          const dPred = mathToDesign(pt.x, res.predict(pt.x), scale);
          return (
            <g key={`sc-${idx}`}>
              <line
                x1={dObs.x}
                y1={dObs.y}
                x2={dPred.x}
                y2={dPred.y}
                stroke={MATH_COLORS.residualLine}
                strokeWidth={1.6}
                strokeDasharray="3 2"
              />
              <MathPoint
                cx={pt.x}
                cy={pt.y}
                scale={scale}
                color={MATH_COLORS.statScatter}
                r={5.5}
              />
            </g>
          );
        })}

        <MathPoint
          cx={res.nextX}
          cy={res.nextPred}
          scale={scale}
          color={MATH_COLORS.inequality}
          r={6}
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
