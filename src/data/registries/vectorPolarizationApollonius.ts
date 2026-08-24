import { MATH_COLORS } from "@/theme";
import type { ParamMark, ParamImportance } from "@/data/types";

export interface VectorPolarizationApolloniusParams {
  bcLength: number;
  lambda: number;
  pointAngle: number;
  pointX: number;
  pointY: number;
}

export const defaultParams: VectorPolarizationApolloniusParams = {
  bcLength: 6.0,
  lambda: 2.0,
  pointAngle: 45,
  pointX: 2.0,
  pointY: 4.0,
};

export const paramMeta: Record<
  keyof VectorPolarizationApolloniusParams,
  {
    label: string;
    labelFormula?: string;
    defaultValue?: number;
    min: number;
    max: number;
    step?: number;
    description: string;
    descriptionFormula?: string;
    importance?: ParamImportance;
    group?: string;
    marks?: ParamMark[];
  }
> = {
  bcLength: {
    label: "基底定长 d",
    labelFormula: `\\text{基底定长 } \\color{${MATH_COLORS.paramSecondary}}{d}`,
    defaultValue: 6.0,
    min: 2.0,
    max: 10.0,
    step: 0.5,
    description: "定点跨度全长 |BC| (或 |AB|)",
    descriptionFormula: "\\text{基底定点距离 } d",
    importance: "core",
    group: "几何底模参数",
  },
  lambda: {
    label: "距离比 λ",
    labelFormula: `\\text{距离比 } \\color{${MATH_COLORS.paramPrimary}}{\\lambda}`,
    defaultValue: 2.0,
    min: 0.2,
    max: 5.0,
    step: 0.1,
    description: "动点 P 到两定点 A、B 的距离比例系数 |PA|/|PB|",
    descriptionFormula: "\\frac{|PA|}{|PB|} = \\lambda",
    importance: "core",
    group: "阿波罗尼斯圆参数",
    marks: [
      {
        value: 1.0,
        label: "λ=1",
        labelFormula: "\\lambda = 1",
        variant: "critical",
      },
    ],
  },
  pointAngle: {
    label: "轨迹参数角 θ",
    labelFormula: `\\text{轨迹极角 } \\color{${MATH_COLORS.paramTertiary}}{\\theta}`,
    defaultValue: 45,
    min: 0,
    max: 360,
    step: 1,
    description: "动点 P 在阿波罗尼斯圆圆周上的参数极角",
    importance: "display",
    group: "动点位置参数",
  },
  pointX: {
    label: "动点横坐标 x_A",
    labelFormula: `\\text{动点横坐标 } x_A`,
    defaultValue: 2.0,
    min: -8.0,
    max: 8.0,
    step: 0.1,
    description: "自由动点 A 的横坐标",
    importance: "display",
    group: "动点 A 坐标",
  },
  pointY: {
    label: "动点纵坐标 y_A",
    labelFormula: `\\text{动点纵坐标 } y_A`,
    defaultValue: 4.0,
    min: -6.0,
    max: 6.0,
    step: 0.1,
    description: "自由动点 A 的纵坐标",
    importance: "display",
    group: "动点 A 坐标",
  },
};
