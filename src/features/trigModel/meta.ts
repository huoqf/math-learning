import type { KnowledgeNode } from "@/data/types";

/**
 * 三角函数模型的应用（人教A版必修一 5.7）。
 *
 * 节点声明与 `src/data/knowledgeTree/trig.ts` 中的登记必须逐字一致 ——
 * 知识树是左屏导航与右屏课标归属的唯一真源，任何一处漏改都会让页面「挂在树上却不属于任何分册」。
 */
export const trigModelNode: KnowledgeNode = {
  id: "know-trig-model",
  title: "三角函数模型的应用",
  labTitle: "三角函数模型应用实验室",
  chapter: "三角函数",
  module: "三角函数的应用",
  importance: "gaokao",
  animationIds: ["anim-trig-model"],
  prerequisites: ["know-trig-transform"],
  route: "/trig-model",
};

export const trigModelLoader = () =>
  import("./TrigModelAnimation").then((m) => ({
    default: m.TrigModelAnimation,
  }));
