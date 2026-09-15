import type { KnowledgeNode } from "@/data/types";

export const bayesNode: KnowledgeNode = {
  id: "know-probability-bayes",
  title: "条件概率、全概率公式与贝叶斯",
  labTitle: "条件概率与贝叶斯实验室",
  chapter: "概率与统计",
  module: "古典与条件概率",
  importance: "gaokao",
  animationIds: ["anim-probability-bayes"],
  prerequisites: [],
  route: "/probability-bayes",
};

export const bayesLoader = () => import("./ProbabilityBayesAnimation");
