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
  background: string;
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

export const FREE_SCENARIO: MarkovPresetScenario = {
  id: "free",
  name: "自由探索模型",
  badge: "自由探索 · 概率递推数列构造",
  background:
    "二状态离散随机转移探究实验，研究一阶线性全概率演变下一阶递推数列通项与渐近行为。",
  condition:
    "设第 $n$ 步处于状态 1 的概率为 $p_n$。自主调节先验概率 $p_1$、单步自保持率 $p_{11}$ 与跨步转移率 $p_{21}$。",
  question:
    "(1) 结合样本空间的完备划分与全概率公式，推导状态概率的一阶线性递推方程；\n(2) 探究递推公比的正负号对数列收敛形态（单调逼近 vs 交替振荡）的决定性规律，并探求平衡稳态极限。",
  params: { p1: 1.0, p11: 0.0, p21: 0.5, currStep: 1, maxN: 10 },
  labels: {
    s1: "状态 1 (事件 A)",
    s2: "状态 2 (对立事件 Ā)",
    s1Short: "状态 1 (S₁)",
    s2Short: "状态 2 (S₂)",
  },
};

export const MARKOV_PRESETS: Record<string, MarkovPresetScenario> = {
  pass_ball_3: {
    id: "pass_ball_3",
    name: "三人传球问题",
    badge: "2020新高考I卷真题 · 三人传球 (对称降维与摆动收敛)",
    background:
      "2020年新高考全国I卷理科数学第21题：甲、乙、丙三人做传球训练，每次持球者等可能地传给另外两人中的任一人。解题关键在于运用对称性将“球在乙或丙手中”归并为单一对立事件 $\\overline{A_n}$。",
    condition:
      "初始球在甲手中，先验概率 $p_1 = 1$。传球规则：甲必传给乙或丙（甲持球留存概率 $p_{11} = 0$）；若球在乙或丙手中，回传给甲的条件概率为 $p_{21} = \\frac{1}{2}$。",
    question:
      "(1) 设第 $n$ 次传球后球在甲手中的概率为 $p_n$，由全概率公式建立数列 $\\{p_n\\}$ 的一阶递推关系式；\n(2) 探究数列 $\\{p_n\\}$ 的通项公式，并证明随着传球次数增加，概率值在某一常数两侧交替振荡衰减收敛。",
    params: { p1: 1.0, p11: 0.0, p21: 0.5, currStep: 1, maxN: 10 },
    labels: {
      s1: "状态 1 (球在甲手中)",
      s2: "状态 2 (球在乙或丙手中)",
      s1Short: "甲 (S₁)",
      s2Short: "乙/丙 (S₂)",
    },
  },
  pass_ball_4: {
    id: "pass_ball_4",
    name: "四人传球问题",
    badge: "经典高考拓展 · 四人传球 (多目标对称拓展)",
    background:
      "经典高考多目标对称拓展：甲、乙、丙、丁四人围成一圈传球训练，每次持球者等可能地传给另外三人中的任一人。",
    condition:
      "初始球在甲手中 ($p_1 = 1$)。传球规则：甲必传给其他三人之一（甲留球概率 $p_{11} = 0$）；若球在另外三人手中，回传给甲的条件概率为 $p_{21} = \\frac{1}{3} \\approx 0.333$。",
    question:
      "(1) 设第 $n$ 次传球后球在甲手中的概率为 $p_n$，利用全概率公式求 $p_{n+1}$ 与 $p_n$ 的递推关系式；\n(2) 求数列 $\\{p_n\\}$ 的通项公式，并对比分析四人传球与三人传球平衡稳态值的差异。",
    params: { p1: 1.0, p11: 0.0, p21: 1 / 3, currStep: 1, maxN: 10 },
    labels: {
      s1: "状态 1 (球在甲手中)",
      s2: "状态 2 (球在乙/丙/丁手中)",
      s1Short: "甲 (S₁)",
      s2Short: "其他三人 (S₂)",
    },
  },
  // 保持旧键兼容
  pass_ball_2020: {
    id: "pass_ball_2020",
    name: "三人传球问题",
    badge: "2020新高考I卷真题 · 三人传球 (对称降维与摆动收敛)",
    background:
      "2020年新高考全国I卷理科数学第21题：甲、乙、丙三人做传球训练，每次持球者等可能地传给另外两人中的任一人。解题关键在于运用对称性将“球在乙或丙手中”归并为单一对立事件 $\\overline{A_n}$。",
    condition:
      "初始球在甲手中，先验概率 $p_1 = 1$。传球规则：甲必传给乙或丙（甲持球留存概率 $p_{11} = 0$）；若球在乙或丙手中，回传给甲的条件概率为 $p_{21} = \\frac{1}{2}$。",
    question:
      "(1) 设第 $n$ 次传球后球在甲手中的概率为 $p_n$，由全概率公式建立数列 $\\{p_n\\}$ 的一阶递推关系式；\n(2) 探究数列 $\\{p_n\\}$ 的通项公式，并证明随着传球次数增加，概率值在某一常数两侧交替振荡衰减收敛。",
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
    background:
      "新高考经典状态更新模型：箱内装有黑白两色球。每次从中随机摸出 1 球并按置换规则更新箱内球的分布，探究摸出白球的概率演化规律。",
    condition:
      "第 1 次摸球确定摸出白球，先验概率 $p_1 = 1$。置换规则：若摸出白球，以 $0.6$ 概率放回白球 ($p_{11} = 0.6$)；若摸出黑球，以 $0.2$ 概率换入白球 ($p_{21} = 0.2$)。",
    question:
      "(1) 设第 $n$ 次摸出白球的概率为 $p_n$，列全概率展开式求数列 $\\{p_n\\}$ 的一阶线性递推方程；\n(2) 求数列 $\\{p_n\\}$ 的通项公式，并证明数列 $\\{p_n\\}$ 随摸球次数增加单调递减且恒大于其极限值。",
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
    background:
      "2021新高考I卷压轴大题情境：乒乓球赛加赛阶段双方轮流发球，先净胜 2 分者获胜。考察甲在各轮交替发球局中保持领先优势的胜率演变规律。",
    condition:
      "首轮甲握有先发球权，处于领先优势的先验概率 $p_1 = 0.75$。双方轮流发球规则：甲发球局甲得分的概率为 $0.6$ ($p_{11} = 0.6$)；乙发球局甲得分的概率为 $0.4$ ($p_{21} = 0.4$)。",
    question:
      "(1) 设第 $n$ 轮甲处于领先优势的概率为 $p_n$，由全概率公式列出相邻轮次胜率的递推关系式；\n(2) 求数列 $\\{p_n\\}$ 的通项公式，并分析随着双方交替发球轮数增加，开局发球优势如何演变。",
    params: { p1: 0.75, p11: 0.6, p21: 0.4, currStep: 1, maxN: 10 },
    labels: {
      s1: "状态 1 (甲握发球权/领先)",
      s2: "状态 2 (乙握发球权/落后)",
      s1Short: "甲领先 (S₁)",
      s2Short: "乙领先 (S₂)",
    },
  },
};
