import type { KnowledgeNode } from "@/data/types";

/**
 * 解三角形的边角变换与最值范围
 *
 * 路由映射：
 *   /triangle-extrema → TriangleExtremaAnimation
 */
export const node: KnowledgeNode = {
  id: "know-triangle-extrema",
  title: "解三角形的边角变换与最值范围",
  labTitle: "解三角形边角变换与最值范围实验室",
  chapter: "三角函数",
  module: "解三角形",
  importance: "gaokao",
  animationIds: ["anim-triangle-extrema"],
  prerequisites: ["know-triangle-solve", "know-ineq-basic"],
  route: "/triangle-extrema",
};

/** 动态 loader */
export const loader = () =>
  import("./TriangleExtremaAnimation").then((m) => ({
    default: m.TriangleExtremaAnimation,
  }));
