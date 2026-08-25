import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  calculateSumDiff,
  calculateDoubleAngle,
  calculateAuxiliary,
  type SumDiffFormulaKey,
  type DoubleAngleFormulaKey,
  type StudyMode,
} from "@/features/trigFormulas/math/trigFormulas";

export function buildTrigFormulasPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const alphaDeg = params.alphaDeg ?? 45;
  const betaDeg = params.betaDeg ?? 30;
  const coeffA = params.coeffA ?? 1.0;
  const coeffB = params.coeffB ?? 1.73;

  const studyMode = (config?.studyMode as StudyMode) ?? "sum_diff";
  const sumDiffKey = (config?.sumDiffKey as SumDiffFormulaKey) ?? "cos_minus";
  const doubleAngleKey =
    (config?.doubleAngleKey as DoubleAngleFormulaKey) ?? "sin_2a";

  if (studyMode === "sum_diff") {
    const res = calculateSumDiff(alphaDeg, betaDeg, sumDiffKey);
    const quantities: MathQuantity[] = [
      {
        label: "主控动角 α 角度",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "次要动角 β 角度",
        symbol: "\\beta",
        value: `${betaDeg}°`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "运算目标角",
        symbol: "\\theta",
        value: `${res.targetAngleDeg.toFixed(1)}°`,
        color: MATH_COLORS.primary,
      },
      {
        label: "向量 OA 与 OB 点积",
        symbol: "\\vec{u} \\cdot \\vec{v} = \\cos(\\alpha-\\beta)",
        value: res.dotProduct.toFixed(3),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "弦长 AB 距离",
        symbol: "|AB| = \\sqrt{2-2\\cos(\\alpha-\\beta)}",
        value: res.chordLength.toFixed(3),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "公式展开计算值",
        symbol: res.formulaTitle,
        value: res.isTanDefined ? res.resultVal.toFixed(3) : "无意义",
        color: MATH_COLORS.primary,
        highlight: !res.isTanDefined ? "extreme" : undefined,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "两角和与差的三角公式",
        latex: res.formulaLatex,
        condition: "\\alpha, \\beta \\in \\mathbb{R}",
        note: "几何本质：单位圆上向量数量积 $\\vec{u}\\cdot\\vec{v} = x_1 x_2 + y_1 y_2 = \\cos(\\alpha-\\beta)$，奠定整个高中三角恒等变换的基石。",
        level: "core",
      },
      {
        name: "两角和差正切公式及变形",
        latex:
          "\\tan(\\alpha \\pm \\beta) = \\frac{\\tan\\alpha \\pm \\tan\\beta}{1 \\mp \\tan\\alpha\\tan\\beta} \\iff \\tan\\alpha \\pm \\tan\\beta = \\tan(\\alpha\\pm\\beta)(1 \\mp \\tan\\alpha\\tan\\beta)",
        condition:
          "\\alpha, \\beta, \\alpha\\pm\\beta \\neq k\\pi + \\frac{\\pi}{2}",
        note: "高考秒杀技巧：当 $\\alpha+\\beta=\\frac{\\pi}{4}$ 时，必有 $(1+\\tan\\alpha)(1+\\tan\\beta) = 2$；当 $\\alpha+\\beta=\\frac{3\\pi}{4}$ 时，$(1-\\tan\\alpha)(1-\\tan\\beta) = 2$。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考变角核心决策树：已知和角与单角，求未知角时优先采用'拼角拆角'技巧：\\alpha = (\\alpha+\\beta) - \\beta，2\\alpha = (\\alpha+\\beta) + (\\alpha-\\beta)",
        importance: "gaokao",
      },
      {
        text: "给值求角防坑指南：先求出目标角的某三角函数值（通常优先求 cos，因 [0, π] 单调唯一），再结合已知角的范围精确收缩区间，严禁增解或漏解",
        importance: "gaokao",
      },
      {
        text: "解三角形边角互化：一次齐次式优先角化边或边化角，运用两角和差公式展开消除复杂角",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (!res.isTanDefined) {
      warnings.push({
        text: "正切无意义警告：分母 1 ∓ tan α tan β = 0 或某个角的终边落在 y 轴上（tan 无意义）！",
        level: "danger",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        "两角和差口诀：正余余正符号同（sin），余余正正符号反（cos），切式分子符号同、分母符号反！",
    };
  } else if (studyMode === "double_angle") {
    const res = calculateDoubleAngle(alphaDeg, doubleAngleKey);
    const quantities: MathQuantity[] = [
      {
        label: "单角 α 角度",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "倍角 2α 角度",
        symbol: "2\\alpha",
        value: `${(((alphaDeg * 2) % 360) + 360) % 360}°`,
        color: MATH_COLORS.primary,
      },
      {
        label: "sin 2α 二倍角值",
        symbol: "\\sin 2\\alpha",
        value: res.sin2Alpha.toFixed(3),
        color: MATH_COLORS.primary,
      },
      {
        label: "cos 2α 二倍角值",
        symbol: "\\cos 2\\alpha",
        value: res.cos2Alpha.toFixed(3),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "降幂后周期 T",
        symbol: "T = \\frac{2\\pi}{2}",
        value: "\\pi \\approx 3.142",
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "降幂后平衡中轴",
        symbol: "y_0",
        value: "y = 0.5",
        color: MATH_COLORS.paramTertiary,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "二倍角公式（三大变式）",
        latex:
          "\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha, \\quad \\cos 2\\alpha = \\cos^2\\alpha - \\sin^2\\alpha = 2\\cos^2\\alpha - 1 = 1 - 2\\sin^2\\alpha",
        condition: "\\alpha \\in \\mathbb{R}",
        note: "在两角和公式中令 $\\beta = \\alpha$ 即可导出。$\\cos 2\\alpha$ 的三种变形是升降幂与代数消元的神器。",
        level: "core",
      },
      {
        name: "升降幂公式（降次升角）",
        latex:
          "\\sin^2\\alpha = \\frac{1-\\cos 2\\alpha}{2}, \\quad \\cos^2\\alpha = \\frac{1+\\cos 2\\alpha}{2}, \\quad 1+\\cos 2\\alpha = 2\\cos^2\\alpha, \\quad 1-\\cos 2\\alpha = 2\\sin^2\\alpha",
        condition: "用于将二次项降为一次项（周期减半），或开方去根号时升幂化简",
        note: "降幂口诀：二次降一次，次数降一半，角度翻一番；开方去根号，加余升余平方消！",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考解答题起手式：对于形如 f(x) = a sin²x + b sin x cos x + c cos²x 的二次齐次式，先用降幂公式与倍角正弦化为 A sin 2x + B cos 2x + C，再用辅助角公式化为 Asin(2x+φ)+C",
        importance: "gaokao",
      },
      {
        text: "弦切互化技巧（齐次分式）：sin 2α = 2tan α / (1+tan²α)，cos 2α = (1-tan²α) / (1+tan²α)，已知 tan α 时可秒杀一切关于 α 的二次齐次式",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (!res.isTanDefined) {
      warnings.push({
        text: "二倍角正切无意义：cos 2α = 0（即 2α = 90° + k·180°），tan 2α 不存在！",
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        "倍角降幂口诀：二次降一次，次数降一半，角度翻一番；开方去根号，加余升余平方消！",
    };
  } else {
    // auxiliary 模式
    const res = calculateAuxiliary(coeffA, coeffB);
    const quantities: MathQuantity[] = [
      {
        label: "正弦系数 a",
        symbol: "a",
        value: `${coeffA}`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "余弦系数 b",
        symbol: "b",
        value: `${coeffB}`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "合成振幅 A (模长)",
        symbol: "A = \\sqrt{a^2+b^2}",
        value: res.amplitude.toFixed(3),
        color: MATH_COLORS.primary,
        highlight: res.isDegenerate ? "extreme" : undefined,
      },
      {
        label: "点 (a, b) 所在象限",
        symbol: "\\text{Quadrant}",
        value: res.quadrantStr,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "辅助角 φ 角度",
        symbol: "\\varphi",
        value: `${res.phiDeg.toFixed(1)}°`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "波峰最大值点 x 坐标",
        symbol: "x_{max}",
        value: `${(res.maxPointX * (180 / Math.PI)).toFixed(1)}°`,
        color: MATH_COLORS.primary,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "辅助角公式 (Asin(ωx+φ) 终极化简)",
        latex: "a\\sin x + b\\cos x = \\sqrt{a^2+b^2}\\sin(x+\\varphi)",
        condition:
          "a^2 + b^2 \\neq 0, \\quad \\cos\\varphi = \\frac{a}{\\sqrt{a^2+b^2}}, \\quad \\sin\\varphi = \\frac{b}{\\sqrt{a^2+b^2}}",
        note: "数形结合本质：直角坐标系中向量 $(a, b)$ 的模长即为振幅 $A$，极角即为初相 $\\varphi$。两个同频波叠加仍为同频正弦波！",
        level: "core",
      },
      {
        name: "辅助角函数的最值、周期与对称轴",
        latex:
          "y_{max} = \\sqrt{a^2+b^2}, \\quad y_{min} = -\\sqrt{a^2+b^2}, \\quad T = 2\\pi, \\quad x_{sym} = k\\pi + \\frac{\\pi}{2} - \\varphi",
        condition: "x \\in \\mathbb{R}",
        note: "高考结合区间限定求最值时，注意将 $x \\in [m, n]$ 转化为整体角 $x+\\varphi \\in [m+\\varphi, n+\\varphi]$。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考第 1 大题必考：将复杂三角函数解析式化简为 y = A sin(ωx+φ)+C，随后求周期 T、单调递增/递减区间、对称轴方程及最值",
        importance: "gaokao",
      },
      {
        text: "辅助角象限定理（极高频失分点）：tan φ = b/a，但 φ 的象限由点 (a, b) 所在象限唯一确定！如 a=-1, b=√3 时点在第二象限，φ = 120°，切勿误当成 -60°",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (res.isDegenerate) {
      warnings.push({
        text: "退化警告：a = 0 且 b = 0，合成波形退化为恒等于 0 的直线，无振幅与周期！",
        level: "danger",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        "辅助角化简口诀：提模长 sqrt(a²+b²)，余弦填a正弦填b，点(a,b)象限定初相！",
    };
  }
}
