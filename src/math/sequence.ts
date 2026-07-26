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
