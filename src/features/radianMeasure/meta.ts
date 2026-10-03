import type { KnowledgeNode } from "@/data/types";

export const radianMeasureNode: KnowledgeNode = {
  id: "know-radian-measure",
  title: "弧度制、弧长与扇形面积",
  labTitle: "弧度制与扇形面积实验室",
  chapter: "三角函数",
  module: "三角函数概念",
  importance: "core",
  animationIds: ["anim-radian-measure"],
  prerequisites: ["know-func-properties"],
  route: "/radian-measure",
};

export const radianMeasureLoader = () => import("./RadianMeasureAnimation");
