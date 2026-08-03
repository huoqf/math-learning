import type { KnowledgeNode } from "@/data/types";

export const node: KnowledgeNode = {
  id: "know-conic-parametric",
  title: "圆锥曲线与直线的参数方程及设点化简",
  labTitle: "圆锥曲线与直线的参数方程及设点化简实验室",
  chapter: "解析几何",
  module: "圆锥曲线",
  importance: "hard",
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
