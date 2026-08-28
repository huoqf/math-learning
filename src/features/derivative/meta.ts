import type { KnowledgeNode } from "@/data/types";

export const derivativeNode: KnowledgeNode = {
  id: "know-derivative-tangent",
  title: "导数的几何意义与切线方程",
  labTitle: "导数几何意义",
  chapter: "导数及其应用",
  module: "导数概念",
  importance: "gaokao",
  animationIds: ["anim-derivative-tangent"],
  prerequisites: ["know-func-properties"],
  route: "/derivative",
};

export const derivativeLoader = () => import("./DerivativeAnimation");
