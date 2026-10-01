import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { CoordinateGrid, InteractivePoint, MathPoint } from "@/components/Math";
import { MATH_COLORS, CANVAS_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import {
  solveStandardCircle,
  solveGeneralCircle,
  solveThreePointsCircle,
  type CircleStudyMode,
} from "@/math/circleEquation";
import { circleEquationParamMeta } from "@/data/registries/circleEquation";
import { paramDragBounds } from "@/utils/paramClamp";

interface CircleEquationSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  onInteractionStart?: () => void;
  fontScale?: (v: number) => number;
  studyMode: CircleStudyMode;
}

export const CircleEquationScene: React.FC<CircleEquationSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  onInteractionStart,
  fontScale = (v) => v,
  studyMode,
}) => {
  // ─────────────────────────────────────────────────────────────
  // 模式 1：标准方程与点圆位置关系
  // ─────────────────────────────────────────────────────────────
  const standardRes = useMemo(() => {
    if (studyMode !== "standard") return null;
    return solveStandardCircle(
      params.a ?? 0,
      params.b ?? 0,
      params.r ?? 3,
      params.px ?? 4,
      params.py ?? 3,
    );
  }, [studyMode, params.a, params.b, params.r, params.px, params.py]);

  // ─────────────────────────────────────────────────────────────
  // 模式 2：一般方程与配方互化
  // ─────────────────────────────────────────────────────────────
  const generalRes = useMemo(() => {
    if (studyMode !== "general") return null;
    return solveGeneralCircle(params.D ?? -4, params.E ?? 6, params.F ?? -3);
  }, [studyMode, params.D, params.E, params.F]);

  // ─────────────────────────────────────────────────────────────
  // 模式 3：待定系数法（已知三点）
  // ─────────────────────────────────────────────────────────────
  const threePointsRes = useMemo(() => {
    if (studyMode !== "threePoints") return null;
    return solveThreePointsCircle(
      { x: params.x1 ?? 2, y: params.y1 ?? 1 },
      { x: params.x2 ?? -2, y: params.y2 ?? 3 },
      { x: params.x3 ?? 0, y: params.y3 ?? -3 },
    );
  }, [
    studyMode,
    params.x1,
    params.y1,
    params.x2,
    params.y2,
    params.x3,
    params.y3,
  ]);

  // 拖拽钳制 (SSOT)：左屏声明域 ∩ 中屏可见视口，逐点展开到 <InteractivePoint>
  const dragBounds = (xMetaKey: string, yMetaKey: string) =>
    paramDragBounds(
      circleEquationParamMeta[xMetaKey],
      circleEquationParamMeta[yMetaKey],
      scale,
    );

  return (
    <g>
      {/* 1. 坐标轴与网格 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* ───────────────────────────────────────────────────────── */}
      {/* 模式 1: standard */}
      {/* ───────────────────────────────────────────────────────── */}
      {studyMode === "standard" &&
        standardRes &&
        standardRes.validity === "valid" && (
          <g>
            {/* 圆主体 */}
            {(() => {
              const centerD = mathToDesign(
                standardRes.center.x,
                standardRes.center.y,
                scale,
              );
              const radiusD = standardRes.radius * scale.scaleX;
              return (
                <circle
                  cx={centerD.x}
                  cy={centerD.y}
                  r={radiusD}
                  fill={withAlpha(MATH_COLORS.paramPrimary, 0.06)}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={2.5}
                />
              );
            })()}

            {/* 半径线段 (从圆心向右) */}
            {(() => {
              const cD = mathToDesign(
                standardRes.center.x,
                standardRes.center.y,
                scale,
              );
              const rEdgeD = mathToDesign(
                standardRes.center.x + standardRes.radius,
                standardRes.center.y,
                scale,
              );
              return (
                <>
                  <line
                    x1={cD.x}
                    y1={cD.y}
                    x2={rEdgeD.x}
                    y2={rEdgeD.y}
                    stroke={MATH_COLORS.paramTertiary}
                    strokeWidth={2}
                    strokeDasharray="4 3"
                  />
                  <text
                    x={(cD.x + rEdgeD.x) / 2}
                    y={cD.y - 8}
                    textAnchor="middle"
                    fill={MATH_COLORS.paramTertiary}
                    stroke={CANVAS_COLORS.white}
                    strokeWidth={3}
                    paintOrder="stroke fill"
                    fontSize={fontScale(12)}
                    fontWeight="700"
                  >
                    r = {standardRes.radius}
                  </text>
                </>
              );
            })()}

            {/* 动点 P 到圆心 C 的指示线段 */}
            {(() => {
              const cD = mathToDesign(
                standardRes.center.x,
                standardRes.center.y,
                scale,
              );
              const pD = mathToDesign(
                standardRes.pointP.x,
                standardRes.pointP.y,
                scale,
              );
              const strokeColor =
                standardRes.positionRelation === "outside"
                  ? MATH_COLORS.paramPrimary
                  : standardRes.positionRelation === "inside"
                    ? MATH_COLORS.paramSecondary
                    : MATH_COLORS.paramTertiary;
              return (
                <line
                  x1={cD.x}
                  y1={cD.y}
                  x2={pD.x}
                  y2={pD.y}
                  stroke={strokeColor}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
              );
            })()}

            {/* 圆心 C 可拖拽 */}
            <InteractivePoint
              cx={standardRes.center.x}
              cy={standardRes.center.y}
              scale={scale}
              vp={vp}
              {...dragBounds("a", "b")}
              color={MATH_COLORS.paramPrimary}
              fontScale={fontScale}
              label="C"
              onDrag={({ x, y }) => {
                onInteractionStart?.();
                onParamChange("a", Number(x.toFixed(1)));
                onParamChange("b", Number(y.toFixed(1)));
              }}
            />

            {/* 探究点 P 可拖拽 */}
            <InteractivePoint
              cx={standardRes.pointP.x}
              cy={standardRes.pointP.y}
              scale={scale}
              vp={vp}
              {...dragBounds("px", "py")}
              color={MATH_COLORS.paramSecondary}
              fontScale={fontScale}
              label="P"
              onDrag={({ x, y }) => {
                onInteractionStart?.();
                onParamChange("px", Number(x.toFixed(1)));
                onParamChange("py", Number(y.toFixed(1)));
              }}
            />
          </g>
        )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* 模式 2: general */}
      {/* ───────────────────────────────────────────────────────── */}
      {studyMode === "general" && generalRes && (
        <g>
          {generalRes.validity === "valid" && (
            <>
              {(() => {
                const cD = mathToDesign(
                  generalRes.center.x,
                  generalRes.center.y,
                  scale,
                );
                const rD = generalRes.radius * scale.scaleX;
                return (
                  <>
                    <circle
                      cx={cD.x}
                      cy={cD.y}
                      r={rD}
                      fill={withAlpha(MATH_COLORS.paramSecondary, 0.08)}
                      stroke={MATH_COLORS.paramSecondary}
                      strokeWidth={2.5}
                    />
                    <MathPoint
                      cx={generalRes.center.x}
                      cy={generalRes.center.y}
                      scale={scale}
                      color={MATH_COLORS.paramPrimary}
                      label="C"
                      fontScale={fontScale}
                    />
                  </>
                );
              })()}
            </>
          )}

          {generalRes.validity === "degenerate_point" && (
            <MathPoint
              cx={generalRes.center.x}
              cy={generalRes.center.y}
              scale={scale}
              color={MATH_COLORS.degeneracy}
              label="单点(退化)"
              fontScale={fontScale}
            />
          )}

          {generalRes.validity === "no_graph" && (
            <text
              x={scale.originX}
              y={scale.originY}
              textAnchor="middle"
              fill={MATH_COLORS.degeneracy}
              stroke={CANVAS_COLORS.white}
              strokeWidth={4}
              paintOrder="stroke fill"
              fontSize={fontScale(18)}
              fontWeight="700"
            >
              判别式 Δ_c &lt; 0 (无实数几何图形)
            </text>
          )}
        </g>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* 模式 3: threePoints */}
      {/* ───────────────────────────────────────────────────────── */}
      {studyMode === "threePoints" && threePointsRes && (
        <g>
          {/* 三角形 ABC 实体 */}
          {(() => {
            const pAD = mathToDesign(
              threePointsRes.pointA.x,
              threePointsRes.pointA.y,
              scale,
            );
            const pBD = mathToDesign(
              threePointsRes.pointB.x,
              threePointsRes.pointB.y,
              scale,
            );
            const pCD = mathToDesign(
              threePointsRes.pointC.x,
              threePointsRes.pointC.y,
              scale,
            );

            return (
              <polygon
                points={`${pAD.x},${pAD.y} ${pBD.x},${pBD.y} ${pCD.x},${pCD.y}`}
                fill={withAlpha(MATH_COLORS.paramTertiary, 0.08)}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={2}
              />
            );
          })()}

          {/* 外接圆 */}
          {!threePointsRes.isCollinear &&
            threePointsRes.center &&
            threePointsRes.radius && (
              <>
                {(() => {
                  const cD = mathToDesign(
                    threePointsRes.center.x,
                    threePointsRes.center.y,
                    scale,
                  );
                  const rD = threePointsRes.radius * scale.scaleX;
                  return (
                    <>
                      <circle
                        cx={cD.x}
                        cy={cD.y}
                        r={rD}
                        fill="none"
                        stroke={MATH_COLORS.paramPrimary}
                        strokeWidth={2.5}
                        strokeDasharray="6 3"
                      />
                      <MathPoint
                        cx={threePointsRes.center.x}
                        cy={threePointsRes.center.y}
                        scale={scale}
                        color={MATH_COLORS.paramPrimary}
                        label="O'"
                        fontScale={fontScale}
                      />
                    </>
                  );
                })()}
              </>
            )}

          {/* 顶点 A, B, C 可交互拖拽 */}
          <InteractivePoint
            cx={threePointsRes.pointA.x}
            cy={threePointsRes.pointA.y}
            scale={scale}
            vp={vp}
            {...dragBounds("x1", "y1")}
            color={MATH_COLORS.accent}
            label="A"
            fontScale={fontScale}
            onDrag={({ x, y }) => {
              onInteractionStart?.();
              onParamChange("x1", Number(x.toFixed(1)));
              onParamChange("y1", Number(y.toFixed(1)));
            }}
          />
          <InteractivePoint
            cx={threePointsRes.pointB.x}
            cy={threePointsRes.pointB.y}
            scale={scale}
            vp={vp}
            {...dragBounds("x2", "y2")}
            color={MATH_COLORS.accent}
            label="B"
            fontScale={fontScale}
            onDrag={({ x, y }) => {
              onInteractionStart?.();
              onParamChange("x2", Number(x.toFixed(1)));
              onParamChange("y2", Number(y.toFixed(1)));
            }}
          />
          <InteractivePoint
            cx={threePointsRes.pointC.x}
            cy={threePointsRes.pointC.y}
            scale={scale}
            vp={vp}
            {...dragBounds("x3", "y3")}
            color={MATH_COLORS.accent}
            label="C"
            fontScale={fontScale}
            onDrag={({ x, y }) => {
              onInteractionStart?.();
              onParamChange("x3", Number(x.toFixed(1)));
              onParamChange("y3", Number(y.toFixed(1)));
            }}
          />
        </g>
      )}
    </g>
  );
};
