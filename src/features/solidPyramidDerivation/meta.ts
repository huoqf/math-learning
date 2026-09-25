import type { KnowledgeNode } from "@/data/types";

export const solidPyramidDerivationNode: KnowledgeNode = {
  id: "know-solid-pyramid-derivation",
  title: "锥体体积公式推导与刘徽割体术（阳马与鳖臑）",
  labTitle: "锥体体积推导与割体术实验室",
  chapter: "立体几何与空间向量",
  module: "立体几何",
  importance: "core",
  animationIds: ["anim-solid-pyramid-derivation"],
  prerequisites: ["know-solid-rotation-body"],
  route: "/solid-pyramid-derivation",
  gaokaoTopic: "solid_geometry",
  questionCategory: "foundation",
  examMethod: "三棱柱对角剖分三等分与刘徽阳马鳖臑割体术",
  examWeight: 4,
};

export const solidPyramidDerivationLoader = () =>
  import("./PyramidDerivationAnimation");
