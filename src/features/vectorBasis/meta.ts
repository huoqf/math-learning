import type { KnowledgeNode } from "@/data/types";

export const vectorBasisNode: KnowledgeNode = {
  id: "know-vector-basis",
  title: "平面向量基本定理与基底分解",
  labTitle: "平面向量基本定理与基底分解实验室",
  chapter: "平面向量与复数",
  module: "平面向量",
  importance: "gaokao",
  animationIds: ["anim-vector-basis"],
  prerequisites: ["know-vector-linear"],
  route: "/vector-basis",
};

export const vectorBasisLoader = () =>
  import("./VectorBasisAnimation").then((m) => ({
    default: m.VectorBasisAnimation,
  }));
