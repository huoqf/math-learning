import type { KnowledgeNode } from "@/data/types";

/**
 * 绝对值不等式的几何意义
 *
 * 路由映射：
 *   /inequality-absolute → InequalityAbsoluteAnimation
 */
export const node: KnowledgeNode = {
  id: "know-ineq-absolute",
  title: "绝对值不等式的数轴距离几何模型（拓展 · 选学衔接）",
  labTitle: "绝对值不等式数轴距离实验室",
  chapter: "不等式",
  module: "绝对值不等式",
  importance: "extend",
  animationIds: ["anim-ineq-absolute"],
  prerequisites: ["know-ineq-basic"],
  route: "/inequality-absolute",
};

/** 动态加载器 */
export const loader = () =>
  import("./InequalityAbsoluteAnimation").then((m) => ({
    default: m.InequalityAbsoluteAnimation,
  }));
