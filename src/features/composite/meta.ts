import type { KnowledgeNode } from "@/data/types";

export const compositeNode: KnowledgeNode = {
  id: "know-func-composite",
  title: "分段函数临界与复合函数同增异减",
  labTitle: "分段与复合函数实验室",
  chapter: "函数概念与性质",
  module: "分段与复合函数",
  importance: "hard",
  animationIds: ["anim-func-composite"],
  prerequisites: ["know-func-properties"],
  route: "/composite",
};

export const compositeLoader = () => import("./CompositeAnimation");
