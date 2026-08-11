import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
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
        label: "角 α 角度",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: "#EF4444",
      },
      {
        label: "角 β 角度",
        symbol: "\\beta",
        value: `${betaDeg}°`,
        color: "#D97706",
      },
      {
        label: "目标角",
        symbol: "\\theta",
        value: `${res.targetAngleDeg.toFixed(1)}°`,
        color: "#2563EB",
      },
      {
        label: "sin与cos值",
        symbol: "\\sin\\alpha, \\cos\\alpha",
        value: `sin=${res.sinAlpha.toFixed(3)}, cos=${res.cosAlpha.toFixed(3)}`,
        color: "#EF4444",
      },
      {
        label: "向量点积 (cos(α-β))",
        symbol: "\\vec{u} \\cdot \\vec{v}",
        value: res.dotProduct.toFixed(3),
        color: "#059669",
      },
      {
        label: "公式展开计算值",
        symbol: res.formulaTitle,
        value: res.isTanDefined ? res.resultVal.toFixed(3) : "无意义",
        color: "#2563EB",
        highlight: !res.isTanDefined ? "extreme" : undefined,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "两角和与差的三角公式",
        latex: res.formulaLatex,
        condition: "$\\text{任意实数角 } \\alpha, \\beta \\in \\mathbb{R}$",
        note: "几何推导：单位圆上向量 $u=(\\cos\\alpha,\\sin\\alpha)$ 与 $v=(\\cos\\beta,\\sin\\beta)$ 的数量积即为 $\\cos(\\alpha-\\beta)$。",
        level: "core",
      },
      {
        name: "两角和差正切公式",
        latex:
          "\\tan(\\alpha \\pm \\beta) = \\frac{\\tan\\alpha \\pm \\tan\\beta}{1 \\mp \\tan\\alpha\\tan\\beta}",
        condition:
          "$\\alpha, \\beta, \\alpha\\pm\\beta \\neq k\\pi + \\frac{\\pi}{2}$",
        note: "变形应用：$\\tan\\alpha + \\tan\\beta = \\tan(\\alpha+\\beta)(1 - \\tan\\alpha \\tan\\beta)$。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考考点1：给值求值 —— 巧用拼角拆角 α = (α+β) - β 或 2α = (α+β) + (α-β)",
        importance: "gaokao",
      },
      {
        text: "高考考点2：给值求角 —— 注意三角函数值的单调区间与角的范围限制，防止多解或错解",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (!res.isTanDefined) {
      warnings.push({
        text: "正切无意义警告：分母为 0 或某个角的正切无意义！",
        level: "danger",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "两角和差口诀：正余余正符号同（sin），余余正正符号反（cos）！",
    };
  } else if (studyMode === "double_angle") {
    const res = calculateDoubleAngle(alphaDeg, doubleAngleKey);
    const quantities: MathQuantity[] = [
      {
        label: "单角 α 角度",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: "#EF4444",
      },
      {
        label: "倍角 2α 角度",
        symbol: "2\\alpha",
        value: `${(((alphaDeg * 2) % 360) + 360) % 360}°`,
        color: "#2563EB",
      },
      {
        label: "sin 2α 二倍角",
        symbol: "\\sin 2\\alpha",
        value: res.sin2Alpha.toFixed(3),
        color: "#2563EB",
      },
      {
        label: "cos 2α 二倍角",
        symbol: "\\cos 2\\alpha",
        value: res.cos2Alpha.toFixed(3),
        color: "#D97706",
      },
      {
        label: "sin²α 正弦降幂",
        symbol: "\\sin^2\\alpha",
        value: `${res.sinSqAlpha.toFixed(3)} = \\frac{1 - (${res.cos2Alpha.toFixed(3)})}{2}`,
        color: "#059669",
      },
      {
        label: "cos²α 余弦降幂",
        symbol: "\\cos^2\\alpha",
        value: `${res.cosSqAlpha.toFixed(3)} = \\frac{1 + (${res.cos2Alpha.toFixed(3)})}{2}`,
        color: "#059669",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "二倍角公式",
        latex:
          "\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha, \\quad \\cos 2\\alpha = \\cos^2\\alpha - \\sin^2\\alpha = 2\\cos^2\\alpha - 1 = 1 - 2\\sin^2\\alpha",
        condition: "$\\alpha \\in \\mathbb{R}$",
        note: "在两角和公式中令 $\\beta = \\alpha$ 即可导出。$\\cos 2\\alpha$ 有三种表现形式，在升降幂中极具威力。",
        level: "core",
      },
      {
        name: "升降幂公式",
        latex:
          "\\sin^2\\alpha = \\frac{1-\\cos 2\\alpha}{2}, \\quad \\cos^2\\alpha = \\frac{1+\\cos 2\\alpha}{2}",
        condition: "用于高考化简中将二次项降为一次项，周期减半",
        note: "降幂升角：二次变一次，角度翻倍！",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考考点1：三角函数化简求最值 —— 运用降幂公式与倍角公式将 f(x)=a sin²x + b sin x cos x 转化为 Asin(ωx+φ)+C",
        importance: "gaokao",
      },
      {
        text: "高考考点2：二倍角余弦三变式灵活运用（已知 cos α 求 cos 2α 等）",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (!res.isTanDefined) {
      warnings.push({
        text: "二倍角正切无意义：cos 2α = 0，tan 2α 无意义！",
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "倍角降幂口诀：二次降一次，次数降一半，角度翻一番！",
    };
  } else {
    // auxiliary 模式
    const res = calculateAuxiliary(coeffA, coeffB);
    const quantities: MathQuantity[] = [
      {
        label: "正弦系数 a",
        symbol: "a",
        value: `${coeffA}`,
        color: "#EF4444",
      },
      {
        label: "余弦系数 b",
        symbol: "b",
        value: `${coeffB}`,
        color: "#D97706",
      },
      {
        label: "合成振幅 A",
        symbol: "A = \\sqrt{a^2+b^2}",
        value: res.amplitude.toFixed(3),
        color: "#2563EB",
        highlight: res.isDegenerate ? "extreme" : undefined,
      },
      {
        label: "辅助角 φ (°)",
        symbol: "\\varphi",
        value: `${res.phiDeg.toFixed(1)}°`,
        color: "#059669",
      },
      {
        label: "cos φ 与 sin φ",
        symbol: "\\cos\\varphi, \\sin\\varphi",
        value: `cos=${res.cosPhi.toFixed(3)}, sin=${res.sinPhi.toFixed(3)}`,
        color: "#059669",
      },
      {
        label: "tan φ 值",
        symbol: "\\tan\\varphi = \\frac{b}{a}",
        value: res.tanPhi !== undefined ? res.tanPhi.toFixed(3) : "∞",
        color: "#D97706",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "辅助角公式 (Asin(ωx+φ) 化简法)",
        latex: "a\\sin x + b\\cos x = \\sqrt{a^2+b^2}\\sin(x+\\varphi)",
        condition:
          "$a^2 + b^2 \\neq 0, \\quad \\cos\\varphi = \\frac{a}{\\sqrt{a^2+b^2}}, \\quad \\sin\\varphi = \\frac{b}{\\sqrt{a^2+b^2}}$",
        note: "几何本质：平面向量 $(a, b)$ 极坐标化 $(A, \\varphi)$。两同频正弦波与余弦波叠加仍为同频正弦波！",
        level: "core",
      },
      {
        name: "辅助角函数的最值与周期",
        latex:
          "y_{max} = \\sqrt{a^2+b^2}, \\quad y_{min} = -\\sqrt{a^2+b^2}, \\quad T = 2\\pi",
        condition: "$x \\in \\mathbb{R}$",
        note: "高考中结合单调性与对称轴分析。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考大题必考：将复杂三角函数式化为 Asin(ωx+φ)+C 形式，进而求定义域、最值、单调区间与对称轴",
        importance: "gaokao",
      },
      {
        text: "辅助角象限确定：tan φ = b/a，φ 的象限由点 (a, b) 所在象限唯一确定！",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (res.isDegenerate) {
      warnings.push({
        text: "退化警告：a = 0 且 b = 0，合成波形退化为恒等于 0 的直线！",
        level: "danger",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic:
        "辅助角化简口诀：提模长 sqrt(a²+b²)，余弦正弦填角 φ，点(a,b)象限定符号！",
    };
  }
}
