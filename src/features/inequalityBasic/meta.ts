import type { KnowledgeNode } from "@/data/types";

/**
 * InequalityBasic feature — 知识节点声明
 * 路由映射：/inequality-basic -> InequalityBasicAnimation
 */
export const inequalityBasicNode: KnowledgeNode = {
  id: "know-ineq-basic",
  title: "基本不等式及其几何证明",
  labTitle: "基本不等式实验室",
  chapter: "不等式",
  module: "基本不等式",
  importance: "core",
  animationIds: ["anim-ineq-basic"],
  prerequisites: [],
  route: "/inequality-basic",
};

export const inequalityBasicLoader = () => import("./InequalityBasicAnimation");
