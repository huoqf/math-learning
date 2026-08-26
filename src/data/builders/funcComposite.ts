import type { MathPanelData } from "../types";
import { calculatePiecewise, calculateComposite } from "@/math/composite";
import { MATH_COLORS } from "@/theme";

export function buildFuncCompositePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const subMode = (config?.subMode as string) || "piecewise";

  if (subMode === "piecewise") {
    const x0 = params.x0 ?? 1.0;
    const leftSlope = params.leftSlope ?? 1.0;
    const leftConst = params.leftConst ?? 0.0;
    const rightSlope = params.rightSlope ?? -0.5;
    const rightConst = params.rightConst ?? 1.5;

    const res = calculatePiecewise({
      x0,
      leftSlope,
      leftConst,
      rightSlope,
      rightConst,
    });

    const quantities: MathPanelData["quantities"] = [
      {
        label: "分界点",
        symbol: "x₀",
        value: x0.toFixed(1),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "左段端点极限",
        symbol: "f₁(x₀⁻)",
        value: res.leftValAtX0.toFixed(2),
        color: MATH_COLORS.function,
      },
      {
        label: "右段端点极限",
        symbol: "f₂(x₀⁺)",
        value: res.rightValAtX0.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "分界点搭接差",
        symbol: "Δy = f₂-f₁",
        value: (res.rightValAtX0 - res.leftValAtX0).toFixed(2),
        color: MATH_COLORS.labelText,
      },
      {
        label: "连续性状态",
        value: res.isContinuous ? "连续" : "存在跳跃断点",
        highlight: res.isContinuous ? "extreme" : "negative",
      },
      {
        label: "全域单调性",
        value:
          res.globalMonotonicity === "increasing"
            ? "🟢 全域单调递增"
            : res.globalMonotonicity === "decreasing"
              ? "🔴 全域单调递减"
              : res.globalMonotonicity === "constant"
                ? "常数函数"
                : "❌ 非全域单调",
        highlight:
          res.globalMonotonicity === "increasing"
            ? "extreme"
            : res.globalMonotonicity === "decreasing"
              ? "negative"
              : undefined,
      },
    ];

    const theorems: MathPanelData["theorems"] = [
      {
        name: "分段函数全域单调性充要条件 (高考经典)",
        latex:
          "f(x) \\text{ 在 } \\mathbb{R} \\text{ 上递增} \\iff \\begin{cases} f_1(x) \\text{ 在 } (-\\infty, x_0] \\text{ 单调递增} \\\\ f_2(x) \\text{ 在 } (x_0, +\\infty) \\text{ 单调递增} \\\\ f_1(x_0) \\le f_2(x_0) \\quad \\text{(衔接搭接不等式)} \\end{cases}",
        level: "core",
        prerequisites: ["左右两段均单调递增", "分界点处左侧终值不大于右侧初值"],
      },
      {
        name: "分段函数分界点连续充要条件",
        latex:
          "\\lim_{x \\to x_0^-} f_1(x) = \\lim_{x \\to x_0^+} f_2(x) = f(x_0)",
        level: "core",
        prerequisites: ["左右极限均存在且相等"],
      },
    ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "【高考经典陷阱】分段函数在 ℝ 上单调，绝不仅是每段分别单调！必须联立分界点衔接不等式 f₁(x₀) ≤ f₂(x₀)（递增）或 f₁(x₀) ≥ f₂(x₀)（递减），漏写搭接不等式是第一扣分点。",
        importance: "gaokao",
      },
      {
        text: "分段函数求值策略：\u201C由外向内\u201D逐步代入，先判自变量所在区间；求零点必须分别求解并检验定义域！",
        importance: "gaokao",
      },
    ];

    const warnings: MathPanelData["warnings"] = [];
    if (
      res.globalMonotonicity === "non-monotonic" &&
      leftSlope >= 0 &&
      rightSlope >= 0 &&
      res.leftValAtX0 > res.rightValAtX0
    ) {
      warnings.push({
        text: `【单调性失效】两段虽各自单增，但在 x₀ 处向下跳跃 (f₁(x₀)=${res.leftValAtX0.toFixed(2)} > f₂(x₀)=${res.rightValAtX0.toFixed(2)})，导致函数在 ℝ 上不单调！`,
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "分段讨论看分界，单调递增验搭接；零点分求验定义域。",
    };
  } else {
    const xSample = params.xSample ?? 1.5;
    const innerB = params.innerB ?? -2.0;
    const innerC = params.innerC ?? 2.0;
    const outerType =
      (config?.outerType as "log" | "exp" | "quadratic") || "exp";

    const res = calculateComposite({ xSample, innerB, innerC, outerType });

    const quantities: MathPanelData["quantities"] = [
      {
        label: "自变量采样",
        symbol: "x",
        value: xSample.toFixed(1),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "中间变量",
        symbol: "u = g(x)",
        value: Number.isFinite(res.u) ? res.u.toFixed(2) : "无意义",
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "复合终值",
        symbol: "y = f(g(x))",
        value: Number.isFinite(res.y) ? res.y.toFixed(2) : "无意义",
        color: MATH_COLORS.function,
      },
      {
        label: "内层单调性",
        value:
          res.innerMonotonicity === "increasing"
            ? "单调递增 (↗)"
            : res.innerMonotonicity === "decreasing"
              ? "单调递减 (↘)"
              : "极值/驻点 (—)",
      },
      {
        label: "外层单调性",
        value:
          res.outerMonotonicity === "increasing"
            ? "单调递增 (↗)"
            : res.outerMonotonicity === "decreasing"
              ? "单调递减 (↘)"
              : "极值/驻点 (—)",
      },
      {
        label: "复合单调性",
        value:
          res.compositeMonotonicity === "increasing"
            ? "🟢 复合单调递增 (同增)"
            : res.compositeMonotonicity === "decreasing"
              ? "🔴 复合单调递减 (异减)"
              : "🟡 驻点 / 无定义",
        highlight:
          res.compositeMonotonicity === "increasing" ? "extreme" : "negative",
      },
    ];

    const theorems: MathPanelData["theorems"] = [
      {
        name: "复合函数单调性法则 (同增异减四步通法)",
        latex:
          "\\text{步骤：①求定义域 } D \\to \\text{②求 } u=g(x) \\text{ 在 } D \\text{ 的单调性} \\to \\text{③求 } f(u) \\text{ 单调性} \\to \\text{④同增异减}",
        level: "core",
        prerequisites: ["定义域内成立", "u=g(x) 单调", "f(u) 在对应值域单调"],
      },
    ];

    if (outerType === "log") {
      theorems.push({
        name: "对数复合单调性与真数限制 (高考最高频)",
        latex:
          "y = \\log_2(g(x)) \\quad (\\text{底数 } 2 > 1 \\text{ 时与 } g(x) \\text{ 同单调，前提必须 } g(x) > 0)",
        level: "core",
        prerequisites: ["真数 u = g(x) > 0 必须严格成立"],
      });
    } else if (outerType === "exp") {
      theorems.push({
        name: "指数复合函数单调性",
        latex:
          "y = 2^{g(x)} \\quad (\\text{底数 } 2 > 1 \\text{ 时单调性与 } g(x) \\text{ 完全一致})",
        level: "core",
        prerequisites: ["外层在 ℝ 上严格单调递增"],
      });
    } else {
      theorems.push({
        name: "二次外层单调性翻转",
        latex:
          "f(u) = -(u-2)^2+4 \\quad (u < 2 \\text{ 单调增，} u > 2 \\text{ 单调减})",
        level: "core",
        prerequisites: ["需结合内层 u = g(x) 的值域与对称轴 u = 2 分段判断"],
      });
    }

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [];
    if (outerType === "log") {
      gaokaoPoints.push({
        text: "【对数真数优先铁律】求 y = log₂(x²+bx+c) 单调增区间，第一步必须先解 x²+bx+c > 0 确定定义域 D，再取 D 与内层增区间的交集！直接忽略真数大于0是高考最高频扣分点。",
        importance: "gaokao",
      });
    } else if (outerType === "exp") {
      gaokaoPoints.push({
        text: "指数复合 y = 2^{g(x)} 的单调区间与内层 g(x) 的单调区间完全一致，值域恒满足 y > 0 且无零点。",
        importance: "gaokao",
      });
    } else {
      gaokaoPoints.push({
        text: "外层二次函数在顶点 u = 2 处单调性翻转，必须结合内层二次函数 u = g(x) 的值域与 u = 2 的交汇位置进行分类讨论。",
        importance: "gaokao",
      });
    }
    gaokaoPoints.push({
      text: "复合函数值域核心：先求内层 u = g(x) 的值域 U，再求外层 f(u) 在定义域 U 上的值域。直接忽略内层值域是高考高频失分点。",
      importance: "gaokao",
    });

    const warnings: MathPanelData["warnings"] = [];
    if (!res.isValid && res.warningMessage) {
      warnings.push({ text: res.warningMessage, level: "warning" });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "复合函数先求域，内层值域是外域；同增异减定区间。",
    };
  }
}
