/**
 * src/components/Math/pointGeometry.ts
 * 交互点几何常数（用于标签避让与留白推演）
 */

const DEFAULT_R = 6;
const DEFAULT_LABEL_DY_OFFSET = 8;
const DEFAULT_CAP_HEIGHT_RATIO = 0.7;
const DEFAULT_FONT_SIZE = 11;
const DEFAULT_EDGE_PROJECTION_INSET = 26;

/**
 * 交互点与标签的默认几何物理尺寸（用于视口留白推演与单测真实对齐）
 */
export const INTERACTIVE_POINT_GEOMETRY = {
  defaultR: DEFAULT_R,
  labelDyOffset: DEFAULT_LABEL_DY_OFFSET, // 标签 baseline 距离圆点边缘的间距 dy = -(r + 8)
  capHeightRatio: DEFAULT_CAP_HEIGHT_RATIO, // 大写字母顶端相对于字号的占高系数 (约 0.70)
  defaultFontSize: DEFAULT_FONT_SIZE, // 默认字号 11px
  /**
   * 边缘投影手柄（Edge Clamp Projection）向绘图区内侧的内缩像素。
   * 手柄吸附到被越过的边界后，还要再向内缩这么多，保证手柄与交互光环完整可见、
   * 不被边界切断，同时留出方向虚线的可视长度。
   */
  edgeProjectionInset: DEFAULT_EDGE_PROJECTION_INSET,
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
