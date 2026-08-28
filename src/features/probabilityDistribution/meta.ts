import type { KnowledgeNode } from "@/data/types";

export const probabilityDistributionNode: KnowledgeNode = {
  id: "know-probability-distribution",
  title: "离散型随机变量分布列与数字特征",
  labTitle: "离散型随机变量分布列与数字特征",
  chapter: "概率与统计",
  module: "随机变量及其分布",
  importance: "gaokao",
  animationIds: ["anim-probability-distribution"],
  prerequisites: ["know-probability-bayes"],
  route: "/probability-distribution",
};

export const probabilityDistributionLoader = () =>
  import("./ProbabilityDistributionAnimation");
