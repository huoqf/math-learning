import type { KnowledgeNode } from "@/data/types";

export const statSamplingFeaturesNode: KnowledgeNode = {
  id: "know-stat-sampling-features",
  title: "随机抽样、箱线图与数据数字特征变换",
  labTitle: "随机抽样与数字特征实验室",
  chapter: "概率与统计",
  module: "统计基础",
  importance: "core",
  animationIds: ["anim-stat-sampling-features"],
  prerequisites: [],
  route: "/stat-sampling-features",
  gaokaoTopic: "probability_statistics",
  questionCategory: "foundation",
  examMethod: "等概率抽样与样本线性变换均值方差规律及异常值稳健性",
  examWeight: 4,
  crossThemes: ["频率直方图与百分位数前置", "新高考多选统计特征变换"],
};

export const statSamplingFeaturesLoader = () =>
  import("./StatSamplingFeaturesAnimation").then((m) => ({
    default: m.StatSamplingFeaturesAnimation,
  }));
