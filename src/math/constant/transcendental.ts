/**
 * src/math/constant/transcendental.ts
 * 超越函数恒成立与存在性问题求解（纯函数，零外部依赖）
 */

import type {
  ConstantSingleSepResult,
  ConstantSingleDirectResult,
} from "./types";

/** 超越函数模型 A 辅助函数：f(x) = ln(x) / x */
export function evalFTrans(x: number): number {
  return x > 0 ? Math.log(x) / x : NaN;
}

/** 超越函数模型 B 辅助函数：f(x, a) = e^x - ax */
export function evalGParamTrans(x: number, a: number): number {
  return Math.exp(x) - a * x;
}

/**
 * 求解 ln(x) - ax = 0 的实根，用于参变分离违背区间计算
 */
export function solveSepEquation(a: number): {
  r1: number | null;
  r2: number | null;
} {
  if (a <= 0) {
    let left = 0.00001,
      right = 1.0;
    for (let i = 0; i < 30; i++) {
      const mid = (left + right) / 2;
      const val = Math.log(mid) - a * mid;
      if (val > 0) right = mid;
      else left = mid;
    }
    return { r1: (left + right) / 2, r2: null };
  }

  if (a > 1 / Math.E) {
    return { r1: null, r2: null };
  }

  if (Math.abs(a - 1 / Math.E) < 1e-9) {
    return { r1: Math.E, r2: null };
  }

  let left1 = 1.0,
    right1 = Math.E;
  for (let i = 0; i < 30; i++) {
    const mid = (left1 + right1) / 2;
    const val = Math.log(mid) - a * mid;
    if (val > 0) right1 = mid;
    else left1 = mid;
  }
  const r1 = (left1 + right1) / 2;

  let left2 = Math.E,
    right2 = 100.0;
  for (let i = 0; i < 30; i++) {
    const mid = (left2 + right2) / 2;
    const val = Math.log(mid) - a * mid;
    if (val > 0) left2 = mid;
    else right2 = mid;
  }
  const r2 = (left2 + right2) / 2;

  return { r1, r2 };
}

/**
 * 求解 e^x - ax = 0 的实根，用于直接讨论违背区间计算
 */
export function solveDirectEquation(a: number): {
  r1: number | null;
  r2: number | null;
} {
  if (a <= 0) {
    let left = -15.0,
      right = 0.0;
    if (a < -5) left = -30.0;
    for (let i = 0; i < 30; i++) {
      const mid = (left + right) / 2;
      const val = Math.exp(mid) - a * mid;
      if (val > 0) right = mid;
      else left = mid;
    }
    return { r1: (left + right) / 2, r2: null };
  }

  const lna = Math.log(a);
  const fMin = Math.exp(lna) - a * lna;
  if (fMin >= 0) {
    return { r1: null, r2: null };
  }

  let left1 = -15.0,
    right1 = lna;
  for (let i = 0; i < 30; i++) {
    const mid = (left1 + right1) / 2;
    const val = Math.exp(mid) - a * mid;
    if (val > 0) left1 = mid;
    else right1 = mid;
  }
  const r1 = (left1 + right1) / 2;

  let left2 = lna,
    right2 = 15.0;
  for (let i = 0; i < 30; i++) {
    const mid = (left2 + right2) / 2;
    const val = Math.exp(mid) - a * mid;
    if (val > 0) right2 = mid;
    else left2 = mid;
  }
  const r2 = (left2 + right2) / 2;

  return { r1, r2 };
}

/**
 * 求解超越函数单变量参变分离
 * f(x) = ln(x) / x，区间 [m, n] (m > 0)
 */
export function solveConstantSingleSepTrans(
  a: number,
  m: number,
  n: number,
): ConstantSingleSepResult {
  if (m <= 0 || m >= n) {
    return {
      isValid: false,
      isDegenerate: true,
      degenerateType: "interval_collapse",
      fMin: 0,
      xFMin: 0,
      fMax: 0,
      xFMax: 0,
      a,
      m,
      n,
      isAlwaysTrue: false,
      isExistTrue: false,
      violatedInterval: null,
    };
  }

  const e = Math.E;
  let fMin: number;
  let xFMin: number;
  let fMax: number;
  let xFMax: number;

  if (e < m) {
    fMax = evalFTrans(m);
    xFMax = m;
    fMin = evalFTrans(n);
    xFMin = n;
  } else if (e > n) {
    fMax = evalFTrans(n);
    xFMax = n;
    fMin = evalFTrans(m);
    xFMin = m;
  } else {
    fMax = 1 / Math.E;
    xFMax = e;
    const fm = evalFTrans(m);
    const fn = evalFTrans(n);
    fMin = fm < fn ? fm : fn;
    xFMin = fm < fn ? m : n;
  }

  const isAlwaysTrue = fMin >= a;
  const isExistTrue = fMax >= a;

  let violatedInterval: [number, number] | null = null;
  const { r1, r2 } = solveSepEquation(a);

  if (a <= 0) {
    if (r1 !== null) {
      const start = m;
      const end = Math.min(n, r1);
      if (start < end) {
        violatedInterval = [start, end];
      }
    }
  } else {
    if (a > 1 / Math.E) {
      violatedInterval = [m, n];
    } else if (r1 !== null && r2 !== null) {
      const start1 = m;
      const end1 = Math.min(n, r1);
      const start2 = Math.max(m, r2);
      const end2 = n;

      const len1 = end1 - start1;
      const len2 = end2 - start2;
      if (len1 > 0 && len2 > 0) {
        violatedInterval = len1 > len2 ? [start1, end1] : [start2, end2];
      } else if (len1 > 0) {
        violatedInterval = [start1, end1];
      } else if (len2 > 0) {
        violatedInterval = [start2, end2];
      }
    }
  }

  return {
    isValid: true,
    isDegenerate: false,
    degenerateType: "none",
    fMin,
    xFMin,
    fMax,
    xFMax,
    a,
    m,
    n,
    isAlwaysTrue,
    isExistTrue,
    violatedInterval,
  };
}

/**
 * 求解超越函数单变量直接最值讨论
 * f(x) = e^x - ax，区间 [m, n]，判定 f(x) >= 0 恒成立
 */
export function solveConstantSingleDirectTrans(
  a: number,
  m: number,
  n: number,
): ConstantSingleDirectResult {
  if (m >= n) {
    return {
      isValid: false,
      isDegenerate: true,
      degenerateType: "interval_collapse",
      a,
      m,
      n,
      fMin: 0,
      xFMin: 0,
      fMax: 0,
      xFMax: 0,
      isAlwaysTrue: false,
      violatedInterval: null,
      discussionType: "inside",
    };
  }

  let fMin: number;
  let xFMin: number;
  let discussionType: "left" | "inside" | "right";

  if (a <= 0) {
    fMin = evalGParamTrans(m, a);
    xFMin = m;
    discussionType = "left";
  } else {
    const lna = Math.log(a);
    if (lna < m) {
      fMin = evalGParamTrans(m, a);
      xFMin = m;
      discussionType = "left";
    } else if (lna > n) {
      fMin = evalGParamTrans(n, a);
      xFMin = n;
      discussionType = "right";
    } else {
      fMin = a - a * lna;
      xFMin = lna;
      discussionType = "inside";
    }
  }

  const fm = evalGParamTrans(m, a);
  const fn = evalGParamTrans(n, a);
  const fMax = fm > fn ? fm : fn;
  const xFMax = fm > fn ? m : n;

  const isAlwaysTrue = fMin >= 0;

  let violatedInterval: [number, number] | null = null;
  const { r1, r2 } = solveDirectEquation(a);

  if (a <= 0) {
    if (r1 !== null) {
      const start = m;
      const end = Math.min(n, r1);
      if (start < end) {
        violatedInterval = [start, end];
      }
    }
  } else {
    if (fMin < 0 && r1 !== null && r2 !== null) {
      const start = Math.max(m, r1);
      const end = Math.min(n, r2);
      if (start < end) {
        violatedInterval = [start, end];
      }
    }
  }

  return {
    isValid: true,
    isDegenerate: false,
    degenerateType: "none",
    a,
    m,
    n,
    fMin,
    xFMin,
    fMax,
    xFMax,
    isAlwaysTrue,
    violatedInterval,
    discussionType,
  };
}
