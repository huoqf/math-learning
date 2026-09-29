import type { KnowledgeNode } from "@/data/types";

export const derivativeFormulasNode: KnowledgeNode = {
  id: "know-derivative-formulas",
  title: "基本初等函数的导数公式表",
  labTitle: "导数公式实验室",
  chapter: "导数及其应用",
  module: "导数概念与运算",
  importance: "basic",
  animationIds: ["anim-derivative-formulas"],
  prerequisites: ["know-derivative-tangent"],
  route: "/derivative-formulas",
  gaokaoTopic: "func_derivative",
  questionCategory: "foundation",
  examMethod: "八大基本初等函数求导公式代入与割线极限逼近",
  examWeight: 4,
};

export const derivativeFormulasLoader = () =>
  import("./DerivativeFormulasAnimation");
