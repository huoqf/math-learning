/* eslint-disable react-refresh/only-export-components */
/**
 * src/features/sequence/components/RecurrenceShared.tsx
 * RecurrenceScene 各子场景共享的公共类型与通用组件
 */
import React from "react";
import type { SceneScale, ViewportInfo } from "@/hooks";

/** 递推数列子场景公共 props（主分发器与各子场景复用） */
export interface RecurrenceSceneBaseProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  fontScale: (v: number) => number;
  highlightN: number;
  onSelectN?: (n: number) => void;
  xStep?: number;
  yStep?: number;
}

/** 从参数中安全解析项数 N（钳制到 [4, 12]） */
export function resolveN(params: Record<string, number>): number {
  return Math.min(12, Math.max(4, Math.round(params.N ?? 8)));
}

/** 图例框右上角起始横坐标 */
export function legendXOf(vp: ViewportInfo): number {
  return Math.max(450, vp.designVisibleW - 240);
}

/**
 * 标准 SVG 数学下标标注组件：完美渲染 a_n = 3.0, b_1 = -5.2 等数学结构
 */
interface MathSubTextProps {
  x: number;
  y: number;
  base: string;
  sub?: string | number;
  val?: string | number;
  fill: string;
  fontScale: (v: number) => number;
  fontSize?: number;
  fontWeight?: string;
  suffix?: string;
}

export const MathSubText: React.FC<MathSubTextProps> = ({
  x,
  y,
  base,
  sub,
  val,
  fill,
  fontScale,
  fontSize = 11,
  fontWeight = "bold",
  suffix = "",
}) => {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill={fill}
      fontSize={fontScale(fontSize)}
      fontWeight={fontWeight}
    >
      <tspan fontStyle="italic">{base}</tspan>
      {sub !== undefined && (
        <tspan dy={fontScale(3)} fontSize={fontScale(fontSize * 0.78)}>
          {sub}
        </tspan>
      )}
      {val !== undefined && (
        <tspan dy={sub !== undefined ? -fontScale(3) : 0}>
          {` = ${val}${suffix}`}
        </tspan>
      )}
    </text>
  );
};
