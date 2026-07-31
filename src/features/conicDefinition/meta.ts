import type { KnowledgeNode } from "@/data/types";

export const conicDefinitionNode: KnowledgeNode = {
  id: "know-conic-definition",
  title: "圆锥曲线的定义与轨迹生成",
  labTitle: "圆锥曲线定义与轨迹实验室",
  chapter: "解析几何",
  module: "圆锥曲线",
  importance: "gaokao",
  animationIds: ["anim-conic-definition"],
  prerequisites: [],
  route: "/conic-definition",
};

export const conicDefinitionLoader = () => import("./ConicDefinitionAnimation");
