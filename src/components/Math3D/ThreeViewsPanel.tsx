/**
 * 三视图版面渲染：2x2 SVG 网格，复用 MATH_COLORS 颜色体系。
 *
 * 国标第一角投影布局——
 * 正视图(左上) / 侧视图(右上，与正视图高平齐) / 俯视图(左下，与正视图长对正)。
 * 右下角留空，预留图例/比例尺扩展位。
 *
 * 居中策略：以该视图全部绘制内容的包围盒几何中心为锚点，
 * 而非数学坐标原点——否则非对称高度轴（v∈[0,H]）会导致画布下半区永久浪费。
 * 改用包围盒中心不破坏跨视图对齐：正视图与俯视图共享 x 轴取值范围 → u 方向中心一致（长对正）；
 * 正视图与侧视图共享高度轴 → v 方向中心一致（高平齐）。
 */

import { useMemo } from "react";
import type {
  ViewDrawing,
  ViewName,
  Point2D,
} from "@/math3d/orthographicProjection";
import { MATH_COLORS } from "@/theme/math/colors";

interface ThreeViewsPanelProps {
  views: Record<ViewName, ViewDrawing>;
  /** 图纸缩放基准：取物体三向包围盒最大边长 */
  extent: number;
}

const VIEW_LABELS: Record<ViewName, string> = {
  front: "正视图",
  side: "侧视图",
  top: "俯视图",
};

function computeBBoxCenter(drawing: ViewDrawing): { cx: number; cy: number } {
  const points: Point2D[] = [
    ...drawing.solid,
    ...drawing.dashed,
    ...drawing.centerline,
  ].flat();
  if (points.length === 0) return { cx: 0, cy: 0 };
  const us = points.map((p) => p.u);
  const vs = points.map((p) => p.v);
  return {
    cx: (Math.max(...us) + Math.min(...us)) / 2,
    cy: (Math.max(...vs) + Math.min(...vs)) / 2,
  };
}

function ViewBox({
  drawing,
  label,
  extent,
}: {
  drawing: ViewDrawing;
  label: string;
  extent: number;
}) {
  const pad = extent * 0.25;
  const size = extent + pad * 2;
  const { cx, cy } = useMemo(() => computeBBoxCenter(drawing), [drawing]);
  const toSvg = (p: Point2D) => ({
    x: p.u - cx + size / 2,
    y: size / 2 - (p.v - cy),
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-full w-full"
      role="img"
      aria-label={label}
    >
      {/* 点划线（对称轴/中心线） */}
      {drawing.centerline.map(([a, b], i) => {
        const pa = toSvg(a);
        const pb = toSvg(b);
        return (
          <line
            key={`c-${i}`}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke={MATH_COLORS.gridSubtle}
            strokeWidth={size * 0.003}
            strokeDasharray={`${size * 0.03},${size * 0.01},${size * 0.005},${size * 0.01}`}
          />
        );
      })}
      {/* 虚线（被遮挡的棱） */}
      {drawing.dashed.map(([a, b], i) => {
        const pa = toSvg(a);
        const pb = toSvg(b);
        return (
          <line
            key={`d-${i}`}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke={MATH_COLORS.line}
            strokeWidth={size * 0.004}
            strokeDasharray={`${size * 0.015},${size * 0.01}`}
          />
        );
      })}
      {/* 实线（可见轮廓/棱） */}
      {drawing.solid.map(([a, b], i) => {
        const pa = toSvg(a);
        const pb = toSvg(b);
        return (
          <line
            key={`s-${i}`}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke={MATH_COLORS.line}
            strokeWidth={size * 0.006}
          />
        );
      })}
      {/* 视图标签 */}
      <text
        x={size * 0.04}
        y={size * 0.08}
        fontSize={size * 0.05}
        fill={MATH_COLORS.label}
      >
        {label}
      </text>
    </svg>
  );
}

export function ThreeViewsPanel({ views, extent }: ThreeViewsPanelProps) {
  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-2 p-2">
      <div className="col-start-1 row-start-1 rounded border border-slate-200">
        <ViewBox
          drawing={views.front}
          label={VIEW_LABELS.front}
          extent={extent}
        />
      </div>
      <div className="col-start-2 row-start-1 rounded border border-slate-200">
        <ViewBox
          drawing={views.side}
          label={VIEW_LABELS.side}
          extent={extent}
        />
      </div>
      <div className="col-start-1 row-start-2 rounded border border-slate-200">
        <ViewBox drawing={views.top} label={VIEW_LABELS.top} extent={extent} />
      </div>
      {/* 右下角按国标版面惯例留空，预留图例/比例尺扩展位 */}
    </div>
  );
}
