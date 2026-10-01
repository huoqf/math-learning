/**
 * src/features/lineEquation/components/LineEquationScene.tsx
 * 直线方程与点到直线的距离 纯 SVG 渲染组件
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  InteractivePoint,
  SceneLabelGroup,
} from "@/components/Math";
import { MATH_COLORS } from "@/theme";
import { paramMeta } from "@/data/registries/lineEquation";
import { paramDragBounds } from "@/utils/paramClamp";
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
    handlePoint1Drag,
    handlePoint2Drag,
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

  /**
   * 拖拽钳制域 = 左屏参数声明域 ∩ 中屏可见视口（SSOT：@/utils/paramClamp）。
   * 中屏每个可拖拽点都必须同时守住两条边界：越过滑块量程则读数与图形脱节，
   * 越过可见画布则控制点被拖出视口后再也抓不回来。此处仅做「参数键 → 合法区间」转接。
   */
  const dragBounds = (xMetaKey: string, yMetaKey: string) =>
    paramDragBounds(paramMeta[xMetaKey], paramMeta[yMetaKey], scale);

  return (
    <g>
      {/* 坐标轴（解析几何纯净坐标系，showGrid={false}） */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

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

      {/* 5. 两线关系 / 直线系模式：交点 / 恒过定点高亮 */}
      {(studyMode === "relation" || studyMode === "family") &&
        twoLinesRelation.type === "intersect" &&
        intersectionDesign && (
          <circle
            cx={intersectionDesign.x}
            cy={intersectionDesign.y}
            r={6}
            fill={
              studyMode === "family"
                ? MATH_COLORS.paramPrimary
                : MATH_COLORS.vectorResult
            }
            stroke={MATH_COLORS.white}
            strokeWidth={2}
          />
        )}

      {/* 6. 交互控制点 */}
      {/* 6.1 点到直线距离模式：待测动点 P0 */}
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
          {...dragBounds("x0", "y0")}
        />
      )}

      {/* 6.2 两点式模式：已知点 P1 与 P2 */}
      {studyMode === "forms" && form === "twoPoint" && (
        <>
          <InteractivePoint
            cx={params.x1 ?? -2}
            cy={params.y1 ?? -1}
            scale={scale}
            vp={vp}
            onDrag={handlePoint1Drag}
            color={MATH_COLORS.paramSecondary}
            r={6}
            fontScale={fontScale}
            {...dragBounds("x1", "y1")}
          />
          <InteractivePoint
            cx={params.x2 ?? 2}
            cy={params.y2 ?? 3}
            scale={scale}
            vp={vp}
            onDrag={handlePoint2Drag}
            color={MATH_COLORS.paramTertiary}
            r={6}
            fontScale={fontScale}
            {...dragBounds("x2", "y2")}
          />
        </>
      )}

      {/* 6.3 点斜式模式：已知定点 P0 */}
      {studyMode === "forms" && form === "pointSlope" && (
        <InteractivePoint
          cx={params.x0 ?? 0}
          cy={params.y0 ?? 1}
          scale={scale}
          vp={vp}
          onDrag={handlePointPDrag}
          color={MATH_COLORS.paramSecondary}
          r={6}
          fontScale={fontScale}
          {...dragBounds("x0", "y0")}
        />
      )}

      {/* 7. 智能学术标签组 (防穿透、防重叠、无浮点数跳动) */}
      <SceneLabelGroup items={labels} fontScale={fontScale} />
    </g>
  );
};
