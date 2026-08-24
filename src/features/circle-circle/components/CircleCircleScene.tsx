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
      {/* 1. 基础直角坐标系 (纯净坐标系，showGrid={false}) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

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

          {/* 实心相交弦 AB 与垂径直角三角形构造 */}
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

              {/* 垂径三角形辅助线：O1A (斜边 r1) 与 O1M (弦心距 d1) */}
              {res.commonChord.midpoint && (
                <>
                  {(() => {
                    const ptA = res.intersections[0];
                    const mid = res.commonChord.midpoint!;
                    const pAD = mathToDesign(ptA.x, ptA.y, scale);
                    const midD = mathToDesign(mid.x, mid.y, scale);

                    // 直角标尺计算 (固定 9px，防畸变)
                    const dMidO1X = center1Design.x - midD.x;
                    const dMidO1Y = center1Design.y - midD.y;
                    const lenO1 = Math.hypot(dMidO1X, dMidO1Y) || 1;
                    const uO1X = dMidO1X / lenO1;
                    const uO1Y = dMidO1Y / lenO1;

                    const dMidAX = pAD.x - midD.x;
                    const dMidAY = pAD.y - midD.y;
                    const lenA = Math.hypot(dMidAX, dMidAY) || 1;
                    const uAX = dMidAX / lenA;
                    const uAY = dMidAY / lenA;

                    const s = 9;
                    const corner1 = {
                      x: midD.x + s * uO1X,
                      y: midD.y + s * uO1Y,
                    };
                    const corner2 = {
                      x: midD.x + s * uO1X + s * uAX,
                      y: midD.y + s * uO1Y + s * uAY,
                    };
                    const corner3 = {
                      x: midD.x + s * uAX,
                      y: midD.y + s * uAY,
                    };

                    return (
                      <g className="chord-triangle-helper">
                        {/* 半径辅助线 O1-A */}
                        <line
                          x1={center1Design.x}
                          y1={center1Design.y}
                          x2={pAD.x}
                          y2={pAD.y}
                          stroke={MATH_COLORS.paramPrimary}
                          strokeWidth={1.5}
                          strokeDasharray="4 3"
                          opacity={0.85}
                        />
                        {/* 弦心距辅助线 O1-M */}
                        <line
                          x1={center1Design.x}
                          y1={center1Design.y}
                          x2={midD.x}
                          y2={midD.y}
                          stroke={MATH_COLORS.paramSecondary}
                          strokeWidth={1.8}
                          strokeDasharray="3 2"
                          opacity={0.9}
                        />
                        {/* 垂足 M 处的直角标尺 */}
                        <polyline
                          points={`${corner1.x},${corner1.y} ${corner2.x},${corner2.y} ${corner3.x},${corner3.y}`}
                          fill="none"
                          stroke={MATH_COLORS.paramTertiary}
                          strokeWidth={1.5}
                        />
                      </g>
                    );
                  })()}
                </>
              )}

              {/* 两个交点 A 与 B */}
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

          {/* 相切时的单交点 T */}
          {res.intersections.length === 1 && (
            <>
              {(() => {
                const tPt = res.intersections[0];
                const tDesign = mathToDesign(tPt.x, tPt.y, scale);

                // 在切点处画直角标尺
                const dx = center2Design.x - center1Design.x;
                const dy = center2Design.y - center1Design.y;
                const lenD = Math.hypot(dx, dy) || 1;
                const ux = dx / lenD;
                const uy = dy / lenD;
                const vx = -uy;
                const vy = ux;
                const s = 9;

                const c1 = { x: tDesign.x - s * ux, y: tDesign.y - s * uy };
                const c2 = {
                  x: tDesign.x - s * ux + s * vx,
                  y: tDesign.y - s * uy + s * vy,
                };
                const c3 = { x: tDesign.x + s * vx, y: tDesign.y + s * vy };

                return (
                  <polyline
                    points={`${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y}`}
                    fill="none"
                    stroke={MATH_COLORS.paramSecondary}
                    strokeWidth={1.5}
                  />
                );
              })()}
              <MathPoint
                x={res.intersections[0].x}
                y={res.intersections[0].y}
                scale={scale}
                fontScale={fontScale}
                label="T"
                color={MATH_COLORS.paramSecondary}
              />
            </>
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

      {/* 7. 圆心交互控制点 O1 与 O2 (纯字母标签，坐标归位右屏看板) */}
      <InteractivePoint
        cx={x1}
        cy={y1}
        scale={scale}
        vp={vp}
        fontScale={fontScale}
        label="O₁"
        color={MATH_COLORS.paramPrimary}
        onDrag={(mathPt) => onCenter1Drag?.(mathPt.x, mathPt.y)}
      />

      <InteractivePoint
        cx={x2}
        cy={y2}
        scale={scale}
        vp={vp}
        fontScale={fontScale}
        label="O₂"
        color={MATH_COLORS.paramSecondary}
        onDrag={(mathPt) => onCenter2Drag?.(mathPt.x, mathPt.y)}
      />
    </g>
  );
};
