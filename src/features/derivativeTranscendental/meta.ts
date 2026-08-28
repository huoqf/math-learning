import type { KnowledgeNode } from "@/data/types";

export const derivativeTranscendentalNode: KnowledgeNode = {
  id: "know-derivative-transcendental",
  title: "基准超越函数与切线放缩模型",
  labTitle: "基准超越函数与切线放缩模型",
  chapter: "导数及其应用",
  module: "导数压轴",
  importance: "hard",
  animationIds: ["anim-derivative-transcendental"],
  prerequisites: ["know-derivative-compare"],
  route: "/derivative-transcendental",
};

export const derivativeTranscendentalLoader = () =>
  import("./TranscendentalAnimation");
