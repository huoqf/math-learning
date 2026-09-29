import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";
import type { TranscendentalMode } from "@/math/transcendental";

export const defaultParams: Record<string, number> = {
  x0: 0.0, // 指数/对数切点横坐标
  a: 1.0, // 高考恒成立参数 a
};

/* ------------------------------------------------------------------ *
 * 参数域 SSOT（**按模式拆分**）
 *
 * 四种探究模式的可拖拽参数域互不相同：指数模式要覆盖 e^{x₀} 的自然切点范围
 * （含 x₀ < 0），而对数 / 双基准模式必须整体排开 ln 的负真数区（x₀ > 0）。
 *
 * 历史缺陷：左屏滑块把这三套区间**直接写死在渲染函数里**，注册表却只留了一份
 * x₀ ∈ [-2.0, 3.0] 的死数据（全库无人引用），中屏拖拽又各自手写
 * `Math.round` / `Math.max` 兜底 —— 同一个参数出现三套口径：
 *   · 拖拽下界 0.05 比滑块自己的下界（log 0.1 / chain 0.2）还低；
 *   · 拖拽完全没有上界，指数模式可把切点拖到视口边缘 x = 4，而滑块上限只有 2.0。
 *
 * 现统一收敛到本表：左屏滑块与中屏拖拽**必须**消费同一份定义，
 * 二者一旦脱节，`src/data/registries/__tests__/transcendentalParamMeta.test.ts` 立刻红灯。
 *
 * 注：param 模式的可拖拽参数是直线斜率 a（该模式没有 x₀ 手柄），故 a 只挂在 param 下。
 * ------------------------------------------------------------------ */
export const transcendentalParamMeta: Record<
  TranscendentalMode,
  Record<string, ParamMeta>
> = {
  exp: {
    x0: {
      key: "x0",
      label: "切点横坐标 x₀",
      labelFormula: `\\text{切点 } \\color{${MATH_COLORS.paramPrimary}}{x_0}`,
      group: "切线控制参数",
      min: -2.5,
      max: 2.0,
      step: 0.1,
      defaultValue: 0.0,
      importance: "core",
      description: "控制 $e^x$ 切点位置",
      descriptionFormula: `控制 $e^x$ 切线切点 $\\color{${MATH_COLORS.paramPrimary}}{x_0}$`,
      marks: [
        {
          value: 0,
          variant: "critical",
          label: "基准一",
          labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_0=0}`,
        },
        {
          value: 1,
          label: "基准二",
          labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_0=1}`,
        },
      ],
    },
  },
  log: {
    x0: {
      key: "x0",
      label: "切点横坐标 x₀",
      labelFormula: `\\text{切点 } \\color{${MATH_COLORS.paramPrimary}}{x_0}`,
      group: "切线控制参数",
      min: 0.1,
      max: 3.5,
      step: 0.1,
      defaultValue: 1.0,
      importance: "core",
      description: "控制 $\\ln x$ 切点位置 ($x > 0$)",
      descriptionFormula: `定义域保护 $\\color{${MATH_COLORS.paramPrimary}}{x_0} > 0$`,
      marks: [
        {
          value: 1,
          variant: "critical",
          label: "基准一",
          labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_0=1}`,
        },
        {
          value: 2.7,
          label: "基准二",
          labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_0=e}`,
        },
      ],
    },
  },
  chain: {
    x0: {
      key: "x0",
      label: "自变量考察点 x",
      labelFormula: `\\text{自变量 } \\color{${MATH_COLORS.paramPrimary}}{x}`,
      group: "自变量位置",
      min: 0.2,
      max: 3.0,
      step: 0.1,
      defaultValue: 1.0,
      importance: "core",
      description: "观察三曲线放缩态势",
      descriptionFormula: "观察 $x>0$ 处的包络差",
      marks: [
        {
          value: 1,
          variant: "critical",
          label: "公切点",
          labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x=1}`,
        },
      ],
    },
  },
  param: {
    a: {
      key: "a",
      label: "直线斜率参数 a",
      labelFormula: `\\text{斜率 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
      group: "参变直线方程",
      min: -1.0,
      max: 4.0,
      step: 0.1,
      defaultValue: 1.0,
      importance: "core",
      // y = ax 形态的文案由页面按 subMode 特化，此处只保存公共定义
      description: "直线 $y = ax + 1$ 斜率",
      marks: [
        {
          value: 0,
          label: "水平",
          labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a=0}`,
        },
        {
          value: 1,
          variant: "critical",
          label: "定点临界",
          labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a=1}`,
        },
        {
          value: 2.7,
          variant: "critical",
          label: "原点临界",
          labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a=e}`,
        },
      ],
    },
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
      badge: "指数放缩 · 切线随切点移动",
      condition:
        "在曲线 $f(x)=e^x$ 上任取一点 $P(x_0,\\, e^{x_0})$ 作切线，切线方程随切点移动而改变。",
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
      badge: "对数放缩 · 切线随切点移动",
      condition:
        "在曲线 $g(x)=\\ln x$ ($x>0$) 上任取一点 $P(x_0,\\, \\ln x_0)$ 作切线，切线方程随切点移动而改变。",
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
      condition:
        "在切点 $(1,0)$ 处构造与曲线相切的二次抛物线上界 $y=\\frac{x^2-1}{2}$。",
      question:
        "证明二次放缩不等式 $\\ln x \\le \\frac{x^2-1}{2}$，并说明该二次曲线与 $y=\\ln x$ 在 $x=1$ 处相切的原因。",
      presetParams: { x0: 1.0 },
      variant: "info",
    },
  ],
  chain: [
    {
      id: "free",
      name: "自由探究",
      badge: "双基准对偶 · 链式放缩",
      condition:
        "考查指数曲线 $y=e^{x-1}$ 与对数曲线 $y=\\ln x+1$ 关于中轴线 $y=x$ 的对称包络。",
      question:
        "拖动中轴动点 $x$，探究双侧放缩包络跨度 $e^{x-1} - (\\ln x+1)$ 的变化规律与极小值点。",
      variant: "warning",
    },
    {
      id: "tangent_1",
      name: "公共切点",
      badge: "双基准对偶 · 对称放缩",
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
        "在区间 $x > 1$ 上比较 $e^{x-1}-x$ 与 $x-(\\ln x+1)$ 的差值增幅，求更贴近的单侧放缩区间。",
      presetParams: { x0: 2.0 },
      variant: "warning",
    },
    {
      id: "pos_half",
      name: "左侧放缩",
      badge: "双基准对偶 · 左侧放缩",
      condition:
        "取自变量考察点 $x=0.5$，对数曲线急剧跌落至负无穷，指数曲线平滑贴近零点。",
      question:
        "在 $(0,1)$ 区间内，利用三曲线放缩态势证明含复合项的导数零点存在性与唯一性。",
      presetParams: { x0: 0.5 },
      variant: "warning",
    },
  ],
  param: [
    {
      id: "free",
      name: "自由探究",
      badge: "切线临界 · 参变直线",
      condition:
        "考查参变直线与指数曲线 $y=e^x$ 在不同斜率 $a$ 下的位置关系与交点演化。",
      question:
        "调节直线斜率参数 $a$，探究直线穿透曲线破坏恒成立的临界斜率分水岭。",
      variant: "primary",
    },
    {
      id: "exp_ax_1_crit",
      name: "定点相切",
      badge: "切线临界 · 定点相切",
      condition:
        "直线 $y=ax+1$ 过定点 $(0,1)$，考查非负区间 $x \\ge 0$ 上动直线与指数曲线的位置关系。",
      question:
        "证明对任意 $x \\ge 0$ 不等式 $e^x \\ge ax+1$ 恒成立的充要条件为 $a \\le 1$；并分析在全域 $\\mathbb{R}$ 上成立的唯一参数值。",
      presetParams: { a: 1.0 },
      variant: "primary",
    },
    {
      id: "exp_ax_crit",
      name: "原点相切",
      badge: "切线临界 · 原点相切",
      condition:
        "直线 $y=ax$ 过坐标原点，相切于曲线切点 $(1,e)$，考查区间 $x > 0$ 上的旋转卡位。",
      question:
        "证明对任意 $x > 0$ 不等式 $e^x \\ge ax$ 恒成立的充要条件为 $a \\le e$，并求当 $a > e$ 时在 $x > 0$ 上的交点个数。",
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
