import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { MATH_COLORS } from "@/theme";
import { checkIntervalAsymptoteFree } from "@/features/trigTangent/math/trigTangent";

export function buildTrigTangentPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as string) || "generalTransform";

  const theta = params.theta ?? Math.PI / 4;
  const A = params.A ?? 1.0;
  const omega = params.omega ?? 1.0;
  const phi = params.phi ?? 0.0;
  const C = params.C ?? 0.0;
  const targetIntervalEnd = params.targetIntervalEnd ?? Math.PI / 3;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (mode === "unitCircle") {
    const thetaDeg = ((theta * 180) / Math.PI).toFixed(1);
    const cosT = Math.cos(theta);
    const tanVal = Math.abs(cosT) > 1e-4 ? Math.tan(theta) : Infinity;

    quantities.push(
      {
        label: "动角 θ (弧度/角度)",
        symbol: "\\theta",
        value: `${theta.toFixed(2)} rad (${thetaDeg}°)`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "正切值 tan θ (线段 AT)",
        symbol: "AT = \\tan\\theta",
        value: Number.isFinite(tanVal) ? tanVal.toFixed(3) : "无意义 (垂直)",
        color: MATH_COLORS.paramSecondary,
        highlight:
          Math.abs(tanVal) > 5
            ? "extreme"
            : tanVal > 0
              ? "positive"
              : tanVal < 0
                ? "negative"
                : "zero",
      },
      {
        label: "切线交点 T 坐标",
        symbol: "T(1, \\tan\\theta)",
        value: Number.isFinite(tanVal)
          ? `(1, ${tanVal.toFixed(3)})`
          : "趋向无穷大",
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "终边所在象限",
        symbol: "\\text{象限}",
        value: (() => {
          const s = Math.sin(theta);
          // 与上方 tanVal 同一阈值：tan 不存在 ⇒ 终边落在 y 轴上，不属于任何象限
          if (!Number.isFinite(tanVal))
            return "无意义 (终边在 y 轴上，tan 不存在)";
          // θ = kπ：终边落在 x 轴上，tan = 0，同样不属于任何象限
          if (Math.abs(s) < 1e-9) return "终边在 x 轴上 (tan = 0)";
          if (cosT > 0)
            return s > 0 ? "第一象限 (tan > 0)" : "第四象限 (tan < 0)";
          return s > 0 ? "第二象限 (反向延长交 T)" : "第三象限 (反向延长交 T)";
        })(),
      },
    );

    theorems.push({
      name: "正切线的几何定义与生成",
      latex:
        "\\tan\\theta = \\frac{y}{x} = \\frac{AT}{OA} = AT \\quad (A(1,0))",
      condition:
        "单位圆 r=1，切线 x=1 与终边（或其反向延长线）交于 T(1, tan θ)",
      note: "当 θ → π/2 或 -π/2 时，终边与直线 x=1 平行无交点，正切值趋于无穷大，对应正切曲线的垂直渐近线。",
      level: "core",
    });
  } else if (mode === "baseFunction") {
    quantities.push(
      {
        label: "解析式",
        symbol: "y = \\tan x",
        value: "f(x) = tan x",
        color: MATH_COLORS.function,
      },
      {
        label: "最小正周期",
        symbol: "T = \\pi",
        value: `π ≈ ${Math.PI.toFixed(4)}`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "定义域",
        symbol: "x \\neq k\\pi + \\frac{\\pi}{2}",
        value: "{x | x ≠ kπ + π/2, k∈Z}",
      },
      {
        label: "单调性",
        symbol: "\\text{单调开区间}",
        value: "在开区间 (kπ - π/2, kπ + π/2) 内单调递增",
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "渐近线集",
        symbol: "x = k\\pi + \\frac{\\pi}{2}",
        value: "..., -π/2, π/2, 3π/2, ...",
        color: MATH_COLORS.asymptote,
      },
      {
        label: "对称中心",
        symbol: "(\\frac{k\\pi}{2}, 0)",
        value: "..., (-π/2,0), (0,0), (π/2,0), ... (无对称轴)",
        color: MATH_COLORS.paramTertiary,
      },
    );

    theorems.push({
      name: "正切函数 y = tan x 基本性质定理",
      latex: "\\tan(x + \\pi) = \\tan x, \\quad \\tan(-x) = -\\tan x",
      condition: "定义域为 {x | x ≠ kπ + π/2, k∈Z}，值域为 R",
      note: "正切函数为周期为 π 的奇函数；图象只有对称中心，绝对没有对称轴！",
      level: "core",
    });
  } else if (mode === "gaokaoProblem") {
    const checkResult = checkIntervalAsymptoteFree(
      0,
      targetIntervalEnd,
      omega,
      0,
    );
    const firstAsymp =
      Math.abs(omega) > 1e-9 ? Math.PI / (2 * Math.abs(omega)) : Infinity;
    const isSafe = !checkResult.hasAsymptote && firstAsymp > targetIntervalEnd;

    quantities.push(
      {
        label: "高考探究函数",
        symbol: "f(x) = \\tan(\\omega x)",
        value: `f(x) = tan(${omega}x)`,
        color: MATH_COLORS.function,
      },
      {
        label: "探究区间",
        symbol: "[0, x_{\\text{end}}]",
        value: `[0, ${targetIntervalEnd.toFixed(3)}] (约 ${(targetIntervalEnd / Math.PI).toFixed(2)}π)`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "第一条正渐近线",
        symbol: "x_0 = \\frac{\\pi}{2\\omega}",
        value: Number.isFinite(firstAsymp)
          ? `x = ${firstAsymp.toFixed(3)}`
          : "不存在",
        color: MATH_COLORS.asymptote,
      },
      {
        label: "区间单调性状态",
        symbol: "\\text{无渐近线判定}",
        value: isSafe
          ? "满足单调递增 (无渐近线落入)"
          : "不满足！(渐近线落入区间)",
        highlight: isSafe ? "positive" : "extreme",
      },
      {
        label: "临界 ω 上限",
        symbol: "\\omega < \\frac{\\pi}{2 x_{\\text{end}}}",
        value: `ω < ${(Math.PI / (2 * targetIntervalEnd)).toFixed(2)}`,
        color: MATH_COLORS.paramSecondary,
      },
    );

    theorems.push({
      name: "新高考题型：正切函数在给定区间单调的充要条件",
      latex:
        "f(x) = \\tan(\\omega x) \\text{ 在 } [0, m] \\text{ 上单调} \\iff \\frac{\\pi}{2\\omega} > m \\iff \\omega < \\frac{\\pi}{2m}",
      condition: "ω > 0, 区间内严禁穿过任何垂直渐近线",
      note: "真题热点：若区间包含渐近线，则函数在区间上不连续，绝不可断言单调！",
      level: "core",
    });
  } else {
    // generalTransform
    const period =
      Math.abs(omega) > 1e-9 ? Math.PI / Math.abs(omega) : Infinity;
    const isIncreasing = A * omega > 0;
    const phiLatex =
      phi >= 0 ? `+ ${phi.toFixed(2)}` : `- ${Math.abs(phi).toFixed(2)}`;
    const cLatex = C >= 0 ? `+ ${C}` : `- ${Math.abs(C)}`;

    quantities.push(
      {
        label: "一般型解析式",
        symbol: "f(x)",
        value: `y = ${A}\\tan\\left(${omega}x ${phiLatex}\\right) ${cLatex}`,
        color: MATH_COLORS.function,
      },
      {
        label: "最小正周期",
        symbol: "T",
        value: Number.isFinite(period)
          ? `${period.toFixed(3)} \\; (\\Delta x = T)`
          : "不存在",
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "单调性判定",
        symbol: isIncreasing ? "\\text{单调增}" : "\\text{单调减}",
        value: isIncreasing
          ? "在各开区间内单调递增 (A·ω > 0)"
          : "在各开区间内单调递减 (A·ω < 0)",
        color: isIncreasing
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.paramPrimary,
      },
      {
        label: "渐近线方程",
        symbol: "x_{\\text{渐}}",
        value: `x = \\frac{k\\pi + \\frac{\\pi}{2} - (${phi.toFixed(2)})}{${omega}}`,
        color: MATH_COLORS.asymptote,
      },
      {
        label: "图象对称中心",
        symbol: "P_0",
        value: `\\left(\\frac{\\frac{k\\pi}{2} - (${phi.toFixed(2)})}{${omega}},\\; ${C}\\right) \\quad (k\\in\\mathbb{Z})`,
        color: MATH_COLORS.paramTertiary,
      },
    );

    theorems.push({
      name: "正切函数 y = A tan(ωx + φ) + C 的性质公式",
      latex:
        "T = \\frac{\\pi}{|\\omega|}, \\quad \\text{渐近线: } \\omega x + \\varphi = k\\pi + \\frac{\\pi}{2}",
      condition: "A ≠ 0, ω ≠ 0, k ∈ Z",
      note: isIncreasing
        ? "当前 A·ω > 0，函数在各开区间 (kπ - π/2 - φ)/ω < x < (kπ + π/2 - φ)/ω 内单调递增。"
        : "注意！当前 A·ω < 0，图象发生翻转，在各开区间内单调递减！",
      level: "core",
    });
  }

  // 高考考点总结（新高考精编）
  gaokaoPoints.push(
    {
      text: "考点1【渐近线与定义域】：解方程 ωx + φ = kπ + π/2，相邻两渐近线距离恰为一个周期 T = π/|ω|（非 T/2）！",
      importance: "gaokao",
    },
    {
      text: "考点2【单调区间陷阱】：正切函数单调区间必为开区间，且绝不能用并集符号 '∪' 连结两个开区间！",
      importance: "gaokao",
    },
    {
      text: "考点3【对称性核心】：正切函数只有对称中心 (kπ/2ω - φ/ω, C)，没有对称轴（切勿与正弦/余弦混淆）！",
      importance: "gaokao",
    },
    {
      text: "考点4【ω 范围热点大题】：给定区间 [a, b] 单调，则该区间必须完全落在某单一无渐近线开区间内。",
      importance: "hard",
    },
  );

  // 警示提示
  if (Math.abs(omega) < 1e-9) {
    warnings.push({
      text: "退化警示：周期因子 ω = 0，正切函数退化为常数直线 y = C，失去周期性与渐近线！",
      level: "danger",
    });
  }
  if (Math.abs(A) < 1e-9) {
    warnings.push({
      text: "退化警示：振幅因子 A = 0，函数退化为水平直线 y = C！",
      level: "warning",
    });
  }

  // 推导链（P1-18）：① 符号表达式 → ② 代入解析式 → ③ 结果
  // 各分支所需的中间量在此按顶部原始参数重算，避免依赖分支块作用域。
  const reasoningSteps: ReasoningStep[] = [];

  if (mode === "unitCircle") {
    const tanV = Math.abs(Math.cos(theta)) > 1e-4 ? Math.tan(theta) : Infinity;
    reasoningSteps.push(
      {
        step: 1,
        title: "定义入手 · 正切线的生成",
        detail:
          "在单位圆上过 $A(1,0)$ 作切线 $x=1$，与角 $\\theta$ 的终边（或其反向延长线）交于 $T$，则正切值即为有向线段 $AT$。",
        latex:
          "\\tan\\theta = \\frac{y}{x} = \\frac{AT}{OA} = AT \\quad (OA = 1)",
        rubric: "采分点：由正切线几何定义表示 tanθ（2分）",
      },
      {
        step: 2,
        title: "代入角度 · 求交点 T",
        detail: `代入 $\\theta = ${theta.toFixed(2)}$ rad（即 $${((theta * 180) / Math.PI).toFixed(1)}^\\circ$），与切线 $x=1$ 求交。`,
        latex: `T(1, \\tan\\theta) = (1, ${Number.isFinite(tanV) ? tanV.toFixed(3) : "\\to \\infty"})`,
        rubric: "采分点：代入角度求交点 T（2分）",
      },
      {
        step: 3,
        title: "读数与象限判定",
        detail: Number.isFinite(tanV)
          ? `正切值 $\\tan\\theta = ${tanV.toFixed(3)}$，$AT$ ${tanV > 0 ? "取正值（终边在一、三象限）" : tanV < 0 ? "取负值（终边在二、四象限）" : "为零（终边落在 x 轴上）"}。`
          : "终边与切线 $x=1$ 平行，无交点，$\\tan\\theta$ 不存在，对应正切曲线的垂直渐近线。",
        latex: `AT = \\tan\\theta = ${Number.isFinite(tanV) ? tanV.toFixed(3) : "\\text{不存在}"}`,
        rubric: "采分点：读出有向线段 AT 的正负与大小（1分）",
      },
    );
  } else if (mode === "baseFunction") {
    reasoningSteps.push(
      {
        step: 1,
        title: "从正切线看周期与奇偶性",
        detail:
          "终边每旋转 $\\pi$ 正切线重合，故正切函数周期为 $\\pi$；又 $\\tan(-x) = -\\tan x$，为奇函数。",
        latex: "\\tan(x + \\pi) = \\tan x, \\quad \\tan(-x) = -\\tan x",
        rubric: "采分点：写出周期与奇偶性（2分）",
      },
      {
        step: 2,
        title: "定义域 · 渐近线集",
        detail:
          "当 $x = k\\pi + \\dfrac{\\pi}{2}$ 时终边与切线 $x=1$ 平行，$\\tan x$ 无定义，此即垂直渐近线。",
        latex:
          "x \\neq k\\pi + \\frac{\\pi}{2}, \\quad x = k\\pi + \\frac{\\pi}{2} \\text{ 为渐近线}",
        rubric: "采分点：写出定义域与渐近线（2分）",
      },
      {
        step: 3,
        title: "单调性与对称中心",
        detail:
          "在每个开区间 $(k\\pi - \\dfrac{\\pi}{2},\\; k\\pi + \\dfrac{\\pi}{2})$ 内单调递增；图象关于点 $(\\dfrac{k\\pi}{2}, 0)$ 中心对称，无对称轴。",
        latex: "T = \\pi, \\quad \\text{对称中心 } (\\tfrac{k\\pi}{2}, 0)",
        rubric: "采分点：说明单调区间为开区间且只有对称中心（2分）",
      },
    );
  } else if (mode === "gaokaoProblem") {
    const firstA =
      Math.abs(omega) > 1e-9 ? Math.PI / (2 * Math.abs(omega)) : Infinity;
    reasoningSteps.push(
      {
        step: 1,
        title: "建模 · 单调的充要条件",
        detail:
          "区间 $[0, m]$ 上单调，必须整段落在同一条无渐近线的开区间内，即第一条正渐近线须落在 $m$ 的右侧。",
        latex:
          "f(x) = \\tan(\\omega x) \\text{ 在 } [0, m] \\text{ 上单调} \\iff \\frac{\\pi}{2\\omega} > m",
        rubric: "采分点：写出单调充要条件（2分）",
      },
      {
        step: 2,
        title: "代入参数 · 定位渐近线",
        detail: `代入 $\\omega = ${omega}$、区间右端 $m = ${targetIntervalEnd.toFixed(3)}$（约 $${(targetIntervalEnd / Math.PI).toFixed(2)}\\pi$），第一条正渐近线落在 $x_0 = ${Number.isFinite(firstA) ? firstA.toFixed(3) : "不存在"}$。`,
        latex: `\\omega = ${omega}, \\quad m = ${targetIntervalEnd.toFixed(3)}`,
        rubric: "采分点：代入参数计算渐近线位置（2分）",
      },
      {
        step: 3,
        title: "解出 ω 上限并判定",
        detail: `由 $\\omega < \\dfrac{\\pi}{2m} = ${(Math.PI / (2 * targetIntervalEnd)).toFixed(2)}$ 判定：当前${Number.isFinite(firstA) && firstA > targetIntervalEnd ? "渐近线位于区间外侧，函数在 [0, m] 上单调" : "渐近线落入区间内部，函数在 [0, m] 上不单调"}。`,
        latex: `\\omega < \\frac{\\pi}{2 \\times ${targetIntervalEnd.toFixed(3)}} = ${(Math.PI / (2 * targetIntervalEnd)).toFixed(2)}`,
        rubric: "采分点：解出 ω 的取值范围（2分）",
      },
    );
  } else {
    const per = Math.abs(omega) > 1e-9 ? Math.PI / Math.abs(omega) : Infinity;
    reasoningSteps.push(
      {
        step: 1,
        title: "周期公式 · 由渐近线间距得",
        detail: "相邻两条垂直渐近线的间距恰好等于一个周期，由此得周期公式。",
        latex: "T = \\frac{\\pi}{|\\omega|}",
        rubric: "采分点：写出周期公式（2分）",
      },
      {
        step: 2,
        title: "代入参数 · 定单调方向",
        detail: `代入 $\\omega = ${omega}$、$A = ${A}$，得 $T = ${Number.isFinite(per) ? per.toFixed(3) : "不存在"}$；因 $A\\omega ${A * omega > 0 ? ">" : "<"} 0$，函数在各开区间内单调${A * omega > 0 ? "递增" : "递减"}。`,
        latex: `T = \\frac{\\pi}{|${omega}|} = ${Number.isFinite(per) ? per.toFixed(3) : "\\text{不存在}"}`,
        rubric: "采分点：代入参数求周期（2分）",
      },
      {
        step: 3,
        title: "渐近线与对称中心",
        detail: `解 $\\omega x + \\varphi = k\\pi + \\dfrac{\\pi}{2}$ 得渐近线族 $x = \\dfrac{k\\pi + \\frac{\\pi}{2} - (${phi.toFixed(2)})}{${omega}}$；对称中心为 $\\left(\\dfrac{\\frac{k\\pi}{2} - (${phi.toFixed(2)})}{${omega}},\\; ${C}\\right)$。`,
        latex: "\\omega x + \\varphi = k\\pi + \\frac{\\pi}{2}",
        rubric: "采分点：写出渐近线族与对称中心（2分）",
      },
    );
  }

  const mnemonic =
    "正切口诀：渐近线找π/2加kπ，单调递增开区间；周期是π除以ω，奇函数无对称轴！";

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic,
  };
}
