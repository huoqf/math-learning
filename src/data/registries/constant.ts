import type { ParamMeta } from "../types";
import type { AnswerStepItem } from "@/components/UI/StepNavigator";
import { MATH_COLORS } from "@/theme";

export const defaultParams = {
  a: 1.2,
  a_axis: 1.0,
  m: 0.5,
  n: 2.5,
  yf: 2.5,
  xf: 1.25,
  yg: 1.5,
  xg: 2.25,
} as const;

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "水平线高度 a",
    labelFormula: `\\text{水平线高度 }\\color{${MATH_COLORS.paramPrimary}}{a}`,
    group: "参变分离目标参数",
    min: -1.0,
    max: 4.0,
    step: 0.05,
    defaultValue: 1.2,
    importance: "core",
    description: "作为参变分离后的目标值，代表水平直线 y = a",
    descriptionFormula: "作为参变分离后的目标值，代表水平直线 $y = a$",
    marks: [
      {
        value: 0.37,
        variant: "recommended",
        label: "1/e",
        labelFormula: "1/e",
      },
    ],
  },
  a_axis: {
    key: "a_axis",
    label: "参数 a (讨论项)",
    labelFormula: `\\text{讨论参数 }\\color{${MATH_COLORS.paramPrimary}}{a}`,
    group: "直接讨论主参数",
    min: -1.0,
    max: 4.0,
    step: 0.05,
    defaultValue: 1.0,
    importance: "core",
    description: "含参函数的讨论系数（二次函数对称轴或超越函数极小值控制）",
    descriptionFormula:
      "\\text{含参函数的讨论系数（二次函数对称轴或超越函数极小值控制）}",
    marks: [
      { value: 0.5, variant: "recommended", label: "0.5" },
      { value: 2.5, variant: "recommended", label: "2.5" },
      {
        value: 2.72,
        variant: "critical",
        label: "e",
        labelFormula: "e",
      },
    ],
  },
  m: {
    key: "m",
    label: "区间左边界 m",
    labelFormula: `\\text{区间左边界 }\\color{${MATH_COLORS.paramSecondary}}{m}`,
    group: "研究区间 [m, n]",
    min: -1.0,
    max: 4.0,
    step: 0.05,
    defaultValue: 0.5,
    importance: "advanced",
    description: "函数研究区间 [m, n] 的左端点",
    descriptionFormula: "函数研究区间 $[m, n]$ 的左端点",
  },
  n: {
    key: "n",
    label: "区间右边界 n",
    labelFormula: `\\text{区间右边界 }\\color{${MATH_COLORS.paramTertiary}}{n}`,
    group: "研究区间 [m, n]",
    min: -1.0,
    max: 4.0,
    step: 0.05,
    defaultValue: 2.5,
    importance: "advanced",
    description: "函数研究区间 [m, n] 的右端点",
    descriptionFormula: "函数研究区间 $[m, n]$ 的右端点",
  },
  yf: {
    key: "yf",
    label: "顶点纵坐标 $y_f$",
    labelFormula: `\\text{顶点纵坐标 }\\color{${MATH_COLORS.paramPrimary}}{y_f}`,
    group: "抛物线 f(x) (开口向上)",
    min: -1.5,
    max: 4.0,
    step: 0.05,
    defaultValue: 2.5,
    importance: "core",
    description: "控制抛物线 $f(x)$ 的极小值高度 (开口向上)",
    descriptionFormula:
      "\\text{控制抛物线 } f(x) \\text{ 的极小值高度 } (\\text{开口向上})",
  },
  xf: {
    key: "xf",
    label: "对称轴位置 $x_f$",
    labelFormula: `\\text{对称轴位置 }\\color{${MATH_COLORS.paramTertiary}}{x_f}`,
    group: "抛物线 f(x) (开口向上)",
    min: 0.5,
    max: 2.0,
    step: 0.05,
    defaultValue: 1.25,
    importance: "advanced",
    description: "控制对称轴在区间 I₁ = [0.5, 2.0] 内左右移动",
    descriptionFormula:
      "\\text{控制对称轴在区间 } I_1 = [0.5, 2.0] \\text{ 内左右移动}",
  },
  yg: {
    key: "yg",
    label: "顶点纵坐标 $y_g$",
    labelFormula: `\\text{顶点纵坐标 }\\color{${MATH_COLORS.paramSecondary}}{y_g}`,
    group: "抛物线 g(x) (开口向下)",
    min: 0.0,
    max: 3.0,
    step: 0.05,
    defaultValue: 1.5,
    importance: "core",
    description: "控制抛物线 g(x) 的极大值高度 (开口向下)",
    descriptionFormula:
      "\\text{控制抛物线 } g(x) \\text{ 的极大值高度 } (\\text{开口向下})",
  },
  xg: {
    key: "xg",
    label: "对称轴位置 $x_g$",
    labelFormula: `\\text{对称轴位置 }\\color{${MATH_COLORS.paramTertiary}}{x_g}`,
    group: "抛物线 g(x) (开口向下)",
    min: 1.5,
    max: 3.0,
    step: 0.05,
    defaultValue: 2.25,
    importance: "advanced",
    description: "控制对称轴在区间 I₂ = [1.5, 3.0] 内左右移动",
    descriptionFormula:
      "\\text{控制对称轴在区间 } I_2 = [1.5, 3.0] \\text{ 内左右移动}",
  },
};

export function getConstantSingleAnswerSteps(
  subMode: "sep" | "direct",
  logic: "always" | "exist" = "always",
): AnswerStepItem[] {
  if (subMode === "sep") {
    return [
      {
        step: 1,
        title:
          logic === "always"
            ? "第一步：审题定法 · 恒成立命题等价转化"
            : "第一步：审题定法 · 存在性命题等价转化",
        sceneHint: "聚焦研究区间 [m, n] 与目标函数曲线",
      },
      {
        step: 2,
        title: "第二步：建模联立 · 求导单调性与极值分析",
        sceneHint: "聚焦导数与区间极值点特征标记",
      },
      {
        step: 3,
        title: "第三步：求解反思 · 代数求界与充要判定",
        sceneHint: "聚焦参照线 y = a 与违背区间高亮对照",
      },
    ];
  }
  return [
    {
      step: 1,
      title: "第一步：审题定法 · 求导与含参导数为零点的确定",
      sceneHint: "聚焦动轴/导数零点位置与区间 [m, n]",
    },
    {
      step: 2,
      title: "第二步：建模联立 · 轴动区间定三类分类推演",
      sceneHint: "聚焦曲线单调走势与区间内极小值点",
    },
    {
      step: 3,
      title: "第三步：求解反思 · 代入分支求解与充要判定",
      sceneHint: "聚焦当前分支下的违背区间与边界结论",
    },
  ];
}
