import type { KnowledgeNode } from "@/data/types";

export const probabilityCountingNode: KnowledgeNode = {
  id: "know-probability-counting",
  title: "计数原理与二项式定理",
  labTitle: "计数原理与二项式定理实验室",
  chapter: "概率与统计",
  module: "排列组合",
  importance: "core",
  animationIds: ["anim-probability-counting"],
  prerequisites: [],
  route: "/probability-counting",
};

export const probabilityCountingLoader = () =>
  import("./ProbabilityCountingAnimation");
