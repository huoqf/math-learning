import type { KnowledgeNode } from "@/data/types";

export const quadraticNode: KnowledgeNode = {
  id: "know-quadratic",
  title: "二次函数与一元二次方程、不等式",
  labTitle: "二次函数实验室",
  chapter: "函数概念与性质",
  module: "二次函数",
  importance: "core",
  animationIds: ["anim-quadratic"],
  prerequisites: ["know-func-properties"],
  route: "/quadratic",
};

export const quadraticLoader = () => import("./QuadraticAnimation");
