import type { KnowledgeNode } from "@/data/types";

export const statPercentileNode: KnowledgeNode = {
  id: "know-stat-percentile",
  title: "分层抽样、频率直方图与百分位数/中位数",
  labTitle: "分层抽样与直方图百分位数",
  chapter: "概率与统计",
  module: "统计分析",
  importance: "gaokao",
  animationIds: ["anim-stat-percentile"],
  prerequisites: [],
  route: "/stat-percentile",
  gaokaoTopic: "probability_statistics",
  questionCategory: "solution_first",
  examMethod: "分层抽样权重与频率直方图面积求百分位数",
  examWeight: 5,
};

export const statPercentileLoader = () => import("./StatPercentileAnimation");
