import type { KnowledgeNode } from "@/data/types";

export const derivativeChainNode: KnowledgeNode = {
  id: "know-derivative-chain",
  title: "简单复合函数的求导法则",
  labTitle: "简单复合函数求导实验室",
  chapter: "导数及其应用",
  module: "导数概念与运算",
  importance: "gaokao",
  animationIds: ["anim-derivative-chain"],
  prerequisites: ["know-derivative-operations"],
  route: "/derivative-chain",
  gaokaoTopic: "func_derivative",
  questionCategory: "solution_first",
  examMethod: "线性内层复合求导与中间变量链式代换",
  examWeight: 5,
};

export const derivativeChainLoader = () => import("./DerivativeChainAnimation");
