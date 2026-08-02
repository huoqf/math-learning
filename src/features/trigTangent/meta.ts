import type { KnowledgeNode } from "@/data/types";

export const trigTangentNode: KnowledgeNode = {
  id: "know-trig-tangent",
  title: "正切函数的图像与渐近线",
  labTitle: "正切函数与渐近线实验室",
  chapter: "三角函数",
  module: "三角函数图象与性质",
  importance: "core",
  animationIds: ["anim-trig-tangent"],
  prerequisites: ["know-trig-lines"],
  route: "/trig-tangent",
};

export const trigTangentLoader = () => import("./TrigTangentAnimation");
