import type { MathPanelData } from "../types";
import { calculateExpLog, calculatePowerFunction } from "@/math/function";
import { MATH_COLORS } from "@/theme";

export function buildFuncExpLogPanel(
  params: Record<string, number>,
  config?: { subExpLog?: string; powerMode?: string; explogMode?: string },
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

    const reasoningSteps: MathPanelData["reasoningSteps"] =
      powerMode === "compare"
        ? [
            {
              step: 1,
              title: "审题转化 · 定位基准模型",
              detail:
                "高考比较大小题型中，面对同底不同指或同指不同底式子，首先识别对应幂函数 $y = x^{\\alpha}$ 模型，将数值比较转化为同一区间内幂函数的函数值比较。",
              latex:
                "f(x) = x^{\\alpha}, \\quad \\alpha \\in \\{1, 2, 3, \\tfrac{1}{2}, -1\\}",
              rubric: "确立所比较式子的自变量 $x$ 所在区间与基准幂函数模型",
            },
            {
              step: 2,
              title: "枢纽分界 · 引入特征线与定点",
              detail:
                "所有幂函数图象在第一象限恒过公共定点 $(1, 1)$。在 $(1, +\\infty)$ 上作垂直参考线 $x = 2$，交各幂函数于点 $(2, 2^{\\alpha})$，利用取值高低直接判定指数大小。",
              latex:
                "x = 2 \\implies \\begin{cases} y = x^3: & y = 8 \\\\ y = x^2: & y = 4 \\\\ y = x: & y = 2 \\\\ y = \\sqrt{x}: & y = \\sqrt{2} \\approx 1.41 \\\\ y = 1/x: & y = 0.5 \\end{cases}",
              rubric: "利用 $x = 2$ 处高低次序确立各幂指数大小关系",
            },
            {
              step: 3,
              title: "定法总结 · 指大图高与区间反转",
              detail:
                "当 $x > 1$ 时，图象在上方的函数幂指数更大（即【指大图高】）；当 $0 < x < 1$ 时，次序完全反转（指数越大图象越在下方）。公共定点 $(1, 1)$ 为旋转枢纽。",
              latex:
                "\\begin{cases} x > 1: & x^3 > x^2 > x > x^{1/2} > x^{-1} \\\\ 0 < x < 1: & x^{-1} > x^{1/2} > x > x^2 > x^3 \\end{cases}",
              rubric: "规范写出高考大小比较最终结论并谨防区间反转",
            },
          ]
        : [
            {
              step: 1,
              title: "符号求导 · 幂函数导数公式",
              detail:
                "依据高中基本初等函数导数运算法则，对幂函数 $f(x) = x^{\\alpha}$ 求导，确立切线斜率函数 $f'(x)$。",
              latex: `f'(x) = \\alpha x^{\\alpha - 1} \\quad (${alpha <= 0 ? "x > 0" : "x \\ge 0"})`,
              rubric: "写出正确的导函数符号表达式与定义域范围",
            },
            {
              step: 2,
              title: "代入探究 · 计算切点斜率与切线",
              detail:
                powerRes.isValidPoint && powerRes.isTangentDifferentiable
                  ? `将探究点 $x_0 = ${x0.toFixed(2)}$ 代入导函数，计算切点切线斜率 $k = f'(x_0)$，并利用点斜式展开为切线方程。`
                  : `当前自变量 $x_0 = ${x0.toFixed(2)}$ 在定义域边界或无定义，导数切线需讨论极限。`,
              latex:
                powerRes.isValidPoint && powerRes.isTangentDifferentiable
                  ? `k = f'(${x0.toFixed(2)}) = ${alpha.toFixed(1)} \\times (${x0.toFixed(2)})^{${(alpha - 1).toFixed(1)}} = ${powerRes.tangentSlopeStr} \\implies ${powerRes.tangentEquationLatex}`
                  : `x \\to 0^+ \\implies f'(x) \\to ${alpha > 0 && alpha < 1 ? "+\\infty \\; (\\text{切线竖直 } x=0)" : "0 \\; (\\text{切线水平 } y=0)"}`,
              rubric: "代入坐标计算斜率数值并列出点斜式方程",
            },
            {
              step: 3,
              title: "几何反思 · 增长速率与凹凸形态",
              detail:
                alpha > 1
                  ? "当 $\\alpha > 1$ 时，导函数 $f'(x)$ 单调递增，切线斜率随 $x$ 增大而变大，图象呈凹弧加速上升；原点处切线水平 $f'(0) = 0$。"
                  : alpha > 0 && alpha < 1
                    ? "当 $0 < \\alpha < 1$ 时，导函数 $f'(x)$ 单调递减，切线斜率随 $x$ 增大而变小，图象呈凸弧减速上升；$x \\to 0^+$ 时斜率趋向无穷（不可导）。"
                    : alpha < 0
                      ? "当 $\\alpha < 0$ 时，导函数 $f'(x) < 0$ 恒成立，函数在 $(0, +\\infty)$ 上严格减函数，以两坐标轴为渐近线。"
                      : "$\\alpha = 0$ 退化为去心常数函数 $y = 1$ ($x \\neq 0$)。",
              latex:
                alpha > 1
                  ? `f'(x) \\uparrow \\implies f(x) \\text{ 凹向上加速增长} \\quad (f'(0) = 0)`
                  : alpha > 0 && alpha < 1
                    ? `f'(x) \\downarrow \\implies f(x) \\text{ 凸向上平缓增长} \\quad (\\lim_{x \\to 0^+} f'(x) = +\\infty)`
                    : alpha < 0
                      ? `\\alpha < 0 \\implies f'(x) < 0 \\text{ 且 } \\lim_{x \\to +\\infty} f(x) = 0`
                      : `y = 1 \\quad (x \\neq 0)`,
              rubric: "结合导函数单调性反思几何曲线的凹凸与渐近走势",
            },
          ];

    const warnings: MathPanelData["warnings"] = [];
    if (powerRes.warningMessage) {
      warnings.push({
        text: powerRes.warningMessage,
        level: "danger",
      });
    }
    if (alpha < 0) {
      warnings.push({
        text: "【高考易错警示】反比例型幂函数在 $(-\\infty, 0)$ 和 $(0, +\\infty)$ 上分别单调递减，绝对不可写成并集 $(-\\infty, 0) \\cup (0, +\\infty)$ 单调递减！",
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      reasoningSteps,
      mnemonic:
        powerMode === "compare"
          ? "5大基准必过(1,1)，α大于0增且过原点；作线x=2高者指数大。"
          : "第一象限必过(1,1)，α大于1凹加速，0到1凸减速，负数双渐近。",
    };
  }

  // 2. 指数与对数模式
  const a = params.baseA ?? 2.0;
  const x0 = params.x0 ?? 1.5;
  const explogMode = config?.explogMode ?? "single";
  const expLogRes = calculateExpLog(a, x0);

  // 高考相切临界常数 a_c = e^{1/e} ≈ 1.444667861
  const AC_CRITICAL = Math.exp(1 / Math.E);

  const quantities: MathPanelData["quantities"] = [];

  if (subType === "logarithmic") {
    quantities.push(
      {
        label: "底数 a",
        symbol: "a",
        value: a.toFixed(1),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "探究真数 x₀",
        symbol: "x_0",
        value: x0.toFixed(2),
        color: MATH_COLORS.function,
      },
      {
        label: "对数函数值 y₀",
        symbol: "\\log_a(x_0)",
        value: expLogRes.isLogDefined ? expLogRes.logVal.toFixed(2) : "无定义",
        color: MATH_COLORS.function,
      },
    );

    if (explogMode === "inverse") {
      const midX = expLogRes.isLogDefined ? (x0 + expLogRes.logVal) / 2 : NaN;
      quantities.push(
        {
          label: "反函数对称点 P'",
          symbol: "P'(y_0, x_0)",
          value: expLogRes.isLogDefined
            ? `(${expLogRes.logVal.toFixed(2)}, ${x0.toFixed(2)})`
            : "无定义",
          color: MATH_COLORS.functionTransformed,
        },
        {
          label: "PP' 中点 M (在 y = x 上)",
          symbol: "M",
          value: Number.isFinite(midX)
            ? `(${midX.toFixed(2)}, ${midX.toFixed(2)})`
            : "无定义",
          color: MATH_COLORS.axis,
          highlight: "positive",
        },
        {
          label: "PP' 垂直对称轴判定",
          symbol: "k_{PP'} \\cdot 1",
          value: "-1 (垂直成立)",
          highlight: "positive",
        },
        {
          label: "反函数指数验证",
          symbol: "a^{y_0}",
          value: expLogRes.isLogDefined
            ? `${a.toFixed(1)}^{${expLogRes.logVal.toFixed(2)}} = ${x0.toFixed(2)}`
            : "无定义",
          color: MATH_COLORS.functionTransformed,
        },
        {
          label: "相切临界底数 a_c",
          symbol: "e^{1/e}",
          value: `${AC_CRITICAL.toFixed(4)} (切点 (e, e))`,
        },
        {
          label: "两曲线交点情况",
          value:
            a > 0 && a < 1
              ? "有 1 个交点 (必在 y = x 上)"
              : Math.abs(a - AC_CRITICAL) < 0.05
                ? "相切于 (e, e) · 唯一公切线 y = x"
                : a < AC_CRITICAL
                  ? "有 2 个交点 (均在 y = x 上)"
                  : "无公共点 (指数在对数上方)",
          highlight: Math.abs(a - AC_CRITICAL) < 0.05 ? "extreme" : "positive",
        },
      );
    } else {
      quantities.push(
        {
          label: "动点切线斜率",
          symbol: "f'(x_0)",
          value: expLogRes.logTangentSlopeStr,
          highlight: expLogRes.isLogDefined ? "positive" : undefined,
        },
        {
          label: "定点 (1,0) 切线斜率",
          symbol: "f'(1)",
          value: expLogRes.logFixedPointSlopeStr,
        },
        {
          label: "符号与分界判定",
          value: expLogRes.logSignDescription,
          highlight:
            expLogRes.logSignState === "positive"
              ? "positive"
              : expLogRes.logSignState === "negative"
                ? "extreme"
                : undefined,
        },
        {
          label: "单调与凹凸性",
          value:
            a > 1
              ? "严格单调递增 · 上凸减速增长"
              : a > 0 && a < 1
                ? "严格单调递减 · 上凸加速衰减"
                : "退化/无定义",
          highlight: a > 1 ? "positive" : "extreme",
        },
      );
    }
  } else {
    quantities.push(
      {
        label: "底数 a",
        symbol: "a",
        value: a.toFixed(1),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "自变量 x₀",
        symbol: "x_0",
        value: x0.toFixed(2),
        color: MATH_COLORS.function,
      },
      {
        label: "指数函数值 y₀",
        symbol: "a^{x_0}",
        value: expLogRes.isValidBase ? expLogRes.expVal.toFixed(2) : "无定义",
        color: MATH_COLORS.function,
      },
    );

    if (explogMode === "inverse") {
      const midX = expLogRes.isValidBase ? (x0 + expLogRes.expVal) / 2 : NaN;
      quantities.push(
        {
          label: "反函数对称点 P'",
          symbol: "P'(y_0, x_0)",
          value: expLogRes.isValidBase
            ? `(${expLogRes.expVal.toFixed(2)}, ${x0.toFixed(2)})`
            : "无定义",
          color: MATH_COLORS.functionTransformed,
        },
        {
          label: "PP' 中点 M (在 y = x 上)",
          symbol: "M",
          value: Number.isFinite(midX)
            ? `(${midX.toFixed(2)}, ${midX.toFixed(2)})`
            : "无定义",
          color: MATH_COLORS.axis,
          highlight: "positive",
        },
        {
          label: "反函数对数验证",
          symbol: "\\log_a(y_0)",
          value: expLogRes.isValidBase
            ? `\\log_{${a.toFixed(1)}}(${expLogRes.expVal.toFixed(2)}) = ${x0.toFixed(2)}`
            : "无定义",
          color: MATH_COLORS.functionTransformed,
        },
        {
          label: "两曲线交点情况",
          value:
            a > 0 && a < 1
              ? "有 1 个交点 (在 y = x 上)"
              : a < AC_CRITICAL
                ? "有 2 个交点"
                : Math.abs(a - AC_CRITICAL) < 0.05
                  ? "相切于 (e, e)"
                  : "无公共点",
        },
      );
    } else {
      quantities.push(
        {
          label: "动点切线斜率",
          symbol: "f'(x_0)",
          value: expLogRes.expTangentSlopeStr,
          highlight: expLogRes.isValidBase ? "positive" : undefined,
        },
        {
          label: "动点切线方程",
          value: expLogRes.expTangentEquationLatex ?? "无定义",
        },
        {
          label: "定点 (0,1) 切线斜率",
          symbol: "f'(0)",
          value: expLogRes.expFixedPointSlopeStr,
        },
        {
          label: "单调与凹凸性",
          value:
            a > 1
              ? "严格单调递增 · 下凹加速增长 (爆炸式)"
              : a > 0 && a < 1
                ? "严格单调递减 · 下凹衰减 (趋于0)"
                : "退化/无定义",
          highlight: a > 1 ? "positive" : "extreme",
        },
      );
    }
  }

  const theorems: MathPanelData["theorems"] =
    subType === "logarithmic"
      ? [
          {
            name: "对数函数定义与图象性质",
            latex: "y = \\log_a x \\quad (a > 0, a \\neq 1, x > 0)",
            level: "core",
            prerequisites: [
              "定义域 $(0, +\\infty)$，值域 $\\mathbb{R}$，恒过定点 $(1, 0)$",
              "当 $a > 1$ 时在 $(0, +\\infty)$ 上严格递增；当 $0 < a < 1$ 时严格递减",
              "以 $y$ 轴 ($x = 0$) 为竖直渐近线",
            ],
          },
          {
            name: "指数与对数反函数对称定理",
            latex:
              "y = \\log_a x \\iff x = a^y \\quad (\\text{关于 } y = x \\text{ 轴对称})",
            level: "core",
            prerequisites: [
              "对数函数的定义域 $(0, +\\infty)$ 对应指数函数的值域",
              "对数函数的值域 $\\mathbb{R}$ 对应指数函数的定义域",
              "动点 $P(x_0, \\log_a x_0)$ 与对称点 $P'(\\log_a x_0, x_0)$ 的连线被 $y = x$ 垂直平分",
            ],
          },
          {
            name: "对数运算法则与换底公式",
            latex:
              "\\log_a(MN) = \\log_a M + \\log_a N, \\quad \\log_a b = \\frac{\\ln b}{\\ln a}",
            level: "important",
            prerequisites: [
              "$M > 0, N > 0$",
              "$a > 0, a \\neq 1$",
              "常用对数 $\\lg x = \\log_{10} x$，自然对数 $\\ln x = \\log_e x$",
            ],
          },
          {
            name: "高考基准切线放缩不等式",
            latex: "\\ln x \\le x - 1 \\quad (x > 0)",
            level: "important",
            prerequisites: [
              "当且仅当 $x = 1$ 时等号成立",
              "几何意义：曲线 $y = \\ln x$ 位于其在点 $(1, 0)$ 处切线 $y = x - 1$ 下方",
              "高考衍生放缩：$\\ln x \\le \\frac{x}{e}$ (在 $x = e$ 处相切)",
            ],
          },
        ]
      : [
          {
            name: "指数与对数互为反函数关系",
            latex: "y = a^x \\iff x = \\log_a y \\quad (a > 0, a \\neq 1)",
            level: "core",
            prerequisites: [
              "$a > 0, a \\neq 1$",
              "指数函数定义域 $\\mathbb{R}$，值域 $(0, +\\infty)$，恒过定点 $(0, 1)$",
              "图象关于直线 $y = x$ 轴对称，定点 $(0, 1)$ 与 $(1, 0)$ 互为对称镜像",
            ],
          },
          {
            name: "反函数公切线与相切临界定理",
            latex:
              "a = e^{1/e} \\approx 1.4447 \\iff y = a^x \\text{ 与 } y = \\log_a x \\text{ 相切于 } (e, e)",
            level: "core",
            prerequisites: [
              "当 $1 < a < e^{1/e}$ 时，两曲线在直线 $y = x$ 上有 2 个交点",
              "当 $a = e^{1/e}$ 时，两曲线相切于唯一公共点 $(e, e)$，公切线为 $y = x$",
              "当 $a > e^{1/e}$ 时，两曲线无交点，指数曲线恒在对数曲线上方",
            ],
          },
          {
            name: "高考双基准指数切线放缩不等式",
            latex:
              "e^x \\ge x + 1 \\quad \\text{且} \\quad e^x \\ge ex \\quad (x \\in \\mathbb{R})",
            level: "important",
            prerequisites: [
              "$e^x \\ge x + 1$：在点 $(0, 1)$ 处与切线相切，高考常用于局部极值放缩",
              "$e^x \\ge ex$：在点 $(1, e)$ 处与过原点切线相切，常用于全局下界估计",
              "反函数对偶形式：$\\ln x \\le x - 1$ 与 $\\ln x \\le \\frac{x}{e}$",
            ],
          },
          {
            name: "指数函数单调与渐近极限性质",
            latex:
              "\\lim_{x \\to -\\infty} a^x = 0 \\;(a > 1), \\quad \\lim_{x \\to +\\infty} a^x = 0 \\;(0 < a < 1)",
            level: "important",
            prerequisites: [
              "$x$ 轴 ($y = 0$) 为水平渐近线，与对数垂直渐近线 $x = 0$ 轴对称",
              "$a > 1$ 时为“爆炸式”加速增长 ($f''(x) > 0$ 下凹)",
            ],
          },
        ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] =
    subType === "logarithmic"
      ? [
          {
            text: "【同大为正，异大为负】对数值符号秒杀：当底数 $a$ 与真数 $x$ 同时大于 1 或同时在 $(0, 1)$ 时，$\\log_a x > 0$；若一个大于 1、另一个在 $(0, 1)$，则 $\\log_a x < 0$。引入中间媒介 0 和 1 即可快速比较大小。",
            importance: "gaokao",
          },
          {
            text: "【反函数三要素与公切线】① 定义域与值域互换；② 图象关于 $y = x$ 轴对称；③ 当 $a > 1$ 且 $y = \\log_a x$ 与 $y = a^x$ 有交点时，交点必在直线 $y = x$ 上（相切临界为 $a = e^{1/e} \\approx 1.445$）。",
            importance: "gaokao",
          },
          {
            text: "【指对同构大题破题思维】新高考导数压轴题常利用指对同构构造单调函数：如将 $x e^x = \\ln x + x$ 或 $a e^a = b + \\ln b$ 转化为 $f(t) = t e^t$ 或 $g(t) = t + \\ln t$ 的单调性求解。",
            importance: "gaokao",
          },
        ]
      : [
          {
            text: "【指对同构大题破题思维】新高考导数压轴题第一大招：利用指数对数互逆性质，将含 $e^x$ 与 $\\ln x$ 的复杂方程同构化。例如 $x e^x = \\ln x + x \\iff x e^x = \\ln(x e^x)$，设 $t = x e^x$ 转化为单一函数单调性破题。",
            importance: "gaokao",
          },
          {
            text: "【高考双基准切线放缩】基准一 $e^x \\ge x + 1$（切点 $(0, 1)$）与基准二 $e^x \\ge ex$（切点 $(1, e)$），结合对偶式 $\\ln x \\le x - 1$ 与 $\\ln x \\le \\frac{x}{e}$，是证明高考导数不等式与求参数范围的必背工具。",
            importance: "gaokao",
          },
          {
            text: "【反函数公切线与交点临界】指数与对数曲线关于 $y = x$ 对称：当 $a = e^{1/e} \\approx 1.445$ 时相切于 $(e, e)$；$1 < a < e^{1/e}$ 时有 2 个交点；$a > e^{1/e}$ 时无交点。新高考常以交点个数作为含参分类讨论压轴设问。",
            importance: "gaokao",
          },
          {
            text: "【反函数三要素与对称定点】① 定义域与值域互换 ($D \\leftrightarrow R$)；② 图象关于 $y = x$ 轴对称；③ 定点 $(0, 1) \\leftrightarrow (1, 0)$ 对称；④ 渐近线 $y = 0 \\leftrightarrow x = 0$ 对称。",
            importance: "gaokao",
          },
        ];

  // 3. 构建规范的高考推导链 reasoningSteps
  let reasoningSteps: MathPanelData["reasoningSteps"];

  if (subType === "logarithmic") {
    if (explogMode === "inverse") {
      const y0Val = expLogRes.isLogDefined ? expLogRes.logVal : 0;
      const midX = (x0 + y0Val) / 2;
      reasoningSteps = [
        {
          step: 1,
          title: "反解变元 · 反函数求解三步法则",
          detail:
            "设原函数为 $y = \\log_a x$（$a > 0, a \\neq 1, x > 0$），将方程看作关于 $x$ 的方程解出 $x = a^y$；交换自变量与因变量符号得到反函数解析式 $y = a^x$。原函数定义域 $(0, +\\infty)$ 与值域 $\\mathbb{R}$ 分别对调为反函数的值域与定义域。",
          latex:
            "y = \\log_a x \\iff x = a^y \\xrightarrow{x \\leftrightarrow y} y = a^x \\quad (D_{\\log} = R_{\\exp} = (0, +\\infty))",
          rubric: "规范呈现反解自变量、互换变元符号与定义域值域互易过程",
        },
        {
          step: 2,
          title: "几何充要 · 垂直平分对称严密证明",
          detail: `设探究点 $P(${x0.toFixed(2)}, ${y0Val.toFixed(2)})$ 在对数曲线上，其关于直线 $y = x$ 的对称点为 $P'(${y0Val.toFixed(2)}, ${x0.toFixed(2)})$。连线斜率 $k_{PP'} = \\frac{${x0.toFixed(2)} - ${y0Val.toFixed(2)}}{${y0Val.toFixed(2)} - ${x0.toFixed(2)}} = -1$，满足 $k_{PP'} \\cdot 1 = -1 \\implies PP' \\perp (y = x)$；且线段 $PP'$ 的中点 $M(${midX.toFixed(2)}, ${midX.toFixed(2)})$ 纵横坐标严格相等，恒在对称轴 $y = x$ 上，充要证实直线 $y = x$ 是 $PP'$ 的垂直平分线。`,
          latex:
            "\\begin{cases} k_{PP'} = -1 \\implies k_{PP'} \\cdot k_{y=x} = -1 \\implies PP' \\perp (y=x) \\\\ M\\left(\\frac{x_0+y_0}{2}, \\frac{x_0+y_0}{2}\\right) \\in \\{ (x, y) \\mid y = x \\} \\end{cases}",
          rubric: "从斜率乘积为 $-1$ 与中点落在对称轴上两方面充要证明垂直平分",
        },
        {
          step: 3,
          title: "高考压轴 · 公切相切与交点临界判定",
          detail:
            "探究 $y = a^x$ 与 $y = \\log_a x$ 的交点分布。由对称性知，若两曲线相切，公切线必为对称轴 $y = x$，满足切点切线方程联立 $\\begin{cases} a^x = x \\\\ a^x \\ln a = 1 \\end{cases}$。代入得 $x \\ln a = 1 \\implies a^x = e \\implies x = e$。切点为 $(e, e)$，对应临界底数 $a_c = e^{1/e} \\approx 1.4447$。当 $1 < a < e^{1/e}$ 时在 $y = x$ 上有 2 个交点；当 $a > e^{1/e}$ 时无公共点。",
          latex:
            "\\begin{cases} a^x = x \\\\ (a^x)' = a^x \\ln a = 1 \\end{cases} \\implies x = e, \\quad a_c = e^{1/e} \\approx 1.445 \\quad (\\text{相切于 } (e, e))",
          rubric:
            "联立曲线与对称轴相切充要方程，推导新高考核心相切常数 $e^{1/e}$",
        },
      ];
    } else {
      const y0Val = expLogRes.isLogDefined ? expLogRes.logVal : 0;
      const kStr = expLogRes.logTangentSlopeStr;
      reasoningSteps = [
        {
          step: 1,
          title: "基准模型 · 对数函数定义与必过定点",
          detail: `对数函数 $y = \\log_a x$（当前底数 $a = ${a.toFixed(1)}$）定义域为 $(0, +\\infty)$，值域为 $\\mathbb{R}$。因为对任意底数恒有 $\\log_a 1 = 0$，故函数图象恒过定点 $(1, 0)$。$y$ 轴（直线 $x = 0$）为曲线的垂直渐近线。`,
          latex: `f(1) = \\log_{${a.toFixed(1)}} 1 = 0 \\implies \\text{必过定点 } (1, 0), \\quad \\lim_{x \\to 0^+} \\log_{${a.toFixed(1)}} x = ${a > 1 ? "-\\infty" : "+\\infty"}`,
          rubric: "规范交代定义域、值域、定点坐标与垂直渐近线",
        },
        {
          step: 2,
          title: "导数切线 · 切点斜率与点斜式展开",
          detail: expLogRes.isLogDefined
            ? `对数函数导函数为 $f'(x) = \\frac{1}{x \\ln a}$。将探究点 $x_0 = ${x0.toFixed(2)}$ 代入，求得切点 $P(${x0.toFixed(2)}, ${y0Val.toFixed(2)})$ 处的切线斜率 $k = ${kStr}$，由点斜式展开得切线方程。`
            : "当前探究点超出定义域范围，无定义导数切线。",
          latex: expLogRes.isLogDefined
            ? `f'(${x0.toFixed(2)}) = \\frac{1}{${x0.toFixed(2)} \\ln(${a.toFixed(1)})} = ${kStr} \\implies y - ${y0Val.toFixed(2)} = ${kStr}(x - ${x0.toFixed(2)})`
            : "x_0 \\le 0 \\implies \\text{无导数}",
          rubric: "运用对数导数公式准确代入计算斜率并写出切线方程",
        },
        {
          step: 3,
          title: "高考放缩 · 基准切线与不等式链",
          detail:
            "当底数取自然对数底 $e$ 时，曲线 $y = \\ln x$ 在点 $(1, 0)$ 处的切线为 $y = x - 1$。由对数函数上凸性可知曲线恒在切线下方，导出高考第一核心放缩不等式 $\\ln x \\le x - 1$（$x > 0$，当且仅当 $x = 1$ 时取等号），其过原点切线放缩为 $\\ln x \\le \\frac{x}{e}$。",
          latex:
            "\\ln x \\le x - 1 \\quad (x > 0, \\text{等号成立当且仅当 } x = 1)",
          rubric: "结合凸函数几何切线给出高考切线放缩不等式与等号条件",
        },
      ];
    }
  } else {
    // 指数函数
    if (explogMode === "inverse") {
      const expVal = expLogRes.isValidBase ? expLogRes.expVal : 0;
      const midX = (x0 + expVal) / 2;
      reasoningSteps = [
        {
          step: 1,
          title: "反函数定义 · 互逆映射与变元对换",
          detail:
            "指数函数 $y = a^x$（$a > 0, a \\neq 1$）为单调映射，反解得 $x = \\log_a y$；自变量因变量互换得反函数 $y = \\log_a x$。指数函数定义域 $\\mathbb{R}$ 成为对数函数值域，值域 $(0, +\\infty)$ 成为对数函数定义域。",
          latex:
            "y = a^x \\iff x = \\log_a y \\xrightarrow{x \\leftrightarrow y} y = \\log_a x \\quad (D_{\\exp} = R_{\\log} = \\mathbb{R})",
          rubric: "规范呈现反解与定义域值域互换",
        },
        {
          step: 2,
          title: "垂直平分 · 对称中点与斜率判定",
          detail: `动点 $P(${x0.toFixed(2)}, ${expVal.toFixed(2)})$ 与对称点 $P'(${expVal.toFixed(2)}, ${x0.toFixed(2)})$ 连线斜率为 $-1$，垂直于直线 $y = x$；中点 $M(${midX.toFixed(2)}, ${midX.toFixed(2)})$ 落在直线 $y = x$ 上，证明图象关于 $y = x$ 轴对称。`,
          latex:
            "k_{PP'} = -1 \\implies PP' \\perp (y = x), \\quad M \\in \\{ (x, y) \\mid y = x \\}",
          rubric: "证明两点连线被对称轴垂直平分",
        },
        {
          step: 3,
          title: "相切临界 · 公切线与切点坐标",
          detail:
            "两曲线相切时公切线必为 $y = x$，由联立方程组得相切点为 $(e, e)$，对应相切临界底数 $a = e^{1/e} \\approx 1.4447$。",
          latex:
            "a_c = e^{1/e} \\approx 1.445, \\quad \\text{公切线 } y = x, \\quad \\text{切点 } (e, e)",
          rubric: "阐明相切临界与交点个数讨论准则",
        },
      ];
    } else {
      const expVal = expLogRes.isValidBase ? expLogRes.expVal : 0;
      const kStr = expLogRes.expTangentSlopeStr;
      reasoningSteps = [
        {
          step: 1,
          title: "基准模型 · 指数函数定义与必过定点",
          detail: `指数函数 $y = a^x$（底数 $a = ${a.toFixed(1)}$）定义域为 $\\mathbb{R}$，值域为 $(0, +\\infty)$，恒过定点 $(0, 1)$。$x$ 轴（直线 $y = 0$）为水平渐近线。`,
          latex: `f(0) = ${a.toFixed(1)}^0 = 1 \\implies \\text{必过定点 } (0, 1), \\quad \\lim_{x \\to -\\infty} ${a.toFixed(1)}^x = 0`,
          rubric: "写明指数函数性质与渐近线",
        },
        {
          step: 2,
          title: "导数切线 · 切点斜率与点斜式展开",
          detail: `导函数为 $f'(x) = a^x \\ln a$。在探究点 $x_0 = ${x0.toFixed(2)}$ 处，斜率 $k = ${kStr}$，点斜式为 $y - ${expVal.toFixed(2)} = ${kStr}(x - ${x0.toFixed(2)})$。`,
          latex: `f'(${x0.toFixed(2)}) = ${a.toFixed(1)}^{${x0.toFixed(2)}} \\ln(${a.toFixed(1)}) = ${kStr} \\implies y - ${expVal.toFixed(2)} = ${kStr}(x - ${x0.toFixed(2)})`,
          rubric: "代入求导公式计算切线斜率",
        },
        {
          step: 3,
          title: "高考放缩 · 双基准指数切线不等式",
          detail:
            "当底数取自然底数 $e$ 时，在 $(0, 1)$ 处切线为 $y = x + 1$；在 $(1, e)$ 处过原点切线为 $y = ex$。由下凹性导出 $e^x \\ge x + 1$ 与 $e^x \\ge ex$ 两大核心放缩式。",
          latex:
            "e^x \\ge x + 1 \\quad \\text{且} \\quad e^x \\ge ex \\quad (x \\in \\mathbb{R})",
          rubric: "给出指数双切线放缩不等式",
        },
      ];
    }
  }

  const warnings: MathPanelData["warnings"] = [];
  if (expLogRes.baseWarning) {
    warnings.push({
      text: expLogRes.baseWarning,
      level: "danger",
    });
  }
  if (subType === "logarithmic" && x0 <= 0) {
    warnings.push({
      text: "真数必须大于 0！$x \\le 0$ 时对数函数无意义。",
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
      subType === "logarithmic"
        ? explogMode === "inverse"
          ? "反函数关于y=x垂直平分，中点落在直线上；a为e^(1/e)两线切于(e,e)。"
          : "对过(1,0)轴渐近，同大为正异大负；单增单减看底数，切线ln放缩牢记。"
        : explogMode === "inverse"
          ? "指过(0,1)对过(1,0)，y=x对称反函数；公切临界e^(1/e)，垂直平分中点连。"
          : "指过(0,1)对过(1,0)，双切放缩同构破；a为e^(1/e)公切切，单调凹凸看底数。",
  };
}
