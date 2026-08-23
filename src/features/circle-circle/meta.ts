import type { KnowledgeNode } from "@/data/types";

export const circleCircleNode: KnowledgeNode = {
  id: "know-circle-circle",
  title: "圆与圆的位置关系及公共弦方程",
  labTitle: "圆与圆实验室",
  chapter: "解析几何",
  module: "直线与圆",
  importance: "gaokao",
  animationIds: ["anim-circle-circle"],
  prerequisites: ["know-line-circle"],
  route: "/circle-circle",
};

export const circleCircleLoader = () => import("./CircleCircleAnimation");
