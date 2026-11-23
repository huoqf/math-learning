import type { KnowledgeNode } from "@/data/types";

export const ineqMultivarExtremaNode: KnowledgeNode = {
  id: "know-ineq-multivar-extrema",
  title: "多元不等式条件最值通法（1的代换、消元与齐次化）",
  labTitle: "多元条件最值通法实验室",
  chapter: "不等式",
  module: "基本不等式",
  importance: "hard",
  animationIds: ["anim-ineq-multivar-extrema"],
  prerequisites: ["know-ineq-basic", "know-nike-amgm"],
  route: "/ineq-multivar-extrema",
  gaokaoTopic: "algebra_basics",
  questionCategory: "multi_select_hard",
  examMethod: "常数1的代换乘积配凑、主元消元降维、齐次比值换元与和积互化",
  examWeight: 5,
  crossThemes: ["基本不等式等号取等条件验证", "解析几何与解三角形最值工具"],
};

export const ineqMultivarExtremaLoader = () =>
  import("./IneqMultivarExtremaAnimation").then((m) => ({
    default: m.IneqMultivarExtremaAnimation,
  }));
