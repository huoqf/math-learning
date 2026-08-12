import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  PolarGrid,
  VectorArrow,
  InteractivePoint,
} from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import {
  createComplex,
  addComplex,
  subComplex,
  mulComplex,
  modulus,
  argument,
  fromPolar,
  conjugate,
  formatComplexLatex,
  calcCircleLocusExtrema,
} from "@/math/complex";

interface ComplexSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode: "plane-operations" | "multiplication-rotation" | "locus-extrema";
}

export const ComplexScene: React.FC<ComplexSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode,
}) => {
  const toDesign = (x: number, y: number) => mathToDesign(x, y, scale);

  // ─────────────────────────────────────────────────────────────
  // 模式一：复平面与向量加减法
  // ─────────────────────────────────────────────────────────────
  const a1 = params.a1 ?? 3;
  const b1 = params.b1 ?? 2;
  const a2 = params.a2 ?? 1;
  const b2 = params.b2 ?? 3;

  const z1 = useMemo(() => createComplex(a1, b1), [a1, b1]);
  const z2 = useMemo(() => createComplex(a2, b2), [a2, b2]);
  const zSum = useMemo(() => addComplex(z1, z2), [z1, z2]);
  const zDiff = useMemo(() => subComplex(z1, z2), [z1, z2]);

  const p1 = toDesign(z1.re, z1.im);
  const p2 = toDesign(z2.re, z2.im);
  const pSum = toDesign(zSum.re, zSum.im);
  const pConj1 = toDesign(z1.re, -z1.im);

  // ─────────────────────────────────────────────────────────────
  // 模式二：乘法旋转与缩放
  // ─────────────────────────────────────────────────────────────
  const r1 = params.r1 ?? 2.0;
  const deg1 = params.deg1 ?? 30;
  const r2 = params.r2 ?? 1.5;
  const deg2 = params.deg2 ?? 60;

  const rad1 = (deg1 * Math.PI) / 180;
  const rad2 = (deg2 * Math.PI) / 180;

  const z1Polar = useMemo(() => fromPolar(r1, rad1), [r1, rad1]);
  const z2Polar = useMemo(() => fromPolar(r2, rad2), [r2, rad2]);
  const zProd = useMemo(() => mulComplex(z1Polar, z2Polar), [z1Polar, z2Polar]);

  // 旋转弧线路径计算 (从 rad1 到 rad1 + rad2，半径为 r1)
  const rotationArcPath = useMemo(() => {
    const startAngle = rad1;
    const endAngle = rad1 + rad2;
    const steps = 40;
    const arcPoints: string[] = [];
    const arcRadius = r1;

    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / steps);
      const pt = toDesign(
        arcRadius * Math.cos(angle),
        arcRadius * Math.sin(angle),
      );
      arcPoints.push(
        `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
      );
    }
    return arcPoints.join(" ");
  }, [rad1, rad2, r1, scale]);

  // ─────────────────────────────────────────────────────────────
  // 模式三：轨迹与极值
  // ─────────────────────────────────────────────────────────────
  const z0x = params.z0x ?? 3.0;
  const z0y = params.z0y ?? 4.0;
  const radius = params.radius ?? 2.0;
  const wx = params.wx ?? 0.0;
  const wy = params.wy ?? 0.0;

  const center = useMemo(() => createComplex(z0x, z0y), [z0x, z0y]);
  const target = useMemo(() => createComplex(wx, wy), [wx, wy]);
  const locusRes = useMemo(
    () => calcCircleLocusExtrema(center, radius, target),
    [center, radius, target],
  );

  const pCenter = toDesign(center.re, center.im);
  const pTarget = toDesign(target.re, target.im);
  const pMin = toDesign(locusRes.minPoint.re, locusRes.minPoint.im);
  const pMax = toDesign(locusRes.maxPoint.re, locusRes.maxPoint.im);

  // 圆周像素半径
  const circlePxRadius = radius * scale.scaleX;

  return (
    <g>
      {/* 网格底图 */}
      {studyMode === "multiplication-rotation" ? (
        <PolarGrid
          scale={scale}
          fontScale={fontScale}
          maxRadius={5}
          radiusStep={1}
          angleStep={Math.PI / 6}
          gridColor={MATH_COLORS.grid}
          axisColor={MATH_COLORS.axis}
        />
      ) : (
        <CoordinateGrid scale={scale} fontScale={fontScale} />
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 模式一：复平面与向量加减几何 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {studyMode === "plane-operations" && (
        <g key="mode-plane">
          {/* 平行四边形加法虚线 */}
          <line
            x1={p1.x}
            y1={p1.y}
            x2={pSum.x}
            y2={pSum.y}
            stroke={withAlpha(MATH_COLORS.paramSecondary, 0.6)}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <line
            x1={p2.x}
            y1={p2.y}
            x2={pSum.x}
            y2={pSum.y}
            stroke={withAlpha(MATH_COLORS.paramPrimary, 0.6)}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* 减法差向量 z1 - z2 */}
          <VectorArrow
            from={[z2.re, z2.im]}
            to={[z1.re, z1.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.function}
            strokeWidth={2}
            strokeDasharray="5 3"
            label={`|z1-z2|=${modulus(zDiff).toFixed(2)}`}
            labelSize={10}
          />

          {/* 共轭复数虚线与镜像点 */}
          <line
            x1={p1.x}
            y1={p1.y}
            x2={pConj1.x}
            y2={pConj1.y}
            stroke={withAlpha(MATH_COLORS.paramPrimary, 0.4)}
            strokeWidth={1}
            strokeDasharray="2 2"
          />
          <circle
            cx={pConj1.x}
            cy={pConj1.y}
            r={4}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.5)}
          />
          <text
            x={pConj1.x + 8}
            y={pConj1.y + 12}
            fill={MATH_COLORS.labelTextLight}
            fontSize={fontScale(10)}
          >
            {`z1* = ${formatComplexLatex(conjugate(z1))}`}
          </text>

          {/* 向量 z1 */}
          <VectorArrow
            from={[0, 0]}
            to={[z1.re, z1.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            label={`z1 = ${formatComplexLatex(z1)}`}
          />

          {/* 向量 z2 */}
          <VectorArrow
            from={[0, 0]}
            to={[z2.re, z2.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
            label={`z2 = ${formatComplexLatex(z2)}`}
          />

          {/* 和向量 z1 + z2 */}
          <VectorArrow
            from={[0, 0]}
            to={[zSum.re, zSum.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={3}
            label={`z1+z2 = ${formatComplexLatex(zSum)}`}
          />

          {/* 可拖拽交互点 Z1 */}
          <InteractivePoint
            cx={z1.re}
            cy={z1.im}
            scale={scale}
            vp={vp}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            r={7}
            label="Z1"
            onDrag={({ x, y }) => {
              onParamChange("a1", Math.round(x * 2) / 2);
              onParamChange("b1", Math.round(y * 2) / 2);
            }}
          />

          {/* 可拖拽交互点 Z2 */}
          <InteractivePoint
            cx={z2.re}
            cy={z2.im}
            scale={scale}
            vp={vp}
            fontScale={fontScale}
            color={MATH_COLORS.paramSecondary}
            r={7}
            label="Z2"
            onDrag={({ x, y }) => {
              onParamChange("a2", Math.round(x * 2) / 2);
              onParamChange("b2", Math.round(y * 2) / 2);
            }}
          />
        </g>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 模式二：乘法旋转与缩放 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {studyMode === "multiplication-rotation" && (
        <g key="mode-rotation">
          {/* 旋转轨迹弧线 */}
          <path
            d={rotationArcPath}
            fill="none"
            stroke={MATH_COLORS.paramSecondary}
            strokeWidth={2}
            strokeDasharray="4 3"
          />

          {/* 伸缩圆弧指示 (半径 r1 * r2) */}
          <circle
            cx={scale.originX}
            cy={scale.originY}
            r={modulus(zProd) * scale.scaleX}
            fill="none"
            stroke={withAlpha(MATH_COLORS.paramTertiary, 0.3)}
            strokeWidth={1}
            strokeDasharray="2 4"
          />

          {/* 被乘向量 z1 */}
          <VectorArrow
            from={[0, 0]}
            to={[z1Polar.re, z1Polar.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            label={`z1 (${r1.toFixed(1)}, ${deg1}°)`}
          />

          {/* 旋转算子向量 z2 */}
          <VectorArrow
            from={[0, 0]}
            to={[z2Polar.re, z2Polar.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
            label={`z2 (旋转 ${deg2}°)`}
          />

          {/* 乘积向量 z1 * z2 */}
          <VectorArrow
            from={[0, 0]}
            to={[zProd.re, zProd.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={3}
            label={`z1·z2 = ${formatComplexLatex(zProd)}`}
          />

          {/* 可拖拽交互点 Z1 (改变 r1, deg1) */}
          <InteractivePoint
            cx={z1Polar.re}
            cy={z1Polar.im}
            scale={scale}
            vp={vp}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            r={7}
            label="Z1"
            onDrag={({ x, y }) => {
              const pt = createComplex(x, y);
              const mod = Math.min(4.5, Math.max(0.5, modulus(pt)));
              const argDeg = Math.round((argument(pt) * 180) / Math.PI / 5) * 5;
              onParamChange("r1", Math.round(mod * 10) / 10);
              onParamChange("deg1", argDeg);
            }}
          />

          {/* 可拖拽交互点 Z2 (改变 r2, deg2) */}
          <InteractivePoint
            cx={z2Polar.re}
            cy={z2Polar.im}
            scale={scale}
            vp={vp}
            fontScale={fontScale}
            color={MATH_COLORS.paramSecondary}
            r={7}
            label="Z2"
            onDrag={({ x, y }) => {
              const pt = createComplex(x, y);
              const mod = Math.min(3.0, Math.max(0.5, modulus(pt)));
              const argDeg = Math.round((argument(pt) * 180) / Math.PI / 5) * 5;
              onParamChange("r2", Math.round(mod * 10) / 10);
              onParamChange("deg2", argDeg);
            }}
          />
        </g>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 模式三：复数圆轨迹与最值几何 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {studyMode === "locus-extrema" && (
        <g key="mode-locus">
          {/* 轨迹圆 |z - z0| = R */}
          <circle
            cx={pCenter.x}
            cy={pCenter.y}
            r={circlePxRadius}
            fill={withAlpha(MATH_COLORS.paramPrimary, 0.08)}
            stroke={MATH_COLORS.paramPrimary}
            strokeWidth={2}
          />

          {/* 圆心 z0 到目标点 w 的贯穿切线段 */}
          <line
            x1={pTarget.x}
            y1={pTarget.y}
            x2={pMax.x}
            y2={pMax.y}
            stroke={withAlpha(MATH_COLORS.axis, 0.5)}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />

          {/* 最小距离线段 w -> minPoint */}
          <line
            x1={pTarget.x}
            y1={pTarget.y}
            x2={pMin.x}
            y2={pMin.y}
            stroke={MATH_COLORS.paramTertiary}
            strokeWidth={3}
          />

          {/* 最远点标注 */}
          <circle
            cx={pMax.x}
            cy={pMax.y}
            r={5}
            fill={MATH_COLORS.paramPrimary}
          />
          <text
            x={pMax.x + 8}
            y={pMax.y - 6}
            fill={MATH_COLORS.paramPrimary}
            fontSize={fontScale(10)}
            fontWeight="bold"
          >
            {`Z_max (|d|=${locusRes.maxDist.toFixed(2)})`}
          </text>

          {/* 最近点标注 */}
          <circle
            cx={pMin.x}
            cy={pMin.y}
            r={5}
            fill={MATH_COLORS.paramTertiary}
          />
          <text
            x={pMin.x + 8}
            y={pMin.y - 6}
            fill={MATH_COLORS.paramTertiary}
            fontSize={fontScale(10)}
            fontWeight="bold"
          >
            {`Z_min (|d|=${locusRes.minDist.toFixed(2)})`}
          </text>

          {/* 圆心 z0 可拖拽 */}
          <InteractivePoint
            cx={center.re}
            cy={center.im}
            scale={scale}
            vp={vp}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            r={7}
            label="圆心 z0"
            onDrag={({ x, y }) => {
              onParamChange("z0x", Math.round(x * 2) / 2);
              onParamChange("z0y", Math.round(y * 2) / 2);
            }}
          />

          {/* 目标点 w 可拖拽 */}
          <InteractivePoint
            cx={target.re}
            cy={target.im}
            scale={scale}
            vp={vp}
            fontScale={fontScale}
            color={MATH_COLORS.paramSecondary}
            r={7}
            label="定点 w"
            onDrag={({ x, y }) => {
              onParamChange("wx", Math.round(x * 2) / 2);
              onParamChange("wy", Math.round(y * 2) / 2);
            }}
          />
        </g>
      )}
    </g>
  );
};
