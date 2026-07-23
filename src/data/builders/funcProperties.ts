import type { MathPanelData } from "../types";
import {
  evalFunctionParity,
  evalSecantSlope,
  evalSymmetryPeriod,
} from "@/math/function";
import { MATH_COLORS } from "@/theme";

export function buildFuncPropertiesPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = ((config?.mode as string) || "parity") as
    "domain" | "parity" | "symmetry";
  const fnType = ((config?.fnType as string) || "cubic") as
    "cubic" | "quadratic" | "abs" | "reciprocal" | "sin";

  const getFn = (x: number): number => {
    switch (fnType) {
      case "cubic":
        return x * x * x;
      case "quadratic":
        return x * x;
      case "abs":
        return Math.abs(x);
      case "reciprocal":
        return Math.abs(x) > 1e-4 ? 1 / x : NaN;
      case "sin":
        return Math.sin(x);
      default:
        return x;
    }
  };

  const x0 = params.x0 ?? 1.5;
  const x1 = params.x1 ?? -1.0;
  const x2 = params.x2 ?? 2.0;
  const axisA = params.axisA ?? 0.0;
  const axisB = params.axisB ?? 2.0;

  if (mode === "domain") {
    const fx0 = getFn(x0);
    const domainText =
      fnType === "reciprocal" ? "(-∞, 0) ∪ (0, +∞)" : "R (-∞, +∞)";
    const rangeText =
      fnType === "quadratic" || fnType === "abs"
        ? "[0, +∞)"
        : fnType === "reciprocal"
          ? "(-∞, 0) ∪ (0, +∞)"
          : fnType === "sin"
            ? "[-1, 1]"
            : "R (-∞, +∞)";

    const quantities: MathPanelData["quantities"] = [
      {
        label: "采样自变量 x₀",
        symbol: "x₀",
        value: x0.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "函数值 f(x₀)",
        symbol: "f(x₀)",
        value: Number.isFinite(fx0) ? fx0.toFixed(2) : "无定义",
        color: MATH_COLORS.function,
      },
      {
        label: "定义域 D",
        symbol: "D",
        value: domainText,
        color: MATH_COLORS.functionTransformed,
      },
      {
        label: "值域 R",
        symbol: "R",
        value: rangeText,
        color: MATH_COLORS.functionSecondary,
      },
    ];

    const theorems: MathPanelData["theorems"] = [
      {
        name: "定义域优先铁律",
        latex: "\\text{确定函数性质的前置条件: } x \\in D",
        level: "core",
        prerequisites: [
          "任何关于奇偶性、单调性、周期的讨论均建立在定义域存在的基础上",
        ],
      },
      {
        name: "值域与对应关系",
        latex: "R = \\{ y \\mid y = f(x), x \\in D \\}",
        level: "important",
        prerequisites: ["每一个 x 在 D 中有且仅有一个对应的 y"],
      },
    ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "高考第一陷阱：研究奇偶性或单调性前，必须首先确定函数的定义域！定义域如果不关于原点对称，直接判定为非奇非偶函数。",
        importance: "gaokao",
      },
      {
        text: "值域与最值：闭区间上的连续函数必有最大值与最小值；反比例函数与分式函数需特别警示渐近线与无定义断点。",
        importance: "core",
      },
    ];

    const warnings: MathPanelData["warnings"] = [];
    if (fnType === "reciprocal" && Math.abs(x0) < 1e-4) {
      warnings.push({
        text: "x₀ = 0 处反比例函数无定义！位于定义域之外。",
        level: "danger",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "定义域先看对称否，无定义点需排查，值域区间仔细寻。",
    };
  }

  if (mode === "parity") {
    const parityRes = evalFunctionParity(
      fnType === "sin" ? "cubic" : fnType,
      x0,
    );
    const secantRes = evalSecantSlope(getFn, x1, x2);

    const quantities: MathPanelData["quantities"] = [
      {
        label: "采样点 x₀ / f(x₀)",
        symbol: "f(x₀)",
        value: Number.isFinite(parityRes.fx)
          ? parityRes.fx.toFixed(2)
          : "无定义",
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "奇偶性判定",
        value:
          fnType === "sin"
            ? "奇函数 (Odd)"
            : parityRes.parity === "even"
              ? "偶函数 (Even)"
              : parityRes.parity === "odd"
                ? "奇函数 (Odd)"
                : "非奇非偶",
        highlight: "extreme",
      },
      {
        label: "割线斜率 k",
        symbol: "k",
        value: Number.isFinite(secantRes.slope)
          ? secantRes.slope.toFixed(2)
          : "未定义",
        color: MATH_COLORS.secantLine,
      },
      {
        label: "区间单调性",
        value:
          secantRes.monotonicity === "increasing"
            ? "单调递增 (k > 0)"
            : secantRes.monotonicity === "decreasing"
              ? "单调递减 (k < 0)"
              : "常数 / 重合",
        highlight:
          secantRes.monotonicity === "increasing" ? "positive" : "negative",
      },
    ];

    const theorems: MathPanelData["theorems"] = [
      {
        name: "奇函数与偶函数严格定义",
        latex:
          "\\text{偶函数: } f(-x) = f(x), \\quad \\text{奇函数: } f(-x) = -f(x)",
        level: "core",
        prerequisites: ["定义域必须关于坐标原点对称！"],
      },
      {
        name: "单调性割线斜率判定定理",
        latex:
          "\\frac{f(x_2) - f(x_1)}{x_2 - x_1} > 0 \\iff f(x) \\text{ 单调递增}",
        level: "important",
        prerequisites: ["x₁ ≠ x₂ 且均属于定义域区间"],
      },
      {
        name: "奇同偶反定理",
        latex: "\\text{奇函数在对称区间单调性相同；偶函数在对称区间单调性相反}",
        level: "important",
        prerequisites: ["区间关于原点对称"],
      },
    ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "奇函数在原点处的性质：若奇函数 f(x) 在 x = 0 处有定义，则必有 f(0) = 0！这是高考特值秒杀的关键。",
        importance: "gaokao",
      },
      {
        text: "单调性与不等式：利用单调性脱去函数符号 f(A) > f(B) 转化为 A > B (增) 或 A < B (减)。",
        importance: "gaokao",
      },
    ];

    const warnings: MathPanelData["warnings"] = [];
    if (Math.abs(x1 - x2) < 1e-4) {
      warnings.push({
        text: "x₁ 与 x₂ 重合！割线退化，斜率未定义。",
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "奇在原点f(0)=0，偶图y轴左右对称，割线斜率为正增。",
    };
  }

  // mode === "symmetry"
  const symRes = evalSymmetryPeriod(axisA, axisB);

  const quantities: MathPanelData["quantities"] = [
    {
      label: "第一对称轴 a",
      symbol: "x=a",
      value: axisA.toFixed(1),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "第二对称轴 b",
      symbol: "x=b",
      value: axisB.toFixed(1),
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "轴间距 |a - b|",
      symbol: "Δd",
      value: symRes.dist.toFixed(1),
      color: MATH_COLORS.asymptote,
    },
    {
      label: "导出最小正周期 T",
      symbol: "T",
      value: symRes.dist > 1e-4 ? symRes.period.toFixed(1) : "未导出(两轴重合)",
      highlight: symRes.dist > 1e-4 ? "positive" : "negative",
    },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "函数图象轴对称定理",
      latex:
        "f(a + x) = f(a - x) \\iff \\text{图象关于直线 } x = a \\text{ 轴对称}",
      level: "core",
      prerequisites: ["定义域关于 x = a 对称"],
    },
    {
      name: "双轴对称导出周期性定理",
      latex:
        "f(x) \\text{ 关于 } x=a, x=b \\text{ 对称 } \\Rightarrow T = 2|a - b|",
      level: "important",
      prerequisites: ["a ≠ b"],
    },
    {
      name: "一轴一中心推导周期",
      latex: "\\text{轴 } x=a \\text{ 与中心 } (b,c) \\Rightarrow T = 4|a - b|",
      level: "important",
      prerequisites: ["a ≠ b"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "高考压轴秒杀：只要看到 f(a+x) = f(b-x)，对称轴必为 x = (a+b)/2；看到 f(a+x) = -f(b-x)，周期必与 2|a-b| 或 4|a-b| 相关！",
      importance: "gaokao",
    },
    {
      text: "周期函数性质：f(x+T) = f(x) 意味着函数图象在水平方向上按长度 T 无限重复循环。",
      importance: "core",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (symRes.dist < 1e-4) {
    warnings.push({
      text: "对称轴 a 与 b 重合！无法导出周期 T，需两条不同对称轴。",
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "双轴对称周期现，周期长度等于两倍轴距 T=2|a-b|。",
  };
}
