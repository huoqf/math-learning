import type { MathPanelData } from "../types";
import { colorize } from "../types";
import {
  solveConstantSingleSep,
  solveConstantSingleDirect,
  solveConstantSingleSepTrans,
  solveConstantSingleDirectTrans,
  type TransModelKey,
} from "@/math/constant";
import { MATH_COLORS } from "@/theme";

export function buildConstantSinglePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const subMode = (config?.subMode as "sep" | "direct") || "sep";
  const logic = (config?.logic as "always" | "exist") || "always";
  const funModel =
    (config?.funModel as "quadratic" | "transcendent") || "quadratic";
  const transModel = (config?.transModel as TransModelKey) || "ln_x_over_x";
  const m = params.m ?? 0.5;
  const n = params.n ?? 2.5;
  const col = colorize;
  const isTranscendent = funModel === "transcendent";

  if (subMode === "sep") {
    return buildSepBranch(params, m, n, logic, isTranscendent, transModel, col);
  } else {
    return buildDirectBranch(params, m, n, isTranscendent, transModel, col);
  }
}

function buildSepBranch(
  params: Record<string, number>,
  m: number,
  n: number,
  logic: "always" | "exist",
  isTranscendent: boolean,
  transModel: TransModelKey,
  col: typeof colorize,
): MathPanelData {
  const a = params.a ?? 1.2;
  const res = isTranscendent
    ? solveConstantSingleSepTrans(a, m, n)
    : solveConstantSingleSep(a, m, n);

  const quantities: MathPanelData["quantities"] = [
    {
      label: "区间内最小值",
      symbol: "f(x)min",
      value: res.fMin,
      color: MATH_COLORS.function,
    },
    { label: "最小值横坐标", symbol: "xmin", value: res.xFMin },
    {
      label: "区间内最大值",
      symbol: "f(x)max",
      value: res.fMax,
      color: MATH_COLORS.derivative,
    },
    { label: "最大值横坐标", symbol: "xmax", value: res.xFMax },
    {
      label:
        logic === "always" ? "恒成立状态 (f(x) ≥ a)" : "存在性状态 (f(x) ≥ a)",
      value: (logic === "always" ? res.isAlwaysTrue : res.isExistTrue)
        ? "成立"
        : "不成立",
      highlight: (logic === "always" ? res.isAlwaysTrue : res.isExistTrue)
        ? "extreme"
        : "negative",
    },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "恒成立等价转化",
      latex: `\\forall x \\in [m, n], \\, f(x) \\ge ${col("a", MATH_COLORS.paramPrimary)} \\iff f(x)_{\\min} \\ge ${col("a", MATH_COLORS.paramPrimary)}`,
      level: "core",
      prerequisites: ["区间范围 [m, n] 合理", "函数最值可达"],
    },
    {
      name: "存在性等价转化",
      latex: `\\exists x \\in [m, n], \\, f(x) \\ge ${col("a", MATH_COLORS.paramPrimary)} \\iff f(x)_{\\max} \\ge ${col("a", MATH_COLORS.paramPrimary)}`,
      level: "core",
      prerequisites: ["区间范围 [m, n] 合理", "函数最值可达"],
    },
  ];

  if (isTranscendent) {
    if (transModel === "ln_x_over_x") {
      theorems.push({
        name: "高考核心结构 f(x) = ln x / x",
        latex: `f'(x) = \\frac{1-\\ln x}{x^2} \\Rightarrow \\text{极大值点 } x=e, \\, f(e) = \\frac{1}{e} \\approx 0.368`,
        level: "important",
        prerequisites: ["x > 0", "单调性：(0, e) 增，(e, +∞) 减"],
      });
    } else if (transModel === "a_ln_x_minus_x") {
      theorems.push({
        name: "切线放缩与端点效应",
        latex: `\\ln x \\le x - 1 \\quad (x = 1 \\text{ 处等号成立})`,
        level: "important",
        prerequisites: ["用于放缩超越部分，确定必要条件 a = 1"],
      });
    } else if (transModel === "exp_minus_a_x_plus_1") {
      theorems.push({
        name: "指数放缩与切线下界",
        latex: `e^x \\ge x + 1 \\quad (x = 0 \\text{ 处等号成立})`,
        level: "important",
        prerequisites: ["切线 y = x+1 为 e^x 的下放缩界"],
      });
    }
  }

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = isTranscendent
    ? [
        {
          text: "参变分离法首选：将未知参数 a 完全孤立于不等式一侧，转化为研究另一侧函数在给定区间 [m, n] 上的最值。",
          importance: "gaokao",
        },
        {
          text: "临界点判定：对 ∀x 恒成立看最小值（底线），对 ∃x 存在性成立看最大值（突破口）。",
          importance: "core",
        },
        {
          text: "切线放缩秒杀：高考中极常用 e^x ≥ x+1 与 ln x ≤ x-1 快速寻找临界边界 a。",
          importance: "gaokao",
        },
      ]
    : [
        {
          text: "参变分离法核心：二次函数参变分离后转化为 y = a 与 f(x) 的高低对比。",
          importance: "gaokao",
        },
        {
          text: "恒成立看最小值，存在性看最大值。",
          importance: "core",
        },
      ];

  const warnings: MathPanelData["warnings"] = [];
  if (res.isDegenerate) {
    warnings.push({
      text: "区间发生退化 (m ≥ n 或超出定义域)，请调整区间滑块！",
      level: "danger",
    });
  }
  if (logic === "always" && !res.isAlwaysTrue) {
    warnings.push({
      text: `参数 a 超出了函数最小值 ${res.fMin.toFixed(2)}，高亮区内的 x 无法满足不等式。`,
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: isTranscendent
      ? "参变分离最直观，恒成求小存在大；切线放缩求临界，隐零代换解压轴。"
      : "参变分离超好用，恒成求小存在大。",
  };
}

function buildDirectBranch(
  params: Record<string, number>,
  m: number,
  n: number,
  isTranscendent: boolean,
  _transModel: TransModelKey,
  col: typeof colorize,
): MathPanelData {
  const aAxis = params.a_axis ?? 1.0;
  const res = isTranscendent
    ? solveConstantSingleDirectTrans(aAxis, m, n)
    : solveConstantSingleDirect(aAxis, m, n);

  const quantities: MathPanelData["quantities"] = [
    {
      label: "研究区间内最小值",
      symbol: "f(x)min",
      value: res.fMin,
      color: MATH_COLORS.function,
    },
    {
      label: "极值/驻点位置",
      value:
        res.discussionType === "left"
          ? "区间左端点 m"
          : res.discussionType === "right"
            ? "区间右端点 n"
            : isTranscendent
              ? "驻点 x0"
              : "顶点 a",
    },
    {
      label: "恒成立状态 (f(x) ≥ 0)",
      value: res.isAlwaysTrue ? "成立" : "不成立",
      highlight: res.isAlwaysTrue ? "extreme" : "negative",
    },
  ];

  const theorems: MathPanelData["theorems"] = isTranscendent
    ? [
        {
          name: "分类讨论法（含参超越函数）",
          latex: `f(x) \\ge 0 \\iff f(x)_{\\min} \\ge 0`,
          level: "core",
          prerequisites: ["基于导函数 f'(x) 的零点讨论单调性区段"],
        },
        {
          name: "隐零点设而不求法",
          latex: `f'(x_0) = 0 \\Rightarrow \\text{用 } x_0 \\text{ 表达参数并在 } f(x_0) \\text{ 中消元}`,
          level: "important",
          prerequisites: ["适用于导数零点无法显式表示的压轴题"],
        },
      ]
    : [
        {
          name: "分类讨论法（轴动区间定）",
          latex: `f(x) = x^2 - 2${col("a", MATH_COLORS.paramPrimary)}x + 2 \\ge 0 \\iff f(x)_{\\min} \\ge 0`,
          level: "core",
          prerequisites: ["对称轴 x = a 相对区间 [m, n] 的位置"],
        },
        {
          name: "三段分类临界",
          latex: `f(x)_{\\min} = \\begin{cases} f(m), & a < m \\\\ f(a), & m \\le a \\le n \\\\ f(n), & a > n \\end{cases}`,
          level: "important",
          prerequisites: ["临界讨论点为 a = m 与 a = n"],
        },
      ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = isTranscendent
    ? [
        {
          text: "高考压轴必备：当参变分离导致函数极度复杂时，直接讨论法是唯一突破路径。",
          importance: "gaokao",
        },
        {
          text: "隐零点设而不求技巧：设 f'(x₀) = 0，利用关系式代换消去指数/对数，将最值转化为关于 x₀ 的单变量问题。",
          importance: "gaokao",
        },
        {
          text: "端点效应：若 f(x₀) = 0，可先求 f'(x₀) ≥ 0 获得参数 a 的必要条件，再证明充分性。",
          importance: "core",
        },
      ]
    : [
        {
          text: "直接最值讨论法：对称轴 x = a 与区间 [m, n] 分为“轴在左、轴在中、轴在右”三类。",
          importance: "gaokao",
        },
        {
          text: "临界点恰好是对称轴与端点重合时。",
          importance: "core",
        },
      ];

  const warnings: MathPanelData["warnings"] = [];
  if (res.isDegenerate) {
    warnings.push({
      text: "区间发生退化，请重新调整区间滑块！",
      level: "danger",
    });
  }
  if (!res.isAlwaysTrue) {
    warnings.push({
      text: `函数最小值跌破 0 (${res.fMin.toFixed(2)})，高亮区内的 x 不满足恒成立要求。`,
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: isTranscendent
      ? "求导先找极小点，无法显示设 x₀；消去指对求最值，端点效应先必要。"
      : "轴动定区间讨论，端点顶点定分界。",
  };
}
