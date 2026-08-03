import type { KnowledgeNode } from "@/data/types";

export const node: KnowledgeNode = {
  id: "know-conic-line",
  title: "直线与圆锥曲线位置关系与弦长",
  labTitle: "直线与圆锥曲线位置关系与弦长实验室",
  chapter: "解析几何",
  module: "圆锥曲线",
  importance: "hard",
  animationIds: ["anim-conic-line"],
  prerequisites: ["know-conic-properties"],
  route: "/conic-line",
};

export const loader = () =>
  import("./ConicLineAnimation").then((m) => ({
    default: m.ConicLineAnimation,
  }));

export const meta = {
  node,
  loader,
};
