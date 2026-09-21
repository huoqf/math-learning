import type { ScenarioSpec } from "@/types/scenario";
import type { DiceEventPreset } from "@/math/probabilityEvents";

export interface ProbabilityEventsParams extends Record<string, unknown> {
  pA: number;
  pB: number;
  overlapRatio: number;
  dicePresetA: DiceEventPreset;
  dicePresetB: DiceEventPreset;
  highlightOp: "none" | "union" | "intersection" | "onlyA" | "onlyB" | "notA";
  activeMode?: "venn" | "discrete";
}

export const DEFAULT_PROBABILITY_EVENTS_PARAMS: ProbabilityEventsParams = {
  pA: 0.45,
  pB: 0.55,
  overlapRatio: 0.4,
  dicePresetA: "sum_even",
  dicePresetB: "same_points",
  highlightOp: "none",
  activeMode: "venn",
};

export type ProbabilityEventsScenarioKey =
  | "free"
  | "disjoint_additive"
  | "opposite_events"
  | "inclusion_relation"
  | "dice_parity_sum"
  | "dice_opposite"
  | "dice_inclusion"
  | "dice_intersection";

export const PROBABILITY_EVENTS_SCENARIOS: Record<
  ProbabilityEventsScenarioKey,
  ScenarioSpec<ProbabilityEventsParams>
> = {
  free: {
    id: "free",
    name: "自由探索",
    badge: "自主探究 · 概率测度与加法",
    background: "随机试验中，必然事件与不可能事件界定了概率取值区间 $[0, 1]$。",
    condition:
      "自由设定两随机事件概率 $P(A) \\in [0, 1]$、$P(B) \\in [0, 1]$ 与重叠程度。",
    question:
      "(1) 拖拽调节重叠因子，求两事件并集的概率 $P(A \\cup B)$；(2) 探究交集 $P(A \\cap B) = 0$ 时加法公式的简化形式。",
    presetParams: {
      pA: 0.45,
      pB: 0.55,
      overlapRatio: 0.4,
      dicePresetA: "sum_even",
      dicePresetB: "same_points",
      highlightOp: "none",
      activeMode: "venn",
    },
    variant: "info",
  },
  disjoint_additive: {
    id: "disjoint_additive",
    name: "互斥加法",
    badge: "课标核心 · 互斥加法公式",
    background:
      "某射击运动员进行单发射击训练，由于单发子弹只能命中一个环数，各环数事件不能同时发生。",
    condition:
      "事件 $A$（命中 10 环，概率 $P(A) = 0.35$）与事件 $B$（命中 9 环，概率 $P(B) = 0.40$）互斥，即 $A \\cap B = \\varnothing$。",
    question:
      "证明事件 $A$ 与 $B$ 互斥，并运用互斥加法公式求单次射击命中不低于 9 环（即 $A \\cup B$）的概率 $P(A \\cup B)$。",
    presetParams: {
      pA: 0.35,
      pB: 0.4,
      overlapRatio: 0.0,
      dicePresetA: "both_odd",
      dicePresetB: "both_even",
      highlightOp: "union",
      activeMode: "venn",
    },
    lockedParamKeys: ["overlapRatio"],
    variant: "primary",
  },
  opposite_events: {
    id: "opposite_events",
    name: "对立事件",
    badge: "高考秒杀 · 对立事件求概率",
    background:
      "工业流水线质量质检中，被检机械零件只有合格与不合格两种互斥且必然发生其一的状态。",
    condition:
      "事件 $A$（合格，概率 $P(A) = 0.85$）与 $\\overline{A}$（不合格）互斥且 $A \\cup \\overline{A} = \\Omega$，满足 $P(A) + P(\\overline{A}) = 1$。",
    question:
      "根据对立事件性质求出现不合格品的概率 $P(\\overline{A}) = 1 - P(A)$，领悟高考“正难则反”逆向破题思想。",
    presetParams: {
      pA: 0.85,
      pB: 0.15,
      overlapRatio: 0.0,
      dicePresetA: "sum_even",
      dicePresetB: "sum_odd",
      highlightOp: "notA",
      activeMode: "venn",
    },
    lockedParamKeys: ["pA", "pB", "overlapRatio"],
    variant: "accent",
  },
  inclusion_relation: {
    id: "inclusion_relation",
    name: "包含关系",
    badge: "基础概念 · 事件包含关系",
    background:
      "在随机事件关系中，若事件 $A$ 发生必然导致事件 $B$ 发生，则称事件 $B$ 包含事件 $A$。",
    condition:
      "事件 $A \\subseteq B$（其中 $P(A) = 0.25, P(B) = 0.65$），事件 $A$ 的发生蕴含事件 $B$ 的发生。",
    question:
      "证明概率单调性 $P(A) \\le P(B)$，并求在事件 $B$ 发生但事件 $A$ 未发生（差事件 $B - A$）的概率 $P(B - A) = P(B) - P(A)$。",
    presetParams: {
      pA: 0.25,
      pB: 0.65,
      overlapRatio: 1.0,
      dicePresetA: "both_odd",
      dicePresetB: "sum_even",
      highlightOp: "onlyB",
      activeMode: "venn",
    },
    lockedParamKeys: ["overlapRatio"],
    variant: "info",
  },
  dice_parity_sum: {
    id: "dice_parity_sum",
    name: "掷双骰子",
    badge: "高考真题 · 离散样本空间列举",
    background:
      "新高考经典古典概型：同时掷两枚质地均匀的骰子，样本空间由 $n(\\Omega) = 6 \\times 6 = 36$ 个等可能点对构成。",
    condition: "事件 $A$ 为“点数之和为偶数”，事件 $B$ 为“两枚骰子点数相同”。",
    question:
      "列举样本点求 $P(A)$、$P(B)$ 及公共点数 $P(A \\cap B)$，并运用广义加法公式计算并事件概率 $P(A \\cup B)$。",
    presetParams: {
      pA: 0.5,
      pB: 0.167,
      overlapRatio: 0.33,
      dicePresetA: "sum_even",
      dicePresetB: "same_points",
      highlightOp: "union",
      activeMode: "discrete",
    },
    variant: "primary",
  },
  dice_opposite: {
    id: "dice_opposite",
    name: "奇偶对立",
    badge: "课标核心 · 离散对立事件",
    background:
      "两枚骰子点数之和要么是奇数，要么是偶数，且只能二选其一，构成两两互斥且全集的典型对立事件。",
    condition:
      "事件 $A$ 为“点数和为偶数”（18 个点），事件 $B$ 为“点数和为奇数”（18 个点）。",
    question:
      "(1) 验证 $A \\cap B = \\varnothing$ 且 $A \\cup B = \\Omega$；(2) 由古典概型验证对立事件概率之和 $P(A) + P(B) = 1.00$。",
    presetParams: {
      pA: 0.5,
      pB: 0.5,
      overlapRatio: 0.0,
      dicePresetA: "sum_even",
      dicePresetB: "sum_odd",
      highlightOp: "union",
      activeMode: "discrete",
    },
    variant: "accent",
  },
  dice_inclusion: {
    id: "dice_inclusion",
    name: "奇偶包含",
    badge: "基础概念 · 离散包含关系",
    background:
      "在骰子试验中，若两枚点数均为偶数，其点数之和必然为偶数，事件 $B$ 发生必然导致事件 $A$ 发生。",
    condition:
      "事件 $A$ 为“点数和为偶数”（包含 18 点），事件 $B$ 为“两枚点数全为偶数”（包含 9 点），满足 $B \\subseteq A$。",
    question:
      "证明事件概率单调性 $P(B) \\le P(A)$，并求差事件 $A - B$（和为偶但全为奇数）的概率 $P(A - B) = P(A) - P(B)$。",
    presetParams: {
      pA: 0.5,
      pB: 0.25,
      overlapRatio: 1.0,
      dicePresetA: "sum_even",
      dicePresetB: "both_even",
      highlightOp: "onlyA",
      activeMode: "discrete",
    },
    variant: "info",
  },
  dice_intersection: {
    id: "dice_intersection",
    name: "相交加法",
    badge: "高考真题 · 离散容斥加法",
    background:
      "高考经典古典概型：同时掷两枚均匀骰子，分析两相交事件的样本点交叉重叠与加法公式。",
    condition:
      "事件 $A$ 为“两数相同”（包含 6 点），事件 $B$ 为“点数和不小于八”（包含 15 点），二者存在公共交集点。",
    question:
      "利用坐标法找出公共点 $(4,4), (5,5), (6,6)$，并运用广义加法公式计算并事件概率 $P(A \\cup B)$。",
    presetParams: {
      pA: 0.167,
      pB: 0.417,
      overlapRatio: 0.33,
      dicePresetA: "same_points",
      dicePresetB: "sum_ge_8",
      highlightOp: "union",
      activeMode: "discrete",
    },
    variant: "primary",
  },
};
