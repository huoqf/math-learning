import type { KnowledgeNode } from "@/data/types";

export const statPercentileNode: KnowledgeNode = {
  id: "know-stat-percentile",
  title: "分层抽样、频率直方图与百分位数/中位数",
  labTitle: "分层抽样与直方图百分位数",
  chapter: "概率与统计",
  module: "统计分析",
  importance: "gaokao",
  animationIds: ["anim-stat-percentile"],
  prerequisites: ["know-probability-normal"],
  route: "/stat-percentile",
};

export const statPercentileLoader = () => import("./StatPercentileAnimation");
