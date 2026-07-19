import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CALCULUS_COLORS } from "@/theme";

interface IntervalShadowProps {
  /** 函数 f(x) */
  fn: (x: number) => number;
  /** 区间左端点（数学坐标） */
  x1: number;
  /** 区间右端点（数学坐标） */
  x2: number;
  /** 场景比例尺 */
  scale: SceneScale;
  /** 填充颜色（默认半透明蓝） */
  fillColor?: string;
  /** 边框颜色 */
  strokeColor?: string;
  /** 边框宽度 */
  strokeWidth?: number;
  /** 采样点数 */
  samples?: number;
  /** 是否填充到 X 轴（默认 true）；false 时填充到 baselineY */
  fillToAxis?: boolean;
  /** fillToAxis=false 时的基准 Y 值（数学坐标），默认 0 */
  baselineY?: number;
}

/**
 * 区间阴影组件
 * 在 [x1, x2] 区间内，填充函数曲线与 X 轴之间的区域
 * 适用：一元二次不等式解集、定积分面积可视化
 */
export const IntervalShadow: React.FC<IntervalShadowProps> = ({
  fn,
  x1,
  x2,
  scale,
  fillColor = CALCULUS_COLORS.areaFill,
  strokeColor = MATH_COLORS.function,
  strokeWidth = 1,
  samples = 100,
  fillToAxis = true,
  baselineY = 0,
}) => {
  const pathD = useMemo(() => {
    const clampedX1 = Math.max(x1, scale.xMin);
    const clampedX2 = Math.min(x2, scale.xMax);
    if (clampedX2 <= clampedX1) return "";

    const step = (clampedX2 - clampedX1) / samples;
    const axisY = fillToAxis ? 0 : baselineY;

    // 构建上半路径（函数曲线）
    const topPoints: string[] = [];
    const bottomPoints: string[] = [];

    for (let i = 0; i <= samples; i++) {
      const mx = clampedX1 + i * step;
      const my = fn(mx);
      if (!Number.isFinite(my)) continue;

      const pt = mathToDesign(mx, my, scale);
      const axisPt = mathToDesign(mx, axisY, scale);

      topPoints.push(
        `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`,
      );
      bottomPoints.unshift(`${axisPt.x.toFixed(2)} ${axisPt.y.toFixed(2)}`);
    }

    if (topPoints.length < 2) return "";

    // 闭合路径：曲线 → X 轴 → 回到起点
    const d = [
      topPoints.join(" "),
      `L ${bottomPoints[0]} ${bottomPoints
        .slice(1)
        .map((p) => `L ${p}`)
        .join(" ")}`,
      "Z",
    ].join(" ");

    return d;
  }, [fn, x1, x2, scale, samples, fillToAxis, baselineY]);

  if (!pathD) return null;

  return (
    <path
      d={pathD}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      opacity={0.6}
    />
  );
};
