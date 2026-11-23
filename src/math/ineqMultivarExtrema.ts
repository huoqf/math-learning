/**
 * src/math/ineqMultivarExtrema.ts
 * 必修一不等式压轴：多元条件最值四大通法纯计算层（Zero Side-effects）
 *
 * 1. 常数“1”的代换：px + qy = c 下求 m/x + n/y 最小值
 * 2. 主元消元降维：(x+b)(y+a) = k 下求 x+y 最小值
 * 3. 齐次比值换元：t = x/y > 0 下求 t + k/t 最小值
 * 4. 和积互化消元：x + y + xy = c 下求 x+y 最小值与 xy 最大值
 */

export type MultivarIneqMode = "oneSub" | "elim" | "homog" | "sumProd";

export interface OneSubResult {
  p: number;
  q: number;
  m: number;
  n: number;
  c: number;
  minVal: number;
  optX: number;
  optY: number;
  probeX: number;
  probeY: number;
  probeVal: number;
  validity: "ok" | "invalid";
}

export interface ElimResult {
  a: number;
  b: number;
  kVal: number;
  minSum: number;
  optX: number;
  optY: number;
  probeX: number;
  probeY: number;
  probeSum: number;
  validity: "ok" | "no_positive_opt";
}

export interface HomogResult {
  k: number;
  ratioT: number;
  currentVal: number;
  minVal: number;
  optT: number;
  validity: "ok";
}

export interface SumProdResult {
  c: number;
  minSum: number;
  optXForSum: number;
  maxProd: number;
  probeX: number;
  probeY: number;
  probeSum: number;
  validity: "ok" | "invalid";
}

/** 1 的代换：px+qy=c 求 m/x + n/y 最小值 */
export function calcOneSubstitution(
  pRaw: number,
  qRaw: number,
  mRaw: number,
  nRaw: number,
  cRaw: number,
  probeXRaw: number,
): OneSubResult {
  const p = Math.max(0.5, pRaw);
  const q = Math.max(0.5, qRaw);
  const m = Math.max(0.5, mRaw);
  const n = Math.max(0.5, nRaw);
  const c = Math.max(1, cRaw);

  const rootProd = Math.sqrt(p * m) + Math.sqrt(q * n);
  const minVal = (rootProd * rootProd) / c;
  const optX = (c * Math.sqrt(m)) / (Math.sqrt(p) * rootProd);
  const optY = (c - p * optX) / q;

  const maxX = c / p;
  const probeX = Math.max(0.15, Math.min(maxX - 0.15, probeXRaw));
  const probeY = (c - p * probeX) / q;
  const probeVal =
    probeX > 1e-6 && probeY > 1e-6 ? m / probeX + n / probeY : Infinity;

  return {
    p,
    q,
    m,
    n,
    c,
    minVal,
    optX,
    optY,
    probeX,
    probeY,
    probeVal,
    validity: optX > 0 && optY > 0 ? "ok" : "invalid",
  };
}

/** 凑因式消元：xy + ax + by = c <=> (x+b)(y+a) = c + ab */
export function calcElimMethod(
  aRaw: number,
  bRaw: number,
  cRaw: number,
  probeXRaw: number,
): ElimResult {
  const a = Math.max(0.5, aRaw);
  const b = Math.max(0.5, bRaw);
  const kVal = Math.max(1, cRaw + a * b);
  const sqrtK = Math.sqrt(kVal);
  const optX = sqrtK - b;
  const optY = sqrtK - a;
  const minSum = 2 * sqrtK - (a + b);

  const probeX = Math.max(0.2, probeXRaw);
  const probeY = kVal / (probeX + b) - a;
  const validProbe = probeY > 1e-4;

  return {
    a,
    b,
    kVal,
    minSum,
    optX,
    optY,
    probeX,
    probeY: validProbe ? probeY : optY,
    probeSum: validProbe ? probeX + probeY : minSum,
    validity: optX > 0 && optY > 0 ? "ok" : "no_positive_opt",
  };
}

/** 齐次化比值换元：t = x/y > 0，目标 t + k/t */
export function calcHomogMethod(kRaw: number, ratioTRaw: number): HomogResult {
  const k = Math.max(0.5, kRaw);
  const ratioT = Math.max(0.2, ratioTRaw);
  const currentVal = ratioT + k / ratioT;
  const optT = Math.sqrt(k);
  const minVal = 2 * optT;
  return {
    k,
    ratioT,
    currentVal,
    minVal,
    optT,
    validity: "ok",
  };
}

/** 和积互化：x + y + xy = c (x, y > 0) */
export function calcSumProdMethod(
  cRaw: number,
  probeXRaw: number,
): SumProdResult {
  const c = Math.max(1, cRaw);
  // (x+y) + ((x+y)/2)^2 >= c  => s^2 + 4s - 4c >= 0 => s >= 2*sqrt(1+c) - 2
  const minSum = 2 * Math.sqrt(1 + c) - 2;
  const optXForSum = minSum / 2;
  // xy + 2*sqrt(xy) <= c => sqrt(xy) <= sqrt(1+c) - 1
  const maxSqrtP = Math.sqrt(1 + c) - 1;
  const maxProd = maxSqrtP * maxSqrtP;

  const probeX = Math.max(0.1, Math.min(c - 0.1, probeXRaw));
  const probeY = (c - probeX) / (1 + probeX);
  return {
    c,
    minSum,
    optXForSum,
    maxProd,
    probeX,
    probeY,
    probeSum: probeX + probeY,
    validity: c > 0 ? "ok" : "invalid",
  };
}
