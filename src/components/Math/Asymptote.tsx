import React, { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { GEOMETRY_COLORS, MATH_COLORS } from "@/theme";

interface AsymptoteProps {
  /** 渐近线类型 */
  type: "vertical" | "horizontal" | "oblique";
  /** 垂直渐近线 x 值 / 水平渐近线 y 值 / 斜渐近线斜率 k */
  value: number;
  /** 斜渐近线截距 b（仅 oblique 类型） */
  intercept?: number;
  /** 场景比例尺 */
  scale: SceneScale;
  /** 线条颜色 */
  color?: string;
  /** 标签文字 */
  label?: string;
  /** 字号缩放函数，默认原样返回。推荐传入 canvasSize.font 以适配不同屏幕尺寸 */
  fontScale?: (v: number) => number;
}

/**
 * 渐近线组件
 * 适用：双曲线、正切函数、对数/指数函数
 * 提供虚线及标注文字，帮助学生理解极限逼近概念
 */
export const Asymptote: React.FC<AsymptoteProps> = ({
  type,
  value,
  intercept = 0,
  scale,
  color = GEOMETRY_COLORS.asymptote,
  label,
  fontScale = (v) => v,
}) => {
  const line = useMemo(() => {
    if (type === "vertical") {
      // 垂直渐近线 x = value
      const topPt = mathToDesign(value, scale.yMax, scale);
      const bottomPt = mathToDesign(value, scale.yMin, scale);
      return {
        x1: topPt.x,
        y1: topPt.y,
        x2: bottomPt.x,
        y2: bottomPt.y,
        labelText: label ?? `x = ${value}`,
        labelX: topPt.x + 6,
        labelY: topPt.y + 14,
      };
    }

    if (type === "horizontal") {
      // 水平渐近线 y = value
      const leftPt = mathToDesign(scale.xMin, value, scale);
      const rightPt = mathToDesign(scale.xMax, value, scale);
      return {
        x1: leftPt.x,
        y1: leftPt.y,
        x2: rightPt.x,
        y2: rightPt.y,
        labelText: label ?? `y = ${value}`,
        labelX: rightPt.x - 6,
        labelY: rightPt.y - 6,
      };
    }

    // 斜渐近线 y = kx + b
    const x1 = scale.xMin;
    const y1 = value * x1 + intercept;
    const x2 = scale.xMax;
    const y2 = value * x2 + intercept;
    const p1 = mathToDesign(x1, y1, scale);
    const p2 = mathToDesign(x2, y2, scale);
    return {
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      labelText: label ?? `y = ${value}x + ${intercept}`,
      labelX: p2.x - 6,
      labelY: p2.y - 6,
    };
  }, [type, value, intercept, scale, label]);

  return (
    <g>
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />
      <text
        x={line.labelX}
        y={line.labelY}
        textAnchor="end"
        fill={MATH_COLORS.textMuted}
        fontSize={fontScale(9)}
        fontFamily="monospace"
        className="select-none pointer-events-none"
      >
        {line.labelText}
      </text>
    </g>
  );
};
