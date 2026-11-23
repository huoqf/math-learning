import type { KnowledgeNode } from "@/data/types";

export const solidDynamicLocusNode: KnowledgeNode = {
  id: "know-solid-dynamic-locus",
  title: "立体几何动点轨迹三大经典问题（垂面/定距圆/定角圆锥曲线）",
  labTitle: "立体几何动点轨迹实验室",
  chapter: "立体几何与空间向量",
  module: "立体几何压轴",
  importance: "hard",
  animationIds: ["anim-solid-dynamic-locus"],
  prerequisites: ["know-solid-position", "know-solid-section"],
  route: "/solid-dynamic-locus",
  gaokaoTopic: "solid_geometry",
  questionCategory: "multi_select_hard",
  examMethod:
    "线面垂直定垂面截面、球面勾股降维定圆弧、线线定角圆锥截交平面判定曲线类型",
  examWeight: 5,
  crossThemes: [
    "立体几何动点轨迹与圆锥曲线综合判定",
    "纯综合几何降维求空间轨迹弧长与周长",
  ],
};

export const solidDynamicLocusLoader = () =>
  import("./SolidDynamicLocusAnimation");
