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
