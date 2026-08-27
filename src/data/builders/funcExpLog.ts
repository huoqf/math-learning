import type { MathPanelData } from "../types";
import { calculateExpLog, calculatePowerFunction } from "@/math/function";
import { MATH_COLORS } from "@/theme";

export function buildFuncExpLogPanel(
  params: Record<string, number>,
  config?: { subExpLog?: string; powerMode?: string },
): MathPanelData {
  const subType = config?.subExpLog ?? "exponential";

  // 1. 幂函数模式
  if (subType === "power") {
    const powerMode = (config?.powerMode as string) ?? "compare";
    const alpha = params.powerAlpha ?? 2.0;
    const x0 = params.x0 ?? 1.5;
    const powerRes = calculatePowerFunction(alpha, x0);

    // 格式化当前方程表达式
    let currentEqLatex = `y = x^{${alpha.toFixed(1)}}`;
    if (Math.abs(alpha - 1) < 1e-4) currentEqLatex = "y = x";
    else if (Math.abs(alpha - 2) < 1e-4) currentEqLatex = "y = x^2";
    else if (Math.abs(alpha - 3) < 1e-4) currentEqLatex = "y = x^3";
    else if (Math.abs(alpha - 0.5) < 1e-4) currentEqLatex = "y = \\sqrt{x}";
    else if (Math.abs(alpha - -1) < 1e-4) currentEqLatex = "y = \\frac{1}{x}";
    else if (Math.abs(alpha) < 1e-4) currentEqLatex = "y = 1 \\;(x \\neq 0)";

    const quantities: MathPanelData["quantities"] = [
      {
        label: powerMode === "compare" ? "当前聚焦基准" : "当前函数模型",
        value: currentEqLatex,
        color: MATH_COLORS.function,
      },
      {
        label: "幂指数 α",
        symbol: "\\alpha",
        value: alpha.toFixed(1),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "探究动点 x₀",
        symbol: "x_0",
        value: x0.toFixed(2),
        color: MATH_COLORS.function,
      },
      {
        label: "对应函数值 y₀",
        symbol: "f(x_0)",
        value: powerRes.isValidPoint ? powerRes.yVal.toFixed(2) : "无定义",
        color: MATH_COLORS.function,
      },
      {
        label: "切线斜率 k",
        symbol: "f'(x_0)",
        value: powerRes.tangentSlopeStr,
        highlight: powerRes.isTangentDifferentiable ? "positive" : "extreme",
      },
      {
        label: "切线方程",
        value: powerRes.tangentEquationLatex,
      },
      {
        label: "定义域",
        value: powerRes.domainDescription,
      },
      {
        label: "奇偶性",
        value: powerRes.parityDescription,
      },
      {
        label: "(0,+∞) 单调性",
        value: powerRes.monotonicityPositive,
        highlight: alpha > 0 ? "positive" : alpha < 0 ? "extreme" : undefined,
      },
    ];

    const theorems: MathPanelData["theorems"] =
      powerMode === "compare"
        ? [
            {
              name: "第一象限图象分界与大小反转定理",
              latex:
                "\\begin{cases} 0 < x < 1: & x^{\\alpha_1} < x^{\\alpha_2} \\quad (\\alpha_1 > \\alpha_2) \\\\ x > 1: & x^{\\alpha_1} > x^{\\alpha_2} \\quad (\\alpha_1 > \\alpha_2) \\end{cases}",
              level: "core",
              prerequisites: [
                "以公共定点 $(1, 1)$ 为分界点",
                "当 $x > 1$ 时，幂指数大者图象在上 (指大图高)",
                "当 $0 < x < 1$ 时，幂指数大者图象在下 (大小反转)",
              ],
            },
            {
              name: "课标 5 种基准幂函数解析与对称性",
              latex:
                "y=x, \\quad y=x^2, \\quad y=x^3, \\quad y=\\sqrt{x}, \\quad y=\\frac{1}{x}",
              level: "core",
              prerequisites: [
                "奇函数 (关于原点对称)：$y=x,\\; y=x^3,\\; y=\\frac{1}{x}$",
                "偶函数 (关于 $y$ 轴对称)：$y=x^2$",
                "非奇非偶 (仅第一象限)：$y=\\sqrt{x}$ (定义域 $[0, +\\infty)$)",
              ],
            },
            {
              name: "幂函数公共定点系定理",
              latex:
                "y = x^{\\alpha} \\implies (1, 1) \\text{ 为所有幂函数公共定点}",
              level: "important",
              prerequisites: [
                "当 $\\alpha > 0$ 时，图象必过原点 $(0, 0)$ 且在 $(0, +\\infty)$ 上单调递增",
                "当 $\\alpha < 0$ 时，图象不过原点且在 $(0, +\\infty)$ 上单调递减，坐标轴为渐近线",
              ],
            },
          ]
        : [
            {
              name: "幂函数导数与第一象限凹凸性定理",
              latex:
                "f'(x) = \\alpha x^{\\alpha - 1} \\implies \\begin{cases} \\alpha > 1: & f''(x) > 0 \\\\ 0 < \\alpha < 1: & f''(x) < 0 \\\\ \\alpha < 0: & f'(x) < 0 \\end{cases}",
              level: "core",
              prerequisites: [
                "$\\alpha > 1$ 时，$f''(x) > 0$，图象凹向上（增长加速）",
                "$0 < \\alpha < 1$ 时，$f''(x) < 0$，图象凸向上（增长变缓）",
                "$\\alpha < 0$ 时，$f'(x) < 0$，在 $(0, +\\infty)$ 上严格单调递减",
              ],
            },
            {
              name: "幂函数通用解析式与定点性质",
              latex: "y = x^{\\alpha} \\quad (x > 0)",
              level: "core",
              prerequisites: [
                "第一象限图象恒过公共定点 $(1, 1)$",
                "当 $\\alpha > 0$ 时恒过原点 $(0, 0)$，$\\alpha \\le 0$ 时不经原点",
              ],
            },
            {
              name: "渐近线与端点导数极限",
              latex:
                "\\lim_{x \\to 0^+} x^{\\alpha} = \\begin{cases} 0 & (\\alpha > 0) \\\\ +\\infty & (\\alpha < 0) \\end{cases}",
              level: "important",
              prerequisites: [
                "$\\alpha < 0$ 时，$x$ 轴 ($y=0$) 与 $y$ 轴 ($x=0$) 均为渐近线",
                "$0 < \\alpha < 1$ 时，$x \\to 0^+$ 处切线竖直不可导",
              ],
            },
          ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] =
      powerMode === "compare"
        ? [
            {
              text: "第一象限比较大小秒杀通法：作垂直辅助线 $x = 2$，观察各曲线的高低排列，图象在上方的函数对应幂指数 $\\alpha$ 必更大（即【指大图高】）。",
              importance: "gaokao",
            },
            {
              text: "区间 $(0, 1)$ 与 $(1, +\\infty)$ 的大小反转：当 $0 < x < 1$ 时，指数 $\\alpha$ 越大函数值越小；当 $x > 1$ 时，指数 $\\alpha$ 越大函数值越大。",
              importance: "gaokao",
            },
            {
              text: "5 大基准图象的象限分布：奇函数分布于第一、三象限，偶函数分布于第一、二象限，平方根函数仅分布于第一象限。",
              importance: "gaokao",
            },
          ]
        : [
            {
              text: "原点切线与端点导数极值：$y = \\sqrt{x}$ 在 $x \\to 0^+$ 时切线斜率趋向 $+\\infty$（竖直切线不可导）；$y = x^{\\alpha} \\; (\\alpha > 1)$ 在 $x = 0$ 处切线水平 ($f'(0) = 0$)。",
              importance: "gaokao",
            },
            {
              text: "图象凹凸与增长速度：$\\alpha > 1$ 为凹弧加速增长；$0 < \\alpha < 1$ 为凸弧减速增长；高考常用于放缩不等式构造切线。",
              importance: "gaokao",
            },
            {
              text: "负指数与双渐近线：$\\alpha < 0$ 时定义域不含原点，以两坐标轴为渐近线，在 $(0, +\\infty)$ 上严格单调递减。",
              importance: "gaokao",
            },
          ];

    const warnings: MathPanelData["warnings"] = [];
    if (powerRes.warningMessage) {
      warnings.push({
        text: powerRes.warningMessage,
        level: "danger",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        powerMode === "compare"
          ? "5大基准必过(1,1)，α大于0增且过原点；作线x=2高者指数大。"
          : "第一象限必过(1,1)，α大于1凹加速，0到1凸减速，负数双渐近。",
    };
  }

  // 2. 指数与对数模式
  const a = params.baseA ?? 2.0;
  const x0 = params.x0 ?? 1.5;
  const expLogRes = calculateExpLog(a, x0);

  const quantities: MathPanelData["quantities"] = [
    {
      label: "底数 a",
      symbol: "a",
      value: a.toFixed(1),
      color: MATH_COLORS.paramPrimary,
    },
    { label: "自变量 x₀", symbol: "x₀", value: x0.toFixed(2) },
    {
      label: subType === "logarithmic" ? "对数函数值" : "指数函数值",
      symbol: subType === "logarithmic" ? "\\log_a(x_0)" : "a^{x_0}",
      value:
        subType === "logarithmic"
          ? expLogRes.isValidBase && Number.isFinite(expLogRes.logVal)
            ? expLogRes.logVal.toFixed(2)
            : "无意义"
          : expLogRes.isValidBase
            ? expLogRes.expVal.toFixed(2)
            : "无意义",
      color: MATH_COLORS.function,
    },
    {
      label: subType === "logarithmic" ? "对称指数值" : "对称对数值",
      symbol: subType === "logarithmic" ? "a^{x_0}" : "\\log_a(x_0)",
      value:
        subType === "logarithmic"
          ? expLogRes.isValidBase
            ? expLogRes.expVal.toFixed(2)
            : "无意义"
          : expLogRes.isValidBase && Number.isFinite(expLogRes.logVal)
            ? expLogRes.logVal.toFixed(2)
            : "无意义",
      color: MATH_COLORS.functionTransformed,
    },
    {
      label: "单调状态",
      value:
        a > 1
          ? "单调递增 (a > 1)"
          : a > 0 && a < 1
            ? "单调递减 (0 < a < 1)"
            : "退化/无定义",
      highlight: a > 1 ? "extreme" : "positive",
    },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "指数与对数互为反函数关系",
      latex: "y = a^x \\iff x = \\log_a y \\quad (a > 0, a \\neq 1)",
      level: "core",
      prerequisites: [
        "$a > 0$",
        "$a \\neq 1$",
        "$x \\in \\mathbb{R},\\; y > 0$",
      ],
    },
    {
      name: "反函数图像对称定理",
      latex:
        "f(x) \\text{ 与 } f^{-1}(x) \\text{ 图象关于直线 } y = x \\text{ 对称}",
      level: "important",
      prerequisites: [
        "定义域与值域互换",
        "点 $(x_0, y_0) \\leftrightarrow (y_0, x_0)$",
      ],
    },
    {
      name: "对数换底公式与运算法则",
      latex:
        "\\log_a b = \\frac{\\ln b}{\\ln a}, \\quad \\log_a(MN) = \\log_a M + \\log_a N",
      level: "important",
      prerequisites: ["$M > 0$", "$N > 0$", "$a > 0, a \\neq 1$"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "高考高频定点：指数函数 $y = a^x$ 必过定点 $(0, 1)$，渐近线 $y = 0$；对数函数 $y = \\log_a x$ 必过定点 $(1, 0)$，渐近线 $x = 0$。",
      importance: "gaokao",
    },
    {
      text: "反函数三要素：① 定义域与值域互换；② 图象关于 $y = x$ 轴对称；③ 只有严格单调函数才存在同单调性的反函数。",
      importance: "gaokao",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (expLogRes.baseWarning) {
    warnings.push({
      text: expLogRes.baseWarning,
      level: "danger",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "指过(0,1)对过(1,0)，底过1增小1减；y=x对称反函数。",
  };
}
