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
  onDragVertexA?: (pt: Point2D) => void;
  onDragVertexB?: (pt: Point2D) => void;
}

export const TriangleExtremaScene: React.FC<TriangleExtremaSceneProps> = ({
  state,
  studyMode,
  scale,
  vp,
  fontScale,
  onDragVertexA,
  onDragVertexB,
}) => {
  const {
    vertices,
    sides,
    circumcircle,
    apolloniusCircle,
    polarization,
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

  return (
    <g>
      {/* 1. 坐标系网格与轴 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 2. 轨迹背景图层 */}
      {/* A. 外接圆 (angle-transform 与 side-ineq 模式) */}
      {(studyMode === "angle-transform" || studyMode === "side-ineq") && (
        <g id="circumcircle-layer">
          <circle
            cx={posCircumCenter.x}
            cy={posCircumCenter.y}
            r={radiusPx}
            fill={withAlpha(MATH_COLORS.primary, 0.05)}
            stroke={withAlpha(MATH_COLORS.primary, 0.4)}
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
            x={posCircumCenter.x + 8}
            y={posCircumCenter.y - 8}
            fill={MATH_COLORS.primary}
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            O (R = {circumcircle.radius.toFixed(2)})
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
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.06)}
            stroke={MATH_COLORS.paramPrimary}
            strokeDasharray="5 4"
            strokeWidth={2}
          />
          {/* 圆心与轨迹标注 */}
          <circle
            cx={apCenter.x}
            cy={apCenter.y}
            r={3}
            fill={MATH_COLORS.paramPrimary}
          />
          <text
            x={apCenter.x}
            y={apCenter.y + fontScale(14)}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(11)}
            textAnchor="middle"
            fontWeight="bold"
          >
            阿氏圆心 O_A({apolloniusCircle.center.x.toFixed(1)}, 0)，半径 R ={" "}
            {apolloniusCircle.radius.toFixed(2)}
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
            fontSize={fontScale(11)}
            fontWeight="bold"
          >
            最大高 h = {apolloniusCircle.radius.toFixed(2)}
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
            strokeWidth={2}
          />
          <text
            x={posM.x}
            y={posM.y - polarization.medianLength * scale.scaleX - 6}
            fill={MATH_COLORS.paramTertiary}
            fontSize={fontScale(11)}
            textAnchor="middle"
            fontWeight="bold"
          >
            中线轨迹圆 |AM| = {polarization.medianLength.toFixed(1)}
          </text>
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
        strokeWidth={1.5}
      />
      {/* 高度 h_a 标签 */}
      <text
        x={posH.x + 5}
        y={(posA.y + posH.y) / 2}
        fill={CANVAS_COLORS.labelTextLight}
        fontSize={fontScale(10)}
      >
        h = {vertices.A.y.toFixed(2)}
      </text>

      {/* 中线 AM (polarization/apollonius 模式) */}
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
            y={posM.y + fontScale(15)}
            fill={MATH_COLORS.paramTertiary}
            fontSize={fontScale(11)}
            textAnchor="middle"
            fontWeight="bold"
          >
            M (0,0)
          </text>
        </g>
      )}

      {/* 4. 三角形主体边与阴影填充 */}
      <polygon
        points={`${posA.x},${posA.y} ${posB.x},${posB.y} ${posC.x},${posC.y}`}
        fill={withAlpha(MATH_COLORS.primary, 0.12)}
        stroke="none"
      />

      {/* 边 a (BC) - 底边: paramPrimary 色彩 */}
      <line
        x1={posB.x}
        y1={posB.y}
        x2={posC.x}
        y2={posC.y}
        stroke={MATH_COLORS.paramPrimary}
        strokeWidth={3.5}
      />

      {/* 边 b (AC) */}
      <line
        x1={posA.x}
        y1={posA.y}
        x2={posC.x}
        y2={posC.y}
        stroke={MATH_COLORS.paramSecondary}
        strokeWidth={2.5}
      />

      {/* 边 c (AB) */}
      <line
        x1={posA.x}
        y1={posA.y}
        x2={posB.x}
        y2={posB.y}
        stroke={MATH_COLORS.paramTertiary}
        strokeWidth={2.5}
      />

      {/* 5. 边长标签 */}
      <text
        x={(posB.x + posC.x) / 2}
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
        y={(posA.y + posC.y) / 2}
        fill={MATH_COLORS.paramSecondary}
        fontSize={fontScale(12)}
        fontWeight="bold"
      >
        b = {sides.b.toFixed(2)}
      </text>
      <text
        x={(posA.x + posB.x) / 2 - 25}
        y={(posA.y + posB.y) / 2}
        fill={MATH_COLORS.paramTertiary}
        fontSize={fontScale(12)}
        fontWeight="bold"
      >
        c = {sides.c.toFixed(2)}
      </text>

      {/* 6. 顶点交互与标注 */}
      {/* 顶点 C: 固定点 */}
      <circle cx={posC.x} cy={posC.y} r={5} fill={MATH_COLORS.paramPrimary} />
      <text
        x={posC.x + 8}
        y={posC.y + 4}
        fill={CANVAS_COLORS.labelText}
        fontSize={fontScale(13)}
        fontWeight="bold"
      >
        C ({state.angles.C.toFixed(0)}°)
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
          label={`B (${state.angles.B.toFixed(0)}°)`}
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
            r={5}
            fill={MATH_COLORS.paramPrimary}
          />
          <text
            x={posB.x - 22}
            y={posB.y + 4}
            fill={CANVAS_COLORS.labelText}
            fontSize={fontScale(13)}
            fontWeight="bold"
          >
            B ({state.angles.B.toFixed(0)}°)
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
        label={`A (${state.angles.A.toFixed(0)}°)`}
        onDrag={(mathPos) => {
          if (onDragVertexA) {
            onDragVertexA(mathPos);
          }
        }}
      />
    </g>
  );
};
