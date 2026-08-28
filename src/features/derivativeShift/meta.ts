import type { KnowledgeNode } from "@/data/types";

export const derivativeShiftNode: KnowledgeNode = {
  id: "know-derivative-shift",
  title: "隐零点定理与极值点偏移",
  labTitle: "隐零点定理与极值点偏移",
  chapter: "导数及其应用",
  module: "导数压轴",
  importance: "hard",
  animationIds: ["anim-derivative-shift"],
  prerequisites: ["know-derivative-compare"],
  route: "/derivative-shift",
};

export const derivativeShiftLoader = () => import("./DerivativeShiftAnimation");
