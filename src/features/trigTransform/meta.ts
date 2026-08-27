import type { KnowledgeNode } from "@/data/types";

export const node: KnowledgeNode = {
  id: "know-trig-transform",
  title: "三角函数 y=Asin(ωx+φ) 图像变换",
  labTitle: "y=Asin(ωx+φ) 图像变换实验室",
  chapter: "三角函数",
  module: "三角函数的图像与性质",
  importance: "core",
  animationIds: ["anim-trig-transform"],
  prerequisites: ["know-trig-lines"],
  route: "/trig-transform",
};

export const loader = () =>
  import("./TrigTransformAnimation").then((m) => ({
    default: m.TrigTransformAnimation,
  }));
