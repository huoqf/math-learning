/**
 * src/math/derivativeShift.ts
 * 隐零点定理与极值点偏移 纯数学计算模块
 * 零 React/DOM/window 依赖
 */

export type ImplicitZeroModel = "x_ln_x" | "exp_minus_ax";
export type ExtremumShiftModel = "xe_neg_x" | "lnx_div_x";

export interface ImplicitZeroResult {
  x0: number; // 隐零点 (满足 f'(x0) = 0)
  y0: number; // 极值 f(x0)
  traceY: number; // 极值消元轨迹 h(x0)
  isValid: boolean;
  isDegenerate: boolean;
  fn: (x: number) => number;
  dfn: (x: number) => number;
  traceFn: (x: number) => number;
}

export interface ExtremumShiftResult {
  x0: number; // 极值点
  y0: number; // 极值 max f(x)
  k: number; // 割线高度 y = k
  x1: number; // 割线左根
  x2: number; // 割线右根
  midX: number; // 中点 (x1 + x2) / 2
  delta: number; // 偏移量 (x1 + x2) / 2 - x0
  shiftType: "right" | "left" | "none";
  isValid: boolean;
  fn: (x: number) => number;
  mirrorFn: (x: number) => number; // 镜像曲线 y = f(2x0 - x)
  diffFn: (x: number) => number; // 差值函数 F(x) = f(x) - f(2x0 - x)
}

export interface LogMeanResult {
  x1: number;
  x2: number;
  t: number; // x2 / x1
  geoMean: number; // sqrt(x1 * x2)
  logMean: number; // (x2 - x1) / (ln x2 - ln x1)
  ariMean: number; // (x1 + x2) / 2
  isValid: boolean;
}

/**
 * 隐零点求解与代换消元
 */
export function solveImplicitZero(
  a: number,
  model: ImplicitZeroModel,
): ImplicitZeroResult {
  if (model === "x_ln_x") {
    // f(x) = x ln x - a x + 1, x > 0
    // f'(x) = ln x + 1 - a = 0  =>  ln x0 = a - 1  =>  x0 = e^(a - 1)
    // 极值消元: ln x0 = a - 1  =>  f(x0) = x0(a - 1) - a x0 + 1 = 1 - x0
    const x0 = Math.exp(a - 1);
    const y0 = x0 * Math.log(x0) - a * x0 + 1;
    const traceY = 1 - x0;

    const fn = (x: number) => (x > 0 ? x * Math.log(x) - a * x + 1 : NaN);
    const dfn = (x: number) => (x > 0 ? Math.log(x) + 1 - a : NaN);
    const traceFn = (x: number) => 1 - x;

    return {
      x0,
      y0,
      traceY,
      isValid: true,
      isDegenerate: Math.abs(a) < 1e-4,
      fn,
      dfn,
      traceFn,
    };
  } else {
    // model === 'exp_minus_ax'
    // f(x) = e^x - a x,  x in R
    // f'(x) = e^x - a = 0  =>  x0 = ln a  (需 a > 0)
    // 极值消元: e^x0 = a  =>  f(x0) = a - a ln a = a(1 - ln a) = x0 e^x0 - ... -> 轨迹 h(x) = e^x (1 - x)
    if (a <= 0.001) {
      return {
        x0: 0,
        y0: 1,
        traceY: 1,
        isValid: false,
        isDegenerate: true,
        fn: (x: number) => Math.exp(x) - a * x,
        dfn: (x: number) => Math.exp(x) - a,
        traceFn: (x: number) => Math.exp(x) * (1 - x),
      };
    }

    const x0 = Math.log(a);
    const y0 = Math.exp(x0) - a * x0;
    const traceY = Math.exp(x0) * (1 - x0);

    const fn = (x: number) => Math.exp(x) - a * x;
    const dfn = (x: number) => Math.exp(x) - a;
    const traceFn = (x: number) => Math.exp(x) * (1 - x);

    return {
      x0,
      y0,
      traceY,
      isValid: true,
      isDegenerate: Math.abs(a - 1) < 1e-4,
      fn,
      dfn,
      traceFn,
    };
  }
}

/**
 * 二分逼近法数值求解 f(x) = k 的双根
 */
function findRoot(
  fn: (x: number) => number,
  target: number,
  min: number,
  max: number,
): number {
  let low = min;
  let high = max;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const val = fn(mid);
    if (isNaN(val)) break;
    if (fn(low) < fn(high)) {
      if (val < target) low = mid;
      else high = mid;
    } else {
      if (val > target) low = mid;
      else high = mid;
    }
  }
  return (low + high) / 2;
}

/**
 * 极值点偏移求解
 */
export function solveExtremumShift(
  kParam: number,
  model: ExtremumShiftModel,
): ExtremumShiftResult {
  if (model === "xe_neg_x") {
    // f(x) = x * e^(-x), 极值点 x0 = 1, 极大值 1/e ≈ 0.367879
    const x0 = 1.0;
    const maxY = 1 / Math.E;
    // k 处于 (0.01, maxY - 0.001)
    const k = Math.min(Math.max(kParam, 0.01), maxY - 0.001);
    const fn = (x: number) => x * Math.exp(-x);

    // 左根 x1 in (0, 1), 右根 x2 in (1, 6)
    const x1 = findRoot(fn, k, 0.0001, 0.9999);
    const x2 = findRoot(fn, k, 1.0001, 8.0);

    const midX = (x1 + x2) / 2;
    const delta = midX - x0;

    const mirrorFn = (x: number) => fn(2 * x0 - x);
    const diffFn = (x: number) => fn(x) - mirrorFn(x);

    return {
      x0,
      y0: maxY,
      k,
      x1,
      x2,
      midX,
      delta,
      shiftType: delta > 1e-4 ? "right" : delta < -1e-4 ? "left" : "none",
      isValid: true,
      fn,
      mirrorFn,
      diffFn,
    };
  } else {
    // model === 'lnx_div_x'
    // f(x) = (ln x) / x, 极值点 x0 = e ≈ 2.71828, 极大值 1/e ≈ 0.367879
    const x0 = Math.E;
    const maxY = 1 / Math.E;
    const k = Math.min(Math.max(kParam, 0.01), maxY - 0.001);
    const fn = (x: number) => (x > 0 ? Math.log(x) / x : NaN);

    // 左根 x1 in (1, e), 右根 x2 in (e, 15)
    const x1 = findRoot(fn, k, 1.0001, Math.E - 0.0001);
    const x2 = findRoot(fn, k, Math.E + 0.0001, 20.0);

    const midX = (x1 + x2) / 2;
    const delta = midX - x0;

    const mirrorFn = (x: number) => (2 * x0 - x > 0 ? fn(2 * x0 - x) : NaN);
    const diffFn = (x: number) => fn(x) - mirrorFn(x);

    return {
      x0,
      y0: maxY,
      k,
      x1,
      x2,
      midX,
      delta,
      shiftType: delta > 1e-4 ? "right" : delta < -1e-4 ? "left" : "none",
      isValid: true,
      fn,
      mirrorFn,
      diffFn,
    };
  }
}

/**
 * 对数均值不等式计算
 */
export function solveLogMean(x1: number, x2: number): LogMeanResult {
  if (x1 <= 0 || x2 <= 0 || Math.abs(x1 - x2) < 1e-5) {
    return {
      x1,
      x2,
      t: 1,
      geoMean: Math.max(0, x1),
      logMean: Math.max(0, x1),
      ariMean: Math.max(0, x1),
      isValid: false,
    };
  }

  const t = x2 / x1;
  const geoMean = Math.sqrt(x1 * x2);
  const logMean = (x2 - x1) / (Math.log(x2) - Math.log(x1));
  const ariMean = (x1 + x2) / 2;

  return {
    x1,
    x2,
    t,
    geoMean,
    logMean,
    ariMean,
    isValid: true,
  };
}
