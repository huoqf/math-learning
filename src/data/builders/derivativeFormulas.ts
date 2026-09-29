/**
 * 基本初等函数求导公式面板数据组装器
 * 遵循公理 2：左问右解闭环，推导链三部曲（符号 -> 代入 -> 结果）
 */
import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  ReasoningStep,
} from "../types";
import {
  calculateDerivativeFormula,
  type BasicFuncType,
} from "@/math/derivativeFormulas";
import { MATH_COLORS } from "@/theme";
import {
  formatMathNumber,
  formatParenSubtractTerm,
  formatSubtractTerm,
} from "@/utils/mathFormat";

export function buildDerivativeFormulasPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const funcType = ((config?.funcType as string) || "power") as BasicFuncType;
  const x0 = params.x0 ?? 1.5;
  const deltaX = params.deltaX ?? 0.8;
  const paramA = params.paramA ?? 2.0;

  const res = calculateDerivativeFormula(funcType, x0, deltaX, paramA);

  // 非法点（真数 ≤ 0、底数 a = 1、负幂次 x = 0）一律渲染为「无定义」，
  // 绝不把 Infinity / NaN 这类字面量外泄到右屏（formatMathNumber 对非有限值是原样输出）。
  const fmt = (n: number) => (res.isValid ? formatMathNumber(n) : "无定义");
  const slopeCoeff =
    Math.abs(res.fpx0 - 1) < 1e-9
      ? ""
      : Math.abs(res.fpx0 + 1) < 1e-9
        ? "-"
        : formatMathNumber(res.fpx0);

  const quantities: MathQuantity[] = [
    {
      label: "当前解析式",
      value: `$${res.funcLatex}$`,
      color: MATH_COLORS.function,
    },
    {
      label: "当前导函数",
      value: `$${res.derivativeLatex}$`,
      color: MATH_COLORS.derivative,
    },
    {
      label: "求导法则公式",
      value: `$${res.derivativeRuleLatex}$`,
      color: MATH_COLORS.functionTransformed,
    },
    {
      label: "切点坐标 P",
      symbol: "P(x_0, f(x_0))",
      value: `(${formatMathNumber(res.x0)}, ${fmt(res.fx0)})`,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "理论导数值 (切线斜率)",
      symbol: "f'(x_0)",
      value: fmt(res.fpx0),
      highlight: res.isValid ? "positive" : undefined,
      color: MATH_COLORS.tangentLine,
    },
    {
      label: "割点坐标 Q",
      symbol: "Q(x_0+\\Delta x, f(x_0+\\Delta x))",
      value: `(${formatMathNumber(res.x0 + res.deltaX)}, ${fmt(res.fx0PlusDelta)})`,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "平均变化率 (割线斜率)",
      symbol: "\\frac{\\Delta y}{\\Delta x}",
      value: fmt(res.secantSlope),
      color: MATH_COLORS.secantLine,
    },
    {
      label: "割线与切线斜率逼近差",
      symbol: "|k_{割} - k_{切}|",
      value: fmt(res.slopeDiff),
      highlight: res.isValid && res.slopeDiff < 0.1 ? "positive" : undefined,
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "高中常见基本初等函数导数公式全表",
      latex:
        "\\begin{aligned} (C)' &= 0, & (x^\\alpha)' &= \\alpha x^{\\alpha - 1} \\\\ (\\sin x)' &= \\cos x, & (\\cos x)' &= -\\sin x \\\\ (a^x)' &= a^x \\ln a, & (e^x)' &= e^x \\\\ (\\log_a x)' &= \\frac{1}{x \\ln a}, & (\\ln x)' &= \\frac{1}{x} \\end{aligned}",
      level: "core",
      prerequisites: [
        "定义域前提：$\\log_a x$ 必须满足 $x > 0, a > 0, a \\neq 1$",
        "幂函数要求：求导点须落在幂函数定义域内部，如 $\\alpha = \\frac{1}{2}$ 时仅在 $x > 0$ 上求导，$\\alpha$ 为负整数时 $x \\neq 0$",
        "三角函数角变量 $x$ 必须采用弧度制（严禁代入角度）",
      ],
      note: "人教A版选必二课标正文 8 大基础导数公式，是所有求导运算法则的元母基石。",
    },
    {
      name: "导数的本质定义 · 平均变化率的微商逼近",
      latex:
        "f'(x_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x}",
      level: "important",
      prerequisites: [
        "自变量增量 $\\Delta x$ 从两侧趋近于 0（左极限等于右极限）",
        "几何直观：割线 $PQ$ 的极限位置即为切线 $PT$",
      ],
      note: "当 $\\Delta x$ 越来越小时，割线斜率 $\\frac{\\Delta y}{\\Delta x}$ 无限趋近于切线斜率 $f'(x_0)$。",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "【高考求导规范与易错红线】① 余弦求导必带负号：$(\\cos x)' = -\\sin x$（常有考生漏记负号导致整题单调性全反）；② 常用对数与自然对数：$(\\ln x)' = \\frac{1}{x}$，底数为 $a$ 时分母必带 $\\ln a$。",
      importance: "gaokao",
    },
    {
      text: "【切线方程四步通法】高考小题与大题第一问必考求切线：① 定切点 $P(x_0, f(x_0))$；② 求导函数 $f'(x)$；③ 求斜率 $k = f'(x_0)$；④ 点斜式写出方程 $y - f(x_0) = f'(x_0)(x - x_0)$。",
      importance: "gaokao",
    },
    {
      text: "【角度制转弧度制铁律】基本初等函数的求导公式中，三角函数的自变量必须采用弧度制：$(\\sin x)' = \\cos x$、$(\\cos x)' = -\\sin x$ 仅在弧度制下成立；若题目给出角度（如 $30^\\circ$），必须先化为 $\\frac{\\pi}{6}$ 才能代入导函数计算。",
      importance: "core",
    },
  ];

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: "审题定法 · 确定基本函数类型与法则公式",
      detail: `当前探究函数为 $${res.funcLatex}$，其所属课标基本初等函数求导母公式为 $${res.derivativeRuleLatex}$。定义域为 $${res.domainDesc}$。`,
      latex: res.derivativeRuleLatex,
      rubric: "准确写出当前函数的导函数法则公式得 2 分",
    },
    {
      step: 2,
      title: "建模联立 · 代入探究切点与割线增量",
      detail: res.isValid
        ? `在探究点 $x_0 = ${formatMathNumber(res.x0)}$ 处，计算函数值 $f(x_0) = ${formatMathNumber(res.fx0)}$。当自变量产生增量 $\\Delta x = ${formatMathNumber(res.deltaX)}$ 时，函数值增量 $\\Delta y = f(x_0 + \\Delta x) - f(x_0) = ${formatMathNumber(res.deltaY)}$。由此计算平均变化率（割线斜率）。`
        : `当前参数下函数在 $x_0 = ${formatMathNumber(res.x0)}$ 处无定义（${res.warning ?? "定义域不合规"}），无法建立割线模型。请先调整参数使该点落入定义域。`,
      latex: res.isValid
        ? `\\frac{\\Delta y}{\\Delta x} = \\frac{${formatMathNumber(res.deltaY)}}{${formatMathNumber(res.deltaX)}} = ${formatMathNumber(res.secantSlope)}`
        : "\\text{该点无定义，割线模型不成立}",
      rubric: "列出差商计算式并算出割线斜率得 2 分",
    },
    {
      step: 3,
      title: "求解反思 · 微商极限逼近与瞬时切线斜率",
      detail: res.isValid
        ? `令 $\\Delta x \\to 0$，平均变化率的极限即为在点 $P$ 处的瞬时导数 $f'(${formatMathNumber(res.x0)}) = ${formatMathNumber(res.fpx0)}$。当前两者之差 $|k_{割} - k_{切}| = ${formatMathNumber(res.slopeDiff)}$。拖动 $\\Delta x$ 滑块越接近 0，割线 $PQ$ 与切线重合度越高。`
        : `当前参数下导数不存在，无法写出切线方程。这正是"先查定义域、再求导"的必检步骤：代入前必须确认切点落在函数定义域内。`,
      latex: res.isValid
        ? `f'(${formatMathNumber(res.x0)}) = ${formatMathNumber(res.fpx0)} \\implies y ${formatSubtractTerm(res.fx0)} = ${slopeCoeff}${formatParenSubtractTerm(res.x0)}`
        : "\\text{无定义，无切线}",
      rubric: "写出瞬时导数值并由点斜式写出切线方程得 2 分",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (res.warning) {
    // 底数为 1 属于「退化提示」而非「越界错误」：函数本身有值，只是不再是指数/对数函数
    const isDegenerateBase =
      (funcType === "exp" || funcType === "log") && Math.abs(paramA - 1) < 1e-9;
    warnings.push({
      text: res.warning,
      level: res.isValid ? (isDegenerateBase ? "warning" : "info") : "danger",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic:
      "常导为零幂降次，正变余弦余变负；指数对数看底数，自然对数底为一。",
  };
}
