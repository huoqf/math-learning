import React, { useMemo } from "react";
import {
  CoordinateGrid,
  FunctionGraph,
  MathPoint,
  InteractivePoint,
  SceneLabelGroup,
} from "@/components/Math";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  calculateTangentLine,
  checkParamKBounding,
  calculateSecantLine,
} from "@/math/tangentScaling";
import type {
  TangentScalingParams,
  TangentScalingMode,
  BaseSubModel,
  SandwichSubModel,
  ParamKSubModel,
  SecantSubModel,
} from "@/data/registries/tangentScaling";
import type { ViewportInfo } from "@/utils/useViewport";

interface TangentScalingSceneProps {
  params: TangentScalingParams;
  mode: TangentScalingMode;
  baseSubModel: BaseSubModel;
  sandwichSubModel: SandwichSubModel;
  paramKSubModel: ParamKSubModel;
  secantSubModel: SecantSubModel;
  scale: ReturnType<typeof import("@/hooks").useSceneScale>;
  vp: ViewportInfo;
  fontScale: (v: number) => number;
  onParamChange: (key: string, value: number) => void;
}

export const TangentScalingScene: React.FC<TangentScalingSceneProps> = ({
  params,
  mode,
  baseSubModel,
  sandwichSubModel,
  paramKSubModel,
  secantSubModel,
  scale,
  vp,
  fontScale,
  onParamChange,
}) => {
  // 定义域截断辅助包装，避免 FunctionGraph 在定义域外产生飞线
  const clipFn =
    (f: (x: number) => number, range?: [number, number] | number[]) =>
    (x: number) => (!range || (x >= range[0] && x <= range[1]) ? f(x) : NaN);

  // ── 模式 1：基准切线放缩 ──
  const baseData = useMemo(() => {
    if (mode !== "base") return null;
    let funcType: "exp" | "log" | "exp_shift" | "log_shift" = "exp";
    let fn = (x: number) => Math.exp(x);
    let xRange: [number, number] = [-4, 3.5];

    if (baseSubModel === "exp_shift_x") {
      funcType = "exp_shift";
      fn = (x: number) => Math.exp(x - 1);
    } else if (baseSubModel === "exp_ex") {
      funcType = "exp";
      fn = (x: number) => Math.exp(x);
    } else if (
      baseSubModel === "log_x_minus_1" ||
      baseSubModel === "log_x_div_e"
    ) {
      funcType = "log";
      fn = (x: number) => (x > 0.01 ? Math.log(x) : -10);
      xRange = [0.05, 5];
    } else if (baseSubModel === "log_shift_0") {
      funcType = "log_shift";
      fn = (x: number) => (x > -0.99 ? Math.log(x + 1) : -10);
      xRange = [-0.95, 4.5];
    }

    const tangent = calculateTangentLine(funcType, params.x0);
    const tangentFn = (x: number) => tangent.slope * x + tangent.intercept;

    return { fn, tangentFn, tangent, xRange };
  }, [mode, baseSubModel, params.x0]);

  // ── 模式 2：双切线公切与平行卡位 ──
  const sandwichData = useMemo(() => {
    if (mode !== "sandwich") return null;
    if (sandwichSubModel === "parallel_bands") {
      return {
        upperFn: (x: number) => Math.exp(x),
        lowerFn: (x: number) => (x > 0.02 ? Math.log(x) : -10),
        upperLineFn: (x: number) => x + 1,
        lowerLineFn: (x: number) => x - 1,
        xRange: [0.05, 3.2] as [number, number],
      };
    }

    if (sandwichSubModel === "origin_sandwich") {
      return {
        upperFn: (x: number) => Math.exp(x) - 1,
        lowerFn: (x: number) => (x > -0.95 ? Math.log(x + 1) : -10),
        middleLineFn: (x: number) => x,
        xRange: [-0.9, 3.5] as [number, number],
      };
    }

    // 默认 common_tangent: e^(x-1) >= x >= ln x + 1
    return {
      upperFn: (x: number) => Math.exp(x - 1),
      lowerFn: (x: number) => (x > 0.02 ? Math.log(x) + 1 : -10),
      middleLineFn: (x: number) => x,
      xRange: [0.05, 3.5] as [number, number],
    };
  }, [mode, sandwichSubModel]);

  // ── 模式 3：过定点动直线旋转卡位求参 ──
  const paramKData = useMemo(() => {
    if (mode !== "param_k") return null;
    const k = params.k;
    const evalRes = checkParamKBounding(k, params.evalX, paramKSubModel);
    const expFn = (x: number) => Math.exp(x);
    const logFn = (x: number) => (x > 0.02 ? Math.log(x) : -10);
    const lineFn = (x: number) => k * x;

    // 临界切线
    const expCritLineFn = (x: number) => Math.E * x;
    const logCritLineFn = (x: number) => (1 / Math.E) * x;

    const showExp = paramKSubModel !== "log_kx_origin";
    const showLog = paramKSubModel !== "exp_kx_origin";

    return {
      expFn,
      logFn,
      lineFn,
      expCritLineFn,
      logCritLineFn,
      evalRes,
      showExp,
      showLog,
    };
  }, [mode, params.k, params.evalX, paramKSubModel]);

  // ── 模式 4：割切双向夹逼 ──
  const secantData = useMemo(() => {
    if (mode !== "secant") return null;
    const isTaylor = secantSubModel === "taylor_quadratic";
    if (isTaylor) {
      return {
        isTaylor: true as const,
        isLog: false as const,
        mainFn: (x: number) => (x > -0.9 ? Math.log(1 + x) : -10),
        upperFn: (x: number) => x,
        lowerFn: (x: number) => x - 0.5 * x * x,
        xRange: [-0.8, 3.0] as [number, number],
      };
    }

    const isLog = secantSubModel === "log_secant_tangent";
    const fn = isLog
      ? (x: number) => (x > 0.02 ? Math.log(x) : -10)
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
      xRange: (isLog ? [0.05, 5] : [-0.5, 3.5]) as [number, number],
    };
  }, [mode, secantSubModel, params.intervalA, params.intervalB]);

  // ── 智能避让点标收集 (遵循高中数学规范：纯学术代号，严禁堆砌浮点坐标) ──
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];

    if (mode === "base" && baseData) {
      const p = mathToDesign(baseData.tangent.x0, baseData.tangent.y0, scale);
      items.push({
        key: "pt-base-tangent",
        x: p.x,
        y: p.y,
        text: "P_0",
        color: MATH_COLORS.paramPrimary,
        preferredPlacement: "top",
      });
    }

    if (mode === "sandwich") {
      if (sandwichSubModel === "parallel_bands") {
        const p1 = mathToDesign(0, 1, scale);
        const p2 = mathToDesign(1, 0, scale);
        items.push(
          {
            key: "pt-band-1",
            x: p1.x,
            y: p1.y,
            text: "T_1",
            color: MATH_COLORS.primary,
            preferredPlacement: "top-left",
          },
          {
            key: "pt-band-2",
            x: p2.x,
            y: p2.y,
            text: "T_2",
            color: MATH_COLORS.secondary,
            preferredPlacement: "bottom-right",
          },
        );
      } else {
        const isOrigin = sandwichSubModel === "origin_sandwich";
        const ptCommon = mathToDesign(
          isOrigin ? 0 : 1,
          isOrigin ? 0 : 1,
          scale,
        );
        items.push({
          key: "pt-common-tangent",
          x: ptCommon.x,
          y: ptCommon.y,
          text: isOrigin ? "O" : "T",
          color: MATH_COLORS.paramTertiary,
          preferredPlacement: "bottom-right",
        });
      }
    }

    if (mode === "param_k" && paramKData) {
      if (paramKData.showExp) {
        const ptA = mathToDesign(1, Math.E, scale);
        items.push({
          key: "pt-crit-exp",
          x: ptA.x,
          y: ptA.y,
          text: "A",
          color: MATH_COLORS.primary,
          preferredPlacement: "left",
        });
      }
      if (paramKData.showLog) {
        const ptB = mathToDesign(Math.E, 1, scale);
        items.push({
          key: "pt-crit-log",
          x: ptB.x,
          y: ptB.y,
          text: "B",
          color: MATH_COLORS.secondary,
          preferredPlacement: "bottom-right",
        });
      }
    }

    if (mode === "secant" && secantData) {
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
      } else {
        const aVal = secantData.a;
        const bVal = secantData.b;
        const ya = secantData.mainFn(aVal);
        const yb = secantData.mainFn(bVal);
        const ptA = mathToDesign(aVal, ya, scale);
        const ptB = mathToDesign(bVal, yb, scale);
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
            key: "pt-sec-b",
            x: ptB.x,
            y: ptB.y,
            text: "B",
            color: MATH_COLORS.paramSecondary,
            preferredPlacement: "top",
          },
        );
      }
    }

    return items;
  }, [mode, baseData, sandwichSubModel, paramKData, secantData, scale]);

  return (
    <>
      {/* 1. 坐标系与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 2. 模式 1：基准切线放缩 */}
      {mode === "base" && baseData && (
        <>
          {/* 原函数曲线 */}
          <FunctionGraph
            fn={clipFn(baseData.fn, baseData.xRange)}
            scale={scale}
            color={MATH_COLORS.primary}
            strokeWidth={2.5}
          />
          {/* 切线 */}
          <FunctionGraph
            fn={clipFn(baseData.tangentFn, [-4, 4.5])}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={1.8}
            strokeDasharray="4 3"
          />
          {/* 可拖拽切点 (自适应安全范围) */}
          {(() => {
            let minX = -2.5;
            let maxX = 2.5;
            if (baseSubModel === "log_x_minus_1") {
              minX = 0.2;
              maxX = 4.0;
            } else if (baseSubModel === "log_x_div_e") {
              minX = 0.5;
              maxX = 4.5;
            } else if (baseSubModel === "log_shift_0") {
              minX = -0.8;
              maxX = 3.5;
            } else if (
              baseSubModel === "exp_shift_x" ||
              baseSubModel === "exp_ex"
            ) {
              minX = -1.5;
              maxX = 2.8;
            }

            return (
              <InteractivePoint
                cx={baseData.tangent.x0}
                cy={baseData.tangent.y0}
                scale={scale}
                vp={vp}
                color={MATH_COLORS.paramPrimary}
                fontScale={fontScale}
                onDrag={({ x }) => {
                  onParamChange("x0", Math.max(minX, Math.min(maxX, x)));
                }}
              />
            );
          })()}
        </>
      )}

      {/* 3. 模式 2：双切线公切与平行卡位 */}
      {mode === "sandwich" && sandwichData && (
        <>
          {/* 上函数曲线 */}
          <FunctionGraph
            fn={clipFn(sandwichData.upperFn, sandwichData.xRange)}
            scale={scale}
            color={MATH_COLORS.primary}
            strokeWidth={2.5}
          />
          {/* 下函数曲线 */}
          <FunctionGraph
            fn={clipFn(sandwichData.lowerFn, sandwichData.xRange)}
            scale={scale}
            color={MATH_COLORS.secondary}
            strokeWidth={2.5}
          />

          {sandwichSubModel === "parallel_bands" ? (
            <>
              {/* 平行切线 y = x + 1 */}
              <FunctionGraph
                fn={clipFn(sandwichData.upperLineFn!, [-3, 4])}
                scale={scale}
                color={MATH_COLORS.primary}
                strokeWidth={1.8}
                strokeDasharray="4 3"
              />
              {/* 平行切线 y = x - 1 */}
              <FunctionGraph
                fn={clipFn(sandwichData.lowerLineFn!, [-2, 5])}
                scale={scale}
                color={MATH_COLORS.secondary}
                strokeWidth={1.8}
                strokeDasharray="4 3"
              />
              {/* 两个特征切点 (0,1) 与 (1,0) */}
              <MathPoint
                cx={0}
                cy={1}
                scale={scale}
                color={MATH_COLORS.primary}
                fontScale={fontScale}
              />
              <MathPoint
                cx={1}
                cy={0}
                scale={scale}
                color={MATH_COLORS.secondary}
                fontScale={fontScale}
              />
            </>
          ) : (
            <>
              {/* 中间公切线 y = x */}
              <FunctionGraph
                fn={clipFn(sandwichData.middleLineFn!, [-2, 4.5])}
                scale={scale}
                color={MATH_COLORS.paramTertiary}
                strokeWidth={2}
              />
              {/* 公切点 */}
              <MathPoint
                cx={sandwichSubModel === "origin_sandwich" ? 0 : 1}
                cy={sandwichSubModel === "origin_sandwich" ? 0 : 1}
                scale={scale}
                color={MATH_COLORS.paramTertiary}
                fontScale={fontScale}
              />
            </>
          )}

          {/* 观察点垂直连线指示 */}
          {(() => {
            const evalX = params.evalX;
            const yUp = sandwichData.upperFn(evalX);
            const yLow = sandwichData.lowerFn(evalX);
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
                <InteractivePoint
                  cx={evalX}
                  cy={(yUp + yLow) / 2}
                  scale={scale}
                  vp={vp}
                  color={MATH_COLORS.paramPrimary}
                  fontScale={fontScale}
                  onDrag={({ x }) => {
                    const minE =
                      sandwichSubModel === "origin_sandwich" ? -0.7 : 0.2;
                    onParamChange("evalX", Math.max(minE, Math.min(3.5, x)));
                  }}
                />
              </g>
            );
          })()}
        </>
      )}

      {/* 4. 模式 3：过定点动直线旋转卡位求参 */}
      {mode === "param_k" && paramKData && (
        <>
          {/* 指数曲线 e^x (单侧/双侧) */}
          {paramKData.showExp && (
            <>
              <FunctionGraph
                fn={clipFn(paramKData.expFn, [-3, 2.5])}
                scale={scale}
                color={MATH_COLORS.primary}
                strokeWidth={2.5}
              />
              {/* 临界上切线 y = ex */}
              <FunctionGraph
                fn={clipFn(paramKData.expCritLineFn, [0, 2.2])}
                scale={scale}
                color={withAlpha(MATH_COLORS.primary, 0.4)}
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
              {/* 临界切点 A(1,e) */}
              <MathPoint
                cx={1}
                cy={Math.E}
                scale={scale}
                color={MATH_COLORS.primary}
                fontScale={fontScale}
              />
            </>
          )}

          {/* 对数曲线 ln x (单侧/双侧) */}
          {paramKData.showLog && (
            <>
              <FunctionGraph
                fn={clipFn(paramKData.logFn, [0.05, 5])}
                scale={scale}
                color={MATH_COLORS.secondary}
                strokeWidth={2.5}
              />
              {/* 临界下切线 y = (1/e)x */}
              <FunctionGraph
                fn={clipFn(paramKData.logCritLineFn, [0, 5])}
                scale={scale}
                color={withAlpha(MATH_COLORS.secondary, 0.4)}
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
              {/* 临界切点 B(e,1) */}
              <MathPoint
                cx={Math.E}
                cy={1}
                scale={scale}
                color={MATH_COLORS.secondary}
                fontScale={fontScale}
              />
            </>
          )}

          {/* 旋转动直线 y = kx */}
          <FunctionGraph
            fn={clipFn(paramKData.lineFn, [0, 4.5])}
            scale={scale}
            color={
              paramKData.evalRes.isSafe
                ? MATH_COLORS.paramTertiary
                : MATH_COLORS.highlight
            }
            strokeWidth={2.2}
          />

          {/* 旋转中心原点 O(0,0) */}
          <MathPoint
            cx={0}
            cy={0}
            scale={scale}
            color={MATH_COLORS.line}
            fontScale={fontScale}
          />
        </>
      )}

      {/* 5. 模式 4：割切双向夹逼 */}
      {mode === "secant" && secantData && (
        <>
          {secantData.isTaylor ? (
            <>
              {/* ln(1+x) */}
              <FunctionGraph
                fn={clipFn(secantData.mainFn, secantData.xRange)}
                scale={scale}
                color={MATH_COLORS.primary}
                strokeWidth={2.5}
              />
              {/* y = x 上界切线 */}
              <FunctionGraph
                fn={clipFn(secantData.upperFn, secantData.xRange)}
                scale={scale}
                color={MATH_COLORS.paramTertiary}
                strokeWidth={1.8}
                strokeDasharray="4 3"
              />
              {/* y = x - 0.5x^2 下界抛物线 */}
              <FunctionGraph
                fn={clipFn(secantData.lowerFn, secantData.xRange)}
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
              {/* 观察点垂直连线指示 */}
              {(() => {
                const evalX = params.evalX;
                const yUp = secantData.upperFn(evalX);
                const yLow = secantData.lowerFn(evalX);
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
                fn={clipFn(secantData.mainFn, secantData.xRange)}
                scale={scale}
                color={
                  secantData.isLog ? MATH_COLORS.secondary : MATH_COLORS.primary
                }
                strokeWidth={2.5}
              />
              {/* 割线（弦线） */}
              <FunctionGraph
                fn={clipFn(secantData.secantFn, secantData.xRange)}
                scale={scale}
                color={MATH_COLORS.accent}
                strokeWidth={2}
              />
              {/* 切线 */}
              <FunctionGraph
                fn={clipFn(secantData.tangentFn, secantData.xRange)}
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
                          Math.max(minA, Math.min(bVal - 0.4, x)),
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
                          Math.max(aVal + 0.4, Math.min(maxB, x)),
                        );
                      }}
                    />
                  </>
                );
              })()}
            </>
          )}
        </>
      )}

      {/* 6. 智能避让点标 */}
      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </>
  );
};
