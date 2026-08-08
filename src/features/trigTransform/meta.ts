import type { KnowledgeNode } from "@/data/types";

export const node: KnowledgeNode = {
  id: "trig-transform",
  title: "y=Asin(ωx+φ) 图像变换与五点作图",
  chapter: "三角函数",
  module: "高中数学必修一 / 选择性必修",
  importance: "gaokao",
  animationIds: ["anim-trig-transform"],
  prerequisites: ["trig-lines", "trig-identity"],
  route: "/trig-transform",
};

export const loader = () =>
  import("./TrigTransformAnimation").then((m) => ({
    default: m.TrigTransformAnimation,
  }));
