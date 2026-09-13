import type { KnowledgeNode } from "@/data/types";

export const node: KnowledgeNode = {
  id: "know-conic-homogenization",
  title: "圆锥曲线齐次化与斜率韦达定理",
  labTitle: "齐次化与斜率韦达定理实验室",
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
