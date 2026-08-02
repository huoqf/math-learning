import type { KnowledgeNode } from "@/data/types";

export const trigFormulasNode: KnowledgeNode = {
  id: "know-trig-formulas",
  title: "两角和差公式与倍角/辅助角化简",
  labTitle: "两角和差与倍角辅助角实验室",
  chapter: "三角函数",
  module: "三角恒等变换",
  importance: "gaokao",
  animationIds: ["anim-trig-formulas"],
  prerequisites: ["know-trig-identity"],
  route: "/trig-formulas",
};

export const trigFormulasLoader = () => import("./TrigFormulasAnimation");
