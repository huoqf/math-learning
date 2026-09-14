import type { KnowledgeNode } from "@/data/types";

export const node: KnowledgeNode = {
  id: "know-conic-parametric",
  title: "圆锥曲线参数化设点与代数降维化简（新高考运算优化）",
  labTitle: "圆锥曲线参数化设点与代数降维实验室",
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
