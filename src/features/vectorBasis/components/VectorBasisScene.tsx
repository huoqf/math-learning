import React from "react";
import {
  CoordinateGrid,
  VectorArrow,
  InteractivePoint,
} from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import type { SceneScale } from "@/hooks";
import type { ViewportInfo } from "@/utils/useViewport";
import { computeVectorBasis, type VectorBasisInput } from "@/math/vectorBasis";

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
    // 反解 xCoeff, yCoeff: P = x*e1 + y*e2
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
    // P = (1-t)e1 + t*e2 => t 是 P 在 segment e1e2 上的相对比例
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
      {/* 背景标准直角坐标系 */}
      <CoordinateGrid scale={scale} fontScale={fontScale} />

      {/* 1. 任意基底分解与斜网格模式 */}
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
                stroke={MATH_COLORS.paramSecondary}
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              {/* P2 -> Target 虚线平行于 e1 */}
              <line
                x1={p2Design.x}
                y1={p2Design.y}
                x2={targetDesign.x}
                y2={targetDesign.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />

              {/* 分量向量 λe1 */}
              <VectorArrow
                from={[0, 0]}
                to={[p1.x, p1.y]}
                scale={scale}
                color={MATH_COLORS.paramPrimary}
                strokeWidth={2.5}
                label={`λe₁ (${lambda.toFixed(2)})`}
                fontScale={fontScale}
              />

              {/* 分量向量 μe2 */}
              <VectorArrow
                from={[0, 0]}
                to={[p2.x, p2.y]}
                scale={scale}
                color={MATH_COLORS.paramSecondary}
                strokeWidth={2.5}
                label={`μe₂ (${mu.toFixed(2)})`}
                fontScale={fontScale}
              />
            </>
          )}

          {/* 基底向量 e1 */}
          <VectorArrow
            from={[0, 0]}
            to={[e1.x, e1.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={3}
            label="e₁"
            fontScale={fontScale}
          />

          {/* 基底向量 e2 */}
          <VectorArrow
            from={[0, 0]}
            to={[e2.x, e2.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={3}
            label="e₂"
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
            label="e₁"
            scale={scale}
            vp={vp}
            onDrag={handleDragE1}
            fontScale={fontScale}
          />

          <InteractivePoint
            cx={e2Design.x}
            cy={e2Design.y}
            color={MATH_COLORS.paramSecondary}
            label="e₂"
            scale={scale}
            vp={vp}
            onDrag={handleDragE2}
            fontScale={fontScale}
          />

          <InteractivePoint
            cx={targetDesign.x}
            cy={targetDesign.y}
            color={MATH_COLORS.vectorResult}
            label="a"
            scale={scale}
            vp={vp}
            onDrag={handleDragTarget}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* 2. 正交分解与旋转坐标系模式 */}
      {studyMode === "orthogonal" && (
        <g className="mode-orthogonal">
          {/* 正交基底 e1' 与 e2' */}
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

            return (
              <>
                {/* 旋转后的正交坐标轴 */}
                <line
                  x1={mathToDesign(-orthoE1.x * 6, -orthoE1.y * 6, scale).x}
                  y1={mathToDesign(-orthoE1.x * 6, -orthoE1.y * 6, scale).y}
                  x2={mathToDesign(orthoE1.x * 6, orthoE1.y * 6, scale).x}
                  y2={mathToDesign(orthoE1.x * 6, orthoE1.y * 6, scale).y}
                  stroke={withAlpha(MATH_COLORS.paramPrimary, 0.3)}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <line
                  x1={mathToDesign(-orthoE2.x * 6, -orthoE2.y * 6, scale).x}
                  y1={mathToDesign(-orthoE2.x * 6, -orthoE2.y * 6, scale).y}
                  x2={mathToDesign(orthoE2.x * 6, orthoE2.y * 6, scale).x}
                  y2={mathToDesign(orthoE2.x * 6, orthoE2.y * 6, scale).y}
                  stroke={withAlpha(MATH_COLORS.paramSecondary, 0.3)}
                  strokeDasharray="4 4"
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

                {/* 正交向量分量 */}
                <VectorArrow
                  from={[0, 0]}
                  to={proj1Math}
                  scale={scale}
                  color={MATH_COLORS.paramPrimary}
                  strokeWidth={2.5}
                  label={`x'e₁' (${orthoLambda.toFixed(2)})`}
                  fontScale={fontScale}
                />
                <VectorArrow
                  from={[0, 0]}
                  to={proj2Math}
                  scale={scale}
                  color={MATH_COLORS.paramSecondary}
                  strokeWidth={2.5}
                  label={`y'e₂' (${orthoMu.toFixed(2)})`}
                  fontScale={fontScale}
                />

                {/* 正交单位基底 */}
                <VectorArrow
                  from={[0, 0]}
                  to={orthoE1Pos}
                  scale={scale}
                  color={MATH_COLORS.paramPrimary}
                  strokeWidth={3}
                  label="e₁'"
                  fontScale={fontScale}
                />
                <VectorArrow
                  from={[0, 0]}
                  to={orthoE2Pos}
                  scale={scale}
                  color={MATH_COLORS.paramSecondary}
                  strokeWidth={3}
                  label="e₂'"
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
                  label="a"
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

      {/* 3. 三点共线与等系数线模式 */}
      {studyMode === "collinear" && (
        <g className="mode-collinear">
          {/* 直线 AB (x+y=1 的参考线) */}
          <line
            x1={
              mathToDesign(
                e1.x - (e2.x - e1.x) * 1.5,
                e1.y - (e2.y - e1.y) * 1.5,
                scale,
              ).x
            }
            y1={
              mathToDesign(
                e1.x - (e2.x - e1.x) * 1.5,
                e1.y - (e2.y - e1.y) * 1.5,
                scale,
              ).y
            }
            x2={
              mathToDesign(
                e2.x + (e2.x - e1.x) * 1.5,
                e2.y + (e2.y - e1.y) * 1.5,
                scale,
              ).x
            }
            y2={
              mathToDesign(
                e2.x + (e2.x - e1.x) * 1.5,
                e2.y + (e2.y - e1.y) * 1.5,
                scale,
              ).y
            }
            stroke={withAlpha(MATH_COLORS.limitPoint, 0.4)}
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />

          {/* 实时等系数线 x+y = k */}
          {(() => {
            const startD = mathToDesign(eqLineStart.x, eqLineStart.y, scale);
            const endD = mathToDesign(eqLineEnd.x, eqLineEnd.y, scale);
            return (
              <line
                x1={startD.x}
                y1={startD.y}
                x2={endD.x}
                y2={endD.y}
                stroke={MATH_COLORS.paramTertiary}
                strokeWidth={2.5}
              />
            );
          })()}

          {/* 基底向量 e1 与 e2 */}
          <VectorArrow
            from={[0, 0]}
            to={[e1.x, e1.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            label="A (e₁)"
            fontScale={fontScale}
          />
          <VectorArrow
            from={[0, 0]}
            to={[e2.x, e2.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
            label="B (e₂)"
            fontScale={fontScale}
          />

          {/* 合成向量 OP */}
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
                  label={`P (x+y=${sumCoeff.toFixed(2)})`}
                  fontScale={fontScale}
                />

                <InteractivePoint
                  cx={pDesign.x}
                  cy={pDesign.y}
                  color={MATH_COLORS.paramTertiary}
                  label="P"
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
            label="A"
            scale={scale}
            vp={vp}
            onDrag={handleDragE1}
            fontScale={fontScale}
          />
          <InteractivePoint
            cx={e2Design.x}
            cy={e2Design.y}
            color={MATH_COLORS.paramSecondary}
            label="B"
            scale={scale}
            vp={vp}
            onDrag={handleDragE2}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* 4. 三角形几何模式 */}
      {studyMode === "triangleGeom" && (
        <g className="mode-triangle-geom">
          {/* 三角形 OAB */}
          <polygon
            points={`${originDesign.x},${originDesign.y} ${e1Design.x},${e1Design.y} ${e2Design.x},${e2Design.y}`}
            fill={withAlpha(MATH_COLORS.vectorPrimary, 0.08)}
            stroke={MATH_COLORS.vectorPrimary}
            strokeWidth={1.5}
          />

          {/* 向量 OA, OB */}
          <VectorArrow
            from={[0, 0]}
            to={[e1.x, e1.y]}
            scale={scale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            label="A (a)"
            fontScale={fontScale}
          />
          <VectorArrow
            from={[0, 0]}
            to={[e2.x, e2.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
            label="B (b)"
            fontScale={fontScale}
          />

          {/* 中线 OM */}
          <VectorArrow
            from={[0, 0]}
            to={[midpoint.x, midpoint.y]}
            scale={scale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2}
            label="M (中线)"
            fontScale={fontScale}
          />

          {/* 重心 OG */}
          {(() => {
            const gDesign = mathToDesign(centroid.x, centroid.y, scale);
            return (
              <circle
                cx={gDesign.x}
                cy={gDesign.y}
                r={fontScale(6)}
                fill={MATH_COLORS.limitPoint}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            );
          })()}

          {/* 内分点 OP */}
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
                  label="P (分点)"
                  fontScale={fontScale}
                />

                <InteractivePoint
                  cx={pDesign.x}
                  cy={pDesign.y}
                  color={MATH_COLORS.paramTertiary}
                  label="P"
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
            label="A"
            scale={scale}
            vp={vp}
            onDrag={handleDragE1}
            fontScale={fontScale}
          />
          <InteractivePoint
            cx={e2Design.x}
            cy={e2Design.y}
            color={MATH_COLORS.paramSecondary}
            label="B"
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
