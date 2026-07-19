import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { CALCULUS_COLORS } from "@/theme";

interface TangentLineProps {
  /** 原函数 f(x) */
  fn: (x: number) => number;
  /** 切点 x₀（数学坐标） */
  x0: number;
  /** 场景比例尺 */
  scale: SceneScale;
  /** 切线颜色 */
  color?: string;
  /** 切线宽度 */
  strokeWidth?: number;
  /** 切线延伸长度（设计像素） */
  extend?: number;
  /** 数值差分步长（用于求导） */
  h?: number;
}

/**
 * 动态切线组件
 * 利用数值差分法求导，绘制函数在 x₀ 处的切线
 * 适用：导数的几何意义、圆/圆锥曲线切线
 */
export const TangentLine: React.FC<TangentLineProps> = ({
  fn,
  x0,
  scale,
  color = CALCULUS_COLORS.tangentLine,
  strokeWidth = 2,
  extend = 300,
  h = 1e-7,
}) => {
  const line = useMemo(() => {
    const y0 = fn(x0);
    if (!Number.isFinite(y0)) return null;

    // 数值差分求导：f'(x₀) ≈ (f(x₀+h) - f(x₀-h)) / (2h)
    const dydx = (fn(x0 + h) - fn(x0 - h)) / (2 * h);
    if (!Number.isFinite(dydx)) return null;

    // 切线方程：y = f(x₀) + f'(x₀)(x - x₀)
    // 在设计坐标系中取两个远点
    const dxDesign = extend;
    // 数学坐标偏移 = 设计像素 / scaleX
    const dxMath = dxDesign / scale.scaleX;
    const x1 = x0 - dxMath;
    const y1 = y0 + dydx * (x1 - x0);
    const x2 = x0 + dxMath;
    const y2 = y0 + dydx * (x2 - x0);

    const p1 = mathToDesign(x1, y1, scale);
    const p2 = mathToDesign(x2, y2, scale);

    return { p1, p2, slope: dydx };
  }, [fn, x0, scale, extend, h]);

  if (!line) return null;

  return (
    <line
      x1={line.p1.x}
      y1={line.p1.y}
      x2={line.p2.x}
      y2={line.p2.y}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray="6 3"
    />
  );
};
