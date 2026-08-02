import type { KnowledgeNode } from "@/data/types";

export const conicPropertiesNode: KnowledgeNode = {
  id: "know-conic-properties",
  title: "椭圆与双曲线的几何性质及离心率",
  labTitle: "椭圆与双曲线性质实验室",
  chapter: "解析几何",
  module: "圆锥曲线",
  importance: "gaokao",
  animationIds: ["anim-conic-properties"],
  prerequisites: ["know-conic-definition"],
  route: "/conic-properties",
};

export const conicPropertiesLoader = () =>
  import("./ConicPropertiesAnimation").then((m) => ({
    default: m.ConicPropertiesAnimation,
  }));
