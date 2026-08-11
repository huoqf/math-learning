import type { KnowledgeNode } from "@/data/types";

export const lineCircleNode: KnowledgeNode = {
  id: "know-line-circle",
  title: "直线与圆的位置关系及相交弦长",
  labTitle: "直线与圆实验室",
  chapter: "解析几何",
  module: "直线与圆",
  importance: "gaokao",
  animationIds: ["anim-line-circle"],
  prerequisites: ["know-line-equation"],
  route: "/line-circle",
};

export const lineCircleLoader = () => import("./LineCircleAnimation");
