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
    const parityRes = evalFunctionParity(fnType, x0);
    const secantRes = evalSecantSlope(getFn, x1, x2);

    let intrinsicMonotonicityText = "";
    let intrinsicMonotonicityHighlight:
      "positive" | "negative" | "extreme" | undefined = undefined;

    if (fnType === "cubic") {
      intrinsicMonotonicityText = "在 ℝ 上全局严格单调递增";
      intrinsicMonotonicityHighlight = "positive";
    } else if (fnType === "quadratic") {
      if (x1 >= 0 && x2 >= 0) {
        intrinsicMonotonicityText = "同在单调递增区间 [0, +∞)";
        intrinsicMonotonicityHighlight = "positive";
      } else if (x1 <= 0 && x2 <= 0) {
        intrinsicMonotonicityText = "同在单调递减区间 (-∞, 0]";
        intrinsicMonotonicityHighlight = "negative";
      } else {
        intrinsicMonotonicityText = "跨越对称轴 x = 0，整体不单调";
        intrinsicMonotonicityHighlight = "extreme";
      }
    } else if (fnType === "abs") {
      if (x1 >= 0 && x2 >= 0) {
        intrinsicMonotonicityText = "同在单调增区间 [0, +∞) (斜率 +1)";
        intrinsicMonotonicityHighlight = "positive";
      } else if (x1 <= 0 && x2 <= 0) {
        intrinsicMonotonicityText = "同在单调减区间 (-∞, 0] (斜率 -1)";
        intrinsicMonotonicityHighlight = "negative";
      } else {
        intrinsicMonotonicityText = "跨越折点 x = 0，整体不单调";
        intrinsicMonotonicityHighlight = "extreme";
      }
    } else if (fnType === "reciprocal") {
      if (x1 * x2 > 0) {
        intrinsicMonotonicityText =
          x1 > 0 ? "同在右支递减区间 (0, +∞)" : "同在左支递减区间 (-∞, 0)";
        intrinsicMonotonicityHighlight = "negative";
      } else {
        intrinsicMonotonicityText = "跨越去心奇点 x = 0，不可并集！";
        intrinsicMonotonicityHighlight = "extreme";
      }
    } else if (fnType === "sin") {
      intrinsicMonotonicityText = "无穷多增减区间交替 (周期 T = 2π)";
      intrinsicMonotonicityHighlight = "extreme";
    }

    const quantities: MathPanelData["quantities"] = [
      {
        label: "主测试点 P₀",
        symbol: "P_0(x_0, y_0)",
        value: Number.isFinite(parityRes.fx)
          ? `(${x0.toFixed(1)}, ${parityRes.fx.toFixed(2)})`
          : "无定义",
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "对称测试点 P'",
        symbol: "P'(-x_0, y')",
        value: Number.isFinite(parityRes.fNegX)
          ? `(${(-x0).toFixed(1)}, ${parityRes.fNegX.toFixed(2)})`
          : "无定义",
        color: MATH_COLORS.functionTransformed,
      },
      {
        label: "函数奇偶性判定",
        value:
          parityRes.parity === "even"
            ? "偶函数 (关于 y 轴对称)"
            : parityRes.parity === "odd"
              ? "奇函数 (关于原点对称)"
              : "非奇非偶函数",
        highlight: "extreme",
      },
      {
        label: "两点割线斜率 k",
        symbol: "k = \\frac{\\Delta y}{\\Delta x}",
        value: Number.isFinite(secantRes.slope)
          ? secantRes.slope.toFixed(2)
          : "未定义",
        color: MATH_COLORS.secantLine,
      },
      {
        label: "割线倾斜方向 (平均变化率)",
        value:
          secantRes.secantTrend === "upward"
            ? "向上倾斜 (k > 0)"
            : secantRes.secantTrend === "downward"
              ? "向下倾斜 (k < 0)"
              : secantRes.secantTrend === "horizontal"
                ? "水平割线 (k = 0)"
                : "未定义",
        highlight:
          secantRes.secantTrend === "upward"
            ? "positive"
            : secantRes.secantTrend === "downward"
              ? "negative"
              : undefined,
      },
      {
        label: "函数固有的单调性判定",
        value: intrinsicMonotonicityText,
        highlight: intrinsicMonotonicityHighlight,
      },
    ];

    const theorems: MathPanelData["theorems"] = [
      {
        name: "函数奇偶性代数充要条件",
        latex:
          "\\text{偶函数: } f(-x) = f(x) \\iff y \\text{ 轴对称}; \\quad \\text{奇函数: } f(-x) = -f(x) \\iff \\text{原点中心对称}",
        level: "core",
        prerequisites: [
          "前提铁律：定义域 D 必须关于坐标原点对称（不对称直接断定非奇非偶）",
          "全称要求：必须对定义域内的每一个 x 均恒成立",
        ],
      },
      {
        name: "函数单调性严格定义 (全称量词充要条件)",
        latex:
          "\\forall x_1 < x_2 \\in I, \\quad \\frac{f(x_2) - f(x_1)}{x_2 - x_1} > 0 \\iff f(x) \\text{ 在区间 } I \\text{ 上单调递增}",
        level: "core",
        prerequisites: [
          "全称性：单调性是区间属性，必须区间内任意两点割线斜率恒为正，两孤立测试点割线斜率大于零绝不等于区间单调递增",
          "区间独立性：两个单调区间之间严禁用并集符号 ∪ 联结",
        ],
      },
      {
        name: "奇同偶反单调性定理",
        latex: "\\text{奇函数在对称区间单调性相同；偶函数在对称区间单调性相反}",
        level: "important",
        prerequisites: ["单调区间必须关于坐标原点对称分布"],
      },
      {
        name: "反比例函数单调区间表述红线",
        latex:
          "f(x) = \\frac{1}{x} \\text{ 在 } (-\\infty, 0) \\text{ 与 } (0, +\\infty) \\text{ 分别单调递减}",
        level: "important",
        prerequisites: [
          "严禁书写为在 (-∞, 0) ∪ (0, +∞) 上递减，跨分支斜率为正为伪单调陷阱",
        ],
      },
    ];

    // 高考大题规范推导链三部曲
    const reasoningSteps: MathPanelData["reasoningSteps"] = [
      {
        step: 1,
        title: "① 审题定法 · 奇偶性定义法代数核验",
        detail:
          fnType === "reciprocal"
            ? "第一步：求得定义域为 $D = (-\\infty, 0) \\cup (0, +\\infty)$，关于原点对称；第二步：代入 $-x$ 计算 $f(-x) = \\frac{1}{-x} = -\\frac{1}{x} = -f(x)$；第三步：满足 $f(-x) = -f(x)$，判定为奇函数，图象关于坐标原点对称。"
            : fnType === "quadratic"
              ? "第一步：定义域为 $\\mathbb{R}$ 关于原点对称；第二步：计算 $f(-x) = (-x)^2 = x^2 = f(x)$；第三步：满足偶函数充要条件，图象关于 $y$ 轴轴对称。"
              : fnType === "abs"
                ? "第一步：定义域为 $\\mathbb{R}$ 关于原点对称；第二步：计算 $f(-x) = |-x| = |x| = f(x)$；第三步：满足偶函数充要条件，图象关于 $y$ 轴轴对称。"
                : fnType === "sin"
                  ? "第一步：定义域为 $\\mathbb{R}$ 关于原点对称；第二步：依据诱导公式计算 $f(-x) = \\sin(-x) = -\\sin x = -f(x)$；第三步：判定为奇函数，图象关于原点对称。"
                  : "第一步：定义域为 $\\mathbb{R}$ 关于原点对称；第二步：计算 $f(-x) = (-x)^3 = -x^3 = -f(x)$；第三步：判定为奇函数，图象关于原点对称。",
        latex:
          fnType === "reciprocal"
            ? "f(-x) = \\frac{1}{-x} = -\\frac{1}{x} = -f(x) \\implies \\text{奇函数 (关于原点对称)}"
            : fnType === "quadratic"
              ? "f(-x) = (-x)^2 = x^2 = f(x) \\implies \\text{偶函数 (关于 } y \\text{ 轴对称)}"
              : fnType === "abs"
                ? "f(-x) = |-x| = |x| = f(x) \\implies \\text{偶函数 (关于 } y \\text{ 轴对称)}"
                : fnType === "sin"
                  ? "f(-x) = \\sin(-x) = -\\sin x = -f(x) \\implies \\text{奇函数 (关于原点对称)}"
                  : "f(-x) = (-x)^3 = -x^3 = -f(x) \\implies \\text{奇函数 (关于原点对称)}",
      },
      {
        step: 2,
        title: "② 建模联立 · 单调性定义法作差因式分解",
        detail:
          fnType === "cubic"
            ? "任取 $x_1 < x_2$，作差变形：$f(x_2) - f(x_1) = x_2^3 - x_1^3 = (x_2 - x_1)(x_2^2 + x_1 x_2 + x_1^2)$。因 $x_2 - x_1 > 0$ 且配方后 $x_2^2 + x_1 x_2 + x_1^2 = (x_2 + \\frac{1}{2}x_1)^2 + \\frac{3}{4}x_1^2 > 0$，故差值恒大于零，在 $\\mathbb{R}$ 上严格递增。"
            : fnType === "quadratic"
              ? "任取 $x_1 < x_2$，作差分解：$f(x_2) - f(x_1) = x_2^2 - x_1^2 = (x_2 - x_1)(x_2 + x_1)$。当 $x_1, x_2 \\in [0, +\\infty)$ 时，$x_1+x_2>0$，差式大于零单调递增；当 $x_1, x_2 \\in (-\\infty, 0]$ 时，$x_1+x_2<0$，差式小于零单调递减。"
              : fnType === "reciprocal"
                ? "任取 $x_1 < x_2$，作差通分：$f(x_2) - f(x_1) = \\frac{1}{x_2} - \\frac{1}{x_1} = \\frac{x_1 - x_2}{x_1 x_2} = -\\frac{x_2 - x_1}{x_1 x_2}$。当同支时 $x_1 x_2 > 0$，分子大于零故整体小于零，分别单调递减；异支时 $x_1 x_2 < 0$，差式大于零，此为跨分支伪单调！"
                : "定义法作差因式分解是高考解答题证明单调性的唯一规范步骤，经历「①取值设元 → ②作差变形 → ③判断符号 → ④下定结论」四步闭环。",
        latex:
          fnType === "cubic"
            ? "\\Delta y = (x_2 - x_1)\\left[\\left(x_2 + \\frac{x_1}{2}\\right)^2 + \\frac{3x_1^2}{4}\\right] > 0 \\implies f(x) \\nearrow"
            : fnType === "quadratic"
              ? "\\Delta y = (x_2 - x_1)(x_1 + x_2) \\begin{cases} > 0, & x_1, x_2 \\ge 0 \\\\ < 0, & x_1, x_2 \\le 0 \\end{cases}"
              : fnType === "reciprocal"
                ? "\\Delta y = -\\frac{x_2 - x_1}{x_1 x_2} < 0 \\quad (x_1 x_2 > 0 \\text{ 同支})"
                : "\\frac{f(x_2) - f(x_1)}{x_2 - x_1} \\text{ 符号决定单调性}",
      },
      {
        step: 3,
        title: "③ 求解反思 · 采样割线斜率与避坑辨析",
        detail: `当前取点 $x_1 = ${x1.toFixed(1)}, x_2 = ${x2.toFixed(1)}$，计算两点平均变化率 $k = \\frac{\\Delta y}{\\Delta x} = ${Number.isFinite(secantRes.slope) ? secantRes.slope.toFixed(2) : "\\text{未定义}"}$。切记：割线斜率 $k$ 仅反映两测试点连线倾角，不可代替定义域内的充要单调性。`,
        latex: Number.isFinite(secantRes.slope)
          ? `k = \\frac{f(${x2.toFixed(1)}) - f(${x1.toFixed(1)})}{${x2.toFixed(1)} - (${x1.toFixed(1)})} = ${secantRes.slope.toFixed(2)}`
          : "x_1 = x_2 \\implies k \\text{ 未定义 (割线退化)}",
      },
    ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "奇函数在原点处的性质：若奇函数 f(x) 在 x = 0 处有定义，则必有 f(0) = 0！这是高考赋值法秒杀待定系数的关键（如分式、对数含参函数）。",
        importance: "gaokao",
      },
      {
        text: "单调性与不等式脱括号：利用函数单调性可直接脱去外层 f 符号，将抽象不等式 f(A) > f(B) 转化为内层自变量不等式，脱括号时必须首先强调自变量落在定义域内！",
        importance: "gaokao",
      },
      {
        text: "奇函数导数是偶函数，偶函数导数是奇函数：高考导数压轴题中，利用导函数的奇偶性往往能直接确定导函数极值点与对称中心。",
        importance: "core",
      },
    ];

    const warnings: MathPanelData["warnings"] = [];
    if (Math.abs(x1 - x2) < 1e-4) {
      warnings.push({
        text: "x₁ 与 x₂ 重合！割线退化为点，割线斜率未定义。",
        level: "warning",
      });
    }

    if (fnType === "reciprocal") {
      if (Math.abs(x0) < 1e-4 || Math.abs(x1) < 1e-4 || Math.abs(x2) < 1e-4) {
        warnings.push({
          text: "测试点落入 x = 0 去心奇点！分母为零无定义。",
          level: "danger",
        });
      }
      if (x1 * x2 < 0) {
        warnings.push({
          text: "【高考易错警示】x₁ 与 x₂ 分居原点两侧！反比例函数在 (-∞, 0) 与 (0, +∞) 分别单调递减，跨分支割线斜率 k > 0 绝非递增！严禁用并集 ∪ 联结单调区间！",
          level: "danger",
        });
      }
    }

    if ((fnType === "quadratic" || fnType === "abs") && x1 * x2 < 0) {
      warnings.push({
        text: "【概念辨析】x₁ 与 x₂ 跨越对称轴 x = 0！割线斜率仅为两点平均变化率，函数在该闭区间上先减后增，并不单调！",
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      reasoningSteps,
      gaokaoPoints,
      warnings,
      mnemonic: "奇在原点f(0)=0，偶图y轴对称，单调作差定符号，反比区间不相连。",
    };
  }

  // 3. 对称性与周期性模式 (Symmetry & Periodicity)
  // 3. 对称性与周期性模式 (Symmetry & Periodicity)
  if (subMode === "axis") {
    // 单轴对称探究
    const axisRes = evalAxisSymmetry(getFn, axisA, x0);
    const aStr = axisA.toFixed(1).replace(/\.0$/, "");
    const x0Str = x0.toFixed(1).replace(/\.0$/, "");
    const symXStr = axisRes.symX.toFixed(1).replace(/\.0$/, "");
    const fxStr = axisRes.fx.toFixed(2);
    const symFxStr = axisRes.symFx.toFixed(2);

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
        prerequisites: ["定义域关于直线 $x = a$ 对称"],
      },
      {
        name: "任意两点轴对称判定定理",
        latex:
          "f(x_1) = f(x_2) \\ (x_1 \\neq x_2) \\Rightarrow \\text{对称轴 } x = \\frac{x_1 + x_2}{2}",
        level: "important",
        prerequisites: ["适用于二次函数、绝对值函数等具有单轴对称性的图象"],
      },
    ];

    const reasoningSteps: MathPanelData["reasoningSteps"] = [
      {
        step: 1,
        title: "审题定法 · 几何轴对称中垂线转化",
        detail: `若点 $P(x_0, y_0)$ 在函数 $y = f(x)$ 图象上，其关于对称轴 $x = ${aStr}$ 的对称点设为 $P'(x', y')$，则线段 $PP'$ 的中点 $H$ 必落在对称轴上。`,
        latex: `\\frac{x_0 + x'}{2} = a \\implies x' = 2a - x_0, \\quad y' = y_0`,
        rubric: "得分点：写出中点坐标公式并解出对称点横坐标",
      },
      {
        step: 2,
        title: "建模联立 · 代数等价恒等式建立",
        detail: `由对称点 $P'$ 仍在函数图象上，代入解析式得 $f(x') = f(x_0)$，即 $f(2a - x_0) = f(x_0)$。将其推广至定义域内任意自变量 $x$，得函数轴对称充要条件。`,
        latex: `f(x) = f(2a - x) \\iff f(a + t) = f(a - t)`,
        rubric: "得分点：写出函数轴对称的一般充要条件",
      },
      {
        step: 3,
        title: "代入求解 · 当前测试点代数闭环验证",
        detail: `代入当前轴 $a = ${aStr}$ 及测试点 $x_0 = ${x0Str}$：对称点横坐标 $x' = 2(${aStr}) - (${x0Str}) = ${symXStr}$。计算函数值 $f(${x0Str}) = ${fxStr}$，$f(${symXStr}) = ${symFxStr}$，两点纵坐标完全相等。`,
        latex: `f(${x0Str}) = ${fxStr}, \\quad f(${symXStr}) = ${symFxStr} \\implies \\Delta y = 0.00`,
        rubric: "得分点：代入具体参数完成数形闭环验证",
      },
    ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "高考特征代数式识别：若 $f(a+x) = f(b-x)$ 对任意 $x$ 恒成立，两自变量之和 $(a+x)+(b-x) = a+b$ 为常数，则图象对称轴必为直线 $x = \\frac{a+b}{2}$！",
        importance: "gaokao",
      },
      {
        text: "偶函数轴对称本质：偶函数 $f(-x) = f(x)$ 是对称轴为 $y$ 轴（即直线 $x = 0$）的轴对称特例。",
        importance: "core",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      reasoningSteps,
      warnings: [],
      mnemonic: "两自变量相加为常数，和定对称看中点 x=(a+b)/2。",
    };
  }

  if (subMode === "center") {
    // 一般中心对称探究
    const centerRes = evalCenterSymmetry(getFn, centerX, centerY, x0);
    const xcStr = centerX.toFixed(1).replace(/\.0$/, "");
    const ycStr = centerY.toFixed(1).replace(/\.0$/, "");
    const x0Str = x0.toFixed(1).replace(/\.0$/, "");
    const symXStr = centerRes.symX.toFixed(1).replace(/\.0$/, "");
    const fxStr = centerRes.fx.toFixed(2);
    const symFxStr = centerRes.symFx.toFixed(2);

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
        prerequisites: ["定义域关于点 $x = a$ 对称"],
      },
      {
        name: "奇函数特殊中心对称",
        latex:
          "f(-x) + f(x) = 0 \\iff \\text{关于坐标原点 } (0, 0) \\text{ 中心对称}",
        level: "important",
        prerequisites: ["$a = 0, b = 0$ 特例"],
      },
    ];

    const reasoningSteps: MathPanelData["reasoningSteps"] = [
      {
        step: 1,
        title: "审题定法 · 几何中心对称中点公式转化",
        detail: `设图象上任意点 $P(x_0, y_0)$ 关于对称中心 $C(${xcStr}, ${ycStr})$ 的对称点为 $P'(x', y')$，则中心 $C$ 为线段 $PP'$ 的中点。`,
        latex: `\\begin{cases} \\frac{x_0 + x'}{2} = x_c \\implies x' = 2x_c - x_0 \\\\ \\frac{y_0 + y'}{2} = y_c \\implies y' = 2y_c - y_0 \\end{cases}`,
        rubric: "得分点：运用中点坐标公式表示对称点坐标",
      },
      {
        step: 2,
        title: "建模联立 · 中心对称函数值求和恒等式",
        detail: `由于对称点 $P'$ 仍在函数图象上，故 $y' = f(x')$。代入中点纵坐标关系式，推广至定义域内任意自变量 $x$。`,
        latex: `f(x) + f(2x_c - x) = 2y_c \\iff f(x_c + t) + f(x_c - t) = 2y_c`,
        rubric: "得分点：列出中心对称充要方程",
      },
      {
        step: 3,
        title: "代入求解 · 当前测试点中心对称数值代入",
        detail: `代入中心坐标 $(x_c, y_c) = (${xcStr}, ${ycStr})$ 与测试点 $x_0 = ${x0Str}$：$x' = 2(${xcStr}) - ${x0Str} = ${symXStr}$。计算两点纵坐标均值 $\\frac{f(${x0Str}) + f(${symXStr})}{2} = \\frac{${fxStr} + (${symFxStr})}{2} = ${ycStr}$。`,
        latex: `\\frac{f(${x0Str}) + f(${symXStr})}{2} = \\frac{${(Number(fxStr) + Number(symFxStr)).toFixed(2)}}{2} = ${ycStr}`,
        rubric: "得分点：代入具体数值完成闭环验证",
      },
    ];

    const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
      {
        text: "高考中心对称识别大招：若 $f(a+x) + f(b-x) = 2c$ 恒成立，则对称中心必为 $(\\frac{a+b}{2}, c)$！三次函数中心对称点必为其二阶导零点（拐点）。",
        importance: "gaokao",
      },
      {
        text: "奇函数中心对称本质：奇函数 $f(-x) = -f(x)$ 是对称中心在坐标原点 $(0, 0)$ 的中心对称特例。",
        importance: "core",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      reasoningSteps,
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
  const aStr = axisA.toFixed(1).replace(/\.0$/, "");
  const bStr = axisB.toFixed(1).replace(/\.0$/, "");
  const distStr = periodRes.dist.toFixed(1).replace(/\.0$/, "");
  const periodStr = periodRes.period.toFixed(1).replace(/\.0$/, "");

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
      prerequisites: ["$a \\neq b$"],
    },
    {
      name: "周期函数平移不变性",
      latex:
        "f(x + T) = f(x) \\iff \\text{图象按周期 } T \\text{ 沿水平方向无限重复}",
      level: "important",
      prerequisites: ["$T$ 为非零常数"],
    },
  ];

  let reasoningSteps: MathPanelData["reasoningSteps"] = [];
  if (periodModelType === "dual-axis") {
    reasoningSteps = [
      {
        step: 1,
        title: "审题定法 · 双轴对称充要条件代数化",
        detail: `由函数 $f(x)$ 的图象分别关于垂直直线 $x = ${aStr}$ 与 $x = ${bStr}$ 对称，根据轴对称代数充要条件，分别列出两个恒等式。`,
        latex: `\\begin{cases} f(2a - x) = f(x) & \\text{(关于直线 } x = a \\text{ 对称)} \\\\ f(2b - x) = f(x) & \\text{(关于直线 } x = b \\text{ 对称)} \\end{cases}`,
        rubric: "得分点：准确写出两对称轴对应的反射方程",
      },
      {
        step: 2,
        title: "建模联立 · 两次对称自变量代换消元",
        detail: `利用自变量代换技巧，在第二个方程中令自变量 $x \\leftarrow 2a - x$，复合两次反射消去镜像翻转，将其转化为纯水平平移。`,
        latex: `f(x + 2(b - a)) = f(2b - (2a - x)) = f(2a - x) = f(x)`,
        rubric: "得分点：写出自变量代换与消元复合平移过程",
      },
      {
        step: 3,
        title: "代入求解 · 导出最小正周期与规律反思",
        detail: `由 $f(x + 2(b - a)) = f(x)$ 可知，图象具有周期性。代入当前对称轴参数 $a = ${aStr}, b = ${bStr}$，轴间距为 $|a - b| = ${distStr}$，导出最小正周期。`,
        latex: `T = 2|a - b| = 2 \\times |${aStr} - (${bStr})| = ${periodStr}`,
        rubric: "得分点：代入参数求出最小正周期并指出 2 倍间距规律",
      },
    ];
  } else if (periodModelType === "dual-center") {
    reasoningSteps = [
      {
        step: 1,
        title: "审题定法 · 双中心对称充要条件代数化",
        detail: `设函数 $f(x)$ 关于点 $C_1(${aStr}, 0)$ 与 $C_2(${bStr}, 0)$ 均中心对称，列出中心对称代数充要条件方程。`,
        latex: `\\begin{cases} f(2a - x) = -f(x) & \\text{(关于点 } (a, 0) \\text{ 对称)} \\\\ f(2b - x) = -f(x) & \\text{(关于点 } (b, 0) \\text{ 对称)} \\end{cases}`,
        rubric: "得分点：准确写出两个对称中心对应的反射方程",
      },
      {
        step: 2,
        title: "建模联立 · 两次负号反转复合平移消元",
        detail: `在第二个方程中令自变量 $x \\leftarrow 2a - x$。两次中心对称使函数值连续变号两次（$(-1)^2 = 1$），负负得正恢复正号。`,
        latex: `f(x + 2(b - a)) = f(2b - (2a - x)) = -f(2a - x) = -(-f(x)) = f(x)`,
        rubric: "得分点：展示负负得正复合消元推导",
      },
      {
        step: 3,
        title: "代入求解 · 代入参数导出最小正周期",
        detail: `由 $f(x + 2(b - a)) = f(x)$ 知周期存在。代入两中心横坐标参数 $a = ${aStr}, b = ${bStr}$，两中心间距为 $|a - b| = ${distStr}$，导出最小正周期。`,
        latex: `T = 2|a - b| = 2 \\times |${aStr} - (${bStr})| = ${periodStr}`,
        rubric: "得分点：代入具体数值完成周期计算",
      },
    ];
  } else {
    // axis-center
    reasoningSteps = [
      {
        step: 1,
        title: "审题定法 · 轴对称与中心对称联立代数化",
        detail: `函数 $f(x)$ 关于直线 $x = ${aStr}$ 轴对称，且关于点 $C(${bStr}, 0)$ 中心对称，列出已知充要条件方程。`,
        latex: `\\begin{cases} f(2a - x) = f(x) & \\text{(关于轴 } x = a \\text{ 对称)} \\\\ f(2b - x) = -f(x) & \\text{(关于中心 } (b, 0) \\text{ 对称)} \\end{cases}`,
        rubric: "得分点：列出轴对称与中心对称代数方程",
      },
      {
        step: 2,
        title: "建模联立 · 一轴一中心复合得半周期反号",
        detail: `在中心对称方程中将自变量代换为 $x \\leftarrow 2a - x$，得到平移 $2(b - a)$ 后的半周期反号关系。`,
        latex: `f(x + 2(b - a)) = f(2b - (2a - x)) = -f(2a - x) = -f(x)`,
        rubric: "得分点：推导出一轴一中心导致函数值反号的核心方程",
      },
      {
        step: 3,
        title: "求解反思 · 连续四次反射导出四倍间距周期",
        detail: `对反号方程两边再次应用自变量平移 $2(b - a)$，负负得正得 $f(x + 4(b - a)) = f(x)$。代入当前参数 $a = ${aStr}, b = ${bStr}$，得最小正周期。`,
        latex: `f(x + 4(b - a)) = -f(x + 2(b - a)) = f(x) \\implies T = 4|a - b| = ${periodStr}`,
        rubric: "得分点：完成 4 次反射循环证明并代入参数求出周期",
      },
    ];
  }

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "新高考压轴秒杀口诀：双轴/双中心周期为 2 倍间距 ($T = 2|a-b|$)，一轴一中心周期为 4 倍间距 ($T = 4|a-b|$)！",
      importance: "gaokao",
    },
    {
      text: "奇偶性与对称性“知二推一”核心大招：① 偶函数 + 轴 $x=a \\implies T=2|a|$；② 奇函数 + 轴 $x=a \\implies T=4|a|$；③ 奇函数 + 中心 $(a, 0) \\implies T=2|a|$；④ 偶函数 + 中心 $(a, 0) \\implies T=4|a|$。",
      importance: "gaokao",
    },
    {
      text: "抽象周期公式速记：$f(x+a) = -f(x) \\implies T = 2a$；$f(x+a) = \\frac{1}{f(x)} \\implies T = 2a$；$f(x+a) = -\\frac{1}{f(x)} \\implies T = 2a$；$f(x+a) = \\frac{1-f(x)}{1+f(x)} \\implies T = 4a$。",
      importance: "gaokao",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (!periodRes.valid) {
    warnings.push({
      text: "两对称特征横坐标重合 ($a = b$)！两次对称折叠退化为单次对称，无法导出周期。",
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    reasoningSteps,
    warnings,
    mnemonic: "双轴双中心周期两倍距，一轴一中心周期四倍距，和定对称差定周期。",
  };
}
