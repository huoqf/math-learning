import type { KnowledgeNode } from "@/data/types";

/**
 * 绝对值不等式的几何意义
 *
 * 路由映射：
 *   /inequality-absolute → InequalityAbsoluteAnimation
 */
export const node: KnowledgeNode = {
  id: "know-ineq-absolute",
  title: "绝对值不等式的几何意义",
  labTitle: "绝对值不等式实验室",
  chapter: "不等式",
  module: "绝对值不等式",
  importance: "gaokao",
  animationIds: ["anim-ineq-absolute"],
  prerequisites: ["know-ineq-basic"],
  route: "/inequality-absolute",
};

/** 动态加载器 */
export const loader = () =>
  import("./InequalityAbsoluteAnimation").then((m) => ({
    default: m.InequalityAbsoluteAnimation,
  }));
