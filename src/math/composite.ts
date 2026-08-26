/**
 * 分段函数与复合函数纯数学计算库
 * 零 React/DOM/window 依赖，符合数学层纯净规则
 */

export interface PiecewiseParams {
  x0: number; // 分界点
  leftSlope: number; // 左段斜率 k1
  leftConst: number; // 左段截距 b1
  rightSlope: number; // 右段斜率 k2
  rightConst: number; // 右段截距 b2
}

export interface CompositeParams {
  xSample: number; // 当前采样点 x
  innerB: number; // 内层二次函数 g(x) = x^2 + b*x + c 的 b
  innerC: number; // 内层二次函数 c
  outerType: "exp" | "log" | "quadratic"; // 外层函数 f(u)
}

export type MonotonicityState =
  "increasing" | "decreasing" | "non-monotonic" | "constant";

export interface PiecewiseResult {
  x0: number;
  leftValAtX0: number;
  rightValAtX0: number;
  isContinuous: boolean;
  leftMonotonicity: "increasing" | "decreasing" | "constant";
  rightMonotonicity: "increasing" | "decreasing" | "constant";
  globalMonotonicity: MonotonicityState;
  monotonicityReason: string;
  evaluate: (x: number) => number;
  description: string;
}

export interface CompositeResult {
  x: number;
  u: number; // 中间变量 u = g(x)
  y: number; // 终值 y = f(u)
  innerMonotonicity: "increasing" | "decreasing" | "stationary";
  outerMonotonicity: "increasing" | "decreasing" | "stationary";
  compositeMonotonicity: "increasing" | "decreasing" | "stationary";
  evaluateInner: (x: number) => number;
  evaluateComposite: (x: number) => number;
  ruleMnemonic: string;
  isValid: boolean;
  domainNote?: string;
  warningMessage?: string;
}

/**
 * 求解分段函数逻辑（含高考核心全域单调性充要判定）
 */
export function calculatePiecewise(params: PiecewiseParams): PiecewiseResult {
  const { x0, leftSlope, leftConst, rightSlope, rightConst } = params;

  const leftValAtX0 = leftSlope * x0 + leftConst;
  const rightValAtX0 = rightSlope * x0 + rightConst;
  const isContinuous = Math.abs(leftValAtX0 - rightValAtX0) < 1e-4;

  const leftMonotonicity =
    leftSlope > 0 ? "increasing" : leftSlope < 0 ? "decreasing" : "constant";
  const rightMonotonicity =
    rightSlope > 0 ? "increasing" : rightSlope < 0 ? "decreasing" : "constant";

  // 高考核心判定：分段函数全域单调性
  let globalMonotonicity: MonotonicityState = "non-monotonic";
  let monotonicityReason = "";

  if (leftSlope >= 0 && rightSlope >= 0) {
    if (leftValAtX0 <= rightValAtX0) {
      globalMonotonicity =
        leftSlope === 0 && rightSlope === 0 ? "constant" : "increasing";
      monotonicityReason = isContinuous
        ? "两段均单调递增且分界点连续闭合，在 ℝ 上单调递增。"
        : `两段均单调递增，且分界点满足搭接不等式 f₁(x₀)=${leftValAtX0.toFixed(2)} ≤ f₂(x₀)=${rightValAtX0.toFixed(2)}，在 ℝ 上单调递增。`;
    } else {
      globalMonotonicity = "non-monotonic";
      monotonicityReason = `两段虽各自单增，但在分界点处向下跳跃 (f₁(x₀)=${leftValAtX0.toFixed(2)} > f₂(x₀)=${rightValAtX0.toFixed(2)})，破坏全域单调性！`;
    }
  } else if (leftSlope <= 0 && rightSlope <= 0) {
    if (leftValAtX0 >= rightValAtX0) {
      globalMonotonicity =
        leftSlope === 0 && rightSlope === 0 ? "constant" : "decreasing";
      monotonicityReason = isContinuous
        ? "两段均单调递减且分界点连续闭合，在 ℝ 上单调递减。"
        : `两段均单调递减，且分界点满足搭接不等式 f₁(x₀)=${leftValAtX0.toFixed(2)} ≥ f₂(x₀)=${rightValAtX0.toFixed(2)}，在 ℝ 上单调递减。`;
    } else {
      globalMonotonicity = "non-monotonic";
      monotonicityReason = `两段虽各自单减，但在分界点处向上跳跃 (f₁(x₀)=${leftValAtX0.toFixed(2)} < f₂(x₀)=${rightValAtX0.toFixed(2)})，破坏全域单调性！`;
    }
  } else {
    globalMonotonicity = "non-monotonic";
    monotonicityReason = "左右两段单调方向相反，全域不具备单调性。";
  }

  const evaluate = (x: number) => {
    if (x <= x0) {
      return leftSlope * x + leftConst;
    } else {
      return rightSlope * x + rightConst;
    }
  };

  const description = isContinuous
    ? `在分界点 x₀ = ${x0.toFixed(1)} 处连续，左极限 = 右极限 = ${leftValAtX0.toFixed(2)}。`
    : `在分界点 x₀ = ${x0.toFixed(1)} 处断开，左极限 ${leftValAtX0.toFixed(2)} ≠ 右极限 ${rightValAtX0.toFixed(2)}。`;

  return {
    x0,
    leftValAtX0,
    rightValAtX0,
    isContinuous,
    leftMonotonicity,
    rightMonotonicity,
    globalMonotonicity,
    monotonicityReason,
    evaluate,
    description,
  };
}

/**
 * 求解复合函数 f(g(x)) 传导逻辑与曲线求解
 */
export function calculateComposite(params: CompositeParams): CompositeResult {
  const { xSample, innerB, innerC, outerType } = params;

  // 内层 g(x) = x^2 + b*x + c
  const evaluateInner = (x: number) => x * x + innerB * x + innerC;
  const u = evaluateInner(xSample);

  // 内层对称轴 x = -b / 2
  const axisX = -innerB / 2;
  const innerMono =
    xSample > axisX
      ? "increasing"
      : xSample < axisX
        ? "decreasing"
        : "stationary";

  const evaluateComposite = (x: number): number => {
    const ux = evaluateInner(x);
    switch (outerType) {
      case "exp":
        return Math.pow(2, ux);
      case "log":
        return ux > 0 ? Math.log2(ux) : NaN;
      case "quadratic":
        return -Math.pow(ux - 2, 2) + 4;
    }
  };

  let y = NaN;
  let outerMono: "increasing" | "decreasing" | "stationary" = "increasing";
  let isValid = true;
  let warningMessage: string | undefined;
  let domainNote: string | undefined;

  switch (outerType) {
    case "exp":
      y = Math.pow(2, u);
      outerMono = "increasing";
      domainNote = "外层定义域 u ∈ ℝ，复合函数定义域为 ℝ。";
      break;
    case "log":
      domainNote =
        "外层真数限制 u = g(x) > 0。必须在 g(x) > 0 区域内讨论单调性。";
      if (u <= 0) {
        isValid = false;
        warningMessage = `中间变量 u = g(${xSample.toFixed(1)}) = ${u.toFixed(2)} ≤ 0，超出对数外层定义域 (u > 0)！`;
        y = NaN;
      } else {
        y = Math.log2(u);
        outerMono = "increasing";
      }
      break;
    case "quadratic":
      y = -Math.pow(u - 2, 2) + 4;
      outerMono = u < 2 ? "increasing" : u > 2 ? "decreasing" : "stationary";
      domainNote = "外层为二次函数 y = -(u-2)²+4，顶点在 u = 2 处。";
      break;
  }

  let compositeMono: "increasing" | "decreasing" | "stationary" = "stationary";
  if (!isValid) {
    compositeMono = "stationary";
  } else if (innerMono === "stationary" || outerMono === "stationary") {
    compositeMono = "stationary";
  } else if (innerMono === outerMono) {
    compositeMono = "increasing"; // 同增 (增+增=增, 减+减=增)
  } else {
    compositeMono = "decreasing"; // 异减 (增+减=减, 减+增=减)
  }

  const ruleMnemonic =
    "同增异减法则：内外层单调性相同时复合函数单调递增，相反时单调递减（需在定义域内判定）。";

  return {
    x: xSample,
    u,
    y,
    innerMonotonicity: innerMono,
    outerMonotonicity: outerMono,
    compositeMonotonicity: compositeMono,
    evaluateInner,
    evaluateComposite,
    ruleMnemonic,
    isValid,
    domainNote,
    warningMessage,
  };
}
