import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS } from "@/theme";

interface CoordinateGridProps {
  scale: SceneScale;
  showGrid?: boolean;
  showLabels?: boolean;
  xStep?: number;
  yStep?: number;
  /** 字号缩放函数，默认原样返回 */
  fontScale?: (v: number) => number;
}

/** 格式化刻度数值：整数显示整数，非整数去除末尾无意义的 0 */
function formatTick(val: number): string {
  if (Math.abs(val - Math.round(val)) < 1e-4) {
    return Math.round(val).toString();
  }
  return Number(val.toFixed(2)).toString();
}

export const CoordinateGrid: React.FC<CoordinateGridProps> = ({
  scale,
  showGrid = false, // 默认纯净高中数学坐标系 (无背景虚线方格干扰)
  showLabels = true,
  xStep = 1,
  yStep = 1,
  fontScale = (v) => v,
}) => {
  const { xMin, xMax, yMin, yMax } = scale;

  // 生成网格线（若显式开启 showGrid）
  const gridLines = React.useMemo(() => {
    const lines: React.ReactNode[] = [];
    if (!showGrid) return lines;

    // 垂直网格线（X 轴刻度处）
    const xStart = Math.ceil(xMin / xStep) * xStep;
    const xEnd = Math.floor(xMax / xStep) * xStep;
    for (let x = xStart; x <= xEnd; x += xStep) {
      if (Math.abs(x) < 1e-9) continue; // 避开 Y 轴主轴
      const startPt = mathToDesign(x, yMin, scale);
      const endPt = mathToDesign(x, yMax, scale);
      lines.push(
        <line
          key={`grid-v-${x}`}
          x1={startPt.x}
          y1={startPt.y}
          x2={endPt.x}
          y2={endPt.y}
          stroke={MATH_COLORS.grid}
          strokeWidth={1}
          strokeDasharray="4 4"
        />,
      );
    }

    // 水平网格线（Y 轴刻度处）
    const yStart = Math.ceil(yMin / yStep) * yStep;
    const yEnd = Math.floor(yMax / yStep) * yStep;
    for (let y = yStart; y <= yEnd; y += yStep) {
      if (Math.abs(y) < 1e-9) continue; // 避开 X 轴主轴
      const startPt = mathToDesign(xMin, y, scale);
      const endPt = mathToDesign(xMax, y, scale);
      lines.push(
        <line
          key={`grid-h-${y}`}
          x1={startPt.x}
          y1={startPt.y}
          x2={endPt.x}
          y2={endPt.y}
          stroke={MATH_COLORS.grid}
          strokeWidth={1}
          strokeDasharray="4 4"
        />,
      );
    }

    return lines;
  }, [scale, showGrid, xStep, yStep, xMin, xMax, yMin, yMax]);

  // 生成刻度线与文本标签
  const ticksAndLabels = React.useMemo(() => {
    const elements: React.ReactNode[] = [];
    const tickSize = 3.5; // 刻度线半长 (px)

    // X 轴刻度
    const xStart = Math.ceil(xMin / xStep) * xStep;
    const xEnd = Math.floor(xMax / xStep) * xStep;
    for (let x = xStart; x <= xEnd; x += xStep) {
      if (Math.abs(x) < 1e-4) continue; // 避开原点

      const pt = mathToDesign(x, 0, scale);
      // 绘制刻度线
      elements.push(
        <line
          key={`tick-x-${x}`}
          x1={pt.x}
          y1={pt.y - tickSize}
          x2={pt.x}
          y2={pt.y + tickSize}
          stroke={MATH_COLORS.labelTextLight}
          strokeWidth={1.2}
        />,
      );

      // 绘制数值标签（统一格式化整数与小数）
      if (showLabels) {
        elements.push(
          <text
            key={`label-x-${x}`}
            x={pt.x}
            y={pt.y + fontScale(14)}
            textAnchor="middle"
            fill={MATH_COLORS.labelTextLight}
            fontSize={fontScale(10.5)}
            className="select-none font-sans"
          >
            {formatTick(x)}
          </text>,
        );
      }
    }

    // Y 轴刻度
    const yStart = Math.ceil(yMin / yStep) * yStep;
    const yEnd = Math.floor(yMax / yStep) * yStep;
    for (let y = yStart; y <= yEnd; y += yStep) {
      if (Math.abs(y) < 1e-4) continue; // 避开原点

      const pt = mathToDesign(0, y, scale);
      // 绘制刻度线
      elements.push(
        <line
          key={`tick-y-${y}`}
          x1={pt.x - tickSize}
          y1={pt.y}
          x2={pt.x + tickSize}
          y2={pt.y}
          stroke={MATH_COLORS.labelTextLight}
          strokeWidth={1.2}
        />,
      );

      // 绘制数值标签
      if (showLabels) {
        elements.push(
          <text
            key={`label-y-${y}`}
            x={pt.x - fontScale(6)}
            y={pt.y + fontScale(3.5)}
            textAnchor="end"
            fill={MATH_COLORS.labelTextLight}
            fontSize={fontScale(10.5)}
            className="select-none font-sans"
          >
            {formatTick(y)}
          </text>,
        );
      }
    }

    // 绘制原点 'O' (标准高中数学坐标原点标识，位于第三象限左下角)
    if (showLabels) {
      const ptZero = mathToDesign(0, 0, scale);
      elements.push(
        <text
          key="label-origin"
          x={ptZero.x - fontScale(6)}
          y={ptZero.y + fontScale(13)}
          textAnchor="end"
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(12)}
          fontStyle="italic"
          fontWeight="bold"
          className="select-none"
        >
          O
        </text>,
      );
    }

    return elements;
  }, [scale, showLabels, xStep, yStep, xMin, xMax, yMin, yMax, fontScale]);

  // 坐标轴两端主线及其端点
  const xAxisStart = mathToDesign(xMin, 0, scale);
  const xAxisEnd = mathToDesign(xMax, 0, scale);
  const yAxisStart = mathToDesign(0, yMin, scale);
  const yAxisEnd = mathToDesign(0, yMax, scale);

  return (
    <g>
      {/* 网格线背景 */}
      {gridLines}

      {/* 坐标轴主线（清晰标准深色） */}
      <line
        x1={xAxisStart.x}
        y1={xAxisStart.y}
        x2={xAxisEnd.x}
        y2={xAxisEnd.y}
        stroke={MATH_COLORS.labelTextLight}
        strokeWidth={1.5}
      />
      <line
        x1={yAxisStart.x}
        y1={yAxisStart.y}
        x2={yAxisEnd.x}
        y2={yAxisEnd.y}
        stroke={MATH_COLORS.labelTextLight}
        strokeWidth={1.5}
      />

      {/* 坐标轴方向箭头与标准数学斜体标签 */}
      {/* X 轴箭头与 x 标签 */}
      <polygon
        points={`${xAxisEnd.x},${xAxisEnd.y} ${xAxisEnd.x - 7},${xAxisEnd.y - 3.5} ${xAxisEnd.x - 7},${xAxisEnd.y + 3.5}`}
        fill={MATH_COLORS.labelTextLight}
      />
      <text
        x={xAxisEnd.x - fontScale(2)}
        y={xAxisEnd.y + fontScale(15)}
        textAnchor="middle"
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(13)}
        fontStyle="italic"
        fontWeight="bold"
        className="select-none"
      >
        x
      </text>

      {/* Y 轴箭头与 y 标签 */}
      <polygon
        points={`${yAxisEnd.x},${yAxisEnd.y} ${yAxisEnd.x - 3.5},${yAxisEnd.y + 7} ${yAxisEnd.x + 3.5},${yAxisEnd.y + 7}`}
        fill={MATH_COLORS.labelTextLight}
      />
      <text
        x={yAxisEnd.x - fontScale(12)}
        y={yAxisEnd.y + fontScale(10)}
        textAnchor="middle"
        fill={MATH_COLORS.labelText}
        fontSize={fontScale(13)}
        fontStyle="italic"
        fontWeight="bold"
        className="select-none"
      >
        y
      </text>

      {/* 刻度和标签 */}
      {ticksAndLabels}
    </g>
  );
};
