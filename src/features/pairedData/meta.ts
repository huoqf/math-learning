import type { KnowledgeNode } from "@/data/types";

/**
 * 成对数据与回归分析 / 独立性检验 feature — 知识节点声明
 *
 * 路由映射：
 *   /paired-data-regression → RegressionPage（一元线性回归与非线性转换分析）
 *   /paired-data-independence → IndependencePage（2×2 列联表独立性检验）
 */

export const regressionNode: KnowledgeNode = {
  id: "know-probability-regression",
  title: "一元线性回归分析",
  labTitle: "一元线性回归分析实验室",
  chapter: "概率与统计",
  module: "统计分析",
  importance: "gaokao",
  animationIds: ["anim-paired-data-regression", "anim-paired-data"],
  prerequisites: ["know-probability-normal"],
  route: "/paired-data-regression",
};

export const independenceNode: KnowledgeNode = {
  id: "know-paired-independence",
  title: "2×2 独立性检验",
  labTitle: "2×2 独立性检验实验室",
  chapter: "概率与统计",
  module: "统计分析",
  importance: "gaokao",
  animationIds: ["anim-paired-data-independence"],
  prerequisites: ["know-probability-normal"],
  route: "/paired-data-independence",
};

/** 独立 loader */
export const regressionLoader = () => import("./RegressionPage");
export const independenceLoader = () => import("./IndependencePage");
