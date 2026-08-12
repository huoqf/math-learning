import type { KnowledgeNode } from "@/data/types";

/**
 * 向量极化恒等式与阿波罗尼斯圆
 *
 * 路由映射：
 *   /vector-polarization-apollonius → VectorPolarizationApolloniusAnimation
 */
export const node: KnowledgeNode = {
  id: "know-conic-polarization",
  title: "向量极化恒等式与阿波罗尼斯圆",
  labTitle: "极化恒等式与阿波罗尼斯圆实验室",
  chapter: "解析几何",
  module: "圆锥曲线压轴",
  importance: "hard",
  animationIds: [
    "anim-vector-polarization-apollonius",
    "anim-conic-polarization",
  ],
  prerequisites: ["know-conic-line", "know-vector-dot-product"],
  route: "/vector-polarization-apollonius",
};

/** 独立 loader，不进入 KnowledgeNode 类型 */
export const loader = () =>
  import("./VectorPolarizationApolloniusAnimation").then((m) => ({
    default: m.VectorPolarizationApolloniusAnimation,
  }));
