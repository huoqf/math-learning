import React, { useMemo } from "react";
import { resolveLabelPlacements, type LabelItem } from "@/utils/labelOverlap";
import { MATH_COLORS } from "@/theme";

export interface SceneLabelGroupProps {
  items: LabelItem[];
  fontScale?: (v: number) => number;
  offset?: number;
  className?: string;
}

/**
 * 2D 画布智能学术标签组组件
 * 自动应用 8 向碰撞检测与多点重合互斥分流算法，统一提供防穿透描边渲染
 */
export const SceneLabelGroup: React.FC<SceneLabelGroupProps> = ({
  items,
  fontScale = (v) => v,
  offset = 6,
  className,
}) => {
  const placedLabels = useMemo(() => {
    if (!items || items.length === 0) return [];
    return resolveLabelPlacements(items, { offset });
  }, [items, offset]);

  if (placedLabels.length === 0) return null;

  return (
    <g
      className={`labels-layer pointer-events-none select-none ${className || ""}`}
    >
      {placedLabels.map((lbl) => (
        <text
          key={lbl.key}
          x={lbl.textX}
          y={lbl.textY}
          textAnchor={lbl.textAnchor}
          dominantBaseline={lbl.dominantBaseline}
          fill={lbl.color ?? MATH_COLORS.labelText}
          fontSize={lbl.fontSize ?? fontScale(12)}
          fontWeight="bold"
          stroke="#ffffff"
          strokeWidth={3}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {lbl.text}
        </text>
      ))}
    </g>
  );
};
