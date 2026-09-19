import type { ScenarioSpec } from "@/types/scenario";
import type { ClassicalModelType } from "@/math/probabilityClassical";

export interface ClassicalParams extends Record<string, unknown> {
  modelType: ClassicalModelType;
  targetEvent: string;
  targetSum: number;
  drawMode: "without_replacement" | "with_replacement";
  redBalls: number;
  whiteBalls: number;
  activeView: "matrix" | "tree";
  currentStep?: number;
}

export const DEFAULT_CLASSICAL_PARAMS: ClassicalParams = {
  modelType: "dice_two",
  targetEvent: "sum_k",
  targetSum: 7,
  drawMode: "without_replacement",
  redBalls: 2,
  whiteBalls: 3,
  activeView: "matrix",
  currentStep: 1,
};

export type ClassicalScenarioKey =
  | "dice_sum_seven"
  | "dice_parity_sum"
  | "ball_without_replace"
  | "coin_three_times"
  | "gaokao_volunteer"
  | "free_explore";

export interface ClassicalAnswerStepItem {
  step: number;
  title: string;
  sceneHint: string;
}

export const CLASSICAL_ANSWER_STEPS: ClassicalAnswerStepItem[] = [
  {
    step: 1,
    title: "审题定模：判定古典概型两大特征",
    sceneHint: "确认试验结果有限且每个基本事件发生等可能",
  },
  {
    step: 2,
    title: "列举样本：规范写出样本空间并求总数",
    sceneHint: "用列表法或树状图列举样本空间，求基本事件总数 $n(\\Omega)$",
  },
  {
    step: 3,
    title: "确定事件：列举事件包含的基本事件",
    sceneHint: "找出符合目标事件条件的点集，统计基本事件数 $n(A)$",
  },
  {
    step: 4,
    title: "代入公式：比值求解与正难则反验算",
    sceneHint:
      "代入公式 $P(A) = \\frac{n(A)}{n(\\Omega)}$ 求解，并用对立事件互核",
  },
];

export const PROBABILITY_CLASSICAL_SCENARIOS: Record<
  ClassicalScenarioKey,
  ScenarioSpec<ClassicalParams>
> = {
  dice_sum_seven: {
    id: "dice_sum_seven",
    name: "掷骰求和",
    badge: "课标核心 · 等可能特征辨析",
    background:
      "在经典掷骰子试验中，若直接以“点数之和”作为基本事件（和值从 $2$ 到 $12$），各和值发生的可能性并不相等，不能直接套用等可能公式。",
    condition:
      "同时抛掷两枚质地均匀的骰子，样本空间 $\\Omega$ 必须以有序对 $(i, j)$ 表示，基本事件总数 $n(\\Omega) = 6 \\times 6 = 36$。",
    question:
      "(1) 列举点数和等于 $7$ 的所有等可能样本点并求其个数；(2) 运用古典概型公式计算两骰点数之和等于 $7$ 的概率 $P(A)$。",
    presetParams: {
      modelType: "dice_two",
      targetEvent: "sum_k",
      targetSum: 7,
      drawMode: "without_replacement",
      redBalls: 2,
      whiteBalls: 3,
      activeView: "matrix",
      currentStep: 1,
    },
    lockedParamKeys: ["modelType", "targetEvent", "targetSum"],
    variant: "primary",
  },
  dice_parity_sum: {
    id: "dice_parity_sum",
    name: "点数相同",
    badge: "对角线特征 · 样本网格剖析",
    background:
      "某双人桌游竞赛中，规定掷出两枚点数相同的骰子即可获得额外行动机会。",
    condition:
      "抛掷两枚质地均匀骰子，两枚点数相同的事件为 $A = \\{(1,1), (2,2), (3,3), (4,4), (5,5), (6,6)\\}$。",
    question:
      "(1) 在二维离散网格中观察对角线样本点分布；(2) 计算该玩家在单次投掷中获得额外行动机会（即两点数相同）的概率 $P(A)$。",
    presetParams: {
      modelType: "dice_two",
      targetEvent: "same",
      targetSum: 7,
      drawMode: "without_replacement",
      redBalls: 2,
      whiteBalls: 3,
      activeView: "matrix",
      currentStep: 1,
    },
    lockedParamKeys: ["modelType", "targetEvent"],
    variant: "accent",
  },
  ball_without_replace: {
    id: "ball_without_replace",
    name: "摸球正难则反",
    badge: "高考秒杀 · 对立事件逆向破题",
    background:
      "袋中装有 $2$ 个红球与 $3$ 个白球，这 $5$ 个球除颜色外完全相同。从中不放回地依次随机抽取 $2$ 个球。",
    condition:
      "将 $5$ 个球分别编号为 $R_1, R_2, W_1, W_2, W_3$。无放回抽取样本空间总数为 $n(\\Omega) = 5 \\times 4 = 20$。",
    question:
      "(1) 正面分类或运用对立事件“全是白球”证明对立样本点数；(2) 求解抽出的两球中“至少有 $1$ 个红球”的概率 $P(A)$。",
    presetParams: {
      modelType: "ball_draw",
      targetEvent: "at_least_one_red",
      targetSum: 7,
      drawMode: "without_replacement",
      redBalls: 2,
      whiteBalls: 3,
      activeView: "matrix",
      currentStep: 1,
    },
    lockedParamKeys: ["modelType", "targetEvent", "drawMode"],
    variant: "warning",
  },
  coin_three_times: {
    id: "coin_three_times",
    name: "三抛硬币",
    badge: "课标核心 · 树状图法列举",
    background:
      "对于连续多次或分步进行的随机试验，树状图法能清晰展示试验的每一个分步分支与最终叶子样本点。",
    condition:
      "连续抛掷一枚质地均匀的硬币 $3$ 次，每次抛掷正反面朝上等可能。由分步计数乘法原理，基本事件总数为 $n(\\Omega) = 2^3 = 8$。",
    question:
      "(1) 循序建立三级分支树状图并写出样本空间 $\\Omega$；(2) 求恰好出现 $2$ 次正面朝上的概率 $P(A)$ 与至少出现 $2$ 次正面的概率。",
    presetParams: {
      modelType: "coin_toss",
      targetEvent: "two_heads",
      targetSum: 7,
      drawMode: "without_replacement",
      redBalls: 2,
      whiteBalls: 3,
      activeView: "tree",
      currentStep: 1,
    },
    lockedParamKeys: ["modelType", "targetEvent", "activeView"],
    variant: "info",
  },
  gaokao_volunteer: {
    id: "gaokao_volunteer",
    name: "志愿选人",
    badge: "新高考真题 · 标准解答分步走",
    background:
      "某校团委从高二年级 $3$ 名男生与 $2$ 名女生共 $5$ 名志愿者中，随机抽取 $2$ 人参加社区数学宣讲服务。",
    condition:
      "设 $3$ 名男生为 $M_1, M_2, M_3$，$2$ 名女生为 $W_1, W_2$。无序抽取 $2$ 人构成的等可能基本事件总数为 $n(\\Omega) = C_5^2 = 10$。",
    question:
      "(1) 规范写出全部基本事件；(2) 记事件 $A$ 为“至少有 $1$ 名女生”，列举事件 $A$ 所含基本事件并求其概率 $P(A)$。",
    presetParams: {
      modelType: "gaokao_volunteer",
      targetEvent: "at_least_one_girl",
      targetSum: 7,
      drawMode: "without_replacement",
      redBalls: 2,
      whiteBalls: 3,
      activeView: "matrix",
      currentStep: 1,
    },
    lockedParamKeys: ["modelType", "targetEvent"],
    variant: "primary",
  },
  free_explore: {
    id: "free_explore",
    name: "自由探究",
    badge: "自主探究 · 离散空间与概率比值",
    background:
      "古典概型中，每个样本点的发生权重均为 $\\frac{1}{n(\\Omega)}$，事件发生的概率完全由所占点数占比决定。",
    condition:
      "可任意切换两枚骰子点数和、点数差、奇偶性或摸球参数，观察样本矩阵中目标区域的形态与实时概率变化。",
    question:
      "(1) 调节目标和值 $k$，探究点数和为何在 $k=7$ 时概率达到最大；(2) 比较对立事件与原事件在矩阵中的补集对偶关系。",
    presetParams: {
      modelType: "dice_two",
      targetEvent: "sum_k",
      targetSum: 7,
      drawMode: "without_replacement",
      redBalls: 2,
      whiteBalls: 3,
      activeView: "matrix",
      currentStep: 1,
    },
    variant: "info",
  },
};
