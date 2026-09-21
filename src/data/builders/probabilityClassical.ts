import type {
  MathPanelData,
  ReasoningStep,
  Theorem,
  GaokaoPoint,
} from "../types";
import {
  computeClassicalProbability,
  type ClassicalModelType,
} from "@/math/probabilityClassical";
import { MATH_COLORS } from "@/theme";
import { CLASSICAL_ANSWER_STEPS } from "../registries/probabilityClassical";

export interface ClassicalBuilderOptions {
  activeView?: "matrix" | "tree";
  scenarioKey?: string;
  focusStep?: number;
}

export function buildClassicalProbabilityPanel(
  params: Record<string, unknown>,
  _config?: ClassicalBuilderOptions,
): MathPanelData {
  const modelType = (params.modelType ?? "dice_two") as ClassicalModelType;
  const targetEvent = String(params.targetEvent ?? "sum_k");
  const targetSum = Number(params.targetSum ?? 7);
  const drawMode = (params.drawMode ?? "without_replacement") as
    "without_replacement" | "with_replacement";
  const redBalls = Number(params.redBalls ?? 2);
  const whiteBalls = Number(params.whiteBalls ?? 3);

  const mathRes = computeClassicalProbability({
    modelType,
    targetEvent,
    targetSum,
    drawMode,
    redBalls,
    whiteBalls,
  });

  // 1. 实时数学量 (Quantities)
  const quantities: MathPanelData["quantities"] = [
    {
      label: "样本空间总数",
      symbol: "n(\\Omega)",
      value: `${mathRes.totalCount}`,
      color: MATH_COLORS.primary,
    },
    {
      label: "事件包含点数",
      symbol: "n(A)",
      value: `${mathRes.eventCount}`,
      color: MATH_COLORS.paramPrimary,
      highlight: "positive",
    },
    {
      label: "古典概型概率",
      symbol: "P(A)",
      value: mathRes.reducedFractionLatex,
      color: MATH_COLORS.accent,
      highlight: "positive",
    },
    {
      label: "对立事件概率",
      symbol: "P(\\overline{A})",
      value: mathRes.complementFractionLatex,
      color: MATH_COLORS.paramSecondary,
    },
  ];

  // 2. 定理与课标方法 (Theorems)
  const theorems: Theorem[] = [
    {
      name: "古典概型两大概征",
      latex:
        "n(\\Omega) < +\\infty,\\quad P(\\omega_1) = P(\\omega_2) = \\cdots = P(\\omega_n)",
      note: "试验具有两大本质特征：(1) 有限性（样本空间的样本点只有有限个）；(2) 等可能性（每个样本点发生的可能性都相等）。",
      condition: "试验结果有限且每个基本事件发生机会均等",
      level: "core",
    },
    {
      name: "古典概型概率计算公式",
      latex: "P(A) = \\frac{n(A)}{n(\\Omega)}",
      note: "对于古典概型，事件 $A$ 包含的基本事件数 $n(A)$ 与样本空间包含的基本事件总数 $n(\\Omega)$ 之比，即为事件 $A$ 的概率。",
      condition: "试验属于古典概型",
      level: "core",
    },
    {
      name: "样本空间列举法（列表与树状图）",
      latex: "\\Omega = \\{(x_1, x_2) \\mid x_1 \\in S_1, x_2 \\in S_2\\}",
      note: "两步完成的试验采用二维平面直角网格（列表法）；两步及以上分步试验采用树状图展开法，做到不重不漏。",
      condition: "有限离散样本空间",
      level: "important",
    },
    {
      name: "“正难则反”对立事件逆向法",
      latex:
        "P(A) = 1 - P(\\overline{A}) = 1 - \\frac{n(\\overline{A})}{n(\\Omega)}",
      note: "当正面求解事件 $A$ 包含“至少”、“至多”等多分类情况较为繁琐时，转而求解其对立事件 $\\overline{A}$，化繁为简。",
      condition: "$A$ 与 $\\overline{A}$ 对立",
      level: "important",
    },
  ];

  // 3. 高考压轴与得分秒杀点 (GaokaoPoints)
  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "警惕“伪等可能”思维陷阱：两枚骰子点数和取值范围是 $2 \\sim 12$，但各和值所含样本点数不同（和为 $7$ 有 $6$ 种，和为 $2$ 仅 $1$ 种）。若误认为和值等可能则完全失分！必须以有序对 $(i, j)$ 为基元。",
      importance: "gaokao",
    },
    {
      text: "高考标准解答分步走踩分点：规范答题必须写出：① 记事件字母；② 规范罗列 $\\Omega$ 并求 $n(\\Omega)$；③ 罗列事件 $A$ 并求 $n(A)$；④ 代入公式 $P(A) = \\frac{n(A)}{n(\\Omega)}$ 求解并约分。",
      importance: "core",
    },
  ];

  // 4. 解答题四步走推导链 (ReasoningSteps) - 与 CLASSICAL_ANSWER_STEPS 逐条完全对齐
  const step1Title = CLASSICAL_ANSWER_STEPS[0].title;
  const step2Title = CLASSICAL_ANSWER_STEPS[1].title;
  const step3Title = CLASSICAL_ANSWER_STEPS[2].title;
  const step4Title = CLASSICAL_ANSWER_STEPS[3].title;

  const enumMethodName =
    mathRes.modelType === "coin_toss"
      ? "树状图法"
      : mathRes.modelType === "dice_two"
        ? "二维网格列表法"
        : mathRes.modelType === "ball_draw"
          ? "有序数对列举法"
          : "无序组合列举法";

  const step4Formula = mathRes.reducedFractionLatex.includes("=")
    ? `P(A) = \\frac{n(A)}{n(\\Omega)} = \\frac{${mathRes.eventCount}}{${mathRes.totalCount}} = ${mathRes.reducedFractionLatex.split("=")[1].trim()}`
    : `P(A) = \\frac{n(A)}{n(\\Omega)} = \\frac{${mathRes.eventCount}}{${mathRes.totalCount}}`;

  const reasoningSteps: ReasoningStep[] = [
    {
      step: 1,
      title: step1Title,
      latex:
        "n(\\Omega) < +\\infty,\\quad P(\\omega_1) = P(\\omega_2) = \\cdots = P(\\omega_n)",
      detail:
        "试验所有可能结果有限，且每个基本事件发生的机会均等，试验满足有限性与等可能性，属于古典概型。",
      rubric: "【高考采分点】确认古典概型两大特征：有限性与等可能性得 2 分。",
    },
    {
      step: 2,
      title: step2Title,
      latex: `n(\\Omega) = ${mathRes.totalCount}`,
      detail: `运用${enumMethodName}规范列出样本空间 $\\Omega$，求得等可能基本事件总数为 $n(\\Omega) = ${mathRes.totalCount}$。`,
      rubric: "【高考采分点】完整书写样本空间集合并计算基本事件总数得 3 分。",
    },
    {
      step: 3,
      title: step3Title,
      latex: `${mathRes.matchedPointsListLatex},\\quad n(A) = ${mathRes.eventCount}`,
      detail: `记事件 $A$ 为“${mathRes.eventName}”，筛选符合题设条件的基本事件为 $${mathRes.matchedPointsListLatex}$，统计得包含的基本事件个数为 $n(A) = ${mathRes.eventCount}$。`,
      rubric: "【高考采分点】列出事件集合并统计包含的基本事件个数得 3 分。",
    },
    {
      step: 4,
      title: step4Title,
      latex: step4Formula,
      detail: `代入古典概型概率计算公式 $P(A) = \\frac{n(A)}{n(\\Omega)}$，计算得事件 $A$ 发生的概率为 $${mathRes.reducedFractionLatex}$。对立事件概率 $P(\\overline{A}) = 1 - P(A) = ${mathRes.complementFractionLatex}$。`,
      rubric: "【高考采分点】代入比值公式化简并用对立事件核验得 2 分。",
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings: [],
    reasoningSteps,
  };
}
