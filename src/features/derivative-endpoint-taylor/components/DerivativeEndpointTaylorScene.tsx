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
/* 调色板辅助是纯数据函数，不经 @/components/Math barrel（该 barrel 会被页面测试整体 mock） */
import { dashArrayOf } from "@/components/Math/scenePalette";
import { mathToDesign } from "@/utils/coordinate";
import { withAlpha } from "@/theme";
import type { LabelItem } from "@/utils/labelOverlap";
import { getEndpointPalette } from "../scenePalette";
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

  // 4. 本模式调色板：图例与画布的唯一颜色 / 线型来源（见 ../scenePalette.ts）
  const P = useMemo(() => getEndpointPalette(activeMode), [activeMode]);

  // 5. 展开基准点 (0, f(0))：ln / sin 基底下 f(0) = 0，该点就是坐标原点本身。
  //    此时画布不再另打一个点、也不再标 O（CoordinateGrid 已给出标准原点标识），
  //    否则出现「O 标在非原点」与「一个原点两个 O」两种错。
  const taylorBaseY = taylorRes.fn(0);
  const taylorBaseIsOrigin = Math.abs(taylorBaseY) < 0.05;

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
          color: endpointRes.isSufficientValid ? P.p0.color : P.p0Invalid.color,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        },
        {
          key: "ctrlT",
          x: ctrlPt.x,
          y: ctrlPt.y,
          text: "T",
          color: P.ctrlT.color,
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
          color: P.limitPt.color,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        },
        {
          key: "currP",
          x: currPt.x,
          y: currPt.y,
          text: "P",
          color: P.currP.color,
          fontSize: fontScale(12),
          preferredPlacement: "top-right",
        },
      ];
      return items;
    } else {
      const testPt = mathToDesign(taylorRes.xCurr, taylorRes.pxVal, scale);
      const items: LabelItem[] = [
        {
          key: "pTest",
          x: testPt.x,
          y: testPt.y,
          text: "P",
          color: P.testP.color,
          fontSize: fontScale(12),
          preferredPlacement: "top-right",
        },
      ];
      // 展开基准点 (0, f(0))：ln / sin 基底下即坐标原点，不再另标（否则与网格自带的 O 重影）
      if (!taylorBaseIsOrigin) {
        const basePt = mathToDesign(0, taylorBaseY, scale);
        items.unshift({
          key: "basePt",
          x: basePt.x,
          y: basePt.y,
          text: `(0, ${taylorBaseY})`,
          color: P.basePt.color,
          fontSize: fontScale(12),
          preferredPlacement: "bottom-left",
        });
      }
      return items;
    }
  }, [
    activeMode,
    P,
    taylorBaseIsOrigin,
    taylorBaseY,
    endpointRes,
    lhopitalRes,
    taylorRes,
    scale,
    fontScale,
  ]);

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
              baseline={{ kind: "axis" }}
              fillColor={withAlpha(P.invalidZone.color, 0.18)}
              strokeColor="transparent"
            />
          )}

          {/* 切线 */}
          <FunctionGraph
            fn={endpointRes.tangentFn}
            scale={scale}
            color={P.tangent.color}
            strokeWidth={P.tangent.width}
            strokeDasharray={dashArrayOf(P.tangent)}
          />

          {/* 原函数 (严格限定客观数学定义域，杜绝越界) */}
          <FunctionGraph
            fn={endpointRes.fn}
            scale={scale}
            color={P.fn.color}
            strokeWidth={P.fn.width}
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
              endpointRes.isSufficientValid ? P.p0.color : P.p0Invalid.color
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
            color={P.ctrlT.color}
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
            stroke={P.limitLine.color}
            strokeWidth={P.limitLine.width}
            strokeDasharray={dashArrayOf(P.limitLine)}
          />

          {/* 分子函数 */}
          <FunctionGraph
            fn={(x) => Math.exp(x) - 1 - x}
            scale={scale}
            color={P.numerator.color}
            strokeWidth={P.numerator.width}
            strokeDasharray={dashArrayOf(P.numerator)}
          />

          {/* 分母函数 */}
          <FunctionGraph
            fn={(x) => x * x}
            scale={scale}
            color={P.denominator.color}
            strokeWidth={P.denominator.width}
            strokeDasharray={dashArrayOf(P.denominator)}
          />

          {/* 导数之比 N'(x)/D'(x) = (e^x - 1)/(2x)：
              洛必达法则的核心对象，图例早已声明、原画布却漏画，现按图例补齐。
              x = 0 处不可达值与原式曲线同一约定，配合空心点 L 表达「趋近但不取到」。 */}
          <FunctionGraph
            fn={(x) => (Math.abs(x) < 1e-4 ? 0.5 : (Math.exp(x) - 1) / (2 * x))}
            scale={scale}
            color={P.dRatio.color}
            strokeWidth={P.dRatio.width}
            strokeDasharray={dashArrayOf(P.dRatio)}
          />

          {/* 比值函数 */}
          <FunctionGraph
            fn={(x) =>
              Math.abs(x) < 1e-4 ? 0.5 : (Math.exp(x) - 1 - x) / (x * x)
            }
            scale={scale}
            color={P.ratio.color}
            strokeWidth={P.ratio.width}
          />

          {/* 极限空心点 L */}
          <MathPoint
            cx={0}
            cy={lhopitalRes.limitVal}
            scale={scale}
            variant="hollow"
            color={P.limitPt.color}
            fontScale={fontScale}
          />

          {/* 逼近动点 P */}
          <InteractivePoint
            cx={lhopitalRes.xCurr}
            cy={lhopitalRes.ratioVal}
            scale={scale}
            vp={vp}
            onDrag={handleCurrDrag}
            color={P.currP.color}
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
            color={P.base.color}
            strokeWidth={P.base.width}
            domain={taylorBase === "ln" ? [-0.95, scale.xMax] : undefined}
          />

          {/* 麦克劳林多项式（基底函数的对比对象，用「对比函数」紫） */}
          <FunctionGraph
            fn={taylorRes.taylorFn}
            scale={scale}
            color={P.poly.color}
            strokeWidth={P.poly.width}
            strokeDasharray={dashArrayOf(P.poly)}
          />

          {/* 垂直残差线段：连接 (x, f(x)) 与 (x, P_n(x)) */}
          <line
            x1={mathToDesign(taylorRes.xCurr, taylorRes.fxVal, scale).x}
            y1={mathToDesign(taylorRes.xCurr, taylorRes.fxVal, scale).y}
            x2={mathToDesign(taylorRes.xCurr, taylorRes.pxVal, scale).x}
            y2={mathToDesign(taylorRes.xCurr, taylorRes.pxVal, scale).y}
            stroke={P.residual.color}
            strokeWidth={P.residual.width}
            strokeDasharray={dashArrayOf(P.residual)}
          />

          {/* 展开基准点 (0, f(0))：ln / sin 基底下与坐标原点重合，不再另打点（避免一个原点两个 O） */}
          {!taylorBaseIsOrigin && (
            <MathPoint
              cx={0}
              cy={taylorBaseY}
              scale={scale}
              color={P.basePt.color}
              fontScale={fontScale}
            />
          )}

          {/* 原函数对应点 Pf(x, f(x)) */}
          <MathPoint
            cx={taylorRes.xCurr}
            cy={taylorRes.fxVal}
            scale={scale}
            color={P.fxPt.color}
            fontScale={fontScale}
          />

          {/* 测试控制动点 P(x, P_n(x)) */}
          <InteractivePoint
            cx={taylorRes.xCurr}
            cy={taylorRes.pxVal}
            scale={scale}
            vp={vp}
            onDrag={handleTaylorTestDrag}
            color={P.testP.color}
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
