/**
 * src/features/derivative-endpoint-taylor/components/DerivativeEndpointTaylorScene.tsx
 * 纯 SVG 场景渲染组件：端点效应、洛必达法则、泰勒多项式拟合
 * 全量接入 resolveLabelPlacements 智能多方向标签避让算法
 */

import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  IntervalShadow,
  SceneLabelGroup,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { LabelItem } from "@/utils/labelOverlap";
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
    xTest: number;
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
  const endpointRes = useMemo(
    () => calcEndpointEffect(endpointType, params.a),
    [endpointType, params.a],
  );

  // 2. 模式二：洛必达法则
  const lhopitalRes = useMemo(() => calcLHopital(params.xCurr), [params.xCurr]);

  // 3. 模式三：麦克劳林展开与测试动点
  const taylorRes = useMemo(
    () => calcTaylorPolynomial(taylorBase, taylorOrder, params.xTest),
    [taylorBase, taylorOrder, params.xTest],
  );

  // 拖拽控制回调
  const handleTangentDrag = (pt: { x: number; y: number }) => {
    const dx = pt.x - endpointRes.x0;
    if (Math.abs(dx) < 0.25) return;
    const slope = (pt.y - endpointRes.f0) / dx;
    const newA = Math.max(0.2, Math.min(2.2, 1 - slope));
    onParamChange("a", Number(newA.toFixed(2)));
  };

  const handleCurrDrag = (pt: { x: number; y: number }) => {
    const newX = Math.max(-1.2, Math.min(1.2, pt.x));
    onParamChange("xCurr", Number(newX.toFixed(2)));
  };

  const handleTaylorTestDrag = (pt: { x: number; y: number }) => {
    const newX = Math.max(0.1, Math.min(2.5, pt.x));
    onParamChange("xTest", Number(newX.toFixed(2)));
  };

  // 纯极简学术点标解算 (集中定义学术符号)
  const modeLabels = useMemo<LabelItem[]>(() => {
    if (activeMode === "endpoint") {
      const endPt = mathToDesign(endpointRes.x0, endpointRes.f0, scale);
      const ctrlPt = mathToDesign(
        endpointRes.x0 + 1.0,
        endpointRes.tangentFn(endpointRes.x0 + 1.0),
        scale,
      );
      const items: LabelItem[] = [
        {
          key: "p0",
          x: endPt.x,
          y: endPt.y,
          text: "P₀",
          color: endpointRes.isSufficientValid
            ? MATH_COLORS.focusPoint
            : MATH_COLORS.vectorResult,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        },
        {
          key: "ctrlT",
          x: ctrlPt.x,
          y: ctrlPt.y,
          text: "T",
          color: MATH_COLORS.paramPrimary,
          fontSize: fontScale(12),
          preferredPlacement: "top-right",
        },
      ];
      return items;
    } else if (activeMode === "lhopital") {
      const limitPt = mathToDesign(0, lhopitalRes.limitVal, scale);
      const currPt = mathToDesign(
        lhopitalRes.xCurr,
        lhopitalRes.ratioVal,
        scale,
      );
      const items: LabelItem[] = [
        {
          key: "limitL",
          x: limitPt.x,
          y: limitPt.y,
          text: "L",
          color: MATH_COLORS.focusPoint,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        },
        {
          key: "currP",
          x: currPt.x,
          y: currPt.y,
          text: "P",
          color: MATH_COLORS.paramPrimary,
          fontSize: fontScale(12),
          preferredPlacement: "top-right",
        },
      ];
      return items;
    } else {
      const originPt = mathToDesign(0, taylorRes.fn(0), scale);
      const testPt = mathToDesign(taylorRes.xCurr, taylorRes.pxVal, scale);
      const items: LabelItem[] = [
        {
          key: "originO",
          x: originPt.x,
          y: originPt.y,
          text: "O",
          color: MATH_COLORS.focusPoint,
          fontSize: fontScale(12),
          preferredPlacement: "bottom-left",
        },
        {
          key: "pTest",
          x: testPt.x,
          y: testPt.y,
          text: "P",
          color: MATH_COLORS.paramPrimary,
          fontSize: fontScale(12),
          preferredPlacement: "top-right",
        },
      ];
      return items;
    }
  }, [activeMode, endpointRes, lhopitalRes, taylorRes, scale, fontScale]);

  return (
    <g>
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 模式一：端点效应 */}
      {activeMode === "endpoint" && (
        <g>
          {!endpointRes.isSufficientValid && (
            <IntervalShadow
              fn={endpointRes.fn}
              x1={endpointRes.x0}
              x2={Math.min(endpointRes.x0 + 2.5, scale.xMax)}
              scale={scale}
              fillColor={withAlpha(MATH_COLORS.vectorResult, 0.18)}
              strokeColor="transparent"
            />
          )}

          {/* 切线 */}
          <FunctionGraph
            fn={endpointRes.tangentFn}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={1.8}
            strokeDasharray="5 4"
          />

          {/* 原函数 (严格限定客观数学定义域，杜绝越界) */}
          <FunctionGraph
            fn={endpointRes.fn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.8}
            domain={
              endpointType === "xln"
                ? [0.01, scale.xMax]
                : endpointType === "ln"
                  ? [-0.95, scale.xMax]
                  : undefined
            }
          />

          {/* 端点 P0 */}
          <MathPoint
            cx={endpointRes.x0}
            cy={endpointRes.f0}
            scale={scale}
            color={
              endpointRes.isSufficientValid
                ? MATH_COLORS.focusPoint
                : MATH_COLORS.vectorResult
            }
            fontScale={fontScale}
          />

          {/* 切线控制点 T */}
          <InteractivePoint
            cx={endpointRes.x0 + 1.0}
            cy={endpointRes.tangentFn(endpointRes.x0 + 1.0)}
            scale={scale}
            vp={vp}
            onDrag={handleTangentDrag}
            color={MATH_COLORS.paramPrimary}
            r={6}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* 2. 模式二：洛必达法则 */}
      {activeMode === "lhopital" && (
        <g>
          {/* 极限水平渐近线 */}
          <line
            x1={mathToDesign(scale.xMin, 0.5, scale).x}
            y1={mathToDesign(scale.xMin, 0.5, scale).y}
            x2={mathToDesign(scale.xMax, 0.5, scale).x}
            y2={mathToDesign(scale.xMax, 0.5, scale).y}
            stroke={MATH_COLORS.tangentLine}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* 分子函数 */}
          <FunctionGraph
            fn={(x) => Math.exp(x) - 1 - x}
            scale={scale}
            color={MATH_COLORS.vectorResult}
            strokeWidth={1.8}
            strokeDasharray="3 3"
          />

          {/* 分母函数 */}
          <FunctionGraph
            fn={(x) => x * x}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={1.8}
            strokeDasharray="3 3"
          />

          {/* 比值函数 */}
          <FunctionGraph
            fn={(x) =>
              Math.abs(x) < 1e-4 ? 0.5 : (Math.exp(x) - 1 - x) / (x * x)
            }
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.8}
          />

          {/* 极限空心点 L */}
          <MathPoint
            cx={0}
            cy={lhopitalRes.limitVal}
            scale={scale}
            variant="hollow"
            color={MATH_COLORS.focusPoint}
            fontScale={fontScale}
          />

          {/* 逼近动点 P */}
          <InteractivePoint
            cx={lhopitalRes.xCurr}
            cy={lhopitalRes.ratioVal}
            scale={scale}
            vp={vp}
            onDrag={handleCurrDrag}
            color={MATH_COLORS.paramPrimary}
            r={6}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* 3. 模式三：泰勒/麦克劳林展开 */}
      {activeMode === "taylor" && (
        <g>
          {/* 原函数 (客观定义域保护) */}
          <FunctionGraph
            fn={taylorRes.fn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.8}
            domain={taylorBase === "ln" ? [-0.95, scale.xMax] : undefined}
          />

          {/* 麦克劳林多项式 */}
          <FunctionGraph
            fn={taylorRes.taylorFn}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.2}
            strokeDasharray="5 3"
          />

          {/* 垂直残差线段：连接 (x, f(x)) 与 (x, P_n(x)) */}
          <line
            x1={mathToDesign(taylorRes.xCurr, taylorRes.fxVal, scale).x}
            y1={mathToDesign(taylorRes.xCurr, taylorRes.fxVal, scale).y}
            x2={mathToDesign(taylorRes.xCurr, taylorRes.pxVal, scale).x}
            y2={mathToDesign(taylorRes.xCurr, taylorRes.pxVal, scale).y}
            stroke={MATH_COLORS.vectorResult}
            strokeWidth={2}
            strokeDasharray="3 2"
          />

          {/* 展开基准点 O(0, f(0)) */}
          <MathPoint
            cx={0}
            cy={taylorRes.fn(0)}
            scale={scale}
            color={MATH_COLORS.focusPoint}
            fontScale={fontScale}
          />

          {/* 原函数对应点 Pf(x, f(x)) */}
          <MathPoint
            cx={taylorRes.xCurr}
            cy={taylorRes.fxVal}
            scale={scale}
            color={MATH_COLORS.function}
            fontScale={fontScale}
          />

          {/* 测试控制动点 P(x, P_n(x)) */}
          <InteractivePoint
            cx={taylorRes.xCurr}
            cy={taylorRes.pxVal}
            scale={scale}
            vp={vp}
            onDrag={handleTaylorTestDrag}
            color={MATH_COLORS.paramPrimary}
            r={6}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ─── 统一智能避让图层：纯净学术点标渲染 ─── */}
      <SceneLabelGroup items={modeLabels} fontScale={fontScale} />
    </g>
  );
};
