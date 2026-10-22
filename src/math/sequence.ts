/**
 * src/math/sequence.ts
 * 数列纯函数计算模块 — 零 DOM、零 React 依赖、带 validity 状态
 */

import { formatMathNumber } from "@/utils/mathFormat";

export interface ArithmeticTermInfo {
  n: number;
  an: number;
  Sn: number;
  absAn: number;
  Tn: number; // 绝对值前 n 项和
}

export interface GeometricTermInfo {
  n: number;
  an: number;
  Sn: number;
  Pn: number; // 前 n 项积
  lnAn: number | null; // ln|an|（当 an != 0 时）
}

export interface SegmentedSumInfo {
  k: number;
  segments: Array<{
    segmentIndex: number; // 1, 2, 3...
    startN: number;
    endN: number;
    sumValue: number;
  }>;
  diff: number; // 理论公差 k^2 * d
}

export interface ArithmeticSequenceResult {
  isValid: boolean;
  errorMsg?: string;
  terms: ArithmeticTermInfo[];
  a1: number;
  d: number;
  N: number;
  zeroPointN: number | null;
  zeroPointExact: number | null;
  continuousAxis: number | null;
  lastPositiveN: number | null;
  maxSnInfo: {
    nMax: number;
    maxSn: number;
    isMax?: boolean;
    isDual?: boolean;
    dualN?: number;
  } | null;
  segmentedSums: SegmentedSumInfo | null;
  lineFn: (x: number) => number;
  parabolaFn: (x: number) => number;
}

export interface GeometricSegmentedSumInfo {
  k: number;
  segments: Array<{
    segmentIndex: number;
    startN: number;
    endN: number;
    sumValue: number;
  }>;
  ratio: number; // 理论公比 q^k
}

export type GeometricQType =
  | "growth" // q > 1 (指数增长)
  | "decay" // 0 < q < 1 (指数衰减收敛)
  | "constant" // q = 1 (退化常数列)
  | "oscillate-decay" // -1 < q < 0 (衰减震荡)
  | "oscillate-period" // q = -1 (周期震荡)
  | "oscillate-diverge"; // q < -1 (发散震荡)

export interface GeometricSequenceResult {
  isValid: boolean;
  errorMsg?: string;
  terms: GeometricTermInfo[];
  a1: number;
  q: number;
  N: number;
  qType: GeometricQType;
  limitSum: number | null;
  expFn: ((x: number) => number) | null;
  logLineFn: ((x: number) => number) | null;
  maxPnInfo: {
    nMax: number;
    maxPn: number;
    isMax: boolean;
    isDual?: boolean;
    dualN?: number;
  } | null;
  segmentedSums: GeometricSegmentedSumInfo | null;
  staggerData: {
    snTerms: Array<{ n: number; val: number; text: string }>;
    qSnTerms: Array<{ n: number; val: number; text: string }>;
    diffLeft: { val: number; text: string };
    diffRight: { val: number; text: string };
  };
}

export interface ArithGeoSplitTerm {
  n: number;
  an: number;
  bn: number;
  cn: number;
  Tn: number;
}

export interface ArithGeoSplitResult {
  isValid: boolean;
  terms: ArithGeoSplitTerm[];
  a1: number;
  d: number;
  q: number;
  N: number;
}

export interface TelescopingTerm {
  n: number;
  cn: number;
  partA: number;
  partB: number;
  Tn: number;
}

export interface TelescopingResult {
  isValid: boolean;
  terms: TelescopingTerm[];
  N: number;
  limitSum: number;
}

export interface GroupedTerm {
  n: number;
  an: number; // 等差部分
  bn: number; // 等比部分
  cn: number; // an + bn
  San: number; // 等差累加和
  Sbn: number; // 等比累加和
  Tn: number; // 总和
}

export interface GroupedResult {
  isValid: boolean;
  terms: GroupedTerm[];
  a1: number;
  d: number;
  q: number;
  N: number;
}

export interface CrossTelescopingTerm {
  n: number;
  cn: number; // 1 / (n * (n + 2))
  partA: number; // 0.5 / n
  partB: number; // 0.5 / (n + 2)
  Tn: number;
}

export interface CrossTelescopingResult {
  isValid: boolean;
  terms: CrossTelescopingTerm[];
  N: number;
  limitSum: number; // 0.75
}

export interface OddEvenTerm {
  n: number;
  cn: number; // (-1)^n * n
  pairSum: number | null; // 当 n 为偶数时，与前一项合并之和: c_{n-1} + c_n = 1
  Tn: number;
}

export interface OddEvenResult {
  isValid: boolean;
  terms: OddEvenTerm[];
  N: number;
}

export interface AbsSumTerm {
  n: number;
  an: number; // 原项
  absAn: number; // |an|
  Tn: number; // 绝对值累计和
  isNegative: boolean; // 是否为负项(被翻折)
}

export interface AbsSumResult {
  isValid: boolean;
  terms: AbsSumTerm[];
  a1: number;
  d: number;
  N: number;
  zeroPoint: number | null; // 变号零点精确值 1 - a1/d
  n0: number | null; // 最后一个非变号项下标
  signChangeType: "allPositive" | "allNegative" | "posToNeg" | "negToPos";
  sumFormula: string;
}

export interface RadicalTelescopingTerm {
  n: number;
  cn: number; // 1 / (sqrt(n) + sqrt(n+1)) = sqrt(n+1) - sqrt(n)
  partA: number; // sqrt(n+1)
  partB: number; // sqrt(n)
  Tn: number; // 累计和 sqrt(N+1) - 1
}

export interface RadicalTelescopingResult {
  isValid: boolean;
  terms: RadicalTelescopingTerm[];
  N: number;
  finalTn: number;
}

/**
 * 计算等差数列性质与各项 (支持函数透视、极值辨析、片段和与绝对值求和)
 */
export function calcArithmeticSequence(
  a1: number,
  d: number,
  N: number,
  kSegment: number = 3,
): ArithmeticSequenceResult {
  if (N <= 0 || !Number.isFinite(a1) || !Number.isFinite(d)) {
    return {
      isValid: false,
      errorMsg: "参数无效，项数 N 须大于 0",
      terms: [],
      a1,
      d,
      N,
      zeroPointN: null,
      zeroPointExact: null,
      continuousAxis: null,
      lastPositiveN: null,
      maxSnInfo: null,
      segmentedSums: null,
      lineFn: () => 0,
      parabolaFn: () => 0,
    };
  }

  const terms: ArithmeticTermInfo[] = [];
  let currentSum = 0;
  let currentAbsSum = 0;
  let lastPosN: number | null = null;

  for (let n = 1; n <= N; n++) {
    const an = a1 + (n - 1) * d;
    currentSum += an;
    const absAn = Math.abs(an);
    currentAbsSum += absAn;

    if (an >= 0) {
      lastPosN = n;
    }

    terms.push({
      n,
      an,
      Sn: currentSum,
      absAn,
      Tn: currentAbsSum,
    });
  }

  const lineFn = (x: number) => d * x + (a1 - d);
  const parabolaFn = (x: number) => 0.5 * d * x * x + (a1 - 0.5 * d) * x;

  let zeroPointN: number | null = null;
  let zeroPointExact: number | null = null;
  let continuousAxis: number | null = null;

  if (Math.abs(d) > 1e-9) {
    const zN = 1 - a1 / d;
    zeroPointExact = zN;
    if (zN >= 1 && zN <= N) {
      zeroPointN = zN;
    }
    // 对称轴 x_sym = -B / (2A) = -(a1 - d/2) / d = 0.5 - a1/d
    continuousAxis = 0.5 - a1 / d;
  }

  // 极值项精确计算
  let bestN = 1;
  let bestSn = terms[0].Sn;
  let isDual = false;
  let dualN: number | undefined;
  let isMax = true;

  if (d < 0) {
    isMax = true;
    for (let i = 0; i < terms.length; i++) {
      if (terms[i].Sn > bestSn) {
        bestSn = terms[i].Sn;
        bestN = terms[i].n;
      }
    }
  } else if (d > 0) {
    isMax = false;
    for (let i = 0; i < terms.length; i++) {
      if (terms[i].Sn < bestSn) {
        bestSn = terms[i].Sn;
        bestN = terms[i].n;
      }
    }
  } else {
    // d === 0: 退化为常数项为 0 的直线 Sn = n * a1
    isMax = true;
    if (a1 >= 0) {
      bestN = N;
      bestSn = terms[N - 1].Sn;
    } else {
      bestN = 1;
      bestSn = terms[0].Sn;
    }
  }

  // 对称轴非空时，检查是否存在两个相邻且相等的极值项 (即 a_{k+1} = 0)
  // 无论是 d < 0 (双最大值) 还是 d > 0 (双最小值)，该准则均成立
  if (continuousAxis !== null) {
    const k = Math.round(continuousAxis - 0.5);
    if (Math.abs(continuousAxis - (k + 0.5)) < 1e-9 && k >= 1 && k < N) {
      if (Math.abs(terms[k - 1].Sn - terms[k].Sn) < 1e-9) {
        isDual = true;
        dualN = k + 1;
      }
    }
  }

  // 片段和计算 (按 kSegment 分组)
  const validK = Math.max(2, Math.min(5, Math.round(kSegment)));
  const totalSegments = Math.floor(N / validK);
  let segmentedSums: SegmentedSumInfo | null = null;

  if (totalSegments >= 2) {
    const segments: SegmentedSumInfo["segments"] = [];
    for (let seg = 1; seg <= totalSegments; seg++) {
      const startN = (seg - 1) * validK + 1;
      const endN = seg * validK;
      const sumVal =
        terms[endN - 1].Sn - (startN > 1 ? terms[startN - 2].Sn : 0);
      segments.push({
        segmentIndex: seg,
        startN,
        endN,
        sumValue: sumVal,
      });
    }
    segmentedSums = {
      k: validK,
      segments,
      diff: validK * validK * d,
    };
  }

  return {
    isValid: true,
    terms,
    a1,
    d,
    N,
    zeroPointN,
    zeroPointExact,
    continuousAxis,
    lastPositiveN: lastPosN,
    maxSnInfo: {
      nMax: bestN,
      maxSn: bestSn,
      isMax,
      isDual,
      dualN,
    },
    segmentedSums,
    lineFn,
    parabolaFn,
  };
}

/**
 * 计算等比数列性质与各项
 */
export function calcGeometricSequence(
  a1: number,
  q: number,
  N: number,
  kSegment: number = 3,
): GeometricSequenceResult {
  if (N <= 0 || !Number.isFinite(a1) || !Number.isFinite(q)) {
    return {
      isValid: false,
      errorMsg: "参数无效",
      terms: [],
      a1,
      q,
      N,
      qType: "growth",
      limitSum: null,
      expFn: null,
      logLineFn: null,
      maxPnInfo: null,
      segmentedSums: null,
      staggerData: {
        snTerms: [],
        qSnTerms: [],
        diffLeft: { val: 0, text: "0" },
        diffRight: { val: 0, text: "0" },
      },
    };
  }

  // 1. 判断公比形态
  let qType: GeometricQType = "growth";
  if (Math.abs(q - 1) < 1e-9) {
    qType = "constant";
  } else if (Math.abs(q - -1) < 1e-9) {
    qType = "oscillate-period";
  } else if (q > 1) {
    qType = "growth";
  } else if (q > 0 && q < 1) {
    qType = "decay";
  } else if (q > -1 && q < 0) {
    qType = "oscillate-decay";
  } else {
    qType = "oscillate-diverge";
  }

  const terms: GeometricTermInfo[] = [];
  let currentSum = 0;
  let currentProd = 1;
  let currentAn = a1;

  for (let n = 1; n <= N; n++) {
    if (n === 1) {
      currentAn = a1;
    } else {
      currentAn = currentAn * q;
    }
    currentSum += currentAn;
    currentProd *= currentAn;

    const lnVal =
      Math.abs(currentAn) > 1e-9 ? Math.log(Math.abs(currentAn)) : null;
    terms.push({
      n,
      an: currentAn,
      Sn: currentSum,
      Pn: currentProd,
      lnAn: lnVal,
    });
  }

  // 2. 极限和 S_∞
  let limitSum: number | null = null;
  if (Math.abs(q) < 1) {
    limitSum = a1 / (1 - q);
  }

  // 3. 连续母函数
  let expFn: ((x: number) => number) | null = null;
  if (q > 0) {
    expFn = (x: number) => a1 * Math.pow(q, x - 1);
  }

  let logLineFn: ((x: number) => number) | null = null;
  if (a1 > 0 && q > 0) {
    const lnA1 = Math.log(a1);
    const lnQ = Math.log(q);
    logLineFn = (x: number) => lnA1 + (x - 1) * lnQ;
  }

  // 4. 前 n 项积最值分析 (当 a1 > 0 且 q > 0 时)
  let maxPnInfo: GeometricSequenceResult["maxPnInfo"] = null;
  if (a1 > 0 && q > 0) {
    let isMax = true;
    let targetN = 1;
    let targetPn = terms[0].Pn;

    if (Math.abs(q - 1) < 1e-9) {
      // q === 1 退化常数列: Pn = a1^n
      // a1 > 1: Pn 严格递增，最大值在 n = N；
      // 0 < a1 <= 1: a1 < 1 时 Pn 严格递减、a1 = 1 时 Pn ≡ 1（各项并列取最大），
      //              两种情形均统一报告首个取到最大值的项 n = 1（与递减边界约定一致）。
      if (a1 > 1) {
        isMax = true;
        targetN = N;
        targetPn = terms[N - 1].Pn;
      } else {
        isMax = true;
        targetN = 1;
        targetPn = terms[0].Pn;
      }
    } else if (q < 1) {
      // 0 < q < 1: 无论 a1 > 1 (先增后减) 还是 a1 <= 1 (单调递减)，均求最大值
      isMax = true;
      for (let i = 0; i < terms.length; i++) {
        if (terms[i].Pn > targetPn) {
          targetPn = terms[i].Pn;
          targetN = terms[i].n;
        }
      }
    } else {
      // q > 1
      if (a1 < 1) {
        // a1 < 1: 先减后增，求极小值
        isMax = false;
        for (let i = 0; i < terms.length; i++) {
          if (terms[i].Pn < targetPn) {
            targetPn = terms[i].Pn;
            targetN = terms[i].n;
          }
        }
      } else {
        // a1 >= 1: 严格单调递增，最大值在 n = N
        isMax = true;
        targetN = N;
        targetPn = terms[N - 1].Pn;
      }
    }

    // 判断双最值 (当且仅当存在相邻项比为 1 即 a_{k+1} = 1 且 q != 1 时成立)
    let isDual = false;
    let dualN: number | undefined;
    if (
      Math.abs(q - 1) >= 1e-9 &&
      targetN < N &&
      Math.abs(terms[targetN].an - 1) < 1e-6
    ) {
      isDual = true;
      dualN = targetN + 1;
    }

    maxPnInfo = {
      nMax: targetN,
      maxPn: targetPn,
      isMax,
      isDual,
      dualN,
    };
  }

  // 5. 等长片段和
  const validK = Math.max(2, Math.min(5, Math.round(kSegment)));
  const totalSegments = Math.floor(N / validK);
  let segmentedSums: GeometricSegmentedSumInfo | null = null;

  if (totalSegments >= 2) {
    const segments: GeometricSegmentedSumInfo["segments"] = [];
    for (let seg = 1; seg <= totalSegments; seg++) {
      const startN = (seg - 1) * validK + 1;
      const endN = seg * validK;
      const sumVal =
        terms[endN - 1].Sn - (startN > 1 ? terms[startN - 2].Sn : 0);
      segments.push({
        segmentIndex: seg,
        startN,
        endN,
        sumValue: sumVal,
      });
    }
    segmentedSums = {
      k: validK,
      segments,
      ratio: Math.pow(q, validK),
    };
  }

  // 6. 错位相减数据
  const snTerms = terms.map((t) => ({
    n: t.n,
    val: t.an,
    text: `a_${t.n}`,
  }));
  const qSnTerms = terms.map((t) => ({
    n: t.n,
    val: t.an * q,
    text: `a_${t.n}·q`,
  }));

  return {
    isValid: true,
    terms,
    a1,
    q,
    N,
    qType,
    limitSum,
    expFn,
    logLineFn,
    maxPnInfo,
    segmentedSums,
    staggerData: {
      snTerms,
      qSnTerms,
      diffLeft: { val: a1, text: `a_1` },
      diffRight: { val: a1 * Math.pow(q, N), text: `a_1 q^{${N}}` },
    },
  };
}

/**
 * 错位相减法数据计算: cn = (a1 + (n-1)d) * q^(n-1)
 */
export function calcArithGeoSplit(
  a1: number,
  d: number,
  q: number,
  N: number,
): ArithGeoSplitResult {
  const terms: ArithGeoSplitTerm[] = [];
  let currentTn = 0;

  for (let n = 1; n <= N; n++) {
    const an = a1 + (n - 1) * d;
    const bn = Math.pow(q, n - 1);
    const cn = an * bn;
    currentTn += cn;
    terms.push({ n, an, bn, cn, Tn: currentTn });
  }

  return {
    isValid: true,
    terms,
    a1,
    d,
    q,
    N,
  };
}

/**
 * 裂项相消法数据计算 (标准型): cn = 1 / (n*(n+1)) = 1/n - 1/(n+1)
 */
export function calcTelescoping(N: number): TelescopingResult {
  const terms: TelescopingTerm[] = [];
  let currentTn = 0;

  for (let n = 1; n <= N; n++) {
    const cn = 1 / (n * (n + 1));
    const partA = 1 / n;
    const partB = 1 / (n + 1);
    currentTn += cn;
    terms.push({ n, cn, partA, partB, Tn: currentTn });
  }

  return {
    isValid: true,
    terms,
    N,
    limitSum: 1,
  };
}

/**
 * 扩展 1：分组求和法数据计算 cn = (a1 + (n-1)d) + q^(n-1)
 */
export function calcGroupedSequence(
  a1: number,
  d: number,
  q: number,
  N: number,
): GroupedResult {
  const terms: GroupedTerm[] = [];
  let curSan = 0;
  let curSbn = 0;

  for (let n = 1; n <= N; n++) {
    const an = a1 + (n - 1) * d;
    const bn = Math.pow(q, n - 1);
    const cn = an + bn;
    curSan += an;
    curSbn += bn;
    terms.push({
      n,
      an,
      bn,
      cn,
      San: curSan,
      Sbn: curSbn,
      Tn: curSan + curSbn,
    });
  }

  return {
    isValid: true,
    terms,
    a1,
    d,
    q,
    N,
  };
}

/**
 * 扩展 2：跨项裂项相消法数据计算 cn = 1 / (n*(n+2)) = 0.5 * (1/n - 1/(n+2))
 */
export function calcCrossTelescoping(N: number): CrossTelescopingResult {
  const terms: CrossTelescopingTerm[] = [];
  let currentTn = 0;

  for (let n = 1; n <= N; n++) {
    const cn = 1 / (n * (n + 2));
    const partA = 0.5 / n;
    const partB = 0.5 / (n + 2);
    currentTn += cn;
    terms.push({ n, cn, partA, partB, Tn: currentTn });
  }

  return {
    isValid: true,
    terms,
    N,
    limitSum: 0.75, // 0.5 * (1 + 1/2) = 0.75
  };
}

/**
 * 扩展 3：奇偶项/并项求和法数据计算 cn = (-1)^n * n
 */
export function calcOddEvenSequence(N: number): OddEvenResult {
  const terms: OddEvenTerm[] = [];
  let currentTn = 0;

  for (let n = 1; n <= N; n++) {
    const cn = (n % 2 === 0 ? 1 : -1) * n;
    currentTn += cn;
    const pairSum = n % 2 === 0 ? terms[n - 2].cn + cn : null;

    terms.push({
      n,
      cn,
      pairSum,
      Tn: currentTn,
    });
  }

  return {
    isValid: true,
    terms,
    N,
  };
}

/**
 * 扩展 4：绝对值变号求和法计算 Tn = sum_{k=1}^n |ak|
 */
export function calcAbsSumSequence(
  a1: number,
  d: number,
  N: number,
): AbsSumResult {
  const terms: AbsSumTerm[] = [];
  let currentTn = 0;

  let zeroPoint: number | null = null;
  let n0: number | null = null;
  let signChangeType: AbsSumResult["signChangeType"] = "allPositive";

  if (Math.abs(d) < 1e-9) {
    signChangeType = a1 >= 0 ? "allPositive" : "allNegative";
  } else {
    zeroPoint = 1 - a1 / d;
    if (d < 0) {
      if (a1 <= 0) {
        signChangeType = "allNegative";
      } else {
        signChangeType = "posToNeg";
        n0 = Math.floor(zeroPoint);
      }
    } else {
      if (a1 >= 0) {
        signChangeType = "allPositive";
      } else {
        signChangeType = "negToPos";
        n0 = Math.floor(zeroPoint);
      }
    }
  }

  for (let n = 1; n <= N; n++) {
    const an = a1 + (n - 1) * d;
    const absAn = Math.abs(an);
    currentTn += absAn;
    terms.push({
      n,
      an,
      absAn,
      Tn: currentTn,
      isNegative: an < 0,
    });
  }

  let sumFormula = "T_n = |S_n|";
  if (signChangeType === "posToNeg" && n0 !== null) {
    sumFormula =
      n0 >= N
        ? `T_n = S_n`
        : `T_n = \\begin{cases} S_n, & n \\le ${n0} \\\\ 2S_{${n0}} - S_n, & n > ${n0} \\end{cases}`;
  } else if (signChangeType === "negToPos" && n0 !== null) {
    sumFormula =
      n0 >= N
        ? `T_n = -S_n`
        : `T_n = \\begin{cases} -S_n, & n \\le ${n0} \\\\ S_n - 2S_{${n0}}, & n > ${n0} \\end{cases}`;
  } else if (signChangeType === "allNegative") {
    sumFormula = "T_n = -S_n";
  } else {
    sumFormula = "T_n = S_n";
  }

  return {
    isValid: true,
    terms,
    a1,
    d,
    N,
    zeroPoint,
    n0,
    signChangeType,
    sumFormula,
  };
}

/**
 * 扩展 5：根式裂项相消法计算 cn = 1/(sqrt(n) + sqrt(n+1)) = sqrt(n+1) - sqrt(n)
 */
export function calcRadicalTelescoping(N: number): RadicalTelescopingResult {
  const terms: RadicalTelescopingTerm[] = [];
  let currentTn = 0;

  for (let n = 1; n <= N; n++) {
    const partA = Math.sqrt(n + 1);
    const partB = Math.sqrt(n);
    const cn = partA - partB; // = 1 / (sqrt(n) + sqrt(n+1))
    currentTn += cn;
    terms.push({
      n,
      cn,
      partA,
      partB,
      Tn: currentTn,
    });
  }

  return {
    isValid: true,
    terms,
    N,
    finalTn: Math.sqrt(N + 1) - 1,
  };
}

// ==========================================
// 递推数列与构造法求通项 纯函数模块
// ==========================================

export interface LinearRecurrenceTerm {
  n: number;
  an: number;
  bn: number; // 平移构造数列 bn = an - c
  Sn: number;
}

export interface LinearRecurrenceResult {
  isValid: boolean;
  terms: LinearRecurrenceTerm[];
  a1: number;
  p: number;
  q: number;
  N: number;
  fixedPoint: number | null; // 不动点 c = q / (1 - p)
  isDegenerateArith: boolean; // p = 1 时退化为等差数列
  cobwebPoints: Array<{ x: number; y: number }>; // 蛛网图阶梯点 (x, y)
}

/**
 * 1. 一阶线性递推：a_{n+1} = p * a_n + q (不动点法 / 待定系数平移构造)
 */
export function calcLinearRecurrence(
  a1: number,
  p: number,
  q: number,
  N: number,
): LinearRecurrenceResult {
  if (
    N <= 0 ||
    !Number.isFinite(a1) ||
    !Number.isFinite(p) ||
    !Number.isFinite(q)
  ) {
    return {
      isValid: false,
      terms: [],
      a1,
      p,
      q,
      N,
      fixedPoint: null,
      isDegenerateArith: false,
      cobwebPoints: [],
    };
  }

  const isDegenerateArith = Math.abs(p - 1) < 1e-9;
  const fixedPoint = isDegenerateArith ? null : q / (1 - p);

  const terms: LinearRecurrenceTerm[] = [];
  const cobwebPoints: Array<{ x: number; y: number }> = [];

  let currentAn = a1;
  let currentSum = 0;

  // 蛛网图初始点在对角线 (a1, a1)
  cobwebPoints.push({ x: currentAn, y: currentAn });

  for (let n = 1; n <= N; n++) {
    const bn = fixedPoint !== null ? currentAn - fixedPoint : currentAn;
    currentSum += currentAn;
    terms.push({ n, an: currentAn, bn, Sn: currentSum });

    const nextAn = p * currentAn + q;
    // 垂直走向函数 y = p*x + q: (currentAn, nextAn)
    cobwebPoints.push({ x: currentAn, y: nextAn });
    // 水平走向对角线 y = x: (nextAn, nextAn)
    cobwebPoints.push({ x: nextAn, y: nextAn });

    currentAn = nextAn;
  }

  return {
    isValid: true,
    terms,
    a1,
    p,
    q,
    N,
    fixedPoint,
    isDegenerateArith,
    cobwebPoints,
  };
}

export interface AccumulationRecurrenceTerm {
  n: number;
  deltaK: number; // 增量 f(k)
  an: number;
  Sn: number;
}

export type AccumulationFnType = "arithmetic" | "geometric" | "telescoping";

export interface AccumulationRecurrenceResult {
  isValid: boolean;
  terms: AccumulationRecurrenceTerm[];
  a1: number;
  fnType: AccumulationFnType;
  fnParam: number;
  N: number;
  formulaLatex: string;
}

/**
 * 2. 累加法：a_{n+1} = a_n + f(n)
 * 支持：等差型 f(n)=d*n, 指数型 f(n)=q^n, 裂项型 f(n)=1/(n(n+1))
 */
export function calcAccumulationRecurrence(
  a1: number,
  fnType: AccumulationFnType | "linear" | "exponential",
  fnParam: number,
  N: number,
): AccumulationRecurrenceResult {
  const terms: AccumulationRecurrenceTerm[] = [];
  let currentAn = a1;
  let currentSum = 0;

  const normalizedType: AccumulationFnType =
    fnType === "linear"
      ? "arithmetic"
      : fnType === "exponential"
        ? "geometric"
        : fnType;

  const getDelta = (k: number): number => {
    switch (normalizedType) {
      case "arithmetic":
        return fnParam * k;
      case "geometric":
        return Math.pow(fnParam, k);
      case "telescoping":
        return 1 / (k * (k + 1));
      default:
        return fnParam * k;
    }
  };

  for (let n = 1; n <= N; n++) {
    currentSum += currentAn;
    const deltaK = getDelta(n);
    terms.push({ n, deltaK, an: currentAn, Sn: currentSum });
    currentAn += deltaK;
  }

  let formulaLatex = "";
  if (normalizedType === "arithmetic") {
    formulaLatex = `a_n = a_1 + \\frac{${fnParam}n(n-1)}{2}`;
  } else if (normalizedType === "geometric") {
    formulaLatex =
      fnParam === 1
        ? `a_n = a_1 + (n-1)`
        : `a_n = a_1 + \\frac{${fnParam}(${fnParam}^{n-1}-1)}{${fnParam}-1}`;
  } else {
    formulaLatex = `a_n = a_1 + 1 - \\frac{1}{n}`;
  }

  return {
    isValid: true,
    terms,
    a1,
    fnType: normalizedType,
    fnParam,
    N,
    formulaLatex,
  };
}

export interface MultiplicationRecurrenceTerm {
  n: number;
  ratioK: number; // 比例 f(k)
  an: number;
  Sn: number;
}

export interface MultiplicationRecurrenceResult {
  isValid: boolean;
  terms: MultiplicationRecurrenceTerm[];
  a1: number;
  multType: "n_over_n1" | "n1_over_n" | "pow_two";
  N: number;
  formulaLatex: string;
}

/**
 * 3. 累乘法：a_{n+1} = f(n) * a_n
 */
export function calcMultiplicationRecurrence(
  a1: number,
  multType: "n_over_n1" | "n1_over_n" | "pow_two",
  N: number,
): MultiplicationRecurrenceResult {
  const terms: MultiplicationRecurrenceTerm[] = [];
  let currentAn = a1;
  let currentSum = 0;

  const getRatio = (k: number): number => {
    switch (multType) {
      case "n_over_n1":
        return k / (k + 1);
      case "n1_over_n":
        return (k + 1) / k;
      case "pow_two":
        return Math.pow(2, k);
      default:
        return k / (k + 1);
    }
  };

  for (let n = 1; n <= N; n++) {
    currentSum += currentAn;
    const ratioK = getRatio(n);
    terms.push({ n, ratioK, an: currentAn, Sn: currentSum });
    currentAn *= ratioK;
  }

  let formulaLatex = "";
  if (multType === "n_over_n1") {
    formulaLatex = `a_n = \\frac{a_1}{n}`;
  } else if (multType === "n1_over_n") {
    formulaLatex = `a_n = n \\cdot a_1`;
  } else {
    formulaLatex = `a_n = a_1 \\cdot 2^{\\frac{n(n-1)}{2}}`;
  }

  return {
    isValid: true,
    terms,
    a1,
    multType,
    N,
    formulaLatex,
  };
}

export interface NonHomogeneousExpTerm {
  n: number;
  an: number;
  bn: number; // 构造数列 bn = an / (r^n) 或待定平移项
  Sn: number;
}

export interface NonHomogeneousExpResult {
  isValid: boolean;
  terms: NonHomogeneousExpTerm[];
  a1: number;
  p: number;
  q: number;
  r: number;
  N: number;
  isResonant: boolean; // p = r 共振临界（同除后化为等差数列）
  formulaLatex: string;
}

/**
 * 4. 指数非齐次递推：a_{n+1} = p * a_n + q * r^n (新高考必考同除构造模型)
 */
export function calcNonHomogeneousExpRecurrence(
  a1: number,
  p: number,
  q: number,
  r: number,
  N: number,
): NonHomogeneousExpResult {
  if (
    N <= 0 ||
    !Number.isFinite(a1) ||
    !Number.isFinite(p) ||
    !Number.isFinite(q) ||
    !Number.isFinite(r)
  ) {
    return {
      isValid: false,
      terms: [],
      a1,
      p,
      q,
      r,
      N,
      isResonant: false,
      formulaLatex: "",
    };
  }

  const isResonant = Math.abs(p - r) < 1e-9;
  const terms: NonHomogeneousExpTerm[] = [];
  let currentAn = a1;
  let currentSum = 0;

  for (let n = 1; n <= N; n++) {
    currentSum += currentAn;
    // 构造数列 bn = an / (r^n)
    const rPowN = Math.pow(r, n);
    const bn = Math.abs(rPowN) > 1e-9 ? currentAn / rPowN : 0;
    terms.push({ n, an: currentAn, bn, Sn: currentSum });

    const nextAn = p * currentAn + q * Math.pow(r, n);
    currentAn = nextAn;
  }

  let formulaLatex = "";
  if (isResonant) {
    // p = r: bn+1 = bn + q/r (等差数列，公差 d = q/r)
    formulaLatex = `a_n = [a_1 + (n-1)q] \\cdot ${formatMathNumber(p)}^{n-1}`;
  } else {
    // p != r: an = C * p^(n-1) + [q*r/(r-p)] * r^(n-1)
    const lambda = (q * r) / (r - p);
    const C = a1 - lambda;
    const cStr = C < 0 ? `(${formatMathNumber(C)})` : formatMathNumber(C);
    const lStr =
      lambda < 0 ? `(${formatMathNumber(lambda)})` : formatMathNumber(lambda);
    formulaLatex = `a_n = ${cStr} \\cdot ${formatMathNumber(p)}^{n-1} + ${lStr} \\cdot ${formatMathNumber(r)}^{n-1}`;
  }

  return {
    isValid: true,
    terms,
    a1,
    p,
    q,
    r,
    N,
    isResonant,
    formulaLatex,
  };
}

export interface ReciprocalRecurrenceTerm {
  n: number;
  an: number;
  bn: number; // 倒数 bn = 1 / an
  Sn: number;
}

export interface ReciprocalRecurrenceResult {
  isValid: boolean;
  terms: ReciprocalRecurrenceTerm[];
  a1: number;
  A: number;
  B: number;
  C: number;
  N: number;
  isReciprocalLinear: boolean; // A = C 时倒数为等差数列
  fixedPoints: number[]; // 特征不动点 x = (Ax)/(Bx+C)
}

/**
 * 5. 倒数与分式递推构造法：a_{n+1} = A * a_n / (B * a_n + C)
 */
export function calcReciprocalRecurrence(
  a1: number,
  A: number,
  B: number,
  C: number,
  N: number,
): ReciprocalRecurrenceResult {
  const terms: ReciprocalRecurrenceTerm[] = [];
  let currentAn = a1;
  let currentSum = 0;

  for (let n = 1; n <= N; n++) {
    currentSum += currentAn;
    const bn = Math.abs(currentAn) > 1e-9 ? 1 / currentAn : NaN;
    terms.push({ n, an: currentAn, bn, Sn: currentSum });

    const denom = B * currentAn + C;
    if (Math.abs(denom) < 1e-9) {
      currentAn = NaN;
    } else {
      currentAn = (A * currentAn) / denom;
    }
  }

  // 不动点求解: B x^2 + (C - A) x = 0 => x = 0 或 x = (A - C) / B
  const fixedPoints: number[] = [0];
  if (Math.abs(B) > 1e-9) {
    const nonZeroFp = (A - C) / B;
    if (Math.abs(nonZeroFp) > 1e-9) {
      fixedPoints.push(nonZeroFp);
    }
  }

  return {
    isValid: true,
    terms,
    a1,
    A,
    B,
    C,
    N,
    isReciprocalLinear: Math.abs(A - C) < 1e-9, // 当 A=C 时，倒数 bn 为等差数列 (公差 B/A)
    fixedPoints,
  };
}

export interface SecondOrderRecurrenceTerm {
  n: number;
  an: number;
  bn: number; // 构造差值 bn = a_{n+1} - r1 * an
  Sn: number;
}

export interface SecondOrderRecurrenceResult {
  isValid: boolean;
  terms: SecondOrderRecurrenceTerm[];
  a1: number;
  a2: number;
  p: number;
  q: number;
  N: number;
  r1: number;
  r2: number;
  delta: number;
}

/**
 * 6. 二阶常系数线性递推：a_{n+2} = p * a_{n+1} + q * a_n (特征方程 x^2 - p*x - q = 0)
 */
export function calcSecondOrderRecurrence(
  a1: number,
  a2: number,
  p: number,
  q: number,
  N: number,
): SecondOrderRecurrenceResult {
  const delta = p * p + 4 * q;
  let r1 = 0;
  let r2 = 0;
  if (delta >= 0) {
    r1 = (p + Math.sqrt(delta)) / 2;
    r2 = (p - Math.sqrt(delta)) / 2;
  } else {
    r1 = p / 2;
    r2 = p / 2;
  }

  const terms: SecondOrderRecurrenceTerm[] = [];
  let anPrev = a1;
  let anCurr = a2;
  let currentSum = 0;

  for (let n = 1; n <= N; n++) {
    if (n === 1) {
      currentSum += a1;
      const bn = a2 - r1 * a1;
      terms.push({ n: 1, an: a1, bn, Sn: currentSum });
    } else if (n === 2) {
      currentSum += a2;
      const anNext = p * a2 + q * a1;
      const bn = anNext - r1 * a2;
      terms.push({ n: 2, an: a2, bn, Sn: currentSum });
    } else {
      const anNext = p * anCurr + q * anPrev;
      currentSum += anNext;
      const bnNext = p * anNext + q * anCurr - r1 * anNext;
      terms.push({ n, an: anNext, bn: bnNext, Sn: currentSum });
      anPrev = anCurr;
      anCurr = anNext;
    }
  }

  return {
    isValid: true,
    terms,
    a1,
    a2,
    p,
    q,
    N,
    r1,
    r2,
    delta,
  };
}

/* ============================================================================
 * 数列概念与 $S_n \leftrightarrow a_n$ 互化（选择性必修二 4.1）
 *
 * 课标要求会由前 n 项和求通项，其数学内核只有一句：
 *     a_n = S_n − S_{n-1} (n ≥ 2)，而 a_1 = S_1 必须单独验证。
 * 高考的全部坑都在「单独验证」上：只有当 S_n 的常数项为 0 时，
 * 反推出的式子才恰好在 n = 1 处也成立，此时才能合并成一个式子；
 * 常数项不为 0 时，a_1 与该式在 n = 1 的取值必然不等，必须写成分段形式。
 *
 * 本函数把「给定的 S_n」与「反推的 a_n」「真实的 a_n」三列并置，
 * 让 24 组参数下的落差都能被机器裁决（见 builders/__tests__/sequenceSnToAn.test.ts）。
 * ========================================================================== */

export interface SnToAnTerm {
  /** 项序号 */
  n: number;
  /** 题干给定的前 n 项和 S_n（可含常数项偏移 C） */
  Sn: number;
  /** 由 a_n = S_n − S_{n-1} 反推的通项；n = 1 处无前项，取占位 null */
  anFromSn: number | null;
  /** 反推式 a_n = d·n + (a_1 − d) 在 n = 1 处的取值（用于与 a_1 对比） */
  anFormulaAtN: number;
  /** 该数列真实的通项 a_n = a_1 + (n−1)d */
  anReal: number;
}

export interface SnToAnResult {
  isValid: boolean;
  errorMsg?: string;
  terms: SnToAnTerm[];
  a1: number;
  d: number;
  N: number;
  /** S_n 的常数项偏移 C：C = 0 时反推式对 n = 1 也成立 */
  constOffset: number;
  /** S_1 = a_1 + C，即由 S_n 求出的首项 */
  a1FromSn: number;
  /** 反推式在 n = 1 的取值（= a_1） */
  a1FromFormula: number;
  /** a_1 与反推式在 n = 1 的取值是否一致（等价于 C = 0） */
  isFirstTermConsistent: boolean;
}

export function calcSnToAn(
  a1: number,
  d: number,
  N: number,
  constOffset: number = 0,
): SnToAnResult {
  if (N <= 0 || !Number.isFinite(a1) || !Number.isFinite(d)) {
    return {
      isValid: false,
      errorMsg: "参数无效，项数 N 须大于 0",
      terms: [],
      a1,
      d,
      N,
      constOffset,
      a1FromSn: a1 + constOffset,
      a1FromFormula: a1,
      isFirstTermConsistent: Math.abs(constOffset) < 1e-9,
    };
  }

  const terms: SnToAnTerm[] = [];
  let currentSum = 0;
  let prevSn: number | null = null;

  for (let n = 1; n <= N; n++) {
    const anReal = a1 + (n - 1) * d;
    currentSum += anReal;
    const Sn = currentSum + constOffset;
    terms.push({
      n,
      Sn,
      // 真正按定义作差：a_n = S_n − S_{n−1}（常数项 C 在此抵消，与 anReal 恒等）
      // n = 1 处没有 S_0，只能靠 a_1 = S_1 —— 这正是必须分段验证的原因
      anFromSn: prevSn === null ? null : Sn - prevSn,
      anFormulaAtN: d * n + (a1 - d),
      anReal,
    });
    prevSn = Sn;
  }

  return {
    isValid: true,
    terms,
    a1,
    d,
    N,
    constOffset,
    a1FromSn: a1 + constOffset,
    a1FromFormula: a1,
    isFirstTermConsistent: Math.abs(constOffset) < 1e-9,
  };
}

/* ────────────────────────────────────────────────────────────────
 * 数学归纳法（选学拓展）
 *
 * 归纳法的两句话必须都能兑现，缺一不可：
 *   ① 奠基：P(1) 真的成立（把骨牌推倒第一块）；
 *   ② 递推：P(k) 成立 ⇒ P(k+1) 成立（任意相邻两块骨牌连着）。
 * 这里用一个纯数值引擎把两句话分别落成可核对的算式：
 *   - rows 逐项比对「左边实际算出的值」与「右边公式算出的值」；
 *   - stepChecks 比对「左边从 k 到 k+1 的增量」与「右边从 k 到 k+1 的增量」，
 *     这正是递推那一步在做的事，只是用数值代替了字母。
 * 另外附一个「只奠基不递推」的经典反例 n²+n+41：它在 n = 1..39 全部是质数，
 * n = 40 时塌成 41²，用来证明只有奠基不够。
 * ──────────────────────────────────────────────────────────────── */

export type InductionClaimId = "sum_odd" | "geo_sum" | "linear_term";

export interface InductionRow {
  n: number;
  /** 左边由递推/累加独立算出的值 */
  leftValue: number;
  /** 右边由猜想公式算出的值 */
  rightValue: number;
  holds: boolean;
}

export interface InductionStepCheck {
  k: number;
  /** 左边从 k 到 k+1 的实际增量 */
  lhsIncrement: number;
  /** 右边公式从 k 到 k+1 的增量 */
  rhsIncrement: number;
  ok: boolean;
}

export interface InductionResult {
  claimId: InductionClaimId;
  claimLatex: string;
  rows: InductionRow[];
  stepChecks: InductionStepCheck[];
  /** 奠基 P(1) 是否成立 */
  baseCaseHolds: boolean;
  /** 逐项验证是否全部成立 */
  allRowsHold: boolean;
  /** 递推那一步的增量恒等式是否对全部 k 成立 */
  stepIdentityHolds: boolean;
  /** 只奠基不递推的反例：n² + n + 41 */
  primeCounterexample: { n: number; value: number; factor: number } | null;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

/** 找出 n² + n + 41 不再为质数的最小 n（经典反例，理论值为 40） */
export function findPrimeCounterexample(
  maxN = 200,
): { n: number; value: number; factor: number } | null {
  for (let n = 1; n <= maxN; n++) {
    const v = n * n + n + 41;
    if (!isPrime(v)) {
      let factor = 2;
      while (factor * factor <= v && v % factor !== 0) factor++;
      return {
        n,
        value: v,
        factor: factor * factor === v ? factor : v / factor,
      };
    }
  }
  return null;
}

/**
 * 数学归纳法验证：逐项比对 + 递推增量比对。
 */
export function calcInductionVerification(
  claimId: InductionClaimId,
  opts: { a1?: number; d?: number; N?: number } = {},
): InductionResult {
  const N = Math.max(2, Math.min(20, Math.round(opts.N ?? 8)));
  const a1 = opts.a1 ?? 1;
  const d = opts.d ?? 2;
  const EPS = 1e-9;

  const rows: InductionRow[] = [];
  const stepChecks: InductionStepCheck[] = [];

  if (claimId === "sum_odd") {
    // 左边：1 + 3 + … + (2n−1)，按累加独立计算；右边：n²
    let acc = 0;
    for (let n = 1; n <= N; n++) {
      acc += 2 * n - 1;
      rows.push({
        n,
        leftValue: acc,
        rightValue: n * n,
        holds: Math.abs(acc - n * n) < EPS,
      });
    }
    for (let k = 1; k < N; k++) {
      const lhs = 2 * (k + 1) - 1; // 左边第 k+1 项本身的增量
      const rhs = (k + 1) * (k + 1) - k * k; // 右边 n² 的增量
      stepChecks.push({
        k,
        lhsIncrement: lhs,
        rhsIncrement: rhs,
        ok: Math.abs(lhs - rhs) < EPS,
      });
    }
  } else if (claimId === "geo_sum") {
    // 左边：1 + 2 + … + 2^{n−1}，逐项累加；右边：2^n − 1
    let acc = 0;
    let power = 1;
    for (let n = 1; n <= N; n++) {
      acc += power;
      rows.push({
        n,
        leftValue: acc,
        rightValue: Math.pow(2, n) - 1,
        holds: Math.abs(acc - (Math.pow(2, n) - 1)) < EPS,
      });
      power *= 2;
    }
    for (let k = 1; k < N; k++) {
      const lhs = Math.pow(2, k); // 第 k+1 项
      const rhs = Math.pow(2, k + 1) - 1 - (Math.pow(2, k) - 1);
      stepChecks.push({
        k,
        lhsIncrement: lhs,
        rhsIncrement: rhs,
        ok: Math.abs(lhs - rhs) < EPS,
      });
    }
  } else {
    // 递推：a₁ 已知，a_{n+1} = a_n + d；猜想：a_n = a₁ + (n−1)d
    let an = a1;
    for (let n = 1; n <= N; n++) {
      if (n > 1) an += d;
      const formula = a1 + (n - 1) * d;
      rows.push({
        n,
        leftValue: an,
        rightValue: formula,
        holds: Math.abs(an - formula) < EPS,
      });
    }
    for (let k = 1; k < N; k++) {
      const lhs = a1 + k * d - (a1 + (k - 1) * d); // 递推给出的增量
      const rhs = d; // 公式相邻两项之差
      stepChecks.push({
        k,
        lhsIncrement: lhs,
        rhsIncrement: rhs,
        ok: Math.abs(lhs - rhs) < EPS,
      });
    }
  }

  const claimLatex =
    claimId === "sum_odd"
      ? "P(n):\\quad 1 + 3 + 5 + \\cdots + (2n-1) = n^2"
      : claimId === "geo_sum"
        ? "P(n):\\quad 1 + 2 + 2^2 + \\cdots + 2^{n-1} = 2^n - 1"
        : `P(n):\\quad a_1 = ${a1},\\; a_{n+1} = a_n + ${d} \\;\\Rightarrow\\; a_n = ${a1} + (n-1)\\cdot ${d}`;

  return {
    claimId,
    claimLatex,
    rows,
    stepChecks,
    baseCaseHolds: rows[0]?.holds ?? false,
    allRowsHold: rows.every((r) => r.holds),
    stepIdentityHolds: stepChecks.every((s) => s.ok),
    primeCounterexample: findPrimeCounterexample(),
  };
}
