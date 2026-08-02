import type { KnowledgeNode } from "@/data/types";

export const parabolaNode: KnowledgeNode = {
  id: "know-conic-parabola",
  title: "抛物线的焦点性质与准线几何",
  labTitle: "抛物线焦点准线实验室",
  chapter: "解析几何",
  module: "圆锥曲线",
  importance: "gaokao",
  animationIds: ["anim-conic-parabola"],
  prerequisites: ["know-conic-definition"],
  route: "/conic-parabola",
};

export const parabolaLoader = () =>
  import("./ParabolaAnimation").then((m) => ({
    default: m.ParabolaAnimation,
  }));
