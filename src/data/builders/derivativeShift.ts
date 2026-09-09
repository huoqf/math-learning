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
        text: "参数 a 过小，导函数 f'(x) 在有效定义域内无零点！",
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
        label: "极值 (原函数)",
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
        latex:
          subModel === "x_ln_x"
            ? `f'({\\color{${MATH_COLORS.paramPrimary}}x_0}) = \\ln x_0 + x_0 + 1 - a = 0`
            : `f'({\\color{${MATH_COLORS.paramPrimary}}x_0}) = e^{x_0} - x_0 - a = 0`,
        condition: "导数方程为超越方程，无法初等求根，必设而不求",
        note: "第一步先利用零点存在定理（连续、单调、端点异号）锁定 x0 的存在区间。",
        level: "core",
      },
      {
        name: "消参下沉法 (构造单变量轨迹)",
        latex:
          subModel === "x_ln_x"
            ? `\\ln x_0 = a - 1 - x_0 \\implies f(x_0) = {\\color{${MATH_COLORS.paramSecondary}}-\\frac{1}{2}x_0^2 - x_0}`
            : `a = e^{x_0} - x_0 \\implies f(x_0) = {\\color{${MATH_COLORS.paramSecondary}}e^{x_0}(1 - x_0) + \\frac{1}{2}x_0^2}`,
        condition: "利用 f'(x0) = 0 等量关系消去超越项或消去参数 a",
        note: "将含参数的极值 f(x0) 转化为关于 x0 的单变量多项式或轨迹函数 h(x0)，实现降维求最值。",
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "高考第一步：利用导数单调性与零点存在定理界定 x0 ∈ (m, n)",
        importance: "gaokao",
      },
      {
        text: "高考第二步：设而不求，由 f'(x0)=0 建立代换关系，消元下沉为单变量 h(x0)",
        importance: "hard",
      },
      {
        text: "高考第三步：利用 x0 的区间范围，研究 h(x0) 的单调性求出极值最值",
        importance: "gaokao",
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
        label: "极值点加法偏移",
        symbol: "\\Delta = \\frac{x₁+x₂}{2} - x₀",
        value: `${shiftRes.delta > 0 ? "+" : ""}${shiftRes.delta.toFixed(3)} (${shiftRes.shiftType === "right" ? "右偏" : "左偏"})`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "两根乘积",
        symbol: "x₁ · x₂",
        value: `${shiftRes.prod.toFixed(3)} (${shiftRes.prodShiftType === "greater" ? "乘积大于基准" : "乘积偏小"})`,
        color: MATH_COLORS.labelText,
      },
    );

    theorems.push(
      {
        name: "极值点加法与乘积偏移判定",
        latex:
          subModel === "xe_neg_x"
            ? `x_1 + x_2 > 2{\\color{${MATH_COLORS.paramPrimary}}x_0} = 2 \\quad (\\text{加法右偏})`
            : `x_1 + x_2 > 2e \\quad \\text{且} \\quad x_1 x_2 > e^2 \\quad (\\text{双重右偏})`,
        condition: "f(x1) = f(x2) = k，且 f(x) 在 x0 左右单调性相反",
        note: "割线中点落在极值点右侧为右偏；对数模型中乘积严格大于极值点平方。",
        level: "core",
      },
      {
        name: "对称构造法 (构造差值函数)",
        latex: `F(x) = f(x) - f(2x_0 - x) < 0 \\quad (x \\in (0, x_0))`,
        condition: "利用原曲线 y = f(x) 与镜像曲线 y = f(2x0 - x) 的高度差比较",
        note: "因为 F(x1) < 0，即 f(x1) < f(2x0 - x1) = f(x2)。由右侧单调递减可得 x2 > 2x0 - x1，即 x1 + x2 > 2x0。",
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "对称构造四步曲：1.求极值点x0；2.转化目标x2>2x0-x1；3.利用单调性转化f(x2)<f(2x0-x1)；4.构造差值函数F(x)导数定号",
        importance: "gaokao",
      },
      {
        text: "乘积偏移齐次化：对 lnx/x 模型设 t = x2 / x1 > 1，转化为单变量不等式证明",
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
        latex: `\\sqrt{ab} < {\\color{${MATH_COLORS.paramPrimary}}\\frac{a - b}{\\ln a - \\ln b}} < {\\color{${MATH_COLORS.paramSecondary}}\\frac{a + b}{2}}`,
        condition: "a, b 为正实数且 a ≠ b",
        note: "对数均值 L(a, b) 严格夹在几何均值与算术均值之间，割线斜率等于切线斜率！",
        level: "core",
      },
      {
        name: "齐次化与答题构造函数",
        latex:
          "g(t) = \\ln t - \\frac{2(t - 1)}{t + 1} > 0 \\quad (t = \\frac{b}{a} > 1)",
        condition: "高考解答题若需直接引用对数均值，需用导数证明该单变量不等式",
        note: "求导得 g'(t) = (t-1)^2 / (t(t+1)^2) > 0，可直接在高考答题卡获得满分证明。",
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
