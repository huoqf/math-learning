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
    label: "自保持概率 p₁₁",
    min: 0.0,
    max: 1.0,
    step: 0.05,
    defaultValue: 0.0,
    description: "由状态 1 保持留在状态 1 的单步转移条件概率 P(Sₙ₊₁=1|Sₙ=1)",
  },
  p21: {
    key: "p21",
    label: "跨转移概率 p₂₁",
    min: 0.0,
    max: 1.0,
    step: 0.05,
    defaultValue: 0.5,
    description: "由状态 2 跨步转移到状态 1 的条件概率 P(Sₙ₊₁=1|Sₙ=2)",
  },
  currStep: {
    key: "currStep",
    label: "当前观察步数",
    min: 1,
    max: 15,
    step: 1,
    defaultValue: 1,
    description: "高亮展示特定转移步数 n 的状态分布与全概单步展开",
  },
  maxN: {
    key: "maxN",
    label: "最大模拟步数",
    min: 5,
    max: 15,
    step: 1,
    defaultValue: 10,
    description: "时序演化折线与等比衰减柱的最大观察步数上限",
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
    name: "2020全国卷·甲乙传球 (奇偶振荡)",
    badge: "高考真题 · 甲乙传球模型 (振荡收敛)",
    condition:
      "球初在甲手中 ($p_1 = 1$)。甲必传给乙 ($p_{11} = 0$)，乙等可能传给甲或留在乙手中 ($p_{21} = 0.5$)。",
    question:
      "证明数列 $\\{p_n - \\frac{1}{3}\\}$ 是公比为 $-0.5$ 的等比数列，并求通项公式与极限值。",
    params: { p1: 1.0, p11: 0.0, p21: 0.5, currStep: 1, maxN: 10 },
    labels: {
      s1: "状态 1 (球在甲)",
      s2: "状态 2 (球在乙)",
      s1Short: "甲 (S₁)",
      s2Short: "乙 (S₂)",
    },
  },
  pass_ball_3: {
    id: "pass_ball_3",
    name: "三人环传·对称降维模型",
    badge: "高考经典 · 甲乙丙三人环传 (对称归并)",
    condition:
      "甲传给乙丙的概率均为 $0.5$；乙丙传回甲的概率均为 $0.5$。由对称性将乙、丙合并为对立状态 $S_2$。",
    question:
      "探究利用对称性将 3 状态降维为一阶等比递推的方法，求第 $n$ 次传球后球在甲手中的概率。",
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
    name: "摸球置换·状态更新 (单调收敛)",
    badge: "高考题型 · 摸球置换转移 (单调收敛)",
    condition:
      "袋中装有黑白球，每次取球后按固定规则置换放入新球。自保概率 $p_{11} = 0.6$，跨转概率 $p_{21} = 0.2$。",
    question:
      "求特征公比 $\\lambda$，证明数列 $\\{p_n - \\frac{1}{3}\\}$ 单调递减收敛于稳态值 $\\frac{1}{3}$。",
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
    name: "2021新高考I卷·比赛局势递推",
    badge: "新高考压轴 · 比赛胜负与局势演化",
    condition:
      "乒乓球加赛平局博弈：甲发球得分概率 $0.6$ ($p_{11} = 0.6$)，乙发球甲得分概率 $0.4$ ($p_{21} = 0.4$)，公比 $\\lambda = 0.2 > 0$。",
    question:
      "列出甲领先/平局状态的全概率一阶递推式，求甲最终赢得比赛的获胜概率。",
    params: { p1: 0.5, p11: 0.6, p21: 0.4, currStep: 1, maxN: 10 },
    labels: {
      s1: "状态 1 (甲握有发球权/领先)",
      s2: "状态 2 (乙握有发球权/落后)",
      s1Short: "甲领先 (S₁)",
      s2Short: "乙领先 (S₂)",
    },
  },
  pure_oscillation: {
    id: "pure_oscillation",
    name: "发球互换·永久振荡模型",
    badge: "临界模型 · 公比 λ = -1 永久振荡",
    condition:
      "每局必定互换发球权与局势 ($p_{11} = 0, p_{21} = 1.0$)，特征公比 $\\lambda = -1$。",
    question:
      "探究公比 $\\lambda = -1$ 时，数列在 $0$ 与 $1$ 间等幅振荡、稳态极限不存在的数理机理。",
    params: { p1: 1.0, p11: 0.0, p21: 1.0, currStep: 1, maxN: 10 },
    labels: {
      s1: "状态 1 (甲发球)",
      s2: "状态 2 (乙发球)",
      s1Short: "甲 (S₁)",
      s2Short: "乙 (S₂)",
    },
  },
};
