import type { KnowledgeNode } from "../types";

// ========== 7. 数列 ==========
export const sequenceNodes: KnowledgeNode[] = [
  {
    id: "know-sequence-geom",
    title: "等差数列通项与求和",
    labTitle: "等差数列实验室",
    chapter: "数列",
    module: "等差与等比数列",
    importance: "core",
    animationIds: ["anim-sequence-arithmetic", "anim-sequence"],
    prerequisites: [],
    route: "/sequence-arithmetic",
    gaokaoTopic: "sequence_series",
    questionCategory: "solution_first",
    examMethod: "下角标和等和性质与前n项和二次函数",
    examWeight: 5,
    crossThemes: ["Sn与an互化作差分段检验", "二次函数视角求Sn最值"],
  },
  {
    id: "know-sequence-geometric",
    title: "等比数列通项与求和",
    labTitle: "等比数列实验室",
    chapter: "数列",
    module: "等差与等比数列",
    importance: "core",
    animationIds: ["anim-sequence-geometric", "anim-sequence-geom"],
    prerequisites: [],
    route: "/sequence-geometric",
    gaokaoTopic: "sequence_series",
    questionCategory: "solution_first",
    examMethod: "等比乘积性质与公比 q≠1 分类讨论",
    examWeight: 5,
    crossThemes: ["指数函数与等比数列单调比对", "等比片段和与数列极值项"],
  },
  {
    id: "know-sequence-sum",
    title: "高考求和模型",
    labTitle: "高考求和模型实验室",
    chapter: "数列",
    module: "数列求和",
    importance: "gaokao",
    animationIds: ["anim-sequence-sum", "anim-sequence-models"],
    prerequisites: ["know-sequence-geom"],
    route: "/sequence-models",
    gaokaoTopic: "sequence_series",
    questionCategory: "solution_first",
    examMethod: "错位相减、裂项相消与放缩不等式证明",
    examWeight: 5,
    crossThemes: ["分式裂项放缩与数列不等式", "奇偶并项与绝对值分段求和"],
  },
  {
    id: "know-sequence-recurrence",
    title: "递推数列与构造法求通项",
    labTitle: "递推与构造法实验室",
    chapter: "数列",
    module: "数列递推",
    importance: "hard",
    animationIds: ["anim-sequence-recurrence"],
    prerequisites: ["know-sequence-geom"],
    route: "/sequence-recurrence",
    gaokaoTopic: "sequence_series",
    questionCategory: "solution_final",
    examMethod: "待定系数构造、Sn与an混合作差及新定义差分探索",
    examWeight: 5,
    crossThemes: ["概率递推数列与构造等比交汇", "数学归纳法证明通项不等式"],
  },
];

export const arithmeticSequenceNode = sequenceNodes[0];
export const geometricSequenceNode = sequenceNodes[1];
export const modelsSequenceNode = sequenceNodes[2];
export const recurrenceSequenceNode = sequenceNodes[3];
