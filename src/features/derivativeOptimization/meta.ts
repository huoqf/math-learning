import type { KnowledgeNode } from "@/data/types";

export const derivativeOptimizationNode: KnowledgeNode = {
  id: "know-derivative-optimization",
  title: "导数在实际生活中的优化建模",
  labTitle: "导数优化建模实验室",
  chapter: "导数及其应用",
  module: "导数的应用",
  importance: "gaokao",
  animationIds: ["anim-derivative-optimization"],
  prerequisites: ["know-derivative-compare"],
  route: "/derivative-optimization",
  gaokaoTopic: "func_derivative",
  questionCategory: "solution_first",
  examMethod: "实际优化问题函数建构与导数极值分析",
  examWeight: 5,
};

export const derivativeOptimizationLoader = () =>
  import("./DerivativeOptimizationAnimation");
