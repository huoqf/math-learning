import type { MathPanelData } from "@/data/types";
import { MATH_COLORS } from "@/theme";
import { calculateTangentLine } from "@/math/tangentScaling";
import type {
  TangentScalingParams,
  BaseSubModel,
} from "@/data/registries/tangentScaling";

/**
 * 针对 6 种基准子模型特化高考解答题标准推导链
 * 构造辅助函数 -> 导数单调性 -> 极值与等号条件
 */
function getBaseReasoningSteps(baseSub: BaseSubModel) {
  if (baseSub === "exp_x_plus_1") {
    return [
      {
        step: 1,
        title: "构造辅助函数并求导",
        detail:
          "令辅助函数 $h(x) = e^x - x - 1$ ($x \\in \\mathbb{R}$)，求导得 $h'(x) = e^x - 1$。",
        latex: "h(x) = e^x - x - 1 \\implies h'(x) = e^x - 1",
        rubric: "采分点：构造辅助函数与求导（3分）",
      },
      {
        step: 2,
        title: "判定导数符号确立单调性",
        detail:
          "令 $h'(x) = 0$ 得驻点 $x = 0$。当 $x < 0$ 时 $h'(x) < 0$，$h(x)$ 单调递减；当 $x > 0$ 时 $h'(x) > 0$，$h(x)$ 单调递增。",
        rubric: "采分点：驻点求解与单调区间判定（4分）",
      },
      {
        step: 3,
        title: "极值结论与取等条件",
        detail:
          "故 $h(x)$ 在 $x = 0$ 处取得唯一极小值也是最小值 $h(0) = e^0 - 0 - 1 = 0$。因此 $h(x) \\ge 0 \\iff e^x \\ge x + 1$，当且仅当 $x = 0$ 时等号成立。",
        latex:
          "e^x \\ge x + 1 \\quad (\\text{当且仅当 } x = 0 \\text{ 时等号成立})",
        rubric: "采分点：最小值计算与等号条件（4分）",
      },
    ];
  }
  if (baseSub === "log_x_minus_1") {
    return [
      {
        step: 1,
        title: "构造辅助函数并求导",
        detail:
          "令辅助函数 $h(x) = \\ln x - x + 1$ ($x > 0$)，求导得 $h'(x) = \\frac{1}{x} - 1 = \\frac{1 - x}{x}$。",
        latex: "h(x) = \\ln x - x + 1 \\implies h'(x) = \\frac{1 - x}{x}",
        rubric: "采分点：定义域说明与求导通分（3分）",
      },
      {
        step: 2,
        title: "判定导数符号确立单调性",
        detail:
          "令 $h'(x) = 0$ 得驻点 $x = 1$。当 $0 < x < 1$ 时 $h'(x) > 0$，$h(x)$ 单调递增；当 $x > 1$ 时 $h'(x) < 0$，$h(x)$ 单调递减。",
        rubric: "采分点：驻点求解与单调区间判定（4分）",
      },
      {
        step: 3,
        title: "极值结论与取等条件",
        detail:
          "故 $h(x)$ 在 $x = 1$ 处取得唯一极大值也是最大值 $h(1) = \\ln 1 - 1 + 1 = 0$。因此 $h(x) \\le 0 \\iff \\ln x \\le x - 1$，当且仅当 $x = 1$ 时等号成立。",
        latex:
          "\\ln x \\le x - 1 \\quad (\\text{当且仅当 } x = 1 \\text{ 时等号成立})",
        rubric: "采分点：最大值计算与等号条件（4分）",
      },
    ];
  }
  if (baseSub === "exp_shift_x") {
    return [
      {
        step: 1,
        title: "构造辅助函数并求导",
        detail:
          "令辅助函数 $h(x) = e^{x-1} - x$ ($x \\in \\mathbb{R}$)，求导得 $h'(x) = e^{x-1} - 1$。",
        latex: "h(x) = e^{x-1} - x \\implies h'(x) = e^{x-1} - 1",
        rubric: "采分点：构造辅助函数与求导（3分）",
      },
      {
        step: 2,
        title: "判定导数符号确立单调性",
        detail:
          "令 $h'(x) = 0$ 得驻点 $x = 1$。当 $x < 1$ 时 $h'(x) < 0$，$h(x)$ 单调递减；当 $x > 1$ 时 $h'(x) > 0$，$h(x)$ 单调递增。",
        rubric: "采分点：驻点求解与单调区间判定（4分）",
      },
      {
        step: 3,
        title: "极值结论与取等条件",
        detail:
          "故 $h(x)$ 在 $x = 1$ 处取得唯一极小值也是最小值 $h(1) = e^0 - 1 = 0$。因此 $e^{x-1} \\ge x$，当且仅当 $x = 1$ 时等号成立。",
        latex:
          "e^{x-1} \\ge x \\quad (\\text{当且仅当 } x = 1 \\text{ 时等号成立})",
        rubric: "采分点：最小值计算与等号条件（4分）",
      },
    ];
  }
  if (baseSub === "log_shift_0") {
    return [
      {
        step: 1,
        title: "构造辅助函数并求导",
        detail:
          "令辅助函数 $h(x) = \\ln(x+1) - x$ ($x > -1$)，求导得 $h'(x) = \\frac{1}{x+1} - 1 = -\\frac{x}{x+1}$。",
        latex: "h(x) = \\ln(x+1) - x \\implies h'(x) = -\\frac{x}{x+1}",
        rubric: "采分点：定义域说明与求导化简（3分）",
      },
      {
        step: 2,
        title: "判定导数符号确立单调性",
        detail:
          "令 $h'(x) = 0$ 得驻点 $x = 0$。当 $-1 < x < 0$ 时 $h'(x) > 0$，$h(x)$ 单调递增；当 $x > 0$ 时 $h'(x) < 0$，$h(x)$ 单调递减。",
        rubric: "采分点：单调区间判定与分类讨论（4分）",
      },
      {
        step: 3,
        title: "极值结论与取等条件",
        detail:
          "故 $h(x)$ 在 $x = 0$ 处取得唯一极大值也是最大值 $h(0) = \\ln 1 - 0 = 0$。因此 $\\ln(x+1) \\le x$，当且仅当 $x = 0$ 时等号成立。",
        latex:
          "\\ln(x+1) \\le x \\quad (\\text{当且仅当 } x = 0 \\text{ 时等号成立})",
        rubric: "采分点：最大值计算与等号条件（4分）",
      },
    ];
  }
  if (baseSub === "exp_ex") {
    return [
      {
        step: 1,
        title: "构造辅助函数并求导",
        detail:
          "令辅助函数 $h(x) = e^x - ex$ ($x \\in \\mathbb{R}$)，求导得 $h'(x) = e^x - e$。",
        latex: "h(x) = e^x - ex \\implies h'(x) = e^x - e",
        rubric: "采分点：构造辅助函数与求导（3分）",
      },
      {
        step: 2,
        title: "判定导数符号确立单调性",
        detail:
          "令 $h'(x) = 0$ 得驻点 $x = 1$。当 $x < 1$ 时 $h'(x) < 0$，$h(x)$ 单调递减；当 $x > 1$ 时 $h'(x) > 0$，$h(x)$ 单调递增。",
        rubric: "采分点：驻点求解与单调区间判定（4分）",
      },
      {
        step: 3,
        title: "极值结论与取等条件",
        detail:
          "故 $h(x)$ 在 $x = 1$ 处取得最小值 $h(1) = e - e = 0$。因此 $e^x \\ge ex$，当且仅当 $x = 1$ 时等号成立。",
        latex:
          "e^x \\ge ex \\quad (\\text{当且仅当 } x = 1 \\text{ 时等号成立})",
        rubric: "采分点：最小值计算与等号条件（4分）",
      },
    ];
  }
  // log_x_div_e
  return [
    {
      step: 1,
      title: "构造辅助函数并求导",
      detail:
        "令辅助函数 $h(x) = \\ln x - \\frac{x}{e}$ ($x > 0$)，求导得 $h'(x) = \\frac{1}{x} - \\frac{1}{e} = \\frac{e - x}{ex}$。",
      latex: "h(x) = \\ln x - \\frac{x}{e} \\implies h'(x) = \\frac{e - x}{ex}",
      rubric: "采分点：定义域说明与求导通分（3分）",
    },
    {
      step: 2,
      title: "判定导数符号确立单调性",
      detail:
        "令 $h'(x) = 0$ 得驻点 $x = e$。当 $0 < x < e$ 时 $h'(x) > 0$，$h(x)$ 单调递增；当 $x > e$ 时 $h'(x) < 0$，$h(x)$ 单调递减。",
      rubric: "采分点：驻点求解与单调区间判定（4分）",
    },
    {
      step: 3,
      title: "极值结论与取等条件",
      detail:
        "故 $h(x)$ 在 $x = e$ 处取得最大值 $h(e) = \\ln e - 1 = 0$。因此 $\\ln x \\le \\frac{x}{e}$，当且仅当 $x = e$ 时等号成立。",
      latex:
        "\\ln x \\le \\frac{x}{e} \\quad (\\text{当且仅当 } x = e \\text{ 时等号成立})",
      rubric: "采分点：最大值计算与等号条件（4分）",
    },
  ];
}

export function buildBaseModel(
  params: TangentScalingParams,
  baseSub: BaseSubModel,
): MathPanelData {
  let funcType: "exp" | "log" | "exp_shift" | "log_shift" = "exp";
  let modelFormula = "e^x \\ge x + 1";
  let anchorPoint = "x_0 = 0";
  let isUnder = true; // 切线是否在曲线下方

  if (baseSub === "exp_shift_x") {
    funcType = "exp_shift";
    modelFormula = "e^{x-1} \\ge x";
    anchorPoint = "x_0 = 1";
  } else if (baseSub === "exp_ex") {
    funcType = "exp";
    modelFormula = "e^x \\ge ex";
    anchorPoint = "x_0 = 1";
  } else if (baseSub === "log_x_minus_1") {
    funcType = "log";
    modelFormula = "\\ln x \\le x - 1";
    anchorPoint = "x_0 = 1";
    isUnder = false;
  } else if (baseSub === "log_x_div_e") {
    funcType = "log";
    modelFormula = "\\ln x \\le \\frac{x}{e}";
    anchorPoint = "x_0 = e";
    isUnder = false;
  } else if (baseSub === "log_shift_0") {
    funcType = "log_shift";
    modelFormula = "\\ln(x+1) \\le x";
    anchorPoint = "x_0 = 0";
    isUnder = false;
  }

  let baseSlope = 1;
  let baseIntercept = 1;
  let baseAnchorX = 0;
  if (baseSub === "exp_shift_x") {
    baseSlope = 1;
    baseIntercept = 0;
    baseAnchorX = 1;
  } else if (baseSub === "exp_ex") {
    baseSlope = Math.E;
    baseIntercept = 0;
    baseAnchorX = 1;
  } else if (baseSub === "log_x_minus_1") {
    baseSlope = 1;
    baseIntercept = -1;
    baseAnchorX = 1;
  } else if (baseSub === "log_shift_0") {
    baseSlope = 1;
    baseIntercept = 0;
    baseAnchorX = 0;
  } else if (baseSub === "log_x_div_e") {
    baseSlope = 1 / Math.E;
    baseIntercept = 0;
    baseAnchorX = Math.E;
  }

  const tangent = calculateTangentLine(funcType, params.x0);
  const baseLineVal = baseSlope * params.x0 + baseIntercept;
  const baseDiff = isUnder
    ? tangent.y0 - baseLineVal
    : baseLineVal - tangent.y0;
  const isAtAnchor = Math.abs(params.x0 - baseAnchorX) < 0.05;

  return {
    examAnchor: "新高考解答题 17/18 题 · 基准切线放缩法",
    mnemonic: isUnder ? "指数切线在下方支撑" : "对数切线在上方包络",
    quantities: [
      {
        label: "切点横坐标",
        symbol: "x_0",
        value: params.x0.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "切点导数值",
        symbol: "f'(x_0)",
        value: Number.isFinite(tangent.slope) ? tangent.slope.toFixed(3) : "—",
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "当前动切线方程",
        symbol: "y",
        value: tangent.equationLatex,
        color: MATH_COLORS.primary,
      },
      {
        label: "基准放缩式差值",
        symbol: isUnder
          ? "f(x_0) - y_{\\text{base}}"
          : "y_{\\text{base}} - f(x_0)",
        value: Math.max(0, baseDiff).toFixed(4),
        color: isAtAnchor ? MATH_COLORS.paramTertiary : MATH_COLORS.accent,
        isInvariant: isAtAnchor,
        invariantNote: isAtAnchor
          ? "已达基准切点，放缩差值为 0（取等条件达成）"
          : "当前点差值 > 0，验证不等式恒成立且放缩有裕量",
        highlight: isAtAnchor ? "positive" : undefined,
      },
    ],
    theorems: [
      {
        name: isUnder ? "基准切线下界放缩不等式" : "基准切线上界放缩不等式",
        latex: isUnder
          ? "f(x) \\ge f'(x_0)(x - x_0) + f(x_0)"
          : "f(x) \\le f'(x_0)(x - x_0) + f(x_0)",
        condition: isUnder ? "切线恒在函数图象下方" : "切线恒在函数图象上方",
        level: "core",
        note: `当前对应高考经典公式：$${modelFormula}$，当且仅当 $${anchorPoint}$ 时等号成立。`,
      },
    ],
    warnings: [
      {
        text: `放缩等号仅在 $${anchorPoint}$ 处取得，若与其他式子联立，需严格验证各部分取等条件是否可同时达到！`,
        level: "warning",
      },
    ],
    gaokaoPoints: [
      {
        text: "【化简降维】新高考压轴题中若出现指对混合多项式，首选基准切线放缩将超越函数降维为一次函数",
        importance: "gaokao",
      },
      {
        text: `【同构变形】$${modelFormula}$ 是高考同构变形（形如 $e^t$ 与 $\\ln t$）的核心换元桥梁`,
        importance: "core",
      },
    ],
    reasoningSteps: getBaseReasoningSteps(baseSub),
  };
}
