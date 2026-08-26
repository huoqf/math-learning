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
    const isShift = (config?.subMode as string) === "shift_1";
    const resExp = solveExpTangent(x0);
    const shiftY0 = Math.exp(x0 - 1);

    quantities.push(
      {
        label: "切点横坐标",
        symbol: "x₀",
        value: x0.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: isShift ? "平移曲线值" : "切点纵坐标",
        symbol: isShift ? "e^{x₀-1}" : "e^{x₀}",
        value: isShift ? shiftY0.toFixed(3) : resExp.y0.toFixed(3),
        color: MATH_COLORS.function,
      },
      {
        label: "切线斜率",
        symbol: "f'(x₀)",
        value: isShift ? shiftY0.toFixed(3) : resExp.slope.toFixed(3),
        color: MATH_COLORS.tangentLine,
      },
      {
        label: isShift ? "平移放缩差值" : "基准下界差值",
        symbol: isShift ? "e^{x₀-1} - x₀" : "e^{x₀} - (x₀ + 1)",
        value: isShift
          ? (shiftY0 - x0).toFixed(3)
          : (resExp.y0 - (x0 + 1)).toFixed(3),
        color: MATH_COLORS.labelText,
      },
    );
  } else if (mode === "log") {
    const isQuad = (config?.subMode as string) === "quadratic_bound";
    const resLog = solveLogTangent(x0);
    if (!resLog.isValid) {
      warnings.push({
        text: "对数函数定义域必须满足 x₀ > 0，当前切点无效！",
        level: "danger",
      });
    }

    const quadBound = 0.5 * (x0 * x0 - 1);
    quantities.push(
      {
        label: "切点横坐标",
        symbol: "x₀",
        value: x0.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "对数函数值",
        symbol: "\\ln(x₀)",
        value: resLog.isValid ? resLog.y0.toFixed(3) : "无定义",
        color: MATH_COLORS.function,
      },
      {
        label: isQuad ? "二次放缩上界" : "线性切线上界",
        symbol: isQuad ? "\\frac{x₀^2 - 1}{2}" : "x₀ - 1",
        value: resLog.isValid
          ? isQuad
            ? quadBound.toFixed(3)
            : (x0 - 1).toFixed(3)
          : "无定义",
        color: isQuad
          ? MATH_COLORS.functionTransformed
          : MATH_COLORS.paramSecondary,
      },
      {
        label: isQuad ? "二次逼近差值" : "线性放缩差值",
        symbol: isQuad ? "\\frac{x₀^2-1}{2} - \\ln x₀" : "(x₀ - 1) - \\ln x₀",
        value: resLog.isValid
          ? isQuad
            ? (quadBound - resLog.y0).toFixed(3)
            : (x0 - 1 - resLog.y0).toFixed(3)
          : "无定义",
        color: MATH_COLORS.labelText,
      },
    );
  } else if (mode === "chain") {
    const validChainX = x0 > 0 ? x0 : 1.0;
    const expVal = Math.exp(validChainX - 1);
    const logVal = Math.log(validChainX) + 1;
    quantities.push(
      {
        label: "自变量位置",
        symbol: "x",
        value: validChainX.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "指数上界",
        symbol: "e^{x-1}",
        value: expVal.toFixed(3),
        color: MATH_COLORS.function,
      },
      {
        label: "中轴基准切线",
        symbol: "y = x",
        value: validChainX.toFixed(3),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "对数下界",
        symbol: "\\ln x + 1",
        value: logVal.toFixed(3),
        color: MATH_COLORS.functionTransformed,
      },
      {
        label: "夹逼包络跨度",
        symbol: "e^{x-1} - (\\ln x + 1)",
        value: (expVal - logVal).toFixed(3),
        color: MATH_COLORS.labelText,
      },
    );
  } else if (mode === "param") {
    const subMode = (config?.subMode as string) || "exp_ax_1";
    const resAx1 = solveParamExpAx1(a);
    const resAx = solveParamExpAx(a);
    const isOverOrigin = subMode === "exp_ax";
    const activeRes = isOverOrigin ? resAx : resAx1;

    quantities.push(
      {
        label: "待定参数 a",
        symbol: "a",
        value: a.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: isOverOrigin ? "e^x ≥ ax 过原点临界" : "e^x ≥ ax + 1 切线临界",
        symbol: "a_{临界}",
        value: isOverOrigin ? Math.E.toFixed(2) : "1.00",
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

    if (isOverOrigin) {
      if (a > Math.E + 0.01) {
        warnings.push({
          text: `当前参数 a = ${a.toFixed(2)} > e ≈ 2.72，直线与 e^x 出现 2 个交点，e^x ≥ ax 不恒成立！`,
          level: "warning",
        });
      }
    } else {
      if (a > 1.0) {
        warnings.push({
          text: `当前参数 a = ${a.toFixed(2)} > 1.00，直线与 e^x 出现 2 个交点，e^x ≥ ax + 1 不恒成立！`,
          level: "warning",
        });
      }
    }
  }

  const isShift = (config?.subMode as string) === "shift_1";
  const isQuad = (config?.subMode as string) === "quadratic_bound";
  const pColor = MATH_COLORS.paramPrimary;

  const rawTheorems: (MathPanelData["theorems"][number] & {
    id: TranscendentalMode;
  })[] = [
    {
      id: "exp",
      name: isShift ? "指数平移切线放缩不等式" : "指数基准切线放缩不等式",
      latex: isShift
        ? `e^{x-1} \\ge x \\quad (x \\in \\mathbb{R})`
        : `e^x \\ge x + 1 \\quad (x \\in \\mathbb{R})`,
      level: mode === "exp" ? "core" : "important",
      prerequisites: isShift
        ? [
            "f(x) = e^{x-1} 为下凸函数",
            "在切点 (1, 1) 处公切线为 y = x",
            "等号当且仅当 x = 1 时成立",
          ]
        : [
            "f(x) = e^x 为下凸函数",
            "在切点 (0, 1) 处切线为 y = x + 1",
            "等号当且仅当 x = 0 时成立",
          ],
    },
    {
      id: "log",
      name: isQuad ? "对数二次上界放缩不等式" : "对数基准切线放缩不等式",
      latex: isQuad
        ? `\\ln x \\le \\frac{x^2 - 1}{2} \\le x - 1 \\quad (x > 0)`
        : `\\ln x \\le x - 1 \\quad (x > 0)`,
      level: mode === "log" ? "core" : "important",
      prerequisites: isQuad
        ? [
            "利用切线进一步构造二次抛物线上界",
            "在 x > 1 时比线性切线更贴合对数曲线",
            "等号当且仅当 x = 1 时成立",
          ]
        : [
            "g(x) = \\ln x 为上凸函数",
            "在切点 (1, 0) 处切线为 y = x - 1",
            "等号当且仅当 x = 1 时成立",
          ],
    },
    {
      id: "chain",
      name: "双基准对偶链式夹逼不等式",
      latex: `\\ln x + 1 \\le x \\le e^{x-1} \\quad (x > 0)`,
      level: mode === "chain" ? "core" : "important",
      prerequisites: [
        "e^{x-1} 与 \\ln x + 1 互为反函数",
        "在公共切点 (1, 1) 处公切线为 y = x",
        "等号当且仅当 x = 1 时三者取等",
      ],
    },
    {
      id: "param",
      name: "切线临界求参定理",
      latex: `e^x \\ge \\color{${pColor}}{a} x + 1 \\iff \\color{${pColor}}{a} \\le 1 \\quad (e^x \\ge \\color{${pColor}}{a} x \\iff \\color{${pColor}}{a} \\le e)`,
      level: mode === "param" ? "core" : "important",
      prerequisites: [
        "定点模型在 (0, 1) 处相切临界 a = 1",
        "过原点模型在 (1, e) 处相切临界 a = e",
        "斜率超过临界值产生双交点破坏恒成立",
      ],
    },
  ];

  // 动态将当前模式的核心定理置顶
  const theorems = [
    ...rawTheorems.filter((t) => t.id === mode),
    ...rawTheorems.filter((t) => t.id !== mode),
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "【新高考通法·切线放缩与端点效应 4 步法】①确定边界临界点（通常为 x=0 或 x=1）；②求出超越函数在临界点处的切线方程（如 y = x + 1 或 y = x - 1）；③构建差值辅助函数 h(x) = f(x) - g(x) 并证明单调性与凹凸性；④利用切线作桥梁实现双向不等式夹逼。",
      importance: "gaokao",
    },
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
