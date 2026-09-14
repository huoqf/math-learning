import type { KnowledgeNode } from "../types";

// ========== 2. 不等式 ==========
export const inequalityNodes: KnowledgeNode[] = [
  {
    id: "know-ineq-basic",
    title: "基本不等式及其几何证明",
    labTitle: "基本不等式实验室",
    chapter: "不等式",
    module: "基本不等式",
    importance: "core",
    animationIds: ["anim-ineq-basic"],
    prerequisites: [],
    route: "/inequality-basic",
    gaokaoTopic: "algebra_basics",
    questionCategory: "solution_first",
    examMethod: "一正二定三相等与积定和最小",
    examWeight: 5,
  },
  {
    id: "know-ineq-absolute",
    title: "绝对值不等式的数轴距离几何模型（拓展 · 选学衔接）",
    labTitle: "绝对值不等式数轴距离实验室",
    chapter: "不等式",
    module: "绝对值不等式",
    importance: "extend",
    animationIds: ["anim-ineq-absolute"],
    prerequisites: ["know-ineq-basic"],
    route: "/inequality-absolute",
    gaokaoTopic: "algebra_basics",
    questionCategory: "multi_select_hard",
    examMethod: "数轴零点分段与绝对值距离三角不等式",
    examWeight: 2,
  },
];
