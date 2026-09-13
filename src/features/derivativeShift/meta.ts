import type { KnowledgeNode } from "@/data/types";

export const derivativeShiftNode: KnowledgeNode = {
  id: "know-derivative-shift",
  title: "隐零点与极值点偏移（拓展 · 超出课标）",
  labTitle: "隐零点与极值点偏移实验室",
  chapter: "导数及其应用",
  module: "导数拓展",
  importance: "extend",
  animationIds: ["anim-derivative-shift"],
  prerequisites: ["know-derivative-compare"],
  route: "/derivative-shift",
};

export const derivativeShiftLoader = () => import("./DerivativeShiftAnimation");
