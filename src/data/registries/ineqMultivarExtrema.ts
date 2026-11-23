import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";
import type { ScenarioSpec } from "@/types/scenario";
import type { MultivarIneqMode } from "@/math/ineqMultivarExtrema";

export const defaultParams = {
  coefP: 1.0,
  coefQ: 1.0,
  numM: 1.0,
  numN: 4.0,
  constC: 4.0,
  probeX: 1.2,
  elimA: 1.0,
  elimB: 1.0,
  homogK: 4.0,
  ratioT: 1.5,
} as const;

export type IneqMultivarParams = {
  coefP: number;
  coefQ: number;
  numM: number;
  numN: number;
  constC: number;
  probeX: number;
  elimA: number;
  elimB: number;
  homogK: number;
  ratioT: number;
};

export const INEQ_MULTIVAR_SCENARIOS: Record<
  MultivarIneqMode,
  Record<string, ScenarioSpec<IneqMultivarParams>>
> = {
  oneSub: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "常数1代换 · 和定求倒数和",
      background:
        "新高考最经典的二元条件最值题型：已知正实数线性约束，求分式线性组合的最小值。",
      condition:
        "已知 $px + qy = c$（$x, y > 0$），求 $T = \\frac{m}{x} + \\frac{n}{y}$。",
      question:
        "乘以整体常数 $\\frac{px+qy}{c}=1$ 构造倒数互消对，求出最小值及取等条件坐标 $(x^*, y^*)$。",
      variant: "primary",
    },
    classicOneFour: {
      id: "classicOneFour",
      name: "1与4倒数母题",
      badge: "高考真题母题 · 1/x+4/y",
      background: "典型配凑模型：约束线与目标等高曲线在第一象限贴合取最小。",
      condition:
        "已知 $x + y = 2$（$x, y > 0$），求 $\\frac{1}{x} + \\frac{4}{y}$ 的最小值。",
      question:
        "计算目标最小值 $\\frac{9}{2}$ 及取等点坐标 $(\\frac{2}{3}, \\frac{4}{3})$。",
      presetParams: {
        coefP: 1,
        coefQ: 1,
        numM: 1,
        numN: 4,
        constC: 2,
        probeX: 0.67,
      },
      variant: "primary",
    },
  },
  elim: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "凑因式消元 · xy+ax+by=c",
      background:
        "面对既含积项 $xy$ 又含一次项 $ax+by$ 的混合条件，可通过补常数项因式分解降维。",
      condition:
        "已知 $xy + ax + by = c$（$x, y > 0$），改写为 $(x+b)(y+a) = c+ab$。",
      question: "利用积定和最小求解 $x+y$ 的最小值及对应的唯一正实数取等点。",
      variant: "primary",
    },
    factorNine: {
      id: "factorNine",
      name: "积定乘积凑9",
      badge: "高考经典 · 因式分解降维",
      background: "通过因式化归双曲线分支，将混合式转化为标准反比例形态。",
      condition: "已知 $xy + x + y = 8$（$x, y > 0$），凑得 $(x+1)(y+1)=9$。",
      question:
        "求 $x + y$ 的最小值，说明为何直接均值不凑常数项会漏掉交叉一次项。",
      presetParams: { elimA: 1, elimB: 1, constC: 8, probeX: 2.0 },
      variant: "primary",
    },
  },
  homog: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "齐次比值换元 · 减元化一",
      background:
        "当分子与分母每一项次数相同（或常数可代入齐次化）时，令 $t = \\frac{x}{y}$ 可瞬间消去一个变元。",
      condition:
        "设正比值 $t = \\frac{x}{y} > 0$，考察齐次目标 $T = t + \\frac{k}{t}$。",
      question:
        "将二元分式化归为单变量对勾函数求最小值，并验证取等比值 $t^*$。",
      variant: "primary",
    },
    homogFour: {
      id: "homogFour",
      name: "齐次比值最小值",
      badge: "高分利器 · 减元对勾",
      background: "把二次齐次不等式压缩为标准一维比值最值问题。",
      condition:
        "取比例系数 $k = 4$，在正射线比值 $t > 0$ 上求 $t + \\frac{4}{t}$。",
      question: "求出最小值 $4$ 及取等比例 $x : y = 2 : 1$。",
      presetParams: { homogK: 4, ratioT: 2.0 },
      variant: "accent",
    },
  },
  sumProd: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "和积互化 · 一元二次不等式定界",
      background:
        "当条件式天然对称于 $x+y$ 与 $xy$ 时，利用 $xy \\le (\\frac{x+y}{2})^2$ 双向消元。",
      condition: "已知 $x + y + xy = c$（$x, y > 0$）。",
      question:
        "分别消去 $xy$ 与消去 $(x+y)$，解一元二次不等式求出和的最小值与积的最大值。",
      variant: "primary",
    },
    symThree: {
      id: "symThree",
      name: "和积对称母题",
      badge: "选填经典 · x+y+xy=3",
      background: "和与积双向转化经典题型，同一方程分别给出最小和与最大积。",
      condition: "已知 $x + y + xy = 3$（$x, y > 0$）。",
      question:
        "证明 $x + y \\ge 2$ 且 $xy \\le 1$，并指出两者恰好同时在 $x=y=1$ 处取等。",
      presetParams: { constC: 3, probeX: 1.0 },
      variant: "primary",
    },
  },
};

export const paramMeta: Record<string, ParamMeta> = {
  coefP: {
    key: "coefP",
    label: "x 系数 p",
    labelFormula: `\\text{系数 } \\color{${MATH_COLORS.paramPrimary}}{p}`,
    min: 0.5,
    max: 3.0,
    step: 0.5,
    defaultValue: 1.0,
    group: "约束线参数",
    importance: "core",
  },
  coefQ: {
    key: "coefQ",
    label: "y 系数 q",
    labelFormula: `\\text{系数 } \\color{${MATH_COLORS.paramSecondary}}{q}`,
    min: 0.5,
    max: 3.0,
    step: 0.5,
    defaultValue: 1.0,
    group: "约束线参数",
    importance: "core",
  },
  constC: {
    key: "constC",
    label: "约束常数 c",
    labelFormula: `\\text{常数 } \\color{${MATH_COLORS.function}}{c}`,
    min: 2.0,
    max: 10.0,
    step: 0.5,
    defaultValue: 4.0,
    group: "约束线参数",
    importance: "core",
  },
  numM: {
    key: "numM",
    label: "分式分子 m",
    labelFormula: `\\text{分子 } \\color{${MATH_COLORS.paramPrimary}}{m}`,
    min: 1.0,
    max: 6.0,
    step: 1.0,
    defaultValue: 1.0,
    group: "目标分式参数",
    importance: "core",
  },
  numN: {
    key: "numN",
    label: "分式分子 n",
    labelFormula: `\\text{分子 } \\color{${MATH_COLORS.paramTertiary}}{n}`,
    min: 1.0,
    max: 8.0,
    step: 1.0,
    defaultValue: 4.0,
    group: "目标分式参数",
    importance: "core",
  },
  probeX: {
    key: "probeX",
    label: "试探横坐标 x0",
    labelFormula: `\\text{试探 } \\color{${MATH_COLORS.paramSecondary}}{x_0}`,
    min: 0.3,
    max: 3.5,
    step: 0.1,
    defaultValue: 1.2,
    group: "可行域动点",
    importance: "core",
  },
  elimA: {
    key: "elimA",
    label: "x 系数 a",
    labelFormula: `\\text{系数 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: 0.5,
    max: 3.0,
    step: 0.5,
    defaultValue: 1.0,
    group: "因式分解参数",
    importance: "core",
  },
  elimB: {
    key: "elimB",
    label: "y 系数 b",
    labelFormula: `\\text{系数 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
    min: 0.5,
    max: 3.0,
    step: 0.5,
    defaultValue: 1.0,
    group: "因式分解参数",
    importance: "core",
  },
  homogK: {
    key: "homogK",
    label: "齐次比系数 k",
    labelFormula: `\\text{系数 } \\color{${MATH_COLORS.paramPrimary}}{k}`,
    min: 1.0,
    max: 9.0,
    step: 0.5,
    defaultValue: 4.0,
    group: "齐次换元参数",
    importance: "core",
  },
  ratioT: {
    key: "ratioT",
    label: "比值 t = x/y",
    labelFormula: `\\text{比值 } \\color{${MATH_COLORS.paramSecondary}}{t}`,
    min: 0.4,
    max: 4.5,
    step: 0.1,
    defaultValue: 1.5,
    group: "齐次换元参数",
    importance: "core",
  },
};
