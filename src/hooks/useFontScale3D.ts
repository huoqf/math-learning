/**
 * 3D 场景字体缩放 hook
 *
 * 与 2D 场景的 fontScale 基准对齐。
 * distanceFactor 越小文字越大。
 */

const FONT_SCALE_BASE = 1;

export function useFontScale3D(): number {
  return 8 * FONT_SCALE_BASE;
}
