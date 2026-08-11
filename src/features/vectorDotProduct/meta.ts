import type { KnowledgeNode } from "@/data/types";

export const vectorDotProductNode: KnowledgeNode = {
  id: "know-vector-dot-product",
  title: "平面向量的数量积与几何投影",
  labTitle: "平面向量数量积与投影实验室",
  chapter: "平面向量",
  module: "向量数量积与投影",
  importance: "gaokao",
  animationIds: ["anim-vector-dot-product"],
  prerequisites: ["know-vector-linear"],
  route: "/vector-dot-product",
};

export const vectorDotProductLoader = () =>
  import("./VectorDotProductAnimation").then((m) => ({
    default: m.VectorDotProductAnimation,
  }));
