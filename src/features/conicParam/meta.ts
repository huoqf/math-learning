import type { KnowledgeNode } from "@/data/types";

export const node: KnowledgeNode = {
  id: "know-conic-parametric",
  title: "圆锥曲线与直线的参数方程及设点化简（拓展 · 超出课标）",
  labTitle: "圆锥曲线与直线的参数方程及设点化简实验室",
  chapter: "解析几何",
  module: "解析几何拓展",
  importance: "extend",
  animationIds: ["anim-conic-param"],
  prerequisites: ["know-conic-line"],
  route: "/conic-param",
};

export const loader = () =>
  import("./ConicParamAnimation").then((m) => ({
    default: m.ConicParamAnimation,
  }));

export const meta = {
  node,
  loader,
};
