import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import {
  calcTrigProperties,
  formatPiValue,
  calculateIntervalZeros,
} from "@/features/trigTransform/math/trigTransform";

export function buildTrigTransformPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const A = params.A ?? 1.5;
  const omega = params.omega ?? 2;
  const phi = params.phi ?? Math.PI / 3;
  const k = params.k ?? 0;
  const x1 = params.x1 ?? 0;
  const x2 = params.x2 ?? Math.PI;

  const studyMode = (config?.studyMode as string) ?? "properties";
  const pathType = (config?.pathType as string) ?? "shift-first";
  const stepIndex = (config?.stepIndex as number) ?? 0;

  const props = calcTrigProperties(A, omega, phi, k);
  const periodStr = formatPiValue(props.period);
  const phiStr = formatPiValue(phi);
  const absShiftPath2 = formatPiValue(Math.abs(phi / omega));

  // 1. ω 范围与区间零点分布模式
  if (studyMode === "omegaZeros") {
    const intervalInfo = calculateIntervalZeros(A, omega, phi, k, x1, x2);
    const u1Str = intervalInfo.u1.toFixed(2);
    const u2Str = intervalInfo.u2.toFixed(2);
    const deltaUStr = intervalInfo.deltaU.toFixed(2);

    const quantities: MathQuantity[] = [
      {
        label: "角频率 ω 与周期 T",
        symbol: "\\omega, \\; T",
        value: `ω = ${omega.toFixed(2)}, T = ${periodStr}`,
        color: "#D97706",
      },
      {
        label: "探究区间 [x₁, x₂]",
        symbol: "[x_1, x_2]",
        value: `[${intervalInfo.x1.toFixed(2)}, ${intervalInfo.x2.toFixed(2)}]`,
        color: "#EF4444",
      },
      {
        label: "整体相位区间 [u₁, u₂]",
        symbol: "[\\omega x_1 + \\varphi, \\; \\omega x_2 + \\varphi]",
        value: `[${u1Str}, ${u2Str}]`,
        color: "#2563EB",
      },
      {
        label: "相位跨度 Δu",
        symbol: "\\Delta u = \\omega(x_2 - x_1)",
        value: `${deltaUStr} rad (${(intervalInfo.deltaU / Math.PI).toFixed(2)}π)`,
        color: "#7C3AED",
      },
      {
        label: "区间内零点个数",
        symbol: "N_{zeros}",
        value: `${intervalInfo.zeroCount} 个`,
        color: "#EF4444",
        highlight: intervalInfo.zeroCount > 0 ? "positive" : "zero",
      },
      {
        label: "区间内极值点个数",
        symbol: "N_{extrema}",
        value: `${intervalInfo.extremumCount} 个 (极大 ${intervalInfo.maxima.length}, 极小 ${intervalInfo.minima.length})`,
        color: "#059669",
      },
      {
        label: "区间严格单调性",
        symbol: "\\text{Monotonicity}",
        value: intervalInfo.isMonotone
          ? intervalInfo.monotoneType === "increasing"
            ? "严格单调递增"
            : "严格单调递减"
          : "非单调 (跨越极值点)",
        color: intervalInfo.isMonotone ? "#059669" : "#DC2626",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "整体代换与相位区间映射定理",
        latex:
          "x \\in [x_1, x_2] \\iff u = \\omega x + \\varphi \\in [\\omega x_1 + \\varphi, \\; \\omega x_2 + \\varphi]",
        condition: "\\omega > 0, \\; x_1 < x_2",
        note: "将关于 x 的零点与单调性问题，转化为整体相位 u 在标准正弦曲线 y = sin u 上的落点问题。",
        level: "core",
      },
      {
        name: "零点个数与单调区间充要判据",
        latex:
          "\\begin{cases} \\text{恰有 } n \\text{ 个零点} \\implies (n-1)\\pi < \\Delta u \\le (n+1)\\pi \\text{ (需验证端点)} \\\\ \\text{在 } [x_1, x_2] \\text{ 上单调} \\implies \\Delta u \\le \\pi \\text{ 且区间不含极值点 } \\frac{\\pi}{2}+m\\pi \\end{cases}",
        condition: "\\Delta u = \\omega(x_2 - x_1)",
        note: "高考求解 ω 范围核心：先求开区间必要条件，再将端点 ω 值代入检验闭区间端点是否产生多余零点。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考压轴小题核心：'整体换元看相位区间' —— 令 u = ωx + φ，求出 u 的取值范围 [u₁, u₂]。",
        importance: "gaokao",
      },
      {
        text: "端点等号避坑原则：端点值是否取等号是高考最高频失分点，务必将临界 ω 代回原函数验证端点零点情况。",
        importance: "hard",
      },
      {
        text: "零点个数 vs 极值点个数：若函数在区间内恰有 n 个零点，极值点个数可能为 n-1, n 或 n+1，需看两端相位。",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (intervalInfo.zeros.some((z) => z.isEndpoint)) {
      warnings.push({
        text: "警示：当前参数下区间端点恰好落在零点上！高考中若题目为开区间 (x₁, x₂)，该端点零点不计入；若为闭区间 [x₁, x₂] 则计入。",
        level: "warning",
      });
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "整体换元看相位，零点落点数跨度，端点等号必带回！",
    };
  }

  // 2. 变换路径模式
  if (studyMode === "transformPath") {
    const quantities: MathQuantity[] = [
      {
        label: "变换路线",
        symbol: "\\text{Path}",
        value:
          pathType === "shift-first"
            ? "路线一: 先平移后伸缩"
            : "路线二: 先伸缩后平移",
        color: "#2563EB",
      },
      {
        label: "当前演化步骤",
        symbol: "\\text{Step}",
        value: `第 ${stepIndex} 步 / 共 4 步`,
        color: "#D97706",
      },
      {
        label: "相位平移量",
        symbol: "\\Delta x",
        value:
          pathType === "shift-first"
            ? `|φ| = ${formatPiValue(Math.abs(phi))}`
            : `|φ|/ω = ${absShiftPath2}`,
        color: "#059669",
      },
      {
        label: "横向周期伸缩比",
        symbol: "\\frac{1}{\\omega}",
        value: `1/${omega.toFixed(1)} 倍 (T: 2π → ${periodStr})`,
        color: "#D97706",
      },
      {
        label: "纵向振幅伸缩比",
        symbol: "A",
        value: `${A.toFixed(1)} 倍`,
        color: "#EF4444",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "三角函数图象变换两种等价路径",
        latex:
          "\\begin{aligned} &\\text{路径一: } \\sin x \\xrightarrow{x \\to x+\\varphi} \\sin(x+\\varphi) \\xrightarrow{x \\to \\omega x} \\sin(\\omega x+\\varphi) \\\\ &\\text{路径二: } \\sin x \\xrightarrow{x \\to \\omega x} \\sin(\\omega x) \\xrightarrow{x \\to x+\\frac{\\varphi}{\\omega}} \\sin\\left[\\omega\\left(x+\\frac{\\varphi}{\\omega}\\right)\\right] = \\sin(\\omega x+\\varphi) \\end{aligned}",
        condition: "\\omega > 0, \\; A > 0",
        note: "一切函数平移的本质都是对自变量 x 自身做代换：x 变为 x + Δx。",
        level: "core",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "高考高频陷阱：先伸缩后平移时，必须向左(右)平移 |φ|/ω 个单位，而非 |φ| 个单位！",
        importance: "gaokao",
      },
      {
        text: "口诀验证法：'左加右减针对 x'，当括号内提取公因数 ω 时，平移量一目了然。",
        importance: "core",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings: [],
      mnemonic: "先平移移 phi，后平移移 phi 比 omega！",
    };
  }

  // 3. 五点作图模式
  if (studyMode === "fivePoints") {
    const quantities: MathQuantity[] = [
      {
        label: "函数周期 T",
        symbol: `T = \\frac{2\\pi}{\\omega}`,
        value: periodStr,
        color: "#D97706",
      },
      {
        label: "振幅 A 与偏置 k",
        symbol: "A, \\; k",
        value: `A = ${A.toFixed(2)}, k = ${k.toFixed(2)}`,
        color: "#EF4444",
      },
      {
        label: "P1 (第一零点)",
        symbol: "\\omega x + \\varphi = 0",
        value: `(${props.fivePoints[0].x.toFixed(2)}, ${props.fivePoints[0].y.toFixed(2)})`,
        color: "#059669",
      },
      {
        label: "P2 (第一波峰)",
        symbol: "\\omega x + \\varphi = \\frac{\\pi}{2}",
        value: `(${props.fivePoints[1].x.toFixed(2)}, ${props.fivePoints[1].y.toFixed(2)})`,
        color: "#EF4444",
      },
      {
        label: "P3 (第二零点)",
        symbol: "\\omega x + \\varphi = \\pi",
        value: `(${props.fivePoints[2].x.toFixed(2)}, ${props.fivePoints[2].y.toFixed(2)})`,
        color: "#059669",
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "五点作图法整体相位对应定理",
        latex:
          "u = \\omega x + \\varphi \\in \\left\\{ 0, \\; \\frac{\\pi}{2}, \\; \\pi, \\; \\frac{3\\pi}{2}, \\; 2\\pi \\right\\}",
        condition: "\\omega > 0",
        note: "令整体相位等于标准正弦的五个特征值，反解 x 坐标并描点连线成光滑波形。",
        level: "core",
      },
      {
        name: "由图求解析式（逆向求解法）",
        latex:
          "A = \\frac{y_{\\max} - y_{\\min}}{2}, \\quad k = \\frac{y_{\\max} + y_{\\min}}{2}, \\quad \\omega = \\frac{2\\pi}{T}, \\quad \\varphi = \\frac{\\pi}{2} - \\omega x_{\\text{max}}",
        note: "先定 A 与 k，再由相邻峰谷或零点间距定 T → ω，最后代入最高点第一零点求 φ。",
        level: "important",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "由图求式大题必考：代入特征点求 φ 时优先使用波峰点 (ω x_max + φ = π/2 + 2kπ)，避免零点多解符号错误。",
        importance: "gaokao",
      },
      {
        text: "支持反向拖拽：在画布上直接拖动特征点 P2(波峰) 或 P1(零点)，可反向驱动滑块参数。",
        importance: "core",
      },
    ];

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings: [],
      mnemonic: "五点作图看相位，由图求式代波峰！",
    };
  }

  // 4. 基本性质模式 (properties)
  return {
    quantities: [
      {
        label: "函数周期 T",
        symbol: `T = \\frac{2\\pi}{\\omega}`,
        value: periodStr,
        color: "#D97706",
      },
      {
        label: "振幅 A",
        symbol: "A",
        value: props.amplitude.toFixed(2),
        color: "#EF4444",
      },
      {
        label: "最大值 y_max",
        symbol: "y_{max} = k + A",
        value: props.yMax.toFixed(2),
        color: "#059669",
      },
      {
        label: "最小值 y_min",
        symbol: "y_{min} = k - A",
        value: props.yMin.toFixed(2),
        color: "#059669",
      },
      {
        label: "主单调增区间",
        symbol: "\\text{增区间}",
        value: `[${props.mainIncInterval[0].toFixed(2)}, ${props.mainIncInterval[1].toFixed(2)}]`,
        color: "#2563EB",
      },
      {
        label: "初相 φ",
        symbol: "\\varphi",
        value: `${phiStr} rad`,
        color: "#059669",
      },
    ],
    theorems: [
      {
        name: "三角函数图象标准方程与周期公式",
        latex:
          "y = A\\sin(\\omega x + \\varphi) + k, \\quad T = \\frac{2\\pi}{|\\omega|}",
        prerequisites: ["A > 0, \\omega > 0"],
        note: "A 决定振幅与值域 [k-A, k+A]，ω 决定周期，φ 决定初相，k 决定平衡位置。",
        level: "core",
      },
      {
        name: "对称轴与对称中心通项公式",
        latex:
          "\\text{对称轴: } x = \\frac{m\\pi + \\frac{\\pi}{2} - \\varphi}{\\omega}, \\quad \\text{对称中心: } \\left( \\frac{m\\pi - \\varphi}{\\omega}, \\; k \\right) \\quad (m \\in \\mathbb{Z})",
        condition: "\\omega \\neq 0",
        note: "相邻两对称轴间距为 T/2，相邻两对称中心间距为 T/2，对称轴与相邻对称中心间距为 T/4。",
        level: "important",
      },
    ],

    gaokaoPoints: [
      {
        text: "对称性多选题考查：若 x=x1 与 x=x2 都是对称轴，则 |x1 - x2| 必为 T/2 的整数倍。",
        importance: "gaokao",
      },
      {
        text: "求单调区间必考：令 2kπ - π/2 ≤ ωx + φ ≤ 2kπ + π/2 解出 x 即为单调增区间。",
        importance: "gaokao",
      },
    ],
    warnings: [],
    mnemonic:
      "先平移移 phi，后平移移 phi 比 omega；对称轴过最值点，对称中心在平衡！",
  };
}
