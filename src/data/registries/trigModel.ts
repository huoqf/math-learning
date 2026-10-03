import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

/**
 * 四个模型参数 + 一个观测点参数。
 *
 * 声明域与「中屏固定视口」严格配套（见 `features/trigModel/components/TrigModelScene.tsx`
 * 的 `TRIG_MODEL_XRANGE` / `TRIG_MODEL_YRANGE`）：
 *   · $A \\in [0.5, 3]$、$k \\in [-1, 3]$ ⇒ $h \\in [-4, 6]$，纵向视口取 $[-4.9, 8.1]$，
 *     顶部多留的 2 个单位供「一周期标尺 T」避开两个悬浮窗；
 *   · $T \\in [2, 13]$、$t = \\text{tRatio} \\times T \\in [0, 13]$，横向视口取 $[-0.7, 13.7]$。
 * 三条边界互为闭环：任何一条被单独放宽（例如把 tRatio 上限提到 2），
 * 观测点就会被算出画布之外，而滑块仍显示合法读数 —— 这正是本仓最忌讳的「读数与画面脱节」。
 * `src/test/trigModelSceneRender.test.tsx` 已在声明域端点与 step 网格上逐点断言这一闭环。
 */
export const defaultParams = {
  A: 2,
  period: 2,
  phi: Math.PI / 2,
  k: 0,
  tRatio: 0.75,
};

export const paramMeta: Record<string, ParamMeta> = {
  A: {
    key: "A",
    label: "振幅 A",
    labelFormula: `\\text{振幅 }\\color{${MATH_COLORS.paramPrimary}}{A}`,
    min: 0.5,
    max: 3,
    step: 0.1,
    defaultValue: 2,
    group: "模型参数",
    importance: "core",
    description: "振动偏离平衡位置的最大距离，决定值域 [k − A, k + A] 的宽度",
    descriptionFormula: "值域 $[k - A,\\ k + A]$ · 由振幅决定",
    marks: [
      { value: 0.5, label: "0.5", labelFormula: "0.5" },
      { value: 1, label: "1.0", labelFormula: "1.0" },
      { value: 1.5, label: "1.5", labelFormula: "1.5" },
      { value: 2, label: "2.0", labelFormula: "2.0" },
      { value: 3, label: "3.0", labelFormula: "3.0" },
    ],
  },
  period: {
    key: "period",
    label: "周期 T",
    labelFormula: `\\text{周期 }\\color{${MATH_COLORS.paramSecondary}}{T}`,
    min: 2,
    max: 13,
    step: 0.5,
    defaultValue: 2,
    group: "模型参数",
    importance: "core",
    description: "完成一次完整振动所需的时间，角频率 ω = 2π / T 由它派生",
    descriptionFormula:
      "角频率 $\\omega = \\dfrac{2\\pi}{T}$ · 频率 $f = \\dfrac{1}{T}$",
    marks: [
      { value: 2, label: "2", labelFormula: "2" },
      { value: 4, label: "4", labelFormula: "4" },
      { value: 6, label: "6", labelFormula: "6" },
      { value: 8, label: "8", labelFormula: "8" },
      { value: 12.5, label: "12.5", labelFormula: "12.5" },
    ],
  },
  phi: {
    key: "phi",
    label: "初相 φ",
    labelFormula: `\\text{初相 }\\color{${MATH_COLORS.paramTertiary}}{\\varphi}`,
    min: -Math.PI,
    max: Math.PI,
    step: Math.PI / 12,
    defaultValue: Math.PI / 2,
    group: "模型参数",
    importance: "advanced",
    description: "t = 0 时的相位，决定起始时刻处于波峰、波谷还是上升/下降段",
    descriptionFormula:
      "$\\varphi = \\dfrac{\\pi}{2}$ 波峰起 · $\\varphi = 0$ 平衡位置上升起",
    marks: [
      {
        value: -Math.PI / 2,
        label: "-π/2 波谷起",
        labelFormula: "-\\frac{\\pi}{2}",
      },
      {
        value: 0,
        label: "0 平衡起",
        labelFormula: "0",
      },
      {
        value: Math.PI / 2,
        label: "π/2 波峰起",
        labelFormula: "\\frac{\\pi}{2}",
      },
      { value: Math.PI, label: "π", labelFormula: "\\pi" },
    ],
  },
  k: {
    key: "k",
    label: "平衡位置 k",
    labelFormula: `\\text{平衡位置 }\\color{${MATH_COLORS.functionSecondary}}{k}`,
    min: -1,
    max: 3,
    step: 0.5,
    defaultValue: 0,
    group: "模型参数",
    importance: "advanced",
    description: "振动中心所在的水平位置，整条曲线相对 h = 0 上下平移",
    descriptionFormula: "平衡线 $h = k$ · 整条曲线上下平移",
    marks: [
      { value: -1, label: "-1", labelFormula: "-1" },
      { value: 0, label: "0", labelFormula: "0" },
      { value: 2.5, label: "2.5", labelFormula: "2.5" },
      { value: 3, label: "3", labelFormula: "3" },
    ],
  },
  tRatio: {
    key: "tRatio",
    label: "观测时刻（以周期 T 计）",
    labelFormula: `\\text{观测时刻 }\\color{${MATH_COLORS.paramPrimary}}{t}`,
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: 0.75,
    group: "观测点",
    importance: "core",
    description:
      "观测点横坐标为 t = 该比例 × T，取值覆盖一个完整周期，也可直接拖拽中屏动点定位",
    descriptionFormula: "t = \\text{比例} \\times T \\in [0,\\ T]",
    marks: [
      { value: 0, label: "0", labelFormula: "0" },
      { value: 0.25, label: "T/4", labelFormula: "\\frac{T}{4}" },
      { value: 0.5, label: "T/2", labelFormula: "\\frac{T}{2}" },
      { value: 0.75, label: "3T/4", labelFormula: "\\frac{3T}{4}" },
      { value: 1, label: "T", labelFormula: "T" },
    ],
  },
};
