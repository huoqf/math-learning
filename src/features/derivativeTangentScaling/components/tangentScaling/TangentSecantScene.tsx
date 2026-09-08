import { useMemo } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  MathPoint,
  InteractivePoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS } from "@/theme";
import {
  calculateSecantLine,
  calculateTangentLine,
} from "@/math/tangentScaling";
import type { SecantSubModel } from "@/data/registries/tangentScaling";
import { clipFn } from "./clipFn";
import type { TangentSceneBaseProps } from "./types";

interface TangentSecantSceneProps extends TangentSceneBaseProps {
  secantSubModel: SecantSubModel;
}

/** 模式 4：割切双向夹逼（含数据解算 + 避让点标 + 渲染） */
export function TangentSecantScene({
  params,
  secantSubModel,
  scale,
  vp,
  fontScale,
  onParamChange,
}: TangentSecantSceneProps) {
  const secantData = useMemo(() => {
    const isTaylor = secantSubModel === "taylor_quadratic";
    if (isTaylor) {
      return {
        isTaylor: true as const,
        isLog: false as const,
        mainFn: (x: number) => (x > -0.99 ? Math.log(1 + x) : -10),
        upperFn: (x: number) => x,
        lowerFn: (x: number) => x - 0.5 * x * x,
        mainXRange: [-0.98, 5.0] as [number, number],
        lineXRange: [-2.5, 5.0] as [number, number],
      };
    }

    const isLog = secantSubModel === "log_secant_tangent";
    const fn = isLog
      ? (x: number) => (x > 0.01 ? Math.log(x) : -10)
      : (x: number) => Math.exp(x);
    const a = params.intervalA;
    const b = params.intervalB;
    const midX = (a + b) / 2;
    const secant = calculateSecantLine(fn, a, b);
    const tangent = calculateTangentLine(isLog ? "log" : "exp", midX);

    return {
      isTaylor: false as const,
      isLog,
      mainFn: fn,
      secantFn: (x: number) => secant.slope * x + secant.intercept,
      tangentFn: (x: number) => tangent.slope * x + tangent.intercept,
      a,
      b,
      midX,
      midY: fn(midX),
      mainXRange: (isLog ? [0.02, 5.0] : [-4.0, 3.0]) as [number, number],
      lineXRange: (isLog ? [0.02, 5.0] : [-4.0, 5.0]) as [number, number],
    };
  }, [secantSubModel, params.intervalA, params.intervalB]);

  // 智能避让点标收集
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];
    if (secantData.isTaylor) {
      const pt0 = mathToDesign(0, 0, scale);
      items.push({
        key: "pt-taylor-0",
        x: pt0.x,
        y: pt0.y,
        text: "O",
        color: MATH_COLORS.paramTertiary,
        preferredPlacement: "bottom-left",
      });
      const ptTaylor = mathToDesign(
        params.evalX,
        secantData.mainFn(params.evalX),
        scale,
      );
      items.push({
        key: "pt-taylor-eval",
        x: ptTaylor.x,
        y: ptTaylor.y,
        text: "P",
        color: MATH_COLORS.primary,
        preferredPlacement: "top",
      });
    } else {
      const aVal = secantData.a;
      const bVal = secantData.b;
      const ya = secantData.mainFn(aVal);
      const yb = secantData.mainFn(bVal);
      const ptA = mathToDesign(aVal, ya, scale);
      const ptB = mathToDesign(bVal, yb, scale);
      const ptM = mathToDesign(secantData.midX, secantData.midY, scale);
      items.push(
        {
          key: "pt-sec-a",
          x: ptA.x,
          y: ptA.y,
          text: "A",
          color: MATH_COLORS.paramPrimary,
          preferredPlacement: "left",
        },
        {
          key: "pt-sec-m",
          x: ptM.x,
          y: ptM.y,
          text: "M",
          color: MATH_COLORS.paramPrimary,
          preferredPlacement: secantData.isLog ? "bottom" : "top",
        },
        {
          key: "pt-sec-b",
          x: ptB.x,
          y: ptB.y,
          text: "B",
          color: MATH_COLORS.paramSecondary,
          preferredPlacement: "top",
        },
      );
    }
    return items;
  }, [secantData, params.evalX, scale]);

  return (
    <>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {secantData.isTaylor ? (
        <>
          {/* ln(1+x) */}
          <FunctionGraph
            fn={clipFn(secantData.mainFn, secantData.mainXRange)}
            scale={scale}
            color={MATH_COLORS.primary}
            strokeWidth={2.5}
          />
          {/* y = x 上界切线 */}
          <FunctionGraph
            fn={clipFn(secantData.upperFn, secantData.lineXRange)}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={1.8}
            strokeDasharray="4 3"
          />
          {/* y = x - 0.5x^2 下界抛物线 */}
          <FunctionGraph
            fn={clipFn(secantData.lowerFn, secantData.lineXRange)}
            scale={scale}
            color={MATH_COLORS.accent}
            strokeWidth={2}
          />
          {/* 展开原点 O(0,0) */}
          <MathPoint
            cx={0}
            cy={0}
            scale={scale}
            color={MATH_COLORS.paramTertiary}
            fontScale={fontScale}
          />
          {/* 观察点垂直连线指示与三层交点 */}
          {(() => {
            const evalX = params.evalX;
            const yUp = secantData.upperFn(evalX);
            const yLow = secantData.lowerFn(evalX);
            const yMid = secantData.mainFn(evalX);
            const pUp = mathToDesign(evalX, yUp, scale);
            const pLow = mathToDesign(evalX, yLow, scale);
            return (
              <g>
                <line
                  x1={pUp.x}
                  y1={pUp.y}
                  x2={pLow.x}
                  y2={pLow.y}
                  stroke={MATH_COLORS.accent}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
                <MathPoint
                  cx={evalX}
                  cy={yUp}
                  scale={scale}
                  color={MATH_COLORS.paramTertiary}
                  fontScale={fontScale}
                />
                <MathPoint
                  cx={evalX}
                  cy={yMid}
                  scale={scale}
                  color={MATH_COLORS.primary}
                  fontScale={fontScale}
                />
                <MathPoint
                  cx={evalX}
                  cy={yLow}
                  scale={scale}
                  color={MATH_COLORS.accent}
                  fontScale={fontScale}
                />
                <InteractivePoint
                  cx={evalX}
                  cy={(yUp + yLow) / 2}
                  scale={scale}
                  vp={vp}
                  color={MATH_COLORS.paramPrimary}
                  fontScale={fontScale}
                  onDrag={({ x }) => {
                    onParamChange("evalX", Math.max(0.0, Math.min(2.5, x)));
                  }}
                />
              </g>
            );
          })()}
        </>
      ) : (
        <>
          {/* 主曲线 (e^x 或 ln x) */}
          <FunctionGraph
            fn={clipFn(secantData.mainFn, secantData.mainXRange)}
            scale={scale}
            color={
              secantData.isLog ? MATH_COLORS.secondary : MATH_COLORS.primary
            }
            strokeWidth={2.5}
          />
          {/* 割线（弦线） */}
          <FunctionGraph
            fn={clipFn(secantData.secantFn, secantData.lineXRange)}
            scale={scale}
            color={MATH_COLORS.accent}
            strokeWidth={2}
          />
          {/* 切线 */}
          <FunctionGraph
            fn={clipFn(secantData.tangentFn, secantData.lineXRange)}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={1.8}
            strokeDasharray="4 3"
          />
          {/* 中点切点 */}
          <MathPoint
            cx={secantData.midX}
            cy={secantData.midY}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            fontScale={fontScale}
          />
          {/* 区间端点 A 与 B 可交互拖拽 */}
          {(() => {
            const isLog = secantData.isLog;
            const minA = isLog ? 0.2 : 0.1;
            const maxB = isLog ? 4.5 : 3.5;
            const aVal = secantData.a;
            const bVal = secantData.b;
            const ya = secantData.mainFn(aVal);
            const yb = secantData.mainFn(bVal);

            return (
              <>
                <InteractivePoint
                  cx={aVal}
                  cy={ya}
                  scale={scale}
                  vp={vp}
                  color={MATH_COLORS.paramPrimary}
                  fontScale={fontScale}
                  onDrag={({ x }) => {
                    onParamChange(
                      "intervalA",
                      Math.max(minA, Math.min(1.5, Math.min(bVal - 0.4, x))),
                    );
                  }}
                />
                <InteractivePoint
                  cx={bVal}
                  cy={yb}
                  scale={scale}
                  vp={vp}
                  color={MATH_COLORS.paramSecondary}
                  fontScale={fontScale}
                  onDrag={({ x }) => {
                    onParamChange(
                      "intervalB",
                      Math.max(1.6, Math.max(aVal + 0.4, Math.min(maxB, x))),
                    );
                  }}
                />
              </>
            );
          })()}
        </>
      )}

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </>
  );
}
