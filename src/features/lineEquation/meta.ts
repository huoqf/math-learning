import type { KnowledgeNode } from "@/data/types";

export const lineEquationNode: KnowledgeNode = {
  id: "know-line-equation",
  title: "直线方程与点到直线的距离",
  labTitle: "直线方程与距离实验室",
  chapter: "解析几何",
  module: "直线与圆",
  importance: "basic",
  animationIds: ["anim-line-equation"],
  prerequisites: [],
  route: "/line-equation",
};

export const lineEquationLoader = () => import("./LineEquationAnimation");
