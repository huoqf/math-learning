import type { KnowledgeNode } from "@/data/types";

export const transformNode: KnowledgeNode = {
  id: "know-func-transform",
  title: "函数图象的平移、伸缩与翻折变换",
  labTitle: "函数图象变换实验室",
  chapter: "函数概念与性质",
  module: "图象变换",
  importance: "gaokao",
  animationIds: ["anim-func-transform"],
  prerequisites: ["know-func-properties"],
  route: "/transform",
};

export const transformLoader = () => import("./TransformAnimation");
