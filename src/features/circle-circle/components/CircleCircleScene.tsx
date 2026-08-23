/**
 * src/features/circle-circle/components/CircleCircleScene.tsx
 * 两圆几何关系 SVG 场景渲染层
 */

import React from "react";
import { CoordinateGrid, MathPoint, InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { MATH_COLORS, withAlpha } from "@/theme";
import { calculateCircleCircle } from "@/math/circleCircle";

export interface CircleLayerOptions {
  showCenterLine: boolean;
  showChord: boolean;
  showTangents: boolean;
}

interface CircleCircleSceneProps {
  params: {
    x1: number;
    y1: number;
    r1: number;
    x2: number;
    y2: number;
    r2: number;
  };
  studyMode: "position" | "commonChord" | "commonTangent";
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (v: number) => number;
  layers?: CircleLayerOptions;
  onCenter1Drag?: (x: number, y: number) => void;
  onCenter2Drag?: (x: number, y: number) => void;
}

export const CircleCircleScene: React.FC<CircleCircleSceneProps> = ({
  params,
  studyMode,
  scale,
  vp,
  fontScale,
  layers = {
    showCenterLine: true,
    showChord: true,
    showTangents: true,
  },
  onCenter1Drag,
  onCenter2Drag,
}) => {
  const { x1, y1, r1, x2, y2, r2 } = params;

  // 1. 计算两圆几何关系
  const res = calculateCircleCircle(params);

  // 2. 坐标转换
  const center1Design = mathToDesign(x1, y1, scale);
  const center2Design = mathToDesign(x2, y2, scale);

  const radius1Design = r1 * scale.scaleX;
  const radius2Design = r2 * scale.scaleX;

  return (
    <g className="circle-circle-scene select-none">
      {/* 1. 基础直角坐标系 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 2. 圆心连线 O1O2 (虚线) */}
      {layers.showCenterLine && (
        <line
          x1={center1Design.x}
          y1={center1Design.y}
          x2={center2Design.x}
          y2={center2Design.y}
          stroke={MATH_COLORS.primary}
          strokeWidth={1.8}
          strokeDasharray="4 3"
          opacity={0.8}
        />
      )}

      {/* 3. 圆 O1 (主控红色系) */}
      <circle
        cx={center1Design.x}
        cy={center1Design.y}
        r={radius1Design}
        fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={2.2}
      />

      {/* 4. 圆 O2 (暖橙色系) */}
      <circle
        cx={center2Design.x}
        cy={center2Design.y}
        r={radius2Design}
        fill={withAlpha(MATH_COLORS.paramSecondary, 0.08)}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2.2}
      />

      {/* 5. 公共弦 / 根轴 (在图层开启且存在根轴/公共弦时渲染) */}
      {layers.showChord && res.commonChord && (
        <g className="common-chord-layer">
          {/* 延长根轴线 (半透明绿色) */}
          {(() => {
            const { A, B } = res.commonChord.line;
            const norm = Math.hypot(A, B) || 1;
            const ux = -B / norm;
            const uy = A / norm;
            const mid = res.commonChord.midpoint || {
              x: (x1 + x2) / 2,
              y: (y1 + y2) / 2,
            };
            const pA = mathToDesign(mid.x - 12 * ux, mid.y - 12 * uy, scale);
            const pB = mathToDesign(mid.x + 12 * ux, mid.y + 12 * uy, scale);

            return (
              <line
                x1={pA.x}
                y1={pA.y}
                x2={pB.x}
                y2={pB.y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                opacity={0.5}
              />
            );
          })()}

          {/* 实心相交弦 AB */}
          {res.intersections.length === 2 && (
            <>
              {(() => {
                const p1D = mathToDesign(
                  res.intersections[0].x,
                  res.intersections[0].y,
                  scale,
                );
                const p2D = mathToDesign(
                  res.intersections[1].x,
                  res.intersections[1].y,
                  scale,
                );
                return (
                  <line
                    x1={p1D.x}
                    y1={p1D.y}
                    x2={p2D.x}
                    y2={p2D.y}
                    stroke={MATH_COLORS.paramTertiary}
                    strokeWidth={3}
                  />
                );
              })()}

              {/* 两个交点 */}
              <MathPoint
                x={res.intersections[0].x}
                y={res.intersections[0].y}
                scale={scale}
                fontScale={fontScale}
                label="A"
                color={MATH_COLORS.paramTertiary}
              />
              <MathPoint
                x={res.intersections[1].x}
                y={res.intersections[1].y}
                scale={scale}
                fontScale={fontScale}
                label="B"
                color={MATH_COLORS.paramTertiary}
              />

              {/* 弦中点 M */}
              {res.commonChord.midpoint && (
                <MathPoint
                  x={res.commonChord.midpoint.x}
                  y={res.commonChord.midpoint.y}
                  scale={scale}
                  fontScale={fontScale}
                  label="M"
                  color={MATH_COLORS.paramTertiary}
                  variant="hollow"
                />
              )}
            </>
          )}

          {/* 相切时的单交点 */}
          {res.intersections.length === 1 && (
            <MathPoint
              x={res.intersections[0].x}
              y={res.intersections[0].y}
              scale={scale}
              fontScale={fontScale}
              label="T (公切点)"
              color={MATH_COLORS.paramSecondary}
            />
          )}
        </g>
      )}

      {/* 6. 公切线渲染 (在公切线模式或图层开关开启时) */}
      {layers.showTangents && studyMode === "commonTangent" && (
        <g className="tangents-layer">
          {res.tangents.map((tan, idx) => {
            const { tPoint1, tPoint2 } = tan;
            const dx = tPoint2.x - tPoint1.x;
            const dy = tPoint2.y - tPoint1.y;
            const dist = Math.hypot(dx, dy);

            let pA = mathToDesign(tPoint1.x, tPoint1.y, scale);
            let pB = mathToDesign(tPoint2.x, tPoint2.y, scale);

            if (dist > 1e-4) {
              const ux = dx / dist;
              const uy = dy / dist;
              pA = mathToDesign(tPoint1.x - 6 * ux, tPoint1.y - 6 * uy, scale);
              pB = mathToDesign(tPoint2.x + 6 * ux, tPoint2.y + 6 * uy, scale);
            } else {
              // 单点切线 (外切内公切线)
              const nx = -(y2 - y1) / (res.d || 1);
              const ny = (x2 - x1) / (res.d || 1);
              pA = mathToDesign(tPoint1.x - 8 * nx, tPoint1.y - 8 * ny, scale);
              pB = mathToDesign(tPoint1.x + 8 * nx, tPoint1.y + 8 * ny, scale);
            }

            const isInner = tan.type === "inner";
            const color = isInner ? "#8B5CF6" : "#3B82F6";

            return (
              <g key={`tan-${idx}`}>
                <line
                  x1={pA.x}
                  y1={pA.y}
                  x2={pB.x}
                  y2={pB.y}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray={isInner ? "5 3" : undefined}
                />
                <MathPoint
                  x={tPoint1.x}
                  y={tPoint1.y}
                  scale={scale}
                  fontScale={fontScale}
                  color={color}
                  variant="hollow"
                />
                <MathPoint
                  x={tPoint2.x}
                  y={tPoint2.y}
                  scale={scale}
                  fontScale={fontScale}
                  color={color}
                  variant="hollow"
                />
              </g>
            );
          })}
        </g>
      )}

      {/* 7. 圆心交互控制点 O1 与 O2 */}
      <InteractivePoint
        cx={x1}
        cy={y1}
        scale={scale}
        vp={vp}
        fontScale={fontScale}
        label={`O₁(${x1.toFixed(1)}, ${y1.toFixed(1)})`}
        color={MATH_COLORS.paramPrimary}
        onDrag={(mathPt) => onCenter1Drag?.(mathPt.x, mathPt.y)}
      />

      <InteractivePoint
        cx={x2}
        cy={y2}
        scale={scale}
        vp={vp}
        fontScale={fontScale}
        label={`O₂(${x2.toFixed(1)}, ${y2.toFixed(1)})`}
        color={MATH_COLORS.paramSecondary}
        onDrag={(mathPt) => onCenter2Drag?.(mathPt.x, mathPt.y)}
      />
    </g>
  );
};
