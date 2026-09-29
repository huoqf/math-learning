/**
 * 导数四则运算法则面板数据组装器
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
  calculateDerivativeOperation,
  type OperationType,
} from "@/math/derivativeOperations";
import { MATH_COLORS } from "@/theme";
import {
  formatMathNumber,
  formatParenSubtractTerm,
  formatSubtractTerm,
} from "@/utils/mathFormat";

export function buildDerivativeOperationsPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const opType = ((config?.opType as string) || "multiply") as OperationType;
  const modelPair =
    (config?.modelPair as "poly_trig" | "poly_exp" | "trig_poly") ||
    "poly_trig";
  const x0 = params.x0 ?? 1.2;
  const deltaX = params.deltaX ?? 0.3;

  const res = calculateDerivativeOperation(opType, x0, deltaX, modelPair);

  const quantities: MathQuantity[] = [
    {
      label: "运算法则",
      value: `$${res.ruleLatex}$`,
      color: MATH_COLORS.functionTransformed,
    },
    {
      label: "基函数 f 与导数",
      value: `$f(x_0)=${formatMathNumber(res.fx)}, \\; f'(x_0)=${formatMathNumber(res.fpx)}$`,
      color: MATH_COLORS.function,
    },
    {
      label: "基函数 g 与导数",
      value: `$g(x_0)=${formatMathNumber(res.gx)}, \\; g'(x_0)=${formatMathNumber(res.gpx)}$`,
      color: MATH_COLORS.derivative,
    },
    {
      label: "复合运算函数值",
      symbol: "H(x_0)",
      value: res.isValid ? formatMathNumber(res.combinedY) : "无定义",
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "运算导数值 (瞬时斜率)",
      symbol: "H'(x_0)",
      value: res.isValid ? formatMathNumber(res.combinedSlope) : "无定义",
      highlight: "positive",
      color: MATH_COLORS.tangentLine,
    },
  ];

  if (opType === "multiply") {
    quantities.push(
      {
        label: "积增量面积一 u·Δv",
        symbol: "f(x_0)\\Delta g",
        value: formatMathNumber(res.areaMain1),
      },
      {
        label: "积增量面积二 v·Δu",
        symbol: "g(x_0)\\Delta f",
        value: formatMathNumber(res.areaMain2),
      },
      {
        label: "高阶增量项 Δu·Δv",
        symbol: "\\Delta f \\cdot \\Delta g",
        value: formatMathNumber(res.areaHigher),
        highlight: "extreme",
      },
    );
  }

  const theorems: Theorem[] = [
    {
      name: "导数四则运算法则定理全表",
      latex:
        "\\begin{aligned} [f(x) \\pm g(x)]' &= f'(x) \\pm g'(x) \\\\ [cf(x)]' &= c f'(x) \\quad (c \\text{ 为常数}) \\\\ [f(x)g(x)]' &= f'(x)g(x) + f(x)g'(x) \\\\ \\left[\\frac{f(x)}{g(x)}\\right]' &= \\frac{f'(x)g(x) - f(x)g'(x)}{[g(x)]^2} \\quad (g(x) \\neq 0) \\end{aligned}",
      level: "core",
      prerequisites: [
        "函数 $f(x)$ 与 $g(x)$ 在点 $x$ 处均可导",
        "商法则必须保证分母 $g(x) \\neq 0$",
      ],
      note: "人教A版选必二课标正文法则：积法则由矩形两边同时膨胀的面积微分导出，商法则可看作积法则与复合求导的综合延伸。",
    },
    {
      name: "积法则几何直观 · 动态矩形面积增量",
      latex:
        "\\Delta(uv) = (u + \\Delta u)(v + \\Delta v) - uv = u\\Delta v + v\\Delta u + \\Delta u \\Delta v",
      level: "important",
      prerequisites: ["矩形长为 $u=f(x)$，宽为 $v=g(x)$"],
      note: "两边同除以 $\\Delta x$ 并取极限 $\\Delta x \\to 0$ 时，高阶无穷小项 $\\frac{\\Delta u \\Delta v}{\\Delta x} \\to 0$ 消失，精确留下 $u v' + v u'$ 两项主部。",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "【高考商法则两大失分重灾区】① 漏写分母平方：常有考生误写成分母一次项；② 分子顺序颠倒：必须是「子导母不导 减去 子不导母导」，因减法不满足交换律，颠倒会导致导数符号全错，单调区间彻底反向！",
      importance: "gaokao",
    },
    {
      text: "【积法则记忆口诀与交叉相乘】$(uv)' = u'v + uv'$。三项相乘法则自然推广：$(uvw)' = u'vw + uv'w + uvw'$（轮流求导相加）。高考压轴题中求超越函数如 $f(x) = (x^2 - ax)e^x$ 极值时，积法则必用。",
      importance: "gaokao",
    },
    {
      text: "【常数提取简化运算】若式子中含有常数因数，优先提取常数 $[c \\cdot f(x)]' = c \\cdot f'(x)$，切勿盲目使用商法则（如 $\\frac{x^2}{3}$ 直接看作 $\\frac{1}{3}x^2$ 求导，严禁套用复杂的商法则）。",
      importance: "core",
    },
  ];

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "审题定法 · 识别四则运算结构与运算法则",
      detail: `当前目标函数为 $${res.combinedExpr}$，各基函数分别为 $${res.fExpr}$ 与 $${res.gExpr}$。应用运算法则为 $${res.ruleLatex}$。`,
      latex: res.ruleLatex,
      rubric: "准确识别运算类型并写出对应的运算法则通式得 2 分",
    },
    {
      step: 2,
      title: "建模联立 · 代入基函数导数与代数交叉展开",
      detail: res.isValid
        ? `在探究点 $x_0 = ${formatMathNumber(x0)}$ 处，分别计算基函数及其导数值：$f(${formatMathNumber(x0)}) = ${formatMathNumber(res.fx)}, f'(${formatMathNumber(x0)}) = ${formatMathNumber(res.fpx)}$；$g(${formatMathNumber(x0)}) = ${formatMathNumber(res.gx)}, g'(${formatMathNumber(x0)}) = ${formatMathNumber(res.gpx)}$。将数值规范代入法则式。`
        : `探究点 $x_0 = ${formatMathNumber(x0)}$ 使分母 $g(x_0) = ${formatMathNumber(res.gx)} = 0$，商函数在该点无定义，导数不存在，本步无法继续。`,
      latex: res.stepCalculationLatex,
      rubric: "正确求出各基函数的导数值并规范代入展开得 2 分",
    },
    {
      step: 3,
      title: "求解反思 · 算理检验与几何切线斜率",
      detail: res.isValid
        ? `计算得到复合函数的瞬时导数值 $H'(${formatMathNumber(x0)}) = ${formatMathNumber(res.combinedSlope)}$。此时点 $P(${formatMathNumber(x0)}, ${formatMathNumber(res.combinedY)})$ 处的切线方程为点斜式 $y ${formatSubtractTerm(res.combinedY)} = ${formatMathNumber(res.combinedSlope)}${formatParenSubtractTerm(x0)}$。`
        : `分母为零 ⇒ 商函数在该点无定义，导数值不存在，因此不存在过该点的切线方程。这正是商法则必须先验证 $g(x) \\neq 0$ 的原因。`,
      latex: res.isValid
        ? `H'(${formatMathNumber(x0)}) = ${formatMathNumber(res.combinedSlope)} \\implies y ${formatSubtractTerm(res.combinedY)} = ${formatMathNumber(res.combinedSlope)}${formatParenSubtractTerm(x0)}`
        : "\\text{分母为零，导数与切线均不存在}",
      rubric: "给出准确结果数值并写出点斜式切线方程得 2 分",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (res.warning) {
    warnings.push({
      text: res.warning,
      level: "danger",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic:
      "和差分别求导，积法交叉相加；商法分母平方，分子子导母不导减子不导母导。",
  };
}
