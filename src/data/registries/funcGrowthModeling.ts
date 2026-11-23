import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";
import type { ScenarioSpec } from "@/types/scenario";
import type { FuncGrowthMode } from "@/math/funcGrowthModeling";

export const defaultParams = {
  baseA: 1.8,
  powerN: 2,
  linearK: 3.0,
  xProbe: 4.5,
  usage: 6.5,
  rate1: 2.0,
  rate2: 3.5,
  rate3: 5.0,
  gainScale: 1.0,
} as const;

export type FuncGrowthParams = {
  baseA: number;
  powerN: number;
  linearK: number;
  xProbe: number;
  usage: number;
  rate1: number;
  rate2: number;
  rate3: number;
  gainScale: number;
};

export const FUNC_GROWTH_SCENARIOS: Record<
  FuncGrowthMode,
  Record<string, ScenarioSpec<FuncGrowthParams>>
> = {
  growthRace: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "增长差异 · 四类模型竞速",
      background:
        "细胞分裂、复利计息与算法耗时分析中，不同函数模型的长期增长差异巨大。",
      condition:
        "在第一象限同时对比 $y = a^x (a>1)$、$y = x^n$、$y = kx$ 与 $y = \\log_a x$。",
      question:
        "推进探测点 $x_0$ 并对比各模型纵坐标增速，判定指数增长反超幂增长的临界规律。",
      variant: "primary",
    },
    expOvertake: {
      id: "expOvertake",
      name: "指数反超幂次",
      badge: "课标核心 · 指数爆炸特性",
      background: "银行复利与常规线性补贴随时间推移后的收益逆转现象。",
      condition: "设定底数 $a = 2.0$，幂次 $n = 2$，一次斜率 $k = 3$。",
      question:
        "求解 $2^x > x^2$ 且 $2^x > 3x$ 成立后指数函数保持绝对领先的区间范围。",
      presetParams: { baseA: 2.0, powerN: 2, linearK: 3.0, xProbe: 6.0 },
      variant: "primary",
    },
    logSlow: {
      id: "logSlow",
      name: "对数平缓增长",
      badge: "二分查找 · 增长最慢模型",
      background: "大规模数据检索中对数时间复杂度优于线性浏览的数学原理。",
      condition: "取 $a = 2.0$，一次斜率 $k = 1.5$，在 $x_0 = 5$ 处取值比较。",
      question:
        "定量对比 $\\log_2 x$ 与 $1.5x$ 在较大自变量下的函数值悬殊差异。",
      presetParams: { baseA: 2.0, powerN: 2, linearK: 1.5, xProbe: 5.0 },
      variant: "accent",
    },
  },
  piecewiseBilling: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "函数应用(一) · 阶梯计费建模",
      background:
        "居民阶梯水电费、网约车里程计价与阶梯税收均属于典型的分段线性函数模型。",
      condition:
        "设用量分界点为 $4$ 与 $8$，三档单位递增单价分别为 $r_1 \\le r_2 \\le r_3$。",
      question:
        "写出总费用 $C(x)$ 的分段解析式，验证分界点衔接连续性并求平均单价变化趋势。",
      variant: "primary",
    },
    waterTier: {
      id: "waterTier",
      name: "阶梯水费模型",
      badge: "必修一 3.4 · 生活建模原型",
      background: "城市节约用水阶梯水价方案核算月度总水费。",
      condition:
        "第一档 $0\\sim 4$ 吨每吨 $2$ 元，第二档 $4\\sim 8$ 吨每吨 $3.5$ 元，超过 $8$ 吨每吨 $5$ 元，当前用量 $9.5$ 吨。",
      question: "计算总水费并判断平均单价随用量增大为何呈现递增走势。",
      presetParams: { usage: 9.5, rate1: 2.0, rate2: 3.5, rate3: 5.0 },
      variant: "primary",
    },
    thresholdJump: {
      id: "thresholdJump",
      name: "边界阈值临界",
      badge: "易错防坑 · 切忌整段直乘",
      background:
        "阶梯计费常考误区：超额部分才按高档单价结算，而非全部用量按最高档乘。",
      condition:
        "用量恰处于第二档分界 $x = 8.0$，对比分段累计与整段直乘的差额。",
      question:
        "证明分段累计建模为何在分界点 $x=4$ 与 $x=8$ 处保持连续无跳跃。",
      presetParams: { usage: 8.0, rate1: 2.0, rate2: 4.0, rate3: 6.0 },
      variant: "warning",
    },
  },
  scatterFitting: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "函数应用(二) · 散点拟合选型",
      background:
        "科学实验与经济预测中，需根据观测散点走向选择最佳初等函数模型并预测未来值。",
      condition:
        "给定 $5$ 组递增实验散点，对比一次、二次与指数型函数的残差平方和 $SSE$。",
      question:
        "根据残差平方和最小原则优选拟合函数，并预测 $x = 6$ 处的目标输出值。",
      variant: "primary",
    },
    expFit: {
      id: "expFit",
      name: "指数加速拟合",
      badge: "模型优选 · 最小残差原则",
      background: "针对倍增式增长散点，一次直线拟合在末端产生显著低估偏差。",
      condition: "保持原始观测散点，切换对比一次、二次与指数模型拟合曲线。",
      question:
        "比较三种模型的误差平方和 $SSE$ 数值，论证最契合趋势的函数类型。",
      presetParams: { gainScale: 1.0 },
      variant: "primary",
    },
  },
};

export const paramMeta: Record<string, ParamMeta> = {
  baseA: {
    key: "baseA",
    label: "底数 a",
    labelFormula: `\\text{底数 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: 1.2,
    max: 3.0,
    step: 0.1,
    defaultValue: 1.8,
    group: "函数增长参数",
    importance: "core",
  },
  powerN: {
    key: "powerN",
    label: "幂次 n",
    labelFormula: `\\text{幂次 } \\color{${MATH_COLORS.paramSecondary}}{n}`,
    min: 1,
    max: 3,
    step: 1,
    defaultValue: 2,
    group: "函数增长参数",
    importance: "core",
  },
  linearK: {
    key: "linearK",
    label: "一次斜率 k",
    labelFormula: `\\text{一次斜率 } \\color{${MATH_COLORS.paramTertiary}}{k}`,
    min: 1.0,
    max: 6.0,
    step: 0.5,
    defaultValue: 3.0,
    group: "函数增长参数",
    importance: "core",
  },
  xProbe: {
    key: "xProbe",
    label: "探测横坐标 x0",
    labelFormula: `\\text{探测点 } \\color{${MATH_COLORS.function}}{x_0}`,
    min: 0.5,
    max: 7.5,
    step: 0.1,
    defaultValue: 4.5,
    group: "探测位置控制",
    importance: "core",
  },
  usage: {
    key: "usage",
    label: "消费用量 x",
    labelFormula: `\\text{用量 } \\color{${MATH_COLORS.function}}{x}`,
    min: 0.5,
    max: 12.0,
    step: 0.5,
    defaultValue: 6.5,
    group: "阶梯计费参数",
    importance: "core",
    marks: [
      { value: 4, label: "4", variant: "recommended" },
      { value: 8, label: "8", variant: "recommended" },
    ],
  },
  rate1: {
    key: "rate1",
    label: "一档单价 r1",
    labelFormula: `\\text{一档单价 } \\color{${MATH_COLORS.paramPrimary}}{r_1}`,
    min: 1.0,
    max: 4.0,
    step: 0.5,
    defaultValue: 2.0,
    group: "阶梯计费参数",
    importance: "core",
  },
  rate2: {
    key: "rate2",
    label: "二档单价 r2",
    labelFormula: `\\text{二档单价 } \\color{${MATH_COLORS.paramSecondary}}{r_2}`,
    min: 2.0,
    max: 6.0,
    step: 0.5,
    defaultValue: 3.5,
    group: "阶梯计费参数",
    importance: "core",
  },
  rate3: {
    key: "rate3",
    label: "三档单价 r3",
    labelFormula: `\\text{三档单价 } \\color{${MATH_COLORS.paramTertiary}}{r_3}`,
    min: 3.0,
    max: 8.0,
    step: 0.5,
    defaultValue: 5.0,
    group: "阶梯计费参数",
    importance: "core",
  },
  gainScale: {
    key: "gainScale",
    label: "拟合倍率系数",
    labelFormula: `\\text{拟合倍率 } \\color{${MATH_COLORS.paramPrimary}}{\\lambda}`,
    min: 0.7,
    max: 1.3,
    step: 0.05,
    defaultValue: 1.0,
    group: "拟合校准控制",
    importance: "core",
  },
};
