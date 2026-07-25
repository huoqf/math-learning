import React from "react";
import { MATH_COLORS } from "@/theme";

interface TooltipItem {
  label: string;
  value: string;
  color?: string;
}

interface HtmlTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  items: TooltipItem[];
  fontScale?: (v: number) => number;
}

/**
 * HTML overlay 版本的 tooltip，用于 Portal 渲染
 *
 * 通过 Portal 渲染到 document.body，避免 SVG 内的层级和裁剪问题。
 * 支持智能定位，自动避免超出视口边界。
 */
export const HtmlTooltip: React.FC<HtmlTooltipProps> = ({
  visible,
  x,
  y,
  items,
}) => {
  if (!visible || items.length === 0) return null;

  const lineHeight = 20;
  const padding = 10;
  const labelWidth = 68;

  // 智能定位：避免超出视口
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const offsetX = 16;
  const estimatedHeight = items.length * lineHeight + padding * 2;
  const estimatedWidth = 200;

  let left = x + offsetX;
  let top = y - estimatedHeight - 12;

  // 右侧超出
  if (left + estimatedWidth > viewportW - 8) {
    left = x - estimatedWidth - offsetX;
  }
  // 上方超出
  if (top < 8) {
    top = y + 16;
  }
  // 下方超出
  if (top + estimatedHeight > viewportH - 8) {
    top = viewportH - estimatedHeight - 8;
  }
  // 左侧超出
  if (left < 8) {
    left = 8;
  }

  return (
    <div className="fixed z-[9999] pointer-events-none" style={{ left, top }}>
      <div
        className="rounded-lg border border-neutral-200 bg-white shadow-lg"
        style={{ padding: `${padding}px 12px`, minWidth: 180 }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-baseline gap-3 whitespace-nowrap"
            style={{ height: lineHeight, lineHeight: `${lineHeight}px` }}
          >
            <span
              className="shrink-0 text-[11px]"
              style={{
                color: item.color ?? MATH_COLORS.labelTextLight,
                fontFamily: "monospace",
                width: labelWidth,
              }}
            >
              {item.label}
            </span>
            <span
              className="text-[11px] font-bold"
              style={{
                color: MATH_COLORS.labelText,
                fontFamily: "monospace",
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
