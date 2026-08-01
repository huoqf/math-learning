import type { KnowledgeNode } from "@/data/types";

export const trigLinesNode: KnowledgeNode = {
  id: "know-trig-lines",
  title: "任意角与单位圆中的三角函数线",
  labTitle: "三角函数线实验室",
  chapter: "三角函数",
  module: "三角函数概念",
  importance: "gaokao",
  animationIds: ["anim-trig-lines"],
  prerequisites: ["know-func-properties"],
  route: "/trig-lines",
};

export const trigLinesLoader = () => import("./TrigLinesAnimation");
