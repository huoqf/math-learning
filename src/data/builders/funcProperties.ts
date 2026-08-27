import type { MathPanelData } from "../types";
import {
  evalFunctionParity,
  evalSecantSlope,
  evalAxisSymmetry,
  evalCenterSymmetry,
  evalPeriodicityModel,
  type PeriodModelType,
} from "@/math/function";
import { MATH_COLORS } from "@/theme";

export function buildFuncPropertiesPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = ((config?.mode as string) || "parity") as
    "domain" | "parity" | "symmetry";
  const subMode = (config?.subMode as string) || "axis"; // "axis" | "center" | "period-dual-axis" | "period-dual-center" | "period-axis-center"
  const fnType = ((config?.fnType as string) || "quadratic") as
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
  const centerX = params.centerX ?? 0.0;
  const centerY = params.centerY ?? 0.0;

  // 1. 定义域与值域模式
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
        name: "函数概念与三要素",
        latex:
          "y = f(x), \\quad x \\in D, \\quad R = \\{ y \\mid y = f(x), x \\in D \\}",
        level: "core",
        prerequisites: [
          "定义域 D 与值域 R 均为非空实数集",
          "单值对应：定义域 D 内的每一个自变量 x，有且仅有唯一确定的 y 与之对应",
        ],
      },
      {
        name: "垂直线检验定理 (Vertical Line Test)",
        latex:
          "\\text{任意直线 } x = c \\ (c \\in D) \\text{ 与函数图象有且仅有 } 1 \\text{ 个交点}",
        level: "core",
        prerequisites: [
          "若存在直线与曲线交点数大于 1，则该几何图形必不表示函数关系",
        ],
      },
      {
        name: "同一函数判定准则",
        latex: "f(x) \\equiv g(x) \\iff D_f = D_g \\ \\land \\ f(x) = g(x)",
        level: "important",
        prerequisites: [
          "定义域相同且对应法则完全相同（两要素决定三要素，与自变量字母无关）",
        ],
      },
      {
        name: "抽象函数复合定义域原则",
        latex: "x \\in D_{\\text{复合}} \\iff g(x) \\in D_f",
        level: "important",
        prerequisites: ["同一个对应法则 f 的括号内范围必须完全相同"],
      },
    ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "定义域优先铁律：研究函数的奇偶性、单调性、最值或零点前，必须首先确定定义域！若定义域不关于原点对称，直接秒杀判定为非奇非偶。",
        importance: "gaokao",
      },
      {
        text: "同一函数高考辨析陷阱：两函数若要相等，定义域与解析式必须完全一致！例如 f(x)=x 与 g(x)=√(x²)=|x| 法则不同非同一函数；f(x)=1 与 g(x)=x⁰ 定义域不同(x≠0)非同一函数。",
        importance: "gaokao",
      },
      {
        text: "抽象函数定义域速解口诀：“同一 f 括号内范围相同”。已知 f(x) 的定义域为 [a, b]，求 f(g(x)) 的定义域只需解不等式 a ≤ g(x) ≤ b 得出 x 的取值范围。",
        importance: "gaokao",
      },
      {
        text: "求值域与最值的新高考通法：①直接图象投影法；②二次函数配方法；③代数/三角换元法（换元必先定新元范围）；④基本不等式法（一正二定三相等）；⑤分离常数法（分式）；⑥导数单调性极值法。",
        importance: "core",
      },
    ];

    const warnings: MathPanelData["warnings"] = [];
    if (fnType === "reciprocal" && Math.abs(x0) < 1e-4) {
      warnings.push({
        text: "x₀ = 0 处反比例函数分母为零无定义！属于定义域外的去心奇点。",
        level: "danger",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "横看定义域纵看值域，垂线相交唯一解，括号内外范围清。",
    };
  }

  // 2. 奇偶性与单调性模式
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
        name: "奇偶性代数充要条件",
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
        name: "奇同偶反单调性定理",
        latex: "\\text{奇函数在对称区间单调性相同；偶函数在对称区间单调性相反}",
        level: "important",
        prerequisites: ["定义域区间关于原点对称"],
      },
    ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "奇函数在原点处的性质：若奇函数 f(x) 在 x = 0 处有定义，则必有 f(0) = 0！这是高考赋值法秒杀待定系数的关键。",
        importance: "gaokao",
      },
      {
        text: "单调性与不等式转化：利用单调性可直接脱去外层函数符号，将抽象不等式 f(A) > f(B) 转化为自变量不等式。",
        importance: "gaokao",
      },
    ];

    const warnings: MathPanelData["warnings"] = [];
    if (Math.abs(x1 - x2) < 1e-4) {
      warnings.push({
        text: "x₁ 与 x₂ 重合！割线退化为点，割线斜率未定义。",
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

  // 3. 对称性与周期性模式 (Symmetry & Periodicity)
  if (subMode === "axis") {
    // 单轴对称探究
    const axisRes = evalAxisSymmetry(getFn, axisA, x0);
    const quantities: MathPanelData["quantities"] = [
      {
        label: "对称轴位置 a",
        symbol: "x = a",
        value: axisA.toFixed(1),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "测试点 P(x₀, y₀)",
        symbol: "P",
        value: `(${x0.toFixed(1)}, ${axisRes.fx.toFixed(1)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "对称点 P'(2a-x₀, y₀)",
        symbol: "P'",
        value: `(${axisRes.symX.toFixed(1)}, ${axisRes.symFx.toFixed(1)})`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "轴对称匹配判定",
        value: axisRes.isSymmetric
          ? "完全对称"
          : `残差 Δy=${axisRes.residual.toFixed(2)}`,
        highlight: axisRes.isSymmetric ? "positive" : "negative",
      },
    ];

    const theorems: MathPanelData["theorems"] = [
      {
        name: "函数图象轴对称充要条件",
        latex:
          "f(a + x) = f(a - x) \\iff f(x) = f(2a - x) \\iff \\text{图象关于直线 } x = a \\text{ 对称}",
        level: "core",
        prerequisites: ["定义域关于直线 x = a 对称"],
      },
      {
        name: "任意两点轴对称判定定理",
        latex:
          "f(x_1) = f(x_2) \\ (x_1 \\neq x_2) \\Rightarrow \\text{对称轴 } x = \\frac{x_1 + x_2}{2}",
        level: "important",
        prerequisites: ["适用于二次函数、绝对值函数等具有单轴对称性的图象"],
      },
    ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "高考特征代数式识别：若 f(a+x) = f(b-x) 对任意 x 恒成立，两自变量之和 (a+x)+(b-x) = a+b 为常数，则图象对称轴为 x = (a+b)/2！",
        importance: "gaokao",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings: [],
      mnemonic: "两自变量相加为常数，和定对称看中点 x=(a+b)/2。",
    };
  }

  if (subMode === "center") {
    // 一般中心对称探究
    const centerRes = evalCenterSymmetry(getFn, centerX, centerY, x0);
    const quantities: MathPanelData["quantities"] = [
      {
        label: "对称中心 C(xc, yc)",
        symbol: "C",
        value: `(${centerX.toFixed(1)}, ${centerY.toFixed(1)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "测试点 P(x₀, y₀)",
        symbol: "P",
        value: `(${x0.toFixed(1)}, ${centerRes.fx.toFixed(1)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "中心对称点 P'",
        symbol: "P'",
        value: `(${centerRes.symX.toFixed(1)}, ${centerRes.symFx.toFixed(1)})`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "中心对称判定",
        value: centerRes.isSymmetric
          ? "完全对称"
          : `残差 Δy=${centerRes.residual.toFixed(2)}`,
        highlight: centerRes.isSymmetric ? "positive" : "negative",
      },
    ];

    const theorems: MathPanelData["theorems"] = [
      {
        name: "函数图象中心对称充要条件",
        latex:
          "f(a + x) + f(a - x) = 2b \\iff f(x) + f(2a - x) = 2b \\iff \\text{图象关于点 } (a, b) \\text{ 对称}",
        level: "core",
        prerequisites: ["定义域关于点 x = a 对称"],
      },
      {
        name: "奇函数特殊中心对称",
        latex:
          "f(-x) + f(x) = 0 \\iff \\text{关于坐标原点 } (0, 0) \\text{ 中心对称}",
        level: "important",
        prerequisites: ["a = 0, b = 0 特例"],
      },
    ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "高考中心对称识别大招：若 f(a+x) + f(b-x) = 2c 恒成立，则对称中心必为 ((a+b)/2, c)！例如三次函数与正切函数常以此形式命题。",
        importance: "gaokao",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings: [],
      mnemonic: "自变量相加为常数，函数值相加为常数，必关于中点中心对称。",
    };
  }

  // 高考三大周期性推导子模式
  const periodModelType: PeriodModelType =
    subMode === "period-dual-center"
      ? "dual-center"
      : subMode === "period-axis-center"
        ? "axis-center"
        : "dual-axis";

  const periodRes = evalPeriodicityModel(periodModelType, axisA, axisB);

  const quantities: MathPanelData["quantities"] = [
    {
      label: periodModelType === "axis-center" ? "对称轴 a" : "第一特征 a",
      symbol: "a",
      value: axisA.toFixed(1),
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: periodModelType === "axis-center" ? "对称中心 b" : "第二特征 b",
      symbol: "b",
      value: axisB.toFixed(1),
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "特征间距 |a - b|",
      symbol: "Δd",
      value: periodRes.dist.toFixed(1),
      color: MATH_COLORS.asymptote,
    },
    {
      label: "导出最小正周期 T",
      symbol: "T",
      value: periodRes.valid
        ? periodRes.period.toFixed(1)
        : "未导出(两特征重合)",
      highlight: periodRes.valid ? "positive" : "negative",
    },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name:
        periodModelType === "dual-axis"
          ? "双轴对称导出周期定理"
          : periodModelType === "dual-center"
            ? "双中心对称导出周期定理"
            : "一轴一中心导出周期定理",
      latex:
        periodModelType === "dual-axis"
          ? "f(x) \\text{ 关于 } x=a, x=b \\text{ 均对称 } \\Rightarrow T = 2|a - b|"
          : periodModelType === "dual-center"
            ? "f(x) \\text{ 关于 } (a, c), (b, c) \\text{ 均对称 } \\Rightarrow T = 2|a - b|"
            : "f(x) \\text{ 关于轴 } x=a \\text{ 与中心 } (b, c) \\text{ 对称 } \\Rightarrow T = 4|a - b|",
      level: "core",
      prerequisites: ["a ≠ b"],
    },
    {
      name: "周期函数平移不变性",
      latex:
        "f(x + T) = f(x) \\iff \\text{图象按周期 } T \\text{ 沿水平方向无限重复}",
      level: "important",
      prerequisites: ["T 为非零常数"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "新高考压轴秒杀口诀：双轴/双中心周期为 2 倍间距 (T = 2|a-b|)，一轴一中心周期为 4 倍间距 (T = 4|a-b|)！",
      importance: "gaokao",
    },
    {
      text: "抽象周期公式速记：f(x+a) = -f(x) ⇒ T = 2a；f(x+a) = 1/f(x) ⇒ T = 2a；f(x+a) = -1/f(x) ⇒ T = 2a；f(x+a) = (1-f(x))/(1+f(x)) ⇒ T = 4a。",
      importance: "gaokao",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (!periodRes.valid) {
    warnings.push({
      text: "两对称特征横坐标重合 (a = b)！两次对称折叠退化为单次对称，无法导出周期。",
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "双轴双中心周期两倍距，一轴一中心周期四倍距，和定对称差定周期。",
  };
}
