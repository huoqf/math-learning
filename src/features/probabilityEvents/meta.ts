import type { KnowledgeNode } from "@/data/types";

export const probabilityEventsNode: KnowledgeNode = {
  id: "know-probability-events",
  title: "随机事件与概率的基本性质",
  labTitle: "随机事件与概率基本性质实验室",
  chapter: "概率与统计",
  module: "概率基础",
  importance: "basic",
  animationIds: ["anim-probability-events"],
  prerequisites: [],
  route: "/probability-events",
  gaokaoTopic: "probability_statistics",
  questionCategory: "foundation",
  examMethod: "样本空间书写、互斥与对立事件的概率加法公式",
  examWeight: 3,
};

export const probabilityEventsLoader = () =>
  import("./ProbabilityEventsAnimation");
