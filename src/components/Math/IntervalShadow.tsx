import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS, CALCULUS_COLORS } from "@/theme";

/**
 * 阴影下边界的语义（必选，杜绝"不声明就默认填到 x 轴"的语义漂移）：
 * - axis       曲线与 x 轴（y = 0）之间的区域（如二次不等式解集、定积分面积）
 * - horizontal 曲线与水平线 y = value 之间的区域（如 f(x) < a 的违背区间）
 * - curve      两条曲线之间的区域（如 f(x) 与 g(x) 的大小比较）
 */
export type ShadowBaseline =
  | { kind: "axis" }
  | { kind: "horizontal"; y: number }
  | { kind: "curve"; fn: (x: number) => number };

interface IntervalShadowProps {
  /** 上边界函数 f(x) */
  fn: (x: number) => number;
  /** 区间左端点（数学坐标） */
  x1: number;
  /** 区间右端点（数学坐标） */
  x2: number;
  /** 场景比例尺 */
  scale: SceneScale;
  /** 阴影下边界语义（必选） */
  baseline: ShadowBaseline;
  /** 填充颜色（默认半透明蓝） */
  fillColor?: string;
  /** 边框颜色 */
  strokeColor?: string;
  /** 边框宽度 */
  strokeWidth?: number;
  /** 采样点数 */
  samples?: number;
}

/**
 * 区间阴影组件
 * 在 [x1, x2] 区间内，填充函数曲线与 baseline 指定的下边界之间的区域
 */
export const IntervalShadow: React.FC<IntervalShadowProps> = ({
  fn,
  x1,
  x2,
  scale,
  baseline,
  fillColor = CALCULUS_COLORS.areaFill,
  strokeColor = MATH_COLORS.function,
  strokeWidth = 1,
  samples = 100,
}) => {
  const pathD = useMemo(() => {
    const clampedX1 = Math.max(x1, scale.xMin);
    const clampedX2 = Math.min(x2, scale.xMax);
    if (clampedX2 <= clampedX1) return "";

    const step = (clampedX2 - clampedX1) / samples;
    const baseFn =
      baseline.kind === "curve"
        ? baseline.fn
        : baseline.kind === "horizontal"
          ? () => baseline.y
          : () => 0;

    // 构建上半路径（函数曲线）
    const topPoints: string[] = [];
    const bottomPoints: string[] = [];

    for (let i = 0; i <= samples; i++) {
      const mx = clampedX1 + i * step;
      const my = fn(mx);
      const by = baseFn(mx);
      if (!Number.isFinite(my) || !Number.isFinite(by)) continue;

      const pt = mathToDesign(mx, my, scale);
      const axisPt = mathToDesign(mx, by, scale);

      topPoints.push(
        `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`,
      );
      bottomPoints.unshift(`${axisPt.x.toFixed(2)} ${axisPt.y.toFixed(2)}`);
    }

    if (topPoints.length < 2) return "";

    // 闭合路径：曲线 → 下边界 → 回到起点
    const d = [
      topPoints.join(" "),
      `L ${bottomPoints[0]} ${bottomPoints
        .slice(1)
        .map((p) => `L ${p}`)
        .join(" ")}`,
      "Z",
    ].join(" ");

    return d;
  }, [fn, x1, x2, scale, samples, baseline]);

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
