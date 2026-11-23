import type { KnowledgeNode } from "@/data/types";

export const conicAsymmetricVietaNode: KnowledgeNode = {
  id: "know-conic-asymmetric-vieta",
  title: "解析几何非对称韦达、对称模型与隐圆轨迹",
  labTitle: "非对称韦达与隐圆实验室",
  chapter: "解析几何",
  module: "圆锥曲线",
  importance: "hard",
  animationIds: ["anim-conic-asymmetric-vieta"],
  prerequisites: ["know-conic-line", "know-conic-locus-invariants"],
  route: "/conic-asymmetric-vieta",
  gaokaoTopic: "conic_geometry",
  questionCategory: "solution_final",
  examMethod: "和积互化消元破解非对称韦达、直径/定角隐圆识别与对称折线最短",
  examWeight: 5,
  crossThemes: ["直线与圆轨迹综合", "圆锥曲线定值定点大题压轴"],
};

export const conicAsymmetricVietaLoader = () =>
  import("./ConicAsymmetricVietaAnimation").then((m) => ({
    default: m.ConicAsymmetricVietaAnimation,
  }));
