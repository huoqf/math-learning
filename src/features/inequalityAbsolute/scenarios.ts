/**
 * src/features/inequalityAbsolute/scenarios.ts
 * 绝对值不等式高考典型教学情景与预设契约 (SSOT)
 */

import type { ScenarioSpec } from "@/types/scenario";
import type { InequalityMode } from "@/math/inequalityAbsolute";

export type ScenarioParams = {
  a: number;
  b: number;
  c: number;
  m: number;
  x: number;
};

export const SCENARIOS_BY_MODE: Record<
  InequalityMode,
  ScenarioSpec<ScenarioParams>[]
> = {
  single: [
    {
      id: "single-standard",
      name: "标准对称闭区间",
      badge: "课标基础 · 数轴距离模型",
      condition:
        "数轴定点 $A(a)$，动点 $P(x)$ 到 $A$ 的距离 $|x - a| \\le c$。",
      question: "探究如何利用数轴几何对称性求出不等式的解集区间 $[a-c, a+c]$。",
      presetParams: { a: 1.0, c: 2.5, x: 2.0 },
      theorems: ["单绝对值几何意义与解集"],
      variant: "primary",
    },
    {
      id: "single-external",
      name: "两端外侧无限区间",
      badge: "典型题型 · 距离不小于阈值",
      condition:
        "动点 $P(x)$ 到中心基准点 $A(a)$ 的距离满足 $|x - a| \\ge c$。",
      question:
        "求解不等式在数轴两端的外侧解集 $(-\\infty, a-c] \\cup [a+c, +\\infty)$。",
      presetParams: { a: 2.0, c: 3.0, x: 5.5 },
      theorems: ["单绝对值几何意义与解集"],
      variant: "info",
    },
    {
      id: "single-degenerate",
      name: "临界单点退化",
      badge: "临界分类 · 零距离特殊解",
      condition: "阈值半径缩减为零，即满足 $|x - a| \\le 0$。",
      question:
        "探究当绝对值距离半径 $c = 0$ 时解集退化为单点集 $\\{a\\}$ 的充要条件。",
      presetParams: { a: 1.0, c: 0.0, x: 1.0 },
      theorems: ["单绝对值几何意义与解集"],
      variant: "warning",
    },
    {
      id: "single-free",
      name: "自由参数探索",
      badge: "自主探究 · 任意参数检验",
      condition: "自主拖动数轴定点 $A(a)$、动点 $P(x)$ 与半径阈值 $c$。",
      question: "结合折线与截线交点，探究不等式解集的几何变化规律。",
      variant: "success",
    },
  ],

  sum: [
    {
      id: "sum-classic",
      name: "高考经典平底杯",
      badge: "高考真题 · 距离和不等式",
      condition:
        "动点 $P(x)$ 到两定点 $A(1), B(4)$ 的距离之和满足 $|x - 1| + |x - 4| \\le 5$。",
      question: "求出该绝对值和不等式的解集区间，并确定临界交点坐标。",
      presetParams: { a: 1.0, b: 4.0, m: 5.0, x: 2.5 },
      theorems: ["双绝对值和 (平底杯函数) 极值定理"],
      variant: "primary",
    },
    {
      id: "sum-constant",
      name: "杯底恒成立临界",
      badge: "高考压轴 · 恒成立求参",
      condition:
        "不等式 $|x - a| + |x - b| \\ge m$ 对一切 $x \\in \\mathbb{R}$ 恒成立。",
      question:
        "利用两点间线段最短求解函数最小值 $|a - b|$，确定参数 $m$ 的最大取值范围。",
      presetParams: { a: 1.0, b: 4.0, m: 3.0, x: 3.0 },
      theorems: ["双绝对值和 (平底杯函数) 极值定理"],
      variant: "warning",
    },
    {
      id: "sum-empty",
      name: "小于最小值无解",
      badge: "逻辑判定 · 空集退化",
      condition:
        "目标水平常数线 $m < |a - b|$，对应不等式 $|x - a| + |x - b| \\le m$。",
      question:
        "证明当水平线低于平底杯杯底时，不等式解集为空集 $\\varnothing$。",
      presetParams: { a: 1.0, b: 4.0, m: 2.0, x: 2.0 },
      theorems: ["双绝对值和 (平底杯函数) 极值定理"],
      variant: "danger",
    },
    {
      id: "sum-free",
      name: "自由参数探索",
      badge: "自主探究 · 双定点联动",
      condition: "自由拖动定点 $A, B$ 与截线高度 $m$，动态观察距离之和折线。",
      question: "求解不同截线高度下平底杯函数与水平线交点的分布与解集范围。",
      variant: "success",
    },
  ],

  diff: [
    {
      id: "diff-classic",
      name: "阶梯斜段求解",
      badge: "高考题型 · 距离差不等式",
      condition:
        "动点 $P(x)$ 到两定点 $A(1), B(4)$ 的距离之差满足 $|x - 1| - |x - 4| \\le 1$。",
      question: "求解动点距离差在倾斜过渡段的唯一交点，并写出不等式解集。",
      presetParams: { a: 1.0, b: 4.0, m: 1.0, x: 2.0 },
      theorems: ["双绝对值差 (阶梯函数) 取值范围"],
      variant: "primary",
    },
    {
      id: "diff-max-platform",
      name: "最大值平台射线",
      badge: "极值结构 · 同侧差为定值",
      condition:
        "动点 $P$ 位于两定点同侧（$x \\ge \\max(a, b)$），满足距离差达到理论最大值 $|a - b|$。",
      question:
        "证明不等式 $|x - a| - |x - b| \\ge |a - b|$ 的解集为无限射线区间。",
      presetParams: { a: 1.0, b: 4.0, m: 3.0, x: 4.5 },
      theorems: ["双绝对值差 (阶梯函数) 取值范围"],
      variant: "info",
    },
    {
      id: "diff-min-platform",
      name: "最小值平台射线",
      badge: "极值结构 · 反向差为定值",
      condition:
        "动点 $P$ 位于两定点左侧（$x \\le \\min(a, b)$），距离差达到理论最小值 $-|a - b|$。",
      question:
        "求解不等式 $|x - a| - |x - b| \\le -|a - b|$ 对应的下边界射线解集。",
      presetParams: { a: 1.0, b: 4.0, m: -3.0, x: 0.0 },
      theorems: ["双绝对值差 (阶梯函数) 取值范围"],
      variant: "warning",
    },
    {
      id: "diff-free",
      name: "自由参数探索",
      badge: "自主探究 · 阶梯函数变化",
      condition: "自由调节定点 $A, B$ 位置与目标比较常数 $m$。",
      question:
        "探究阶梯上下界 $[-|a-b|, |a-b|]$ 与数轴线段长度的本质联系并求解集。",
      variant: "success",
    },
  ],

  triangle: [
    {
      id: "tri-same-sign",
      name: "同号顺接取等",
      badge: "高考重点 · 模和取等",
      condition:
        "实数 $a, b$ 同号（$ab \\ge 0$），向量 $\\overrightarrow{OA}$ 与 $\\overrightarrow{AB}$ 同向顺接。",
      question: "证明绝对值三角不等式等号成立条件 $|a + b| = |a| + |b|$。",
      presetParams: { a: 2.0, b: 3.0, x: 2.5 },
      theorems: ["绝对值三角不等式全表"],
      variant: "primary",
    },
    {
      id: "tri-diff-sign",
      name: "异号反向相消",
      badge: "高考重点 · 模差取等",
      condition: "实数 $a, b$ 异号（$ab \\le 0$），向量反向相消。",
      question:
        "探究和的绝对值何时取得下界，即 $|a + b| = ||a| - |b||$ 的代数与几何证明。",
      presetParams: { a: 3.0, b: -2.0, x: 1.0 },
      theorems: ["绝对值三角不等式全表"],
      variant: "warning",
    },
    {
      id: "tri-free",
      name: "自由参数探索",
      badge: "自主探究 · 三角不等式链",
      condition: "自由改变实数 $a, b$ 的正负与绝对值大小。",
      question:
        "验证双向夹逼不等式 $||a| - |b|| \\le |a \\pm b| \\le |a| + |b|$ 的全集成立性。",
      variant: "success",
    },
  ],
};
