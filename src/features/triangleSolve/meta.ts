import type { KnowledgeNode } from "@/data/types";

/**
 * 正弦定理、余弦定理与解三角形
 *
 * 路由映射：
 *   /triangle-solve → TriangleSolveAnimation
 */
export const node: KnowledgeNode = {
  id: "know-triangle-solve",
  title: "正弦定理、余弦定理与解三角形",
  labTitle: "解三角形实验室",
  chapter: "三角函数",
  module: "解三角形",
  importance: "gaokao",
  animationIds: ["anim-triangle-solve"],
  prerequisites: [],
  route: "/triangle-solve",
};

/** 独立 loader */
export const loader = () => import("./TriangleSolveAnimation").then(m => ({ default: m.TriangleSolveAnimation }));
