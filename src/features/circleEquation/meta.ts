import type { KnowledgeNode } from "@/data/types";

export const circleEquationNode: KnowledgeNode = {
  id: "know-circle-equation",
  title: "圆的方程与待定系数法",
  labTitle: "圆的方程实验室",
  chapter: "解析几何",
  module: "直线与圆",
  importance: "basic",
  animationIds: ["anim-circle-equation"],
  prerequisites: ["know-line-equation"],
  route: "/circle-equation",
  gaokaoTopic: "conic_geometry",
  questionCategory: "foundation",
  examMethod: "圆的标准方程配方与待定系数法",
  examWeight: 5,
};

export const circleEquationLoader = () => import("./CircleEquationAnimation");
