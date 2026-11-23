import type { KnowledgeNode } from "@/data/types";

export const funcGrowthModelingNode: KnowledgeNode = {
  id: "know-func-growth-modeling",
  title: "不同函数增长的差异与函数实际建模",
  labTitle: "函数增长差异与实际建模实验室",
  chapter: "函数概念与性质",
  module: "函数应用",
  importance: "core",
  animationIds: ["anim-func-growth-modeling"],
  prerequisites: [
    "know-func-explog",
    "know-func-logarithmic",
    "know-power-function",
  ],
  route: "/func-growth-modeling",
  gaokaoTopic: "func_derivative",
  questionCategory: "solution_first",
  examMethod: "指数幂对数增长速率阶梯对比、分段函数建模与散点拟合误差评估",
  examWeight: 4,
  crossThemes: ["指对幂函数图象综合对比", "实际情境分段函数最值建模"],
};

export const funcGrowthModelingLoader = () =>
  import("./FuncGrowthModelingAnimation").then((m) => ({
    default: m.FuncGrowthModelingAnimation,
  }));
