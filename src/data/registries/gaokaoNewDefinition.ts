import type { ParamMeta } from "../types";
import type { AnswerStepItem } from "@/components/UI";
import { MATH_COLORS } from "@/theme";
import type { ScenarioSpec } from "@/types/scenario";
import type { NewDefinitionStudyMode } from "@/math/gaokaoNewDefinition";

export const defaultParams = {
  seqM: 1,
  dropI: 1,
  dropJ: 2,
  iterR: 2.6,
  iterX0: 0.2,
  iterSteps: 7,
  manRadius: 2.0,
  manC: 2.0,
} as const;

export type GaokaoNewDefinitionParams = {
  seqM: number;
  dropI: number;
  dropJ: number;
  iterR: number;
  iterX0: number;
  iterSteps: number;
  manRadius: number;
  manC: number;
};

export function getNewDefinitionAnswerSteps(
  mode: NewDefinitionStudyMode,
): AnswerStepItem[] {
  if (mode === "divisibleSeq") {
    return [
      {
        step: 1,
        title: "审题定法 · 翻译 (4m+2, i, j)-可分条件",
        sceneHint: "高亮点亮全集网格与剔除元素 (i, j)",
      },
      {
        step: 2,
        title: "建模联立 · 检验模 4 余数与公差匹配",
        sceneHint: "聚焦剩余 4m 项的模 4 同余分布与分组尝试",
      },
      {
        step: 3,
        title: "求解反思 · 构造等差四元组划分并验证",
        sceneHint: "高亮展示合法的 m 组等差四元组彩色连线划分",
      },
    ];
  }
  if (mode === "fixedPointIter") {
    return [
      {
        step: 1,
        title: "审题定法 · 联立 f(x)=x 解出不动点",
        sceneHint: "聚焦函数曲线与直线 y=x 交点（不动点）",
      },
      {
        step: 2,
        title: "建模联立 · 迭代推进生成蛛网阶梯折线",
        sceneHint: "高亮蛛网垂直-水平反射路径与前几步轨迹",
      },
      {
        step: 3,
        title: "求解反思 · 依斜率绝对值判别收敛与周期",
        sceneHint: "聚焦末端吸引点或 2-周期循环矩形闭环",
      },
    ];
  }
  return [
    {
      step: 1,
      title: "审题定法 · 写出 L1 广义距离代数表达式",
      sceneHint: "高亮中心点与四象限绝对值拆解边界",
    },
    {
      step: 2,
      title: "建模联立 · 对照欧氏圆与曼哈顿正菱形",
      sceneHint: "聚焦旋转 45 度正菱形等距集与面积对比",
    },
    {
      step: 3,
      title: "求解反思 · 推导两点等距线折线构造",
      sceneHint: "高亮两定点之间折线形 L1 中垂线轨迹",
    },
  ];
}

export const NEW_DEFINITION_SCENARIOS: Record<
  NewDefinitionStudyMode,
  Record<string, ScenarioSpec<GaokaoNewDefinitionParams>>
> = {
  divisibleSeq: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "2024新课标I卷19题 · 可分数列",
      background:
        "新高考第 19 题压轴创新情境：将前 $4m+2$ 个正整数剔除两项后按等差四元组划分。",
      condition:
        "全集 $S = \\{1, 2, \\dots, 4m+2\\}$，剔除两项 $1 \\le i < j \\le 4m+2$。",
      question:
        "判定 $(i, j)$ 是否构成可分数列；若可分，构造出一种合法的 $m$ 组等差四元组划分方案。",
      variant: "primary",
    },
    m1Valid: {
      id: "m1Valid",
      name: "m=1合法(1,6)",
      badge: "首尾剔除 · 最简可分构型",
      background: "取最简情形 $m=1$，考察数列 $1,2,3,4,5,6$ 的所有可分删法。",
      condition: "取 $m = 1$（全集 $6$ 项），剔除首尾两项 $i = 1, j = 6$。",
      question: "证明剩余四项 $\\{2,3,4,5\\}$ 构成公差为 $1$ 的四项等差数列。",
      presetParams: { seqM: 1, dropI: 1, dropJ: 6 },
      variant: "primary",
    },
    m1Invalid: {
      id: "m1Invalid",
      name: "m=1反例(1,4)",
      badge: "反例否定 · 模4同余受阻",
      background: "为何并非任意两数都能剔除，需要通过模 $4$ 同余与穷举证明。",
      condition: "取 $m = 1$，剔除 $i = 1, j = 4$，剩余 $\\{2, 3, 5, 6\\}$。",
      question: "论证剩余集合相邻差分别为 $1, 2, 1$，无法组成四项等差数列。",
      presetParams: { seqM: 1, dropI: 1, dropJ: 4 },
      variant: "danger",
    },
    m2Valid: {
      id: "m2Valid",
      name: "m=2双组(1,10)",
      badge: "递推构造 · 两组公差配对",
      background: "利用模 $4$ 划分将 $m=2$（$10$ 项）拓展至一般归纳构造。",
      condition: "取 $m = 2$（全集 $10$ 项），剔除 $i = 1, j = 10$。",
      question:
        "构造剩余 $8$ 项划分为 $2$ 组等差四元组，并总结一般模 $4$ 构造律。",
      presetParams: { seqM: 2, dropI: 1, dropJ: 10 },
      variant: "accent",
    },
  },
  fixedPointIter: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "函数新定义 · 迭代与不动点",
      background:
        "多地新高考模拟第 19 题聚焦函数迭代 $x_{n+1}=f(x_n)$ 与不动点收敛证明。",
      condition: "给定迭代映射 $f(x) = r x(1-x)$ 与初值 $x_0 \\in (0, 1)$。",
      question:
        "求解非零不动点 $x^*$，并根据斜率 $|f'(x^*)|$ 判定轨迹是单调/螺旋收敛还是进入周期震荡。",
      variant: "primary",
    },
    attractSpiral: {
      id: "attractSpiral",
      name: "吸引收敛不动点",
      badge: "压缩映射 · 螺旋趋近",
      background:
        "斜率满足 $-1 < f'(x^*) < 0$ 时，蛛网折线呈逆时针螺旋向内收缩。",
      condition: "设定 $r = 2.6$，初值 $x_0 = 0.2$。",
      question:
        "求出不动点 $x^* = 1 - \\frac{1}{r}$ 并验证迭代序列逐项逼近该定点。",
      presetParams: { iterR: 2.6, iterX0: 0.2, iterSteps: 8 },
      variant: "primary",
    },
    periodTwo: {
      id: "periodTwo",
      name: "失稳2-周期分岔",
      badge: "新定义周期 · 不动点排斥",
      background:
        "当参数越过临界值 $r = 3$ 后，不动点失去稳定性，轨迹落入二周期矩形环。",
      condition: "设定 $r = 3.3$，初值 $x_0 = 0.25$。",
      question:
        "证明此时不动点排斥附近轨道，解释迭代数列为何在两个极限点之间周期交替。",
      presetParams: { iterR: 3.3, iterX0: 0.25, iterSteps: 10 },
      variant: "warning",
    },
  },
  manhattanGeom: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "几何新定义 · 曼哈顿L1距离",
      background:
        "城市网格导航与几何新定义大题常定义“直角距离” $d_M(P,Q)=|x_1-x_2|+|y_1-y_2|$。",
      condition:
        "设曼哈顿圆半径为 $R$，定点对称参数为 $c$，对比同心欧氏圆与曼哈顿菱形。",
      question:
        "求曼哈顿“圆”的周长与面积公式，并推导两点曼哈顿等距集（折线中垂线）解析方程。",
      variant: "primary",
    },
    unitDiamond: {
      id: "unitDiamond",
      name: "菱形圆周率",
      badge: "几何直观 · 周长面积比",
      background: "探究 L1 度量体系下“圆周长与直径之比”的新奇恒定常数。",
      condition: "设定半径 $R = 2.0$，对比圆心在原点的曼哈顿圆与欧氏圆。",
      question:
        "计算曼哈顿周长 $4\\sqrt{2}R$ 与面积 $2R^2$，求该度量下广义圆周率值。",
      presetParams: { manRadius: 2.0, manC: 2.0 },
      variant: "primary",
    },
  },
};

export const paramMeta: Record<string, ParamMeta> = {
  seqM: {
    key: "seqM",
    label: "分组规模 m",
    labelFormula: `\\text{组数 } \\color{${MATH_COLORS.paramPrimary}}{m}`,
    min: 1,
    max: 3,
    step: 1,
    defaultValue: 1,
    group: "可分数列参数",
    importance: "core",
  },
  dropI: {
    key: "dropI",
    label: "剔除小项 i",
    labelFormula: `\\text{剔除 } \\color{${MATH_COLORS.paramSecondary}}{i}`,
    min: 1,
    max: 13,
    step: 1,
    defaultValue: 1,
    group: "可分数列参数",
    importance: "core",
  },
  dropJ: {
    key: "dropJ",
    label: "剔除大项 j",
    labelFormula: `\\text{剔除 } \\color{${MATH_COLORS.paramTertiary}}{j}`,
    min: 2,
    max: 14,
    step: 1,
    defaultValue: 2,
    group: "可分数列参数",
    importance: "core",
  },
  iterR: {
    key: "iterR",
    label: "迭代参数 r",
    labelFormula: `\\text{参数 } \\color{${MATH_COLORS.paramPrimary}}{r}`,
    min: 1.2,
    max: 3.5,
    step: 0.1,
    defaultValue: 2.6,
    group: "函数迭代参数",
    importance: "core",
    marks: [{ value: 3.0, label: "3(分岔)", variant: "critical" }],
  },
  iterX0: {
    key: "iterX0",
    label: "迭代初值 x0",
    labelFormula: `\\text{初值 } \\color{${MATH_COLORS.paramSecondary}}{x_0}`,
    min: 0.1,
    max: 0.9,
    step: 0.05,
    defaultValue: 0.2,
    group: "函数迭代参数",
    importance: "core",
  },
  iterSteps: {
    key: "iterSteps",
    label: "迭代步数 N",
    labelFormula: `\\text{步数 } \\color{${MATH_COLORS.function}}{N}`,
    min: 2,
    max: 12,
    step: 1,
    defaultValue: 7,
    group: "函数迭代参数",
    importance: "advanced",
  },
  manRadius: {
    key: "manRadius",
    label: "广义半径 R",
    labelFormula: `\\text{半径 } \\color{${MATH_COLORS.paramPrimary}}{R}`,
    min: 1.0,
    max: 3.0,
    step: 0.25,
    defaultValue: 2.0,
    group: "曼哈顿度量参数",
    importance: "core",
  },
  manC: {
    key: "manC",
    label: "对称定点参数 c",
    labelFormula: `\\text{定点距 } \\color{${MATH_COLORS.paramSecondary}}{c}`,
    min: 0.8,
    max: 2.8,
    step: 0.2,
    defaultValue: 2.0,
    group: "曼哈顿度量参数",
    importance: "core",
  },
};
