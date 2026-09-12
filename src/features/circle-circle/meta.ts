import type { KnowledgeNode } from "@/data/types";
import type { ScenarioSpec } from "@/types/scenario";

export const circleCircleScenarios: ScenarioSpec[] = [
  {
    id: "intersectStandard",
    name: "相交公共弦",
    badge: "高考经典 · 相交弦长",
    condition:
      "已知圆 $C_1: (x+1.5)^2 + y^2 = 6.25$ 与圆 $C_2: (x-1.5)^2 + y^2 = 4$，两圆相交于 $A, B$ 两点。",
    question:
      "如何通过两圆方程作差求公共弦 $AB$ 所在直线方程，并用垂径定理求弦长 $|AB|$？",
    presetParams: { x1: -1.5, y1: 0, r1: 2.5, x2: 1.5, y2: 0, r2: 2.0 },
    variant: "warning",
  },
  {
    id: "outerTangent",
    name: "典型外切",
    badge: "高考经典 · 外切临界",
    condition:
      "两圆圆心距 $d = r_1 + r_2 = 4.0$ 达到外切临界状态，公共切点为 $T(0, 0)$。",
    question:
      "两圆外切时满足什么几何等量？两圆方程作差得到的是公共弦还是切线？共有几条公切线？",
    presetParams: { x1: -2, y1: 0, r1: 2, x2: 2, y2: 0, r2: 2 },
    variant: "primary",
  },
  {
    id: "innerTangent",
    name: "经典内切",
    badge: "高考重点 · 包含内切",
    condition:
      "大圆半径 $r_1 = 3.5$，小圆半径 $r_2 = 1.5$，圆心距 $d = |r_1 - r_2| = 2.0$。",
    question:
      "两圆内切时公切线条数与外切有何本质区别？作差消元得到的直线是哪条切线？",
    presetParams: { x1: -0.5, y1: 0, r1: 3.5, x2: 1.5, y2: 0, r2: 1.5 },
    variant: "danger",
  },
  {
    id: "disjoint",
    name: "外离切线",
    badge: "高考压轴 · 公切线系统",
    condition:
      "两圆外离 ($d > r_1 + r_2$)，存在 2 条外公切线与 2 条内公切线，公切线总数为 4 条。",
    question: "如何通过平移切线构造直角三角形，求解外公切线长与内公切线长？",
    presetParams: { x1: -3.0, y1: 0, r1: 1.5, x2: 3.0, y2: 0, r2: 1.5 },
    variant: "info",
  },
  {
    id: "contain",
    name: "内含同心",
    badge: "概念辨析 · 无交点根轴",
    condition: "大圆半径 $r_1 = 3.5$，小圆位于其内部且圆心距 $d < r_1 - r_2$。",
    question:
      "两圆内含时是否存在公切线与公共弦？两圆方程相减得到的等幂线有何高等几何意义？",
    presetParams: { x1: 0.0, y1: 0, r1: 3.5, x2: 1.0, y2: 0, r2: 1.0 },
    variant: "info",
  },
];

export const circleCircleNode: KnowledgeNode = {
  id: "know-circle-circle",
  title: "圆与圆的位置关系及公共弦方程",
  labTitle: "圆与圆实验室",
  chapter: "解析几何",
  module: "直线与圆",
  importance: "gaokao",
  animationIds: ["anim-circle-circle"],
  prerequisites: ["know-line-circle"],
  route: "/circle-circle",
};

export const circleCircleLoader = () => import("./CircleCircleAnimation");
