import type { ParamMeta } from "../types";
import type { AnswerStepItem } from "@/components/UI";
import { MATH_COLORS } from "@/theme";
import type { ScenarioSpec } from "@/types/scenario";
import type { ConicAsymStudyMode } from "@/math/conicAsymmetricVieta";

export const defaultParams = {
  a: 3.0,
  b: 2.0,
  x0: 2.0,
  m: 0.6,
  halfSpan: 2.0,
  thetaDeg: 60,
  sqSumK: 16,
  angleDeg: 55,
  lineK: 0.2,
  lineB: -0.6,
  probePx: 0.5,
} as const;

export type ConicAsymParams = {
  a: number;
  b: number;
  x0: number;
  m: number;
  halfSpan: number;
  thetaDeg: number;
  sqSumK: number;
  angleDeg: number;
  lineK: number;
  lineB: number;
  probePx: number;
};

export function getConicAsymAnswerSteps(): AnswerStepItem[] {
  return [
    {
      step: 1,
      title: "审题定法 · 过定点反设直线联立椭圆",
      sceneHint: "高亮显示动直线 AB 与椭圆交点坐标",
    },
    {
      step: 2,
      title: "建模联立 · 提取和积比例消去非对称积项",
      sceneHint: "聚焦直线 PA 与 QB 对交点 T 纵坐标的线性交叉结构",
    },
    {
      step: 3,
      title: "求解反思 · 消元证得交点恒落定直线 x = a²/x0",
      sceneHint: "高亮追踪交点 T 及竖直定直线轨迹",
    },
  ];
}

export const CONIC_ASYM_SCENARIOS: Record<
  ConicAsymStudyMode,
  Record<string, ScenarioSpec<ConicAsymParams>>
> = {
  asymVieta: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "非对称韦达 · 和积互化消元",
      background:
        "新高考解析几何压轴最棘手结构：出现形如 $y_1/y_2$ 或 $(x_1+a)y_2$ 的非对称表达式。",
      condition:
        "椭圆 $\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1$，过定点 $(x_0,0)$ 的动直线交于 $A,B$，连线 $PA, QB$ 交于 $T$。",
      question:
        "利用韦达两根和与两根积的线性比例关系替掉 $m y_1 y_2$，证明交点 $T$ 恒在定直线上。",
      variant: "primary",
    },
    standardFocus: {
      id: "standardFocus",
      name: "定点(2,0)母题",
      badge: "高考压轴母题 · 定直线 x=4.5",
      background: "以椭圆内定点为枢纽的非对称斜率比定直线经典命题。",
      condition: "设定 $a=3, b=2$，定点 $M(2, 0)$，直线斜率倒数 $m=0.6$。",
      question:
        "定量计算交点 $T$ 横坐标并验证不论 $m$ 如何变化 $x_T$ 恒为 $\\frac{9}{2}$。",
      presetParams: { a: 3.0, b: 2.0, x0: 2.0, m: 0.6 },
      variant: "primary",
    },
  },
  hiddenCircle: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "隐圆模型 · 条件化圆轨迹",
      background:
        "题干不直接给出圆方程，而以直角、定张角或距离平方和定值隐蔽刻画动点圆轨迹。",
      condition: "设定两定点 $A(-c,0), B(c,0)$ 与动点 $P$ 沿对应几何约束运动。",
      question:
        "依据直径圆、圆周角定理与中线长公式写出隐圆的标准方程及圆心半径。",
      variant: "primary",
    },
    diameter: {
      id: "diameter",
      name: "向量垂直直径圆",
      badge: "隐圆模型一 · PA·PB = 0",
      background: "利用平面向量数量积为零等价于以线段 $AB$ 为直径的圆周。",
      condition:
        "动点 $P$ 满足 $\\overrightarrow{PA} \\cdot \\overrightarrow{PB} = 0$（除 $A, B$ 两点）。",
      question: "验证动点 $P$ 在圆周上任意移动时数量积恒保持零值。",
      variant: "primary",
    },
    fixedAngle: {
      id: "fixedAngle",
      name: "定弦定角圆弧",
      badge: "隐圆模型二 · 固定视角 θ",
      background:
        "正弦定理外接圆半径公式 $2R = \\frac{AB}{\\sin\\theta}$ 决定圆轨迹。",
      condition: "保持定弦 $AB$ 与视角 $\\angle APB = \\theta$ 恒定。",
      question: "推导隐圆圆心纵坐标及半径随张角 $\\theta$ 变化的解析公式。",
      variant: "accent",
    },
    distSumSq: {
      id: "distSumSq",
      name: "平方和定值圆",
      badge: "隐圆模型三 · PA²+PB² = k",
      background: "平行四边形中线长平方公式化简两点距离平方和为同心圆。",
      condition: "动点满足 $PA^2 + PB^2 = k$（$k > \\frac{1}{2}AB^2$）。",
      question: "求出圆心坐标及保证轨迹存在的参数 $k$ 最小阈值。",
      variant: "warning",
    },
  },
  symmetryShortest: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "点线对称 · 将军饮马最短路径",
      background:
        "利用轴对称镜像变换把折线之和 $|PA|+|PB|$ 化归为两点之间直线段距离。",
      condition:
        "定点 $A, B$ 位于直线 $y = kx + b$ 同侧，动点 $P$ 在直线上滑动。",
      question:
        "求出镜像点 $A'$ 坐标与最优落点 $P^*$，证明 $|PA|+|PB| \\ge |A'B|$。",
      variant: "primary",
    },
    horizontalMirror: {
      id: "horizontalMirror",
      name: "斜线镜像最短",
      badge: "解析几何高频 · 折线拉直",
      background: "在三角形周长最值、抛物线准线折线最短题型中广泛使用。",
      condition:
        "设定直线 $y = 0.2x - 0.6$，比较拖动点 $P$ 与镜像连接点 $P^*$。",
      question: "计算对称轴镜像点 $A'$ 及最短路径下界 $|A'B|$。",
      presetParams: { lineK: 0.2, lineB: -0.6, probePx: 0.2 },
      variant: "primary",
    },
  },
};

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "椭圆长半轴 a",
    labelFormula: `\\text{长半轴 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: 2.5,
    max: 4.5,
    step: 0.5,
    defaultValue: 3.0,
    group: "椭圆基本参数",
    importance: "core",
  },
  b: {
    key: "b",
    label: "椭圆短半轴 b",
    labelFormula: `\\text{短半轴 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
    min: 1.5,
    max: 2.5,
    step: 0.5,
    defaultValue: 2.0,
    group: "椭圆基本参数",
    importance: "core",
  },
  x0: {
    key: "x0",
    label: "定点横坐标 x0",
    labelFormula: `\\text{定点 } \\color{${MATH_COLORS.paramTertiary}}{x_0}`,
    min: 1.2,
    max: 2.4,
    step: 0.2,
    defaultValue: 2.0,
    group: "动直线参数",
    importance: "core",
  },
  m: {
    key: "m",
    label: "斜率倒数 m",
    labelFormula: `\\text{斜率倒数 } \\color{${MATH_COLORS.paramPrimary}}{m}`,
    min: -1.5,
    max: 1.5,
    step: 0.1,
    defaultValue: 0.6,
    group: "动直线参数",
    importance: "core",
  },
  halfSpan: {
    key: "halfSpan",
    label: "半弦距 c",
    labelFormula: `\\text{半弦距 } \\color{${MATH_COLORS.paramPrimary}}{c}`,
    min: 1.5,
    max: 3.0,
    step: 0.25,
    defaultValue: 2.0,
    group: "隐圆几何参数",
    importance: "core",
  },
  thetaDeg: {
    key: "thetaDeg",
    label: "圆周张角 θ",
    labelFormula: `\\text{张角 } \\color{${MATH_COLORS.paramSecondary}}{\\theta}`,
    min: 40,
    max: 120,
    step: 5,
    defaultValue: 60,
    unit: "°",
    group: "隐圆几何参数",
    importance: "core",
  },
  sqSumK: {
    key: "sqSumK",
    label: "距离平方和 k",
    labelFormula: `\\text{平方和 } \\color{${MATH_COLORS.paramSecondary}}{k}`,
    min: 10,
    max: 26,
    step: 2,
    defaultValue: 16,
    group: "隐圆几何参数",
    importance: "core",
  },
  angleDeg: {
    key: "angleDeg",
    label: "动点方位角 φ",
    labelFormula: `\\text{方位角 } \\color{${MATH_COLORS.function}}{\\varphi}`,
    min: 20,
    max: 160,
    step: 5,
    defaultValue: 55,
    unit: "°",
    group: "动点追踪",
    importance: "advanced",
  },
  lineK: {
    key: "lineK",
    label: "对称轴斜率 k",
    labelFormula: `\\text{轴斜率 } \\color{${MATH_COLORS.paramPrimary}}{k}`,
    min: -0.6,
    max: 0.6,
    step: 0.1,
    defaultValue: 0.2,
    group: "对称直线参数",
    importance: "core",
  },
  lineB: {
    key: "lineB",
    label: "对称轴截距 b",
    labelFormula: `\\text{轴截距 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
    min: -1.5,
    max: 0.5,
    step: 0.2,
    defaultValue: -0.6,
    group: "对称直线参数",
    importance: "core",
  },
  probePx: {
    key: "probePx",
    label: "动点横坐标 xP",
    labelFormula: `\\text{动点 } \\color{${MATH_COLORS.paramTertiary}}{x_P}`,
    min: -3.5,
    max: 3.5,
    step: 0.1,
    defaultValue: 0.5,
    group: "动点追踪",
    importance: "core",
  },
};
