import type { KnowledgeNode } from "@/data/types";

export const parabolaArchimedesNode: KnowledgeNode = {
  id: "know-parabola-archimedes",
  title: "抛物线焦点弦性质与阿基米德三角形",
  labTitle: "抛物线阿基米德三角形实验室",
  chapter: "解析几何",
  module: "圆锥曲线压轴",
  importance: "hard",
  animationIds: ["anim-parabola-archimedes"],
  prerequisites: ["know-conic-parabola", "know-conic-line"],
  route: "/parabola-archimedes",
  gaokaoTopic: "conic_geometry",
  questionCategory: "multi_select_hard",
  examMethod: "焦半径调和中项、垂直弦斜率积与切线交点性质",
  examWeight: 5,
};

export const parabolaArchimedesLoader = () =>
  import("./ParabolaArchimedesAnimation").then((m) => ({
    default: m.ParabolaArchimedesAnimation,
  }));
