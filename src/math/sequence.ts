/**
 * src/math/sequence.ts
 * 数列纯函数计算模块 — 零 DOM、零 React 依赖、带 validity 状态
 */

export interface ArithmeticTermInfo {
  n: number;
  an: number;
  Sn: number;
}

export interface GeometricTermInfo {
  n: number;
  an: number;
  Sn: number;
}

export interface ArithmeticSequenceResult {
  isValid: boolean;
  errorMsg?: string;
  terms: ArithmeticTermInfo[];
  a1: number;
  d: number;
  N: number;
  zeroPointN: number | null;
  maxSnInfo: {
    nMax: number;
    maxSn: number;
  } | null;
  lineFn: (x: number) => number;
  parabolaFn: (x: number) => number;
}

export interface GeometricSequenceResult {
  isValid: boolean;
  errorMsg?: string;
  terms: GeometricTermInfo[];
  a1: number;
  q: number;
  N: number;
  limitSum: number | null;
  expFn: ((x: number) => number) | null;
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

/**
 * 计算等差数列性质与各项
 */
export function calcArithmeticSequence(
  a1: number,
  d: number,
  N: number,
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
      maxSnInfo: null,
      lineFn: () => 0,
      parabolaFn: () => 0,
    };
  }

  const terms: ArithmeticTermInfo[] = [];
  let currentSum = 0;

  for (let n = 1; n <= N; n++) {
    const an = a1 + (n - 1) * d;
    currentSum += an;
    terms.push({ n, an, Sn: currentSum });
  }

  const lineFn = (x: number) => d * x + (a1 - d);
  const parabolaFn = (x: number) => 0.5 * d * x * x + (a1 - 0.5 * d) * x;

  let zeroPointN: number | null = null;
  if (Math.abs(d) > 1e-9) {
    const zN = 1 - a1 / d;
    if (zN >= 1 && zN <= N) {
      zeroPointN = zN;
    }
  }

  let bestN = 1;
  let bestSn = terms[0].Sn;
  if (d < 0) {
    for (let i = 0; i < terms.length; i++) {
      if (terms[i].Sn > bestSn) {
        bestSn = terms[i].Sn;
        bestN = terms[i].n;
      }
    }
  } else if (d > 0) {
    for (let i = 0; i < terms.length; i++) {
      if (terms[i].Sn < bestSn) {
        bestSn = terms[i].Sn;
        bestN = terms[i].n;
      }
    }
  }

  return {
    isValid: true,
    terms,
    a1,
    d,
    N,
    zeroPointN,
    maxSnInfo: { nMax: bestN, maxSn: bestSn },
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
): GeometricSequenceResult {
  if (N <= 0 || !Number.isFinite(a1) || !Number.isFinite(q)) {
    return {
      isValid: false,
      errorMsg: "参数无效",
      terms: [],
      a1,
      q,
      N,
      limitSum: null,
      expFn: null,
    };
  }

  const terms: GeometricTermInfo[] = [];
  let currentSum = 0;
  let currentAn = a1;

  for (let n = 1; n <= N; n++) {
    if (n === 1) {
      currentAn = a1;
    } else {
      currentAn = currentAn * q;
    }
    currentSum += currentAn;
    terms.push({ n, an: currentAn, Sn: currentSum });
  }

  let limitSum: number | null = null;
  if (Math.abs(q) < 1) {
    limitSum = a1 / (1 - q);
  }

  let expFn: ((x: number) => number) | null = null;
  if (q > 0) {
    expFn = (x: number) => a1 * Math.pow(q, x - 1);
  }

  return {
    isValid: true,
    terms,
    a1,
    q,
    N,
    limitSum,
    expFn,
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

export interface AccumulationRecurrenceResult {
  isValid: boolean;
  terms: AccumulationRecurrenceTerm[];
  a1: number;
  stepType: "linear" | "exponential";
  stepParam: number;
  N: number;
}

/**
 * 2. 累加法：a_{n+1} = a_n + f(n)
 */
export function calcAccumulationRecurrence(
  a1: number,
  stepType: "linear" | "exponential",
  stepParam: number,
  N: number,
): AccumulationRecurrenceResult {
  const terms: AccumulationRecurrenceTerm[] = [];
  let currentAn = a1;
  let currentSum = 0;

  for (let n = 1; n <= N; n++) {
    currentSum += currentAn;
    const deltaK =
      stepType === "linear" ? stepParam * n : Math.pow(stepParam, n - 1);
    terms.push({ n, deltaK, an: currentAn, Sn: currentSum });
    currentAn += deltaK;
  }

  return {
    isValid: true,
    terms,
    a1,
    stepType,
    stepParam,
    N,
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
  multType: "n_over_n1" | "n1_over_n";
  N: number;
}

/**
 * 3. 累乘法：a_{n+1} = f(n) * a_n
 */
export function calcMultiplicationRecurrence(
  a1: number,
  multType: "n_over_n1" | "n1_over_n",
  N: number,
): MultiplicationRecurrenceResult {
  const terms: MultiplicationRecurrenceTerm[] = [];
  let currentAn = a1;
  let currentSum = 0;

  for (let n = 1; n <= N; n++) {
    currentSum += currentAn;
    const ratioK = multType === "n_over_n1" ? n / (n + 1) : (n + 1) / n;
    terms.push({ n, ratioK, an: currentAn, Sn: currentSum });
    currentAn *= ratioK;
  }

  return {
    isValid: true,
    terms,
    a1,
    multType,
    N,
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
  isReciprocalLinear: boolean;
}

/**
 * 4. 倒数构造法：a_{n+1} = A * a_n / (B * a_n + C) => 1/a_{n+1} = (C/A)*(1/a_n) + B/A
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

  return {
    isValid: true,
    terms,
    a1,
    A,
    B,
    C,
    N,
    isReciprocalLinear: Math.abs(A - C) < 1e-9, // 当 A=C 时，倒数 bn 为等差数列
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
}

/**
 * 5. 二阶常系数线性递推：a_{n+2} = p * a_{n+1} + q * a_n (特征方程 x^2 - p*x - q = 0)
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
  };
}
