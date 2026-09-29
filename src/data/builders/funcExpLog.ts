import type { MathPanelData } from "../types";
import { calculateExpLog, calculatePowerFunction } from "@/math/function";
import { MATH_COLORS } from "@/theme";

export function buildFuncExpLogPanel(
  params: Record<string, number>,
  config?: {
    subExpLog?: string;
    funcType?: string;
    powerMode?: string;
    explogMode?: string;
  },
): MathPanelData {
  const subType = config?.subExpLog ?? config?.funcType ?? "exponential";

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

    // 必修一范围内讨论幂函数，不得引入导数工具（幂函数位于必修一，导数属选择性必修第二册）。
    // 因此"增长快慢"一律用图象语言表达：与基准直线 y = x 的高低比较 + 图象弯曲方向。
    const compareWithLine = !powerRes.isValidPoint
      ? "—"
      : Math.abs(powerRes.yVal - x0) < 1e-9
        ? `$f(x_0) = x_0$`
        : powerRes.yVal > x0
          ? `$f(x_0) > x_0$`
          : `$f(x_0) < x_0$`;

    const shapeDesc =
      alpha > 1
        ? "向上弯曲 · 增长越来越快"
        : alpha > 0
          ? "向下弯曲 · 增长越来越慢"
          : alpha < 0
            ? "向下弯曲 · 递减越来越缓"
            : "水平直线 (x ≠ 0)";

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
        label: "与基准线 y = x 的高低",
        value: compareWithLine,
        highlight:
          powerRes.isValidPoint && Math.abs(powerRes.yVal - x0) > 1e-9
            ? powerRes.yVal > x0
              ? "positive"
              : "extreme"
            : undefined,
      },
      {
        label: "图象弯曲方向",
        value: shapeDesc,
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
              name: "幂函数第一象限图象形态与增长快慢",
              latex:
                "y = x^{\\alpha} \\; (x > 0) \\implies \\begin{cases} \\alpha > 1: & \\text{图象向上弯曲，越增越快} \\\\ 0 < \\alpha < 1: & \\text{图象向下弯曲，越增越慢} \\\\ \\alpha < 0: & \\text{图象递减且趋缓} \\end{cases}",
              level: "core",
              prerequisites: [
                "$\\alpha > 1$ 时图象向上弯曲、增长越来越快：$x > 1$ 时图象在基准线 $y = x$ 上方",
                "$0 < \\alpha < 1$ 时图象向下弯曲、增长越来越慢：$x > 1$ 时图象在基准线 $y = x$ 下方",
                "$\\alpha < 0$ 时在 $(0, +\\infty)$ 上严格单调递减，且与两坐标轴无限接近",
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
              name: "原点附近的图象趋势与渐近特征",
              latex:
                "\\text{当 } x \\text{ 从正方向趋近 } 0 \\text{ 时}: \\; x^{\\alpha} \\begin{cases} \\text{趋于 } 0 & (\\alpha > 0) \\\\ \\text{无限增大} & (\\alpha < 0) \\end{cases}",
              level: "important",
              prerequisites: [
                "$\\alpha < 0$ 时，$x$ 轴 ($y=0$) 与 $y$ 轴 ($x=0$) 均为图象的渐近线",
                "$0 < \\alpha < 1$ 时，图象在原点附近陡峭上升、紧贴 $y$ 轴",
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
              text: "与基准线 $y = x$ 的高低比较：在 $(1, +\\infty)$ 上，$\\alpha > 1$ 时 $x^{\\alpha} > x$，$0 < \\alpha < 1$ 时 $x^{\\alpha} < x$；在 $(0, 1)$ 上高低次序完全反转。",
              importance: "gaokao",
            },
            {
              text: "图象形态判读：$\\alpha > 1$ 时图象向上弯曲、增长速度越来越快；$0 < \\alpha < 1$ 时图象向下弯曲、增长速度越来越慢，可用基准线 $y = x$ 作直观对照。",
              importance: "gaokao",
            },
            {
              text: "负指数与双渐近线：$\\alpha < 0$ 时定义域不含原点，图象与两坐标轴无限接近，在 $(0, +\\infty)$ 上严格单调递减。",
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
              title: "作基准线 · 锁定比较对象",
              detail:
                "在同一坐标系中作出幂函数 $f(x) = x^{\\alpha}$ 与基准直线 $y = x$ 的图象，把「研究幂函数」转化为「比较两条图象的高低与增长快慢」。",
              latex: `f(x) = x^{${alpha.toFixed(1).replace(/\.0$/, "")}} \\quad \\text{与} \\quad y = x`,
              rubric:
                "写出幂函数解析式，并在同一坐标系中作出它与基准线 $y=x$ 的图象",
            },
            {
              step: 2,
              title: "取点比较 · 判定高低位置",
              detail: powerRes.isValidPoint
                ? `取探究点 $x_0 = ${x0.toFixed(2)}$，比较 $f(x_0)$ 与 $x_0$ 的大小，判定图象在基准线 $y = x$ 的上方还是下方。`
                : `当前自变量 $x_0 = ${x0.toFixed(2)}$ 不在定义域内，请把探究点调回定义域内再作比较。`,
              latex: powerRes.isValidPoint
                ? `${compareWithLine.replace(/\$/g, "")}`
                : `x_0 = ${x0.toFixed(2)} \\notin D`,
              rubric:
                "代入 x₀ 比较函数值与 x₀ 的大小，并说明图象相对基准线的高低",
            },
            {
              step: 3,
              title: "归纳形态 · 增长快慢与渐近走势",
              detail:
                alpha > 1
                  ? "当 $\\alpha > 1$ 时，图象向上弯曲、函数值增长越来越快：在 $(1, +\\infty)$ 上高于 $y = x$，在 $(0, 1)$ 上低于 $y = x$。"
                  : alpha > 0 && alpha < 1
                    ? "当 $0 < \\alpha < 1$ 时，图象向下弯曲、函数值增长越来越慢：在 $(1, +\\infty)$ 上低于 $y = x$，在原点附近陡峭上升并紧贴 $y$ 轴。"
                    : alpha < 0
                      ? "当 $\\alpha < 0$ 时，函数在 $(0, +\\infty)$ 上严格单调递减，图象向下弯曲、递减越来越缓，并与两坐标轴无限接近。"
                      : "$\\alpha = 0$ 时函数退化为去心常数函数 $y = 1$（$x \\neq 0$）。",
              latex:
                alpha > 1
                  ? `x > 1 \\implies x^{\\alpha} > x \\quad ; \\quad 0 < x < 1 \\implies x^{\\alpha} < x`
                  : alpha > 0 && alpha < 1
                    ? `x > 1 \\implies x^{\\alpha} < x \\quad ; \\quad 0 < x < 1 \\implies x^{\\alpha} > x`
                    : alpha < 0
                      ? `\\alpha < 0 \\implies f(x) \\text{ 在 } (0, +\\infty) \\text{ 上递减、与两坐标轴无限接近}`
                      : `y = 1 \\quad (x \\neq 0)`,
              rubric:
                "归纳幂指数取不同范围时图象的弯曲方向、相对基准线的高低与渐近走势",
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
          : "第一象限必过(1,1)，α大于1向上弯增速快，0到1向下弯增速慢，负数双渐近。",
    };
  }

  // 2. 指数与对数模式
  const a = params.baseA ?? 2.0;
  const x0 = params.x0 ?? 1.5;
  const explogMode = config?.explogMode ?? "single";
  const expLogRes = calculateExpLog(a, x0);

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
      );
    } else {
      quantities.push(
        {
          label: "恒过定点检验",
          symbol: "f(1)",
          value: "0 (对数图象恒过定点 (1, 0))",
          highlight: "positive",
        },
        {
          label: "基准特征点",
          symbol: "f(a)",
          value: `1 (对应点 (${a.toFixed(1)}, 1))`,
        },
        {
          label: "垂直渐近线",
          value: "x 轴垂线 x = 0 (y 轴)",
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
          label: "单调与图象形态",
          value:
            a > 1
              ? "严格单调递增 · 图象向下弯曲（越增越慢）"
              : a > 0 && a < 1
                ? "严格单调递减 · 图象向上弯曲（越减越慢）"
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
          label: "PP' 垂直对称轴判定",
          symbol: "k_{PP'} \\cdot 1",
          value: "-1 (垂直成立)",
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
      );
    } else {
      quantities.push(
        {
          label: "恒过定点检验",
          symbol: "f(0)",
          value: "1 (指数图象恒过定点 (0, 1))",
          highlight: "positive",
        },
        {
          label: "基准特征点",
          symbol: "f(1)",
          value: `${a.toFixed(1)} (对应点 (1, ${a.toFixed(1)}))`,
        },
        {
          label: "水平渐近线",
          value: "x 轴水平线 y = 0",
        },
        {
          label: "单调与图象形态",
          value:
            a > 1
              ? "严格单调递增 · 图象向上弯曲（越增越快）"
              : a > 0 && a < 1
                ? "严格单调递减 · 图象向上弯曲（越减越慢）"
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
            name: "初等模型增长速度比较定理",
            latex:
              "\\log_a x < x < a^x \\quad (a > 1, \\text{当 } x \\text{ 充分大时})",
            level: "important",
            prerequisites: [
              "在区间 $(0, +\\infty)$ 上，对数增长远慢于线性增长与指数增长",
              "底数 $a > 1$ 时，对数曲线随自变量增大越来越平缓",
              "新高考函数建模应用题中常用于描述缓慢增长与饱和增长过程",
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
            name: "指数爆炸与增长模型比较定理",
            latex:
              "a^x > x^k > \\log_a x \\quad (a > 1, k > 0, \\text{当 } x \\text{ 充分大时})",
            level: "core",
            prerequisites: [
              "指数增长速度（指数爆炸）最终远超任意一次多项式增长",
              "应用建模：复利计息、细胞分裂与放射性衰变核心数学模型",
              "比较大小高频模型：指数底数判定与中间媒介 0、1 联立",
            ],
          },
          {
            name: "指数幂运算法则与根式化简定理",
            latex:
              "a^r a^s = a^{r+s}, \\quad (a^r)^s = a^{rs}, \\quad (ab)^r = a^r b^r",
            level: "important",
            prerequisites: [
              "实数指数幂运算性质 ($a > 0, b > 0, r, s \\in \\mathbb{R}$)",
              "负指数与分数指数转化：$a^{-p} = \\frac{1}{a^p}, \\; a^{m/n} = \\sqrt[n]{a^m}$",
              "利用底数相同与指数单调性比较数的大小",
            ],
          },
          {
            name: "指数函数的单调性与图象渐近特征",
            latex:
              "a > 1: \\; \\text{当 } x \\to -\\infty \\text{ 时 } a^x \\to 0 ; \\quad 0 < a < 1: \\; \\text{当 } x \\to +\\infty \\text{ 时 } a^x \\to 0",
            level: "important",
            prerequisites: [
              "$x$ 轴 ($y = 0$) 为水平渐近线，与对数函数竖直渐近线 $x = 0$ 关于直线 $y = x$ 对称",
              "$a > 1$ 时图象向上弯曲，增长速度越来越快",
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
            text: "【反函数三要素与对称映射】① 定义域与值域互换 ($D_{\\log} = R_{\\exp}$)；② 图象关于 $y = x$ 轴对称；③ 定点 $(1, 0) \\leftrightarrow (0, 1)$ 互为对称镜像；④ 竖直渐近线 $x = 0$ 与水平渐近线 $y = 0$ 对称。",
            importance: "gaokao",
          },
          {
            text: "【对数模型在实际情景中的应用】高中数学建模中，声强级（分贝）、地震里氏震级与溶液酸碱度（pH）均基于常用对数定义：将大跨度物理量转化为线性刻度。",
            importance: "gaokao",
          },
        ]
      : [
          {
            text: "【指数增长与实际生活模型】人口增长、复利计息与放射性元素半衰期模型中，函数 $N(t) = N_0 a^t$ 呈现爆炸式激增或快速衰减，在高考实际应用题中常考查对数转化求解。",
            importance: "gaokao",
          },
          {
            text: "【指数比较大小四步破题法】① 同底数比指数（利用单调性）；② 同指数比底数（利用幂函数单调性）；③ 异底异指找中间媒介（如 0、1 或特殊值）；④ 构图利用图象高低判断。",
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
          title: "性质对偶 · 定点渐近线与单调性互映",
          detail:
            "由互为反函数的图象关于直线 $y = x$ 轴对称可知：指数函数定点 $(0, 1)$ 与对数函数定点 $(1, 0)$ 互为镜像；指数函数的水平渐近线 $y = 0$ 镜像为对数函数的竖直渐近线 $x = 0$；且两者在各定义域上的单调增减性严格保持同向。",
          latex:
            "(0, 1) \\xleftrightarrow{y=x} (1, 0), \\quad (y = 0) \\xleftrightarrow{y=x} (x = 0)",
          rubric: "准确阐释反函数对称映射下定点、渐近线与单调性的对应规律",
        },
      ];
    } else {
      reasoningSteps = [
        {
          step: 1,
          title: "基准模型 · 对数函数定义与必过定点",
          detail: `对数函数 $y = \\log_a x$（当前底数 $a = ${a.toFixed(1)}$）定义域为 $(0, +\\infty)$，值域为 $\\mathbb{R}$。因为对任意底数恒有 $\\log_a 1 = 0$，故函数图象恒过定点 $(1, 0)$。$y$ 轴（直线 $x = 0$）为曲线的垂直渐近线。`,
          latex: `f(1) = \\log_{${a.toFixed(1)}} 1 = 0 \\implies \\text{必过定点 } (1, 0) \\text{，且图象以 } y \\text{ 轴为竖直渐近线}`,
          rubric: "规范交代定义域、值域、定点坐标与垂直渐近线",
        },
        {
          step: 2,
          title: "单调判号 · 底数与真数同大异大律",
          detail: `对数函数单调性由底数 $a$ 严格决定：当底数 $a = ${a.toFixed(1)} > 1$ 时，在 $(0, +\\infty)$ 上严格单调递增；当 $0 < a < 1$ 时，在 $(0, +\\infty)$ 上严格单调递减。在当前探究点 $x_0 = ${x0.toFixed(2)}$ 处，结合定义域与底数大小，准确判定函数值正负与大小。`,
          latex: `a > 1 \\implies \\forall 0 < x_1 < x_2, \\; \\log_a x_1 < \\log_a x_2`,
          rubric: "准确阐明底数对单调性的决定作用并由单调性定号",
        },
        {
          step: 3,
          title: "图象走势 · 渐近线与对数增长特征",
          detail:
            "当 $x \\to 0^+$ 时，$\\log_a x \\to -\\infty$（$a > 1$ 时），以 $y$ 轴（直线 $x = 0$）为竖直渐近线；当 $x$ 充分大时，对数增长远慢于线性增长与指数增长，图象呈现随 $x$ 增大而越来越平缓的向下弯曲特征。",
          latex:
            "x \\to 0^+ \\implies y \\to -\\infty \\; (x=0 \\text{ 为竖直渐近线})",
          rubric: "规范描述对数曲线以 y 轴为渐近线及大自变量下的走势特征",
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
          detail: `设原曲线上探究动点为 $P(${x0.toFixed(2)}, ${expVal.toFixed(2)})$，反函数对应点为 $P'(${expVal.toFixed(2)}, ${x0.toFixed(2)})$。连线斜率 $k_{PP'} = \\frac{${x0.toFixed(2)} - ${expVal.toFixed(2)}}{${expVal.toFixed(2)} - ${x0.toFixed(2)}} = -1$，与直线 $y = x$ 斜率之积为 $-1$，证明 $PP' \\perp (y = x)$；中点 $M(${midX.toFixed(2)}, ${midX.toFixed(2)})$ 纵横坐标严格相等，落在对称轴 $y = x$ 上，充要证实直线 $y = x$ 垂直平分线段 $PP'$。`,
          latex:
            "\\begin{cases} k_{PP'} = \\frac{x_0 - a^{x_0}}{a^{x_0} - x_0} = -1 \\implies PP' \\perp (y = x) \\\\ M\\left(\\frac{x_0 + a^{x_0}}{2}, \\frac{x_0 + a^{x_0}}{2}\\right) \\in \\{ (x, y) \\mid y = x \\} \\end{cases}",
          rubric: "证明两点连线被对称轴垂直平分",
        },
        {
          step: 3,
          title: "性质对偶 · 定点渐近线与单调性互映",
          detail:
            "由互为反函数的图象关于直线 $y = x$ 轴对称可知：指数函数定点 $(0, 1)$ 与对数函数定点 $(1, 0)$ 互为镜像；指数函数的水平渐近线 $y = 0$ 镜像为对数函数的竖直渐近线 $x = 0$；且两者在各定义域上的单调增减性严格保持同向。",
          latex:
            "(0, 1) \\xleftrightarrow{y=x} (1, 0), \\quad (y = 0) \\xleftrightarrow{y=x} (x = 0)",
          rubric: "全面总结反函数关于直线 y=x 对称下的关键特征对偶规律",
        },
      ];
    } else {
      const expVal = expLogRes.isValidBase ? expLogRes.expVal : 0;
      reasoningSteps = [
        {
          step: 1,
          title: "基准模型 · 指数函数定义与必过定点",
          detail: `指数函数 $y = a^x$（底数 $a = ${a.toFixed(1)}$）定义域为 $\\mathbb{R}$，值域为 $(0, +\\infty)$，恒过定点 $(0, 1)$。$x$ 轴（直线 $y = 0$）为水平渐近线。`,
          latex: `f(0) = ${a.toFixed(1)}^0 = 1 \\implies \\text{必过定点 } (0, 1) \\text{，且图象以 } x \\text{ 轴为水平渐近线}`,
          rubric: "写明指数函数性质与渐近线",
        },
        {
          step: 2,
          title: "单调判号 · 底数分类与单调性分析",
          detail: `指数函数 $y = a^x$（当前底数 $a = ${a.toFixed(1)}$）单调性完全由底数大小决定：当 $a > 1$ 时，在 $\\mathbb{R}$ 上严格单调递增；当 $0 < a < 1$ 时，在 $\\mathbb{R}$ 上严格单调递减。当前探究点 $x_0 = ${x0.toFixed(2)}$，对应函数值 $f(x_0) = ${expVal.toFixed(2)}$。`,
          latex: `a > 1 \\implies \\forall x_1 < x_2, \\; a^{x_1} < a^{x_2}`,
          rubric: "根据底数大小准确分类并阐明全域单调性",
        },
        {
          step: 3,
          title: "图象走势 · 水平渐近线与指数爆炸模型",
          detail:
            "当 $a > 1$ 且 $x \\to -\\infty$ 时，$a^x \\to 0$ 恒大于 0，故 $x$ 轴（直线 $y = 0$）为水平渐近线；当 $x > 0$ 且增大时，函数值呈现指数爆炸式急剧增长，增长速度最终远超任何一次多项式。",
          latex:
            "x \\to -\\infty \\implies a^x \\to 0 \\; (y=0 \\text{ 为水平渐近线})",
          rubric: "规范交代水平渐近线及指数增长的几何特征",
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
          ? "反函数关于y=x垂直平分，中点落在直线上；定点(1,0)映射(0,1)，轴对称渐近线换。"
          : "对过(1,0)轴渐近，同大为正异大负；单增单减看底数，缓慢增长对数律。"
        : explogMode === "inverse"
          ? "指过(0,1)对过(1,0)，y=x对称反函数；定点渐近全镜像，垂直平分中点连。"
          : "指过(0,1)轴渐近，底大于一增得急；爆炸增长超多项，单调走势看底数。",
  };
}
