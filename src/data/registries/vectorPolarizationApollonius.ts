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
    marks?: ParamMark[];
  }
> = {
  bcLength: {
    label: "底边间距 d",
    labelFormula: `\\text{基底定点距离 } \\color{${MATH_COLORS.paramSecondary}}{d}`,
    defaultValue: 6.0,
    min: 2.0,
    max: 10.0,
    step: 0.5,
    description: "定点 A 与 B (或 B 与 C) 的跨度全长",
    importance: "core",
  },
  lambda: {
    label: "距离比 λ",
    labelFormula: `\\text{距离比例系数 } \\color{${MATH_COLORS.paramPrimary}}{\\lambda = \\frac{|PA|}{|PB|}}`,
    defaultValue: 2.0,
    min: 0.2,
    max: 5.0,
    step: 0.1,
    description: "动点 P 到两定点 A、B 的距离之比",
    importance: "core",
    marks: [
      {
        value: 1.0,
        label: "λ=1 (中垂线)",
        labelFormula: "\\lambda = 1 \\text{ (退化中垂线)}",
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
    description: "动点 P 在阿波罗尼斯圆圆周上的参数角度",
    importance: "display",
  },
  pointX: {
    label: "动点 A_x",
    labelFormula: "x_A",
    defaultValue: 2.0,
    min: -8.0,
    max: 8.0,
    step: 0.1,
    description: "极化恒等式中自由动点 A 的 X 坐标",
    importance: "display",
  },
  pointY: {
    label: "动点 A_y",
    labelFormula: "y_A",
    defaultValue: 4.0,
    min: -6.0,
    max: 6.0,
    step: 0.1,
    description: "极化恒等式中自由动点 A 的 Y 坐标",
    importance: "display",
  },
};
