import type { KnowledgeNode } from "@/data/types";

export const solidSphereDerivationNode: KnowledgeNode = {
  id: "know-solid-sphere-derivation",
  title: "祖暅原理与球的体积、表面积公式推导",
  labTitle: "祖暅原理与球体公式推导实验室",
  chapter: "立体几何与空间向量",
  module: "立体几何",
  importance: "core",
  animationIds: ["anim-solid-sphere-derivation"],
  prerequisites: ["know-solid-rotation-body"],
  route: "/solid-sphere-derivation",
  gaokaoTopic: "solid_geometry",
  questionCategory: "foundation",
  examMethod: "祖暅原理等高截面法与以锥积球分割求和",
  examWeight: 4,
};

export const solidSphereDerivationLoader = () =>
  import("./SphereDerivationAnimation");
