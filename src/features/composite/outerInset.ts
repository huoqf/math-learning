/**
 * src/features/composite/outerInset.ts
 * 复合函数页「外层映射小图 f(u)」的取景与比例尺解算（纯函数，零 React / DOM 依赖）
 *
 * 为什么必须独立成图
 * ------------------
 * 复合函数的传导链是 x →(g)→ u →(f)→ y。主坐标系只能承载 x 与 y 两个方向：
 *   · y = f(g(x)) 画在主图 —— 横轴是 x，纵轴是 y，语义正确；
 *   · u = g(x) 也画在主图 —— 它的纵坐标是 u，但纵轴写着 y，于是「u 被读成 y」；
 *   · 而 y = f(u) 根本无法画进主图 —— 它的横坐标是 u 而不是 x。
 * 结果是学生只看到两条曲线，看不到外层 f 本身的单调方向与转折点，
 * 「同增异减」只能死记结论。故给 f(u) 一张自己的坐标系（自带 u 轴与 y 轴）。
 *
 * 取景规则（本文件的唯一职责）
 * --------------------------
 * 取景由「纵向窗口 + 横向取景中心」两个量给定，横向跨度按绘图区宽高比**反推**：
 *   uSpan = ySpan × (plotW / plotH)
 * 这样窗口与绘图区严格同比例，`calculateSceneScale` 的 scaleX 与 scaleY 相等，
 * 指数段的陡升、抛物线的开口与顶点都不会被拉扁失真（若直接给定横向跨度而后由
 * keepAspectRatio 取小值缩放，实际横向跨度会被放大到宽高比所允许的值，取景随即失控）。
 */

import { calculateSceneScale, type SceneScale } from "@/hooks/useSceneScale";

export type OuterType = "exp" | "log" | "quadratic";

/**
 * 小图的固定设计尺寸与四周留白（设计像素，与画布同坐标系）。
 * 使用固定尺寸而非按画布比例缩放：设计坐标系恒定，小图在任何屏幕尺寸下大小一致。
 */
export const OUTER_INSET = {
  /** 小图外框 */
  w: 190,
  h: 160,
  /** 与外框到画布边缘的留白（左下角，避开左上的公式浮标与右下的图例） */
  margin: 16,
  /** 顶部标题条高度 */
  titleBand: 24,
  /** 绘图区相对外框的内缩 */
  pad: 8,
} as const;

/**
 * 各外层映射的取景：纵向窗口 + 横向取景中心。
 * 选取依据（三种外层各自「最该被看见」的部位）：
 *   · exp  f(u)=2^u    —— 纵向 [-0.6, 3.4] 含原点，曲线在 u≈1.77 处穿出上边界，如实呈现指数陡升；
 *   · log  f(u)=log₂u  —— 纵向 [-3, 3] 含零点 u=1，左端在 u≈0.125 处跌出下边界（u→0⁺ 无下界）；
 *   · quadratic f(u)=-(u-2)²+4 —— 纵向 [-1.2, 4.4] 顶点 (2, 4) 落在窗口上部并留有余量，
 *     取景中心取 u=2（顶点），两臂自然向两侧跌出窗口。
 */
const OUTER_INSET_VIEW: Record<
  OuterType,
  { uCenter: number; yRange: [number, number] }
> = {
  exp: { uCenter: 0, yRange: [-0.6, 3.4] },
  log: { uCenter: 4, yRange: [-3, 3] },
  quadratic: { uCenter: 2, yRange: [-1.2, 4.4] },
};

export interface OuterInsetGeometry {
  /** 小图外框在设计坐标系中的位置 */
  left: number;
  top: number;
  w: number;
  h: number;
  /** 小图自己的比例尺（真正的独立坐标系；与主坐标系 scale 无任何换算关系） */
  scale: SceneScale;
  /** 该外层下小图实际覆盖的 u / y 窗口（= scale 的 xMin/xMax/yMin/yMax，便于测试与断言） */
  uRange: [number, number];
  yRange: [number, number];
}

export function buildOuterInset(options: {
  outerType: OuterType;
  designLeft: number;
  designTop: number;
  designVisibleH: number;
}): OuterInsetGeometry {
  const { outerType, designLeft, designTop, designVisibleH } = options;
  const view = OUTER_INSET_VIEW[outerType];

  const left = designLeft + OUTER_INSET.margin;
  const top = designTop + designVisibleH - OUTER_INSET.h - OUTER_INSET.margin;
  const plotW = OUTER_INSET.w - OUTER_INSET.pad * 2;
  const plotH = OUTER_INSET.h - OUTER_INSET.titleBand - OUTER_INSET.pad;

  const yRange = view.yRange;
  const uSpan = (yRange[1] - yRange[0]) * (plotW / plotH);
  const uRange: [number, number] = [
    view.uCenter - uSpan / 2,
    view.uCenter + uSpan / 2,
  ];

  const scale = calculateSceneScale({
    designVisibleW: plotW,
    designVisibleH: plotH,
    designLeft: left + OUTER_INSET.pad,
    designTop: top + OUTER_INSET.titleBand,
    xRange: uRange,
    yRange,
    keepAspectRatio: true,
  });

  return {
    left,
    top,
    w: OUTER_INSET.w,
    h: OUTER_INSET.h,
    scale,
    uRange,
    yRange,
  };
}
