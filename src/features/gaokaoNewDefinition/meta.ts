import type { KnowledgeNode } from "@/data/types";

export const gaokaoNewDefinitionNode: KnowledgeNode = {
  id: "know-gaokao-new-definition",
  title: "新高考 19 题新定义压轴（可分数列、函数不动点与广义距离）",
  labTitle: "新高考 19 题新定义压轴实验室",
  chapter: "数列",
  module: "新定义压轴",
  syllabus: { book: "选择性必修二", status: "正文" },
  importance: "hard",
  animationIds: ["anim-gaokao-new-definition"],
  prerequisites: ["know-sequence-recurrence", "know-func-symmetry"],
  route: "/gaokao-new-definition",
  gaokaoTopic: "new_definition",
  questionCategory: "solution_final",
  examMethod:
    "新定义概念翻译、特例归纳猜想、奇偶/模同余必要性分析与数学归纳构造",
  examWeight: 5,
  crossThemes: ["数列集合新定义压轴", "函数迭代不动点与几何广义距离"],
};

export const gaokaoNewDefinitionLoader = () =>
  import("./GaokaoNewDefinitionAnimation").then((m) => ({
    default: m.GaokaoNewDefinitionAnimation,
  }));
