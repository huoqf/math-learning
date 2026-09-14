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
        note: "第一步先利用零点存在定理（连续、单调、端点异号）锁定 $x_0$ 的存在区间。",
        level: "core",
      },
      {
        name: "消参下沉法 (构造单变量轨迹)",
        latex:
          subModel === "x_ln_x"
            ? `\\ln x_0 = a - 1 - x_0 \\implies f(x_0) = {\\color{${MATH_COLORS.paramSecondary}}-\\frac{1}{2}x_0^2 - x_0}`
            : `a = e^{x_0} - x_0 \\implies f(x_0) = {\\color{${MATH_COLORS.paramSecondary}}e^{x_0}(1 - x_0) + \\frac{1}{2}x_0^2}`,
        condition: "利用 $f'(x_0) = 0$ 等量关系消去超越项或消去参数 $a$",
        note: "将含参数的极值 $f(x_0)$ 转化为关于 $x_0$ 的单变量轨迹函数 $h(x_0)$，实现降维求最值。",
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "高考第一步：利用导数单调性与零点存在定理界定隐零点 $x_0 \\in (m, n)$",
        importance: "gaokao",
      },
      {
        text: "高考第二步：设而不求，由 $f'(x_0) = 0$ 建立代换关系，消参下沉为单变量 $h(x_0)$",
        importance: "hard",
      },
      {
        text: "高考第三步：利用 $x_0$ 的区间范围，研究轨迹 $h(x_0)$ 的单调性求出极值最值范围",
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
            ? `x_1 + x_2 > 2{\\color{${MATH_COLORS.paramPrimary}}x_0} \\quad (\\text{加法右偏})`
            : `x_1 + x_2 > 2{\\color{${MATH_COLORS.paramPrimary}}x_0} \\quad \\text{且} \\quad x_1 x_2 > {\\color{${MATH_COLORS.paramSecondary}}x_0^2} \\quad (\\text{双重右偏})`,
        condition:
          "$f(x_1) = f(x_2) = k$，且 $f(x)$ 在极值点 $x_0$ 左右单调性相反",
        note: "割线中点落在极值点右侧为加法右偏；对数模型中两根乘积严格大于极值点平方 ($x_1 x_2 > x_0^2$) 为乘积右偏。",
        level: "core",
      },
      {
        name: "对称构造法 (构造差值函数)",
        latex: `F(x) = f(x) - f(2x_0 - x) < 0 \\quad (x \\in (0, x_0))`,
        condition:
          "利用原曲线 $y = f(x)$ 与镜像曲线 $y = f(2x_0 - x)$ 的高度差比较",
        note: "由 $F(x_1) < 0$ 得 $f(x_1) < f(2x_0 - x_1) = f(x_2)$。再由右侧单调递减得到 $x_2 > 2x_0 - x_1$，即 $x_1 + x_2 > 2x_0$。",
        level: "important",
      },
    );

    gaokaoPoints.push(
      {
        text: "对称构造四步曲：① 求导得极值点 $x_0$；② 转化目标为 $x_2 > 2x_0 - x_1$；③ 结合单调性等价转化 $f(x_2) < f(2x_0 - x_1)$；④ 构造差函数 $F(x) = f(x) - f(2x_0 - x)$ 求导定号",
        importance: "gaokao",
      },
      {
        text: "乘积偏移齐次化：对 $\\frac{\\ln x}{x}$ 模型设比值 $t = \\frac{x_2}{x_1} > 1$，消元转化为单变量不等式证明",
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
        condition: "$a, b > 0$ 且 $a \\neq b$",
        note: "对数均值 $L(a, b)$ 严格夹在几何均值与算术均值之间，割线斜率等于切线斜率！",
        level: "core",
      },
      {
        name: "齐次化与答题构造函数",
        latex:
          "g(t) = \\ln t - \\frac{2(t - 1)}{t + 1} > 0 \\quad (t = \\frac{b}{a} > 1)",
        condition: "高考解答题若需直接引用对数均值，需用导数证明该单变量不等式",
        note: "求导得 $g'(t) = \\frac{(t-1)^2}{t(t+1)^2} > 0$，可直接在高考答题卡获得满分证明。",
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "对数均值不等式在高考解答题中可直接证明（构造辅助函数 $g(t) = \\ln t - \\frac{2(t-1)}{t+1} > 0$）后做压轴秒杀",
      importance: "gaokao",
    });
  }

  // 高考破题推演三部曲 (审题定法 -> 建模联立/消参 -> 代入求解反思)
  const reasoningSteps: MathPanelData["reasoningSteps"] = [];

  if (mode === "implicit_zero") {
    const izRes = solveImplicitZero(a, subModel as ImplicitZeroModel);
    reasoningSteps.push(
      {
        step: 1,
        title: "求导与零点存在性证明",
        detail:
          subModel === "x_ln_x"
            ? "求导得 $f'(x) = \\ln x + x + 1 - a$。$f'(x)$ 在 $(0, +\\infty)$ 单调递增，由零点存在定理必存在唯一零点 $x_0$ 满足 $f'(x_0) = 0$。"
            : "求导得 $f'(x) = e^x - x - a$。$f'(x)$ 在 $(0, +\\infty)$ 递增，$f'(0) < 0$，由零点存在定理必存在唯一正零点 $x_0$ 满足 $f'(x_0) = 0$。",
        latex:
          subModel === "x_ln_x"
            ? `f'(x_0) = \\ln x_0 + x_0 + 1 - a = 0 \\implies \\ln x_0 = a - 1 - x_0`
            : `f'(x_0) = e^{x_0} - x_0 - a = 0 \\implies a = e^{x_0} - x_0`,
        rubric: "零点存在定理与设而不求 (采分点 +4分)",
      },
      {
        step: 2,
        title: "设而不求消参下沉",
        detail:
          subModel === "x_ln_x"
            ? "将 $\\ln x_0 = a - 1 - x_0$ 代入极值 $f(x_0)$，彻底消去参数 $a$，将极值下沉为单变量二次抛物线轨迹 $h(x_0)$。"
            : "将参数 $a = e^{x_0} - x_0$ 代入极值 $f(x_0)$，消去参数 $a$，将极值转化为关于 $x_0$ 的单变量轨迹函数 $h(x_0)$。",
        latex:
          subModel === "x_ln_x"
            ? `f(x_0) = x_0(a - 1 - x_0) + \\frac{1}{2}x_0^2 - ax_0 = {\\color{${MATH_COLORS.paramSecondary}}-\\frac{1}{2}x_0^2 - x_0} = h(x_0)`
            : `f(x_0) = e^{x_0} - \\frac{1}{2}x_0^2 - (e^{x_0} - x_0)x_0 = {\\color{${MATH_COLORS.paramSecondary}}e^{x_0}(1 - x_0) + \\frac{1}{2}x_0^2} = h(x_0)`,
        rubric: "设代消参与轨迹构建 (采分点 +4分)",
      },
      {
        step: 3,
        title: "代入求值与范围确定",
        detail: `代入当前参数 $a = ${a.toFixed(2)}$，解算超越方程得隐零点 $x_0 \\approx ${izRes.x0.toFixed(3)}$，进而求得当前极值最值。`,
        latex: `x_0 \\approx ${izRes.x0.toFixed(3)} \\implies f(x_0) = h(x_0) \\approx ${izRes.y0.toFixed(3)}`,
        rubric: "结合区间单调性求最值范围 (采分点 +4分)",
      },
    );
  } else if (mode === "shift_symmetric") {
    const shiftRes = solveExtremumShift(k, subModel as ExtremumShiftModel);
    reasoningSteps.push(
      {
        step: 1,
        title: "求导确立极值中心",
        detail:
          subModel === "xe_neg_x"
            ? "对原函数求导得 $f'(x) = (1 - x)e^{-x}$，确定唯一极大值点 $x_0 = 1$。水平割线 $y = k$ 与曲线割于两点 $x_1 < 1 < x_2$。"
            : "对原函数求导得 $f'(x) = \\frac{1 - \\ln x}{x^2}$，极大值点 $x_0 = e$。割线 $y = k$ 割于两点 $x_1 < e < x_2$。",
        latex:
          subModel === "xe_neg_x"
            ? `x_0 = 1, \\quad f(x_0) = \\frac{1}{e} \\approx 0.368, \\quad f(x_1) = f(x_2) = k`
            : `x_0 = e, \\quad f(x_0) = \\frac{1}{e} \\approx 0.368, \\quad f(x_1) = f(x_2) = k`,
        rubric: "极值点与单调区间判定 (采分点 +3分)",
      },
      {
        step: 2,
        title: "对称构造差函数转化",
        detail:
          "欲证 $x_1 + x_2 > 2x_0$，即证 $x_2 > 2x_0 - x_1$。由单调递减等价于证明 $f(x_2) < f(2x_0 - x_1)$。由 $f(x_1) = f(x_2)$，构造差函数 $F(x) = f(x) - f(2x_0 - x)$。",
        latex: `F(x) = f(x) - f(2x_0 - x) \\quad (x \\in (0, x_0)), \\quad F(x_0) = 0`,
        rubric: "对称构造与目标等价转化 (采分点 +5分)",
      },
      {
        step: 3,
        title: "求导定号与偏移结论",
        detail: `通过导数分析证明 $F'(x) > 0$，由 $F(x_0) = 0$ 推出 $F(x_1) < 0$，从而 $x_1 + x_2 > 2x_0$ 获证。当前中点 $(x_1+x_2)/2 \\approx ${shiftRes.midX.toFixed(3)} > x_0$。`,
        latex: `F(x_1) < 0 \\implies f(x_1) < f(2x_0 - x_1) = f(x_2) \\implies x_1 + x_2 > 2x_0`,
        rubric: "单调性定号与结论落地 (采分点 +4分)",
      },
    );
  } else {
    const lmRes = solveLogMean(x1Param, x2Param);
    reasoningSteps.push(
      {
        step: 1,
        title: "割线切线斜率对应",
        detail:
          "连结对数曲线上两点 $P_1, P_2$，割线斜率为 $\\frac{\\ln x_2 - \\ln x_1}{x_2 - x_1} = \\frac{1}{L(x_1, x_2)}$。切点 $T(L, \\ln L)$ 处的切线斜率与割线严格平行。",
        latex: `k_{\\text{割}} = \\frac{\\ln x_2 - \\ln x_1}{x_2 - x_1} = \\frac{1}{L(x_1, x_2)} = f'(L)`,
        rubric: "斜率等价与对数均值定义 (采分点 +4分)",
      },
      {
        step: 2,
        title: "比值齐次化构造辅助函数",
        detail:
          "令比值 $t = \\frac{x_2}{x_1} > 1$。证明 $L < \\frac{x_1 + x_2}{2}$ 等价于证明 $\\frac{t - 1}{\\ln t} < \\frac{t + 1}{2}$，构造单变量函数 $g(t) = \\ln t - \\frac{2(t-1)}{t+1}$。",
        latex: `g(t) = \\ln t - \\frac{2(t - 1)}{t + 1}, \\quad g'(t) = \\frac{(t - 1)^2}{t(t + 1)^2} > 0`,
        rubric: "齐次换元与单变量求导 (采分点 +5分)",
      },
      {
        step: 3,
        title: "综合确立不等式链",
        detail: `由 $g(t) > g(1) = 0$ 得证 $L < A$；同理可证几何均值 $G = \\sqrt{x_1 x_2} < L$。当前区间数值 $G \\approx ${lmRes.geoMean.toFixed(2)} < L \\approx ${lmRes.logMean.toFixed(2)} < A \\approx ${lmRes.ariMean.toFixed(2)}$。`,
        latex: `\\sqrt{x_1 x_2} < L(x_1, x_2) = \\frac{x_2 - x_1}{\\ln x_2 - \\ln x_1} < \\frac{x_1 + x_2}{2}`,
        rubric: "不等式链确立与压轴应用 (采分点 +3分)",
      },
    );
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
  };
}
