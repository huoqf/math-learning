import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  Asymptote,
  TangentLine,
  SceneLabelGroup,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS } from "@/theme";
import { calculateExpLog, calculatePowerFunction } from "@/math/function";

interface ExpLogSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  funcType: "exponential" | "logarithmic" | "power";
  showInverse?: boolean;
  showTangent?: boolean;
}

export function ExpLogScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  funcType,
  showInverse = false,
  showTangent = false,
}: ExpLogSceneProps) {
  const x0 = params.x0 ?? 1.5;
  const a = params.baseA ?? 2.0;
  const powerAlpha = params.powerAlpha ?? 2.0;

  const handleDragX0 = (mathPt: { x: number; y: number }) => {
    // 对数模式下动态保护真数 x0 > 0.05
    const clampedX =
      funcType === "logarithmic" ? Math.max(0.1, mathPt.x) : mathPt.x;
    onParamChange("x0", Math.round(clampedX * 10) / 10);
  };

  const powerRes = React.useMemo(
    () => calculatePowerFunction(powerAlpha, x0),
    [powerAlpha, x0],
  );

  const isValidBase = a > 0 && Math.abs(a - 1) > 1e-4;
  const expLogRes = React.useMemo(() => calculateExpLog(a, x0), [a, x0]);

  // 纯代数点标组
  const sceneLabels = React.useMemo(() => {
    const items: Array<{
      key: string;
      x: number;
      y: number;
      text: string;
      color?: string;
      preferredPlacement?:
        | "top"
        | "bottom"
        | "left"
        | "right"
        | "top-right"
        | "top-left"
        | "bottom-right"
        | "bottom-left";
    }> = [];

    if (funcType === "power") {
      const fixedPt = mathToDesign(1, 1, scale);
      items.push({
        key: "fixed-power",
        text: "(1, 1)",
        x: fixedPt.x,
        y: fixedPt.y,
        color: MATH_COLORS.paramPrimary,
        preferredPlacement: "top-right",
      });
      if (powerRes.isValidPoint) {
        const pt = mathToDesign(x0, powerRes.yVal, scale);
        items.push({
          key: "pt-p",
          text: "P",
          x: pt.x,
          y: pt.y,
          color: MATH_COLORS.function,
          preferredPlacement: "top",
        });
      }
    } else if (funcType === "logarithmic" && isValidBase) {
      const fixedLogPt = mathToDesign(1, 0, scale);
      items.push({
        key: "fixed-log",
        text: "(1, 0)",
        x: fixedLogPt.x,
        y: fixedLogPt.y,
        color: MATH_COLORS.function,
        preferredPlacement: "bottom-right",
      });
      if (expLogRes.isLogDefined) {
        const pt = mathToDesign(x0, expLogRes.logVal, scale);
        items.push({
          key: "pt-p",
          text: "P",
          x: pt.x,
          y: pt.y,
          color: MATH_COLORS.function,
          preferredPlacement: "top-left",
        });
        if (showInverse) {
          const fixedExpPt = mathToDesign(0, 1, scale);
          items.push({
            key: "fixed-exp",
            text: "(0, 1)",
            x: fixedExpPt.x,
            y: fixedExpPt.y,
            color: MATH_COLORS.functionTransformed,
            preferredPlacement: "top-left",
          });
          const invPt = mathToDesign(expLogRes.logVal, x0, scale);
          items.push({
            key: "pt-p-inv",
            text: "P'",
            x: invPt.x,
            y: invPt.y,
            color: MATH_COLORS.functionTransformed,
            preferredPlacement: "bottom-right",
          });
        }
      }
    } else if (funcType === "exponential" && isValidBase) {
      const fixedExpPt = mathToDesign(0, 1, scale);
      items.push({
        key: "fixed-exp",
        text: "(0, 1)",
        x: fixedExpPt.x,
        y: fixedExpPt.y,
        color: MATH_COLORS.function,
        preferredPlacement: "top-left",
      });
      if (Number.isFinite(expLogRes.expVal)) {
        const pt = mathToDesign(x0, expLogRes.expVal, scale);
        items.push({
          key: "pt-p",
          text: "P",
          x: pt.x,
          y: pt.y,
          color: MATH_COLORS.function,
          preferredPlacement: "top",
        });
        if (showInverse) {
          const fixedLogPt = mathToDesign(1, 0, scale);
          items.push({
            key: "fixed-log",
            text: "(1, 0)",
            x: fixedLogPt.x,
            y: fixedLogPt.y,
            color: MATH_COLORS.functionTransformed,
            preferredPlacement: "bottom-right",
          });
          const invPt = mathToDesign(expLogRes.expVal, x0, scale);
          items.push({
            key: "pt-p-inv",
            text: "P'",
            x: invPt.x,
            y: invPt.y,
            color: MATH_COLORS.functionTransformed,
            preferredPlacement: "bottom-right",
          });
        }
      }
    }

    return items;
  }, [funcType, isValidBase, expLogRes, powerRes, x0, showInverse, scale]);

  // 1. 幂函数模式 y = x^α
  if (funcType === "power") {
    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 渐近线 */}
        {powerAlpha < 0 && (
          <>
            <Asymptote
              type="vertical"
              value={0}
              scale={scale}
              label="x = 0"
              fontScale={fontScale}
            />
            <Asymptote
              type="horizontal"
              value={0}
              scale={scale}
              label="y = 0"
              fontScale={fontScale}
            />
          </>
        )}

        {/* 幂函数曲线 */}
        <FunctionGraph
          fn={(x) => {
            if (powerAlpha === 0) return Math.abs(x) < 1e-4 ? NaN : 1;
            if (powerAlpha < 0) {
              if (Math.abs(x) < 1e-3) return NaN;
              if (x < 0 && !Number.isInteger(powerAlpha)) return NaN;
              return Math.pow(x, powerAlpha);
            }
            if (x < 0 && !Number.isInteger(powerAlpha)) return NaN;
            return Math.pow(x, powerAlpha);
          }}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />

        {/* 公共定点 (1, 1) */}
        <MathPoint
          cx={1}
          cy={1}
          scale={scale}
          variant="solid"
          color={MATH_COLORS.paramPrimary}
        />

        {/* α > 0 时的原点 (0,0) */}
        {powerAlpha > 0 && (
          <MathPoint
            cx={0}
            cy={0}
            scale={scale}
            variant="solid"
            color={MATH_COLORS.function}
          />
        )}

        {/* 交互动点 P */}
        {powerRes.isValidPoint && (
          <InteractivePoint
            cx={x0}
            cy={powerRes.yVal}
            scale={scale}
            vp={vp}
            onDrag={handleDragX0}
            color={MATH_COLORS.function}
            fontScale={fontScale}
          />
        )}

        {/* 规范点标 */}
        <SceneLabelGroup items={sceneLabels} fontScale={fontScale} />
      </g>
    );
  }

  // 2. 指数与对数模式
  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 渐近线 */}
      {funcType === "exponential" && isValidBase && (
        <Asymptote
          type="horizontal"
          value={0}
          scale={scale}
          label="y = 0 (x 轴渐近线)"
          fontScale={fontScale}
        />
      )}
      {funcType === "logarithmic" && isValidBase && (
        <Asymptote
          type="vertical"
          value={0}
          scale={scale}
          label="x = 0 (y 轴渐近线)"
          fontScale={fontScale}
        />
      )}

      {/* 反函数对称轴 y = x */}
      {showInverse && (
        <FunctionGraph
          fn={(x) => x}
          scale={scale}
          color={MATH_COLORS.labelText}
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />
      )}

      {/* 指数函数 y = a^x */}
      {funcType === "exponential" && isValidBase && (
        <FunctionGraph
          fn={(x) => Math.pow(a, x)}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
      )}

      {/* 对数函数 y = log_a(x) */}
      {funcType === "logarithmic" && isValidBase && (
        <FunctionGraph
          fn={(x) => (x > 0 ? Math.log(x) / Math.log(a) : NaN)}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.5}
        />
      )}

      {/* 反函数对称辅助曲线 */}
      {showInverse && isValidBase && funcType === "exponential" && (
        <FunctionGraph
          fn={(x) => (x > 0 ? Math.log(x) / Math.log(a) : NaN)}
          scale={scale}
          color={MATH_COLORS.functionTransformed}
          strokeWidth={2}
          strokeDasharray="5 4"
        />
      )}
      {showInverse && isValidBase && funcType === "logarithmic" && (
        <FunctionGraph
          fn={(x) => Math.pow(a, x)}
          scale={scale}
          color={MATH_COLORS.functionTransformed}
          strokeWidth={2}
          strokeDasharray="5 4"
        />
      )}

      {/* 指数特征定点 (0, 1) */}
      {isValidBase && (
        <MathPoint
          cx={0}
          cy={1}
          scale={scale}
          variant="solid"
          color={
            funcType === "exponential"
              ? MATH_COLORS.function
              : showInverse
                ? MATH_COLORS.functionTransformed
                : undefined
          }
        />
      )}

      {/* 对数特征定点 (1, 0) */}
      {isValidBase && (
        <MathPoint
          cx={1}
          cy={0}
          scale={scale}
          variant="solid"
          color={
            funcType === "logarithmic"
              ? MATH_COLORS.function
              : showInverse
                ? MATH_COLORS.functionTransformed
                : undefined
          }
        />
      )}

      {/* 切线可视化 */}
      {showTangent &&
        isValidBase &&
        funcType === "logarithmic" &&
        expLogRes.isLogDefined && (
          <>
            {/* 动点切线 */}
            <TangentLine
              fn={(x) => (x > 0 ? Math.log(x) / Math.log(a) : NaN)}
              x0={x0}
              scale={scale}
              strokeWidth={1.8}
            />
            {/* 定点 (1, 0) 切线 */}
            <TangentLine
              fn={(x) => (x > 0 ? Math.log(x) / Math.log(a) : NaN)}
              x0={1}
              scale={scale}
              color={MATH_COLORS.axis}
              strokeWidth={1.2}
            />
          </>
        )}
      {showTangent &&
        isValidBase &&
        funcType === "exponential" &&
        Number.isFinite(expLogRes.expVal) && (
          <>
            {/* 动点切线 */}
            <TangentLine
              fn={(x) => Math.pow(a, x)}
              x0={x0}
              scale={scale}
              strokeWidth={1.8}
            />
            {/* 定点 (0, 1) 切线 */}
            <TangentLine
              fn={(x) => Math.pow(a, x)}
              x0={0}
              scale={scale}
              color={MATH_COLORS.axis}
              strokeWidth={1.2}
            />
          </>
        )}

      {/* 指数模式下的动点与对称点 */}
      {isValidBase &&
        funcType === "exponential" &&
        Number.isFinite(expLogRes.expVal) &&
        (() => {
          const invPt = mathToDesign(expLogRes.expVal, x0, scale);
          const pPt = mathToDesign(x0, expLogRes.expVal, scale);

          return (
            <g>
              <InteractivePoint
                cx={x0}
                cy={expLogRes.expVal}
                scale={scale}
                vp={vp}
                onDrag={handleDragX0}
                color={MATH_COLORS.function}
                fontScale={fontScale}
              />
              {showInverse && (
                <>
                  <MathPoint
                    cx={expLogRes.expVal}
                    cy={x0}
                    scale={scale}
                    variant="solid"
                    color={MATH_COLORS.functionTransformed}
                  />
                  {/* 对称垂直平分连线 */}
                  <line
                    x1={pPt.x}
                    y1={pPt.y}
                    x2={invPt.x}
                    y2={invPt.y}
                    stroke={MATH_COLORS.labelText}
                    strokeDasharray="3 3"
                    strokeWidth={1.2}
                    opacity={0.65}
                  />
                </>
              )}
            </g>
          );
        })()}

      {/* 对数模式下的动点与对称点 */}
      {isValidBase &&
        funcType === "logarithmic" &&
        expLogRes.isLogDefined &&
        (() => {
          const invPt = mathToDesign(expLogRes.logVal, x0, scale);
          const pPt = mathToDesign(x0, expLogRes.logVal, scale);

          return (
            <g>
              <InteractivePoint
                cx={x0}
                cy={expLogRes.logVal}
                scale={scale}
                vp={vp}
                onDrag={handleDragX0}
                color={MATH_COLORS.function}
                fontScale={fontScale}
              />
              {showInverse && (
                <>
                  <MathPoint
                    cx={expLogRes.logVal}
                    cy={x0}
                    scale={scale}
                    variant="solid"
                    color={MATH_COLORS.functionTransformed}
                  />
                  {/* 对称垂直平分连线 */}
                  <line
                    x1={pPt.x}
                    y1={pPt.y}
                    x2={invPt.x}
                    y2={invPt.y}
                    stroke={MATH_COLORS.labelText}
                    strokeDasharray="3 3"
                    strokeWidth={1.2}
                    opacity={0.65}
                  />
                </>
              )}
            </g>
          );
        })()}

      {/* 规范点标 */}
      <SceneLabelGroup items={sceneLabels} fontScale={fontScale} />
    </g>
  );
}
