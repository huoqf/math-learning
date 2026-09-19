/**
 * src/components/Math/pointGeometry.ts
 * 交互点几何常数（用于标签避让与留白推演）
 */

const DEFAULT_R = 6;
const DEFAULT_LABEL_DY_OFFSET = 8;
const DEFAULT_CAP_HEIGHT_RATIO = 0.7;
const DEFAULT_FONT_SIZE = 11;

/**
 * 交互点与标签的默认几何物理尺寸（用于视口留白推演与单测真实对齐）
 */
export const INTERACTIVE_POINT_GEOMETRY = {
  defaultR: DEFAULT_R,
  labelDyOffset: DEFAULT_LABEL_DY_OFFSET, // 标签 baseline 距离圆点边缘的间距 dy = -(r + 8)
  capHeightRatio: DEFAULT_CAP_HEIGHT_RATIO, // 大写字母顶端相对于字号的占高系数 (约 0.70)
  defaultFontSize: DEFAULT_FONT_SIZE, // 默认字号 11px
  /**
   * 计算从圆心向上到标签顶部的总占用像素空间
   */
  calcTotalTopSpan(
    r: number = DEFAULT_R,
    fontPx: number = DEFAULT_FONT_SIZE,
  ): number {
    return r + this.labelDyOffset + fontPx * this.capHeightRatio;
  },
} as const;
