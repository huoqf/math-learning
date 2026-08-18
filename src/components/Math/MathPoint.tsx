import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { MATH_COLORS } from "@/theme";
import type { PlacedLabel } from "@/utils/labelAvoider";

export type MathPointVariant =
  | "solid" // 实心点（交点、顶点、切点、闭区间端点、坐标点等）
  | "hollow" // 空心点（去心邻域、开区间端点、无定义点）
  | "focus" // 焦点 / 极值点 / 关键特征点
  | "foot"; // 垂足 / 投影点

export type LabelPosition =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

export interface MathPointProps {
  /** 数学坐标 x（若传入则与 cy, scale 联合计算；若不传则使用 designX） */
  cx?: number;
  /** 数学坐标 y */
  cy?: number;
  /** 场景比例尺（配合 cx, cy 使用） */
  scale?: SceneScale;
  /** 直接传入设计坐标 x（当未提供 cx/cy 时使用） */
  x?: number;
  /** 直接传入设计坐标 y（当未提供 cx/cy 时使用） */
  y?: number;
  /** 点的形态变体，默认 'solid' */
  variant?: MathPointVariant;
  /** 点的颜色，实心点为填充色，空心点为描边色。默认 MATH_COLORS.labelText */
  color?: string;
  /** 自定义点半径。若不传则根据 variant 自动按数学习惯设定（solid: 3.2, hollow: 3.8, focus: 3.8, foot: 2.8） */
  r?: number;
  /** 标签文字 */
  label?: string;
  /** 标签位置方向，默认 'top' */
  labelPosition?: LabelPosition;
  /** 标签颜色，默认继承 color 或使用 MATH_COLORS.labelText */
  labelColor?: string;
  /** 标签唯一标识（用于匹配 placedLabels 避让） */
  labelKey?: string;
  /** 预计算的避让标签位置（来自 avoidLabels()） */
  placedLabels?: PlacedLabel[];
  /** 字号与尺寸缩放函数 */
  fontScale?: (v: number) => number;
  /** 额外 className */
  className?: string;
  /** 额外透明度 */
  opacity?: number;
}

/**
 * 纯数学几何点组件 (MathPoint)
 * 严格遵循中学及高等数学几何制图习惯：
 * - solid: 精细实心点 (r ≈ 3.2)，用于顶点、交点、切点、端点
 * - hollow: 纯白填充 + 色彩描边空心点 (r ≈ 3.8)，用于去心邻域、开区间断点
 * - focus: 醒目特征点 (r ≈ 3.8)
 * - foot: 垂足小圆点 (r ≈ 2.8)
 *
 * 注：纯数学点不带拖拽手势及交互手柄光晕。如需用户鼠标交互拖拽，请使用 `InteractivePoint`。
 */
export const MathPoint: React.FC<MathPointProps> = ({
  cx,
  cy,
  scale,
  x,
  y,
  variant = "solid",
  color = MATH_COLORS.labelText,
  r,
  label,
  labelPosition = "top",
  labelColor,
  labelKey,
  placedLabels,
  fontScale = (v) => v,
  className = "",
  opacity = 1,
}) => {
  // 计算设计坐标
  let ptX = 0;
  let ptY = 0;
  if (cx !== undefined && cy !== undefined && scale) {
    const pt = mathToDesign(cx, cy, scale);
    ptX = pt.x;
    ptY = pt.y;
  } else if (x !== undefined && y !== undefined) {
    ptX = x;
    ptY = y;
  }

  // 根据数学习惯计算默认半径
  const finalR =
    r ??
    (variant === "solid"
      ? 3.2
      : variant === "hollow"
        ? 3.8
        : variant === "focus"
          ? 3.8
          : 2.8);

  // 标签偏移计算
  const placedLabel =
    placedLabels && labelKey
      ? placedLabels.find((p) => p.key === labelKey)
      : undefined;

  let textDx = 0;
  let textDy = 0;
  let textAnchor: "start" | "middle" | "end" = "middle";

  if (placedLabel) {
    textDy = placedLabel.finalDy;
    textAnchor = placedLabel.anchor ?? "middle";
  } else {
    const offset = finalR + 5;
    switch (labelPosition) {
      case "top":
        textDy = -offset;
        textAnchor = "middle";
        break;
      case "bottom":
        textDy = offset + 8;
        textAnchor = "middle";
        break;
      case "left":
        textDx = -offset;
        textDy = 4;
        textAnchor = "end";
        break;
      case "right":
        textDx = offset;
        textDy = 4;
        textAnchor = "start";
        break;
      case "top-right":
        textDx = offset * 0.7;
        textDy = -offset * 0.7;
        textAnchor = "start";
        break;
      case "top-left":
        textDx = -offset * 0.7;
        textDy = -offset * 0.7;
        textAnchor = "end";
        break;
      case "bottom-right":
        textDx = offset * 0.7;
        textDy = offset * 0.7 + 8;
        textAnchor = "start";
        break;
      case "bottom-left":
        textDx = -offset * 0.7;
        textDy = offset * 0.7 + 8;
        textAnchor = "end";
        break;
    }
  }

  return (
    <g
      className={`pointer-events-none select-none ${className}`}
      opacity={opacity}
    >
      {/* 空心点：去心邻域 / 开区间断点 */}
      {variant === "hollow" && (
        <circle
          cx={ptX}
          cy={ptY}
          r={finalR}
          fill={MATH_COLORS.white}
          stroke={color}
          strokeWidth={1.8}
        />
      )}

      {/* 实心点 / 焦点 / 垂足 */}
      {variant !== "hollow" && (
        <circle
          cx={ptX}
          cy={ptY}
          r={finalR}
          fill={color}
          stroke={variant === "focus" ? MATH_COLORS.white : undefined}
          strokeWidth={variant === "focus" ? 1 : undefined}
        />
      )}

      {/* 标签 */}
      {label && (
        <text
          x={ptX + textDx}
          y={ptY}
          dy={textDy}
          textAnchor={textAnchor}
          fill={labelColor ?? color ?? MATH_COLORS.labelText}
          fontSize={fontScale(11)}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
        >
          {label}
        </text>
      )}
    </g>
  );
};
