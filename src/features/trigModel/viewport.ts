/**
 * src/features/trigModel/viewport.ts
 * 「三角函数模型应用」中屏视口常量与「顶部安全带」换算 —— 单一真源。
 *
 * 刻意独立成一个非组件模块：这些常量同时被 Animation（喂给 `useSceneScale`）、
 * Scene（画纵轴、刻度与一周期标尺）与 `src/test/trigModelSceneRender.test.tsx`（逐点断言）读取，
 * 若写在 `TrigModelScene.tsx` 里，一是会触发 `react-refresh/only-export-components`，
 * 二是读者容易误以为它只是「某个组件的内部参数」而随手改动。
 *
 * ── 横向 ──
 * $T \\in [2, 13]$，观测点横坐标 $t = \\text{tRatio} \\times T \\le 13$，故横向取 $[-0.7, 13.7]$。
 *
 * ── 纵向 ──
 * 参数声明域给出的极值包络是 $h \\in [-4, 6]$（$A \\le 3$、$k \\in [-1, 3]$）。
 * 现取 $[-4.4, 8.6]$：**跨度仍是 13**，即 `useSceneScale` 算出的 scale 与横向取景完全不变，
 * 只是把内容整体下移半个单位，为顶部安全带让出约 25px。
 * （上一版取 $[-4.9, 8.1]$，跨度相同但内容贴顶，安全带与一周期标尺无处安放。）
 *
 * ── 为什么必须固定视口而不能自动取景 ──
 * 本页要教的是「四个量各管什么」。若视口跟着参数走（随 $k$ 上下平移、随 $T$ 横向缩放），
 * 拖动 $k$ 时曲线在画面里几乎不动 —— 「平移」这一最该被看见的效果会被摄像机吃掉。
 * 固定视口后四个量的作用方向互不遮蔽：
 *   $A$ → 波峰与波谷的张开高度；$k$ → 整条曲线相对 $h = 0$ 的高低；
 *   $\\varphi$ → 曲线沿 $t$ 轴的左右错位；$T$ → 一个完整波形的横向长度。
 */

export const TRIG_MODEL_XRANGE: [number, number] = [-0.7, 13.7];
export const TRIG_MODEL_YRANGE: [number, number] = [-4.4, 8.6];

/**
 * 中屏顶部安全带（左上解析式悬浮窗 + 右上状态徽章）占用的 **CSS 像素**高度。
 *
 * 实测：窗体上边距 `top-3.5`(14px) + 窗体自身高约 53.5px ⇒ 下沿落在 67.5px，再留 8px 呼吸位。
 *
 * 必须用 CSS 像素而不能用 design 常量：悬浮窗尺寸由 CSS 决定、**不随画布缩放**，
 * 而 design 坐标会被 `vp.scale` 拉伸，二者的比例随窗口尺寸变化 ——
 * 写死一个 design 常数，窗口一变就会重新压到曲线上。
 */
export const TRIG_MODEL_TOP_CHROME_PX = 76;

/**
 * 一周期标尺各元素相对「安全带下沿」的 CSS 像素偏移，自上而下：
 * 标签基线 → 两端刻度线上端 → 横线 → 两端刻度线下端。
 */
export const SPAN_LABEL_DY = 10;
export const SPAN_TICK_TOP_DY = 16;
export const SPAN_LINE_DY = 22;
export const SPAN_TICK_BOTTOM_DY = 28;

/** 纵轴整数刻度整体落在标尺带之下，避免刻度线穿过标尺（= 标尺下端再让 4px） */
export const AXIS_TICK_CLEARANCE_DY = 32;

/** 纵轴轴名 $h$ 相对安全带下沿的 CSS 像素偏移（沿用 `CoordinateGrid` 的惯例：落在轴左侧） */
export const AXIS_NAME_DY = 16;

/**
 * 把「顶部安全带下沿」由 CSS 像素换算成场景 design 纵坐标（单一真源）。
 *
 * 换算依据：design 坐标经 `translate(tx ty) scale(scale)` 映射到容器 CSS 像素，
 * 故 CSS 纵坐标 $y$ 对应的 design 纵坐标是 $(y - ty) / scale$。
 * 当容器又矮又宽时 $ty$ 可为负、结果被夹到 0 —— 此时安全带整个落在可见区之上，
 * 场景无需为它预留任何空间（`TrigModelScene` 的图元自然全部落在安全带之下）。
 */
export function topChromeBottomY(vp: { ty: number; scale: number }): number {
  const scale = vp.scale > 0 ? vp.scale : 1;
  return Math.max(0, (TRIG_MODEL_TOP_CHROME_PX - vp.ty) / scale);
}
