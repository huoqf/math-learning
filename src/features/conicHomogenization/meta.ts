import type { KnowledgeNode } from "@/data/types";

export const node: KnowledgeNode = {
  id: "know-conic-homogenization",
  title: "非对称齐次化求斜率和/斜率积",
  labTitle: "非对称齐次化实验室",
  chapter: "解析几何",
  module: "圆锥曲线压轴",
  importance: "hard",
  animationIds: ["anim-conic-homogenization"],
  prerequisites: ["know-conic-line"],
  route: "/conic-homogenization",
};

export const loader = () =>
  import("./ConicHomogenizationAnimation").then((m) => ({
    default: m.ConicHomogenizationAnimation,
  }));

export const meta = {
  node,
  loader,
};
