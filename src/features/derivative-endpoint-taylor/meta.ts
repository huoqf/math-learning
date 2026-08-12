import type { KnowledgeNode } from "@/data/types";

export const node: KnowledgeNode = {
  id: "know-derivative-endpoint",
  title: "端点效应与洛必达/泰勒拟合放缩",
  labTitle: "端点效应与放缩实验室",
  chapter: "导数及其应用",
  module: "导数压轴",
  importance: "hard",
  animationIds: ["anim-derivative-endpoint"],
  prerequisites: ["know-derivative-transcendental"],
  route: "/derivative-endpoint",
};

export const loader = () =>
  import("./DerivativeEndpointTaylorAnimation").then((m) => ({
    default: m.DerivativeEndpointTaylorAnimation,
  }));
