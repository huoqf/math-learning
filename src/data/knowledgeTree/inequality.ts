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
    gaokaoTopic: "func_derivative",
    questionCategory: "solution_first",
    examMethod: "一正二定三相等与积定和最小",
    examWeight: 5,
  },
  {
    id: "know-ineq-absolute",
    title: "绝对值不等式的几何意义",
    labTitle: "绝对值不等式实验室",
    chapter: "不等式",
    module: "绝对值不等式",
    importance: "gaokao",
    animationIds: ["anim-ineq-absolute"],
    prerequisites: ["know-ineq-basic"],
    route: "/inequality-absolute",
    gaokaoTopic: "func_derivative",
    questionCategory: "multi_select_hard",
    examMethod: "数轴零点分段与绝对值距离三角不等式",
    examWeight: 4,
  },
];
