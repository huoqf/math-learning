import type { MathPanelData } from "../types";
import { solveConstantDouble } from "@/math/constant";
import { CALCULUS_COLORS } from "@/theme";

export function buildConstantDoublePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const selectedLogic =
    (config?.selectedLogic as
      "all_all" | "all_exist" | "exist_all" | "exist_exist" | "same_var") ||
    "all_all";
  const yf = params.yf ?? 2.5;
  const xf = params.xf ?? 1.25;
  const yg = params.yg ?? 1.5;
  const xg = params.xg ?? 2.25;
  const mf = 0.5,
    nf = 2.0;
  const mg = 1.5,
    ng = 3.0;
  const res = solveConstantDouble(
    yf,
    xf,
    mf,
    nf,
    yg,
    xg,
    mg,
    ng,
    selectedLogic,
  );

  const quantities: MathPanelData["quantities"] =
    selectedLogic === "same_var"
      ? [
          { label: "作用域交集", value: "x ∈ [1.50, 2.00]" },
          {
            label: "最小差值 f(x) - g(x)",
            symbol: "h_min",
            value: res.sameVarMinDiff ?? 0,
            color: CALCULUS_COLORS.function,
          },
          {
            label: "最危险位置",
            symbol: "x_min",
            value: res.sameVarXMin ?? 0,
          },
          {
            label: "同自变量恒成立状态",
            value: res.isSameVarTrue ? "满足" : "不满足",
            highlight: res.isSameVarTrue ? "extreme" : "negative",
          },
        ]
      : [
          {
            label: "f(x)最小值",
            symbol: "f_min",
            value: res.fMin,
            color: CALCULUS_COLORS.function,
          },
          {
            label: "f(x)最大值",
            symbol: "f_max",
            value: res.fMax,
            color: CALCULUS_COLORS.function,
          },
          {
            label: "g(x)最大值",
            symbol: "g_max",
            value: res.gMax,
            color: CALCULUS_COLORS.derivative,
          },
          {
            label: "g(x)最小值",
            symbol: "g_min",
            value: res.gMin,
            color: CALCULUS_COLORS.derivative,
          },
          {
            label: "所选博弈状态",
            value: res.isCurrentLogicTrue ? "满足" : "不满足",
            highlight: res.isCurrentLogicTrue ? "extreme" : "negative",
          },
        ];

  const theorems: MathPanelData["theorems"] =
    selectedLogic === "same_var"
      ? [
          {
            name: "同自变量差函数法",
            latex: `\\forall x \\in I_1 \\cap I_2, \\; f(x) \\ge g(x) \\iff h(x) = f(x) - g(x) \\ge 0 \\iff h(x)_{\\min} \\ge 0`,
            level: "core",
            prerequisites: ["自变量 x 为同一变量，作用在两区间交集上"],
          },
          {
            name: "差函数最值计算",
            latex: `h(x) = 2x^2 - 2(x_f + x_g)x + (x_f^2 + y_f + x_g^2 - y_g)`,
            level: "important",
            prerequisites: ["对称轴为 x_{sym} = \\frac{x_f + x_g}{2}"],
          },
        ]
      : [
          {
            name: "高考双动点不等式四大法宝",
            latex: `\\forall x_1, x_2, f(x_1) \\ge g(x_2) \\iff f_{\\min} \\ge g_{\\max}`,
            level: "core",
            prerequisites: ["x₁ 与 x₂ 分别在独立区间内自由变动"],
          },
          {
            name: "其他对应关系参考",
            latex: `\\begin{aligned} \\forall x_1, \\exists x_2, f(x_1) \\ge g(x_2) &\\iff f_{\\min} \\ge g_{\\min} \\\\ \\exists x_1, \\forall x_2, f(x_1) \\ge g(x_2) &\\iff f_{\\max} \\ge g_{\\max} \\\\ \\exists x_1, \\exists x_2, f(x_1) \\ge g(x_2) &\\iff f_{\\max} \\ge g_{\\min} \\end{aligned}`,
            level: "important",
            prerequisites: ["注意主词\u201C任意\u201D与\u201C存在\u201D的组合"],
          },
        ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] =
    selectedLogic === "same_var"
      ? [
          {
            text: "同自变量恒成立使用\u201C差函数法\u201D：当自变量 x 限制在重合区间内且为同一个动点时，只需两函数在该区间上的差值大于等于 0 即可。",
            importance: "gaokao",
          },
          {
            text: "易错辨析：同自变量成立并不需要 f(x) 的最小值高于 g(x) 的最大值，只需在每个点上 f 都在 g 的上方（即差函数图象在 x 轴上方）。",
            importance: "core",
          },
        ]
      : [
          {
            text: "双自变量恒成立：\u201C对任意自变量不等式成立\u201D要求两函数各自极值完全分离。其中 ∀x₁, ∀x₂ 要求 f 的最小值必须压过 g 的最大值。",
            importance: "gaokao",
          },
          {
            text: "区分双动点恒成立（各行其是）与同变量恒成立（f(x) ≥ g(x) 构造差函数）。",
            importance: "core",
          },
        ];

  const warnings: MathPanelData["warnings"] = [];
  if (selectedLogic === "same_var") {
    if (!res.isSameVarTrue) {
      warnings.push({
        text: `同变量恒成立不满足！在最危险位置 x = ${res.sameVarXMin?.toFixed(2)} 处，差值只有 ${res.sameVarMinDiff?.toFixed(2)} (< 0)。`,
        level: "warning",
      });
    }
  } else {
    if (!res.isCurrentLogicTrue) {
      warnings.push({
        text: `当前条件不满足！博弈对垒中 ${res.battlePointF.y.toFixed(2)} 未能压过 ${res.battlePointG.y.toFixed(2)}。`,
        level: "warning",
      });
    }
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      selectedLogic === "same_var"
        ? "同变量差函数，作差求最值。"
        : "双动点别慌张，任意任意比极值，最小值压最大值。",
  };
}
