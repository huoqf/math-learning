/**
 * src/features/derivative-endpoint-taylor/components/DerivativeEndpointTaylorScene.tsx
 * 纯 SVG 场景渲染组件：端点效应、洛必达法则、泰勒多项式拟合
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  IntervalShadow,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import {
  calcEndpointEffect,
  calcLHopital,
  calcTaylorPolynomial,
  type EndpointFuncType,
  type TaylorBaseType,
} from "@/math/derivativeEndpointTaylor";

interface DerivativeEndpointTaylorSceneProps {
  params: {
    a: number;
    xCurr: number;
    x0: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  activeMode: "endpoint" | "lhopital" | "taylor";
  endpointType: EndpointFuncType;
  taylorBase: TaylorBaseType;
  taylorOrder: number;
}

export const DerivativeEndpointTaylorScene: React.FC<
  DerivativeEndpointTaylorSceneProps
> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  activeMode,
  endpointType,
  taylorBase,
  taylorOrder,
}) => {
  // 1. 模式一：端点效应与必要条件探究
  if (activeMode === "endpoint") {
    const res = calcEndpointEffect(endpointType, params.a);
    const endPt = mathToDesign(res.x0, res.f0, scale);

    // 拖拽端点切线控制点
    const handleTangentDrag = (pt: { x: number; y: number }) => {
      // slope = (y - f0) / (x - x0)
      const slope = (pt.y - res.f0) / (pt.x - res.x0 || 0.1);
      const newA = Math.max(0.2, Math.min(2.2, 1 - slope));
      onParamChange("a", Number(newA.toFixed(2)));
    };

    const warnPt = mathToDesign(res.x0 + 0.8, -0.6, scale);

    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 若 a > 1 即必要条件失效，绘制右侧失效负值阴影 */}
        {!res.isSufficientValid && (
          <IntervalShadow
            fn={res.fn}
            x1={res.x0}
            x2={Math.min(res.x0 + 2.5, scale.xMax)}
            scale={scale}
            fillColor={withAlpha(MATH_COLORS.vectorResult, 0.18)}
            strokeColor="transparent"
          />
        )}

        {/* 切线 y = f'(x0)(x - x0) + f(x0) */}
        <FunctionGraph
          fn={res.tangentFn}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          strokeWidth={1.8}
          strokeDasharray="5 4"
        />

        {/* 原函数 f(x) */}
        <FunctionGraph
          fn={res.fn}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.8}
        />

        {/* 端点高亮标记 */}
        <circle
          cx={endPt.x}
          cy={endPt.y}
          r={6}
          fill={
            res.isSufficientValid
              ? MATH_COLORS.focusPoint
              : MATH_COLORS.vectorResult
          }
          stroke={MATH_COLORS.white}
          strokeWidth={2}
        />

        {/* 切线可拖拽控制点（在 x0 + 1 处） */}
        <InteractivePoint
          cx={res.x0 + 1.0}
          cy={res.tangentFn(res.x0 + 1.0)}
          scale={scale}
          vp={vp}
          onDrag={handleTangentDrag}
          color={MATH_COLORS.paramPrimary}
          r={5.5}
          fontScale={fontScale}
        />

        {/* 端点数值与斜率简单的文本 */}
        <text
          x={endPt.x + 12}
          y={endPt.y - 12}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(11)}
          fontWeight="bold"
          className="select-none pointer-events-none"
        >
          端点 ({res.x0}, {res.f0.toFixed(1)}), k = {res.df0.toFixed(2)}
        </text>

        {!res.isSufficientValid && (
          <text
            x={warnPt.x}
            y={warnPt.y}
            fill={MATH_COLORS.vectorResult}
            fontSize={fontScale(11)}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            ! f'(0) &lt; 0 破坏恒成立
          </text>
        )}
      </g>
    );
  }

  // 2. 模式二：洛必达法则未定式极限逼近
  if (activeMode === "lhopital") {
    const res = calcLHopital(params.xCurr);
    const limitPt = mathToDesign(0, res.limitVal, scale);
    const currPt = mathToDesign(res.xCurr, res.ratioVal, scale);

    const handleCurrDrag = (pt: { x: number; y: number }) => {
      const newX = Math.max(-1.4, Math.min(1.4, pt.x));
      onParamChange("xCurr", Number(newX.toFixed(2)));
    };

    // 绘制分子 N(x) = e^x - 1 - x 与分母 D(x) = x^2，以及商函数 g(x) = N(x)/D(x)
    const fnNum = (x: number) => Math.exp(x) - 1 - x;
    const fnDen = (x: number) => x * x;
    const fnRatio = (x: number) =>
      Math.abs(x) < 1e-4 ? 0.5 : (Math.exp(x) - 1 - x) / (x * x);

    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} />

        {/* 极限水平渐近基准线 y = 0.5 */}
        <line
          x1={mathToDesign(scale.xMin, 0.5, scale).x}
          y1={mathToDesign(scale.xMin, 0.5, scale).y}
          x2={mathToDesign(scale.xMax, 0.5, scale).x}
          y2={mathToDesign(scale.xMax, 0.5, scale).y}
          stroke={MATH_COLORS.asymptote}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />

        {/* 分子函数 N(x) - 紫色 */}
        <FunctionGraph
          fn={fnNum}
          scale={scale}
          color={MATH_COLORS.vectorSecondary}
          strokeWidth={1.8}
          strokeDasharray="3 3"
        />

        {/* 分母函数 D(x) - 橙色 */}
        <FunctionGraph
          fn={fnDen}
          scale={scale}
          color={MATH_COLORS.paramSecondary}
          strokeWidth={1.8}
          strokeDasharray="3 3"
        />

        {/* 商函数 g(x) - 蓝色主要 */}
        <FunctionGraph
          fn={fnRatio}
          scale={scale}
          color={MATH_COLORS.function}
          strokeWidth={2.8}
        />

        {/* 割线逼近虚线 (0, 0.5) 到 (xCurr, ratioVal) */}
        <line
          x1={limitPt.x}
          y1={limitPt.y}
          x2={currPt.x}
          y2={currPt.y}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={1.8}
          strokeDasharray="2 2"
        />

        {/* 未定极限点空心圆 (0, 0.5) */}
        <circle
          cx={limitPt.x}
          cy={limitPt.y}
          r={5.5}
          fill={MATH_COLORS.white}
          stroke={MATH_COLORS.function}
          strokeWidth={2.5}
        />

        {/* 动点 InteractivePoint */}
        <InteractivePoint
          cx={res.xCurr}
          cy={res.ratioVal}
          scale={scale}
          vp={vp}
          onDrag={handleCurrDrag}
          color={MATH_COLORS.paramPrimary}
          r={6}
          fontScale={fontScale}
        />

        {/* 文字标注 */}
        <text
          x={limitPt.x + 10}
          y={limitPt.y - 10}
          fill={MATH_COLORS.function}
          fontSize={fontScale(11)}
          fontWeight="bold"
          className="select-none pointer-events-none"
        >
          洛必达极限 L = 1/2
        </text>

        <text
          x={currPt.x + 10}
          y={currPt.y + 16}
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(10)}
          fontFamily="monospace"
          fontWeight="600"
          className="select-none pointer-events-none"
        >
          x={res.xCurr.toFixed(2)}, ratio={res.ratioVal.toFixed(3)}
        </text>
      </g>
    );
  }

  // 3. 模式三：泰勒展开拟合与包络放缩
  const res = calcTaylorPolynomial(taylorBase, taylorOrder, params.x0);

  const handleX0Drag = (pt: { x: number; y: number }) => {
    const newX0 = Math.max(-1.0, Math.min(1.0, pt.x));
    onParamChange("x0", Number(newX0.toFixed(1)));
  };

  const x0Pt = mathToDesign(res.x0, res.fn(res.x0), scale);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 原函数与泰勒拟合残差阴影包络区间 */}
      <IntervalShadow
        fn={res.fn}
        x1={Math.max(res.x0 - 1.5, scale.xMin)}
        x2={Math.min(res.x0 + 1.5, scale.xMax)}
        scale={scale}
        fillColor={withAlpha(MATH_COLORS.paramPrimary, 0.12)}
        strokeColor="transparent"
      />

      {/* 泰勒多项式拟合曲线 P_n(x) - 虚线 */}
      <FunctionGraph
        fn={res.taylorFn}
        scale={scale}
        color={MATH_COLORS.paramSecondary}
        strokeWidth={2.2}
        strokeDasharray="5 3"
      />

      {/* 原超越函数 f(x) - 实线 */}
      <FunctionGraph
        fn={res.fn}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.8}
      />

      {/* 展开点 (x0, f(x0)) 可拖拽点 */}
      <InteractivePoint
        cx={res.x0}
        cy={res.fn(res.x0)}
        scale={scale}
        vp={vp}
        onDrag={handleX0Drag}
        color={MATH_COLORS.paramTertiary}
        r={6}
        fontScale={fontScale}
      />

      <text
        x={x0Pt.x + 10}
        y={x0Pt.y - 10}
        fill={MATH_COLORS.paramTertiary}
        fontSize={fontScale(11)}
        fontWeight="bold"
        className="select-none pointer-events-none"
      >
        展开点 x₀ = {res.x0.toFixed(1)} ({res.order}阶拟合)
      </text>
    </g>
  );
};
