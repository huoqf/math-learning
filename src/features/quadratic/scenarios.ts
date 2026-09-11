import type { ScenarioSpec } from "@/types/scenario";

export const quadraticScenarios: ScenarioSpec[] = [
  {
    id: "intersect",
    name: "相交两点",
    badge: "高考基础 · 两相异实根与两边中间",
    condition:
      "二次函数 $f(x) = x^2 - 2x - 3$，此时二次项系数 $a = 1 > 0$，判别式 $\\Delta = (-2)^2 - 4 \\times 1 \\times (-3) = 16 > 0$。",
    question:
      "求二次函数零点坐标，求对应一元二次方程的实数根，并分别写出 $f(x) > 0$ 与 $f(x) < 0$ 的解集。",
    presetParams: { a: 1.0, b: -2.0, c: -3.0 },
  },
  {
    id: "tangent",
    name: "相切临界",
    badge: "高考临界 · 二次方程两重实根",
    condition:
      "二次函数 $f(x) = x^2 - 2x + 1$，此时判别式 $\\Delta = (-2)^2 - 4 \\times 1 \\times 1 = 0$。",
    question:
      "判定抛物线与 $x$ 轴的位置关系，求方程 $x^2 - 2x + 1 = 0$ 的根，并确定不等式 $f(x) > 0$ 与 $f(x) \\le 0$ 的解集。",
    presetParams: { a: 1.0, b: -2.0, c: 1.0 },
  },
  {
    id: "disjoint",
    name: "相离悬空",
    badge: "高考常考 · 不等式恒成立模型",
    condition:
      "二次函数 $f(x) = x^2 - 2x + 2$，此时判别式 $\\Delta = (-2)^2 - 4 \\times 1 \\times 2 = -4 < 0$。",
    question:
      "分析抛物线与 $x$ 轴交点个数，探讨不等式 $x^2 - 2x + 2 > 0$ 在 $\\mathbb{R}$ 上是否恒成立及最小值。",
    presetParams: { a: 1.0, b: -2.0, c: 2.0 },
  },
  {
    id: "downward",
    name: "开口向下",
    badge: "高考高频 · 负二次项最值反转",
    condition:
      "二次函数 $f(x) = -x^2 + 2x + 3$，二次项系数 $a = -1 < 0$，判别式 $\\Delta = 2^2 - 4 \\times (-1) \\times 3 = 16 > 0$。",
    question:
      "求抛物线对称轴与最大值，并比较 $a < 0$ 时不等式 $f(x) > 0$ 与 $f(x) < 0$ 解集区间的反转特征。",
    presetParams: { a: -1.0, b: 2.0, c: 3.0 },
  },
  {
    id: "degenerate",
    name: "退化直线",
    badge: "高考陷阱 · 含参分类讨论必考项",
    condition:
      "函数 $f(x) = 2x - 4$，二次项系数 $a = 0$，函数退化为一次函数（直线）。",
    question:
      "分析当含参二次函数二次项系数为 $0$ 时方程与不等式的解集突变，说明高考大题分类讨论为何必须先讨论 $a = 0$。",
    presetParams: { a: 0.0, b: 2.0, c: -4.0 },
  },
];
