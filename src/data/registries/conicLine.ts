import type { ParamMeta } from "../types";
import type { AnswerStepItem } from "@/components/UI/StepNavigator";
import type { ConicType, StudyMode } from "@/math/conicLine";
import { MATH_COLORS } from "@/theme";

/**
 * 直线与圆锥曲线「高考标准解答分步走」单一事实源（SSOT）。
 * 左屏 StepNavigator、右屏 MathPanel reasoningSteps、中屏 ConicLineScene 共用本链条。
 */
export function getConicLineAnswerSteps(
  studyMode: StudyMode,
  conicType: ConicType,
  isDegeneratedParallel = false,
): AnswerStepItem[] {
  if (studyMode === "general") {
    return [
      {
        step: 1,
        title: "审题建模 · 联立消元建立方程",
        sceneHint: "观察主曲线、直线 L 及渐近线/对称轴边界斜率位置",
      },
      {
        step: 2,
        title: isDegeneratedParallel
          ? "建模展开 · 一次方程直接求唯一交点"
          : "建模展开 · 判别式检验与韦达代换",
        sceneHint: isDegeneratedParallel
          ? "聚焦直线与曲线的唯一交点（二次项归零非相切）"
          : "聚焦交点 A, B 坐标位置与判别式根分布",
      },
      {
        step: 3,
        title: "求解反思 · 割线弦长公式代入求解",
        sceneHint: "高亮实心相交弦 AB 与原点三角形 △OAB 目标区域",
      },
    ];
  }

  if (studyMode === "focus") {
    if (conicType === "parabola") {
      return [
        {
          step: 1,
          title: "审题定法 · 确定焦点坐标与割线方程",
          sceneHint: "观察焦点 F 坐标与过焦点割线旋转位置",
        },
        {
          step: 2,
          title: "建模展开 · 焦半径定义与弦长公式推导",
          sceneHint: "聚焦交点 A, B 到准线的垂直投影点 A', B'",
        },
        {
          step: 3,
          title: "求解反思 · 焦半径倒数和恒等定值",
          sceneHint: "高亮聚焦焦点弦 AB 及其正交极值特征",
        },
      ];
    }
    return [
      {
        step: 1,
        title: "审题定法 · 确定焦点坐标与割线方程",
        sceneHint: "观察焦点 F₁ 位置与过焦点动直线",
      },
      {
        step: 2,
        title: "建模展开 · 通径极小值公式推导",
        sceneHint: "聚焦焦点弦端点 A, B 的实时位置变化",
      },
      {
        step: 3,
        title: "求解反思 · 焦半径倒数定值性质",
        sceneHint: "高亮弦段 F₁A, F₁B 构成的焦点弦 AB",
      },
    ];
  }

  if (studyMode === "midpoint") {
    if (conicType === "ellipse") {
      return [
        {
          step: 1,
          title: "审题定法 · 设端点坐标并代入椭圆方程",
          sceneHint: "观察椭圆曲线与给定目标中点 M 的内部位置",
        },
        {
          step: 2,
          title: "建模展开 · 点差法两式作差求动弦斜率",
          sceneHint: "聚焦中点连线 OM 与动弦 AB 的垂直/斜率乘积关联",
        },
        {
          step: 3,
          title: "求解反思 · 存在性检验（防越界伪根）",
          sceneHint: "高亮实心交点弦 AB 验证点 M 位于椭圆内部",
        },
      ];
    }
    if (conicType === "hyperbola") {
      return [
        {
          step: 1,
          title: "审题定法 · 设端点坐标并代入双曲线方程",
          sceneHint: "观察双曲线两支与中点 M 所处区域",
        },
        {
          step: 2,
          title: "建模展开 · 点差法求动弦斜率与定值积",
          sceneHint: "聚焦中心连线 OM 与中点弦斜率关系",
        },
        {
          step: 3,
          title: "求解反思 · 代回判别式检验存在性",
          sceneHint: "高亮焦点弦实交点 A, B 确认不存在伪中点弦",
        },
      ];
    }
    return [
      {
        step: 1,
        title: "审题定法 · 设端点坐标并代入抛物线方程",
        sceneHint: "观察抛物线开口与给定中点 M",
      },
      {
        step: 2,
        title: "建模展开 · 两式作差求动弦斜率",
        sceneHint: "聚焦中点连线与水平对称轴对斜率约束",
      },
      {
        step: 3,
        title: "求解反思 · 存在性检验（防越界伪根）",
        sceneHint: "高亮实心交点弦 AB 验证 y₀² < 2px₀",
      },
    ];
  }

  return [
    {
      step: 1,
      title: "审题定法 · 设两切点并写出切点处切线方程",
      sceneHint: "观察曲线外点 P 与两切点 A, B 切线位置",
    },
    {
      step: 2,
      title: "建模展开 · 代入外部点推出切点弦方程",
      sceneHint: "聚焦两条虚线切线 PA, PB 与切点 A, B",
    },
    {
      step: 3,
      title: "求解反思 · 几何性质与切线垂直定值",
      sceneHint: "高亮切点弦 AB 及准线关联垂直特征",
    },
  ];
}

export const defaultParams: Record<string, number> = {
  conicTypeIdx: 0, // 0: ellipse, 1: hyperbola, 2: parabola
  studyModeIdx: 0, // 0: general, 1: focus, 2: midpoint, 3: polePolar
  a: 3,
  b: 2,
  p: 2,
  k: 0.5,
  m: 0.5,
  theta: 0.785, // PI/4 ≈ 0.785 (45 deg)
  midpointX: 1,
  midpointY: 1,
  poleX: 4.0,
  poleY: 3.0,
};

export interface ConicLinePreset {
  key: string;
  label: string;
  description: string;
  params: Partial<Record<string, number>>;
}

export const presetsByConicAndMode: Record<
  string,
  Record<string, ConicLinePreset[]>
> = {
  ellipse: {
    general: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, k: 0.5, m: 0.5 },
      },
      {
        key: "tangent",
        label: "临界相切",
        description: "Δ=0 唯一切点",
        params: { k: 0.5, m: 2.5 },
      },
      {
        key: "axis_secant",
        label: "长轴对称弦",
        description: "过原点最长弦 (2a)",
        params: { k: 0, m: 0 },
      },
      {
        key: "minor_secant",
        label: "倾斜正交弦",
        description: "对称正割线",
        params: { k: 1, m: 0 },
      },
    ],
    focus: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, theta: Math.PI / 4 },
      },
      {
        key: "latus_rectum",
        label: "通径极值",
        description: "θ=90° 最短焦点弦",
        params: { theta: Math.PI / 2 },
      },
      {
        key: "inclined_45",
        label: "45°倾斜弦",
        description: "经典倾斜角",
        params: { theta: Math.PI / 4 },
      },
      {
        key: "inclined_60",
        label: "60°倾斜弦",
        description: "特殊角焦点弦",
        params: { theta: Math.PI / 3 },
      },
    ],
    midpoint: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, midpointX: 1, midpointY: 1 },
      },
      {
        key: "quadrant_1",
        label: "第一象限中点",
        description: "M(1, 1) 在内部",
        params: { midpointX: 1, midpointY: 1 },
      },
      {
        key: "axis_midpoint",
        label: "长轴侧中点",
        description: "M(1.5, 0.2)",
        params: { midpointX: 1.5, midpointY: 0.2 },
      },
      {
        key: "steep_midpoint",
        label: "短轴侧中点",
        description: "M(0.5, 1.2)",
        params: { midpointX: 0.5, midpointY: 1.2 },
      },
    ],
    polePolar: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, poleX: 4, poleY: 3 },
      },
      {
        key: "external_4_3",
        label: "经典外部点",
        description: "P(4, 3)",
        params: { poleX: 4, poleY: 3 },
      },
      {
        key: "axis_pole",
        label: "x轴外一点",
        description: "P(5, 0.5)",
        params: { poleX: 5, poleY: 0.5 },
      },
      {
        key: "diagonal_pole",
        label: "对角外一点",
        description: "P(4, 4)",
        params: { poleX: 4, poleY: 4 },
      },
    ],
  },
  hyperbola: {
    general: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, k: 0.2, m: 0 },
      },
      {
        key: "asymptote_parallel",
        label: "渐近线平行",
        description: "降阶一元一次 (仅1交点)",
        params: { k: 0.67, m: 1 },
      },
      {
        key: "double_branch_secant",
        label: "两支割线",
        description: "穿透双支对称弦",
        params: { k: 0.2, m: 0 },
      },
      {
        key: "single_branch_secant",
        label: "单支割线",
        description: "k > b/a 交于右支",
        params: { k: 1.2, m: 1 },
      },
    ],
    focus: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, theta: Math.PI / 3 },
      },
      {
        key: "latus_rectum",
        label: "通径极值",
        description: "θ=90° 最短焦点弦",
        params: { theta: Math.PI / 2 },
      },
      {
        key: "inclined_45",
        label: "45°倾斜弦",
        description: "经典倾斜角",
        params: { theta: Math.PI / 4 },
      },
      {
        key: "inclined_60",
        label: "60°倾斜弦",
        description: "特殊角焦点弦",
        params: { theta: Math.PI / 3 },
      },
    ],
    midpoint: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, midpointX: 1, midpointY: 2 },
      },
      {
        key: "quadrant_1",
        label: "两支弦中点",
        description: "M(1, 2) 存在实弦",
        params: { midpointX: 1, midpointY: 2 },
      },
      {
        key: "axis_midpoint",
        label: "近原点中点",
        description: "M(0.5, 1.5)",
        params: { midpointX: 0.5, midpointY: 1.5 },
      },
      {
        key: "steep_midpoint",
        label: "大斜率中点",
        description: "M(1, 3)",
        params: { midpointX: 1, midpointY: 3 },
      },
    ],
    polePolar: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { a: 3, b: 2, poleX: 1, poleY: 2 },
      },
      {
        key: "symmetric_pole",
        label: "虚轴对称外一点",
        description: "P(0, 3) 切线对称",
        params: { poleX: 0, poleY: 3 },
      },
      {
        key: "axis_pole",
        label: "两支间外一点",
        description: "P(1, 2) 分切两支",
        params: { poleX: 1, poleY: 2 },
      },
      {
        key: "diagonal_pole",
        label: "近渐近线外一点",
        description: "P(2, 1)",
        params: { poleX: 2, poleY: 1 },
      },
    ],
  },
  parabola: {
    general: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { p: 2, k: 1, m: 0 },
      },
      {
        key: "tangent",
        label: "临界相切",
        description: "Δ=0 唯一切点 (4, 4)",
        params: { k: 0.5, m: 2.0 },
      },
      {
        key: "axis_parallel",
        label: "平行对称轴",
        description: "k=0 降阶仅1交点",
        params: { k: 0, m: 2.0 },
      },
      {
        key: "standard_secant",
        label: "标准割线",
        description: "斜交于上下两支",
        params: { k: 1, m: 1 },
      },
    ],
    focus: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { p: 2, theta: Math.PI / 4 },
      },
      {
        key: "latus_rectum",
        label: "通径极值",
        description: "θ=90° 最短弦长 2p",
        params: { theta: Math.PI / 2 },
      },
      {
        key: "inclined_45",
        label: "45°倾斜弦",
        description: "经典倾斜角",
        params: { theta: Math.PI / 4 },
      },
      {
        key: "inclined_60",
        label: "60°倾斜弦",
        description: "特殊角焦点弦",
        params: { theta: Math.PI / 3 },
      },
    ],
    midpoint: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { p: 2, midpointX: 2, midpointY: 1 },
      },
      {
        key: "quadrant_1",
        label: "内部弦中点",
        description: "M(2, 1) y₀² < 2px₀",
        params: { midpointX: 2, midpointY: 1 },
      },
      {
        key: "axis_midpoint",
        label: "深部中点",
        description: "M(3, 2)",
        params: { midpointX: 3, midpointY: 2 },
      },
      {
        key: "steep_midpoint",
        label: "开口中点",
        description: "M(1.5, 1)",
        params: { midpointX: 1.5, midpointY: 1 },
      },
    ],
    polePolar: [
      {
        key: "free",
        label: "自由探究",
        description: "全参数开放",
        params: { p: 2, poleX: -1, poleY: 2 },
      },
      {
        key: "axis_pole",
        label: "准线外一点 (正交)",
        description: "P(-1, 2) 准线切线垂直",
        params: { poleX: -1, poleY: 2 },
      },
      {
        key: "external_neg_x",
        label: "曲线外一点",
        description: "P(-2, 2)",
        params: { poleX: -2, poleY: 2 },
      },
      {
        key: "diagonal_pole",
        label: "远端外一点",
        description: "P(-1, 3)",
        params: { poleX: -1, poleY: 3 },
      },
    ],
  },
};

export function getConicLinePresets(
  conicType: string = "ellipse",
  studyMode: string = "general",
): ConicLinePreset[] {
  return (
    presetsByConicAndMode[conicType]?.[studyMode] ??
    presetsByConicAndMode.ellipse[studyMode] ??
    []
  );
}

export const presetsByMode: Record<string, ConicLinePreset[]> = {
  general: presetsByConicAndMode.ellipse.general,
  focus: presetsByConicAndMode.ellipse.focus,
  midpoint: presetsByConicAndMode.ellipse.midpoint,
  polePolar: presetsByConicAndMode.ellipse.polePolar,
};

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "长半轴 a / 实半轴 a",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a}`,
    defaultValue: 3,
    min: 1,
    max: 5,
    step: 0.1,
    description: "控制椭圆/双曲线的半轴长度",
    descriptionFormula: `\\color{${MATH_COLORS.paramPrimary}}{a} \\in [1, 5]`,
    importance: "core",
    group: "曲线几何底模",
  },
  b: {
    key: "b",
    label: "短半轴 b / 虚半轴 b",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{b}`,
    defaultValue: 2,
    min: 0.5,
    max: 4,
    step: 0.1,
    description: "控制椭圆/双曲线的短轴或虚轴",
    descriptionFormula: `\\color{${MATH_COLORS.paramSecondary}}{b} \\in [0.5, 4]`,
    importance: "core",
    group: "曲线几何底模",
  },
  p: {
    key: "p",
    label: "抛物线焦准距 p",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{p}`,
    defaultValue: 2,
    min: 0.5,
    max: 4,
    step: 0.1,
    description: "抛物线焦点到准线的距离",
    descriptionFormula: `\\color{${MATH_COLORS.paramPrimary}}{p} > 0`,
    importance: "core",
    group: "曲线几何底模",
  },
  k: {
    key: "k",
    label: "直线斜率 k",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{k}`,
    defaultValue: 0.5,
    min: -3,
    max: 3,
    step: 0.05,
    description: "直线 y = kx + m 的斜率",
    descriptionFormula: `\\color{${MATH_COLORS.paramSecondary}}{k} = \\tan \\alpha`,
    importance: "core",
    group: "直线与方位角",
    marks: [
      {
        value: 0,
        label: "0 (水平线)",
        labelFormula: "k=0",
        variant: "critical",
      },
      {
        value: 0.667,
        label: "渐近线斜率 b/a",
        labelFormula: "k=\\frac{b}{a}",
        variant: "critical",
      },
      {
        value: -0.667,
        label: "-b/a",
        labelFormula: "k=-\\frac{b}{a}",
        variant: "critical",
      },
    ],
  },
  m: {
    key: "m",
    label: "直线截距 m",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{m}`,
    defaultValue: 0.5,
    min: -4,
    max: 4,
    step: 0.1,
    description: "直线在 y 轴上的截距",
    descriptionFormula: `y = kx + \\color{${MATH_COLORS.paramTertiary}}{m}`,
    importance: "advanced",
    group: "直线与方位角",
    marks: [
      {
        value: 0,
        label: "0 (过原点)",
        labelFormula: "m=0",
        variant: "critical",
      },
    ],
  },
  theta: {
    key: "theta",
    label: "焦点弦倾斜角 θ",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{\\theta}`,
    defaultValue: 0.785,
    min: 0.1,
    max: 3.04,
    step: 0.02,
    description: "过焦点直线的倾斜角 (弧度)",
    descriptionFormula: `\\color{${MATH_COLORS.paramTertiary}}{\\theta} \\in (0, \\pi)`,
    importance: "core",
    group: "直线与方位角",
    marks: [
      {
        value: 1.571,
        label: "π/2 (通径)",
        labelFormula: "\\theta=\\frac{\\pi}{2}",
        variant: "critical",
      },
    ],
  },
  midpointX: {
    key: "midpointX",
    label: "弦中点 x0",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_0}`,
    defaultValue: 1,
    min: -3,
    max: 3,
    step: 0.1,
    description: "目标弦 AB 的中点 X 坐标",
    importance: "core",
    group: "弦中点 / 曲线外定点",
  },
  midpointY: {
    key: "midpointY",
    label: "弦中点 y0",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{y_0}`,
    defaultValue: 1,
    min: -3,
    max: 3,
    step: 0.1,
    description: "目标弦 AB 的中点 Y 坐标",
    importance: "core",
    group: "弦中点 / 曲线外定点",
  },
  poleX: {
    key: "poleX",
    label: "曲线外点 P 横坐标",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_P}`,
    defaultValue: 4.0,
    min: -6,
    max: 6,
    step: 0.1,
    description: "曲线外一点 P 的横坐标",
    importance: "core",
    group: "弦中点 / 曲线外定点",
  },
  poleY: {
    key: "poleY",
    label: "曲线外点 P 纵坐标",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{y_P}`,
    defaultValue: 3.0,
    min: -5,
    max: 5,
    step: 0.1,
    description: "曲线外一点 P 的纵坐标",
    importance: "core",
    group: "弦中点 / 曲线外定点",
  },
};
