import React, { useMemo, useCallback } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  PolarGrid,
  VectorArrow,
  InteractivePoint,
  MathPoint,
} from "@/components/Math";
import { MATH_COLORS, withAlpha } from "@/theme";
import { mathToDesign } from "@/utils/coordinate";
import {
  createComplex,
  addComplex,
  mulComplex,
  modulus,
  argument,
  fromPolar,
  calcCircleLocusExtrema,
  calcPerpBisectorLocus,
} from "@/math/complex";

interface ComplexSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode: "plane-operations" | "multiplication-rotation" | "locus-extrema";
  subModel?: "circle" | "perp-bisector" | "triangle-ineq";
}

export const ComplexScene: React.FC<ComplexSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode,
  subModel = "circle",
}) => {
  const toDesign = useCallback(
    (x: number, y: number) => mathToDesign(x, y, scale),
    [scale],
  );

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

  const p1 = toDesign(z1.re, z1.im);
  const p2 = toDesign(z2.re, z2.im);
  const pSum = toDesign(zSum.re, zSum.im);
  const pConj1 = toDesign(z1.re, -z1.im);

  // 是否展示共轭点（虚部不为 0 时才显示镜像点，避免实轴文字四重重叠）
  const showConjugate = Math.abs(b1) > 0.4;

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
  const arcRadius = Math.min(r1, 2.5);
  const rotationArcPath = useMemo(() => {
    const startAngle = rad1;
    const endAngle = rad1 + rad2;
    const steps = 30;
    const arcPoints: string[] = [];

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
  }, [rad1, rad2, arcRadius, toDesign]);

  // 旋转角标注位置 (弧线外侧)
  const midAngle = rad1 + rad2 / 2;
  const arcLabelPt = toDesign(
    (arcRadius + 0.35) * Math.cos(midAngle),
    (arcRadius + 0.35) * Math.sin(midAngle),
  );

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

  // 定点 W 是否靠近原点
  const isTargetNearOrigin = Math.hypot(wx, wy) < 0.6;

  return (
    <g>
      {/* 极简网格底图 */}
      {studyMode === "multiplication-rotation" ? (
        <PolarGrid
          scale={scale}
          fontScale={fontScale}
          maxRadius={5}
          radiusStep={1}
          angleStep={Math.PI / 6}
          showAngleLabels={false}
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
            stroke={withAlpha(MATH_COLORS.paramSecondary, 0.5)}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <line
            x1={p2.x}
            y1={p2.y}
            x2={pSum.x}
            y2={pSum.y}
            stroke={withAlpha(MATH_COLORS.paramPrimary, 0.5)}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* 减法差向量 z1 - z2 (从 Z2 指向 Z1，标注偏向 t=0.25 避开对角线中心交点) */}
          <VectorArrow
            from={[z2.re, z2.im]}
            to={[z1.re, z1.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.function}
            strokeWidth={2}
            strokeDasharray="5 3"
            label="z₁ - z₂"
            labelPositionRatio={0.25}
            labelSize={11}
          />

          {/* 共轭复数虚线与镜像点（仅当非实数时显示，彻底杜绝实轴重合） */}
          {showConjugate && (
            <>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={pConj1.x}
                y2={pConj1.y}
                stroke={withAlpha(MATH_COLORS.paramPrimary, 0.35)}
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              <MathPoint
                cx={z1.re}
                cy={-z1.im}
                scale={scale}
                fontScale={fontScale}
                color={MATH_COLORS.paramPrimary}
                variant="solid"
                r={3.8}
                label="z̄₁"
                labelPosition="bottom"
              />
            </>
          )}

          {/* 向量 z1 */}
          <VectorArrow
            from={[0, 0]}
            to={[z1.re, z1.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            label="z₁"
            labelSize={12}
          />

          {/* 向量 z2 */}
          <VectorArrow
            from={[0, 0]}
            to={[z2.re, z2.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
            label="z₂"
            labelSize={12}
          />

          {/* 和向量 z1 + z2 (标注偏向 t=0.8 靠近箭头端，避开中心交点) */}
          <VectorArrow
            from={[0, 0]}
            to={[zSum.re, zSum.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={3}
            label="z₁ + z₂"
            labelPositionRatio={0.8}
            labelSize={12}
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
            label="Z₁"
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
            label="Z₂"
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
            stroke={withAlpha(MATH_COLORS.paramTertiary, 0.25)}
            strokeWidth={1}
            strokeDasharray="2 4"
          />

          {/* 旋转角度文字标注 (位于弧线外侧) */}
          <text
            x={arcLabelPt.x}
            y={arcLabelPt.y}
            fill={MATH_COLORS.paramSecondary}
            fontSize={fontScale(11)}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
            paintOrder="stroke"
            stroke="white"
            strokeWidth={3}
          >
            {deg2 >= 0 ? `+${deg2}°` : `${deg2}°`}
          </text>

          {/* 被乘向量 z1 */}
          <VectorArrow
            from={[0, 0]}
            to={[z1Polar.re, z1Polar.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            label="z₁"
            labelSize={12}
          />

          {/* 旋转算子向量 z2 */}
          <VectorArrow
            from={[0, 0]}
            to={[z2Polar.re, z2Polar.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2.5}
            label="z₂"
            labelSize={12}
          />

          {/* 乘积向量 z1 * z2 (靠外端标注) */}
          <VectorArrow
            from={[0, 0]}
            to={[zProd.re, zProd.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={3}
            label="z₁z₂"
            labelPositionRatio={0.85}
            labelSize={12}
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
            label="Z₁"
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
            label="Z₂"
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
      {/* 模式三：复数圆轨迹 / 垂直平分线 / 三角不等式几何 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {studyMode === "locus-extrema" && subModel === "circle" && (
        <g key="mode-locus-circle">
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
          <MathPoint
            cx={locusRes.maxPoint.re}
            cy={locusRes.maxPoint.im}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            variant="solid"
            r={4}
            label="Z_max"
            labelPosition="top"
          />

          {/* 最近点标注 */}
          <MathPoint
            cx={locusRes.minPoint.re}
            cy={locusRes.minPoint.im}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramTertiary}
            variant="solid"
            r={4}
            label="Z_min"
            labelPosition="bottom"
          />

          {/* 圆心 z0 可拖拽 */}
          <InteractivePoint
            cx={center.re}
            cy={center.im}
            scale={scale}
            vp={vp}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            r={7}
            label="Z₀"
            onDrag={({ x, y }) => {
              onParamChange("z0x", Math.round(x * 2) / 2);
              onParamChange("z0y", Math.round(y * 2) / 2);
            }}
          />

          {/* 目标定点 w 可拖拽（若在原点附近，将 label 置于左上方避免遮盖 O） */}
          <InteractivePoint
            cx={target.re}
            cy={target.im}
            scale={scale}
            vp={vp}
            fontScale={fontScale}
            color={MATH_COLORS.paramSecondary}
            r={7}
            label={isTargetNearOrigin ? "W (定点)" : "W"}
            onDrag={({ x, y }) => {
              onParamChange("wx", Math.round(x * 2) / 2);
              onParamChange("wy", Math.round(y * 2) / 2);
            }}
          />
        </g>
      )}

      {studyMode === "locus-extrema" &&
        subModel === "perp-bisector" &&
        (() => {
          const pBisector = calcPerpBisectorLocus(z1, z2);
          const lineLen = 12;
          const ptA = toDesign(
            pBisector.midPoint.re + pBisector.normalDir.re * lineLen,
            pBisector.midPoint.im + pBisector.normalDir.im * lineLen,
          );
          const ptB = toDesign(
            pBisector.midPoint.re - pBisector.normalDir.re * lineLen,
            pBisector.midPoint.im - pBisector.normalDir.im * lineLen,
          );
          return (
            <g key="mode-locus-bisector">
              {/* 定点连线 */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={withAlpha(MATH_COLORS.axis, 0.4)}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              {/* 垂直平分线 */}
              <line
                x1={ptA.x}
                y1={ptA.y}
                x2={ptB.x}
                y2={ptB.y}
                stroke={MATH_COLORS.paramPrimary}
                strokeWidth={2.5}
              />
              {/* 中点 M */}
              <MathPoint
                cx={pBisector.midPoint.re}
                cy={pBisector.midPoint.im}
                scale={scale}
                fontScale={fontScale}
                color={MATH_COLORS.paramTertiary}
                variant="solid"
                r={3.8}
                label="M (中点)"
                labelPosition="right"
              />
              {/* 定点 Z1 */}
              <InteractivePoint
                cx={z1.re}
                cy={z1.im}
                scale={scale}
                vp={vp}
                fontScale={fontScale}
                color={MATH_COLORS.paramPrimary}
                r={7}
                label="Z₁"
                onDrag={({ x, y }) => {
                  onParamChange("a1", Math.round(x * 2) / 2);
                  onParamChange("b1", Math.round(y * 2) / 2);
                }}
              />
              {/* 定点 Z2 */}
              <InteractivePoint
                cx={z2.re}
                cy={z2.im}
                scale={scale}
                vp={vp}
                fontScale={fontScale}
                color={MATH_COLORS.paramSecondary}
                r={7}
                label="Z₂"
                onDrag={({ x, y }) => {
                  onParamChange("a2", Math.round(x * 2) / 2);
                  onParamChange("b2", Math.round(y * 2) / 2);
                }}
              />
            </g>
          );
        })()}

      {studyMode === "locus-extrema" && subModel === "triangle-ineq" && (
        <g key="mode-locus-triangle-ineq">
          {/* z1 向量 */}
          <VectorArrow
            from={[0, 0]}
            to={[z1.re, z1.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            strokeWidth={2.5}
            label="z₁"
          />
          {/* z2 平移向量接在 z1 之后 */}
          <VectorArrow
            from={[z1.re, z1.im]}
            to={[zSum.re, zSum.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramSecondary}
            strokeWidth={2}
            strokeDasharray="4 3"
            label="z₂ (平移)"
          />
          {/* 和向量 z1 + z2 作为三角形第三边 */}
          <VectorArrow
            from={[0, 0]}
            to={[zSum.re, zSum.im]}
            scale={scale}
            fontScale={fontScale}
            color={MATH_COLORS.paramTertiary}
            strokeWidth={3}
            label="z₁ + z₂"
          />
          {/* 定点 Z1 */}
          <InteractivePoint
            cx={z1.re}
            cy={z1.im}
            scale={scale}
            vp={vp}
            fontScale={fontScale}
            color={MATH_COLORS.paramPrimary}
            r={7}
            label="Z₁"
            onDrag={({ x, y }) => {
              onParamChange("a1", Math.round(x * 2) / 2);
              onParamChange("b1", Math.round(y * 2) / 2);
            }}
          />
          {/* 定点 Z2 */}
          <InteractivePoint
            cx={z2.re}
            cy={z2.im}
            scale={scale}
            vp={vp}
            fontScale={fontScale}
            color={MATH_COLORS.paramSecondary}
            r={7}
            label="Z₂"
            onDrag={({ x, y }) => {
              onParamChange("a2", Math.round(x * 2) / 2);
              onParamChange("b2", Math.round(y * 2) / 2);
            }}
          />
        </g>
      )}
    </g>
  );
};
