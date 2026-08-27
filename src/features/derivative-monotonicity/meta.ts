import type { KnowledgeNode } from "@/data/types";

export const derivativeMonotonicityNode: KnowledgeNode = {
  id: "know-derivative-compare",
  title: "导数与函数的单调性及极值",
  labTitle: "导数单调性与极值实验室",
  chapter: "导数及其应用",
  module: "导数的应用",
  importance: "gaokao",
  animationIds: ["anim-derivative-monotonicity"],
  prerequisites: ["know-derivative-tangent"],
  route: "/derivative-monotonicity",
};

export const derivativeMonotonicityLoader = () =>
  import("./DerivativeMonotonicityAnimation").then((m) => ({
    default: m.DerivativeMonotonicityAnimation,
  }));

export const node = derivativeMonotonicityNode;
export const loader = derivativeMonotonicityLoader;
