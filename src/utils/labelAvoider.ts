/**
 * 标注避让工具 — 贪心重试 + 优先级 + 边界裁剪
 *
 * 针对点锚定标注（InteractivePoint、VectorArrow 等）的碰撞检测。
 * 策略：按优先级降序放置，检测碰撞后向上重试，最多 N 次。
 *
 * 复杂度：O(N²)，对 <20 个标签足够。
 *
 * 用法：在 Scene 组件的 useMemo 中调用，返回放置后的标注数组。
 */

import type { FontScaler } from "@/theme";

/** 标注矩形（设计坐标系） */
interface LabelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 标注入口（调用方提供） */
export interface LabelEntry {
  key: string;
  text: string;
  /** 设计坐标 x */
  x: number;
  /** 设计坐标 y（通常是点的 y 坐标） */
  y: number;
  /** 文本锚点 */
  anchor: "start" | "middle" | "end";
  /** 初始垂直偏移（负值 = 向上） */
  dy: number;
  /** 优先级（越大越优先显示），默认 0 */
  priority?: number;
}

/** 放置后的标注 */
export interface PlacedLabel extends LabelEntry {
  rect: LabelRect;
  finalDy: number;
}

/** 两个矩形是否重叠 */
function overlaps(a: LabelRect, b: LabelRect): boolean {
  return !(
    a.x + a.w < b.x ||
    b.x + b.w < a.x ||
    a.y + a.h < b.y ||
    b.y + b.h < a.y
  );
}

/**
 * 估算文本宽度（monospace 字体）
 *
 * - 英文/数字：~6px
 * - 中文：~10px
 * - 固定 padding：8px
 */
function estimateW(text: string, fontScale: FontScaler): number {
  let w = 8;
  for (const ch of text) {
    if (ch.charCodeAt(0) > 0x7f) {
      w += 10;
    } else if (/\d/.test(ch)) {
      w += 5.5;
    } else {
      w += 6.5;
    }
  }
  return w * fontScale(1);
}

/** 将矩形裁剪到画布边界内 */
function clampRect(
  rect: LabelRect,
  bounds: { width: number; height: number },
): LabelRect {
  return {
    x: Math.max(0, Math.min(rect.x, bounds.width - rect.w)),
    y: Math.max(0, Math.min(rect.y, bounds.height - rect.h)),
    w: rect.w,
    h: rect.h,
  };
}

/**
 * 标签避让：贪心重试 + 优先级 + 边界裁剪
 *
 * @param entries - 标注入口数组
 * @param options - 配置项
 * @returns 放置后的标注数组（含最终矩形和 dy 偏移）
 *
 * @example
 * ```tsx
 * const placed = avoidLabels([
 *   { key: "P", text: "P(1.5, 2.0)", x: 100, y: 80, anchor: "middle", dy: -12, priority: 2 },
 *   { key: "P'", text: "P'(-1.5, 2.0)", x: 200, y: 85, anchor: "middle", dy: -12, priority: 1 },
 * ])
 *
 * placed.forEach(p => (
 *   <text key={p.key} x={p.x} y={p.y} dy={p.finalDy} textAnchor={p.anchor}>{p.text}</text>
 * ))
 * ```
 */
export function avoidLabels(
  entries: LabelEntry[],
  options?: {
    /** 最大重试次数，默认 5 */
    maxAttempts?: number;
    /** 每次重试的垂直步长（px），默认 16 */
    stepY?: number;
    /** 字体缩放函数 */
    fontScale?: FontScaler;
    /** 画布边界（用于裁剪越界标签） */
    bounds?: { width: number; height: number };
  },
): PlacedLabel[] {
  const {
    maxAttempts = 5,
    stepY = 16,
    fontScale = (n: number) => n,
    bounds,
  } = options ?? {};

  const labelH = fontScale(12);
  const placed: PlacedLabel[] = [];

  // 按优先级降序排列（高优先级先放置，不会被避让）
  const sorted = [...entries].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  );

  for (const e of sorted) {
    const w = estimateW(e.text, fontScale);
    const xOff = e.anchor === "start" ? 0 : e.anchor === "end" ? -w : -w / 2;
    let dy = e.dy;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let rect: LabelRect = {
        x: e.x + xOff,
        y: e.y + dy - labelH,
        w,
        h: labelH,
      };

      if (bounds) {
        rect = clampRect(rect, bounds);
      }

      const hit = placed.some((p) => overlaps(p.rect, rect));
      if (!hit) {
        placed.push({ ...e, rect, finalDy: dy });
        break;
      }
      dy -= stepY;
    }
  }

  return placed;
}

/**
 * 简化版：仅计算偏移量（兼容旧接口）
 *
 * 如果只需要 dx/dy 偏移而不关心放置结果，可用此函数。
 */
export function avoidLabelOffsets(
  entries: LabelEntry[],
  options?: {
    maxAttempts?: number;
    stepY?: number;
    fontScale?: FontScaler;
    bounds?: { width: number; height: number };
  },
): Array<{ dx: number; dy: number }> {
  const placed = avoidLabels(entries, options);
  const result: Array<{ dx: number; dy: number }> = [];

  for (const e of entries) {
    const p = placed.find((pl) => pl.key === e.key);
    result.push({
      dx: 0,
      dy: p ? p.finalDy - e.dy : 0,
    });
  }

  return result;
}
