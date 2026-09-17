/**
 * src/math/derivativeShift.ts
 * 隐零点定理与极值点偏移 纯数学计算模块
 * 零 React/DOM/window 依赖
 */

export type ImplicitZeroModel = "x_ln_x" | "exp_linear";
export type ExtremumShiftModel = "xe_neg_x" | "ln_x_div_x";

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
  y0: number; // 极大值 max f(x)
  k: number; // 割线高度 y = k
  x1: number; // 割线左根
  x2: number; // 割线右根
  midX: number; // 加法中点 (x1 + x2) / 2
  delta: number; // 加法偏移量 (x1 + x2) / 2 - x0
  shiftType: "right" | "left" | "none";
  prod: number; // 乘积 x1 * x2
  prodShiftType: "greater" | "less" | "none"; // 乘积偏移: x1 * x2 与 x0^2 比较
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
 * 二分逼近法求单调函数 f(x) = target 的数值根（纯变号二分，与增减方向无关）。
 *
 * 与旧实现的根本差别：**强制要求区间两端严格异号**（即区间内确实存在根）。
 *  - 两端同号 => 区间内无根，返回 null。旧实现在此情形下会一路缩到端点，
 *    把「根在搜索上界之外」伪装成「根恰好等于上界」，直接向看板输出错误数字；
 *  - 迭代中遇到 NaN / Infinity => 返回 null。
 */
function findRoot(
  fn: (x: number) => number,
  target: number,
  min: number,
  max: number,
  maxIter = 80,
): number | null {
  if (!(min < max)) return null;

  let gLow = fn(min) - target;
  let gHigh = fn(max) - target;
  if (!Number.isFinite(gLow) || !Number.isFinite(gHigh)) return null;
  if (gLow === 0) return min;
  if (gHigh === 0) return max;
  if (gLow * gHigh > 0) return null;

  let low = min;
  let high = max;
  for (let i = 0; i < maxIter; i++) {
    const mid = (low + high) / 2;
    const gMid = fn(mid) - target;
    if (!Number.isFinite(gMid)) return null;
    if (gMid === 0) return mid;
    if (gLow * gMid < 0) {
      high = mid;
      gHigh = gMid;
    } else {
      low = mid;
      gLow = gMid;
    }
  }
  return (low + high) / 2;
}

/**
 * 单峰函数**下降支**求根：自 from 起向右自适应扩张上界，出现变号后再二分。
 *
 * 极值点偏移的右根 x2 随割线高度 k 减小而急剧右移（k -> 0+ 时 x2 -> +∞：
 * 对数模型 k = 0.05 时 x2 ≈ 90，k = 0.01 时 x2 ≈ 647），任何固定上界都会失效。
 * 故此处按 1、3、7、15、31… 的跨度倍增扩张，上界封顶 expandCap。
 */
function findRootDescending(
  fn: (x: number) => number,
  target: number,
  from: number,
  expandCap = 1e6,
): number | null {
  const gFrom = fn(from) - target;
  if (!Number.isFinite(gFrom)) return null;
  if (gFrom === 0) return from;
  if (gFrom < 0) return null; // 起点已在目标下方：下降支上不存在该根

  let low = from;
  let span = 1;
  let high = low + span;
  while (high <= expandCap) {
    const gHigh = fn(high) - target;
    if (!Number.isFinite(gHigh)) return null;
    if (gHigh <= 0) return findRoot(fn, target, low, high);
    low = high;
    span *= 2;
    high = low + span;
  }
  return null;
}

/**
 * 隐零点求解与代换消元 (真实超越方程，新高考标准)
 */
export function solveImplicitZero(
  a: number,
  model: ImplicitZeroModel,
): ImplicitZeroResult {
  if (model === "x_ln_x") {
    // f(x) = x ln x + (1/2)x^2 - ax, x > 0 (高考经典对数加线性型)
    // f'(x) = ln x + x + 1 - a
    // 零点存在性：f'(x) 在 (0, +∞) 严格递增，f'(0+) -> -∞, 当 a > 1 时 f'(a) = ln a + 1 > 0
    // 存在唯一超越隐零点 x0: ln x0 + x0 + 1 = a
    // 极值消元代换：f(x0) = x0(a - 1 - x0) + (1/2)x0^2 - a x0 = -(1/2)x0^2 - x0
    // 消元轨迹: h(x) = -(1/2)x^2 - x (完全不含参数 a 的抛物线，消参下沉！)
    const fn = (x: number) =>
      x > 0 ? x * Math.log(x) + 0.5 * x * x - a * x : NaN;
    const dfn = (x: number) => (x > 0 ? Math.log(x) + x + 1 - a : NaN);
    const traceFn = (x: number) => -0.5 * x * x - x;

    if (a < 0.2) {
      return {
        x0: 0.1,
        y0: fn(0.1),
        traceY: traceFn(0.1),
        isValid: false,
        isDegenerate: true,
        fn,
        dfn,
        traceFn,
      };
    }

    // 数值求解超越方程 f'(x) = 0 (f'(x) 在 (0, +∞) 严格递增，区间两端严格异号)
    const x0 = findRoot(dfn, 0, 0.0001, Math.max(a + 2, 6));
    if (x0 === null) {
      // 根有效性守卫：区间未能括住零点时判为无效解，不输出伪造的零点
      return {
        x0: NaN,
        y0: NaN,
        traceY: NaN,
        isValid: false,
        isDegenerate: true,
        fn,
        dfn,
        traceFn,
      };
    }
    const y0 = fn(x0);
    const traceY = traceFn(x0);

    return {
      x0,
      y0,
      traceY,
      isValid: true,
      isDegenerate: false,
      fn,
      dfn,
      traceFn,
    };
  } else {
    // model === 'exp_linear'
    // f(x) = e^x - (1/2)x^2 - ax, x in R (2018全国II卷/2020新高考I卷原型)
    // f'(x) = e^x - x - a
    // 当 a > 1 时，f'(0) = 1 - a < 0, f'(a) = e^a - 2a > 0, 存在唯一正隐零点 x0: e^x0 - x0 = a
    // 极值消元代换 (消去 a = e^x0 - x0):
    // f(x0) = e^x0 - (1/2)x0^2 - (e^x0 - x0)x0 = e^x0(1 - x0) + (1/2)x0^2
    // 消元轨迹: h(x) = e^x(1 - x) + (1/2)x^2
    const fn = (x: number) => Math.exp(x) - 0.5 * x * x - a * x;
    const dfn = (x: number) => Math.exp(x) - x - a;
    const traceFn = (x: number) => Math.exp(x) * (1 - x) + 0.5 * x * x;

    if (a <= 1.001) {
      return {
        x0: 0,
        y0: 1,
        traceY: 1,
        isValid: false,
        isDegenerate: true,
        fn,
        dfn,
        traceFn,
      };
    }

    // 数值求解超越方程 f'(x) = 0 (f'(x) 在 [0, +∞) 严格递增，区间两端严格异号)
    const x0 = findRoot(dfn, 0, 0, Math.max(Math.log(a) + 1.5, 5));
    if (x0 === null) {
      // 根有效性守卫：区间未能括住零点时判为无效解，不输出伪造的零点
      return {
        x0: NaN,
        y0: NaN,
        traceY: NaN,
        isValid: false,
        isDegenerate: true,
        fn,
        dfn,
        traceFn,
      };
    }
    const y0 = fn(x0);
    const traceY = traceFn(x0);

    return {
      x0,
      y0,
      traceY,
      isValid: true,
      isDegenerate: false,
      fn,
      dfn,
      traceFn,
    };
  }
}

/**
 * 极值点偏移求解 (含对称构造与乘积偏移)
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
    const mirrorFn = (x: number) => fn(2 * x0 - x);
    const diffFn = (x: number) => fn(x) - mirrorFn(x);

    // 左根 x1 in (0, x0)：上升支，区间两端严格异号
    const x1 = findRoot(fn, k, 0.0001, x0 - 0.0001);
    // 右根 x2 in (x0, +∞)：下降支，搜索上界自适应扩张
    const x2 = findRootDescending(fn, k, x0 + 0.0001);

    // 根有效性守卫：任一根未被严格括住即判为无解，绝不把搜索上界当作根返回
    if (x1 === null || x2 === null) {
      return {
        x0,
        y0: maxY,
        k,
        x1: NaN,
        x2: NaN,
        midX: NaN,
        delta: NaN,
        shiftType: "none",
        prod: NaN,
        prodShiftType: "none",
        isValid: false,
        fn,
        mirrorFn,
        diffFn,
      };
    }

    const midX = (x1 + x2) / 2;
    const delta = midX - x0;
    const prod = x1 * x2;

    return {
      x0,
      y0: maxY,
      k,
      x1,
      x2,
      midX,
      delta,
      shiftType: delta > 1e-4 ? "right" : delta < -1e-4 ? "left" : "none",
      prod,
      prodShiftType: prod > 1 ? "greater" : prod < 1 ? "less" : "none",
      isValid: true,
      fn,
      mirrorFn,
      diffFn,
    };
  } else {
    // model === 'ln_x_div_x'
    // f(x) = (ln x) / x, 极值点 x0 = e ≈ 2.71828, 极大值 1/e ≈ 0.367879
    const x0 = Math.E;
    const maxY = 1 / Math.E;
    const k = Math.min(Math.max(kParam, 0.01), maxY - 0.001);
    const fn = (x: number) => (x > 0 ? Math.log(x) / x : NaN);
    const mirrorFn = (x: number) => (2 * x0 - x > 0 ? fn(2 * x0 - x) : NaN);
    const diffFn = (x: number) => fn(x) - mirrorFn(x);

    // 左根 x1 in (1, e)：上升支，区间两端严格异号
    const x1 = findRoot(fn, k, 1.0001, x0 - 0.0001);
    // 右根 x2 in (e, +∞)：下降支，搜索上界自适应扩张
    // （固定上界 20 会漏根：k < ln20/20 ≈ 0.1498 时真根已在界外）
    const x2 = findRootDescending(fn, k, x0 + 0.0001);

    // 根有效性守卫：任一根未被严格括住即判为无解，绝不把搜索上界当作根返回
    if (x1 === null || x2 === null) {
      return {
        x0,
        y0: maxY,
        k,
        x1: NaN,
        x2: NaN,
        midX: NaN,
        delta: NaN,
        shiftType: "none",
        prod: NaN,
        prodShiftType: "none",
        isValid: false,
        fn,
        mirrorFn,
        diffFn,
      };
    }

    const midX = (x1 + x2) / 2;
    const delta = midX - x0;
    const prod = x1 * x2;
    const x0Sq = x0 * x0;

    return {
      x0,
      y0: maxY,
      k,
      x1,
      x2,
      midX,
      delta,
      shiftType: delta > 1e-4 ? "right" : delta < -1e-4 ? "left" : "none",
      prod,
      prodShiftType:
        prod > x0Sq + 1e-4 ? "greater" : prod < x0Sq - 1e-4 ? "less" : "none",
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
