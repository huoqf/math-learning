import type { KnowledgeNode } from "@/data/types";

export const classicalProbabilityNode: KnowledgeNode = {
  id: "know-probability-classical",
  title: "古典概型与有限样本空间概率计算",
  labTitle: "古典概型实验室",
  chapter: "概率与统计",
  module: "概率基础",
  importance: "core",
  animationIds: ["anim-probability-classical"],
  prerequisites: ["know-probability-events"],
  route: "/probability-classical",
  gaokaoTopic: "probability_statistics",
  questionCategory: "foundation",
  examMethod: "列举法（树状图/列表）求等可能基本事件数并算比值",
  examWeight: 4,
};

export const classicalProbabilityLoader = () =>
  import("./ProbabilityClassicalAnimation");
