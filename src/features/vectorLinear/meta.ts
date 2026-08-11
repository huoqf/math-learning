import type { KnowledgeNode } from "@/data/types";

export const vectorLinearNode: KnowledgeNode = {
  id: "know-vector-linear",
  title: "平面向量的线性运算与共线",
  labTitle: "平面向量线性运算实验室",
  chapter: "平面向量",
  module: "向量线性运算与共线",
  importance: "gaokao",
  animationIds: ["anim-vector-linear"],
  prerequisites: [],
  route: "/vector-linear",
};

export const vectorLinearLoader = () =>
  import("./VectorLinearAnimation").then((m) => ({
    default: m.VectorLinearAnimation,
  }));
