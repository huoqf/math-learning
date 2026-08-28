import type { KnowledgeNode } from "@/data/types";

export const funcZeroNode: KnowledgeNode = {
  id: "know-func-zero",
  title: "函数的零点与二分逼近法",
  labTitle: "零点二分法实验室",
  chapter: "函数概念与性质",
  module: "函数与方程",
  importance: "core",
  animationIds: ["anim-func-zero"],
  prerequisites: ["know-func-properties"],
  route: "/function-zero",
};

export const funcZeroLoader = () => import("./FuncZeroAnimation");
