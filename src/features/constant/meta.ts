import type { KnowledgeNode } from "@/data/types";

export const constantSingleNode: KnowledgeNode = {
  id: "know-derivative-constant",
  title: "导数与不等式恒成立、存在性问题",
  labTitle: "单变量恒成立实验室",
  chapter: "导数及其应用",
  module: "导数的应用",
  importance: "gaokao",
  animationIds: ["anim-constant-single"],
  prerequisites: ["know-derivative-compare"],
  route: "/constant-single",
};

export const constantDoubleNode: KnowledgeNode = {
  id: "know-constant-double",
  title: "双变量博弈与存在性问题",
  labTitle: "双变量博弈实验室",
  chapter: "导数及其应用",
  module: "导数的应用",
  importance: "gaokao",
  animationIds: ["anim-constant-double"],
  prerequisites: ["know-derivative-compare"],
  route: "/constant-double",
};

export const constantSingleLoader = () => import("./SingleVarPage");
export const constantDoubleLoader = () => import("./DoubleVarPage");
