import type { ParamMeta } from "@/data/types";
import { MATH_COLORS } from "@/theme";

/**
 * 几何构型判定的唯一规则（SSOT）：`defProj` 模式恒用极坐标几何定义
 * （a 沿 x 轴，由 |a| / |b| / θ 驱动），其余模式恒用直角坐标 (xa, ya, xb, yb)。
 *
 * 页面与数据层共用此唯一定义，杜绝"同一事实多处判定"导致中屏 Scene 与右屏看板不同源。
 */
export const isPolarGeomMode = (studyMode: string): boolean =>
  studyMode === "defProj";

export const defaultParams = {
  xa: 4,
  ya: 0,
  xb: 2,
  yb: 3,
  normA: 4.0,
  normB: 3.5,
  thetaDeg: 60,
};

export const paramMeta: Record<string, ParamMeta> = {
  normA: {
    key: "normA",
    label: "向量 a 的模长 |a|",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{|\\vec{a}|}`,
    defaultValue: 4.0,
    min: 0.5,
    max: 6.0,
    step: 0.5,
    description: "基准向量 a 的几何长度",
    importance: "core",
    group: "向量几何长度与夹角",
  },
  normB: {
    key: "normB",
    label: "向量 b 的模长 |b|",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{|\\vec{b}|}`,
    defaultValue: 3.5,
    min: 0.5,
    max: 6.0,
    step: 0.5,
    description: "投影向量 b 的几何长度",
    importance: "core",
    group: "向量几何长度与夹角",
  },
  thetaDeg: {
    key: "thetaDeg",
    label: "向量 a 与 b 的夹角 θ",
    labelFormula: `\\text{夹角 }\\color{${MATH_COLORS.paramTertiary}}{\\theta}`,
    defaultValue: 60,
    min: 0,
    max: 180,
    step: 5,
    description: "两向量夹角 θ ∈ [0°, 180°]",
    importance: "core",
    group: "向量几何长度与夹角",
    marks: [
      { value: 0, label: "0° (同向)" },
      { value: 90, label: "90° (垂直)", variant: "critical" },
      { value: 180, label: "180° (反向)" },
    ],
  },
  xa: {
    key: "xa",
    label: "向量 a 的横坐标 x₁",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_1}`,
    defaultValue: 4,
    min: -6,
    max: 6,
    step: 0.5,
    description: "向量 a 在 x 轴上的坐标分量",
    descriptionFormula: `\\vec{a} = (\\color{${MATH_COLORS.paramPrimary}}{x_1}, y_1)`,
    importance: "core",
    group: `\\text{向量 } \\vec{a} = (x_1, y_1)`,
  },
  ya: {
    key: "ya",
    label: "向量 a 的纵坐标 y₁",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{y_1}`,
    defaultValue: 0,
    min: -6,
    max: 6,
    step: 0.5,
    description: "向量 a 在 y 轴上的坐标分量",
    descriptionFormula: `\\vec{a} = (x_1, \\color{${MATH_COLORS.paramPrimary}}{y_1})`,
    importance: "core",
    group: `\\text{向量 } \\vec{a} = (x_1, y_1)`,
  },
  xb: {
    key: "xb",
    label: "向量 b 的横坐标 x₂",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{x_2}`,
    defaultValue: 2,
    min: -6,
    max: 6,
    step: 0.5,
    description: "向量 b 在 x 轴上的坐标分量",
    descriptionFormula: `\\vec{b} = (\\color{${MATH_COLORS.paramSecondary}}{x_2}, y_2)`,
    importance: "core",
    group: `\\text{向量 } \\vec{b} = (x_2, y_2)`,
  },
  yb: {
    key: "yb",
    label: "向量 b 的纵坐标 y₂",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{y_2}`,
    defaultValue: 3,
    min: -6,
    max: 6,
    step: 0.5,
    description: "向量 b 在 y 轴上的坐标分量",
    descriptionFormula: `\\vec{b} = (x_2, \\color{${MATH_COLORS.paramSecondary}}{y_2})`,
    importance: "core",
    group: `\\text{向量 } \\vec{b} = (x_2, y_2)`,
  },
};
