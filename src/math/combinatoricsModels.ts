/**
 * src/math/combinatoricsModels.ts
 * 排列组合经典模型纯数学计算层（Zero Side-effects）
 *
 * 覆盖：
 * 1. 相邻捆绑法（Bundle）
 * 2. 不相邻插空法（Gap）
 * 3. 同素分配隔板法（Stars & Bars）
 * 4. 分组与定向分配（Grouping & Allocation，含重复度消序）
 */

export type CombinatoricsModelMode =
  "bundle" | "gap" | "starsBars" | "grouping";

export interface BundleModelResult {
  n: number;
  k: number;
  superCount: number;
  innerPerms: number;
  outerPerms: number;
  total: number;
  validity: "ok" | "clamped";
}

export interface GapModelResult {
  m: number;
  k: number;
  slots: number;
  basePerms: number;
  insertPerms: number;
  total: number;
  validity: "ok" | "impossible";
}

export interface StarsBarsResult {
  n: number;
  r: number;
  allowZero: boolean;
  effectiveN: number;
  barsCount: number;
  total: number;
  validity: "ok" | "impossible";
}

export interface GroupingResult {
  sizes: number[];
  totalElements: number;
  groupCount: number;
  distinctTargets: boolean;
  rawCombinationProduct: number;
  duplicateFactor: number;
  /** 重复大小的频次分布，例如 [2, 2, 1] -> { 2: 2, 1: 1 } */
  sizeMultiplicities: Array<{ size: number; count: number }>;
  unorderedGroups: number;
  orderedAllocations: number;
  total: number;
  validity: "ok" | "invalid";
}

/** 阶乘 n! */
export function factorial(n: number): number {
  const intN = Math.floor(n);
  if (intN < 0) return 0;
  if (intN <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= intN; i++) {
    res *= i;
  }
  return res;
}

/** 排列数 A(n, m) */
export function perm(n: number, m: number): number {
  const nn = Math.floor(n);
  const mm = Math.floor(m);
  if (mm < 0 || nn < 0 || mm > nn) return 0;
  let res = 1;
  for (let i = 0; i < mm; i++) {
    res *= nn - i;
  }
  return res;
}

/** 组合数 C(n, m) */
export function comb(n: number, m: number): number {
  const nn = Math.floor(n);
  const mm = Math.floor(m);
  if (mm < 0 || nn < 0 || mm > nn) return 0;
  const k = Math.min(mm, nn - mm);
  let num = 1;
  let den = 1;
  for (let i = 1; i <= k; i++) {
    num *= nn - k + i;
    den *= i;
  }
  return Math.round(num / den);
}

/** 相邻捆绑模型：n 个元素中 k 个必须相邻 */
export function calcBundleModel(nRaw: number, kRaw: number): BundleModelResult {
  const n = Math.max(2, Math.min(8, Math.round(nRaw)));
  const kInt = Math.round(kRaw);
  const clamped = kInt < 1 || kInt > n;
  const k = Math.max(1, Math.min(n, kInt));
  const superCount = n - k + 1;
  const innerPerms = factorial(k);
  const outerPerms = factorial(superCount);
  return {
    n,
    k,
    superCount,
    innerPerms,
    outerPerms,
    total: innerPerms * outerPerms,
    validity: clamped ? "clamped" : "ok",
  };
}

/** 不相邻插空模型：m 个无限制元素先排，k 个元素插入 m+1 个空位 */
export function calcGapModel(mRaw: number, kRaw: number): GapModelResult {
  const m = Math.max(1, Math.min(6, Math.round(mRaw)));
  const k = Math.max(1, Math.round(kRaw));
  const slots = m + 1;
  if (k > slots) {
    return {
      m,
      k,
      slots,
      basePerms: factorial(m),
      insertPerms: 0,
      total: 0,
      validity: "impossible",
    };
  }
  const basePerms = factorial(m);
  const insertPerms = perm(slots, k);
  return {
    m,
    k,
    slots,
    basePerms,
    insertPerms,
    total: basePerms * insertPerms,
    validity: "ok",
  };
}

/** 隔板法：n 个相同名额/球分给 r 个不同组（allowZero 控制是否允许空组） */
export function calcStarsBarsModel(
  nRaw: number,
  rRaw: number,
  allowZero = false,
): StarsBarsResult {
  const n = Math.max(1, Math.min(12, Math.round(nRaw)));
  const r = Math.max(2, Math.min(6, Math.round(rRaw)));
  const effectiveN = allowZero ? n + r : n;
  if (effectiveN < r) {
    return {
      n,
      r,
      allowZero,
      effectiveN,
      barsCount: r - 1,
      total: 0,
      validity: "impossible",
    };
  }
  const barsCount = r - 1;
  const total = comb(effectiveN - 1, barsCount);
  return {
    n,
    r,
    allowZero,
    effectiveN,
    barsCount,
    total,
    validity: "ok",
  };
}

/** 分组与定向分配模型（支持任意均分/局部均分/全不等分） */
export function calcGroupingModel(
  sizes: number[],
  distinctTargets: boolean,
): GroupingResult {
  const cleanSizes = sizes
    .map((s) => Math.round(s))
    .filter((s) => Number.isFinite(s) && s > 0);
  if (cleanSizes.length === 0) {
    return {
      sizes: [],
      totalElements: 0,
      groupCount: 0,
      distinctTargets,
      rawCombinationProduct: 0,
      duplicateFactor: 1,
      sizeMultiplicities: [],
      unorderedGroups: 0,
      orderedAllocations: 0,
      total: 0,
      validity: "invalid",
    };
  }

  const totalElements = cleanSizes.reduce((acc, v) => acc + v, 0);
  let remaining = totalElements;
  let rawCombinationProduct = 1;
  for (const s of cleanSizes) {
    rawCombinationProduct *= comb(remaining, s);
    remaining -= s;
  }

  const freqMap = new Map<number, number>();
  for (const s of cleanSizes) {
    freqMap.set(s, (freqMap.get(s) ?? 0) + 1);
  }
  const sizeMultiplicities = Array.from(freqMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([size, count]) => ({ size, count }));

  let duplicateFactor = 1;
  for (const { count } of sizeMultiplicities) {
    duplicateFactor *= factorial(count);
  }

  const unorderedGroups = Math.round(rawCombinationProduct / duplicateFactor);
  const orderedAllocations = unorderedGroups * factorial(cleanSizes.length);

  return {
    sizes: cleanSizes,
    totalElements,
    groupCount: cleanSizes.length,
    distinctTargets,
    rawCombinationProduct,
    duplicateFactor,
    sizeMultiplicities,
    unorderedGroups,
    orderedAllocations,
    total: distinctTargets ? orderedAllocations : unorderedGroups,
    validity: "ok",
  };
}
