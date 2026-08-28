import type { KnowledgeNode } from "@/data/types";

export const arithmeticSequenceNode: KnowledgeNode = {
  id: "know-sequence-geom",
  title: "等差数列通项与求和",
  labTitle: "等差数列实验室",
  chapter: "数列",
  module: "等差与等比数列",
  importance: "core",
  animationIds: ["anim-sequence"],
  prerequisites: [],
  route: "/sequence-arithmetic",
};

export const geometricSequenceNode: KnowledgeNode = {
  id: "know-sequence-geometric",
  title: "等比数列通项与求和",
  labTitle: "等比数列实验室",
  chapter: "数列",
  module: "等差与等比数列",
  importance: "core",
  animationIds: ["anim-sequence-geom"],
  prerequisites: [],
  route: "/sequence-geometric",
};

export const recurrenceSequenceNode: KnowledgeNode = {
  id: "know-sequence-recurrence",
  title: "递推数列与构造法求通项",
  labTitle: "递推与构造法实验室",
  chapter: "数列",
  module: "数列递推",
  importance: "hard",
  animationIds: ["anim-sequence-recurrence"],
  prerequisites: ["know-sequence-geom"],
  route: "/sequence-recurrence",
};

export const modelsSequenceNode: KnowledgeNode = {
  id: "know-sequence-sum",
  title: "高考求和模型",
  labTitle: "高考求和模型实验室",
  chapter: "数列",
  module: "数列求和",
  importance: "gaokao",
  animationIds: ["anim-sequence-sum"],
  prerequisites: ["know-sequence-geom"],
  route: "/sequence-models",
};

export const arithmeticSequenceLoader = () => import("./ArithmeticPage");
export const geometricSequenceLoader = () => import("./GeometricPage");
export const recurrenceSequenceLoader = () => import("./RecurrencePage");
export const modelsSequenceLoader = () => import("./ModelsPage");
