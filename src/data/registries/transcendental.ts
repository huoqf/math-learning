import type { ParamMeta } from "../types";

export const defaultParams: Record<string, number> = {
  x0: 0.0, // 指数/对数切点横坐标
  a: 1.0, // 高考恒成立参数 a
};

export const paramMeta: Record<string, ParamMeta> = {
  x0: {
    key: "x0",
    label: "切点横坐标 x₀",
    labelFormula: "x_0",
    min: -2.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 0.0,
    importance: "core",
    description: "控制超越函数切线的切点位置 (e^x 基准 x₀=0，ln x 基准 x₀=1)",
    descriptionFormula:
      "控制超越函数切线的切点位置 ($e^x$ 基准 $x_0=0$，$e^x$ 次级 $x_0=1$，$\\ln x$ 基准 $x_0=1$)",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "基准一",
        labelFormula: "x_0=0",
      },
      {
        value: 1,
        variant: "critical",
        label: "基准二",
        labelFormula: "x_0=1",
      },
      {
        value: 2.7,
        label: "对数基准二",
        labelFormula: "x_0=e",
      },
    ],
  },
  a: {
    key: "a",
    label: "放缩/放缩斜率 a",
    labelFormula: "a",
    min: -1.0,
    max: 4.0,
    step: 0.1,
    defaultValue: 1.0,
    importance: "core",
    description:
      "控制直线 y = ax + 1 或 y = ax 的斜率，观察相切临界与恒成立范围",
    descriptionFormula:
      "控制直线 $y = ax + 1$ 或 $y = ax$ 的斜率，观察相切临界与恒成立范围",
    marks: [
      { value: 0, variant: "critical", label: "水平线", labelFormula: "a = 0" },
      {
        value: 1,
        variant: "critical",
        label: "基准切线临界",
        labelFormula: "a = 1",
      },
      {
        value: 2.7,
        variant: "critical",
        label: "过原点切线",
        labelFormula: "a = e",
      },
    ],
  },
};

import type { ScenarioSpec } from "@/types/scenario";

/**
 * 超越函数切线放缩 统一情景定义字典 (SSOT)
 */
export const transcendentalScenarios: Record<
  string,
  ScenarioSpec<Record<string, number>>[]
> = {
  exp: [
    {
      id: "free",
      name: "自由探究",
      badge: "指数放缩 · 凸性与切线",
      condition: "指数曲线 $f(x)=e^x$ 为下凸函数，任意切线均位于曲线下方。",
      question:
        "探究切线方程在不同切点处的斜率与截距关系，求使切线为全局线性下界的最优切点与切线方程。",
      variant: "primary",
    },
    {
      id: "tangent_0",
      name: "原点基准",
      badge: "指数放缩 · 基准切点",
      condition: "选定切点 $P_0(0,1)$，此时切线方程为 $y=x+1$。",
      question: "证明不等式 $e^x \\ge x+1$，并求等号成立的充要条件。",
      presetParams: { x0: 0.0 },
      variant: "primary",
    },
    {
      id: "tangent_1",
      name: "次级切点",
      badge: "指数放缩 · 次级切点",
      condition: "选定切点 $P_1(1,e)$，此时过原点的切线方程为 $y=ex$。",
      question:
        "证明不等式 $e^x \\ge ex$，并求该切线在求参数最值时的割线相切临界值。",
      presetParams: { x0: 1.0 },
      variant: "primary",
    },
    {
      id: "shift_1",
      name: "平移变体",
      badge: "指数放缩 · 平移对偶",
      condition:
        "指数曲线向右平移为 $f(x)=e^{x-1}$，在切点 $(1,1)$ 处的切线为 $y=x$。",
      question:
        "证明平移放缩式 $e^{x-1} \\ge x$，并探究其如何与对数切线不等式 $\\ln x \\le x-1$ 构成反函数对偶。",
      presetParams: { x0: 1.0 },
      variant: "primary",
    },
  ],
  log: [
    {
      id: "free",
      name: "自由探究",
      badge: "对数放缩 · 上凸与切线",
      condition:
        "对数曲线 $g(x)=\\ln x$ ($x>0$) 为上凸函数，切线始终位于曲线上方。",
      question:
        "探究切点 $x_0>0$ 处切线方程变化，求对数曲线在全局上界约束下的最优放缩线性式。",
      variant: "info",
    },
    {
      id: "tangent_1",
      name: "对数基准",
      badge: "对数放缩 · 基准切点",
      condition: "选定切点 $P_0(1,0)$，此时切线方程为 $y=x-1$。",
      question:
        "证明对数基本不等式 $\\ln x \\le x-1$，并求该不等式在化简代数式时的消对数通法。",
      presetParams: { x0: 1.0 },
      variant: "info",
    },
    {
      id: "tangent_e",
      name: "次级切点",
      badge: "对数放缩 · 次级切点",
      condition:
        "选定切点 $P_1(e,1)$，此时过原点的切线方程为 $y=\\frac{x}{e}$。",
      question:
        "证明对数不等式 $\\ln x \\le \\frac{x}{e}$，并探究其与 $e^x \\ge ex$ 之间的对偶对称与等号条件。",
      presetParams: { x0: Math.E },
      variant: "info",
    },
    {
      id: "quadratic_bound",
      name: "二次放缩",
      badge: "对数放缩 · 二次上界",
      condition: "在切点 $(1,0)$ 处构造二次抛物线上界 $y=\\frac{x^2-1}{2}$。",
      question:
        "证明二次放缩不等式 $\\ln x \\le \\frac{x^2-1}{2}$，并比较其与线性切线在 $x>1$ 时的代数逼近精度。",
      presetParams: { x0: 1.0 },
      variant: "info",
    },
  ],
  chain: [
    {
      id: "tangent_1",
      name: "公共切点",
      badge: "双基准对偶 · 对称夹逼",
      condition:
        "曲线 $y=e^{x-1}$ 与 $y=\\ln x+1$ 互为反函数，关于中轴线 $y=x$ 对称并在 $(1,1)$ 公切。",
      question:
        "证明双向链式不等式 $\\ln x+1 \\le x \\le e^{x-1}$，并探究中轴线 $y=x$ 作为中间桥梁的证明步骤。",
      presetParams: { x0: 1.0 },
      variant: "warning",
    },
    {
      id: "pos_2",
      name: "右侧发散",
      badge: "双基准对偶 · 右侧发散",
      condition:
        "取自变量考察点 $x=2$，指数呈超线性爆炸增长，对数呈次线性平缓增长。",
      question:
        "在区间 $x > 1$ 上比较 $e^{x-1}-x$ 与 $x-(\\ln x+1)$ 的差值增幅，求更紧致的单侧放缩区间。",
      presetParams: { x0: 2.0 },
      variant: "warning",
    },
    {
      id: "pos_half",
      name: "左侧夹逼",
      badge: "双基准对偶 · 左侧夹逼",
      condition:
        "取自变量考察点 $x=0.5$，对数曲线急剧跌落至负无穷，指数曲线平滑贴近零点。",
      question:
        "在 $(0,1)$ 区间内，利用三曲线夹逼态势证明含复合项的导数零点存在性与唯一性。",
      presetParams: { x0: 0.5 },
      variant: "warning",
    },
  ],
  param: [
    {
      id: "exp_ax_1_crit",
      name: "定点相切",
      badge: "切线临界 · 定点相切",
      condition: "直线 $y=ax+1$ 过定点 $(0,1)$，对应参数临界值 $a=1$。",
      question:
        "当斜率 $a$ 增大时，证明直线与曲线的位置关系，求 $e^x \\ge ax+1$ 恒成立的充要条件与 $a$ 范围。",
      presetParams: { a: 1.0 },
      variant: "primary",
    },
    {
      id: "exp_ax_crit",
      name: "原点相切",
      badge: "切线临界 · 原点相切",
      condition:
        "直线 $y=ax$ 过坐标原点，相切于曲线切点 $(1,e)$，临界斜率 $a=e$。",
      question:
        "证明当 $a \\le e$ 时不等式 $e^x \\ge ax$ 恒成立，并求当 $a > e$ 时曲线与直线的交点个数。",
      presetParams: { a: Math.E },
      variant: "primary",
    },
    {
      id: "horizontal",
      name: "水平割线",
      badge: "切线临界 · 水平切线",
      condition: "斜率 $a=0$ 时直线退化为水平线 $y=1$。",
      question:
        "证明不等式 $e^x \\ge 1$ 在实数集上的解集范围，并探究其与指数函数单调性的内在联系。",
      presetParams: { a: 0.0 },
      variant: "primary",
    },
  ],
};
