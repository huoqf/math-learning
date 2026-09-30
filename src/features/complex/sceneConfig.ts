/**
 * 复数页（复数的几何意义与运算）场景配置 SSOT。
 *
 * 本模块集中三样「动画层与门禁都要用」的事实，避免复制粘贴漂移：
 *   1. 探究模式 / 子情景的类型联合（ComplexAnimation 与 ComplexScene 共用）；
 *   2. 各模式的可见视口（与 `useSceneScale` 共用同一常量）；
 *   3. 代数运算模式的典型构型预设（含参数，供动画层加载、供门禁核验可见性）。
 */

// ─────────────────────────────────────────────────────────────
// 1. 模式与子情景
// ─────────────────────────────────────────────────────────────

export type ComplexStudyMode =
  | "plane-operations"
  | "multiplication-rotation"
  | "locus-extrema"
  | "algebraic-operations";

export type ComplexLocusSubModel = "circle" | "perp-bisector" | "triangle-ineq";

export type ComplexAlgebraicSubModel =
  "multiply-divide" | "conjugate-rationalize" | "power-cycle";

export type ComplexSubModel = ComplexLocusSubModel | ComplexAlgebraicSubModel;

export const COMPLEX_ALGEBRAIC_SUB_MODELS: ComplexAlgebraicSubModel[] = [
  "multiply-divide",
  "conjugate-rationalize",
  "power-cycle",
];

// ─────────────────────────────────────────────────────────────
// 2. 可见视口
// ─────────────────────────────────────────────────────────────

export interface ComplexViewport {
  xRange: [number, number];
  yRange: [number, number];
}

/**
 * 默认视口 [-6, 6] × [-4.5, 4.5]：恰好框住参数声明域（a ∈ ±5、b ∈ ±4.5），
 * 供 复平面加减 / 乘法旋转 / 轨迹最值 三个模式使用。
 */
export const COMPLEX_VIEWPORT_DEFAULT: ComplexViewport = {
  xRange: [-6, 6],
  yRange: [-4.5, 4.5],
};

/**
 * 代数运算模式的放大视口。
 *
 * 为什么必须放大：该模式的落点是**两个复数的乘积与商**，其模长可达输入模长之积。
 * 默认参数 z₁ = 3 + 2i、z₂ = 1 + 3i 的乘积为 −3 + 11i，落在默认视口（纵轴仅 ±4.64）
 * 之外 —— 主推结论会直接被裁出画布，违背「预设必须看得见」。
 * 放大到 ±20 × ±15 后，默认参数与全部预设的乘积 / 商 / |z₂|² 均落在可见范围内。
 */
export const COMPLEX_VIEWPORT_ALGEBRAIC: ComplexViewport = {
  xRange: [-20, 20],
  yRange: [-15, 15],
};

/**
 * 按「模式 × 子情景」解析可见视口。
 * power-cycle 画的是单位圆上 i 的四张牌，用默认视口才不至于把半径为 1 的圆缩成一个点。
 */
export function resolveComplexViewport(
  studyMode: ComplexStudyMode,
  subModel: ComplexSubModel,
): ComplexViewport {
  if (studyMode === "algebraic-operations" && subModel !== "power-cycle") {
    return COMPLEX_VIEWPORT_ALGEBRAIC;
  }
  return COMPLEX_VIEWPORT_DEFAULT;
}

// ─────────────────────────────────────────────────────────────
// 3. 代数运算模式的典型构型预设
// ─────────────────────────────────────────────────────────────

export interface ComplexPreset {
  key: string;
  label: string;
  description: string;
  /** 加载时并入 params 的参数（仅覆盖列出的键，其余保持当前值） */
  params: Record<string, number>;
}

/**
 * 代数运算三个子情景的预设。
 *
 * 参数取值一律落在 `${registries/complex}` 的声明域内（a ∈ ±5、b ∈ ±4.5、powerN ∈ [−8, 12]），
 * 且由 `complexAlgebraicPanel.test.ts` 核验「加载后全部结论点都在可见视口内」。
 */
export const COMPLEX_ALGEBRAIC_PRESETS: Record<
  ComplexAlgebraicSubModel,
  ComplexPreset[]
> = {
  "multiply-divide": [
    { key: "free", label: "自由探究", description: "全参数开放", params: {} },
    {
      key: "i-squared",
      label: "虚数单位自乘",
      description: "i·i = −1 落回实轴",
      params: { a1: 0, b1: 1, a2: 0, b2: 1 },
    },
    {
      key: "conjugate-product",
      label: "共轭相乘",
      description: "z·z̄ = |z|² 为实数",
      params: { a1: 2, b1: 3, a2: 2, b2: -3 },
    },
    {
      key: "pure-imag-product",
      label: "纯虚数相乘",
      description: "2i·3i = −6",
      params: { a1: 0, b1: 2, a2: 0, b2: 3 },
    },
  ],
  "conjugate-rationalize": [
    { key: "free", label: "自由探究", description: "全参数开放", params: {} },
    {
      key: "one-over-i",
      label: "1 ÷ i",
      description: "分母实数化为 1",
      params: { a1: 1, b1: 0, a2: 0, b2: 1 },
    },
    {
      key: "one-over-1-plus-i",
      label: "1 ÷ (1 + i)",
      description: "分母实数化为 2",
      params: { a1: 1, b1: 0, a2: 1, b2: 1 },
    },
    {
      key: "ratio-i",
      label: "(1 + i) ÷ (1 − i)",
      description: "结果恰为 i",
      params: { a1: 1, b1: 1, a2: 1, b2: -1 },
    },
  ],
  "power-cycle": [
    { key: "free", label: "自由探究", description: "全参数开放", params: {} },
    {
      key: "n-eight",
      label: "整周期 n = 8",
      description: "余 0，i⁸ = 1",
      params: { powerN: 8 },
    },
    {
      key: "n-ten",
      label: "n = 10",
      description: "余 2，i¹⁰ = −1",
      params: { powerN: 10 },
    },
    {
      key: "n-negative",
      label: "负指数 n = −1",
      description: "与 i³ 同为 −i",
      params: { powerN: -1 },
    },
  ],
};
