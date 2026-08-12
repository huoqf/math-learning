import type { KnowledgeNode } from "@/data/types";

export const conicParamTNode: KnowledgeNode = {
  id: "know-conic-param-t",
  title: "直线参数方程 t 的几何意义与割线定理",
  labTitle: "直线参数 t 几何意义实验室",
  chapter: "解析几何",
  module: "圆锥曲线压轴",
  importance: "hard",
  animationIds: ["anim-conic-param-t"],
  prerequisites: ["know-conic-parametric"],
  route: "/conic-param-t",
};

export const conicParamTLoader = () =>
  import("./LineParamTAnimation").then((m) => ({
    default: m.LineParamTAnimation,
  }));
