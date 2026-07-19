import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS } from "@/theme";

interface PolarGridProps {
  /** 场景比例尺 */
  scale: SceneScale;
  /** 最大半径（数学单位），默认 5 */
  maxRadius?: number;
  /** 半径步长 */
  radiusStep?: number;
  /** 角度步长（弧度），默认 π/6 (30°) */
  angleStep?: number;
  /** 是否显示网格线 */
  showGrid?: boolean;
  /** 是否显示角度标签 */
  showAngleLabels?: boolean;
  /** 是否显示半径标签 */
  showRadiusLabels?: boolean;
  /** 网格线颜色 */
  gridColor?: string;
  /** 轴线颜色 */
  axisColor?: string;
  /** 字号缩放函数，默认原样返回。推荐传入 canvasSize.font 以适配不同屏幕尺寸 */
  fontScale?: (v: number) => number;
}

/** 角度 → 简洁文本标签 */
function angleLabel(rad: number): string {
  const normalized = ((rad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const frac = normalized / Math.PI;
  // 常见角度
  if (Math.abs(frac) < 0.01) return "0";
  if (Math.abs(frac - 0.5) < 0.01) return "π/2";
  if (Math.abs(frac - 1) < 0.01) return "π";
  if (Math.abs(frac - 1.5) < 0.01) return "3π/2";
  if (Math.abs(frac - 2) < 0.01) return "0";
  // 通用分数近似
  const n = Math.round(frac * 6);
  if (n % 3 === 0) return `${n / 3}π`;
  return `${n}π/6`;
}

export const PolarGrid: React.FC<PolarGridProps> = ({
  scale,
  maxRadius = 5,
  radiusStep = 1,
  angleStep = Math.PI / 6,
  showGrid = true,
  showAngleLabels = true,
  showRadiusLabels = true,
  gridColor = MATH_COLORS.grid,
  axisColor = MATH_COLORS.axis,
  fontScale = (v) => v,
}) => {
  const { originX, originY, scaleX } = scale;
  const toDesign = (mx: number, my: number) => mathToDesign(mx, my, scale);

  // 同心圆
  const circles = React.useMemo(() => {
    if (!showGrid) return null;
    const result: React.ReactNode[] = [];
    for (let r = radiusStep; r <= maxRadius; r += radiusStep) {
      // 用多段直线近似圆（SVG 无原生圆支持缩放）
      const segments: string[] = [];
      const steps = 120;
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * 2 * Math.PI;
        const pt = toDesign(r * Math.cos(theta), r * Math.sin(theta));
        segments.push(
          `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
        );
      }
      result.push(
        <path
          key={`circle-${r}`}
          d={segments.join(" ")}
          fill="none"
          stroke={gridColor}
          strokeWidth={1}
          strokeDasharray="4 4"
        />,
      );
    }
    return result;
  }, [showGrid, maxRadius, radiusStep, originX, originY, scaleX]);

  // 角度辐射线
  const angleLines = React.useMemo(() => {
    if (!showGrid) return null;
    const result: React.ReactNode[] = [];
    const maxR = maxRadius;
    for (let theta = 0; theta < 2 * Math.PI - 0.01; theta += angleStep) {
      const outerPt = toDesign(maxR * Math.cos(theta), maxR * Math.sin(theta));
      result.push(
        <line
          key={`angle-${theta.toFixed(3)}`}
          x1={originX}
          y1={originY}
          x2={outerPt.x}
          y2={outerPt.y}
          stroke={gridColor}
          strokeWidth={1}
          strokeDasharray="4 4"
        />,
      );
    }
    return result;
  }, [showGrid, maxRadius, angleStep, originX, originY, scaleX]);

  // 角度标签
  const angleLabels = React.useMemo(() => {
    if (!showAngleLabels) return null;
    const result: React.ReactNode[] = [];
    const labelR = maxRadius + 0.6;
    for (let theta = 0; theta < 2 * Math.PI - 0.01; theta += angleStep) {
      const pt = toDesign(labelR * Math.cos(theta), labelR * Math.sin(theta));
      result.push(
        <text
          key={`alabel-${theta.toFixed(3)}`}
          x={pt.x}
          y={pt.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill={MATH_COLORS.labelTextLight}
          fontSize={fontScale(9)}
          fontFamily="monospace"
          className="select-none"
        >
          {angleLabel(theta)}
        </text>,
      );
    }
    return result;
  }, [showAngleLabels, maxRadius, angleStep, originX, originY, scaleX]);

  // 半径标签
  const radiusLabels = React.useMemo(() => {
    if (!showRadiusLabels) return null;
    const result: React.ReactNode[] = [];
    for (let r = radiusStep; r <= maxRadius; r += radiusStep) {
      const pt = toDesign(r, 0);
      result.push(
        <text
          key={`rlabel-${r}`}
          x={pt.x + 4}
          y={pt.y - 6}
          textAnchor="start"
          fill={MATH_COLORS.labelTextLight}
          fontSize={fontScale(9)}
          fontFamily="monospace"
          className="select-none"
        >
          {r}
        </text>,
      );
    }
    return result;
  }, [showRadiusLabels, maxRadius, radiusStep, originX, originY, scaleX]);

  // 主轴线（实线，稍粗）
  const { xMin, xMax, yMin, yMax } = scale;
  const xAxisLeft = toDesign(xMin, 0);
  const xAxisRight = toDesign(xMax, 0);
  const yAxisTop = toDesign(0, yMax);
  const yAxisBottom = toDesign(0, yMin);

  return (
    <g>
      {/* 主轴 */}
      <line
        x1={xAxisLeft.x}
        y1={xAxisLeft.y}
        x2={xAxisRight.x}
        y2={xAxisRight.y}
        stroke={axisColor}
        strokeWidth={1.5}
      />
      <line
        x1={yAxisTop.x}
        y1={yAxisTop.y}
        x2={yAxisBottom.x}
        y2={yAxisBottom.y}
        stroke={axisColor}
        strokeWidth={1.5}
      />

      {/* 同心圆 */}
      {circles}

      {/* 角度线 */}
      {angleLines}

      {/* 角度标签 */}
      {angleLabels}

      {/* 半径标签 */}
      {radiusLabels}

      {/* 原点标记 */}
      <circle cx={originX} cy={originY} r={2.5} fill={axisColor} />
    </g>
  );
};
