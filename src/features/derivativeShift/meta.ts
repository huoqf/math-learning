import type { KnowledgeNode } from "@/data/types";

export const derivativeShiftNode: KnowledgeNode = {
  id: "know-derivative-shift",
  title: "导数隐零点设代与极值点偏移（新高考压轴通法）",
  labTitle: "导数隐零点代换与极值点偏移实验室",
  chapter: "导数及其应用",
  module: "导数综合",
  importance: "hard",
  animationIds: ["anim-derivative-shift"],
  prerequisites: ["know-derivative-compare"],
  route: "/derivative-shift",
};

export const derivativeShiftLoader = () => import("./DerivativeShiftAnimation");
