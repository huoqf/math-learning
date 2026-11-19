import type { KnowledgeNode } from "@/data/types";

export const conicLocusInvariantsNode: KnowledgeNode = {
  id: "know-conic-locus-invariants",
  title: "圆锥曲线第三定义、相关点转移与定值定点（标内通法）",
  labTitle: "轨迹转移、第三定义与定值定点实验室",
  chapter: "解析几何",
  module: "圆锥曲线",
  importance: "hard",
  animationIds: ["anim-conic-locus-invariants"],
  prerequisites: ["know-conic-properties", "know-conic-line"],
  route: "/conic-locus-invariants",
  gaokaoTopic: "conic_geometry",
  questionCategory: "solution_final",
  examMethod: "相关点代入法、中心弦第三定义斜率积与反设直线常规韦达过定点",
  examWeight: 5,
};

export const loader = () =>
  import("./ConicLocusInvariantsPage").then((m) => ({
    default: m.ConicLocusInvariantsPage,
  }));
