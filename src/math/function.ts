/**
 * 函数概念与性质纯数学计算库
 * 零 React/DOM/window 依赖，符合数学层纯净规则
 */

export interface FunctionPoint {
  x: number;
  y: number;
}

export interface BisectionStepInfo {
  step: number;
  left: number;
  right: number;
  mid: number;
  fLeft: number;
  fRight: number;
  fMid: number;
}

export interface BisectionResult {
  hasZero: boolean;
  steps: BisectionStepInfo[];
  currentStep: BisectionStepInfo | null;
  approxRoot: number;
  errorBound: number;
  validity: boolean;
  warningMessage?: string;
}

export interface ExpLogResult {
  a: number;
  isValidBase: boolean;
  baseWarning?: string;
  expVal: number;
  logVal: number;
  pointExp: FunctionPoint;
  pointLog: FunctionPoint;
}

/**
 * 奇偶性判定枚举
 */
export type ParityType = "even" | "odd" | "neither";

/**
 * 评估通用预设函数的奇偶性与对应值
 */
export function evalFunctionParity(
  fnType: "cubic" | "quadratic" | "abs" | "reciprocal",
  x: number,
): {
  fx: number;
  fNegX: number;
  parity: ParityType;
  parityDescription: string;
} {
  let fx = 0;
  let fNegX = 0;
  let parity: ParityType = "neither";
  let parityDescription = "";

  switch (fnType) {
    case "cubic":
      fx = x * x * x;
      fNegX = -x * -x * -x;
      parity = "odd";
      parityDescription =
        "f(-x) = -f(x)，属于奇函数，图象关于坐标原点中心对称。";
      break;
    case "quadratic":
      fx = x * x;
      fNegX = -x * -x;
      parity = "even";
      parityDescription = "f(-x) = f(x)，属于偶函数，图象关于 y 轴轴对称。";
      break;
    case "abs":
      fx = Math.abs(x);
      fNegX = Math.abs(-x);
      parity = "even";
      parityDescription = "f(-x) = f(x)，属于偶函数，图象关于 y 轴轴对称。";
      break;
    case "reciprocal":
      fx = x !== 0 ? 1 / x : NaN;
      fNegX = -x !== 0 ? 1 / -x : NaN;
      parity = "odd";
      parityDescription =
        "f(-x) = -f(x)，属于奇函数，图象关于坐标原点中心对称。";
      break;
  }

  return { fx, fNegX, parity, parityDescription };
}

/**
 * 指数与对数反函数计算
 */
export function calculateExpLog(a: number, x0: number): ExpLogResult {
  const isValidBase = a > 0 && Math.abs(a - 1) > 1e-4;
  let baseWarning: string | undefined;

  if (a <= 0) {
    baseWarning = "底数 a 必须大于 0！指数与对数函数底数不能为负数或零。";
  } else if (Math.abs(a - 1) <= 1e-4) {
    baseWarning = "底数 a = 1 退化为常数函数 y = 1，无法构成对数与反函数！";
  }

  const expVal = isValidBase ? Math.pow(a, x0) : NaN;
  // 计算对数 y = log_a(x0)，要求 x0 > 0
  const logVal = isValidBase && x0 > 0 ? Math.log(x0) / Math.log(a) : NaN;

  return {
    a,
    isValidBase,
    baseWarning,
    expVal,
    logVal,
    pointExp: { x: x0, y: expVal },
    pointLog: { x: expVal, y: x0 }, // 对应反函数点 (y, x) 恰好关于 y=x 对称
  };
}

/**
 * 二分逼近法求解零点
 */
export function solveBisection(
  fn: (x: number) => number,
  m: number,
  n: number,
  maxSteps: number,
): BisectionResult {
  if (m >= n) {
    return {
      hasZero: false,
      steps: [],
      currentStep: null,
      approxRoot: NaN,
      errorBound: NaN,
      validity: false,
      warningMessage: "区间端点无效：要求左端点 m < 右端点 n！",
    };
  }

  const fM = fn(m);
  const fN = fn(n);

  if (fM * fN > 0) {
    return {
      hasZero: false,
      steps: [],
      currentStep: null,
      approxRoot: NaN,
      errorBound: n - m,
      validity: true,
      warningMessage: `f(${m.toFixed(1)}) 与 f(${n.toFixed(1)}) 同号 (${fM > 0 ? "+" : "-"})，不满足零点存在性定理前提 f(a)·f(b) < 0！`,
    };
  }

  let left = m;
  let right = n;
  const steps: BisectionStepInfo[] = [];

  for (let k = 1; k <= maxSteps; k++) {
    const mid = (left + right) / 2;
    const fLeft = fn(left);
    const fRight = fn(right);
    const fMid = fn(mid);

    steps.push({
      step: k,
      left,
      right,
      mid,
      fLeft,
      fRight,
      fMid,
    });

    if (Math.abs(fMid) < 1e-9) {
      break;
    }

    if (fLeft * fMid < 0) {
      right = mid;
    } else {
      left = mid;
    }
  }

  const currentStep = steps.length > 0 ? steps[steps.length - 1] : null;
  const approxRoot = currentStep ? currentStep.mid : (m + n) / 2;
  const errorBound = currentStep
    ? (currentStep.right - currentStep.left) / 2
    : (n - m) / 2;

  return {
    hasZero: true,
    steps,
    currentStep,
    approxRoot,
    errorBound,
    validity: true,
  };
}
