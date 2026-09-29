/**
 * 简单复合函数求导领域模型（纯数学层）
 * 遵循系统公理 1：纯函数、零副作用、无 DOM/React 依赖
 * 课标边界：仅限于外层为基本初等函数，内层为线性函数 u = ax + b
 */

import { formatLinearExpr, formatMathNumber } from "@/utils/mathFormat";

export type OuterFunctionType =
  | "exp" // e^(ax+b)
  | "sin" // sin(ax+b)
  | "ln" // ln(ax+b)
  | "power"; // (ax+b)^3

export interface DerivativeChainResult {
  outerType: OuterFunctionType;
  a: number;
  b: number;
  x0: number;
  u0: number; // 内层中间变量 u0 = ax0 + b
  fu0: number; // 外层函数值 f(u0)
  fpu0: number; // 外层导数值 f'(u0)
  y0: number; // 复合函数值 y(x0) = f(ax0+b)
  slope: number; // 复合导数值 y'(x0) = a * f'(u0)
  outerExpr: string; // 如 "e^u"
  innerExpr: string; // 如 "ax + b"
  combinedExpr: string; // 如 "e^{ax+b}"
  formulaLatex: string;
  stepLatex: string;
  isValid: boolean;
  domainError?: string;
  /** 非致命参数退化提示（函数仍有定义，只是失去"复合"意义），由 builder 渲染为 warning 级 */
  degenerateNotice?: string;
}

export function evaluateOuterFunc(
  type: OuterFunctionType,
  u: number,
): { val: number; prime: number; valid: boolean } {
  switch (type) {
    case "exp":
      return { val: Math.exp(u), prime: Math.exp(u), valid: true };
    case "sin":
      return { val: Math.sin(u), prime: Math.cos(u), valid: true };
    case "ln":
      if (u <= 1e-4) return { val: NaN, prime: NaN, valid: false };
      return { val: Math.log(u), prime: 1 / u, valid: true };
    case "power":
      return { val: Math.pow(u, 3), prime: 3 * Math.pow(u, 2), valid: true };
  }
}

export function calculateDerivativeChain(
  outerType: OuterFunctionType,
  a: number,
  b: number,
  x0: number,
): DerivativeChainResult {
  const u0 = a * x0 + b;
  const outerRes = evaluateOuterFunc(outerType, u0);

  // 内层线性式 u = ax + b 的规范书写（省略 ±1 系数、合并负号、a = 0 时退化为常数）
  const innerLinear = formatLinearExpr(a, b);

  let outerExpr = "";
  let combinedExpr = "";
  const formulaLatex = "y' = [f(ax+b)]' = f'(ax+b) \\cdot a";

  switch (outerType) {
    case "exp":
      outerExpr = "f(u) = e^u";
      combinedExpr = `y = e^{${innerLinear}}`;
      break;
    case "sin":
      outerExpr = "f(u) = \\sin u";
      combinedExpr = `y = \\sin(${innerLinear})`;
      break;
    case "ln":
      outerExpr = "f(u) = \\ln u";
      combinedExpr = `y = \\ln(${innerLinear})`;
      break;
    case "power":
      outerExpr = "f(u) = u^3";
      combinedExpr = `y = (${innerLinear})^3`;
      break;
  }

  // a = 0 退化：u ≡ b 为常数，复合函数退化为常数 f(b)，导数值虽仍为 0 但已无"复合"可言。
  const degenerateNotice =
    Math.abs(a) < 1e-9
      ? "内层系数 $a = 0$ 时 $u \\equiv b$ 为常数，复合函数退化为常值 $f(b)$，$y' \\equiv 0$ —— 此时已不构成复合结构，请调整 $a$"
      : undefined;

  if (!outerRes.valid) {
    return {
      outerType,
      a,
      b,
      x0,
      u0,
      fu0: NaN,
      fpu0: NaN,
      y0: NaN,
      slope: NaN,
      outerExpr,
      innerExpr: `u = ${innerLinear}`,
      combinedExpr,
      formulaLatex,
      stepLatex: "",
      isValid: false,
      domainError:
        outerType === "ln"
          ? "对数内层真数必须满足 u = ax + b > 0"
          : "定义域不合规",
      degenerateNotice,
    };
  }

  const slope = a * outerRes.prime;
  const stepLatex = `y' = f'(${formatMathNumber(u0)}) \\cdot (${formatMathNumber(a)}) = ${formatMathNumber(outerRes.prime)} \\times ${formatMathNumber(a)} = ${formatMathNumber(slope)}`;

  return {
    outerType,
    a,
    b,
    x0,
    u0,
    fu0: outerRes.val,
    fpu0: outerRes.prime,
    y0: outerRes.val,
    slope,
    outerExpr,
    innerExpr: `u = ${innerLinear}`,
    combinedExpr,
    formulaLatex,
    stepLatex,
    isValid: true,
    degenerateNotice,
  };
}
