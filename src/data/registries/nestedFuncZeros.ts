import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";
import type { ScenarioSpec } from "@/types/scenario";
import type { NestedFuncMode } from "@/math/nestedFuncZeros";

export const defaultParams = {
  targetA: 0.6,
  paramB: 2.0,
  shiftC: 0.0,
} as const;

export type NestedFuncParams = {
  targetA: number;
  paramB: number;
  shiftC: number;
};

export const NESTED_FUNC_SCENARIOS: Record<
  NestedFuncMode,
  Record<string, ScenarioSpec<NestedFuncParams>>
> = {
  quadraticNested: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "嵌套零点 · 翻折双谷",
      background:
        "新高考选填压轴高频模型：先令内层 $t = f(x)$ 求解外层根，再反求内层交点总个数。",
      condition: "给定 $f(x) = |x^2 - bx| + c$，考察复合方程 $f(f(x)) = a$。",
      question:
        "扫描目标水平线 $y = a$，求外层根 $t_k$ 对应的内层直线交点个数及总实根总数。",
      variant: "primary",
    },
    eightRoots: {
      id: "eightRoots",
      name: "八根满载区间",
      badge: "选填压轴 · 翻折双谷多根",
      background: "当水平线落在底谷与翻折顶峰之间时，可激发双层裂变多根。",
      condition: "取 $b = 2, c = 0$，水平线 $a = 0.5$ 穿越翻折峰高 $1$。",
      question:
        "论证为何每个正外层根均产生不同支路交点，并数出总计交点个数与区间临界。",
      presetParams: { targetA: 0.5, paramB: 2.0, shiftC: 0.0 },
      variant: "primary",
    },
    tangentPeak: {
      id: "tangentPeak",
      name: "峰顶切线临界",
      badge: "突变边界 · 根数跃迁",
      background: "水平线恰与翻折顶点高度重合，根的个数发生关键分界。",
      condition: "取 $b = 2, c = 0$，令 $a = 1.0$ 恰过翻折波峰顶点 $(1, 1)$。",
      question:
        "比较 $a = 1$ 与 $a > 1$、$0 < a < 1$ 两侧根个数的阶梯跳变，写出临界范围。",
      presetParams: { targetA: 1.0, paramB: 2.0, shiftC: 0.0 },
      variant: "warning",
    },
  },
  piecewiseNested: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "分段嵌套 · 对数绝对值+抛物线",
      background:
        "最经典的全国卷/新高考压轴分段函数嵌套零点母题：左段抛物线衔接右段对数翻折。",
      condition:
        "设 $f(x) = \\begin{cases}-(x+1)^2+2+c, & x \\le 0 \\\\ |\\ln x|+c, & x > 0\\end{cases}$，求 $f(f(x))=a$ 的实根总数。",
      question:
        "分离左支与右支的取值范围，求解嵌套方程在不同区间内对应的总零点个数。",
      variant: "primary",
    },
    classicFive: {
      id: "classicFive",
      name: "标准分层交点",
      badge: "高考真题原型 · 双支合并",
      background: "左支最高点高度为 $2$、衔接点高度为 $1$，右支渐近无限延伸。",
      condition: "令平移参数 $c = 0$，探测高度 $a = 0.8$。",
      question:
        "逐一列出外层根 $t_1 < 0 < t_2 < t_3$，并回代内层图像数出各支交点总和。",
      presetParams: { targetA: 0.8, shiftC: 0.0 },
      variant: "primary",
    },
  },
  paramBound: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "逆向求参 · 由根定参",
      background:
        "已知方程 $f(f(x)) = a$ 恰有 $k$ 个互异实根，逆推参数 $a$ 或纵向平移 $c$ 的取值范围。",
      condition:
        "给定 $f(x) = |x^2 - bx| + c$，调节 $a$ 与 $c$ 追踪总根数变化。",
      question:
        "由内层各区间段映射高度，确定恰好产生 $2, 4, 6, 8$ 个根的参数范围区间。",
      variant: "accent",
    },
    shiftRange: {
      id: "shiftRange",
      name: "平移定根范围",
      badge: "逆向临界 · c 取值定界",
      background: "通过上下平移整个函数图象改变 $t = f(x)$ 的可达值域下界。",
      condition: "取 $b = 2, c = 0.5$，目标高度 $a = 1.2$。",
      question: "判断下界抬高至 $0.5$ 后有哪些外层根落空，进而求解总根数范围。",
      presetParams: { targetA: 1.2, paramB: 2.0, shiftC: 0.5 },
      variant: "warning",
    },
  },
};

export const paramMeta: Record<string, ParamMeta> = {
  targetA: {
    key: "targetA",
    label: "外层目标高度 a",
    labelFormula: `\\text{目标高度 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: -0.5,
    max: 3.0,
    step: 0.1,
    defaultValue: 0.6,
    group: "目标扫描线控制",
    importance: "core",
    marks: [{ value: 0, label: "0", variant: "recommended" }],
  },
  paramB: {
    key: "paramB",
    label: "对称轴系数 b",
    labelFormula: `\\text{系数 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
    min: 1.0,
    max: 3.5,
    step: 0.5,
    defaultValue: 2.0,
    group: "内层函数形态",
    importance: "core",
  },
  shiftC: {
    key: "shiftC",
    label: "纵向平移量 c",
    labelFormula: `\\text{平移 } \\color{${MATH_COLORS.paramTertiary}}{c}`,
    min: -1.0,
    max: 1.5,
    step: 0.25,
    defaultValue: 0.0,
    group: "内层函数形态",
    importance: "core",
  },
};
