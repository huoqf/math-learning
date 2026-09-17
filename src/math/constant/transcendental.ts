/**
 * src/math/constant/transcendental.ts
 * 超越函数恒成立与存在性问题求解（纯函数，零外部依赖）
 */

import type {
  ConstantSingleSepResult,
  ConstantSingleDirectResult,
  TransModelKey,
} from "./types";

/** 超越函数模型 A 辅助函数：f(x) = ln(x) / x */
export function evalFTrans(x: number): number {
  return x > 0 ? Math.log(x) / x : NaN;
}

/** 超越函数模型 B 辅助函数：f(x, a) = e^x - ax */
export function evalGParamTrans(x: number, a: number): number {
  return Math.exp(x) - a * x;
}

/* ------------------------------------------------------------------ *
 * 超越函数四大模型唯一事实源 (Single Source of Truth)
 * 中屏画布、右屏看板、求解器一律由此派发，杜绝「画布画 A、看板算 B」。
 *  - sep   : 参变分离后的无参目标函数 f(x)（画布实线）
 *  - direct: 直接讨论法的含参函数 g(x, a)（画布实线）
 * ------------------------------------------------------------------ */

/** sep 模式目标函数（与 SingleVarScene 画布绘制对象严格一致） */
export function evalSepTransFn(transModel: TransModelKey, x: number): number {
  switch (transModel) {
    case "ln_x_over_x":
      return evalFTrans(x); // ln x / x
    case "exp_minus_ax":
      return x > 0 ? Math.exp(x) / x : NaN; // e^x / x
    case "a_ln_x_minus_x":
      // (x - 1) / ln x：x = 1 处为可去间断点，按极限补定义为 1
      if (x <= 0) return NaN;
      return Math.abs(x - 1) < 1e-12 ? 1 : (x - 1) / Math.log(x);
    case "exp_minus_a_x_plus_1":
      return x > -1 ? Math.exp(x) / (x + 1) : NaN; // e^x / (x + 1)
    default:
      return NaN;
  }
}

/** sep 模式目标函数的导函数 */
export function evalSepTransDeriv(
  transModel: TransModelKey,
  x: number,
): number {
  switch (transModel) {
    case "ln_x_over_x":
      return x > 0 ? (1 - Math.log(x)) / (x * x) : NaN;
    case "exp_minus_ax":
      return x > 0 ? (Math.exp(x) * (x - 1)) / (x * x) : NaN;
    case "a_ln_x_minus_x": {
      if (x <= 0) return NaN;
      const lnx = Math.log(x);
      if (Math.abs(lnx) < 1e-12) return NaN; // 可去间断点处无定义
      return (lnx + 1 / x - 1) / (lnx * lnx);
    }
    case "exp_minus_a_x_plus_1":
      return x > -1 ? (Math.exp(x) * x) / ((x + 1) * (x + 1)) : NaN;
    default:
      return NaN;
  }
}

/** direct 模式含参函数（与 SingleVarScene 画布绘制对象严格一致） */
export function evalDirectTransFn(
  transModel: TransModelKey,
  x: number,
  a: number,
): number {
  switch (transModel) {
    case "ln_x_over_x":
    case "exp_minus_ax":
      return evalGParamTrans(x, a); // e^x - a x
    case "a_ln_x_minus_x":
      return evalFTransC(x, a); // a ln x - x + 1
    case "exp_minus_a_x_plus_1":
      return evalFTransD(x, a); // e^x - a(x + 1)
    default:
      return NaN;
  }
}

/** direct 模式含参函数的导函数 */
export function evalDirectTransDeriv(
  transModel: TransModelKey,
  x: number,
  a: number,
): number {
  switch (transModel) {
    case "ln_x_over_x":
    case "exp_minus_ax":
      return Math.exp(x) - a;
    case "a_ln_x_minus_x":
      return evalFTransCDerivative(x, a); // a / x - 1
    case "exp_minus_a_x_plus_1":
      return evalFTransDDerivative(x, a); // e^x - a
    default:
      return NaN;
  }
}

/** 唯一驻点（无驻点或驻点不可达时返回 null） */
export interface TransCriticalPoint {
  x: number;
  kind: "min" | "max";
}

/** sep 目标函数的唯一驻点 */
export function sepTransCritical(
  transModel: TransModelKey,
): TransCriticalPoint | null {
  switch (transModel) {
    case "ln_x_over_x":
      return { x: Math.E, kind: "max" }; // f' = (1 - ln x)/x^2
    case "exp_minus_ax":
      return { x: 1, kind: "min" }; // f' = e^x (x - 1)/x^2
    case "a_ln_x_minus_x":
      return null; // (x - 1)/ln x 在 (0, +∞) 严格递增，无驻点
    case "exp_minus_a_x_plus_1":
      return { x: 0, kind: "min" }; // f' = e^x x/(x + 1)^2
    default:
      return null;
  }
}

/** direct 含参函数的唯一驻点 */
export function directTransCritical(
  transModel: TransModelKey,
  a: number,
): TransCriticalPoint | null {
  if (!(a > 0)) return null; // a <= 0 时四个模型均无驻点
  switch (transModel) {
    case "ln_x_over_x":
    case "exp_minus_ax":
      return { x: Math.log(a), kind: "min" }; // e^x - a x
    case "a_ln_x_minus_x":
      // a ln x - x + 1，二阶导 -a/x^2 < 0，驻点为极大值点
      return { x: a, kind: "max" };
    case "exp_minus_a_x_plus_1":
      return { x: Math.log(a), kind: "min" }; // e^x - a(x + 1)
    default:
      return null;
  }
}

/** 变号二分求根：区间两端必须严格异号，否则返回 null（绝不静默返回端点） */
function bisectRoot(
  fn: (x: number) => number,
  target: number,
  lo: number,
  hi: number,
  maxIter = 80,
): number | null {
  if (!(lo < hi)) return null;
  let gLo = fn(lo) - target;
  let gHi = fn(hi) - target;
  if (!Number.isFinite(gLo) || !Number.isFinite(gHi)) return null;
  if (gLo === 0) return lo;
  if (gHi === 0) return hi;
  if (gLo * gHi > 0) return null;

  let left = lo;
  let right = hi;
  for (let i = 0; i < maxIter; i++) {
    const mid = (left + right) / 2;
    const gMid = fn(mid) - target;
    if (!Number.isFinite(gMid)) return null;
    if (gMid === 0) return mid;
    if (gLo * gMid < 0) {
      right = mid;
      gHi = gMid;
    } else {
      left = mid;
      gLo = gMid;
    }
  }
  return (left + right) / 2;
}

/**
 * 闭区间 [lo, hi] 上 fn(x) = target 的全部数值根（网格粗扫 + 二分精化，升序去重）。
 * 不再依赖「模型专属的两根解析式」——任何模型、任何参数都走同一条数值内核。
 */
function rootsInInterval(
  fn: (x: number) => number,
  target: number,
  lo: number,
  hi: number,
  steps = 400,
): number[] {
  const roots: number[] = [];
  const dx = (hi - lo) / steps;
  let prevX = lo;
  let prevG = fn(lo) - target;
  if (prevG === 0) roots.push(lo);

  for (let i = 1; i <= steps; i++) {
    const x = lo + i * dx;
    const g = fn(x) - target;
    if (!Number.isFinite(g)) {
      prevX = x;
      prevG = g;
      continue;
    }
    if (g === 0) {
      roots.push(x);
      prevX = x;
      prevG = g;
      continue;
    }
    if (Number.isFinite(prevG) && prevG * g < 0) {
      const r = bisectRoot(fn, target, prevX, x);
      if (r !== null && r > lo && r < hi) roots.push(r);
    }
    prevX = x;
    prevG = g;
  }

  return roots.filter((r, i) => i === 0 || Math.abs(r - roots[i - 1]) > 1e-9);
}

/**
 * 闭区间最小值/最大值及其横坐标（端点 + 区间内驻点）。
 * 对「驻点为极大值」的模型同样成立：此时最小值必然在端点取得，
 * 把驻点一并纳入取最小运算不会改变结果。
 */
function extremumInInterval(
  fn: (x: number) => number,
  lo: number,
  hi: number,
  critX: number | null,
): { fMin: number; xFMin: number; fMax: number; xFMax: number } | null {
  const xs: number[] = [lo, hi];
  if (critX !== null && critX > lo && critX < hi) xs.push(critX);

  let fMin = Infinity;
  let xFMin = lo;
  let fMax = -Infinity;
  let xFMax = lo;
  let ok = false;
  for (const x of xs) {
    const v = fn(x);
    if (!Number.isFinite(v)) continue;
    ok = true;
    if (v < fMin) {
      fMin = v;
      xFMin = x;
    }
    if (v > fMax) {
      fMax = v;
      xFMax = x;
    }
  }
  return ok ? { fMin, xFMin, fMax, xFMax } : null;
}

/**
 * { x ∈ [lo, hi] : fn(x) < target } 的最大连通分量。
 * 返回值类型保持既有的单区间签名（多处违背时取最长的一段），
 * 双区间同时呈现属于后续「成立域一等公民」改造范围。
 */
function maxViolationInterval(
  fn: (x: number) => number,
  target: number,
  lo: number,
  hi: number,
): [number, number] | null {
  const roots = rootsInInterval(fn, target, lo, hi);
  const cuts: number[] = [lo];
  for (const r of roots) {
    if (r > lo + 1e-9 && r < hi - 1e-9) {
      if (cuts.length === 0 || r - cuts[cuts.length - 1] > 1e-9) cuts.push(r);
    }
  }
  cuts.push(hi);

  let best: [number, number] | null = null;
  let bestLen = 0;
  for (let i = 0; i < cuts.length - 1; i++) {
    const s = cuts[i];
    const e = cuts[i + 1];
    if (e - s <= 1e-9) continue;
    const v = fn((s + e) / 2);
    if (Number.isFinite(v) && v < target && e - s > bestLen) {
      bestLen = e - s;
      best = [s, e];
    }
  }
  return best;
}

/**
 * 求解超越函数单变量参变分离
 * f(x) 由 transModel 唯一确定（与中屏画布同一事实源），区间 [m, n]
 */
export function solveConstantSingleSepTrans(
  a: number,
  m: number,
  n: number,
  transModel: TransModelKey = "ln_x_over_x",
): ConstantSingleSepResult {
  const degenerate = (): ConstantSingleSepResult => ({
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
  });

  if (m <= 0 || m >= n) return degenerate();

  const fn = (x: number) => evalSepTransFn(transModel, x);
  const crit = sepTransCritical(transModel);
  const ext = extremumInInterval(fn, m, n, crit ? crit.x : null);
  // 区间整体落在定义域外（如对数模型 m <= 0 已在上方拦截）时判为退化
  if (ext === null) return degenerate();

  const { fMin, xFMin, fMax, xFMax } = ext;
  const isAlwaysTrue = fMin >= a;
  const isExistTrue = fMax >= a;
  const violatedInterval = isAlwaysTrue
    ? null
    : maxViolationInterval(fn, a, m, n);

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
 * g(x) 由 transModel 唯一确定（与中屏画布同一事实源），判定 g(x) >= 0 在 [m, n] 上恒成立
 */
export function solveConstantSingleDirectTrans(
  a: number,
  m: number,
  n: number,
  transModel: TransModelKey = "ln_x_over_x",
): ConstantSingleDirectResult {
  const degenerate = (): ConstantSingleDirectResult => ({
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
  });

  if (m >= n) return degenerate();

  const fn = (x: number) => evalDirectTransFn(transModel, x, a);
  const fm = fn(m);
  const fnN = fn(n);
  // 区间端点落在定义域外（如 a ln x - x + 1 要求 x > 0）时判为退化
  if (!Number.isFinite(fm) || !Number.isFinite(fnN)) return degenerate();

  const crit = directTransCritical(transModel, a);
  const ext = extremumInInterval(fn, m, n, crit ? crit.x : null);
  if (ext === null) return degenerate();

  const { fMin, xFMin, fMax, xFMax } = ext;
  const isAlwaysTrue = fMin >= 0;
  const violatedInterval = isAlwaysTrue
    ? null
    : maxViolationInterval(fn, 0, m, n);

  let discussionType: "left" | "inside" | "right";
  if (crit !== null && crit.x >= m && crit.x <= n) {
    discussionType = "inside";
  } else if (crit !== null && crit.x < m) {
    discussionType = "left";
  } else if (crit !== null) {
    discussionType = "right";
  } else {
    // 无驻点：函数在区间上单调，由两端函数值判定最小值所在端
    discussionType = fnN > fm ? "left" : "right";
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

/** 超越函数模型 C 辅助函数：f(x, a) = a * ln(x) - x + 1 (x > 0) */
export function evalFTransC(x: number, a: number): number {
  return x > 0 ? a * Math.log(x) - x + 1 : NaN;
}

/** 超越函数模型 C 导函数：f'(x, a) = a/x - 1 */
export function evalFTransCDerivative(x: number, a: number): number {
  return x > 0 ? a / x - 1 : NaN;
}

/** 超越函数模型 D 辅助函数：f(x, a) = e^x - a * (x + 1) */
export function evalFTransD(x: number, a: number): number {
  return Math.exp(x) - a * (x + 1);
}

/** 超越函数模型 D 导函数：f'(x, a) = e^x - a */
export function evalFTransDDerivative(x: number, a: number): number {
  return Math.exp(x) - a;
}

/** 通用超越函数导函数估值 */
export function evalTransDerivative(
  x: number,
  a: number,
  model:
    "ln_x_over_x" | "exp_minus_ax" | "a_ln_x_minus_x" | "exp_minus_a_x_plus_1",
): number {
  switch (model) {
    case "ln_x_over_x":
      return x > 0 ? (1 - Math.log(x)) / (x * x) : NaN;
    case "exp_minus_ax":
      return Math.exp(x) - a;
    case "a_ln_x_minus_x":
      return evalFTransCDerivative(x, a);
    case "exp_minus_a_x_plus_1":
      return evalFTransDDerivative(x, a);
    default:
      return NaN;
  }
}

/**
 * 四大超越模型的看板文案规格（LaTeX 与模型一一对应，不再由调用方硬编码）。
 * 数值一律来自 solve* 求解器，文案一律来自本表，二者同源。
 */
export interface TransModelSpec {
  /** 中文模型名 */
  label: string;
  /** 参变分离目标函数 */
  sepFnLatex: string;
  /** 参变分离目标函数定义域 */
  sepDomainLatex: string;
  /** 参变分离目标函数导函数 */
  sepDerivLatex: string;
  /** 参变分离驻点（无驻点时描述单调性） */
  sepCriticalLatex: string;
  /** 参变分离驻点处函数值（无驻点为空串） */
  sepCriticalValueLatex: string;
  /** 直接讨论含参函数（aTex 为已着色的参数符号） */
  directFnLatex: (aTex: string) => string;
  /** 直接讨论含参函数导函数 */
  directDerivLatex: (aTex: string) => string;
  /** 直接讨论驻点表达式 */
  directCriticalLatex: (aTex: string) => string;
  /** 直接讨论驻点的纯文本写法（用于看板 value 栏，避免暴露 LaTeX 源码） */
  directCriticalPlain: string;
  /** 直接讨论驻点类型（决定「驻点在区间内」时最小值所在位置） */
  directCriticalKind: "min" | "max";
  /** 直接讨论驻点处函数值 */
  directCriticalValueLatex: (aTex: string) => string;
  /** 驻点落在区间内部时的最小值表达式（整体作为分类讨论中段行） */
  directInsideMinLatex: (aTex: string) => string;
  /** 驻点落在区间内部时的充要阈值（无解析阈值时为空串） */
  directInsideThresholdLatex: string;
}

export const TRANS_MODEL_SPEC: Record<TransModelKey, TransModelSpec> = {
  ln_x_over_x: {
    label: "对数分式模型",
    sepFnLatex: "f(x) = \\frac{\\ln x}{x}",
    sepDomainLatex: "x > 0",
    sepDerivLatex: "f'(x) = \\frac{1-\\ln x}{x^{2}}",
    sepCriticalLatex: "x = e",
    sepCriticalValueLatex: "f(e) = \\frac{\\ln e}{e} = \\frac{1}{e}",
    directFnLatex: (aTex) => `f(x) = e^{x} - ${aTex}x`,
    directDerivLatex: (aTex) => `f'(x) = e^{x} - ${aTex}`,
    directCriticalLatex: (aTex) => `\\ln ${aTex}`,
    directCriticalPlain: "ln a",
    directCriticalKind: "min",
    directCriticalValueLatex: (aTex) => `${aTex}(1 - \\ln ${aTex})`,
    directInsideMinLatex: (aTex) =>
      `f(\\ln ${aTex}) = ${aTex}(1 - \\ln ${aTex})`,
    directInsideThresholdLatex: "a \\le e",
  },
  exp_minus_ax: {
    label: "指数分式模型",
    sepFnLatex: "f(x) = \\frac{e^{x}}{x}",
    sepDomainLatex: "x > 0",
    sepDerivLatex: "f'(x) = \\frac{e^{x}(x-1)}{x^{2}}",
    sepCriticalLatex: "x = 1",
    sepCriticalValueLatex: "f(1) = e",
    directFnLatex: (aTex) => `f(x) = e^{x} - ${aTex}x`,
    directDerivLatex: (aTex) => `f'(x) = e^{x} - ${aTex}`,
    directCriticalLatex: (aTex) => `\\ln ${aTex}`,
    directCriticalPlain: "ln a",
    directCriticalKind: "min",
    directCriticalValueLatex: (aTex) => `${aTex}(1 - \\ln ${aTex})`,
    directInsideMinLatex: (aTex) =>
      `f(\\ln ${aTex}) = ${aTex}(1 - \\ln ${aTex})`,
    directInsideThresholdLatex: "a \\le e",
  },
  a_ln_x_minus_x: {
    label: "对数线性放缩",
    sepFnLatex: "f(x) = \\frac{x-1}{\\ln x}",
    sepDomainLatex: "x > 0,\\ x \\ne 1",
    sepDerivLatex: "f'(x) = \\frac{\\ln x + \\frac{1}{x} - 1}{(\\ln x)^{2}}",
    sepCriticalLatex: "无驻点（区间上严格单调递增）",
    sepCriticalValueLatex: "",
    directFnLatex: (aTex) => `f(x) = ${aTex}\\ln x - x + 1`,
    directDerivLatex: (aTex) => `f'(x) = \\frac{${aTex}}{x} - 1`,
    directCriticalLatex: (aTex) => `${aTex}`,
    directCriticalPlain: "a",
    directCriticalKind: "max",
    directCriticalValueLatex: (aTex) => `${aTex}\\ln ${aTex} - ${aTex} + 1`,
    directInsideMinLatex: () => "\\min\\{f(m), f(n)\\}",
    directInsideThresholdLatex: "",
  },
  exp_minus_a_x_plus_1: {
    label: "指数切线下界",
    sepFnLatex: "f(x) = \\frac{e^{x}}{x+1}",
    sepDomainLatex: "x > -1",
    sepDerivLatex: "f'(x) = \\frac{xe^{x}}{(x+1)^{2}}",
    sepCriticalLatex: "x = 0",
    sepCriticalValueLatex: "f(0) = 1",
    directFnLatex: (aTex) => `f(x) = e^{x} - ${aTex}(x+1)`,
    directDerivLatex: (aTex) => `f'(x) = e^{x} - ${aTex}`,
    directCriticalLatex: (aTex) => `\\ln ${aTex}`,
    directCriticalPlain: "ln a",
    directCriticalKind: "min",
    directCriticalValueLatex: (aTex) => `-${aTex}\\ln ${aTex}`,
    directInsideMinLatex: (aTex) => `f(\\ln ${aTex}) = -${aTex}\\ln ${aTex}`,
    directInsideThresholdLatex: "a \\le 1",
  },
};
