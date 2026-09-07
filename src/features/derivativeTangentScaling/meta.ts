import type { KnowledgeNode } from "@/data/types";

export const derivativeTangentScalingNode: KnowledgeNode = {
  id: "know-derivative-tangent-scaling",
  title: "导数切线放缩与双切线卡位",
  labTitle: "切线放缩与双切线卡位实验室",
  chapter: "导数及其应用",
  module: "导数压轴",
  importance: "hard",
  animationIds: ["anim-derivative-tangent-scaling"],
  prerequisites: ["know-derivative-compare", "know-derivative-constant"],
  route: "/derivative-tangent-scaling",
  gaokaoTopic: "func_derivative",
  questionCategory: "solution_final",
  examMethod: "指对切线放缩 ($e^x\\ge x+1$, $\\ln x\\le x-1$) 与双侧卡位",
  examWeight: 5,
};

export const derivativeTangentScalingLoader = () =>
  import("./TangentScalingAnimation");
