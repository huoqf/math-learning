import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

export interface CanvasSizeOptions {
  presetCompensation?: number;
}

/**
 * 字号缩放链路的钳制区间（AGENTS.md 公理 4.2 字号链路）：
 * `fontScale = clamp(v * scale, FONT_SCALE_MIN, FONT_SCALE_MAX)`。
 * 任何需要"字号极端放大上界"的推演与断言必须引用本常量，不得再写字面量 7 / 16。
 */
export const FONT_SCALE_MIN = 7;
export const FONT_SCALE_MAX = 16;

export interface CanvasSize {
  width: number;
  height: number;
  scale: number;
  rawScale: number;
  /**
   * 基准尺寸 → 当前尺寸的 CSS 像素换算（`v * scale`，`scale = rawScale × presetCompensation`）。
   *
   * ⚠️ **仅可用于 CSS / DOM 上下文**（内联 style、canvas 2D 绘制等）。
   *
   * 中屏 SVG 内的坐标是 design 坐标，且整棵子树被 `AnimationSvgCanvas` 的
   * `<g transform="scale(vp.scale)">` 统一缩放（`vp.scale` 与 `rawScale` 数值上往往相等，
   * 语义却是「design → 屏幕」的呈现倍率，**不可与之混用**）。
   * 在 SVG 里再乘一次倍率会得到 `v × scale²` 的平方律误差 —— 基准窗口下隐形、
   * 窗口放大即暴露。SVG 内把 CSS 像素换算成 design 坐标请用
   * `useViewport` 导出的 `cssToDesignLength(vp, css)`（除法）。
   *
   * 全库当前无任何 SVG 场景调用本函数；页面若需要「与图形等比的几何量」，
   * 应直接取 design 常量或几何基准的比例，不要经过本函数。
   */
  px: (v: number) => number;
  font: (v: number) => number;
}

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v;
}

export function useCanvasSize(
  initial: { width: number; height: number },
  options?: CanvasSizeOptions,
): [RefObject<HTMLDivElement | null>, CanvasSize] {
  const containerRef = useRef<HTMLDivElement>(null);
  const [raw, setRaw] = useState({
    width: initial.width,
    height: initial.height,
  });

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setRaw({ width: rect.width, height: rect.height });
    }
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setRaw({ width, height });
      }
    });

    resizeObserver.observe(element);

    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setRaw({ width: rect.width, height: rect.height });
    }

    return () => {
      resizeObserver.unobserve(element);
      resizeObserver.disconnect();
    };
  }, []);

  const size: CanvasSize = useMemo(() => {
    const rawScale = Math.min(
      raw.width / initial.width,
      raw.height / initial.height,
    );
    const compensation = options?.presetCompensation ?? 1.0;
    const scale = rawScale * compensation;
    return {
      width: raw.width,
      height: raw.height,
      scale,
      rawScale,
      px: (v: number) => v * scale,
      font: (v: number) => clamp(v * scale, FONT_SCALE_MIN, FONT_SCALE_MAX),
    };
  }, [
    raw.width,
    raw.height,
    initial.width,
    initial.height,
    options?.presetCompensation,
  ]);

  return [containerRef, size];
}
