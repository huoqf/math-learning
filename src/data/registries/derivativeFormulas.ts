/**
 * 基本初等函数求导公式参数注册表
 *
 * 特征参数 `paramA` 的含义随函数类型变化（幂指数 α / 底数 a / 常数值 C），
 * 因此其**声明域必须按 funcType 拆分**——这不是风格问题：
 *   - 幂函数需要 0.5 步长才能复现 α = 1/2、3/2 这类"分母为偶数"的分数指数，
 *     而它们正是定义域从 ℝ 收紧到 [0,+∞) 的唯一触发点（见 math/derivativeFormulas.describePowerDomain）；
 *   - 底数 a 需要 0.1 步长才可能命中自然底数 e ≈ 2.718 附近的演示；
 *   - 常数值 C 必须允许负数，否则"C 为任意常数、导数恒为 0"这条结论只覆盖了一半。
 * 本文件是滑块、中屏拖拽钳制（utils/paramClamp）与出题参数网格的**唯一事实源**。
 */
import { MATH_COLORS } from "@/theme";
import type { BasicFuncType } from "@/math/derivativeFormulas";

export interface DerivativeFormulasParams {
  funcType: BasicFuncType;
  x0: number;
  deltaX: number;
  paramA: number;
}

export const defaultDerivativeFormulasParams: Record<string, number> = {
  x0: 1.5,
  deltaX: 0.8,
  paramA: 2.0, // 默认 x^2
};

/** 按函数类型拆分的 paramA 专属声明域（SSOT） */
export const derivativeFormulasParamAMeta: Record<
  BasicFuncType,
  {
    min: number;
    max: number;
    step: number;
    label: string;
    color: string;
    description: string;
    marks?: {
      value: number;
      label: string;
      labelFormula?: string;
      variant?: "zero" | "critical" | "recommended";
    }[];
  }
> = {
  power: {
    min: 0.5,
    max: 4.0,
    step: 0.5,
    label: "幂指数 α",
    color: MATH_COLORS.paramTertiary,
    description:
      "0.5 步长可复现 α = 1/2、3/2 这类分数指数：此时定义域由 ℝ 收紧为 [0, +∞)",
  },
  sin: {
    min: 0.5,
    max: 4.0,
    step: 0.5,
    label: "幂指数 α",
    color: MATH_COLORS.paramTertiary,
    description: "正弦模式不暴露第三参数（仅为类型完整性占位）",
  },
  cos: {
    min: 0.5,
    max: 4.0,
    step: 0.5,
    label: "幂指数 α",
    color: MATH_COLORS.paramTertiary,
    description: "余弦模式不暴露第三参数（仅为类型完整性占位）",
  },
  exp: {
    min: 0.5,
    max: 4.0,
    step: 0.1,
    label: "底数 a",
    color: MATH_COLORS.paramTertiary,
    description:
      "指数函数要求 a > 0 且 a ≠ 1；a = 1 时退化为常数函数，右屏会给出显式提示",
    marks: [
      {
        value: 1.0,
        label: "退化（a=1 非指数函数）",
        labelFormula: "a = 1",
        variant: "critical",
      },
      {
        value: Math.E,
        label: "自然底数 e",
        labelFormula: "a = e",
        variant: "recommended",
      },
    ],
  },
  log: {
    min: 0.5,
    max: 4.0,
    step: 0.1,
    label: "底数 a",
    color: MATH_COLORS.paramTertiary,
    description:
      "对数函数要求 a > 0 且 a ≠ 1；a = 1 时 log₁x 无定义，右屏判为无定义",
    marks: [
      {
        value: 1.0,
        label: "退化（a=1 时无定义）",
        labelFormula: "a = 1",
        variant: "critical",
      },
      {
        value: Math.E,
        label: "自然底数 e",
        labelFormula: "a = e",
        variant: "recommended",
      },
    ],
  },
  constant: {
    min: -5.0,
    max: 5.0,
    step: 0.5,
    label: "常数值 C",
    color: MATH_COLORS.paramTertiary,
    description: "C 取任意实数（含负数与 0），导数恒为 0",
    marks: [
      { value: 0, label: "C = 0", labelFormula: "C = 0", variant: "zero" },
    ],
  },
};

/** 与函数类型无关的公共参数声明域 */
export const derivativeFormulasParamMeta = {
  x0: {
    min: 0.2,
    max: 4.0,
    step: 0.1,
    label: "切点横坐标 x₀",
    color: MATH_COLORS.paramPrimary,
  },
  deltaX: {
    min: 0.05,
    max: 2.0,
    step: 0.05,
    label: "自变量增量 Δx",
    color: MATH_COLORS.paramSecondary,
  },
  /**
   * 兼容入口：仍以幂函数口径暴露 paramA。
   * 新代码请改用 `derivativeFormulasParamAMeta[funcType]`，避免拿到与当前模式不符的声明域。
   */
  paramA: {
    min: derivativeFormulasParamAMeta.power.min,
    max: derivativeFormulasParamAMeta.power.max,
    step: derivativeFormulasParamAMeta.power.step,
    label: "特征参数 a (底数或指数)",
    color: MATH_COLORS.paramTertiary,
  },
};

/** 取当前函数类型下 paramA 的声明域（缺失时回退幂函数口径） */
export function resolveParamAMeta(funcType: BasicFuncType) {
  return (
    derivativeFormulasParamAMeta[funcType] ?? derivativeFormulasParamAMeta.power
  );
}
