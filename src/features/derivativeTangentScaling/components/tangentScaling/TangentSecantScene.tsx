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
  clampSecantEndpoint,
  SECANT_CURVE_MODELS,
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
  activeStep = 0,
  onParamChange,
}: TangentSecantSceneProps) {
  const regionOpacity = (r: number) =>
    !activeStep ? 1 : activeStep === r ? 1 : 0.3;
  const secantData = useMemo(() => {
    const model = SECANT_CURVE_MODELS[secantSubModel];
    if (model.tangentFuncType === null) {
      // 二阶多项式卡位：无中点切线，上下界解析式直接取自模型表
      return {
        isTaylor: true as const,
        isLog: false as const,
        mainFn: model.mainFn,
        upperFn: model.upperFn!,
        lowerFn: model.lowerFn!,
        mainXRange: model.mainXRange,
        lineXRange: model.lineXRange,
        lowerXRange: model.lowerXRange!,
      };
    }

    const isLog = model.isLog;
    const fn = model.mainFn;
    const a = params.intervalA;
    const b = params.intervalB;
    const midX = (a + b) / 2;
    const secant = calculateSecantLine(fn, a, b);
    const tangent = calculateTangentLine(model.tangentFuncType, midX);

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
      mainXRange: model.mainXRange,
      lineXRange: model.lineXRange,
    };
  }, [secantSubModel, params.intervalA, params.intervalB]);

  // 智能避让点标收集
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];
    if (secantData.isTaylor) {
      /* 展开原点 (0,0) 不再自绘 O 点标：CoordinateGrid 已在原点给出标准原点标识，
         再标一个 O 会让画布上出现两个 O。原点位置由网格的 O 承担，
         该点本身仍由下方 MathPoint(cx=0, cy=0) 打出。 */
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

  const clampFrame = (x: number, y: number, w: number, h: number) => {
    const pad = 10;
    const minX = vp.designLeft + pad;
    const maxX = vp.designLeft + vp.designVisibleW - w - pad;
    const minY = vp.designTop + pad;
    const maxY = vp.designTop + vp.designVisibleH - h - pad;
    const cx = Math.max(minX, Math.min(x, Math.max(minX, maxX)));
    const cy = Math.max(minY, Math.min(y, Math.max(minY, maxY)));
    return { x: cx, y: cy, width: w, height: h };
  };

  const stepFrame = (() => {
    if (!activeStep) return null;
    if (secantData.isTaylor) {
      if (activeStep === 1) {
        return clampFrame(
          vp.designLeft + 30,
          vp.designTop + 24,
          vp.designVisibleW - 60,
          vp.designVisibleH - 48,
        );
      }
      if (activeStep === 2) {
        const originPt = mathToDesign(0, 0, scale);
        return clampFrame(originPt.x - 130, originPt.y - 95, 260, 190);
      }
      const pEval = mathToDesign(
        params.evalX,
        secantData.mainFn(params.evalX),
        scale,
      );
      return clampFrame(pEval.x - 110, pEval.y - 100, 220, 200);
    }
    const pA = mathToDesign(
      secantData.a,
      secantData.mainFn(secantData.a),
      scale,
    );
    const pB = mathToDesign(
      secantData.b,
      secantData.mainFn(secantData.b),
      scale,
    );
    const pM = mathToDesign(secantData.midX, secantData.midY, scale);
    if (activeStep === 1) {
      return clampFrame(
        Math.min(pA.x, pB.x) - 35,
        Math.min(pA.y, pB.y) - 35,
        Math.max(180, Math.abs(pB.x - pA.x) + 70),
        Math.max(150, Math.abs(pB.y - pA.y) + 70),
      );
    }
    if (activeStep === 2) {
      return clampFrame(
        Math.min(pA.x, pB.x) - 35,
        Math.min(pA.y, pB.y, pM.y) - 45,
        Math.max(190, Math.abs(pB.x - pA.x) + 70),
        Math.max(160, Math.abs(pB.y - pA.y) + 90),
      );
    }
    return clampFrame(pM.x - 135, pM.y - 95, 270, 190);
  })();

  return (
    <>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {secantData.isTaylor ? (
        <>
          {/* 第 1 步：主曲线与下界抛物线差函数轮廓 */}
          <g data-step-region={1} opacity={regionOpacity(1)}>
            <FunctionGraph
              fn={clipFn(secantData.mainFn, secantData.mainXRange)}
              scale={scale}
              color={MATH_COLORS.primary}
              strokeWidth={2.5}
            />
            <FunctionGraph
              fn={clipFn(secantData.lowerFn, secantData.lowerXRange)}
              scale={scale}
              color={MATH_COLORS.accent}
              strokeWidth={2}
            />
          </g>

          {/* 第 2 步：切线上界与单调展开点 */}
          <g data-step-region={2} opacity={regionOpacity(2)}>
            <FunctionGraph
              fn={clipFn(secantData.upperFn, secantData.lineXRange)}
              scale={scale}
              color={MATH_COLORS.paramTertiary}
              strokeWidth={1.8}
              strokeDasharray="4 3"
            />
            <MathPoint
              cx={0}
              cy={0}
              scale={scale}
              color={MATH_COLORS.paramTertiary}
              fontScale={fontScale}
            />
          </g>

          {/* 第 3 步：观察点处上下夹逼大小序 */}
          <g data-step-region={3} opacity={regionOpacity(3)}>
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
          </g>
        </>
      ) : (
        <>
          {/* 第 1 步：主曲线、端点割线弦 AB */}
          <g data-step-region={1} opacity={regionOpacity(1)}>
            <FunctionGraph
              fn={clipFn(secantData.mainFn, secantData.mainXRange)}
              scale={scale}
              color={
                secantData.isLog ? MATH_COLORS.secondary : MATH_COLORS.primary
              }
              strokeWidth={2.5}
            />
            <FunctionGraph
              fn={clipFn(secantData.secantFn, secantData.lineXRange)}
              scale={scale}
              color={MATH_COLORS.accent}
              strokeWidth={2}
            />
          </g>

          {/* 第 2 步：端点拖动检验弓形差函数 */}
          <g data-step-region={2} opacity={regionOpacity(2)}>
            {(() => {
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
                        clampSecantEndpoint(secantSubModel, "a", x, {
                          a: aVal,
                          b: bVal,
                        }),
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
                        clampSecantEndpoint(secantSubModel, "b", x, {
                          a: aVal,
                          b: bVal,
                        }),
                      );
                    }}
                  />
                </>
              );
            })()}
          </g>

          {/* 第 3 步：中点切线双向锁定 */}
          <g data-step-region={3} opacity={regionOpacity(3)}>
            <FunctionGraph
              fn={clipFn(secantData.tangentFn, secantData.lineXRange)}
              scale={scale}
              color={MATH_COLORS.paramPrimary}
              strokeWidth={1.8}
              strokeDasharray="4 3"
            />
            <MathPoint
              cx={secantData.midX}
              cy={secantData.midY}
              scale={scale}
              color={MATH_COLORS.paramPrimary}
              fontScale={fontScale}
            />
          </g>
        </>
      )}

      {stepFrame && (
        <rect
          x={stepFrame.x}
          y={stepFrame.y}
          width={stepFrame.width}
          height={stepFrame.height}
          rx={8}
          fill="none"
          stroke={MATH_COLORS.answerStepFrame}
          strokeWidth={2}
          strokeDasharray="7 4"
          className="pointer-events-none"
        />
      )}

      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </>
  );
}
