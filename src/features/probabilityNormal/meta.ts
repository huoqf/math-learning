import type { KnowledgeNode } from "@/data/types";

export const probabilityNormalNode: KnowledgeNode = {
  id: "know-probability-normal",
  title: "频率直方图与正态分布曲线",
  labTitle: "频率分布直方图与正态分布实验室",
  chapter: "概率与统计",
  module: "随机变量及其分布",
  importance: "gaokao",
  animationIds: ["anim-probability-normal"],
  prerequisites: [],
  route: "/statistics-normal",
};

export const probabilityNormalLoader = () =>
  import("./ProbabilityNormalAnimation");
