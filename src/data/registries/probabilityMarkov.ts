import type { ParamMeta } from "../types";

export const defaultParams: Record<string, number> = {
  p1: 1.0,
  p11: 0.0,
  p21: 0.5,
  currStep: 1,
  maxN: 10,
};

export const paramMeta: Record<string, ParamMeta> = {
  p1: {
    key: "p1",
    label: "初始状态 1 概率",
    min: 0.0,
    max: 1.0,
    step: 0.05,
    defaultValue: 1.0,
    description: "第 1 步处于状态 1 的先验概率 p₁ (如球在甲手中为 1.0)",
  },
  p11: {
    key: "p11",
    label: "同状态保持概率 p₁₁",
    min: 0.0,
    max: 1.0,
    step: 0.05,
    defaultValue: 0.0,
    description: "由状态 1 保持留在状态 1 的条件概率 P(Sₙ₊₁=1|Sₙ=1)",
  },
  p21: {
    key: "p21",
    label: "对立状态转移概率 p₂₁",
    min: 0.0,
    max: 1.0,
    step: 0.05,
    defaultValue: 0.5,
    description: "由对立状态转移到状态 A 的条件概率 P(Aₙ₊₁|Āₙ)",
  },
  currStep: {
    key: "currStep",
    label: "当前观察步数",
    min: 1,
    max: 15,
    step: 1,
    defaultValue: 1,
    description: "观察第 n 步状态分布与全概展开",
  },
  maxN: {
    key: "maxN",
    label: "最大观察项数",
    min: 5,
    max: 15,
    step: 1,
    defaultValue: 10,
    description: "数列散点图展示的最大步数",
  },
};

/** 四大高考典型模型预设配置 */
export interface MarkovPresetScenario {
  id: string;
  name: string;
  badge: string;
  condition: string;
  question: string;
  params: {
    p1: number;
    p11: number;
    p21: number;
    currStep: number;
    maxN: number;
  };
  labels: {
    s1: string;
    s2: string;
    s1Short: string;
    s2Short: string;
  };
}

export const MARKOV_PRESETS: Record<string, MarkovPresetScenario> = {
  pass_ball_2020: {
    id: "pass_ball_2020",
    name: "甲乙传球问题",
    badge: "2020全国卷真题 · 传球问题 (摆动收敛)",
    condition:
      "【题目背景】甲、乙两人做传球游戏，球在两人之间循环传递，每次传球构成一次状态转移试验。\n【初始条件】初始球在甲手中，即先验概率 $p_1 = 1$。每次传球规则：甲拿到球必传给乙（留在甲手中概率 $p_{11} = 0$）；乙拿到球后，有 $\\frac{1}{2}$ 概率回传给甲 ($p_{21} = \\frac{1}{2}$)，$\\frac{1}{2}$ 概率留在乙手中。",
    question:
      "(1) 设第 $n$ 次传球后球在甲手中的概率为 $p_n$，由全概率公式证明 $p_{n+1} = -\\frac{1}{2}p_n + \\frac{1}{2}$；\n(2) 构造等比数列 $\\{p_n - \\frac{1}{3}\\}$ 求通项公式 $p_n$，并证明数列在平衡值 $\\frac{1}{3}$ 两侧交替摆动收敛于 $\\frac{1}{3}$。",
    params: { p1: 1.0, p11: 0.0, p21: 0.5, currStep: 1, maxN: 10 },
    labels: {
      s1: "状态 1 (球在甲手中)",
      s2: "状态 2 (球在乙手中)",
      s1Short: "甲 (S₁)",
      s2Short: "乙 (S₂)",
    },
  },
  pass_ball_3: {
    id: "pass_ball_3",
    name: "三人环传问题",
    badge: "高考经典大题 · 三人环传 (对称归并降维)",
    condition:
      "【题目背景】甲、乙、丙三人围成一圈做相互传球游戏。因乙与丙地位完全对称，解题关键在于运用对称性将“球在乙或丙手中”归并为单一对立事件 $\\overline{A_n}$。\n【初始条件】初始球在甲手中 ($p_1 = 1$)。传球规则：甲等可能传给乙或丙（各占 $\\frac{1}{2}$）；乙或丙拿到球后，均有 $\\frac{1}{2}$ 概率回传给甲。",
    question:
      "(1) 说明为何无需设立三元状态，利用对立事件即可列出 $p_{n+1} = -\\frac{1}{2}p_n + \\frac{1}{2}$；\n(2) 求第 $n$ 次传球后球在甲手中的概率通项公式 $p_n$，并求稳态极限。",
    params: { p1: 1.0, p11: 0.0, p21: 0.5, currStep: 1, maxN: 10 },
    labels: {
      s1: "状态 1 (球在甲手中)",
      s2: "状态 2 (球在乙或丙手中)",
      s1Short: "甲 (S₁)",
      s2Short: "乙/丙 (S₂)",
    },
  },
  urn_replace: {
    id: "urn_replace",
    name: "摸球置换问题",
    badge: "高考经典题型 · 摸球置换 (单调收敛)",
    condition:
      "【题目背景】箱内装有黑白两色球。每次从中随机摸出 1 球并按既定规则进行置换更新，研究随摸球次数增加摸出白球的概率演化规律。\n【初始条件】第 1 次摸球确定摸出白球，即先验概率 $p_1 = 1$。置换规则：若摸出白球，以 $0.6$ 概率放回白球 ($p_{11} = 0.6$)；若摸出黑球，以 $0.2$ 概率换入白球 ($p_{21} = 0.2$)。",
    question:
      "(1) 设第 $n$ 次摸出白球的概率为 $p_n$，列全概率展开式建立 $p_{n+1}$ 与 $p_n$ 的递推式；\n(2) 构造辅助等比数列 $\\{p_n - \\frac{1}{3}\\}$，并证明数列 $\\{p_n\\}$ 随摸球次数增加单调递减收敛于 $\\frac{1}{3}$。",
    params: { p1: 1.0, p11: 0.6, p21: 0.2, currStep: 1, maxN: 10 },
    labels: {
      s1: "状态 1 (摸出白球)",
      s2: "状态 2 (摸出黑球)",
      s1Short: "白球 (S₁)",
      s2Short: "黑球 (S₂)",
    },
  },
  game_pingpong: {
    id: "game_pingpong",
    name: "乒乓加赛问题",
    badge: "2021新高考I卷真题 · 比赛局势递推",
    condition:
      "【题目背景】2021新高考I卷压轴大题情境：乒乓球赛加赛阶段双方平局，轮流发球，先净胜 2 分者获胜。考察甲在各轮交替发球中保持领先的概率演化。\n【初始条件】双方平局开局，设甲领先的初始概率 $p_1 = 0.5$。双方轮流发球：甲发球局甲得分的概率为 $0.6$ ($p_{11} = 0.6$)；乙发球局甲得分的概率为 $0.4$ ($p_{21} = 0.4$)。",
    question:
      "(1) 设第 $n$ 轮甲处于领先优势的概率为 $p_n$，由全概率公式列出一阶线性递推式；\n(2) 待定系数构造公比为 $\\lambda = 0.2$ 的辅助等比数列求通项公式 $p_n$，并求甲最终胜出的稳态概率。",
    params: { p1: 0.5, p11: 0.6, p21: 0.4, currStep: 1, maxN: 10 },
    labels: {
      s1: "状态 1 (甲握有发球权/领先)",
      s2: "状态 2 (乙握有发球权/落后)",
      s1Short: "甲领先 (S₁)",
      s2Short: "乙领先 (S₂)",
    },
  },
};
