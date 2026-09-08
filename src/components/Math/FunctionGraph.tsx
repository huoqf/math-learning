import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";

interface FunctionGraphProps {
  /** 待绘制的数学单值函数 f(x) */
  fn: (x: number) => number;
  /** 场景比例尺（提供视口 xMin, xMax, yMin, yMax） */
  scale: SceneScale;
  /** 曲线颜色 Token */
  color: string;
  /** 线宽，默认 2 */
  strokeWidth?: number;
  /** 虚线样式，如 '4 3' */
  strokeDasharray?: string;
  /** 采样密度点数，默认 300 */
  samples?: number;
  /**
   * 数学客观定义域 [min, max]（如对数 [0.001, Infinity]）。
   * 组件内部自动将其与当前视口 [xMin, xMax] 取交集，无需业务层手动做 clipFn 包装。
   */
  domain?: [number, number];
  /**
   * 显式指定局部绘制横坐标区间 [min, max]（如仅绘制割线/弦线等局部线段）。
   * 若不传，默认自动铺满当前视口的全部可视区域。
   */
  xRange?: [number, number];
}

/**
 * 连续数学函数曲线绘制组件 (FunctionGraph)
 * - 默认行为：自动铺满当前可视视口，绝不发生非预期的两端悬空截断；
 * - 定义域支持：通过 domain 属性自动与视口求交集并优雅采样，杜绝 NaN 飞线；
 * - 容错过滤：自动过滤非数、无效溢出点，保持平滑连续的 Path 绘制。
 */
export const FunctionGraph: React.FC<FunctionGraphProps> = ({
  fn,
  scale,
  color,
  strokeWidth = 2,
  strokeDasharray,
  samples = 300,
  domain,
  xRange,
}) => {
  const { xMin, xMax, yMin, yMax } = scale;

  const pathD = React.useMemo(() => {
    // 1. 确定基准绘制区间：显式 xRange 优先，未指定则全视口铺满 [xMin, xMax]
    let startX = xRange ? Math.max(xMin, xRange[0]) : xMin;
    let endX = xRange ? Math.min(xMax, xRange[1]) : xMax;

    // 2. 与客观数学定义域取交集
    if (domain) {
      startX = Math.max(startX, domain[0]);
      endX = Math.min(endX, domain[1]);
    }

    // 若交集为空，不渲染
    if (startX >= endX || !Number.isFinite(startX) || !Number.isFinite(endX)) {
      return "";
    }

    const step = (endX - startX) / samples;
    let d = "";
    let isDrawing = false;

    // 为防止局部斜率极大导致的锯齿，在交集定义域内对 x 进行高密度等距采样
    for (let i = 0; i <= samples; i++) {
      const x = startX + i * step;
      let y = NaN;

      try {
        y = fn(x);
      } catch {
        y = NaN;
      }

      // 验证有效性：必须是有限实数，且在纵向显示区间做一定容错缓冲（防止超大浮点数撑爆 SVG 路径）
      const isValid =
        Number.isFinite(y) &&
        !Number.isNaN(y) &&
        y >= yMin - (yMax - yMin) * 2 &&
        y <= yMax + (yMax - yMin) * 2;

      if (isValid) {
        const pt = mathToDesign(x, y, scale);
        if (!isDrawing) {
          d += `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
          isDrawing = true;
        } else {
          d += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
        }
      } else {
        // 遇到无定义或突变溢出点，断开当前曲线片段
        isDrawing = false;
      }
    }

    return d;
  }, [fn, scale, xMin, xMax, yMin, yMax, samples, domain, xRange]);

  if (!pathD) return null;

  return (
    <path
      d={pathD}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};
