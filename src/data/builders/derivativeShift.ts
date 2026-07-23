/**
 * src/data/builders/derivativeShift.ts
 * 隐零点定理与极值点偏移 MathPanel 数据组装
 */

import type { MathPanelData } from "../types";
import {
  solveImplicitZero,
  solveExtremumShift,
  solveLogMean,
  type ImplicitZeroModel,
  type ExtremumShiftModel,
} from "@/math/derivativeShift";
import { MATH_COLORS } from "@/theme";

export function buildDerivativeShiftPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.activeMode as string) || "implicit_zero";
  const subModel = (config?.subModel as string) || "x_ln_x";

  const a = params.a ?? 1.5;
  const k = params.k ?? 0.25;
  const x1Param = params.x1 ?? 0.3;
  const x2Param = params.x2 ?? 3.5;

  const quantities: MathPanelData["quantities"] = [];
  const warnings: MathPanelData["warnings"] = [];
  const theorems: MathPanelData["theorems"] = [];
  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [];

  if (mode === "implicit_zero") {
    const izRes = solveImplicitZero(a, subModel as ImplicitZeroModel);

    if (!izRes.isValid) {
      warnings.push({
        text: "参数 a 过小，导函数 f'(x) 在定义域内无零点！",
        level: "danger",
      });
    }

    quantities.push(
      {
        label: "隐零点横坐标",
        symbol: "x₀",
        value: izRes.x0.toFixed(3),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "极值 (未消元)",
        symbol: "f(x₀)",
        value: izRes.y0.toFixed(3),
        color: MATH_COLORS.function,
      },
      {
        label: "极值 (代换消元下沉)",
        symbol: "h(x₀)",
        value: izRes.traceY.toFixed(3),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "零点处导数值",
        symbol: "f'(x₀)",
        value: "0.000",
        color: MATH_COLORS.derivative,
      },
    );

    theorems.push(
      {
        name: "零点存在定理与隐零点设而不求",
        latex: "f'(x_0) = 0 \\implies x_0 \\in (a, b)",
        condition: "1. f'(x) 在 (a, b) 连续且单调； 2. f'(a) \\cdot f'(b) < 0",
        note: "设而不求：不直接求出 x0 的显式，而是利用 f'(x0)=0 导出超越项等量代换关系。",
        level: "core",
      },
      {
        name: "代换下沉消元法",
        latex:
          subModel === "x_ln_x"
            ? "\\ln x_0 = a-1 \\implies f(x_0) = 1 - x_0"
            : "e^{x_0} = a \\implies f(x_0) = a(1 - \\ln a)",
        condition: "消去极值表达式中的超越项（如 e^{x0} 或 \\ln x0）",
        note: "将双变量/超越极值转化为仅含 x0 的多项式或代数函数 h(x0)，从而方便求最值。",
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "高考压轴第一问：通过特值缩小隐零点 x0 范围，虚设根并代换下沉",
        importance: "gaokao",
      },
      {
        text: "高考压轴第二问：消去超越项后转换为单变量 h(x0) 求单调性与最值",
        importance: "hard",
      },
    );
  } else if (mode === "shift_symmetric") {
    const shiftRes = solveExtremumShift(k, subModel as ExtremumShiftModel);

    if (k >= shiftRes.y0) {
      warnings.push({
        text: `割线 k ≥ ${shiftRes.y0.toFixed(3)} 已超出极值上限，无法截得两个交点！`,
        level: "danger",
      });
    }

    quantities.push(
      {
        label: "极值点",
        symbol: "x₀",
        value: shiftRes.x0.toFixed(3),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "割线左根",
        symbol: "x₁",
        value: shiftRes.x1.toFixed(3),
        color: MATH_COLORS.function,
      },
      {
        label: "割线右根",
        symbol: "x₂",
        value: shiftRes.x2.toFixed(3),
        color: MATH_COLORS.functionSecondary,
      },
      {
        label: "两根中点",
        symbol: "(x₁+x₂)/2",
        value: shiftRes.midX.toFixed(3),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "极值点偏移量",
        symbol: "\\Delta = \\frac{x₁+x₂}{2} - x₀",
        value: `${shiftRes.delta > 0 ? "+" : ""}${shiftRes.delta.toFixed(3)} (${shiftRes.shiftType === "right" ? "右偏" : "左偏"})`,
        color: MATH_COLORS.paramTertiary,
      },
    );

    theorems.push(
      {
        name: "极值点偏移判定定理",
        latex: "x_1 + x_2 > 2x_0 \\iff \\text{中点 } \\frac{x_1+x_2}{2} > x_0",
        condition: "f(x1) = f(x2) = k，且 f(x) 在 x0 两侧单调性相反",
        note: "口诀：中点在极值点右侧为“右偏”，中点在左侧为“左偏”。",
        level: "core",
      },
      {
        name: "对称构造法 (构造差值函数)",
        latex: "F(x) = f(x) - f(2x_0 - x) > 0 \\quad (x \\in (0, x_0))",
        condition: "利用镜像曲线 y = f(2x0 - x) 与原曲线 y = f(x) 的高度差比较",
        note: "若 F(x1) < 0，则 f(x1) < f(2x0 - x1)，结合右侧单调性可导出 x1+x2 > 2x0。",
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "对称构造法四步曲：求极值点 x0 -> 转换目标 x2 > 2x0 - x1 -> 利用单调性转化 -> 构造 F(x)",
        importance: "gaokao",
      },
      {
        text: "乘积偏移与对数齐次化：设 t = x2 / x1 > 1 转化为单变量单调性",
        importance: "hard",
      },
    );
  } else {
    // mode === 'log_mean'
    const lmRes = solveLogMean(x1Param, x2Param);

    quantities.push(
      {
        label: "几何均值",
        symbol: "\\sqrt{x_1 x_2}",
        value: lmRes.geoMean.toFixed(3),
        color: MATH_COLORS.function,
      },
      {
        label: "对数均值",
        symbol: "L(x_1, x_2)",
        value: lmRes.logMean.toFixed(3),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "算术均值",
        symbol: "(x_1+x_2)/2",
        value: lmRes.ariMean.toFixed(3),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "齐次化比值",
        symbol: "t = x_2 / x_1",
        value: lmRes.t.toFixed(2),
        color: MATH_COLORS.labelText,
      },
    );

    theorems.push(
      {
        name: "对数均值不等式链",
        latex: "\\sqrt{ab} < \\frac{a - b}{\\ln a - \\ln b} < \\frac{a + b}{2}",
        condition: "a, b 为正实数且 a ≠ b",
        note: "对数均值 L(a, b) 严格夹在几何均值与算术均值之间！",
        level: "core",
      },
      {
        name: "齐次化单变量不等式",
        latex:
          "\\sqrt{t} < \\frac{t - 1}{\\ln t} < \\frac{t + 1}{2} \\quad (t > 1)",
        condition: "设 t = b / a > 1",
        note: "极值点偏移压轴题中秒杀 x1+x2 > 2x0 或 x1 x2 < x0^2 的终极利器。",
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "对数均值不等式在高考解答题中可直接证明（构造 g(t) = ln t - 2(t-1)/(t+1)）后做压轴秒杀",
      importance: "gaokao",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
  };
}
