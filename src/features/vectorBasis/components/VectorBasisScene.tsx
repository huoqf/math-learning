import React from "react";
import {
  CoordinateGrid,
  VectorArrow,
  InteractivePoint,
  MathPoint,
} from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks";
import type { ViewportInfo } from "@/utils/useViewport";
import { computeVectorBasis, type VectorBasisInput } from "@/math/vectorBasis";

// 计算垂直于向量方向的屏幕法向偏移量 (彻底避免共线向量标签相撞)
function getNormalOffset(
  dx: number,
  dy: number,
  distance: number,
): [number, number] {
  const len = Math.hypot(dx, dy);
  if (len < 1e-4) return [0, -distance];
  // 屏幕坐标系下数学向量 (dx, dy) 映射到屏幕矢量为 (dx, -dy)
  // 其垂直法向量为 (dy, dx)，乘以距离即可得到严格垂直于箭身的偏移
  const nx = dy / len;
  const ny = dx / len;
  return [nx * distance, ny * distance];
}

interface VectorBasisSceneProps {
  params: VectorBasisInput;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale: (size: number) => number;
  studyMode: "basisDecomp" | "orthogonal" | "collinear" | "triangleGeom";
}

export const VectorBasisScene: React.FC<VectorBasisSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
}) => {
  const mathRes = computeVectorBasis(params);

  const {
    e1,
    e2,
    target,
    isCollinear,
    lambda,
    mu,
    p1,
    p2,
    orthoE1,
    orthoE2,
    orthoLambda,
    orthoMu,
    sumCoeff,
    collinearPoint,
    eqLineStart,
    eqLineEnd,
    midpoint,
    centroid,
    divisionPoint,
  } = mathRes;

  const originDesign = mathToDesign(0, 0, scale);
  const e1Design = mathToDesign(e1.x, e1.y, scale);
  const e2Design = mathToDesign(e2.x, e2.y, scale);
  const targetDesign = mathToDesign(target.x, target.y, scale);

  const p1Design = mathToDesign(p1.x, p1.y, scale);
  const p2Design = mathToDesign(p2.x, p2.y, scale);

  // 拖拽 e1 终点
  const handleDragE1 = (pt: { x: number; y: number }) => {
    onParamChange("e1x", Math.round(pt.x * 2) / 2);
    onParamChange("e1y", Math.round(pt.y * 2) / 2);
  };

  // 拖拽 e2 终点
  const handleDragE2 = (pt: { x: number; y: number }) => {
    onParamChange("e2x", Math.round(pt.x * 2) / 2);
    onParamChange("e2y", Math.round(pt.y * 2) / 2);
  };

  // 拖拽 目标向量 a 终点
  const handleDragTarget = (pt: { x: number; y: number }) => {
    onParamChange("ax", Math.round(pt.x * 2) / 2);
    onParamChange("ay", Math.round(pt.y * 2) / 2);
  };

  // 拖拽三点共线模式下的合成点 P
  const handleDragCollinearPoint = (pt: { x: number; y: number }) => {
    const det = e1.x * e2.y - e1.y * e2.x;
    if (Math.abs(det) > 1e-4) {
      const x = (pt.x * e2.y - pt.y * e2.x) / det;
      const y = (e1.x * pt.y - e1.y * pt.x) / det;
      onParamChange("xCoeff", Math.round(x * 100) / 100);
      onParamChange("yCoeff", Math.round(y * 100) / 100);
    }
  };

  // 拖拽三角形分割点 P
  const handleDragDivisionPoint = (pt: { x: number; y: number }) => {
    const abX = e2.x - e1.x;
    const abY = e2.y - e1.y;
    const lenSq = abX * abX + abY * abY;
    if (lenSq > 1e-6) {
      const apX = pt.x - e1.x;
      const apY = pt.y - e1.y;
      const t = Math.max(0, Math.min(1, (apX * abX + apY * abY) / lenSq));
      onParamChange("ratioT", Math.round(t * 100) / 100);
    }
  };

  // 渲染斜网格（针对 basisDecomp 模式）
  const renderObliqueGrid = () => {
    if (isCollinear) return null;
    const lines: React.ReactNode[] = [];
    const gridRange = [-3, -2, -1, 0, 1, 2, 3];

    // 平行于 e1 的线族 (跨过 k*e2)
    gridRange.forEach((k) => {
      const start = mathToDesign(
        k * e2.x - 4 * e1.x,
        k * e2.y - 4 * e1.y,
        scale,
      );
      const end = mathToDesign(k * e2.x + 4 * e1.x, k * e2.y + 4 * e1.y, scale);
      lines.push(
        <line
          key={`grid-e1-${k}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={withAlpha(MATH_COLORS.paramSecondary, 0.15)}
          strokeDasharray="3 3"
          strokeWidth={1}
        />,
      );
    });

    // 平行于 e2 的线族 (跨过 k*e1)
    gridRange.forEach((k) => {
      const start = mathToDesign(
        k * e1.x - 4 * e2.x,
        k * e1.y - 4 * e2.y,
        scale,
      );
      const end = mathToDesign(k * e1.x + 4 * e2.x, k * e1.y + 4 * e2.y, scale);
      lines.push(
        <line
          key={`grid-e2-${k}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={withAlpha(MATH_COLORS.paramPrimary, 0.15)}
          strokeDasharray="3 3"
          strokeWidth={1}
        />,
      );
    });

    return <g className="oblique-grid">{lines}</g>;
  };

  return (
    <g className="vector-basis-scene">
      {/* 背景标准直角坐标系 (含原点 O 标注) */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* ==================== 1. 任意基底分解与斜网格模式 ==================== */}
      {studyMode === "basisDecomp" && (
        <g className="mode-basis-decomp">
          {/* 斜网格背景 */}
          {renderObliqueGrid()}

          {/* 平行四边形分解路径与虚线 */}
          {!isCollinear && (
            <>
              {/* P1 -> Target 虚线平行于 e2 */}
              <line
                x1={p1Design.x}
                y1={p1Design.y}
                x2={targetDesign.x}
                y2={targetDesign.y}
                stroke={withAlpha(MATH_COLORS.paramSecondary, 0.8)}
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              {/* P2 -> Target 虚线平行于 e1 */}
              <line
                x1={p2Design.x}
                y1={p2Design.y}
                x2={targetDesign.x}
                y2={targetDesign.y}
                stroke={withAlpha(MATH_COLORS.paramPrimary, 0.8)}
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />

              {/* 分量向量 λe1 (法向负偏移，与基底 e1 错开两侧) */}
              {Math.abs(lambda - 1) > 0.05 && (
                <VectorArrow
                  from={[0, 0]}
                  to={[p1.x, p1.y]}
                  scale={scale}
                  color={withAlpha(MATH_COLORS.paramPrimary, 0.85)}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  label="λe₁"
                  labelOffset={getNormalOffset(e1.x, e1.y, -14)}
                  fontScale={fontScale}
                />
              )}

              {/* 分量向量 μe2 (法向负偏移，与基底 e2 错开两侧) */}
              {Math.abs(mu - 1) > 0.05 && (
                <VectorArrow
                  from={[0, 0]}
                  to={[p2.x, p2.y]}
                  scale={scale}
                  color={withAlpha(MATH_COLORS.paramSecondary, 0.85)}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  label="μe₂"
                  labelOffset={getNormalOffset(e2.x, e2.y, -14)}
                  fontScale={fontScale}
                />
              )}
            </>
          )}

          {/* 基底向量 e1 (法向正偏移) */}
          <VectorArrow
            from={[0, 0]}
            to={[e1.x, e1.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={3}
            label="e₁"
            labelOffset={getNormalOffset(e1.x, e1.y, 14)}
            fontScale={fontScale}
          />

          {/* 基底向量 e2 (法向正偏移) */}
          <VectorArrow
            from={[0, 0]}
            to={[e2.x, e2.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={3}
            label="e₂"
            labelOffset={getNormalOffset(e2.x, e2.y, 14)}
            fontScale={fontScale}
          />

          {/* 目标向量 a */}
          <VectorArrow
            from={[0, 0]}
            to={[target.x, target.y]}
            scale={scale}
            color={MATH_COLORS.vectorResult}
            strokeWidth={3.5}
            label="a"
            fontScale={fontScale}
          />

          {/* 可拖拽控制点 */}
          <InteractivePoint
            cx={e1Design.x}
            cy={e1Design.y}
            color={MATH_COLORS.paramPrimary}
            scale={scale}
            vp={vp}
            onDrag={handleDragE1}
            fontScale={fontScale}
          />

          <InteractivePoint
            cx={e2Design.x}
            cy={e2Design.y}
            color={MATH_COLORS.paramSecondary}
            scale={scale}
            vp={vp}
            onDrag={handleDragE2}
            fontScale={fontScale}
          />

          <InteractivePoint
            cx={targetDesign.x}
            cy={targetDesign.y}
            color={MATH_COLORS.vectorResult}
            scale={scale}
            vp={vp}
            onDrag={handleDragTarget}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ==================== 2. 正交分解与旋转坐标系模式 ==================== */}
      {studyMode === "orthogonal" && (
        <g className="mode-orthogonal">
          {(() => {
            const orthoE1Pos: [number, number] = [
              orthoE1.x * 2.5,
              orthoE1.y * 2.5,
            ];
            const orthoE2Pos: [number, number] = [
              orthoE2.x * 2.5,
              orthoE2.y * 2.5,
            ];

            const proj1Math: [number, number] = [
              orthoE1.x * orthoLambda,
              orthoE1.y * orthoLambda,
            ];
            const proj2Math: [number, number] = [
              orthoE2.x * orthoMu,
              orthoE2.y * orthoMu,
            ];

            const projE1Pos = mathToDesign(proj1Math[0], proj1Math[1], scale);
            const projE2Pos = mathToDesign(proj2Math[0], proj2Math[1], scale);

            // 旋转坐标轴两端
            const axisXPos1 = mathToDesign(
              -orthoE1.x * 6,
              -orthoE1.y * 6,
              scale,
            );
            const axisXPos2 = mathToDesign(orthoE1.x * 6, orthoE1.y * 6, scale);
            const axisYPos1 = mathToDesign(
              -orthoE2.x * 5,
              -orthoE2.y * 5,
              scale,
            );
            const axisYPos2 = mathToDesign(orthoE2.x * 5, orthoE2.y * 5, scale);

            // 1. 原点直角标尺 (10px)
            const rtSize = 10;
            const u1x = orthoE1.x;
            const u1y = -orthoE1.y; // screen Y is inverted
            const u2x = orthoE2.x;
            const u2y = -orthoE2.y;

            const rtOriginP1 = {
              x: originDesign.x + u1x * rtSize,
              y: originDesign.y + u1y * rtSize,
            };
            const rtOriginP2 = {
              x: originDesign.x + (u1x + u2x) * rtSize,
              y: originDesign.y + (u1y + u2y) * rtSize,
            };
            const rtOriginP3 = {
              x: originDesign.x + u2x * rtSize,
              y: originDesign.y + u2y * rtSize,
            };

            // 2. 垂足 H1 (在 x' 轴上) 直角标尺
            const sgnMu = orthoMu >= 0 ? 1 : -1;
            const rtH1P1 = {
              x: projE1Pos.x - u1x * rtSize * (orthoLambda >= 0 ? 1 : -1),
              y: projE1Pos.y - u1y * rtSize * (orthoLambda >= 0 ? 1 : -1),
            };
            const rtH1P2 = {
              x:
                projE1Pos.x -
                u1x * rtSize * (orthoLambda >= 0 ? 1 : -1) +
                u2x * rtSize * sgnMu,
              y:
                projE1Pos.y -
                u1y * rtSize * (orthoLambda >= 0 ? 1 : -1) +
                u2y * rtSize * sgnMu,
            };
            const rtH1P3 = {
              x: projE1Pos.x + u2x * rtSize * sgnMu,
              y: projE1Pos.y + u2y * rtSize * sgnMu,
            };

            // 3. 垂足 H2 (在 y' 轴上) 直角标尺
            const sgnLam = orthoLambda >= 0 ? 1 : -1;
            const rtH2P1 = {
              x: projE2Pos.x - u2x * rtSize * (orthoMu >= 0 ? 1 : -1),
              y: projE2Pos.y - u2y * rtSize * (orthoMu >= 0 ? 1 : -1),
            };
            const rtH2P2 = {
              x:
                projE2Pos.x -
                u2x * rtSize * (orthoMu >= 0 ? 1 : -1) +
                u1x * rtSize * sgnLam,
              y:
                projE2Pos.y -
                u2x * rtSize * (orthoMu >= 0 ? 1 : -1) +
                u1y * rtSize * sgnLam,
            };
            const rtH2P3 = {
              x: projE2Pos.x + u1x * rtSize * sgnLam,
              y: projE2Pos.y + u1y * rtSize * sgnLam,
            };

            return (
              <>
                {/* 旋转后的正交坐标轴 x' 与 y' */}
                <line
                  x1={axisXPos1.x}
                  y1={axisXPos1.y}
                  x2={axisXPos2.x}
                  y2={axisXPos2.y}
                  stroke={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                />
                <text
                  x={axisXPos2.x + u1x * 12}
                  y={axisXPos2.y + u1y * 12}
                  fontSize={fontScale(12)}
                  fill={MATH_COLORS.paramPrimary}
                  fontWeight="bold"
                  fontStyle="italic"
                  textAnchor="middle"
                  dominantBaseline="central"
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={3}
                >
                  x'
                </text>

                <line
                  x1={axisYPos1.x}
                  y1={axisYPos1.y}
                  x2={axisYPos2.x}
                  y2={axisYPos2.y}
                  stroke={withAlpha(MATH_COLORS.paramSecondary, 0.4)}
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                />
                <text
                  x={axisYPos2.x + u2x * 12}
                  y={axisYPos2.y + u2y * 12}
                  fontSize={fontScale(12)}
                  fill={MATH_COLORS.paramSecondary}
                  fontWeight="bold"
                  fontStyle="italic"
                  textAnchor="middle"
                  dominantBaseline="central"
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={3}
                >
                  y'
                </text>

                {/* 原点正交直角标尺 */}
                <polyline
                  points={`${rtOriginP1.x},${rtOriginP1.y} ${rtOriginP2.x},${rtOriginP2.y} ${rtOriginP3.x},${rtOriginP3.y}`}
                  fill="none"
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={1.5}
                />

                {/* 垂直投影虚线 */}
                <line
                  x1={targetDesign.x}
                  y1={targetDesign.y}
                  x2={projE1Pos.x}
                  y2={projE1Pos.y}
                  stroke={MATH_COLORS.paramPrimary}
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                />
                <line
                  x1={targetDesign.x}
                  y1={targetDesign.y}
                  x2={projE2Pos.x}
                  y2={projE2Pos.y}
                  stroke={MATH_COLORS.paramSecondary}
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                />

                {/* 垂足直角标尺 */}
                <polyline
                  points={`${rtH1P1.x},${rtH1P1.y} ${rtH1P2.x},${rtH1P2.y} ${rtH1P3.x},${rtH1P3.y}`}
                  fill="none"
                  stroke={MATH_COLORS.paramPrimary}
                  strokeWidth={1.2}
                />
                <polyline
                  points={`${rtH2P1.x},${rtH2P1.y} ${rtH2P2.x},${rtH2P2.y} ${rtH2P3.x},${rtH2P3.y}`}
                  fill="none"
                  stroke={MATH_COLORS.paramSecondary}
                  strokeWidth={1.2}
                />

                {/* 正交向量分量 x'e1' 与 y'e2' */}
                <VectorArrow
                  from={[0, 0]}
                  to={proj1Math}
                  scale={scale}
                  color={MATH_COLORS.paramPrimary}
                  strokeWidth={2.5}
                  label="x'e₁'"
                  labelOffset={getNormalOffset(orthoE1.x, orthoE1.y, -14)}
                  fontScale={fontScale}
                />
                <VectorArrow
                  from={[0, 0]}
                  to={proj2Math}
                  scale={scale}
                  color={MATH_COLORS.paramSecondary}
                  strokeWidth={2.5}
                  label="y'e₂'"
                  labelOffset={getNormalOffset(orthoE2.x, orthoE2.y, -14)}
                  fontScale={fontScale}
                />

                {/* 正交单位基底 e1', e2' */}
                <VectorArrow
                  from={[0, 0]}
                  to={orthoE1Pos}
                  scale={scale}
                  color={MATH_COLORS.paramPrimary}
                  strokeWidth={3}
                  label="e₁'"
                  labelOffset={getNormalOffset(orthoE1.x, orthoE1.y, 14)}
                  fontScale={fontScale}
                />
                <VectorArrow
                  from={[0, 0]}
                  to={orthoE2Pos}
                  scale={scale}
                  color={MATH_COLORS.paramSecondary}
                  strokeWidth={3}
                  label="e₂'"
                  labelOffset={getNormalOffset(orthoE2.x, orthoE2.y, 14)}
                  fontScale={fontScale}
                />

                {/* 目标向量 a */}
                <VectorArrow
                  from={[0, 0]}
                  to={[target.x, target.y]}
                  scale={scale}
                  color={MATH_COLORS.vectorResult}
                  strokeWidth={3.5}
                  label="a"
                  fontScale={fontScale}
                />

                <InteractivePoint
                  cx={targetDesign.x}
                  cy={targetDesign.y}
                  color={MATH_COLORS.vectorResult}
                  scale={scale}
                  vp={vp}
                  onDrag={handleDragTarget}
                  fontScale={fontScale}
                />
              </>
            );
          })()}
        </g>
      )}

      {/* ==================== 3. 三点共线与等系数线模式 ==================== */}
      {studyMode === "collinear" && (
        <g className="mode-collinear">
          {/* 直线 AB (x+y=1 的基准共线参考线) */}
          {(() => {
            const lineP1 = mathToDesign(
              e1.x - (e2.x - e1.x) * 1.5,
              e1.y - (e2.y - e1.y) * 1.5,
              scale,
            );
            const lineP2 = mathToDesign(
              e2.x + (e2.x - e1.x) * 1.5,
              e2.y + (e2.y - e1.y) * 1.5,
              scale,
            );
            return (
              <g className="baseline-ab">
                <line
                  x1={lineP1.x}
                  y1={lineP1.y}
                  x2={lineP2.x}
                  y2={lineP2.y}
                  stroke={withAlpha(MATH_COLORS.limitPoint, 0.45)}
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                />
                <text
                  x={lineP2.x + 8}
                  y={lineP2.y}
                  fontSize={fontScale(11)}
                  fill={MATH_COLORS.limitPoint}
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={3}
                  dominantBaseline="central"
                >
                  直线 AB (x + y = 1)
                </text>
              </g>
            );
          })()}

          {/* 实时等系数线族 x+y = k */}
          {(() => {
            const startD = mathToDesign(eqLineStart.x, eqLineStart.y, scale);
            const endD = mathToDesign(eqLineEnd.x, eqLineEnd.y, scale);
            const isLineOne = Math.abs(sumCoeff - 1) < 1e-3;
            return (
              <g className="dynamic-isocline">
                <line
                  x1={startD.x}
                  y1={startD.y}
                  x2={endD.x}
                  y2={endD.y}
                  stroke={
                    isLineOne
                      ? MATH_COLORS.limitPoint
                      : MATH_COLORS.paramTertiary
                  }
                  strokeWidth={2.5}
                />
                <text
                  x={endD.x + 8}
                  y={endD.y}
                  fontSize={fontScale(11)}
                  fill={
                    isLineOne
                      ? MATH_COLORS.limitPoint
                      : MATH_COLORS.paramTertiary
                  }
                  fontWeight="bold"
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={3}
                  dominantBaseline="central"
                >
                  {isLineOne
                    ? "x + y = 1 (共线)"
                    : `等和线 (x + y = ${sumCoeff.toFixed(2)})`}
                </text>
              </g>
            );
          })()}

          {/* 基底向量 OA (A) 与 OB (B) */}
          <VectorArrow
            from={[0, 0]}
            to={[e1.x, e1.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            label="A"
            fontScale={fontScale}
          />
          <VectorArrow
            from={[0, 0]}
            to={[e2.x, e2.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
            label="B"
            fontScale={fontScale}
          />

          {/* 合成动点向量 OP (P) */}
          {(() => {
            const pDesign = mathToDesign(
              collinearPoint.x,
              collinearPoint.y,
              scale,
            );
            return (
              <>
                <VectorArrow
                  from={[0, 0]}
                  to={[collinearPoint.x, collinearPoint.y]}
                  scale={scale}
                  color={MATH_COLORS.paramTertiary}
                  strokeWidth={3.5}
                  label="P"
                  fontScale={fontScale}
                />

                <InteractivePoint
                  cx={pDesign.x}
                  cy={pDesign.y}
                  color={MATH_COLORS.paramTertiary}
                  scale={scale}
                  vp={vp}
                  onDrag={handleDragCollinearPoint}
                  fontScale={fontScale}
                />
              </>
            );
          })()}

          <InteractivePoint
            cx={e1Design.x}
            cy={e1Design.y}
            color={MATH_COLORS.paramPrimary}
            scale={scale}
            vp={vp}
            onDrag={handleDragE1}
            fontScale={fontScale}
          />
          <InteractivePoint
            cx={e2Design.x}
            cy={e2Design.y}
            color={MATH_COLORS.paramSecondary}
            scale={scale}
            vp={vp}
            onDrag={handleDragE2}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ==================== 4. 三角形爪子模型与几何应用 ==================== */}
      {studyMode === "triangleGeom" && (
        <g className="mode-triangle-geom">
          {/* 三角形 OAB 实体底面 */}
          <polygon
            points={`${originDesign.x},${originDesign.y} ${e1Design.x},${e1Design.y} ${e2Design.x},${e2Design.y}`}
            fill={withAlpha(MATH_COLORS.vectorPrimary, 0.08)}
            stroke={MATH_COLORS.vectorPrimary}
            strokeWidth={1.5}
          />

          {/* 底边 AB 线段 */}
          <line
            x1={e1Design.x}
            y1={e1Design.y}
            x2={e2Design.x}
            y2={e2Design.y}
            stroke={MATH_COLORS.vectorPrimary}
            strokeWidth={1.5}
          />

          {/* 中线 OM (点划虚线) */}
          <line
            x1={originDesign.x}
            y1={originDesign.y}
            x2={mathToDesign(midpoint.x, midpoint.y, scale).x}
            y2={mathToDesign(midpoint.x, midpoint.y, scale).y}
            stroke={withAlpha(MATH_COLORS.paramSecondary, 0.6)}
            strokeDasharray="4 3"
            strokeWidth={1.5}
          />

          {/* 向量 OA 与 OB */}
          <VectorArrow
            from={[0, 0]}
            to={[e1.x, e1.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            label="A"
            fontScale={fontScale}
          />
          <VectorArrow
            from={[0, 0]}
            to={[e2.x, e2.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
            label="B"
            fontScale={fontScale}
          />

          {/* 中点 M 标注 */}
          {(() => {
            const mDesign = mathToDesign(midpoint.x, midpoint.y, scale);
            return (
              <g className="midpoint-group">
                <MathPoint
                  x={mDesign.x}
                  y={mDesign.y}
                  variant="solid"
                  color={MATH_COLORS.paramSecondary}
                />
                <text
                  x={mDesign.x + 8}
                  y={mDesign.y - 8}
                  fontSize={fontScale(11)}
                  fill={MATH_COLORS.paramSecondary}
                  fontWeight="bold"
                  fontStyle="italic"
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={3}
                >
                  M (中点)
                </text>
              </g>
            );
          })()}

          {/* 重心 G 标注 (中线 2/3 处) */}
          {(() => {
            const gDesign = mathToDesign(centroid.x, centroid.y, scale);
            return (
              <g className="centroid-group">
                <MathPoint
                  x={gDesign.x}
                  y={gDesign.y}
                  variant="focus"
                  color={MATH_COLORS.limitPoint}
                />
                <text
                  x={gDesign.x + 8}
                  y={gDesign.y - 8}
                  fontSize={fontScale(11)}
                  fill={MATH_COLORS.limitPoint}
                  fontWeight="bold"
                  fontStyle="italic"
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={3}
                >
                  G (重心)
                </text>
              </g>
            );
          })()}

          {/* 爪子动点分点向量 OP */}
          {(() => {
            const pDesign = mathToDesign(
              divisionPoint.x,
              divisionPoint.y,
              scale,
            );
            return (
              <>
                <VectorArrow
                  from={[0, 0]}
                  to={[divisionPoint.x, divisionPoint.y]}
                  scale={scale}
                  color={MATH_COLORS.paramTertiary}
                  strokeWidth={3}
                  label="P"
                  fontScale={fontScale}
                />

                <InteractivePoint
                  cx={pDesign.x}
                  cy={pDesign.y}
                  color={MATH_COLORS.paramTertiary}
                  scale={scale}
                  vp={vp}
                  onDrag={handleDragDivisionPoint}
                  fontScale={fontScale}
                />
              </>
            );
          })()}

          <InteractivePoint
            cx={e1Design.x}
            cy={e1Design.y}
            color={MATH_COLORS.paramPrimary}
            scale={scale}
            vp={vp}
            onDrag={handleDragE1}
            fontScale={fontScale}
          />
          <InteractivePoint
            cx={e2Design.x}
            cy={e2Design.y}
            color={MATH_COLORS.paramSecondary}
            scale={scale}
            vp={vp}
            onDrag={handleDragE2}
            fontScale={fontScale}
          />
        </g>
      )}
    </g>
  );
};
