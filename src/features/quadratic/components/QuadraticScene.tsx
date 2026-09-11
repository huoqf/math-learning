/**
 * src/features/quadratic/components/QuadraticScene.tsx
 * 纯 SVG 渲染，严格遵循高中数学学术规范与门禁标准
 */

import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  IntervalShadow,
  SceneLabelGroup,
} from "@/components/Math";
import type { LabelItem } from "@/utils/labelOverlap";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, withAlpha } from "@/theme";
import { useQuadraticScene } from "../hooks/useQuadraticScene";

interface QuadraticSceneProps {
  params: {
    a: number;
    b: number;
    c: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "function" | "equation" | "inequality";
  ineqType?: ">" | "<";
}

export const QuadraticScene: React.FC<QuadraticSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "function",
  ineqType = ">",
}) => {
  const { a, b, c } = params;

  const {
    axisLine,
    solutionIntervals,
    handleVertexDrag,
    handleYInterceptDrag,
    isDegenerate,
    vertexX,
    vertexY,
    roots,
  } = useQuadraticScene({ params, scale, onParamChange, studyMode, ineqType });

  const fn = React.useCallback((x: number) => a * x * x + b * x + c, [a, b, c]);

  // 学术标签组解算（纯学术代数代号，杜绝手写浮点跳动坐标）
  const labelItems = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];

    // 1. 顶点 V
    if (vertexX !== null && vertexY !== null && !isDegenerate) {
      const ptV = mathToDesign(vertexX, vertexY, scale);
      items.push({
        key: "vertex-v",
        x: ptV.x,
        y: ptV.y,
        text: "V",
        color: MATH_COLORS.focusPoint,
        preferredPlacement: a > 0 ? "bottom" : "top",
      });
    }

    // 2. Y 轴截距点 C
    const ptC = mathToDesign(0, c, scale);
    items.push({
      key: "y-intercept-c",
      x: ptC.x,
      y: ptC.y,
      text: "C",
      color: MATH_COLORS.paramTertiary,
      preferredPlacement: "right",
    });

    // 3. 对应实根/端点
    if (studyMode !== "inequality") {
      if (roots.length === 2) {
        const pt1 = mathToDesign(roots[0], 0, scale);
        items.push({
          key: "root-x1",
          x: pt1.x,
          y: pt1.y,
          text: "x₁",
          color: MATH_COLORS.focusPoint,
          preferredPlacement: "top",
        });
        const pt2 = mathToDesign(roots[1], 0, scale);
        items.push({
          key: "root-x2",
          x: pt2.x,
          y: pt2.y,
          text: "x₂",
          color: MATH_COLORS.focusPoint,
          preferredPlacement: "top",
        });
      } else if (roots.length === 1) {
        const pt0 = mathToDesign(roots[0], 0, scale);
        items.push({
          key: "root-x0",
          x: pt0.x,
          y: pt0.y,
          text: "x₀",
          color: MATH_COLORS.focusPoint,
          preferredPlacement: "top",
        });
      }
    } else {
      solutionIntervals.forEach((interval, idx) => {
        if (
          !interval.isLeftInfinity &&
          interval.x1 >= scale.xMin &&
          interval.x1 <= scale.xMax
        ) {
          const pt = mathToDesign(interval.x1, 0, scale);
          items.push({
            key: `ineq-bound-1-${idx}`,
            x: pt.x,
            y: pt.y,
            text: "x₁",
            color: MATH_COLORS.inequality,
            preferredPlacement: "bottom",
          });
        }
        if (
          !interval.isRightInfinity &&
          interval.x2 >= scale.xMin &&
          interval.x2 <= scale.xMax
        ) {
          const pt = mathToDesign(interval.x2, 0, scale);
          items.push({
            key: `ineq-bound-2-${idx}`,
            x: pt.x,
            y: pt.y,
            text: "x₂",
            color: MATH_COLORS.inequality,
            preferredPlacement: "bottom",
          });
        }
      });
    }

    return items;
  }, [
    vertexX,
    vertexY,
    isDegenerate,
    a,
    c,
    scale,
    studyMode,
    roots,
    solutionIntervals,
  ]);

  return (
    <g>
      {/* 坐标系（纯净无繁杂网格干扰） */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 不等式解集在函数上方的半透明阴影区域 */}
      {studyMode === "inequality" &&
        solutionIntervals.map((interval, index) => (
          <IntervalShadow
            key={`shadow-${index}`}
            fn={fn}
            x1={interval.x1}
            x2={interval.x2}
            scale={scale}
            fillColor={withAlpha(MATH_COLORS.inequality, 0.15)}
            strokeColor="transparent"
          />
        ))}

      {/* 对称轴辅助虚线 x = -b/(2a) */}
      {axisLine && (
        <line
          x1={axisLine.x1}
          y1={axisLine.y1}
          x2={axisLine.x2}
          y2={axisLine.y2}
          stroke={MATH_COLORS.asymptote}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      )}

      {/* 二次函数图象 */}
      <FunctionGraph
        fn={fn}
        scale={scale}
        color={MATH_COLORS.function}
        strokeWidth={2.5}
      />

      {/* 不等式解集在 X 轴上的投影区间与空心端点 */}
      {studyMode === "inequality" &&
        solutionIntervals.map((interval, index) => {
          const startPt = mathToDesign(
            Math.max(interval.x1, scale.xMin),
            0,
            scale,
          );
          const endPt = mathToDesign(
            Math.min(interval.x2, scale.xMax),
            0,
            scale,
          );
          return (
            <g key={`projection-group-${index}`}>
              <line
                x1={startPt.x}
                y1={startPt.y}
                x2={endPt.x}
                y2={endPt.y}
                stroke={MATH_COLORS.inequality}
                strokeWidth={5}
                strokeOpacity={0.6}
                strokeLinecap="round"
              />
              {!interval.isLeftInfinity &&
                interval.x1 >= scale.xMin &&
                interval.x1 <= scale.xMax && (
                  <circle
                    cx={mathToDesign(interval.x1, 0, scale).x}
                    cy={mathToDesign(interval.x1, 0, scale).y}
                    r={4.5}
                    fill={MATH_COLORS.white}
                    stroke={MATH_COLORS.inequality}
                    strokeWidth={2}
                  />
                )}
              {!interval.isRightInfinity &&
                interval.x2 >= scale.xMin &&
                interval.x2 <= scale.xMax && (
                  <circle
                    cx={mathToDesign(interval.x2, 0, scale).x}
                    cy={mathToDesign(interval.x2, 0, scale).y}
                    r={4.5}
                    fill={MATH_COLORS.white}
                    stroke={MATH_COLORS.inequality}
                    strokeWidth={2}
                  />
                )}
            </g>
          );
        })}

      {/* 可拖拽点：Y 轴截距 (0, c) */}
      <InteractivePoint
        cx={0}
        cy={c}
        scale={scale}
        vp={vp}
        onDrag={handleYInterceptDrag}
        color={MATH_COLORS.paramTertiary}
        r={5}
        disabled={false}
        fontScale={fontScale}
      />

      {/* 可拖拽点：抛物线顶点 V(h, k) */}
      {vertexX !== null && vertexY !== null && (
        <InteractivePoint
          cx={vertexX}
          cy={vertexY}
          scale={scale}
          vp={vp}
          onDrag={handleVertexDrag}
          color={MATH_COLORS.focusPoint}
          r={6}
          disabled={isDegenerate}
          fontScale={fontScale}
        />
      )}

      {/* 方程实根交点 */}
      {studyMode !== "inequality" &&
        roots
          .filter((r) => Number.isFinite(r))
          .map((rootVal, i) => {
            const pt = mathToDesign(rootVal, 0, scale);
            return (
              <circle
                key={`root-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={4.5}
                fill={MATH_COLORS.focusPoint}
                stroke={MATH_COLORS.white}
                strokeWidth={1.5}
              />
            );
          })}

      {/* 学术点标防重叠统一渲染 */}
      <SceneLabelGroup items={labelItems} fontScale={fontScale} />
    </g>
  );
};
