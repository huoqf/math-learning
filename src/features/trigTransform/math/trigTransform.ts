/**
 * 三角函数 y = A sin(ωx + φ) + k 纯数学计算层
 * 严格保持无 DOM、无 React、无 Store 副作用
 */

export interface FivePoint {
  index: number;
  phase: number; // 相位 0, π/2, π, 3π/2, 2π
  x: number;
  y: number;
  label: string;
}

export interface TrigProperties {
  amplitude: number;
  omega: number;
  phi: number;
  k: number;
  period: number;
  frequency: number;
  yMax: number;
  yMin: number;
  fivePoints: FivePoint[];
  mainIncInterval: [number, number];
  mainDecInterval: [number, number];
  mainSymmetryAxes: number[];
  mainSymmetryCenters: Array<[number, number]>;
}

export interface TransformStepInfo {
  step: number;
  title: string;
  formulaLatex: string;
  explanation: string;
  shiftValue?: number;
  stretchValue?: number;
  fn: (x: number) => number;
}

/**
 * 格式化数值为分数/带 π 符号字符串（如 0.5π -> \frac{\pi}{2}）
 */
export function formatPiValue(val: number): string {
  if (Math.abs(val) < 1e-6) return "0";
  const fracOfPi = val / Math.PI;

  // 常见分数比例判别
  const fractions: Array<[number, string]> = [
    [1, "\\pi"],
    [-1, "-\\pi"],
    [0.5, "\\frac{\\pi}{2}"],
    [-0.5, "-\\frac{\\pi}{2}"],
    [1 / 3, "\\frac{\\pi}{3}"],
    [-1 / 3, "-\\frac{\\pi}{3}"],
    [2 / 3, "\\frac{2\\pi}{3}"],
    [-2 / 3, "-\\frac{2\\pi}{3}"],
    [0.25, "\\frac{\\pi}{4}"],
    [-0.25, "-\\frac{\\pi}{4}"],
    [0.75, "\\frac{3\\pi}{4}"],
    [-0.75, "-\\frac{3\\pi}{4}"],
    [1 / 6, "\\frac{\\pi}{6}"],
    [-1 / 6, "-\\frac{\\pi}{6}"],
    [5 / 6, "\\frac{5\\pi}{6}"],
    [-5 / 6, "-\\frac{5\\pi}{6}"],
    [2, "2\\pi"],
    [-2, "-2\\pi"],
  ];

  for (const [ratio, tex] of fractions) {
    if (Math.abs(fracOfPi - ratio) < 1e-4) {
      return tex;
    }
  }

  return val.toFixed(2);
}

/**
 * 计算五点作图法关键点
 */
export function calcFivePoints(
  A: number,
  omega: number,
  phi: number,
  k: number,
): FivePoint[] {
  if (Math.abs(omega) < 1e-9) {
    return [];
  }

  const phases = [
    { phase: 0, label: "0" },
    { phase: Math.PI / 2, label: "\\frac{\\pi}{2}" },
    { phase: Math.PI, label: "\\pi" },
    { phase: (3 * Math.PI) / 2, label: "\\frac{3\\pi}{2}" },
    { phase: 2 * Math.PI, label: "2\\pi" },
  ];

  return phases.map((p, idx) => {
    const x = (p.phase - phi) / omega;
    const y = A * Math.sin(p.phase) + k;
    return {
      index: idx + 1,
      phase: p.phase,
      x,
      y,
      label: p.label,
    };
  });
}

/**
 * 计算三角函数的综合性质
 */
export function calcTrigProperties(
  A: number,
  omega: number,
  phi: number,
  k: number,
): TrigProperties {
  const absOmega = Math.abs(omega) > 1e-9 ? Math.abs(omega) : 1;
  const period = (2 * Math.PI) / absOmega;
  const frequency = 1 / period;

  const fivePoints = calcFivePoints(A, absOmega, phi, k);

  // 原点附近的主递增区间 [-π/2, π/2]
  const incStart = (-Math.PI / 2 - phi) / absOmega;
  const incEnd = (Math.PI / 2 - phi) / absOmega;

  // 主递减区间 [π/2, 3π/2]
  const decStart = (Math.PI / 2 - phi) / absOmega;
  const decEnd = ((3 * Math.PI) / 2 - phi) / absOmega;

  // 主对称轴 x = (π/2 - φ)/ω 和 x = (3π/2 - φ)/ω
  const symmetryAxes = [
    (Math.PI / 2 - phi) / absOmega,
    ((3 * Math.PI) / 2 - phi) / absOmega,
  ];

  // 主对称中心 (-φ/ω, k) 和 (π-φ/ω, k)
  const symmetryCenters: Array<[number, number]> = [
    [-phi / absOmega, k],
    [(Math.PI - phi) / absOmega, k],
  ];

  return {
    amplitude: Math.abs(A),
    omega: absOmega,
    phi,
    k,
    period,
    frequency,
    yMax: k + Math.abs(A),
    yMin: k - Math.abs(A),
    fivePoints,
    mainIncInterval: [incStart, incEnd],
    mainDecInterval: [
      incStart > incEnd ? incEnd : incStart,
      incStart > incEnd ? incStart : incEnd,
    ],
    mainSymmetryAxes: symmetryAxes,
    mainSymmetryCenters: symmetryCenters,
  };
}

/**
 * 获取变换路径过程（路径一 vs 路径二）
 */
export function getTransformPathSteps(
  A: number,
  omega: number,
  phi: number,
  k: number,
  pathType: "shift-first" | "stretch-first",
): TransformStepInfo[] {
  const absOmega = Math.abs(omega) > 1e-9 ? Math.abs(omega) : 1;
  const phiStr = formatPiValue(phi);
  const shiftAmountPath2 = phi / absOmega;
  const shiftAmountPath2Str = formatPiValue(shiftAmountPath2);

  if (pathType === "shift-first") {
    // 路径一：先平移后伸缩
    const direction = phi >= 0 ? "左" : "右";
    const absPhiStr = formatPiValue(Math.abs(phi));

    return [
      {
        step: 0,
        title: "基准函数",
        formulaLatex: "y_0 = \\sin x",
        explanation: "标准正弦函数，周期 T = 2\\pi，振幅 A = 1。",
        fn: (x: number) => Math.sin(x),
      },
      {
        step: 1,
        title: "相位平移（平移 φ）",
        formulaLatex: `y_1 = \\sin(x ${phi >= 0 ? "+" : ""}${phiStr})`,
        explanation: `沿 x 轴向${direction}平移 |\\varphi| = ${absPhiStr} 个单位。`,
        shiftValue: phi,
        fn: (x: number) => Math.sin(x + phi),
      },
      {
        step: 2,
        title: "周期伸缩（伸缩 ω）",
        formulaLatex: `y_2 = \\sin(\\color{#D97706}{${absOmega.toFixed(1)}} x ${phi >= 0 ? "+" : ""}${phiStr})`,
        explanation: `将横坐标 x 变为原来的 1/\\omega = 1/${absOmega.toFixed(1)} 倍。`,
        stretchValue: absOmega,
        fn: (x: number) => Math.sin(absOmega * x + phi),
      },
      {
        step: 3,
        title: "振幅伸缩（伸缩 A）",
        formulaLatex: `y_3 = \\color{#EF4444}{${A.toFixed(1)}} \\sin(${absOmega.toFixed(1)} x ${phi >= 0 ? "+" : ""}${phiStr})`,
        explanation: `将纵坐标 y 伸缩到原来的 A = ${A.toFixed(1)} 倍。`,
        stretchValue: A,
        fn: (x: number) => A * Math.sin(absOmega * x + phi),
      },
      {
        step: 4,
        title: "垂直平移（平移 k）",
        formulaLatex: `y_4 = \\color{#EF4444}{${A.toFixed(1)}} \\sin(${absOmega.toFixed(1)} x ${phi >= 0 ? "+" : ""}${phiStr}) ${k >= 0 ? "+" : ""}${k.toFixed(1)}`,
        explanation: `沿 y 轴向上/下平移 k = ${k.toFixed(1)} 个单位。`,
        shiftValue: k,
        fn: (x: number) => A * Math.sin(absOmega * x + phi) + k,
      },
    ];
  } else {
    // 路径二：先伸缩后平移 (高考经典考点陷阱)
    const direction = phi >= 0 ? "左" : "右";
    const absShiftStr = formatPiValue(Math.abs(shiftAmountPath2));

    return [
      {
        step: 0,
        title: "基准函数",
        formulaLatex: "y_0 = \\sin x",
        explanation: "标准正弦函数，周期 T = 2\\pi，振幅 A = 1。",
        fn: (x: number) => Math.sin(x),
      },
      {
        step: 1,
        title: "周期伸缩（伸缩 ω）",
        formulaLatex: `y_1 = \\sin(\\color{#D97706}{${absOmega.toFixed(1)}} x)`,
        explanation: `将横坐标 x 变为原来的 1/\\omega = 1/${absOmega.toFixed(1)} 倍。`,
        stretchValue: absOmega,
        fn: (x: number) => Math.sin(absOmega * x),
      },
      {
        step: 2,
        title: "相位平移（平移 φ/ω）",
        formulaLatex: `y_2 = \\sin[\\color{#D97706}{${absOmega.toFixed(1)}}(x ${shiftAmountPath2 >= 0 ? "+" : ""}${absShiftStr})] = \\sin(${absOmega.toFixed(1)}x ${phi >= 0 ? "+" : ""}${phiStr})`,
        explanation: `⚠️ 高考考点：向${direction}平移 |\\varphi|/\\omega = ${absShiftStr} 个单位，而非 |\\varphi|！`,
        shiftValue: shiftAmountPath2,
        fn: (x: number) => Math.sin(absOmega * (x + shiftAmountPath2)),
      },
      {
        step: 3,
        title: "振幅伸缩（伸缩 A）",
        formulaLatex: `y_3 = \\color{#EF4444}{${A.toFixed(1)}} \\sin(${absOmega.toFixed(1)} x ${phi >= 0 ? "+" : ""}${phiStr})`,
        explanation: `将纵坐标 y 伸缩到原来的 A = ${A.toFixed(1)} 倍。`,
        stretchValue: A,
        fn: (x: number) => A * Math.sin(absOmega * x + phi),
      },
      {
        step: 4,
        title: "垂直平移（平移 k）",
        formulaLatex: `y_4 = \\color{#EF4444}{${A.toFixed(1)}} \\sin(${absOmega.toFixed(1)} x ${phi >= 0 ? "+" : ""}${phiStr}) ${k >= 0 ? "+" : ""}${k.toFixed(1)}`,
        explanation: `沿 y 轴向上/下平移 k = ${k.toFixed(1)} 个单位。`,
        shiftValue: k,
        fn: (x: number) => A * Math.sin(absOmega * x + phi) + k,
      },
    ];
  }
}
