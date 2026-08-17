import React from "react";
import { CoordinateGrid, InteractivePoint } from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import type { TriangleExtremaState, Point2D } from "@/math/triangleExtrema";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";

interface TriangleExtremaSceneProps {
  state: TriangleExtremaState;
  studyMode: "angle-transform" | "side-ineq" | "apollonius" | "polarization";
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (size: number) => number;
  isAcuteOnly?: boolean;
  onDragVertexA?: (pt: Point2D) => void;
  onDragVertexB?: (pt: Point2D) => void;
}

export const TriangleExtremaScene: React.FC<TriangleExtremaSceneProps> = ({
  state,
  studyMode,
  scale,
  vp,
  fontScale,
  isAcuteOnly = false,
  onDragVertexA,
  onDragVertexB,
}) => {
  const {
    vertices,
    sides,
    circumcircle,
    inscribed,
    apolloniusCircle,
    polarization,
    acuteRange,
    isValid,
    warning,
  } = state;

  if (!isValid) {
    const defaultCenter = mathToDesign(0, 0, scale);
    return (
      <g>
        <CoordinateGrid scale={scale} fontScale={fontScale} />
        <text
          x={defaultCenter.x}
          y={defaultCenter.y - 20}
          fill={MATH_COLORS.paramPrimary}
          fontSize={fontScale(16)}
          fontWeight="bold"
          textAnchor="middle"
        >
          ⚠️ {warning ?? "图形退化，无法构成有效三角形"}
        </text>
      </g>
    );
  }

  // 坐标投射
  const posA = mathToDesign(vertices.A.x, vertices.A.y, scale);
  const posB = mathToDesign(vertices.B.x, vertices.B.y, scale);
  const posC = mathToDesign(vertices.C.x, vertices.C.y, scale);
  const posM = mathToDesign(0, 0, scale); // 底边中点

  // 外接圆投射
  const posCircumCenter = mathToDesign(
    circumcircle.center.x,
    circumcircle.center.y,
    scale,
  );
  const radiusPx = circumcircle.radius * scale.scaleX;

  // 阿波罗尼斯圆投射（如有）
  const apCenter = apolloniusCircle
    ? mathToDesign(apolloniusCircle.center.x, apolloniusCircle.center.y, scale)
    : null;
  const apRadiusPx = apolloniusCircle
    ? apolloniusCircle.radius * scale.scaleX
    : 0;

  // 顶点 A 在底边上的垂足 H
  const posH = mathToDesign(vertices.A.x, 0, scale);

  // 外接圆最高点（等腰三角形顶点）
  const maxVertexA = {
    x: 0,
    y: circumcircle.center.y + circumcircle.radius,
  };
  const posMaxA = mathToDesign(maxVertexA.x, maxVertexA.y, scale);

  return (
    <g>
      {/* 1. 坐标系网格与轴 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 2. 轨迹背景图层 */}
      {/* A. 外接圆 (angle-transform 与 side-ineq 模式) */}
      {(studyMode === "angle-transform" || studyMode === "side-ineq") && (
        <g id="circumcircle-layer">
          {/* 外接圆底圆 */}
          <circle
            cx={posCircumCenter.x}
            cy={posCircumCenter.y}
            r={radiusPx}
            fill={withAlpha(MATH_COLORS.primary, 0.04)}
            stroke={withAlpha(MATH_COLORS.primary, 0.35)}
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          {/* 圆心标记 */}
          <circle
            cx={posCircumCenter.x}
            cy={posCircumCenter.y}
            r={3}
            fill={MATH_COLORS.primary}
          />
          <text
            x={posCircumCenter.x + 6}
            y={posCircumCenter.y - 6}
            fill={MATH_COLORS.primary}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            O
          </text>

          {/* 最高点极值包络线 (水平切线) */}
          <line
            x1={posCircumCenter.x - radiusPx - 20}
            y1={posMaxA.y}
            x2={posCircumCenter.x + radiusPx + 20}
            y2={posMaxA.y}
            stroke={MATH_COLORS.paramPrimary}
            strokeDasharray="4 4"
            strokeWidth={1.2}
            opacity={0.7}
          />
          {/* 等腰对称轴虚线 */}
          <line
            x1={posMaxA.x}
            y1={posMaxA.y}
            x2={posM.x}
            y2={posM.y}
            stroke={CANVAS_COLORS.axis}
            strokeDasharray="3 3"
            strokeWidth={1.2}
          />
          <text
            x={posMaxA.x + 6}
            y={posMaxA.y - 6}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(10)}
            fontWeight="bold"
          >
            h
            <tspan dy={fontScale(2)} fontSize={fontScale(8)}>
              max
            </tspan>
          </text>
        </g>
      )}

      {/* B. 阿波罗尼斯圆 (apollonius 模式) */}
      {studyMode === "apollonius" && apCenter && apolloniusCircle && (
        <g id="apollonius-circle-layer">
          <circle
            cx={apCenter.x}
            cy={apCenter.y}
            r={apRadiusPx}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.05)}
            stroke={MATH_COLORS.paramPrimary}
            strokeDasharray="5 4"
            strokeWidth={1.8}
          />
          <circle
            cx={apCenter.x}
            cy={apCenter.y}
            r={3}
            fill={MATH_COLORS.paramPrimary}
          />
          <text
            x={apCenter.x + 6}
            y={apCenter.y - 6}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            O
            <tspan dy={fontScale(2)} fontSize={fontScale(8)}>
              A
            </tspan>
          </text>
          {/* 最高点指示虚线 */}
          <line
            x1={apCenter.x}
            y1={apCenter.y}
            x2={apCenter.x}
            y2={apCenter.y - apRadiusPx}
            stroke={MATH_COLORS.paramPrimary}
            strokeDasharray="3 3"
          />
          <text
            x={apCenter.x + 6}
            y={apCenter.y - apRadiusPx - 6}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(10)}
            fontWeight="bold"
          >
            h
            <tspan dy={fontScale(2)} fontSize={fontScale(8)}>
              max
            </tspan>
          </text>
        </g>
      )}

      {/* C. 极化恒等式中线圆轨迹 (polarization 模式) */}
      {studyMode === "polarization" && polarization && (
        <g id="polarization-circle-layer">
          <circle
            cx={posM.x}
            cy={posM.y}
            r={polarization.medianLength * scale.scaleX}
            fill={withAlpha(MATH_COLORS.paramTertiary, 0.05)}
            stroke={MATH_COLORS.paramTertiary}
            strokeDasharray="4 4"
            strokeWidth={1.8}
          />
        </g>
      )}

      {/* 3. 几何辅助线 */}
      {/* 垂线 AH */}
      <line
        x1={posA.x}
        y1={posA.y}
        x2={posH.x}
        y2={posH.y}
        stroke={CANVAS_COLORS.axis}
        strokeDasharray="3 3"
        strokeWidth={1.2}
      />
      <text
        x={posH.x + 4}
        y={(posA.y + posH.y) / 2}
        fill={CANVAS_COLORS.labelTextLight}
        fontSize={fontScale(10)}
      >
        h
      </text>

      {/* 中线 AM */}
      {(studyMode === "polarization" || studyMode === "apollonius") && (
        <g>
          <line
            x1={posA.x}
            y1={posA.y}
            x2={posM.x}
            y2={posM.y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={2}
          />
          <circle
            cx={posM.x}
            cy={posM.y}
            r={3}
            fill={MATH_COLORS.paramTertiary}
          />
          <text
            x={posM.x}
            y={posM.y + fontScale(14)}
            fill={MATH_COLORS.paramTertiary}
            fontSize={fontScale(11)}
            textAnchor="middle"
            fontWeight="bold"
          >
            M
          </text>
        </g>
      )}

      {/* 内切圆 (当角化边/均值模式有效时) */}
      {inscribed &&
        (studyMode === "angle-transform" || studyMode === "side-ineq") && (
          <g id="inscribed-circle-layer">
            {/* 锐角三角形约束提示 */}
            {isAcuteOnly && acuteRange && !state.isAcute && (
              <text
                x={posMaxA.x}
                y={posMaxA.y - fontScale(18)}
                fill={MATH_COLORS.paramPrimary}
                fontSize={fontScale(11)}
                fontWeight="bold"
                textAnchor="middle"
              >
                ⚠️ 非锐角状态 (角 B ∈ ({acuteRange.minAngleB.toFixed(0)}°,{" "}
                {acuteRange.maxAngleB.toFixed(0)}°))
              </text>
            )}

            {(() => {
              const posIncenter = mathToDesign(
                inscribed.incenter.x,
                inscribed.incenter.y,
                scale,
              );
              const inradiusPx = inscribed.inradius * scale.scaleX;
              return (
                <>
                  <circle
                    cx={posIncenter.x}
                    cy={posIncenter.y}
                    r={inradiusPx}
                    fill={withAlpha(MATH_COLORS.paramTertiary, 0.08)}
                    stroke={MATH_COLORS.paramTertiary}
                    strokeWidth={1.5}
                  />
                  <circle
                    cx={posIncenter.x}
                    cy={posIncenter.y}
                    r={2.5}
                    fill={MATH_COLORS.paramTertiary}
                  />
                  <text
                    x={posIncenter.x + 5}
                    y={posIncenter.y - 4}
                    fill={MATH_COLORS.paramTertiary}
                    fontSize={fontScale(10)}
                    fontWeight="bold"
                  >
                    I
                  </text>
                </>
              );
            })()}
          </g>
        )}

      {/* 4. 三角形主体边与阴影填充 */}
      <polygon
        points={`${posA.x},${posA.y} ${posB.x},${posB.y} ${posC.x},${posC.y}`}
        fill={withAlpha(MATH_COLORS.primary, 0.12)}
        stroke="none"
      />

      {/* 边 a (BC) - 底边: paramPrimary (红) */}
      <line
        x1={posB.x}
        y1={posB.y}
        x2={posC.x}
        y2={posC.y}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={3.5}
      />

      {/* 边 b (AC) - paramSecondary (橙) */}
      <line
        x1={posA.x}
        y1={posA.y}
        x2={posC.x}
        y2={posC.y}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2.5}
      />

      {/* 边 c (AB) - paramTertiary (绿) */}
      <line
        x1={posA.x}
        y1={posA.y}
        x2={posB.x}
        y2={posB.y}
        stroke={MATH_COLORS.paramTertiary}
        strokeWidth={2.5}
      />

      {/* 5. 边长标签 (位置外扩，避免与中线/内切圆重叠) */}
      <text
        x={
          (posB.x + posC.x) / 2 +
          (studyMode === "polarization" || studyMode === "apollonius" ? 22 : 0)
        }
        y={posB.y + fontScale(16)}
        fill={MATH_COLORS.paramPrimary}
        fontSize={fontScale(12)}
        fontWeight="bold"
        textAnchor="middle"
      >
        a = {sides.a.toFixed(1)}
      </text>
      <text
        x={(posA.x + posC.x) / 2 + 10}
        y={(posA.y + posC.y) / 2 - 4}
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(12)}
        fontWeight="bold"
      >
        b = {sides.b.toFixed(2)}
      </text>
      <text
        x={(posA.x + posB.x) / 2 - 24}
        y={(posA.y + posB.y) / 2 - 4}
        fill={MATH_COLORS.paramTertiary}
        fontSize={fontScale(12)}
        fontWeight="bold"
      >
        c = {sides.c.toFixed(2)}
      </text>

      {/* 6. 顶点交互与标注 (纯字母无冗余，外向排布) */}
      {/* 顶点 C: 固定点 */}
      <circle cx={posC.x} cy={posC.y} r={4.5} fill={MATH_COLORS.paramPrimary} />
      <text
        x={posC.x + 8}
        y={posC.y + 4}
        fill={CANVAS_COLORS.labelText}
        fontSize={fontScale(13)}
        fontWeight="bold"
      >
        C
      </text>

      {/* 顶点 B: 静态或支持拖拽 */}
      {studyMode === "angle-transform" ? (
        <InteractivePoint
          cx={vertices.B.x}
          cy={vertices.B.y}
          scale={scale}
          vp={vp}
          fontScale={fontScale}
          color={MATH_COLORS.paramSecondary}
          label="B"
          onDrag={(mathPos) => {
            if (onDragVertexB) {
              onDragVertexB(mathPos);
            }
          }}
        />
      ) : (
        <g>
          <circle
            cx={posB.x}
            cy={posB.y}
            r={4.5}
            fill={MATH_COLORS.paramPrimary}
          />
          <text
            x={posB.x - 16}
            y={posB.y + 4}
            fill={CANVAS_COLORS.labelText}
            fontSize={fontScale(13)}
            fontWeight="bold"
          >
            B
          </text>
        </g>
      )}

      {/* 顶点 A: 交互控制点 */}
      <InteractivePoint
        cx={vertices.A.x}
        cy={vertices.A.y}
        scale={scale}
        vp={vp}
        fontScale={fontScale}
        color={MATH_COLORS.paramPrimary}
        label="A"
        onDrag={(mathPos) => {
          if (onDragVertexA) {
            onDragVertexA(mathPos);
          }
        }}
      />
    </g>
  );
};
