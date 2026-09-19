import type { KnowledgeNode } from "@/data/types";

export const probabilityIndependenceNode: KnowledgeNode = {
  id: "know-probability-independence",
  title: "事件的相互独立性与互斥的辨析",
  labTitle: "事件独立性与互斥辨析实验室",
  chapter: "概率与统计",
  module: "概率基础",
  importance: "core",
  animationIds: ["anim-probability-independence"],
  prerequisites: ["know-probability-classical"],
  route: "/probability-independence",
  gaokaoTopic: "probability_statistics",
  questionCategory: "solution_first",
  examMethod: "独立事件乘法公式 $P(AB)=P(A)P(B)$ 与互斥加法公式的辨析",
  examWeight: 4,
};

export const probabilityIndependenceLoader = () =>
  import("./ProbabilityIndependenceAnimation");
