/**
 * src/features/radianMeasure/sceneGeometry.ts
 * 「弧度制与扇形」中屏标注几何的单一真源 —— 一切标注尺寸均以**主圆 design 半径**为主单位。
 *
 * ── 为什么以主圆半径、而不是 design 常量或 CSS 像素 ──
 * 中屏比例尺由 `useSceneScale` 给出：`scaleX = min(designVisibleW, designVisibleH) / (xMax − xMin)`，
 * 而 `designVisibleW = W / vp.scale` 且 `vp.scale = min(W / presetW, H / presetH)`；
 * 两式相消得 `min(designVisibleW, designVisibleH) ≡ preset 边长`，**与窗口尺寸无关**。
 * 故本页主圆的 design 半径是与窗口无关的定值，可作几何基准：
 * 用它取比例，标注与图形的比例关系在任何分辨率下都严格恒定，
 * 且将来改 `xRange` 时自动跟随，不依赖任何数值巧合。
 *
 * ── 反面教材（本页曾用、本轮已修）──
 * 曾写 `const px = (v) => v * vp.scale`。`AnimationSvgCanvas` 的
 * `<g transform="scale(vp.scale)">` 已把整棵子树放大过一次，再乘一次即 `v × vp.scale²`：
 * 基准窗口（`vp.scale ≈ 1`）下与外观正常的写法重合、完全隐形，
 * 而 1600×950 窗口下角标记弧虚胖到主圆半径的 45.7%（1100×700 时仅 32.9%）。
 * **凡是「与图形等比」的量都不该经过视口倍率**；反之，若要的是绝对 CSS 像素量，
 * 应走 `useViewport` 的 `cssToDesignLength`（除以 `vp.scale`）。
 *
 * ── 为什么独立成非组件模块 ──
 * 同 `features/trigModel/viewport.ts`：这些常量同时被 Scene（作画）与
 * `src/test/radianMeasureSceneRender.test.tsx`（跨视口逐点断言）读取。
 * 若写在 `RadianMeasureScene.tsx` 里并导出，会触发 `react-refresh/only-export-components`。
 */

/**
 * 中屏数学视口 —— x 与 y 取同一区间，保证 `useSceneScale` 得 `scaleX === scaleY`、圆不被拉成椭圆；
 * 上界 3.6 覆盖声明域内最大半径 3，四面各留 0.6 的呼吸位。
 *
 * 与 `RadianMeasureAnimation` 的 `useSceneScale`、`radianMeasureSceneRender.test.tsx` 的
 * `calculateSceneScale` 共用同一组常量，避免页面与测试各写一份区间、改动时失真
 * （同 `features/trigModel/viewport.ts` 的做法）。
 */
export const RADIAN_MEASURE_XRANGE: [number, number] = [-3.6, 3.6];
export const RADIAN_MEASURE_YRANGE: [number, number] = [-3.6, 3.6];

/**
 * 圆心角 α 的标记弧半径 ÷ 主圆半径（取 1/3）。
 *
 * 取 1/3 的理由：α 为优角时标记弧仍完整落在圆内，与两条半径（OA、OP）保持肉眼可见的间隙；
 * 而劣角时又足够大，能清晰区分「角标记」与「圆心点」。
 * 参考：preset 边长 650、`xRange` 跨度 7.2 ⟹ 主圆 design 半径 ≈ 90.28，1/3 即约 30 design 单位。
 */
export const ANGLE_ARC_R_RATIO = 1 / 3;

/**
 * α 标签相对标记弧再外移的距离 ÷ 主圆半径（取 1/6）。
 *
 * 与标记弧半径相加约 0.5r，即标签稳定落在圆周**内部**的角平分线上：
 * 既不会与标记弧重叠，也不会越出圆周与弧长标签 `l` 抢位。
 */
export const ANGLE_LABEL_GAP_RATIO = 1 / 6;

/**
 * 半径 `r` 标签沿 OP 法向的微调距离 ÷ 主圆半径（取 1/8）。
 *
 * 标签先落在 OP 中点，再沿法向推开这一小段：α 由劣角连续增大到优角时，
 * 标签始终贴在半径同一侧，消灭中点过 O 时的方向翻转跳动。
 */
export const R_LABEL_NORMAL_RATIO = 1 / 8;
