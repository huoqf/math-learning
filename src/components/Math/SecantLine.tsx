import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { CALCULUS_COLORS } from "@/theme";

interface SecantLineProps {
  /** 原函数 f(x) */
  fn: (x: number) => number;
  /** 割线两点 x 坐标（数学坐标） */
  x1: number;
  x2: number;
  /** 场景比例尺 */
  scale: SceneScale;
  /** 割线颜色 */
  color?: string;
  /** 割线宽度 */
  strokeWidth?: number;
  /** 是否显示 Δx/Δy 直角三角形 */
  showTriangle?: boolean;
  /** 延伸长度（设计像素） */
  extend?: number;
}

/**
 * 割线组件
 * 连接函数上两点，绘制割线并可选显示 Δx/Δy 直角三角形
 * 适用：割线逼近切线（导数定义）、割线斜率可视化
 */
export const SecantLine: React.FC<SecantLineProps> = ({
  fn,
  x1,
  x2,
  scale,
  color = CALCULUS_COLORS.secantLine,
  strokeWidth = 2,
  showTriangle = true,
  extend = 300,
}) => {
  const result = useMemo(() => {
    const y1 = fn(x1);
    const y2 = fn(x2);
    if (!Number.isFinite(y1) || !Number.isFinite(y2)) return null;
    if (Math.abs(x2 - x1) < 1e-12) return null;

    const slope = (y2 - y1) / (x2 - x1);

    // 延伸割线
    const dxMath = extend / scale.scaleX;
    const extX1 = x1 - dxMath;
    const extY1 = y1 + slope * (extX1 - x1);
    const extX2 = x2 + dxMath;
    const extY2 = y2 + slope * (extX2 - x2);

    const p1 = mathToDesign(extX1, extY1, scale);
    const p2 = mathToDesign(extX2, extY2, scale);
    const pA = mathToDesign(x1, y1, scale);
    const pB = mathToDesign(x2, y2, scale);
    // 直角三角形的直角点：(x2, y1)
    const pC = mathToDesign(x2, y1, scale);

    return { p1, p2, pA, pB, pC, slope, dy: y2 - y1, dx: x2 - x1 };
  }, [fn, x1, x2, scale, extend]);

  if (!result) return null;

  return (
    <g>
      {/* 割线 */}
      <line
        x1={result.p1.x}
        y1={result.p1.y}
        x2={result.p2.x}
        y2={result.p2.y}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray="4 4"
      />
      {/* 两个交点 */}
      <circle cx={result.pA.x} cy={result.pA.y} r={3} fill={color} />
      <circle cx={result.pB.x} cy={result.pB.y} r={3} fill={color} />
      {/* Δx/Δy 直角三角形 */}
      {showTriangle && (
        <g opacity={0.5}>
          {/* Δx 水平线 */}
          <line
            x1={result.pA.x}
            y1={result.pA.y}
            x2={result.pC.x}
            y2={result.pC.y}
            stroke={CALCULUS_COLORS.deltaHighlight}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          {/* Δy 垂直线 */}
          <line
            x1={result.pC.x}
            y1={result.pC.y}
            x2={result.pB.x}
            y2={result.pB.y}
            stroke={CALCULUS_COLORS.deltaHighlight}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
        </g>
      )}
    </g>
  );
};
