import type { KnowledgeNode } from "@/data/types";

export const exponentialNode: KnowledgeNode = {
  id: "know-func-explog",
  title: "指数函数图像与反函数关系",
  labTitle: "指数函数实验室",
  chapter: "函数概念与性质",
  module: "基本初等函数",
  importance: "gaokao",
  animationIds: ["anim-func-exponential"],
  prerequisites: ["know-func-properties"],
  route: "/function-exponential",
};

export const logarithmicNode: KnowledgeNode = {
  id: "know-func-logarithmic",
  title: "对数函数图像与反函数关系",
  labTitle: "对数函数实验室",
  chapter: "函数概念与性质",
  module: "基本初等函数",
  importance: "gaokao",
  animationIds: ["anim-func-logarithmic"],
  prerequisites: ["know-func-properties"],
  route: "/function-logarithmic",
};

export const powerNode: KnowledgeNode = {
  id: "know-power-function",
  title: "幂函数的性质与图像变化",
  labTitle: "幂函数实验室",
  chapter: "函数概念与性质",
  module: "基本初等函数",
  importance: "basic",
  animationIds: ["anim-func-power"],
  prerequisites: ["know-func-properties"],
  route: "/function-power",
};

export const exponentialLoader = () => import("./ExponentialPage");
export const logarithmicLoader = () => import("./LogarithmicPage");
export const powerLoader = () => import("./PowerPage");
