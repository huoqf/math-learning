import type { KnowledgeNode } from "@/data/types";

export const solidObliqueDrawingNode: KnowledgeNode = {
  id: "know-solid-oblique-drawing",
  title: "立体图形的直观图与斜二测画法",
  labTitle: "斜二测画法实验室",
  chapter: "立体几何与空间向量",
  module: "立体几何",
  importance: "core",
  animationIds: ["anim-solid-oblique-drawing"],
  prerequisites: ["know-solid-rotation-body"],
  route: "/solid-oblique-drawing",
  gaokaoTopic: "solid_geometry",
  questionCategory: "foundation",
  examMethod: "横不变纵减半与直观图面积 2√2 逆向还原",
  examWeight: 4,
};

export const solidObliqueDrawingLoader = () =>
  import("./ObliqueDrawingAnimation");
