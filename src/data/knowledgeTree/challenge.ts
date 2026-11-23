import type { KnowledgeNode } from "../types";
import { gaokaoNewDefinitionNode } from "@/features/gaokaoNewDefinition/meta";

// ========== 11. 新高考攻坚微专题（拓展规划，追加于末尾保持展示顺序） ==========
export const challengeNodes: KnowledgeNode[] = [
  {
    id: "know-derivative-tangent-scaling",
    title: "导数切线放缩与双切线卡位",
    labTitle: "切线放缩与双切线卡位实验室",
    chapter: "导数及其应用",
    module: "导数压轴",
    importance: "hard",
    animationIds: ["anim-derivative-tangent-scaling"],
    prerequisites: ["know-derivative-compare", "know-derivative-constant"],
    route: "/derivative-tangent-scaling",
    gaokaoTopic: "func_derivative",
    questionCategory: "solution_final",
    examMethod: "指对切线放缩 ($e^x \\ge x+1$, $\\ln x \\le x-1$) 与双侧卡位",
    examWeight: 5,
    crossThemes: ["数列不等式与指对切线放缩证明", "双切线上下卡位分离超越方程"],
  },
  {
    id: "know-parabola-archimedes",
    title: "抛物线焦点弦性质与阿基米德三角形（拓展 · 模型探究）",
    labTitle: "抛物线阿基米德三角形实验室",
    chapter: "解析几何",
    module: "解析几何拓展",
    importance: "extend",
    animationIds: ["anim-parabola-archimedes"],
    prerequisites: ["know-conic-parabola", "know-conic-line"],
    route: "/parabola-archimedes",
    gaokaoTopic: "conic_geometry",
    questionCategory: "multi_select_hard",
    examMethod: "焦半径调和中项、垂直弦斜率积与切线交点性质",
    examWeight: 2,
    crossThemes: ["焦点弦调和倒数和与准线直角", "切线交点对称性与中线平行性质"],
  },
  gaokaoNewDefinitionNode,
];
