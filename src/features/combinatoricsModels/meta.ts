import type { KnowledgeNode } from "@/data/types";

export const combinatoricsModelsNode: KnowledgeNode = {
  id: "know-combinatorics-models",
  title: "排列组合经典模型（捆绑、插空、隔板与分组分配）",
  labTitle: "排列组合经典模型实验室",
  chapter: "概率与统计",
  module: "排列组合",
  importance: "gaokao",
  animationIds: ["anim-combinatorics-models"],
  prerequisites: ["know-probability-counting"],
  route: "/combinatorics-models",
  gaokaoTopic: "probability_statistics",
  questionCategory: "multi_select_hard",
  examMethod: "相邻捆绑、不相邻插空、隔板法同素分配与平均分组消序",
  examWeight: 5,
  crossThemes: ["古典概型计数基本功", "分组分配与超几何模型衔接"],
};

export const combinatoricsModelsLoader = () =>
  import("./CombinatoricsModelsAnimation").then((m) => ({
    default: m.CombinatoricsModelsAnimation,
  }));
