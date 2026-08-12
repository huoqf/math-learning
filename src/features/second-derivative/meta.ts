import type { KnowledgeNode } from "@/data/types";

export const secondDerivativeNode: KnowledgeNode = {
  id: "know-derivative-inflection",
  title: "二阶导数、拐点与函数凹凸性",
  labTitle: "二阶导数与拐点实验室",
  chapter: "导数及其应用",
  module: "导数压轴",
  importance: "hard",
  animationIds: ["anim-derivative-inflection"],
  prerequisites: ["know-derivative-compare"],
  route: "/derivative-inflection",
};

export const secondDerivativeLoader = () =>
  import("./SecondDerivativeAnimation").then((m) => ({
    default: m.SecondDerivativeAnimation,
  }));

export const node = secondDerivativeNode;
export const loader = secondDerivativeLoader;
