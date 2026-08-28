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

export const markovNode: KnowledgeNode = {
  id: "know-probability-markov",
  title: "全概率公式与马尔可夫链状态转移递推",
  labTitle: "全概与马尔可夫链递推实验室",
  chapter: "概率与统计",
  module: "概率压轴",
  importance: "hard",
  animationIds: ["anim-probability-markov"],
  prerequisites: ["know-probability-bayes"],
  route: "/probability-markov",
};

export const bayesLoader = () => import("./ProbabilityBayesAnimation");
export const markovLoader = () => import("./ProbabilityBayesAnimation");
