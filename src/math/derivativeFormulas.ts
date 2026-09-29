/**
 * 基本初等函数求导公式领域模型（纯数学层）
 * 遵循系统公理 1：纯函数、零副作用、无 DOM/React 依赖
 */

import { formatMathNumber } from "@/utils/mathFormat";

export type BasicFuncType =
  | "constant" // 常数函数 c
  | "power" // 幂函数 x^α
  | "sin" // 正弦函数 sin x
  | "cos" // 余弦函数 cos x
  | "exp" // 指数函数 a^x (含 e^x)
  | "log"; // 对数函数 log_a x (含 ln x)

export interface DerivativeFormulaResult {
  funcType: BasicFuncType;
  x0: number;
  deltaX: number;
  // 函数值与导数值
  fx0: number;
  fpx0: number;
  // 增量与割线斜率
  fx0PlusDelta: number;
  deltaY: number;
  secantSlope: number; // Δy / Δx
  slopeDiff: number; // |secantSlope - fpx0|
  // LaTeX 公式与说明
  funcLatex: string;
  derivativeLatex: string;
  derivativeRuleLatex: string;
  domainDesc: string;
  isValid: boolean;
  warning?: string;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * 求实数 x 作为最简分数时的分母（分子/分母均为小整数时有效）。
 * 用于判断分数指数 `x^{p/q}` 的定义域：分母为偶数 ⇒ 负底数无实数意义。
 */
function fractionDenominator(x: number): number {
  for (let k = 1; k <= 8; k++) {
    const n = Math.round(x * k);
    if (n !== 0 && Math.abs(x * k - n) < 1e-9) {
      return k / gcd(Math.abs(n), k);
    }
  }
  return 1;
}

/**
 * 幂函数 `x^α` 的定义域描述（2019 人教A版口径）。
 *
 * 这是「文字定义域」与「真实求值」同源的唯一事实源：中屏求值器用 `Math.pow(x, α)`
 * 计算，当 α 的分母为偶数时（如 α = 1/2、3/2、5/2）负底数返回 NaN，
 * 因此定义域描述**必须**随之收紧为 `[0, +∞)`，否则右屏会印出与曲线直接矛盾的 `x ∈ ℝ`。
 *
 * 判定规则（把 α 写成最简分数 p/q）：
 *   - q 为偶数 → `[0, +∞)`（α > 0）或 `(0, +∞)`（α < 0）
 *   - q 为奇数 → `ℝ`（α > 0）或 `ℝ \\ {0}`（α ≤ 0）
 */
export function describePowerDomain(alpha: number): string {
  if (Math.abs(alpha) < 1e-9) return "x \\neq 0";
  const isNegative = alpha < 0;
  const den = fractionDenominator(alpha);
  if (den % 2 === 0) {
    return isNegative ? "x \\in (0, +\\infty)" : "x \\in [0, +\\infty)";
  }
  return isNegative ? "x \\neq 0" : "x \\in \\mathbb{R}";
}

export function calculateDerivativeFormula(
  funcType: BasicFuncType,
  x0: number,
  deltaX: number,
  paramA: number = 2, // 幂指数 α 或 指对数底数 a
): DerivativeFormulaResult {
  // 默认保护
  const safeDeltaX =
    Math.abs(deltaX) < 1e-4 ? (deltaX >= 0 ? 1e-4 : -1e-4) : deltaX;

  let fx0 = 0;
  let fpx0 = 0;
  let fx0PlusDelta = 0;
  let funcLatex = "";
  let derivativeLatex = "";
  let derivativeRuleLatex = "";
  let domainDesc = "";
  let isValid = true;
  let warning: string | undefined;

  switch (funcType) {
    case "constant": {
      const c = paramA;
      fx0 = c;
      fpx0 = 0;
      fx0PlusDelta = c;
      funcLatex = `f(x) = ${c.toFixed(1)}`;
      derivativeLatex = "f'(x) = 0";
      derivativeRuleLatex = "(C)' = 0 \\quad (C \\text{ 为常数})";
      domainDesc = "x \\in \\mathbb{R}";
      break;
    }
    case "power": {
      const alpha = paramA;
      if (alpha < 0 && Math.abs(x0) < 1e-4) {
        isValid = false;
        warning = "负幂次在 x = 0 处无定义";
      }
      fx0 = Math.pow(x0, alpha);
      fpx0 = alpha * Math.pow(x0, alpha - 1);
      fx0PlusDelta = Math.pow(x0 + safeDeltaX, alpha);
      // 整数指数不补 ".0"（α = 1 写 "1" 而不是 "1.0"，α = 4 写 "4" 而不是 "4.0"）
      const alphaStr = formatMathNumber(alpha);
      // 导函数 `α x^{α-1}`：α - 1 = 0 时退化为常数 α；α - 1 = 1 时指数写作 x（不写 ^{1})
      const m1 = alpha - 1;
      const hasPowerFactor = Math.abs(m1) > 1e-9;
      const powerFactor =
        Math.abs(m1 - 1) < 1e-9 ? "x" : `x^{${formatMathNumber(m1)}}`;
      const coeffStr =
        Math.abs(alpha - 1) < 1e-9
          ? ""
          : Math.abs(alpha + 1) < 1e-9
            ? "-"
            : alphaStr;
      funcLatex = `f(x) = x^{${alphaStr}}`;
      derivativeLatex = hasPowerFactor
        ? `f'(x) = ${coeffStr}${powerFactor}`
        : `f'(x) = ${alphaStr}`;
      derivativeRuleLatex = "(x^\\alpha)' = \\alpha x^{\\alpha - 1}";
      domainDesc = describePowerDomain(alpha);
      break;
    }
    case "sin": {
      fx0 = Math.sin(x0);
      fpx0 = Math.cos(x0);
      fx0PlusDelta = Math.sin(x0 + safeDeltaX);
      funcLatex = "f(x) = \\sin x";
      derivativeLatex = "f'(x) = \\cos x";
      derivativeRuleLatex = "(\\sin x)' = \\cos x";
      domainDesc = "x \\in \\mathbb{R}";
      break;
    }
    case "cos": {
      fx0 = Math.cos(x0);
      fpx0 = -Math.sin(x0);
      fx0PlusDelta = Math.cos(x0 + safeDeltaX);
      funcLatex = "f(x) = \\cos x";
      derivativeLatex = "f'(x) = -\\sin x";
      derivativeRuleLatex = "(\\cos x)' = -\\sin x";
      domainDesc = "x \\in \\mathbb{R}";
      break;
    }
    case "exp": {
      const a = paramA <= 0 ? 2 : paramA;
      const isNatural = Math.abs(a - Math.E) < 0.05;
      fx0 = Math.pow(a, x0);
      fpx0 = isNatural ? Math.exp(x0) : Math.pow(a, x0) * Math.log(a);
      fx0PlusDelta = Math.pow(a, x0 + safeDeltaX);
      if (Math.abs(a - 1) < 1e-9) {
        // a = 1 时 y = 1^x ≡ 1 退化为常数，不再是指数函数。
        // 底数滑块步长为 0.5/0.1，1.0 是网格点，用户必然经过 —— 必须显式提示而非静默给一个"斜率 0"。
        warning =
          "底数 $a = 1$ 时 $y = 1^x \\equiv 1$ 退化为常数函数，不再是指数函数（指数函数要求 $a > 0$ 且 $a \\neq 1$）";
      }
      if (isNatural) {
        funcLatex = "f(x) = e^x";
        derivativeLatex = "f'(x) = e^x";
        derivativeRuleLatex =
          "(e^x)' = e^x \\quad \\text{或} \\quad (a^x)' = a^x \\ln a";
      } else {
        funcLatex = `f(x) = ${formatMathNumber(a)}^x`;
        derivativeLatex = `f'(x) = ${formatMathNumber(a)}^x \\ln ${formatMathNumber(a)}`;
        derivativeRuleLatex = "(a^x)' = a^x \\ln a \\quad (a > 0, a \\neq 1)";
      }
      domainDesc = "x \\in \\mathbb{R}";
      break;
    }
    case "log": {
      if (x0 <= 0 || x0 + safeDeltaX <= 0) {
        isValid = false;
        warning = "真数必须大于 0";
      }
      const a = paramA <= 0 ? 2 : paramA;
      const isNatural = Math.abs(a - Math.E) < 0.05;
      if (Math.abs(a - 1) < 1e-9) {
        // a = 1 时 log_1 x 无定义（底数必须 a > 0 且 a ≠ 1）。
        // 旧实现未拦截 ⇒ ln(a) = 0 作分母 ⇒ 右屏整片 Infinity / NaN
        // （$f(x) = \log_{1.0} x$、(1.5, Infinity)、切线 $y - Infinity = Infinity(x - 1.5)$）。
        // 此处直接判死，由 builder 统一渲染为「无定义」，绝不外泄 Infinity/NaN 字面量。
        isValid = false;
        warning =
          "底数 $a = 1$ 时 $y = \\log_1 x$ 无定义（对数函数要求 $a > 0$ 且 $a \\neq 1$）";
        fx0 = NaN;
        fpx0 = NaN;
        fx0PlusDelta = NaN;
        funcLatex = `f(x) = \\log_{${formatMathNumber(a)}} x`;
        derivativeLatex = "f'(x) \\text{ 无定义}";
        derivativeRuleLatex =
          "(\\log_a x)' = \\frac{1}{x \\ln a} \\quad (a > 0, a \\neq 1, x > 0)";
        domainDesc = "\\text{无定义}";
        break;
      }
      fx0 = isNatural ? Math.log(x0) : Math.log(x0) / Math.log(a);
      fpx0 = isNatural ? 1 / x0 : 1 / (x0 * Math.log(a));
      fx0PlusDelta = isNatural
        ? Math.log(Math.max(1e-4, x0 + safeDeltaX))
        : Math.log(Math.max(1e-4, x0 + safeDeltaX)) / Math.log(a);
      if (isNatural) {
        funcLatex = "f(x) = \\ln x";
        derivativeLatex = "f'(x) = \\frac{1}{x}";
        derivativeRuleLatex =
          "(\\ln x)' = \\frac{1}{x} \\quad \\text{或} \\quad (\\log_a x)' = \\frac{1}{x \\ln a}";
      } else {
        funcLatex = `f(x) = \\log_{${a.toFixed(1)}} x`;
        derivativeLatex = `f'(x) = \\frac{1}{x \\ln ${a.toFixed(1)}}`;
        derivativeRuleLatex =
          "(\\log_a x)' = \\frac{1}{x \\ln a} \\quad (a > 0, a \\neq 1, x > 0)";
      }
      domainDesc = "x \\in (0, +\\infty)";
      break;
    }
  }

  const deltaY = fx0PlusDelta - fx0;
  const secantSlope = deltaY / safeDeltaX;
  const slopeDiff = Math.abs(secantSlope - fpx0);

  return {
    funcType,
    x0,
    deltaX: safeDeltaX,
    fx0,
    fpx0,
    fx0PlusDelta,
    deltaY,
    secantSlope,
    slopeDiff,
    funcLatex,
    derivativeLatex,
    derivativeRuleLatex,
    domainDesc,
    isValid,
    warning,
  };
}
