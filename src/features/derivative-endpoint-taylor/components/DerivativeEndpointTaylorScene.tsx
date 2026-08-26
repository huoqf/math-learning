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
  const endpointRes = useMemo(
    () => calcEndpointEffect(endpointType, params.a),
    [endpointType, params.a],
  );

  // 2. 模式二：洛必达法则
  const lhopitalRes = useMemo(() => calcLHopital(params.xCurr), [params.xCurr]);

  // 3. 模式三：泰勒展开
  const taylorRes = useMemo(
    () => calcTaylorPolynomial(taylorBase, taylorOrder, params.x0),
    [taylorBase, taylorOrder, params.x0],
  );

  // 拖拽控制回调
  const handleTangentDrag = (pt: { x: number; y: number }) => {
    const slope = (pt.y - endpointRes.f0) / (pt.x - endpointRes.x0 || 0.1);
    const newA = Math.max(0.2, Math.min(2.2, 1 - slope));
    onParamChange("a", Number(newA.toFixed(2)));
  };

  const handleCurrDrag = (pt: { x: number; y: number }) => {
    const newX = Math.max(-1.4, Math.min(1.4, pt.x));
    onParamChange("xCurr", Number(newX.toFixed(2)));
  };

  const handleTaylorX0Drag = (pt: { x: number; y: number }) => {
    const newX0 = Math.max(-2.5, Math.min(2.5, pt.x));
    onParamChange("x0", Number(newX0.toFixed(2)));
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
      const x0Pt = mathToDesign(
        taylorRes.x0,
        taylorRes.fn(taylorRes.x0),
        scale,
      );
      const testPt = mathToDesign(
        taylorRes.x0 + 1.0,
        taylorRes.taylorFn(taylorRes.x0 + 1.0),
        scale,
      );
      const items: LabelItem[] = [
        {
          key: "p0",
          x: x0Pt.x,
          y: x0Pt.y,
          text: "P₀",
          color: MATH_COLORS.focusPoint,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        },
        {
          key: "pTest",
          x: testPt.x,
          y: testPt.y,
          text: "P",
          color: MATH_COLORS.paramSecondary,
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

          {/* 原函数 */}
          <FunctionGraph
            fn={endpointRes.fn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.8}
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

      {/* 3. 模式三：泰勒展开 */}
      {activeMode === "taylor" && (
        <g>
          {/* 原函数 */}
          <FunctionGraph
            fn={taylorRes.fn}
            scale={scale}
            color={MATH_COLORS.function}
            strokeWidth={2.8}
          />

          {/* 泰勒多项式 */}
          <FunctionGraph
            fn={taylorRes.taylorFn}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.2}
            strokeDasharray="5 3"
          />

          {/* 展开中心 P0 */}
          <InteractivePoint
            cx={taylorRes.x0}
            cy={taylorRes.fn(taylorRes.x0)}
            scale={scale}
            vp={vp}
            onDrag={handleTaylorX0Drag}
            color={MATH_COLORS.focusPoint}
            r={6}
            fontScale={fontScale}
          />

          {/* 测试点 P */}
          <MathPoint
            cx={taylorRes.x0 + 1.0}
            cy={taylorRes.taylorFn(taylorRes.x0 + 1.0)}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ─── 统一智能避让图层：纯净学术点标渲染 ─── */}
      <SceneLabelGroup items={modeLabels} fontScale={fontScale} />
    </g>
  );
};
