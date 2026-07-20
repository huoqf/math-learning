/**
 * 分段函数与复合函数纯数学计算库
 * 零 React/DOM/window 依赖，符合数学层纯净规则
 */

export interface PiecewiseParams {
  x0: number; // 分界点
  leftSlope: number; // 左段斜率/参数
  leftConst: number; // 左段常数/截距
  rightSlope: number; // 右段斜率/参数
  rightConst: number; // 右段常数/截距
}

export interface CompositeParams {
  xSample: number; // 当前采样点 x
  innerB: number; // 内层二次函数 g(x) = x^2 + b*x + c 的 b
  innerC: number; // 内层二次函数 c
  outerType: "exp" | "log" | "quadratic"; // 外层函数 f(u)
}

export interface PiecewiseResult {
  x0: number;
  leftValAtX0: number;
  rightValAtX0: number;
  isContinuous: boolean;
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
  ruleMnemonic: string;
  isValid: boolean;
  warningMessage?: string;
}

/**
 * 求解分段函数逻辑
 */
export function calculatePiecewise(params: PiecewiseParams): PiecewiseResult {
  const { x0, leftSlope, leftConst, rightSlope, rightConst } = params;

  const leftValAtX0 = leftSlope * x0 + leftConst;
  const rightValAtX0 = rightSlope * x0 + rightConst;
  const isContinuous = Math.abs(leftValAtX0 - rightValAtX0) < 1e-4;

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
    evaluate,
    description,
  };
}

/**
 * 求解复合函数 f(g(x)) 传导逻辑
 */
export function calculateComposite(params: CompositeParams): CompositeResult {
  const { xSample, innerB, innerC, outerType } = params;

  // 内层 g(x) = x^2 + b*x + c
  const u = xSample * xSample + innerB * xSample + innerC;

  // 内层对称轴 x = -b / 2
  const axisX = -innerB / 2;
  const innerMono =
    xSample > axisX
      ? "increasing"
      : xSample < axisX
        ? "decreasing"
        : "stationary";

  let y = NaN;
  let outerMono: "increasing" | "decreasing" | "stationary" = "increasing";
  let isValid = true;
  let warningMessage: string | undefined;

  switch (outerType) {
    case "exp":
      // f(u) = 2^u
      y = Math.pow(2, u);
      outerMono = "increasing";
      break;
    case "log":
      // f(u) = log2(u)，需要 u > 0
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
      // f(u) = -(u - 2)^2 + 4
      y = -Math.pow(u - 2, 2) + 4;
      outerMono = u < 2 ? "increasing" : u > 2 ? "decreasing" : "stationary";
      break;
  }

  let compositeMono: "increasing" | "decreasing" | "stationary" = "stationary";
  if (innerMono === "stationary" || outerMono === "stationary") {
    compositeMono = "stationary";
  } else if (innerMono === outerMono) {
    compositeMono = "increasing"; // 同增 (增+增=增, 减+减=增)
  } else {
    compositeMono = "decreasing"; // 异减 (增+减=减, 减+增=减)
  }

  const ruleMnemonic =
    "同增异减法则：内外层单调性相同时复合函数递增，相反时递减。";

  return {
    x: xSample,
    u,
    y,
    innerMonotonicity: innerMono,
    outerMonotonicity: outerMono,
    compositeMonotonicity: compositeMono,
    ruleMnemonic,
    isValid,
    warningMessage,
  };
}
