import type { MathPanelData } from "../types";
import {
  solveExpTangent,
  solveLogTangent,
  solveParamExpAx1,
  solveParamExpAx,
  type TranscendentalMode,
} from "@/math/transcendental";
import { MATH_COLORS } from "@/theme";

export function buildTranscendentalPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = ((config?.mode as string) || "exp") as TranscendentalMode;
  const x0 = params.x0 ?? 0;
  const a = params.a ?? 1.0;

  const quantities: MathPanelData["quantities"] = [];
  const warnings: MathPanelData["warnings"] = [];

  if (mode === "exp") {
    const resExp = solveExpTangent(x0);
    quantities.push(
      {
        label: "切点横坐标",
        symbol: "x₀",
        value: x0.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "切点纵坐标",
        symbol: "e^{x₀}",
        value: resExp.y0.toFixed(3),
        color: MATH_COLORS.function,
      },
      {
        label: "切线斜率",
        symbol: "f'(x₀)",
        value: resExp.slope.toFixed(3),
        color: MATH_COLORS.tangentLine,
      },
      {
        label: "基准下界差值 (x=0)",
        symbol: "e⁰ - (0+1)",
        value: "0.000",
        color: MATH_COLORS.labelText,
      },
    );
  } else if (mode === "log") {
    const resLog = solveLogTangent(x0);
    if (!resLog.isValid) {
      warnings.push({
        text: "对数函数定义域必须满足 x₀ > 0，当前切点无效！",
        level: "danger",
      });
    }
    quantities.push(
      {
        label: "切点横坐标",
        symbol: "x₀",
        value: x0.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "切点纵坐标",
        symbol: "ln(x₀)",
        value: resLog.isValid ? resLog.y0.toFixed(3) : "无定义",
        color: MATH_COLORS.function,
      },
      {
        label: "切线斜率",
        symbol: "g'(x₀)",
        value: resLog.isValid ? resLog.slope.toFixed(3) : "无定义",
        color: MATH_COLORS.tangentLine,
      },
      {
        label: "基准上界差值 (x=1)",
        symbol: "(1-1) - ln 1",
        value: "0.000",
        color: MATH_COLORS.labelText,
      },
    );
  } else if (mode === "chain") {
    quantities.push(
      {
        label: "基准中轴切线",
        symbol: "y",
        value: "x",
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "指数上界",
        symbol: "e^{x-1}",
        value: Math.exp(x0 - 1).toFixed(3),
        color: MATH_COLORS.function,
      },
      {
        label: "对数下界",
        symbol: "ln x + 1",
        value: x0 > 0 ? (Math.log(x0) + 1).toFixed(3) : "无定义",
        color: MATH_COLORS.functionTransformed,
      },
    );
  } else if (mode === "param") {
    const subMode = (config?.subMode as string) || "exp_ax_1";
    const resAx1 = solveParamExpAx1(a);
    const resAx = solveParamExpAx(a);
    const activeRes = subMode === "exp_ax" ? resAx : resAx1;

    quantities.push(
      {
        label: "待定参数 a",
        symbol: "a",
        value: a.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label:
          subMode === "exp_ax"
            ? "e^x ≥ ax 过原点临界"
            : "e^x ≥ ax + 1 切线临界",
        symbol: "a_{临界}",
        value: subMode === "exp_ax" ? Math.E.toFixed(2) : "1.00",
        color: MATH_COLORS.tangentLine,
      },
      {
        label: "与 e^x 交点个数",
        symbol: "N",
        value: `${activeRes.intersections} 个`,
        color:
          activeRes.status === "tangent"
            ? MATH_COLORS.paramPrimary
            : MATH_COLORS.labelText,
      },
    );

    if (a > 1.0) {
      warnings.push({
        text: `当前参数 a = ${a.toFixed(2)} > 1，直线与 e^x 出现 2 个交点，e^x ≥ ax + 1 不恒成立！`,
        level: "warning",
      });
    }
  }

  const theorems: MathPanelData["theorems"] = [
    {
      name: "指数基准切线放缩不等式",
      latex: "e^x \\ge x + 1 \\quad (x \\in \\mathbb{R})",
      level: "core",
      prerequisites: ["f(x) = e^x 是下凸函数", "等号仅在 x = 0 时成立"],
    },
    {
      name: "对数基准切线放缩不等式",
      latex: "\\ln x \\le x - 1 \\quad (x > 0)",
      level: "core",
      prerequisites: ["g(x) = \\ln x 是上凸函数", "等号仅在 x = 1 时成立"],
    },
    {
      name: "双基准对偶链式夹逼不等式",
      latex: "\\ln x + 1 \\le x \\le e^{x-1} \\quad (x > 0)",
      level: "important",
      prerequisites: [
        "e^{x-1} 与 \\ln x + 1 互为反函数",
        "三者关于 y = x 对称",
      ],
    },
    {
      name: "切线临界求参定理",
      latex:
        "e^x \\ge \\color{#EF4444}{a} x + 1 \\iff \\color{#EF4444}{a} \\le 1",
      level: "important",
      prerequisites: [
        "当 a = 1 时直线与曲线在 (0,1) 相切",
        "a > 1 时产生第二个交点",
      ],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "高考核心原理：基准切线放缩来自于超越函数在基准点（如 x=0 或 x=1）处的泰勒展开一阶切线近似。",
      importance: "gaokao",
    },
    {
      text: '凹凸性保障：下凸函数 (f"(x)>0) 曲线永远在任意切线上方；上凸函数 (g"(x)<0) 曲线永远在切线下方。',
      importance: "core",
    },
    {
      text: "压轴大题解题套路：当题目中同时出现指数 e^x 与对数 ln x 混合项时，优先考虑利用 x 或 x-1 作为“中间桥梁”进行切线双向放缩！",
      importance: "hard",
    },
    {
      text: "端点效应与相切临界：求解 e^x ≥ ax+1 或 a lnx ≤ x-1 恒成立问题时，“相切”往往对应参数的极值边界（临界点）。",
      importance: "gaokao",
    },
  ];

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "指数切线 x 加一，对数切线 x 减一；凹凸决定上与下，相切即是临界点。",
  };
}
