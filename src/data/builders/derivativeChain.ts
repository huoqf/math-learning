/**
 * 简单复合函数求导右屏数据组装器
 * 遵循系统公理 2：左问右解闭环，推导链三部曲
 */
import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  ReasoningStep,
} from "../types";
import {
  calculateDerivativeChain,
  type OuterFunctionType,
} from "@/math/derivativeChain";
import { MATH_COLORS } from "@/theme";
import {
  formatLinearExpr,
  formatMathNumber,
  formatParenSubtractTerm,
  formatSubtractTerm,
} from "@/utils/mathFormat";

export function buildDerivativeChainPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const outerType = ((config?.outerType as string) ||
    "exp") as OuterFunctionType;
  const a = params.a ?? 2;
  const b = params.b ?? 1;
  const x0 = params.x0 ?? 0.5;

  const res = calculateDerivativeChain(outerType, a, b, x0);
  const innerLinear = formatLinearExpr(a, b);

  const quantities: MathQuantity[] = [
    {
      label: "复合函数解析式",
      value: `$${res.combinedExpr}$`,
      color: MATH_COLORS.functionTransformed,
    },
    {
      label: "内层分解",
      value: `$u = ${innerLinear}$`,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "当前中间变量值",
      symbol: "u_0",
      value: res.isValid ? formatMathNumber(res.u0) : "未定义",
      color: MATH_COLORS.paramTertiary,
    },
    {
      label: "外层导数值",
      symbol: "f'(u_0)",
      value: res.isValid ? formatMathNumber(res.fpu0) : "未定义",
      color: MATH_COLORS.derivative,
    },
    {
      label: "复合导数值 (切线斜率)",
      symbol: "y'(x_0)",
      value: res.isValid ? formatMathNumber(res.slope) : "未定义",
      color: MATH_COLORS.paramPrimary,
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "简单复合函数求导法则 (课标正文)",
      latex: "y' = [f(ax+b)]' = f'(ax+b) \\cdot a",
      note: "复合函数对自变量的导数，等于外层函数对中间变量的导数，乘以线性内层函数的系数 $a$。",
      condition: "内层函数为线性函数 $u = ax+b$，外层函数在对应点可导",
      level: "core",
    },
    {
      name: "导数几何放大效应",
      latex: "k_{\\text{复合}} = a \\cdot k_{\\text{外层}}",
      note: "线性拉伸系数 $a$ 使得自变量变化率被缩放 $|a|$ 倍；当 $a < 0$ 时引起单调性翻转。",
      condition: "当 $a > 0$ 时保号增减；当 $a < 0$ 时颠倒增减方向",
      level: "important",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "高考必考：切线点斜式与内层系数漏乘。绝大多数考生的致命扣分点是在运用复合函数求导时，仅对外部求导而遗漏了乘以线性内层系数 $a$。",
      importance: "gaokao",
    },
    {
      text: "单调性与极值判断中的内层符号翻转。当 $a < 0$ 时，内层单调递减，使得复合函数单调区间与原初等函数完全颠倒，需高度警惕。",
      importance: "hard",
    },
  ];

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "审题定法 · 识别结构与设换元分解",
      detail: `观察目标解析式 $y = f(ax+b)$，明确外层为初等函数 $f(u)$，内层为一阶线性函数 $u = ${innerLinear}$。确定求导主定理为复合函数求导法则 $y' = f'(u) \\cdot u'$。`,
      latex: "y = f(u), \\quad u = ax + b \\implies y' = f'(u) \\cdot a",
      rubric: "准确识别内外层函数与线性关系得 1 分",
    },
    {
      step: 2,
      title: "建模联立 · 代入中间变量并求外层导数",
      detail: res.isValid
        ? `计算探究点 $x_0 = ${formatMathNumber(x0)}$ 处的中间变量值 $u_0 = ${formatMathNumber(a)} \\times (${formatMathNumber(x0)}) + (${formatMathNumber(b)}) = ${formatMathNumber(res.u0)}$。求外层导数 $f'(u_0) = ${formatMathNumber(res.fpu0)}$，内层导数 $u' = a = ${formatMathNumber(a)}$。`
        : `探究点 $x_0 = ${formatMathNumber(x0)}$ 使中间变量 $u_0 = ${formatMathNumber(res.u0)}$ 越出外层函数定义域，外层导数 $f'(u_0)$ 不存在，本步无法继续。`,
      latex: res.isValid
        ? `u_0 = ${formatMathNumber(res.u0)}, \\quad f'(u_0) = ${formatMathNumber(res.fpu0)}, \\quad u' = ${formatMathNumber(a)}`
        : "\\text{中间变量超出定义域}",
      rubric: "正确求得中间变量及外层导数值规范列式得 2 分",
    },
    {
      step: 3,
      title: "求解反思 · 乘积得解与切线方程",
      detail: res.isValid
        ? `由求导法则可得复合导数 $y'(${formatMathNumber(x0)}) = f'(u_0) \\cdot a = ${formatMathNumber(res.fpu0)} \\times (${formatMathNumber(a)}) = ${formatMathNumber(res.slope)}$。点 $P(${formatMathNumber(x0)}, ${formatMathNumber(res.y0)})$ 处切线方程为 $y ${formatSubtractTerm(res.y0)} = ${formatMathNumber(res.slope)}${formatParenSubtractTerm(x0)}$。`
        : "因超出定义域，无法在该点作切线。",
      latex: res.isValid
        ? `y'(${formatMathNumber(x0)}) = ${formatMathNumber(res.slope)} \\implies y ${formatSubtractTerm(res.y0)} = ${formatMathNumber(res.slope)}${formatParenSubtractTerm(x0)}`
        : "\\text{无解}",
      rubric: "准确给出切线斜率与点斜式方程得 2 分",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (res.domainError) {
    warnings.push({
      text: res.domainError,
      level: "danger",
    });
  }
  if (res.degenerateNotice) {
    warnings.push({
      text: res.degenerateNotice,
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic: "先对外部求导，内层抄写照旧；千万别忘收尾，乘以内层系数 a。",
  };
}
