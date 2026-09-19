import { MATH_COLORS } from "@/theme";
import type { ScenarioSpec } from "@/types/scenario";
import type { DiscreteDiceEventKey } from "@/math/probabilityIndependence";
import { getIndependentRatio } from "@/math/probabilityIndependence";

export interface ProbabilityIndependenceParams {
  [key: string]: unknown;
  pA: number;
  pB: number;
  overlapRatio: number;
  dicePresetA: DiscreteDiceEventKey;
  dicePresetB: DiscreteDiceEventKey;
  activeMode: "venn" | "discrete";
}

export type ProbabilityIndependenceScenarioKey =
  | "independent_model"
  | "exclusive_model"
  | "conditional_test"
  | "free_explore"
  | "dice_independent"
  | "dice_exclusive"
  | "dice_correlated"
  | "dice_free";

export const DEFAULT_PROBABILITY_INDEPENDENCE_PARAMS: ProbabilityIndependenceParams =
  {
    pA: 0.5,
    pB: 0.4,
    overlapRatio: getIndependentRatio(0.5, 0.4),
    dicePresetA: "even",
    dicePresetB: "le4",
    activeMode: "venn",
  };

export const PROBABILITY_INDEPENDENCE_PARAM_META = {
  pA: {
    label:
      "\\text{事件 A 概率 } \\color{" + MATH_COLORS.paramPrimary + "}{P(A)}",
    min: 0.1,
    max: 0.9,
    step: 0.05,
    color: MATH_COLORS.paramPrimary,
  },
  pB: {
    label:
      "\\text{事件 B 概率 } \\color{" + MATH_COLORS.paramSecondary + "}{P(B)}",
    min: 0.1,
    max: 0.9,
    step: 0.05,
    color: MATH_COLORS.paramSecondary,
  },
  overlapRatio: {
    label:
      "\\text{交集重叠因子 } \\color{" +
      MATH_COLORS.paramTertiary +
      "}{\\lambda}",
    min: 0,
    max: 1,
    step: 0.01,
    color: MATH_COLORS.paramTertiary,
  },
};

export const PROBABILITY_INDEPENDENCE_SCENARIOS: Record<
  ProbabilityIndependenceScenarioKey,
  ScenarioSpec<ProbabilityIndependenceParams>
> = {
  independent_model: {
    id: "independent_model",
    name: "独立但不互斥",
    badge: "乘法公式 · P(AB)=P(A)P(B)",
    background:
      "在质检抽检或射击命中等双事件模型中，事件 $A$ 的发生对事件 $B$ 的概率无任何影响。",
    condition:
      "已知事件 $A$ 发生概率为 $P(A) = 0.50$，事件 $B$ 发生概率为 $P(B) = 0.40$。",
    question:
      "根据独立性定义，积事件概率 $P(AB)$ 应为多少？两事件是否可能互斥？",
    presetParams: {
      pA: 0.5,
      pB: 0.4,
      overlapRatio: getIndependentRatio(0.5, 0.4),
      dicePresetA: "even",
      dicePresetB: "le4",
      activeMode: "venn",
    },
  },
  exclusive_model: {
    id: "exclusive_model",
    name: "互斥则必不独立",
    badge: "加法公式 · P(AB)=0",
    background:
      "在单次试验分类讨论中，事件 $A$ 与 $B$ 不可能同时发生，即两集合几何无交集。",
    condition:
      "事件 $A$ 与 $B$ 互斥，且 $P(A) = 0.40 > 0$，$P(B) = 0.50 > 0$。",
    question:
      "证明为何正概率互斥事件积事件 $P(AB) = 0 \\ne P(A)P(B)$，从而必定不独立？",
    presetParams: {
      pA: 0.4,
      pB: 0.5,
      overlapRatio: 0,
      dicePresetA: "even",
      dicePresetB: "odd",
      activeMode: "venn",
    },
  },
  conditional_test: {
    id: "conditional_test",
    name: "条件概率等价判据",
    badge: "判据验证 · P(B|A)=P(B)",
    background:
      "在信息论与贝叶斯推断视角下，独立性意味着‘无信息增益’，已知 $A$ 并不改变 $B$ 的信念。",
    condition:
      "设定 $P(A) = 0.60$，$P(B) = 0.50$，交集测度满足 $P(AB) = 0.30$。",
    question:
      "求解条件概率 $P(B|A)$，探究为何此时后验条件概率恒等于先验无条件概率 $P(B)$？",
    presetParams: {
      pA: 0.6,
      pB: 0.5,
      overlapRatio: getIndependentRatio(0.6, 0.5),
      dicePresetA: "even",
      dicePresetB: "le4",
      activeMode: "venn",
    },
  },
  free_explore: {
    id: "free_explore",
    name: "连续自由探索",
    badge: "数形测度 · 动态滑块调节",
    background: "连续概率测度空间中，探索交集测度从零到最大的连续相变过程。",
    condition:
      "支持自由调节 $P(A), P(B)$ 与重叠度因子，实时对比乘积与交集测度。",
    question:
      "调节交集重叠因子 $\\lambda$，求解积事件测度 $P(AB)$ 满足独立充要条件时的理论取值，并判定两集合何时互斥？",
    presetParams: {
      pA: 0.5,
      pB: 0.4,
      overlapRatio: 0.2,
      dicePresetA: "even",
      dicePresetB: "prime",
      activeMode: "venn",
    },
  },
  dice_independent: {
    id: "dice_independent",
    name: "骰子独立模型",
    badge: "离散等可能 · 样本空间验证",
    background:
      "抛掷一枚质地均匀的骰子，考察偶数点事件 $A=\\{2,4,6\\}$ 与不大于4点事件 $B=\\{1,2,3,4\\}$。",
    condition:
      "样本空间 $\\Omega = \\{1, 2, 3, 4, 5, 6\\}$，基本事件等可能发生。",
    question:
      "分别计算 $P(A), P(B), P(AB)$，检验乘法公式 $P(AB) = P(A)P(B)$ 是否严格成立？",
    presetParams: {
      pA: 0.5,
      pB: 4 / 6,
      overlapRatio: getIndependentRatio(0.5, 4 / 6),
      dicePresetA: "even",
      dicePresetB: "le4",
      activeMode: "discrete",
    },
  },
  dice_exclusive: {
    id: "dice_exclusive",
    name: "骰子互斥模型",
    badge: "离散等可能 · 对立与互斥",
    background:
      "抛掷一枚质地均匀的骰子，考察偶数点事件 $A=\\{2,4,6\\}$ 与奇数点事件 $C=\\{1,3,5\\}$。",
    condition:
      "事件 $A$ 与 $C$ 属于同一次试验中不可兼得的结果，且 $A \\cup C = \\Omega$。",
    question:
      "求交集 $A \\cap C$ 及概率 $P(AC)$，判定 $A$ 与 $C$ 是互斥还是相互独立？",
    presetParams: {
      pA: 0.5,
      pB: 0.5,
      overlapRatio: 0,
      dicePresetA: "even",
      dicePresetB: "odd",
      activeMode: "discrete",
    },
  },
  dice_correlated: {
    id: "dice_correlated",
    name: "骰子相交相关",
    badge: "离散等可能 · 相交不独立",
    background:
      "抛掷一枚质地均匀的骰子，考察偶数点事件 $A=\\{2,4,6\\}$ 与质数点事件 $E=\\{2,3,5\\}$。",
    condition:
      "两事件仅有一个共有点 $2$，即 $A \\cap E = \\{2\\}$，积事件概率 $P(AE) = 1/6$。",
    question:
      "计算乘积 $P(A)P(E) = 1/4$，对比实际交集 $P(AE) = 1/6$，判定为何两事件相交却不独立？",
    presetParams: {
      pA: 0.5,
      pB: 0.5,
      overlapRatio: 0.33,
      dicePresetA: "even",
      dicePresetB: "prime",
      activeMode: "discrete",
    },
  },
  dice_free: {
    id: "dice_free",
    name: "骰子自由探究",
    badge: "离散等可能 · 自由组合",
    background:
      "在单颗骰子试验中任选两事件，系统自动计算交集、并集、先验与条件概率。",
    condition:
      "自由切换事件 $A$ 与事件 $B$ 的点数规则，探究独立与互斥的充要条件。",
    question:
      "任选两类不同事件，求其交集概率 $P(AB)$ 与先验乘积 $P(A)P(B)$，判定两事件是否相互独立？",
    presetParams: {
      pA: 0.5,
      pB: 4 / 6,
      overlapRatio: getIndependentRatio(0.5, 4 / 6),
      dicePresetA: "even",
      dicePresetB: "le4",
      activeMode: "discrete",
    },
  },
};
