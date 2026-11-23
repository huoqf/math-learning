import type { KnowledgeNode } from "@/data/types";

export const nestedFuncZerosNode: KnowledgeNode = {
  id: "know-nested-func-zeros",
  title: "嵌套函数零点与复合方程 f(f(x))=a 根的个数",
  labTitle: "嵌套函数零点实验室",
  chapter: "函数概念与性质",
  module: "函数与方程",
  importance: "hard",
  animationIds: ["anim-nested-func-zeros"],
  prerequisites: ["know-func-zero", "know-func-composite"],
  route: "/nested-func-zeros",
  gaokaoTopic: "func_derivative",
  questionCategory: "multi_select_hard",
  examMethod: "换元 t=f(x) 由外向内先求 t 根再作水平线计数内层交点",
  examWeight: 5,
  crossThemes: ["分段函数图象与方程根计数", "新高考选填压轴零点分类讨论"],
};

export const nestedFuncZerosLoader = () =>
  import("./NestedFuncZerosAnimation").then((m) => ({
    default: m.NestedFuncZerosAnimation,
  }));
