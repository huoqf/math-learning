import type { KnowledgeNode } from "@/data/types";

export const derivativeOperationsNode: KnowledgeNode = {
  id: "know-derivative-operations",
  title: "导数的四则运算法则与几何直观",
  labTitle: "导数四则运算法则实验室",
  chapter: "导数及其应用",
  module: "导数概念与运算",
  importance: "basic",
  animationIds: ["anim-derivative-operations"],
  prerequisites: ["know-derivative-formulas"],
  route: "/derivative-operations",
  gaokaoTopic: "func_derivative",
  questionCategory: "solution_first",
  examMethod: "积商运算法则拆解与面积增量几何直观",
  examWeight: 5,
};

export const derivativeOperationsLoader = () =>
  import("./DerivativeOperationsAnimation");
