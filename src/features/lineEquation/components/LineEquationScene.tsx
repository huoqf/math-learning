/**
 * src/features/lineEquation/components/LineEquationScene.tsx
 * 直线方程与点到直线的距离 纯 SVG 渲染组件
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid, InteractivePoint } from "@/components/Math";
import { MATH_COLORS } from "@/theme";
import { useLineEquationScene } from "../hooks/useLineEquationScene";

interface LineEquationSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "forms" | "distance" | "relation" | "family";
  form?: "general" | "pointSlope" | "slopeIntercept" | "twoPoint" | "intercept";
}

export const LineEquationScene: React.FC<LineEquationSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "forms",
  form = "general",
}) => {
  const {
    mainLineDesign,
    pointPDesign,
    distanceResult,
    footDesign,
    rightAnglePath,
    line2Design,
    twoLinesRelation,
    intersectionDesign,
    familyLineDesign,
    handlePointPDrag,
    labels,
  } = useLineEquationScene({
    params,
    scale,
    vp,
    onParamChange,
    fontScale,
    studyMode,
    form,
  });

  return (
    <g>
      {/* 坐标轴与基本网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 主直线 L₁ (Ax + By + C = 0) */}
      {mainLineDesign && (
        <line
          x1={mainLineDesign.p1.x}
          y1={mainLineDesign.p1.y}
          x2={mainLineDesign.p2.x}
          y2={mainLineDesign.p2.y}
          stroke={MATH_COLORS.paramPrimary}
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}

      {/* 2. 第二条直线 L₂ (两线关系/直线系模式) */}
      {(studyMode === "relation" || studyMode === "family") && line2Design && (
        <line
          x1={line2Design.p1.x}
          y1={line2Design.p1.y}
          x2={line2Design.p2.x}
          y2={line2Design.p2.y}
          stroke={MATH_COLORS.paramSecondary}
          strokeWidth={2.5}
          strokeDasharray={studyMode === "family" ? "6 4" : undefined}
          strokeLinecap="round"
        />
      )}

      {/* 3. 直线系模式下的动直线 L(λ) */}
      {studyMode === "family" && familyLineDesign && (
        <line
          x1={familyLineDesign.p1.x}
          y1={familyLineDesign.p1.y}
          x2={familyLineDesign.p2.x}
          y2={familyLineDesign.p2.y}
          stroke={MATH_COLORS.paramTertiary}
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}

      {/* 4. 点到直线距离模式：垂线段 PQ & 直角符号 */}
      {studyMode === "distance" && distanceResult.isValid && (
        <g>
          {/* 垂线段 PQ */}
          <line
            x1={pointPDesign.x}
            y1={pointPDesign.y}
            x2={footDesign.x}
            y2={footDesign.y}
            stroke={MATH_COLORS.focusPoint}
            strokeWidth={2}
            strokeDasharray="4 3"
          />

          {/* 拐角直角符号 ⊥ */}
          {rightAnglePath && (
            <polyline
              points={rightAnglePath}
              fill="none"
              stroke={MATH_COLORS.focusPoint}
              strokeWidth={1.8}
              strokeLinecap="square"
            />
          )}

          {/* 垂足 Q 焦点高亮 */}
          <circle
            cx={footDesign.x}
            cy={footDesign.y}
            r={5}
            fill={MATH_COLORS.white}
            stroke={MATH_COLORS.focusPoint}
            strokeWidth={2}
          />
        </g>
      )}

      {/* 5. 两线关系模式：交点高亮 */}
      {studyMode === "relation" && twoLinesRelation.type === "intersect" && intersectionDesign && (
        <circle
          cx={intersectionDesign.x}
          cy={intersectionDesign.y}
          r={6}
          fill={MATH_COLORS.vectorResult}
          stroke={MATH_COLORS.white}
          strokeWidth={2}
        />
      )}

      {/* 6. 动点 P 拖拽控制点 (仅在点到直线距离模式下显示并可拖拽) */}
      {studyMode === "distance" && (
        <InteractivePoint
          cx={params.x0 ?? 2}
          cy={params.y0 ?? 3}
          scale={scale}
          vp={vp}
          onDrag={handlePointPDrag}
          color={MATH_COLORS.paramPrimary}
          r={6}
          fontScale={fontScale}
        />
      )}

      {/* 7. 放置避让后的文本标签 */}
      {labels.map((l) => (
        <g key={l.key}>
          <text
            x={l.x}
            y={l.y + l.finalDy}
            textAnchor={l.anchor}
            fill={MATH_COLORS.labelText}
            fontSize={fontScale(11)}
            fontFamily="monospace"
            fontWeight="600"
            className="select-none pointer-events-none"
          >
            {l.text}
          </text>
        </g>
      ))}
    </g>
  );
};
