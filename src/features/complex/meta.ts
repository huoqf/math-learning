import type { KnowledgeNode } from "@/data/types";

export const complexNode: KnowledgeNode = {
  id: "know-complex-geometry",
  title: "复数的几何意义与乘法旋转",
  labTitle: "复数的几何意义与乘法旋转实验室",
  chapter: "平面向量与复数",
  module: "复数",
  importance: "gaokao",
  animationIds: ["anim-complex-geometry"],
  prerequisites: ["know-vector-linear"],
  route: "/complex-geometric",
};

export const complexLoader = () =>
  import("./ComplexAnimation").then((m) => ({
    default: m.ComplexAnimation,
  }));
