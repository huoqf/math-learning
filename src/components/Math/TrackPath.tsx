import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS } from "@/theme";

interface TrackPathProps {
  /** 轨迹参数方程：t → {x, y} */
  parametric: (t: number) => { x: number; y: number };
  /** 参数 t 的范围 [tMin, tMax] */
  tRange: [number, number];
  /** 当前参数值（用于标记当前位置） */
  tCurrent: number;
  /** 场景比例尺 */
  scale: SceneScale;
  /** 轨迹线颜色 */
  color?: string;
  /** 轨迹线宽度 */
  strokeWidth?: number;
  /** 采样点数 */
  samples?: number;
  /** 是否显示动点标记 */
  showDot?: boolean;
  /** 动点半径 */
  dotRadius?: number;
}

/**
 * 动点轨迹组件
 * 随着参数变化，在画布上留下动点的移动路径
 * 适用：圆锥曲线的参数方程、参数化轨迹
 */
export const TrackPath: React.FC<TrackPathProps> = ({
  parametric,
  tRange,
  tCurrent,
  scale,
  color = MATH_COLORS.function,
  strokeWidth = 2,
  samples = 200,
  showDot = true,
  dotRadius = 5,
}) => {
  const [tMin, tMax] = tRange;
  const step = (tMax - tMin) / samples;

  // 构建轨迹路径
  const pathD = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = tMin + i * step;
      const { x, y } = parametric(t);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const pt = mathToDesign(x, y, scale);
      points.push(
        `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`,
      );
    }
    return points.join(" ");
  }, [parametric, tMin, tMax, step, samples, scale]);

  // 当前动点位置
  const currentDot = useMemo(() => {
    if (!showDot) return null;
    const { x, y } = parametric(tCurrent);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return mathToDesign(x, y, scale);
  }, [parametric, tCurrent, scale, showDot]);

  if (!pathD) return null;

  return (
    <g>
      {/* 轨迹线 */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* 动点 */}
      {currentDot && (
        <circle
          cx={currentDot.x}
          cy={currentDot.y}
          r={dotRadius}
          fill={color}
          stroke={MATH_COLORS.white}
          strokeWidth={2}
        />
      )}
    </g>
  );
};
