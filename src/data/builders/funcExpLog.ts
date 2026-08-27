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
    const powerMode = (config?.powerMode as string) ?? "single";
    const alpha = params.powerAlpha ?? 2.0;
    const x0 = params.x0 ?? 1.5;
    const powerRes = calculatePowerFunction(alpha, x0);

    const quantities: MathPanelData["quantities"] = [
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
        symbol: "x_0^{\\alpha}",
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
              name: "课标 5 种基准幂函数解析与奇偶性",
              latex:
                "y=x, \\quad y=x^2, \\quad y=x^3, \\quad y=\\frac{1}{x}, \\quad y=\\sqrt{x}",
              level: "core",
              prerequisites: [
                "奇函数：y=x, y=x^3, y=1/x (关于原点对称)",
                "偶函数：y=x^2 (关于 y 轴对称)",
                "非奇非偶：y=√x (定义域 [0, +∞))",
              ],
            },
            {
              name: "第一象限图象分界与大小反转定理",
              latex:
                "\\begin{cases} 0 < x < 1: & \\alpha_1 > \\alpha_2 \\implies x^{\\alpha_1} < x^{\\alpha_2} \\\\ x > 1: & \\alpha_1 > \\alpha_2 \\implies x^{\\alpha_1} > x^{\\alpha_2} \\end{cases}",
              level: "core",
              prerequisites: [
                "以定点 (1, 1) 为分界点",
                "x > 1 处指数大者图象在上 (指大图高)",
                "0 < x < 1 处指数大者图象在下",
              ],
            },
            {
              name: "幂函数概念与第一象限通用性质",
              latex: "y = x^{\\alpha} \\quad (x > 0)",
              level: "important",
              prerequisites: [
                "在 (0, +∞) 上均有定义",
                "第一象限图象恒过公共定点 (1, 1)",
                "当 α > 0 时恒过原点 (0, 0)",
              ],
            },
          ]
        : [
            {
              name: "幂函数概念与第一象限通用性质",
              latex: "y = x^{\\alpha} \\quad (x > 0)",
              level: "core",
              prerequisites: [
                "在 (0, +∞) 上均有定义",
                "第一象限图象恒过公共定点 (1, 1)",
                "当 α > 0 时恒过原点 (0, 0)",
              ],
            },
            {
              name: "第一象限图象凹凸与导数特征",
              latex:
                "f'(x) = \\alpha x^{\\alpha - 1} \\implies \\begin{cases} \\alpha > 1: f'(x) \\uparrow (\\text{凹向下/增长加快}) \\\\ 0 < \\alpha < 1: f'(x) \\downarrow (\\text{凸向上/增长变缓}) \\\\ \\alpha < 0: f'(x) < 0 (\\text{严格单调递减}) \\end{cases}",
              level: "core",
              prerequisites: ["x > 0", "α 为常实数"],
            },
            {
              name: "课标 5 种基准幂函数解析与奇偶性",
              latex:
                "y=x, \\quad y=x^2, \\quad y=x^3, \\quad y=\\frac{1}{x}, \\quad y=\\sqrt{x}",
              level: "important",
              prerequisites: [
                "奇函数：y=x, y=x^3, y=1/x",
                "偶函数：y=x^2",
                "非奇非偶：y=√x (定义域 [0, +∞))",
              ],
            },
          ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "第一象限比较大小秒杀通法：作直线 x = 2，观察图象的高低，图象在上方的函数对应幂指数 α 更大（即【指大图高】）。",
        importance: "gaokao",
      },
      {
        text: "区间 [0, 1] 与 (1, +∞) 的大小反转：当 0 < x < 1 时，指数 α 越大函数值越小；当 x > 1 时，指数 α 越大函数值越大。",
        importance: "gaokao",
      },
      {
        text: "原点切线与导数极值：y = √x 在 x → 0+ 时切线竖直不可导；y = x^α (α > 1) 在 x = 0 处切线水平 (y' = 0)。",
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
      mnemonic: "第一象限必过(1,1)，α大于0增且过原点；取x=2高者指数大。",
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
      prerequisites: ["a > 0", "a ≠ 1", "x ∈ ℝ, y > 0"],
    },
    {
      name: "反函数图像对称定理",
      latex:
        "\\small\\text{互为反函数的两个函数图象关于直线 } y = x \\text{ 轴对称}",
      level: "important",
      prerequisites: ["定义域与值域互换"],
    },
    {
      name: "对数换底公式与运算法则",
      latex:
        "\\log_a b = \\frac{\\ln b}{\\ln a}, \\quad \\log_a(MN) = \\log_a M + \\log_a N",
      level: "important",
      prerequisites: ["M > 0", "N > 0"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "高考高频定点：指数函数 y = a^x 必过定点 (0, 1)，渐近线 y = 0；对数函数 y = log_a x 必过定点 (1, 0)，渐近线 x = 0。",
      importance: "gaokao",
    },
    {
      text: "反函数三要素：① 定义域与值域互换；② 图象关于 y = x 对称；③ 只有严格单调函数才存在同单调性的反函数。",
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
