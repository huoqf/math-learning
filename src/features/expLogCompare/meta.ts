import type { KnowledgeNode } from "@/data/types";

export const expLogCompareNode: KnowledgeNode = {
  id: "know-exp-log-compare",
  title: "指对数运算律、换底公式与指对幂比大小",
  labTitle: "指对数运算与比大小实验室",
  chapter: "函数概念与性质",
  module: "基本初等函数",
  importance: "gaokao",
  animationIds: ["anim-exp-log-compare"],
  prerequisites: [
    "know-func-explog",
    "know-func-logarithmic",
    "know-power-function",
  ],
  route: "/exp-log-compare",
  gaokaoTopic: "func_derivative",
  questionCategory: "multi_select_hard",
  examMethod: "对数换底化同底、0与1中间值搭桥与函数单调性比大小",
  examWeight: 5,
  crossThemes: ["基本初等函数单调性综合", "新高考选填比大小核心通法"],
};

export const expLogCompareLoader = () =>
  import("./ExpLogCompareAnimation").then((m) => ({
    default: m.ExpLogCompareAnimation,
  }));
