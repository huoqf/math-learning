import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";
import type { ScenarioSpec } from "@/types/scenario";
import type { ExpLogCompareMode } from "@/math/expLogCompare";

export const defaultParams = {
  baseA: 2.0,
  valM: 2.0,
  valN: 3.0,
  newBaseC: 3.0,
  xSample: 0.6,
} as const;

export type ExpLogCompareParams = {
  baseA: number;
  valM: number;
  valN: number;
  newBaseC: number;
  xSample: number;
};

export const EXP_LOG_COMPARE_SCENARIOS: Record<
  ExpLogCompareMode,
  Record<string, ScenarioSpec<ExpLogCompareParams>>
> = {
  logOps: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "对数运算律 · 换底化同底",
      background:
        "科学计算与对数标尺把乘除运算化归为加减运算，实现指数幂次与高阶乘积的降维计算。",
      condition:
        "已知底数 $a > 0$ 且 $a \\ne 1$，正真数 $M > 0, N > 0$，换底中介底数 $c > 0$ 且 $c \\ne 1$。",
      question:
        "定量验证 $\\log_a(MN) = \\log_a M + \\log_a N$ 与换底公式 $\\log_a M = \\frac{\\log_c M}{\\log_c a}$ 的恒等性。",
      variant: "primary",
    },
    productSum: {
      id: "productSum",
      name: "积的对数等于和",
      badge: "课标重点 · 乘积化加",
      background: "对数运算核心法则：将乘方与乘法降维为倍数与加法。",
      condition: "取 $a = 2$，真数 $M = 2, N = 3$。",
      question:
        "计算 $\\log_2 6$ 与 $\\log_2 2 + \\log_2 3$，并比较图象上两点纵坐标叠加后的位置。",
      presetParams: { baseA: 2.0, valM: 2.0, valN: 3.0, newBaseC: 3.0 },
      variant: "primary",
    },
    changeBase: {
      id: "changeBase",
      name: "换底公式验证",
      badge: "真题高频 · 异底化同底",
      background: "解决不同底数对数混合乘除化简的核心工具。",
      condition: "取 $a = 2, M = 4$，引入中间底数 $c = 3$。",
      question:
        "通过 $\\frac{\\log_3 4}{\\log_3 2}$ 计算结果，论证为何任意合法中间底数 $c$ 均导出同一比值。",
      presetParams: { baseA: 2.0, valM: 4.0, valN: 2.0, newBaseC: 3.0 },
      variant: "accent",
    },
  },
  medianBridge: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "中间值搭桥 · 自主对比",
      background: "新高考选填常考查底数与真数均不相同的指对幂大小排序问题。",
      condition:
        "给定底数 $a > 0 (a \\ne 1)$ 与采样真数/指数 $x > 0$，对比 $a^x, \\log_a x, x^{0.5}$。",
      question:
        "利用基准水平线 $y=0$ 与 $y=1$ 判断三个数值所处区间并确定严格升序排列。",
      variant: "primary",
    },
    bridge01: {
      id: "bridge01",
      name: "0 与 1 搭桥母题",
      badge: "高考经典 · 选填第6题模板",
      background: "利用指数与对数函数在 $x=0$ 或 $x=1$ 处的定点取值划定区间。",
      condition:
        "比较 $A = 2^{0.3}$，$B = 0.3^2$，$C = \\log_2 0.3$ 三个数的大小。",
      question:
        "分别以 $0$ 与 $1$ 为桥梁界定 $A, B, C$ 的所属区间，写出严格从小到大排序。",
      variant: "primary",
    },
    bridgeHalf: {
      id: "bridgeHalf",
      name: "1/2 精细搭桥",
      badge: "选填进阶 · 同区间二次细分",
      background:
        "当两数同时落入 $(0, 1)$ 区间时，需引入精细中间值 $\\frac{1}{2}$ 进行二次隔离。",
      condition:
        "比较 $A = \\log_3 2$，$B = \\log_5 2$，$C = 2^{0.2}$ 的大小。",
      question:
        "借助 $\\frac{1}{2} = \\log_3 \\sqrt{3} = \\log_5 \\sqrt{5}$ 隔离同在 $(0, 1)$ 的对数值并排序。",
      variant: "warning",
    },
  },
  monotoneCompare: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "单调性比大小 · 双参数联动",
      background: "指数函数与幂函数在底数和指数各不相同时的交叉过渡技巧。",
      condition:
        "调节底数 $a$ 与自变量 $x$，同步追踪三大基本初等函数单调轨迹。",
      question:
        "判断在 $0 < a < 1$ 与 $a > 1$ 两种底数分支下各函数值的高低排序规律。",
      variant: "primary",
    },
    monotoneCross: {
      id: "monotoneCross",
      name: "交叉构造过渡",
      badge: "选填压轴 · 构造幂指桥",
      background: "当底数与指数同时变动时，固定其中之一构造中间过渡项。",
      condition: "比较 $A = 0.4^{0.5}$，$B = 0.4^{0.4}$，$C = 0.5^{0.4}$。",
      question:
        "分别利用指数函数 $y = 0.4^x$ 与幂函数 $y = x^{0.4}$ 的单调性证明三者大小链。",
      variant: "primary",
    },
  },
};

export const paramMeta: Record<string, ParamMeta> = {
  baseA: {
    key: "baseA",
    label: "底数 a",
    labelFormula: `\\text{底数 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: 0.2,
    max: 4.5,
    step: 0.1,
    defaultValue: 2.0,
    group: "底数与运算参数",
    importance: "core",
    marks: [{ value: 1.0, label: "1(退化)", variant: "critical" }],
  },
  valM: {
    key: "valM",
    label: "真数 M",
    labelFormula: `\\text{真数 } \\color{${MATH_COLORS.paramSecondary}}{M}`,
    min: 0.5,
    max: 6.0,
    step: 0.5,
    defaultValue: 2.0,
    group: "对数真数参数",
    importance: "core",
  },
  valN: {
    key: "valN",
    label: "真数 N",
    labelFormula: `\\text{真数 } \\color{${MATH_COLORS.paramTertiary}}{N}`,
    min: 0.5,
    max: 6.0,
    step: 0.5,
    defaultValue: 3.0,
    group: "对数真数参数",
    importance: "core",
  },
  newBaseC: {
    key: "newBaseC",
    label: "中间底数 c",
    labelFormula: `\\text{换底 } \\color{${MATH_COLORS.functionSecondary}}{c}`,
    min: 0.5,
    max: 5.0,
    step: 0.5,
    defaultValue: 3.0,
    group: "底数与运算参数",
    importance: "advanced",
    marks: [{ value: 1.0, label: "1(退化)", variant: "critical" }],
  },
  xSample: {
    key: "xSample",
    label: "取值点 x",
    labelFormula: `\\text{取值 } \\color{${MATH_COLORS.paramSecondary}}{x}`,
    min: 0.2,
    max: 3.0,
    step: 0.1,
    defaultValue: 0.6,
    group: "底数与运算参数",
    importance: "core",
    marks: [{ value: 1.0, label: "1", variant: "recommended" }],
  },
};
