import type { KnowledgeNode } from "@/data/types";

/**
 * 对勾函数与双曲型系列专题 — 知识节点与加载器声明
 *
 * 路由映射：
 *   /nike-standard -> StandardPage (经典对勾函数与双曲飘带模型)
 *   /nike-amgm     -> AmgmPage (均值不等式数形结合与等号成立几何意义)
 *   /nike-shifted  -> ShiftedPage (平移对勾函数与双曲型分式函数化归)
 */

export const nikeStandardNode: KnowledgeNode = {
  id: "know-func-hook",
  title: "对勾函数 y=ax+b/x 基本性质",
  labTitle: "对勾函数实验室",
  chapter: "函数概念与性质",
  module: "特殊模型函数",
  importance: "gaokao",
  animationIds: ["anim-nike-standard", "anim-nike"],
  prerequisites: ["know-func-properties"],
  route: "/nike-standard",
};

export const nikeAmgmNode: KnowledgeNode = {
  id: "know-nike-amgm",
  title: "均值不等式与对勾函数",
  labTitle: "均值不等式实验室",
  chapter: "函数概念与性质",
  module: "特殊模型函数",
  importance: "gaokao",
  animationIds: ["anim-nike-amgm"],
  prerequisites: ["know-func-properties"],
  route: "/nike-amgm",
};

export const nikeShiftedNode: KnowledgeNode = {
  id: "know-nike-shifted",
  title: "平移对勾函数与双曲型图像",
  labTitle: "平移双曲线实验室",
  chapter: "函数概念与性质",
  module: "特殊模型函数",
  importance: "gaokao",
  animationIds: ["anim-nike-shifted"],
  prerequisites: ["know-func-properties"],
  route: "/nike-shifted",
};

export const nikeStandardLoader = () => import("./StandardPage");
export const nikeAmgmLoader = () => import("./AmgmPage");
export const nikeShiftedLoader = () => import("./ShiftedPage");
