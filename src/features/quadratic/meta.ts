import type { KnowledgeNode } from "@/data/types";

export const quadraticNode: KnowledgeNode = {
  id: "know-quadratic",
  title: "二次函数与一元二次方程、不等式",
  labTitle: "二次函数实验室",
  chapter: "不等式",
  module: "二次函数与一元二次不等式",
  importance: "core",
  animationIds: ["anim-quadratic"],
  prerequisites: ["know-func-properties"],
  route: "/quadratic",
};

export const quadraticLoader = () => import("./QuadraticAnimation");
