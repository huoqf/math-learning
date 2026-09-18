import { MATH_COLORS } from "@/theme";
import type { ParamMark, ParamImportance } from "@/data/types";

export interface VectorPolarizationApolloniusParams {
  bcLength: number;
  lambda: number;
  pointAngle: number;
  pointX: number;
  pointY: number;
}

/**
 * 中屏可见横轴半宽（数学单位）。
 *
 * **SSOT（单一事实源）**：本页既用它作为 `useSceneScale({ xRange })` 的取值来源，
 * 也用它作为「外分点 E / 阿氏圆是否出画布」的判据说明。
 * 视口与裁切判据必须共用同一个常量，否则一旦调整视口，
 * 就会出现"图上已经画得下、提示却说被裁"（或反过来）的脱节。
 *
 * 取值 12 的依据：λ = 0.5 的「半倍比阿圆」预设（d = 6 ⇒ c = 3）
 * 其外分点 E(−9, 0)、圆跨 [−9, −1]，需要 |x| ≥ 9 才能完整呈现；
 * 同时默认参数（d = 6, λ = 2）的 E(9, 0) 也在同一量级。
 */
export const VISIBLE_X_LIMIT = 12;

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
    descriptionFormula: "基底定点距离 $d$",
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
    description:
      "动点 P 到两定点 A、B 的距离比例系数 |PA|/|PB|（λ 越贴近 1，阿氏圆半径 2cλ/|λ²−1| 越发散，外分点 E 越易超出画布）",
    descriptionFormula: "\\frac{|PA|}{|PB|} = \\lambda",
    importance: "core",
    group: "阿波罗尼斯圆参数",
    marks: [
      {
        value: 1.0,
        label: "λ=1",
        labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{\\lambda = 1}`,
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
    label: "动点横坐标 $x_A$",
    labelFormula: `\\text{动点横坐标 } \\color{${MATH_COLORS.paramPrimary}}{x_A}`,
    defaultValue: 2.0,
    min: -8.0,
    max: 8.0,
    step: 0.1,
    description: "自由动点 A 的横坐标",
    importance: "display",
    group: "动点 A 坐标",
  },
  pointY: {
    label: "动点纵坐标 $y_A$",
    labelFormula: `\\text{动点纵坐标 } \\color{${MATH_COLORS.paramPrimary}}{y_A}`,
    defaultValue: 4.0,
    min: -6.0,
    max: 6.0,
    step: 0.1,
    description: "自由动点 A 的纵坐标",
    importance: "display",
    group: "动点 A 坐标",
  },
};
