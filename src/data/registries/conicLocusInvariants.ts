import type { ParamMeta } from "../types";
import type { AnswerStepItem } from "@/components/UI/StepNavigator";
import type { LocusStudyMode } from "@/math/conicLocusInvariants";
import { MATH_COLORS } from "@/theme";

export const defaultParams: Record<string, number> = {
  a: 3.5,
  b: 2.0,
  thetaDeg: 50,
  slopeInvM: 0.45,
};

export const paramMeta: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "长半轴 / 圆半径 $a$",
    labelFormula: `\\text{半轴 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: 1.5,
    max: 5.0,
    step: 0.1,
    defaultValue: 3.5,
    importance: "core",
    group: "基准几何底模",
  },
  b: {
    key: "b",
    label: "短半轴 / 虚半轴 $b$",
    labelFormula: `\\text{半轴 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
    min: 0.6,
    max: 4.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    group: "基准几何底模",
  },
  thetaDeg: {
    key: "thetaDeg",
    label: "动点参角 $\\theta$",
    labelFormula: `\\text{参角 } \\color{${MATH_COLORS.paramTertiary}}{\\theta}`,
    min: 15,
    max: 345,
    step: 1,
    defaultValue: 50,
    importance: "core",
    group: "动点与直线",
  },
  slopeInvM: {
    key: "slopeInvM",
    label: "割线参数 $m$",
    labelFormula: `\\text{斜率倒数 } \\color{${MATH_COLORS.paramTertiary}}{m}`,
    min: -2.0,
    max: 2.0,
    step: 0.05,
    defaultValue: 0.45,
    importance: "core",
    group: "动点与直线",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "铅垂弦",
        labelFormula: "m=0",
      },
    ],
  },
};

/** 标内通法三屏联动「高考标准解答分步走」SSOT */
export function getConicLocusAnswerSteps(
  studyMode: LocusStudyMode,
): AnswerStepItem[] {
  if (studyMode === "locusTransfer") {
    return [
      {
        step: 1,
        title: "审题定法 · 设动点与相关点坐标",
        sceneHint: "观察辅助圆上的已知动点 P₀ 与目标动点 P 的竖直对齐投影",
      },
      {
        step: 2,
        title: "建模代换 · 建立压缩比例解出原坐标",
        sceneHint: "聚焦纵坐标比例缩放线段 P₀H 与 PH 的恒定比值",
      },
      {
        step: 3,
        title: "求解消参 · 代入已知圆方程化出轨迹",
        sceneHint: "高亮显示最终转移生成的光滑椭圆轨迹",
      },
    ];
  }

  if (studyMode === "thirdDefinition") {
    return [
      {
        step: 1,
        title: "审题定法 · 标出中心对称顶点与动点",
        sceneHint: "观察实/长轴两端点 A, B 与曲线上动点 P 的连线",
      },
      {
        step: 2,
        title: "建模转化 · 坐标差乘积代入曲线方程",
        sceneHint: "聚焦斜率射线 PA 与 PB 的几何夹角随 P 滑动的变化",
      },
      {
        step: 3,
        title: "求解定值 · 导出斜率积与离心率恒等式",
        sceneHint: "高亮动点构成的特征三角形 △PAB 与斜率积不变量",
      },
    ];
  }

  return [
    {
      step: 1,
      title: "审题设线 · 利用对称性猜定轴上定点与设线",
      sceneHint: "观察左顶点 A₀(-a, 0) 与直线绕猜测定点 Q 的旋转",
    },
    {
      step: 2,
      title: "建模联立 · 常规设而不求写出韦达定理",
      sceneHint: "聚焦割线与椭圆两交点 A, B 坐标分布",
    },
    {
      step: 3,
      title: "求解反思 · 代入垂直条件反解定点坐标",
      sceneHint: "高亮直角弦角 ∠AA₀B = 90° 与定点 Q 的最终落位",
    },
  ];
}
