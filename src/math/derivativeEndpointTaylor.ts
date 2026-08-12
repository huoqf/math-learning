/**
 * src/math/derivativeEndpointTaylor.ts
 * 纯数学计算逻辑：端点效应、洛必达法则极限逼近、泰勒多项式拟合放缩
 * 遵守铁律6：纯函数，零 DOM / React / Store 依赖
 */

/** 端点效应函数类型 */
export type EndpointFuncType = "exp" | "ln" | "xln";

/** 泰勒基底函数类型 */
export type TaylorBaseType = "exp" | "ln" | "sin" | "cos";

/**
 * 求解端点效应相关数值与状态
 */
export interface EndpointCalcResult {
  x0: number; // 端点位置
  f0: number; // 端点函数值
  df0: number; // 端点一阶导数值
  d2f0: number; // 端点二阶导数值
  isNecessaryValid: boolean; // 是否满足一阶必要条件 (df0 >= 0)
  isSufficientValid: boolean; // 是否满足充分条件（即整个定义域内 f(x) >= 0）
  tangentSlope: number; // 端点切线斜率
  criticalA: number; // 临界参数 a 的值
  fn: (x: number) => number; // 原函数 f(x)
  dfn: (x: number) => number; // 导函数 f'(x)
  tangentFn: (x: number) => number; // 端点切线函数 y = f'(x0)*(x-x0) + f(x0)
}

/**
 * 计算端点效应指标
 * @param type 端点类型 ('exp' | 'ln' | 'xln')
 * @param a 参数 a
 */
export function calcEndpointEffect(
  type: EndpointFuncType,
  a: number,
): EndpointCalcResult {
  if (type === "exp") {
    // f(x) = e^x - a*x - 1, 端点 x0 = 0
    const x0 = 0;
    const f0 = 0;
    const df0 = 1 - a; // f'(0) = 1 - a
    const d2f0 = 1; // f''(0) = 1 > 0
    const criticalA = 1;
    const isNecessaryValid = df0 >= -1e-7; // f'(0) >= 0 => a <= 1
    const isSufficientValid = a <= 1 + 1e-7;

    const fn = (x: number) => Math.exp(x) - a * x - 1;
    const dfn = (x: number) => Math.exp(x) - a;
    const tangentSlope = df0;
    const tangentFn = (x: number) => f0 + tangentSlope * (x - x0);

    return {
      x0,
      f0,
      df0,
      d2f0,
      isNecessaryValid,
      isSufficientValid,
      tangentSlope,
      criticalA,
      fn,
      dfn,
      tangentFn,
    };
  } else if (type === "ln") {
    // f(x) = ln(x+1) - a*x, 端点 x0 = 0, 定义域 x > -1
    const x0 = 0;
    const f0 = 0;
    const df0 = 1 - a; // f'(0) = 1 - a
    const d2f0 = -1; // f''(0) = -1 < 0
    const criticalA = 1;
    const isNecessaryValid = df0 <= 1e-7; // 对于 f(x) <= 0 在 x>=0 恒成立 => a >= 1
    const isSufficientValid = a >= 1 - 1e-7;

    const fn = (x: number) => (x > -0.999 ? Math.log(x + 1) - a * x : NaN);
    const dfn = (x: number) => (x > -0.999 ? 1 / (x + 1) - a : NaN);
    const tangentSlope = df0;
    const tangentFn = (x: number) => f0 + tangentSlope * (x - x0);

    return {
      x0,
      f0,
      df0,
      d2f0,
      isNecessaryValid,
      isSufficientValid,
      tangentSlope,
      criticalA,
      fn,
      dfn,
      tangentFn,
    };
  } else {
    // f(x) = x*ln(x) - a*(x-1), 端点 x0 = 1, 定义域 x > 0
    const x0 = 1;
    const f0 = 0;
    // f'(x) = ln(x) + 1 - a => f'(1) = 1 - a
    const df0 = 1 - a;
    const d2f0 = 1; // f''(1) = 1 > 0
    const criticalA = 1;
    const isNecessaryValid = df0 >= -1e-7;
    const isSufficientValid = a <= 1 + 1e-7;

    const fn = (x: number) => (x > 1e-4 ? x * Math.log(x) - a * (x - 1) : NaN);
    const dfn = (x: number) => (x > 1e-4 ? Math.log(x) + 1 - a : NaN);
    const tangentSlope = df0;
    const tangentFn = (x: number) => f0 + tangentSlope * (x - x0);

    return {
      x0,
      f0,
      df0,
      d2f0,
      isNecessaryValid,
      isSufficientValid,
      tangentSlope,
      criticalA,
      fn,
      dfn,
      tangentFn,
    };
  }
}

/**
 * 洛必达法则计算结果
 */
export interface LHopitalCalcResult {
  x0: number; // 未定点 x0 = 0
  xCurr: number; // 当前测试动点 x
  numVal: number; // 分子 N(x) = e^x - 1 - x
  denVal: number; // 分母 D(x) = x^2
  numDeriv: number; // 分子导数 N'(x) = e^x - 1
  denDeriv: number; // 分母导数 D'(x) = 2x
  ratioVal: number; // 比值 N(x) / D(x)
  ratioDerivVal: number; // 导数比值 N'(x) / D'(x)
  limitVal: number; // 洛必达极限值 = 0.5
  secantSlope: number; // 原点割线斜率
}

/**
 * 计算洛必达逼近过程
 * @param xCurr 动点坐标 (x -> 0)
 */
export function calcLHopital(xCurr: number): LHopitalCalcResult {
  const x0 = 0;
  const numVal = Math.exp(xCurr) - 1 - xCurr;
  const denVal = xCurr * xCurr;

  const numDeriv = Math.exp(xCurr) - 1;
  const denDeriv = 2 * xCurr;

  const limitVal = 0.5;

  let ratioVal: number;
  if (Math.abs(xCurr) < 1e-5) {
    ratioVal = limitVal;
  } else {
    ratioVal = numVal / denVal;
  }

  let ratioDerivVal: number;
  if (Math.abs(xCurr) < 1e-5) {
    ratioDerivVal = limitVal;
  } else {
    ratioDerivVal = numDeriv / denDeriv;
  }

  const secantSlope =
    Math.abs(xCurr) < 1e-5 ? limitVal : numVal / (xCurr * xCurr);

  return {
    x0,
    xCurr,
    numVal,
    denVal,
    numDeriv,
    denDeriv,
    ratioVal,
    ratioDerivVal,
    limitVal,
    secantSlope,
  };
}

/**
 * 泰勒多项式拟合计算结果
 */
export interface TaylorCalcResult {
  baseType: TaylorBaseType;
  order: number; // 阶数 1, 2, 3
  x0: number; // 展开点
  fn: (x: number) => number; // 原函数
  taylorFn: (x: number) => number; // 泰勒多项式 P_n(x)
  residualFn: (x: number) => number; // 残差 R_n(x) = f(x) - P_n(x)
  latexFormula: string; // 泰勒展开多项式的 LaTeX 表达式
  scalingInequality: string; // 常用放缩不等式 LaTeX
}

/**
 * 计算泰勒多项式与拟合函数
 * @param baseType 函数基底 ('exp' | 'ln' | 'sin' | 'cos')
 * @param order 阶数 (1 | 2 | 3)
 * @param x0 展开点 (默认 0)
 */
export function calcTaylorPolynomial(
  baseType: TaylorBaseType,
  order: number,
  x0: number = 0,
): TaylorCalcResult {
  if (baseType === "exp") {
    const fn = (x: number) => Math.exp(x);
    let taylorFn: (x: number) => number;
    let latexFormula: string;
    let scalingInequality: string;

    const dx = (x: number) => x - x0;

    if (order === 1) {
      // P1(x) = e^x0 + e^x0 * (x - x0)
      const e0 = Math.exp(x0);
      taylorFn = (x: number) => e0 * (1 + dx(x));
      latexFormula =
        x0 === 0
          ? "P_1(x) = 1 + x"
          : `P_1(x) \\approx e^{${x0.toFixed(1)}}(1 + (x - ${x0.toFixed(1)}))`;
      scalingInequality = "e^x \\ge x + 1 \\quad (x \\in \\mathbb{R})";
    } else if (order === 2) {
      // P2(x) = e^x0 * (1 + dx + dx^2/2)
      const e0 = Math.exp(x0);
      taylorFn = (x: number) => e0 * (1 + dx(x) + 0.5 * Math.pow(dx(x), 2));
      latexFormula =
        x0 === 0
          ? "P_2(x) = 1 + x + \\frac{1}{2}x^2"
          : `P_2(x) \\approx e^{${x0.toFixed(1)}}(1 + \\Delta x + \\frac{1}{2}\\Delta x^2)`;
      scalingInequality = "e^x \\ge 1 + x + \\frac{1}{2}x^2 \\quad (x \\ge 0)";
    } else {
      // P3(x) = e^x0 * (1 + dx + dx^2/2 + dx^3/6)
      const e0 = Math.exp(x0);
      taylorFn = (x: number) =>
        e0 *
        (1 + dx(x) + 0.5 * Math.pow(dx(x), 2) + (1 / 6) * Math.pow(dx(x), 3));
      latexFormula =
        x0 === 0
          ? "P_3(x) = 1 + x + \\frac{1}{2}x^2 + \\frac{1}{6}x^3"
          : `P_3(x) \\approx e^{${x0.toFixed(1)}}(...)`;
      scalingInequality =
        "e^x \\ge 1 + x + \\frac{1}{2}x^2 + \\frac{1}{6}x^3 \\quad (x \\ge 0)";
    }

    const residualFn = (x: number) => fn(x) - taylorFn(x);

    return {
      baseType,
      order,
      x0,
      fn,
      taylorFn,
      residualFn,
      latexFormula,
      scalingInequality,
    };
  } else if (baseType === "ln") {
    // f(x) = ln(1+x), 定义域 x > -1
    const fn = (x: number) => (x > -0.999 ? Math.log(1 + x) : NaN);
    let taylorFn: (x: number) => number;
    let latexFormula: string;
    let scalingInequality: string;

    if (order === 1) {
      taylorFn = (x: number) => x;
      latexFormula = "P_1(x) = x";
      scalingInequality = "\\ln(1+x) \\le x \\quad (x > -1)";
    } else if (order === 2) {
      taylorFn = (x: number) => x - 0.5 * x * x;
      latexFormula = "P_2(x) = x - \\frac{1}{2}x^2";
      scalingInequality =
        "\\ln(1+x) \\le x - \\frac{1}{2}x^2 + \\dots \\quad (x \\ge 0)";
    } else {
      taylorFn = (x: number) => x - 0.5 * x * x + (1 / 3) * Math.pow(x, 3);
      latexFormula = "P_3(x) = x - \\frac{1}{2}x^2 + \\frac{1}{3}x^3";
      scalingInequality =
        "\\ln(1+x) \\le x - \\frac{1}{2}x^2 + \\frac{1}{3}x^3 \\quad (x \\ge 0)";
    }

    const residualFn = (x: number) => fn(x) - taylorFn(x);

    return {
      baseType,
      order,
      x0,
      fn,
      taylorFn,
      residualFn,
      latexFormula,
      scalingInequality,
    };
  } else if (baseType === "sin") {
    const fn = (x: number) => Math.sin(x);
    let taylorFn: (x: number) => number;
    let latexFormula: string;
    let scalingInequality: string;

    if (order === 1) {
      taylorFn = (x: number) => x;
      latexFormula = "P_1(x) = x";
      scalingInequality = "\\sin x \\le x \\quad (x \\ge 0)";
    } else if (order === 2) {
      taylorFn = (x: number) => x;
      latexFormula = "P_2(x) = x";
      scalingInequality = "\\sin x \\le x \\quad (x \\ge 0)";
    } else {
      taylorFn = (x: number) => x - (1 / 6) * Math.pow(x, 3);
      latexFormula = "P_3(x) = x - \\frac{1}{6}x^3";
      scalingInequality = "\\sin x \\ge x - \\frac{1}{6}x^3 \\quad (x \\ge 0)";
    }

    const residualFn = (x: number) => fn(x) - taylorFn(x);

    return {
      baseType,
      order,
      x0,
      fn,
      taylorFn,
      residualFn,
      latexFormula,
      scalingInequality,
    };
  } else {
    // cos(x)
    const fn = (x: number) => Math.cos(x);
    let taylorFn: (x: number) => number;
    let latexFormula: string;
    let scalingInequality: string;

    if (order === 1) {
      taylorFn = () => 1;
      latexFormula = "P_1(x) = 1";
      scalingInequality = "\\cos x \\le 1 \\quad (x \\in \\mathbb{R})";
    } else if (order === 2) {
      taylorFn = (x: number) => 1 - 0.5 * x * x;
      latexFormula = "P_2(x) = 1 - \\frac{1}{2}x^2";
      scalingInequality =
        "\\cos x \\ge 1 - \\frac{1}{2}x^2 \\quad (x \\in \\mathbb{R})";
    } else {
      taylorFn = (x: number) => 1 - 0.5 * x * x;
      latexFormula = "P_3(x) = 1 - \\frac{1}{2}x^2";
      scalingInequality =
        "\\cos x \\ge 1 - \\frac{1}{2}x^2 \\quad (x \\in \\mathbb{R})";
    }

    const residualFn = (x: number) => fn(x) - taylorFn(x);

    return {
      baseType,
      order,
      x0,
      fn,
      taylorFn,
      residualFn,
      latexFormula,
      scalingInequality,
    };
  }
}
