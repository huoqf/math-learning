/**
 * src/utils/paramClamp.ts
 * 「参数声明域 ∩ 中屏可见视口」统一钳制工具（SSOT · 单一事实源）。
 *
 * 中屏每一个可拖拽动点都必须同时守住两条边界：
 *   ① **左屏参数声明域** `[meta.min, meta.max]` —— 越过它，滑块读数与图形脱节
 *      （滑块停在端点、点却跑到别处，学生再也对不上号）；
 *   ② **中屏可见视口** `[scale.xMin, scale.xMax]` —— 越过它，点会消失在画布外，抓不回来。
 *
 * 二者取交集即"合法拖拽区间"。此前各 Scene 各写一套 `Math.max / Math.min`，
 * 甚至写死常量（如 `Math.max(-5, Math.min(5, …))`），口径不一、容易与 paramMeta 失同步。
 * 现统一收敛到本文件，各 Scene 只负责"把 meta 与 scale 传进来"。
 *
 * ⚠ **纵坐标越界不走本文件**：`P(x₀, f(x₀))` 的 y 溢出绝不通过钳制 x₀ 来回避
 * （那会粗暴剥夺学生在 `x₀` 全区间上探究的能力）。统一走 `InteractivePoint` 的
 * `edgeClampProjection` 投影吸附手柄 —— 点贴边显示并保留方向引线，仍可横向拖回。
 */

import type { SceneScale } from "@/hooks/useSceneScale";
import type { ParamMeta } from "@/data/types";

/** 钳制所需的最小字段（便于宽松传入与单测构造） */
export type BoundMeta = Pick<ParamMeta, "min" | "max">;

/**
 * 求某参数在指定轴向上的合法拖拽区间 `[lo, hi]`。
 *
 * 区间恒满足 `lo <= hi`：当声明域与可见视口完全无交集（或 meta 缺失）时返回 `undefined`，
 * 由 `InteractivePoint` 退化为"不钳制"，避免产生 `[2, 1]` 这类非法区间把点永久钉死。
 */
export function paramDragRange(
  meta: BoundMeta | undefined,
  scale: SceneScale,
  axis: "x" | "y" = "x",
): [number, number] | undefined {
  if (!meta) return undefined;
  const lo = Math.max(meta.min, axis === "x" ? scale.xMin : scale.yMin);
  const hi = Math.min(meta.max, axis === "x" ? scale.xMax : scale.yMax);
  return lo <= hi ? [lo, hi] : undefined;
}

/**
 * 最常见的拖拽形态：被拖拽点的 `(x, y)` 恰好**同轴**对应两个参数
 * （如极点 `(poleX, poleY)`、弦中点 `(midpointX, midpointY)`）。
 *
 * 一次性给出两个轴向的合法拖拽区间，可直接展开到组件：
 * ```tsx
 * <InteractivePoint cx={x} cy={y} scale={scale} vp={vp}
 *   onDrag={handleDrag} {...paramDragBounds(paramMeta.px, paramMeta.py, scale)} />
 * ```
 * 返回 `undefined` 时组件退化为"该轴不钳制"，语义与 {@link paramDragRange} 一致。
 */
export function paramDragBounds(
  metaX: BoundMeta | undefined,
  metaY: BoundMeta | undefined,
  scale: SceneScale,
): { xRange?: [number, number]; yRange?: [number, number] } {
  return {
    xRange: paramDragRange(metaX, scale, "x"),
    yRange: paramDragRange(metaY, scale, "y"),
  };
}

/**
 * 仅按参数**声明域**钳制（不与可见视口求交）。
 *
 * 适用于"被拖拽量是派生系数、与屏幕坐标不同轴"的情形：
 * 例如三点共线模式下拖拽合成点 P，解出来的是基底系数 x、y，
 * 它们既不等于 P 的横纵坐标，也就无法与 `scale.xMin/xMax` 求交。
 * 此时守住的底线是"不许拖出滑块声明域"，否则滑块读数与图形立刻脱节。
 */
export function paramDomainRange(
  meta: BoundMeta | undefined,
): [number, number] | undefined {
  return meta ? [meta.min, meta.max] : undefined;
}

/**
 * 拖拽取值的标准落点：**先按滑块步长取整 → 再钳制到合法区间**。
 *
 * 顺序不可颠倒：若先钳制后取整，取整本身会溢出区间
 * （视口上限 5.6、步长 0.5 时，5.6 取整成 6.0 就又跑出去了）。
 *
 * @param raw   拖拽得到的原始数学坐标
 * @param step  对应滑块步长（缺省或 ≤ 0 表示不取整）
 * @param range 合法区间，来自 {@link paramDragRange}
 */
export function snapDragValue(
  raw: number,
  step: number | undefined,
  range?: [number, number],
): number {
  // step 缺省表示「该参数在注册表里没有声明步长」，此时保持连续值而非就地编造一个 fallback。
  // 若各调用点各自写 `meta.step ?? 0.1`，同一参数在滑块、拖拽、看板三处就可能拿到不同粒度，
  // 又回到口径分裂的老路上 —— 宁可不离散化，也不允许隐式兜底。
  const snapped =
    step != null && step > 0
      ? Number((Math.round(raw / step) * step).toFixed(6))
      : raw;
  if (!range) return snapped;
  return Math.min(range[1], Math.max(range[0], snapped));
}

/**
 * 耦合区间端点原子安全范围计算。
 *
 * 适用于有严格偏序关系的双变量耦合区间（如二分法区间 [m, n] 要求 m < n 且间距 ≥ minGap）：
 *   - 当作为左端点（isLower = true）时：上界受制于 otherVal - minGap；
 *   - 当作为右端点（isLower = false）时：下界受制于 otherVal + minGap；
 *   - 当边界处于极限紧绷态（lo > hi）时，强制收缩锁定在唯一边界上，绝不回退为 undefined。
 *
 * @param otherVal 另一端点的当前值
 * @param minGap   两端点必须保持的最小正间距
 * @param baseRange 该端点自身的独立物理/视口范围 [min, max]
 * @param isLower   当前计算的是否为左端点
 */
export function clampCoupledRange(
  otherVal: number,
  minGap: number,
  baseRange?: [number, number],
  isLower: boolean = true,
): [number, number] | undefined {
  if (!baseRange) return undefined;
  const [bMin, bMax] = baseRange;

  if (isLower) {
    const lo = bMin;
    const hi = Math.min(bMax, otherVal - minGap);
    return lo <= hi ? [lo, hi] : [lo, lo];
  } else {
    const lo = Math.max(bMin, otherVal + minGap);
    const hi = bMax;
    return lo <= hi ? [lo, hi] : [hi, hi];
  }
}
