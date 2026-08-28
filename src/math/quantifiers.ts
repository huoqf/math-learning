/**
 * @file quantifiers.ts
 * @description 全称量词与存在量词及其否定的纯数学逻辑求解器
 *
 * 核心模型：
 * 1. 单变量全称量词命题：p: ∀x ∈ [a, b], f(x) ≥ m
 *    否定：¬p: ∃x ∈ [a, b], f(x) < m
 * 2. 单变量存在量词命题：q: ∃x ∈ [a, b], f(x) ≤ m
 *    否定：¬q: ∀x ∈ [a, b], f(x) > m
 * 3. 双变量博弈命题：
 *    - 场景 1（恒大/强强）：∀x₁ ∈ I₁, ∀x₂ ∈ I₂, f(x₁) > g(x₂) ⟺ f_min > g_max
 *    - 场景 2（值域包含）：∀x₁ ∈ I₁, ∃x₂ ∈ I₂, f(x₁) = g(x₂) ⟺ Range(f) ⊆ Range(g)
 *    - 场景 3（交集非空）：∃x₁ ∈ I₁, ∃x₂ ∈ I₂, f(x₁) = g(x₂) ⟺ Range(f) ∩ Range(g) ≠ ∅
 */

export interface Interval {
  min: number;
  max: number;
}

export interface SingleVarQuantifierResult {
  /** 目标区间 */
  interval: Interval;
  /** 当前选取的二次函数系数 a x^2 + b x + c */
  f: (x: number) => number;
  /** 区间内最小值 */
  fMin: number;
  /** 区间内最大值 */
  fMax: number;
  /** 取得最小值的 x 坐标 */
  xMinAt: number;
  /** 取得最大值的 x 坐标 */
  xMaxAt: number;
  /** 比较基准值 m */
  threshold: number;
  /** 动点 probeX 当前函数值 */
  probeVal: number;
  /** 动点是否为反例 */
  isProbeCounterExample: boolean;
  /** 原命题真假 */
  isOriginalTrue: boolean;
  /** 命题否定的真假 */
  isNegationTrue: boolean;
  /** 原命题 LaTeX 公式 */
  originalFormula: string;
  /** 否定命题 LaTeX 公式 */
  negationFormula: string;
  /** 等价充要条件 LaTeX */
  equivCondition: string;
  /** 反例区间列表（在 [a, b] 内部使命题不成立的子区间） */
  counterIntervals: Interval[];
}

export interface DualVarQuantifierResult {
  intervalF: Interval;
  intervalG: Interval;
  rangeF: Interval;
  rangeG: Interval;
  scenario: "all_all" | "all_exist" | "exist_exist";
  isTrue: boolean;
  conditionDescription: string;
  conditionFormula: string;
  fMin: number;
  fMax: number;
  gMin: number;
  gMax: number;
}

/**
 * 求解二次函数 f(x) = k(x - h)^2 + v 在区间 [x1, x2] 上的极值
 */
export function getQuadraticExtrema(
  k: number,
  h: number,
  v: number,
  x1: number,
  x2: number,
): { minVal: number; maxVal: number; xMin: number; xMax: number } {
  const a = Math.min(x1, x2);
  const b = Math.max(x1, x2);
  const f = (x: number) => k * (x - h) * (x - h) + v;

  const yA = f(a);
  const yB = f(b);

  let candidates: { x: number; y: number }[] = [
    { x: a, y: yA },
    { x: b, y: yB },
  ];

  if (h >= a && h <= b) {
    candidates.push({ x: h, y: f(h) });
  }

  candidates.sort((c1, c2) => c1.y - c2.y);

  return {
    minVal: candidates[0].y,
    maxVal: candidates[candidates.length - 1].y,
    xMin: candidates[0].x,
    xMax: candidates[candidates.length - 1].x,
  };
}

/**
 * 求解单变量全称/存在命题的真假与几何特征
 *
 * @param mode 'universal' (∀ 全称) | 'existential' (∃ 存在)
 * @param k 二次项开口参数
 * @param h 对称轴
 * @param v 顶点纵坐标
 * @param intMin 区间左端点 a
 * @param intMax 区间右端点 b
 * @param threshold 基准线 m
 * @param probeX 动点探针 x0
 */
export function solveSingleVarQuantifier(
  mode: "universal" | "existential",
  k: number,
  h: number,
  v: number,
  intMin: number,
  intMax: number,
  threshold: number,
  probeX: number,
): SingleVarQuantifierResult {
  const left = Math.min(intMin, intMax);
  const right = Math.max(intMin, intMax);
  const f = (x: number) => k * (x - h) * (x - h) + v;

  const { minVal, maxVal, xMin, xMax } = getQuadraticExtrema(
    k,
    h,
    v,
    left,
    right,
  );

  const clampedProbeX = Math.max(left, Math.min(right, probeX));
  const probeVal = f(clampedProbeX);

  let isOriginalTrue = false;
  let isProbeCounterExample = false;
  let originalFormula = "";
  let negationFormula = "";
  let equivCondition = "";
  const counterIntervals: Interval[] = [];

  // 计算 f(x) = threshold 的实根，从而切分反例区间
  // k(x - h)^2 + v = threshold => (x - h)^2 = (threshold - v) / k
  const discriminant = k !== 0 ? (threshold - v) / k : -1;
  let roots: number[] = [];
  if (k !== 0 && discriminant >= 0) {
    const r1 = h - Math.sqrt(discriminant);
    const r2 = h + Math.sqrt(discriminant);
    roots = [Math.min(r1, r2), Math.max(r1, r2)];
  }

  if (mode === "universal") {
    // p: ∀x ∈ [a, b], f(x) ≥ m ⟺ f_min ≥ m
    // ¬p: ∃x ∈ [a, b], f(x) < m
    isOriginalTrue = minVal >= threshold - 1e-7;
    isProbeCounterExample = probeVal < threshold - 1e-7;
    originalFormula = `p: \\forall x \\in [a, b],\\, f(x) \\ge m`;
    negationFormula = `\\neg p: \\exists x \\in [a, b],\\, f(x) < m`;
    equivCondition = `f(x)_{\\min} \\ge m`;

    // 反例区间：f(x) < threshold
    if (!isOriginalTrue) {
      if (k > 0 && roots.length === 2) {
        // 开口向上，两根之间小于 threshold
        const start = Math.max(left, roots[0]);
        const end = Math.min(right, roots[1]);
        if (start < end) {
          counterIntervals.push({ min: start, max: end });
        }
      } else if (k < 0) {
        // 开口向下，两根之外小于 threshold
        if (roots.length === 2) {
          if (left < roots[0]) {
            counterIntervals.push({
              min: left,
              max: Math.min(right, roots[0]),
            });
          }
          if (right > roots[1]) {
            counterIntervals.push({
              min: Math.max(left, roots[1]),
              max: right,
            });
          }
        } else {
          // 判别式 < 0，全域小于 threshold
          counterIntervals.push({ min: left, max: right });
        }
      } else {
        // k === 0 (常数函数)
        if (v < threshold) {
          counterIntervals.push({ min: left, max: right });
        }
      }
    }
  } else {
    // q: ∃x ∈ [a, b], f(x) ≤ m ⟺ f_min ≤ m
    // ¬q: ∀x ∈ [a, b], f(x) > m
    isOriginalTrue = minVal <= threshold + 1e-7;
    // 对于存在命题，如果命题为假，则区间内任何一点都是 ¬q 的证据点（满足 f(x) > m）
    isProbeCounterExample = probeVal > threshold + 1e-7;
    originalFormula = `q: \\exists x \\in [a, b],\\, f(x) \\le m`;
    negationFormula = `\\neg q: \\forall x \\in [a, b],\\, f(x) > m`;
    equivCondition = `f(x)_{\\min} \\le m`;

    // 若 q 为假，整个区间都在 threshold 上方
    if (!isOriginalTrue) {
      counterIntervals.push({ min: left, max: right });
    }
  }

  return {
    interval: { min: left, max: right },
    f,
    fMin: minVal,
    fMax: maxVal,
    xMinAt: xMin,
    xMaxAt: xMax,
    threshold,
    probeVal,
    isProbeCounterExample,
    isOriginalTrue,
    isNegationTrue: !isOriginalTrue,
    originalFormula,
    negationFormula,
    equivCondition,
    counterIntervals,
  };
}

/**
 * 求解双变量全称/存在博弈逻辑
 */
export function solveDualVarQuantifier(
  scenario: "all_all" | "all_exist" | "exist_exist",
  k1: number,
  h1: number,
  v1: number,
  int1Min: number,
  int1Max: number,
  k2: number,
  h2: number,
  v2: number,
  int2Min: number,
  int2Max: number,
): DualVarQuantifierResult {
  const i1 = {
    min: Math.min(int1Min, int1Max),
    max: Math.max(int1Min, int1Max),
  };
  const i2 = {
    min: Math.min(int2Min, int2Max),
    max: Math.max(int2Min, int2Max),
  };

  const ext1 = getQuadraticExtrema(k1, h1, v1, i1.min, i1.max);
  const ext2 = getQuadraticExtrema(k2, h2, v2, i2.min, i2.max);

  const rangeF = { min: ext1.minVal, max: ext1.maxVal };
  const rangeG = { min: ext2.minVal, max: ext2.maxVal };

  let isTrue = false;
  let conditionDescription = "";
  let conditionFormula = "";

  if (scenario === "all_all") {
    // ∀x₁ ∈ I₁, ∀x₂ ∈ I₂, f(x₁) > g(x₂) ⟺ f_min > g_max
    isTrue = rangeF.min > rangeG.max + 1e-7;
    conditionDescription = "f 图像完全在 g 图像上方，f 最小值必须大于 g 最大值";
    conditionFormula = "f(x)_{\\min} > g(x)_{\\max}";
  } else if (scenario === "all_exist") {
    // ∀x₁ ∈ I₁, ∃x₂ ∈ I₂, f(x₁) = g(x₂) ⟺ Range(f) ⊆ Range(g)
    isTrue = rangeF.min >= rangeG.min - 1e-7 && rangeF.max <= rangeG.max + 1e-7;
    conditionDescription =
      "f 的任意取值都能在 g 中找到对应，即 f 的值域是 g 值域的子集";
    conditionFormula = "\\text{Range}(f) \\subseteq \\text{Range}(g)";
  } else {
    // ∃x₁ ∈ I₁, ∃x₂ ∈ I₂, f(x₁) = g(x₂) ⟺ Range(f) ∩ Range(g) ≠ ∅
    isTrue = rangeF.min <= rangeG.max + 1e-7 && rangeF.max >= rangeG.min - 1e-7;
    conditionDescription = "存在公共函数值，即 f 与 g 的值域有交集";
    conditionFormula =
      "\\text{Range}(f) \\cap \\text{Range}(g) \\neq \\emptyset";
  }

  return {
    intervalF: i1,
    intervalG: i2,
    rangeF,
    rangeG,
    scenario,
    isTrue,
    conditionDescription,
    conditionFormula,
    fMin: ext1.minVal,
    fMax: ext1.maxVal,
    gMin: ext2.minVal,
    gMax: ext2.maxVal,
  };
}
