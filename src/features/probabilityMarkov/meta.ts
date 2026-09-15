import type { KnowledgeNode } from "@/data/types";

export const markovNode: KnowledgeNode = {
  id: "know-probability-markov",
  title: "全概率公式与概率递推数列模型（新高考压轴大题）",
  labTitle: "全概与概率递推数列实验室",
  chapter: "概率与统计",
  module: "概率压轴",
  importance: "hard",
  animationIds: ["anim-probability-markov"],
  prerequisites: ["know-probability-bayes"],
  route: "/probability-markov",
};

export const markovLoader = () => import("./ProbabilityMarkovAnimation");
