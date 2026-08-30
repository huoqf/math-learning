/**
 * src/math/derivative.ts
 * 导数纯数学计算层（纯函数，禁止导入 React/DOM）
 */

export interface DerivativeResult {
  /** f(x₀) 的值 */
  fx: number;
  /** f'(x₀) 数值导数 */
  fpx: number;
  /** 切线斜率（= f'(x₀)） */
  slope: number;
  /** 切线方程 y = f(x₀) + f'(x₀)(x - x₀) 的参数 */
  tangentIntercept: number; // f(x₀) - f'(x₀) * x₀
  /** 是否有效（函数在 x₀ 处有定义且可导） */
  isValid: boolean;
  /** 退化原因 */
  degenerateType?: "undefined" | "non_differentiable";
}

/**
 * 数值求导（中心差分法）
 * f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
 */
export function numericalDerivative(
  fn: (x: number) => number,
  x: number,
  h = 1e-7,
): number {
  return (fn(x + h) - fn(x - h)) / (2 * h);
}

/**
 * 计算函数在 x₀ 处的导数信息
 */
export function solveDerivative(
  fn: (x: number) => number,
  x0: number,
): DerivativeResult {
  const fx = fn(x0);

  // 函数在 x₀ 处无定义
  if (!Number.isFinite(fx)) {
    return {
      fx: NaN,
      fpx: NaN,
      slope: NaN,
      tangentIntercept: NaN,
      isValid: false,
      degenerateType: "undefined",
    };
  }

  const fpx = numericalDerivative(fn, x0);

  // 导数不存在（尖点等）
  if (!Number.isFinite(fpx)) {
    return {
      fx,
      fpx: NaN,
      slope: NaN,
      tangentIntercept: NaN,
      isValid: false,
      degenerateType: "non_differentiable",
    };
  }

  return {
    fx,
    fpx,
    slope: fpx,
    tangentIntercept: fx - fpx * x0,
    isValid: true,
  };
}

/**
 * 格式化数值为保留指定位数的纯净字符串（去除末尾多余0与 -0）
 */
export function formatNum(num: number, digits = 2): string {
  if (!Number.isFinite(num)) return "";
  const fixed = num.toFixed(digits);
  // 去除 -0.00
  if (Math.abs(Number(fixed)) < 1e-9) return "0";
  return Number(fixed).toString();
}

/**
 * 构建规范的点斜式切线方程 LaTeX
 * y - y₀ = k(x - x₀)
 * 严格按照高中代数消元规则：
 * - 负负得正：y - (-2) => y + 2
 * - 0 项消去：y - 0 => y
 * - 系数 1 / -1 / 0 处理：0(x - x₀) => 0
 */
export function buildPointSlopeLatex(
  x0: number,
  y0: number,
  slope: number,
  options?: {
    x0Color?: string;
    y0Color?: string;
    slopeColor?: string;
  },
): string {
  if (!Number.isFinite(x0) || !Number.isFinite(y0) || !Number.isFinite(slope)) {
    return "y - y_0 = f'(x_0)(x - x_0)";
  }

  const { x0Color, y0Color, slopeColor } = options || {};

  // 左侧 y - y₀
  let leftSide = "y";
  if (Math.abs(y0) < 1e-6) {
    leftSide = "y";
  } else if (y0 > 0) {
    const y0Str = formatNum(y0);
    const coloredY0 = y0Color ? `\\color{${y0Color}}{${y0Str}}` : y0Str;
    leftSide = `y - ${coloredY0}`;
  } else {
    const absY0Str = formatNum(Math.abs(y0));
    const coloredY0 = y0Color ? `\\color{${y0Color}}{${absY0Str}}` : absY0Str;
    leftSide = `y + ${coloredY0}`;
  }

  // 斜率为 0（水平切线）
  if (Math.abs(slope) < 1e-6) {
    return `${leftSide} = 0`;
  }

  const slopeStr = formatNum(slope);
  const coloredSlope = slopeColor
    ? `\\color{${slopeColor}}{${slopeStr}}`
    : slopeStr;

  // 右侧 (x - x₀)
  let rightInner = "x";
  if (Math.abs(x0) < 1e-6) {
    rightInner = "x";
  } else if (x0 > 0) {
    const x0Str = formatNum(x0);
    const coloredX0 = x0Color ? `\\color{${x0Color}}{${x0Str}}` : x0Str;
    rightInner = `x - ${coloredX0}`;
  } else {
    const absX0Str = formatNum(Math.abs(x0));
    const coloredX0 = x0Color ? `\\color{${x0Color}}{${absX0Str}}` : absX0Str;
    rightInner = `x + ${coloredX0}`;
  }

  if (Math.abs(x0) < 1e-6) {
    if (slope === 1) return `${leftSide} = x`;
    if (slope === -1) return `${leftSide} = -x`;
    return `${leftSide} = ${coloredSlope}x`;
  }

  if (slope === 1) {
    return `${leftSide} = ${rightInner}`;
  }
  if (slope === -1) {
    return `${leftSide} = -(${rightInner})`;
  }

  return `${leftSide} = ${coloredSlope}(${rightInner})`;
}

/**
 * 构建规范的斜截式切线方程 LaTeX: y = kx + b
 */
export function buildSlopeInterceptLatex(
  slope: number,
  intercept: number,
  options?: {
    slopeColor?: string;
  },
): string {
  if (!Number.isFinite(slope) || !Number.isFinite(intercept)) {
    return "y = kx + b";
  }

  const { slopeColor } = options || {};

  // 水平切线
  if (Math.abs(slope) < 1e-6) {
    return `y = ${formatNum(intercept)}`;
  }

  const slopeStr = formatNum(slope);
  const coloredSlope = slopeColor
    ? `\\color{${slopeColor}}{${slopeStr}}`
    : slopeStr;

  const formattedSlopeNum = Number(slopeStr);
  let xTerm = "";
  if (formattedSlopeNum === 1) {
    xTerm = "x";
  } else if (formattedSlopeNum === -1) {
    xTerm = "-x";
  } else {
    xTerm = `${coloredSlope}x`;
  }

  if (Math.abs(intercept) < 1e-6) {
    return `y = ${xTerm}`;
  }

  if (intercept > 0) {
    return `y = ${xTerm} + ${formatNum(intercept)}`;
  }

  return `y = ${xTerm} - ${formatNum(Math.abs(intercept))}`;
}

export interface PresetFunction {
  fn: (x: number) => number;
  label: string;
  latex: string;
  x0Range: [number, number];
  defaultX0: number;
}

/**
 * 预设函数库（高中常用函数与高考高频模型）
 */
export const PRESET_FUNCTIONS: Record<string, PresetFunction> = {
  /** f(x) = x³ - 3x */
  cubic: {
    fn: (x: number) => x * x * x - 3 * x,
    label: "f(x) = x³ - 3x",
    latex: "f(x) = x^3 - 3x",
    x0Range: [-3.0, 3.0],
    defaultX0: 1.0,
  },
  /** f(x) = x² */
  quadratic: {
    fn: (x: number) => x * x,
    label: "f(x) = x²",
    latex: "f(x) = x^2",
    x0Range: [-3.0, 3.0],
    defaultX0: 1.0,
  },
  /** f(x) = sin(x) */
  sine: {
    fn: (x: number) => Math.sin(x),
    label: "f(x) = sin(x)",
    latex: "f(x) = \\sin x",
    x0Range: [-6.28, 6.28],
    defaultX0: 1.0,
  },
  /** f(x) = cos(x) */
  cosine: {
    fn: (x: number) => Math.cos(x),
    label: "f(x) = cos(x)",
    latex: "f(x) = \\cos x",
    x0Range: [-6.28, 6.28],
    defaultX0: 1.0,
  },
  /** f(x) = eˣ */
  exp: {
    fn: (x: number) => Math.exp(x),
    label: "f(x) = eˣ",
    latex: "f(x) = e^x",
    x0Range: [-3.0, 2.0],
    defaultX0: 0.0,
  },
  /** f(x) = ln(x) */
  ln: {
    fn: (x: number) => (x > 0 ? Math.log(x) : NaN),
    label: "f(x) = ln(x)",
    latex: "f(x) = \\ln x",
    x0Range: [0.1, 4.0],
    defaultX0: 1.0,
  },
  /** f(x) = 1/x */
  rational: {
    fn: (x: number) => (x !== 0 ? 1 / x : NaN),
    label: "f(x) = 1/x",
    latex: "f(x) = \\frac{1}{x}",
    x0Range: [-4.0, 4.0],
    defaultX0: 1.0,
  },
  /** f(x) = √x */
  sqrt: {
    fn: (x: number) => (x >= 0 ? Math.sqrt(x) : NaN),
    label: "f(x) = √x",
    latex: "f(x) = \\sqrt{x}",
    x0Range: [0.0, 4.0],
    defaultX0: 1.0,
  },
  /** f(x) = x ln(x) */
  xlnx: {
    fn: (x: number) => (x > 0 ? x * Math.log(x) : NaN),
    label: "f(x) = x ln x",
    latex: "f(x) = x \\ln x",
    x0Range: [0.1, 4.0],
    defaultX0: 0.37, // 极值点 1/e
  },
  /** f(x) = ln(x)/x */
  lnx_x: {
    fn: (x: number) => (x > 0 ? Math.log(x) / x : NaN),
    label: "f(x) = (ln x)/x",
    latex: "f(x) = \\frac{\\ln x}{x}",
    x0Range: [0.1, 5.0],
    defaultX0: 2.72, // 极值点 e
  },
  /** f(x) = x eˣ */
  xex: {
    fn: (x: number) => x * Math.exp(x),
    label: "f(x) = x eˣ",
    latex: "f(x) = x e^x",
    x0Range: [-4.0, 1.5],
    defaultX0: -1.0, // 极值点 -1
  },
};

export type PresetFunctionKey = keyof typeof PRESET_FUNCTIONS;
