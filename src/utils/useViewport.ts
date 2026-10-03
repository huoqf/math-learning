import { useMemo } from "react";
import type { CanvasSize } from "./useCanvasSize";

export interface ViewportOptions {
  designWidth: number;
  designHeight: number;
  overlayLeft?: number;
  overlayRight?: number;
  overlayTop?: number;
  overlayBottom?: number;
  presetCompensation?: number;
}

export interface ViewportInfo {
  visibleX: number;
  visibleY: number;
  visibleW: number;
  visibleH: number;
  centerX: number;
  centerY: number;
  scale: number;
  tx: number;
  ty: number;
  transform: string;
  designVisibleW: number;
  designVisibleH: number;
  designLeft: number;
  designTop: number;
}

/**
 * CSS 像素长度 → design 坐标长度：`design = css / vp.scale`。
 *
 * **为什么必须「除以」`vp.scale`**：`AnimationSvgCanvas` 已把视口变换作为
 * `<g transform="translate(tx ty) scale(vp.scale)">` 作用在整棵子树上，
 * 即 1 个 design 单位在屏幕上恒占 `vp.scale` 个 CSS 像素。
 * 因此要把「以 CSS 像素表达的长度」（例如为对齐 CSS 悬浮窗而预留的安全带裕量）
 * 写进 design 坐标，只能除以 `vp.scale`；反过来，想在画面上得到一段固定 CSS 像素长度，也用它。
 *
 * **反例（本项目 trigModel / radianMeasure 两处实际踩中）**：写成 `v * vp.scale`
 * 会让屏幕长度变成 `v × vp.scale²` —— 基准窗口（`vp.scale ≈ 1`）下与正确值几乎重合、
 * 完全隐形，窗口放大到 1.3754 倍时即虚胖 89%。换算方向必须与
 * `features/trigModel/viewport.ts` 的 `topChromeBottomY`（同样是除以 `scale`）保持一致。
 *
 * **不适用**：若要的是「与图形等比的几何量」（角标记弧半径、标签离图元的距离等），
 * 应直接取 design 常量或几何基准（如主圆半径）的比例 —— 那种量本就该随窗口等比放大，
 * 除以 `vp.scale` 反而会把它钉成绝对像素尺寸。
 */
export function cssToDesignLength(
  viewport: { scale: number },
  css: number,
): number {
  const scale = viewport.scale > 0 ? viewport.scale : 1;
  return css / scale;
}

export function useViewport(
  canvas: CanvasSize,
  options: ViewportOptions,
): ViewportInfo {
  const {
    designWidth,
    designHeight,
    overlayLeft = 0,
    overlayRight = 0,
    overlayTop = 0,
    overlayBottom = 0,
  } = options;

  const compensation =
    options.presetCompensation ??
    (canvas.rawScale > 0 ? canvas.scale / canvas.rawScale : 1.0);

  return useMemo(() => {
    const visibleX = overlayLeft;
    const visibleY = overlayTop;
    const visibleW = Math.max(0, canvas.width - overlayLeft - overlayRight);
    const visibleH = Math.max(0, canvas.height - overlayTop - overlayBottom);

    const rawScale = Math.min(visibleW / designWidth, visibleH / designHeight);
    const scale = rawScale * compensation;

    const centerX = visibleX + visibleW / 2;
    const centerY = visibleY + visibleH / 2;

    const tx = visibleX + (visibleW - designWidth * scale) / 2;
    const ty = visibleY + (visibleH - designHeight * scale) / 2;
    const transform = `translate(${tx} ${ty}) scale(${scale})`;

    return {
      visibleX,
      visibleY,
      visibleW,
      visibleH,
      centerX,
      centerY,
      scale,
      tx,
      ty,
      transform,
      designVisibleW: visibleW / scale,
      designVisibleH: visibleH / scale,
      designLeft: -tx / scale,
      designTop: -ty / scale,
    };
  }, [
    canvas.width,
    canvas.height,
    designWidth,
    designHeight,
    overlayLeft,
    overlayRight,
    overlayTop,
    overlayBottom,
    compensation,
  ]);
}
