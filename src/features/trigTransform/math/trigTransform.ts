export interface FivePointInfo {
  index: number;
  phaseName: string;
  x: number;
  y: number;
  type: "zero" | "max" | "min";
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
  fivePoints: FivePointInfo[];
  mainIncInterval: [number, number];
  mainDecInterval: [number, number];
  mainSymmetryAxes: number[];
  mainSymmetryCenters: Array<[number, number]>;
}

export interface TransformStepInfo {
  step: number;
  name: string;
  title: string;
  expression: string;
  fn: (x: number) => number;
  description: string;
  explanation: string;
  vectorFrom?: [number, number];
  vectorTo?: [number, number];
  vectorLabel?: string;
}

export interface GaokaoPreset {
  id: string;
  name: string;
  description: string;
  mode: "properties" | "fivePoints" | "transformPath" | "omegaZeros";
  params: {
    A: number;
    omega: number;
    phi: number;
    k: number;
    x1?: number;
    x2?: number;
  };
  pathType?: "shift-first" | "stretch-first";
  stepIndex?: number;
  keyTakeaway: string;
}

export const GAOKAO_PRESETS: GaokaoPreset[] = [
  {
    id: "shift-vs-stretch",
    name: "高考经典陷阱：平移顺序对比",
    description: "对比先平移(移|φ|)与先伸缩(移|φ|/ω)的区别",
    mode: "transformPath",
    params: { A: 2, omega: 2, phi: Math.PI / 3, k: 0 },
    pathType: "shift-first",
    stepIndex: 1,
    keyTakeaway:
      "先平移沿 x 轴平移 |φ|；先伸缩沿 x 轴平移 |φ|/ω（针对自变量 x 变化）。",
  },
  {
    id: "omega-zeros-count",
    name: "新高考压轴：求 ω 范围使恰有2个零点",
    description: "f(x)=sin(ωx + π/6) 在 [0, π/2] 上恰有2个零点",
    mode: "omegaZeros",
    params: { A: 1, omega: 3, phi: Math.PI / 6, k: 0, x1: 0, x2: Math.PI / 2 },
    keyTakeaway:
      "令 u = ωx + π/6 ∈ [π/6, ωπ/2 + π/6]，恰有2个零点要求 π < ωπ/2 + π/6 ≤ 2π，即 5/3 < ω ≤ 11/3。",
  },
  {
    id: "omega-monotone",
    name: "新高考真题：求 ω 范围使区间单调递增",
    description: "f(x)=sin(ωx + π/4) 在 [0, π/3] 上严格单调递增",
    mode: "omegaZeros",
    params: {
      A: 1,
      omega: 0.75,
      phi: Math.PI / 4,
      k: 0,
      x1: 0,
      x2: Math.PI / 3,
    },
    keyTakeaway: "单调递增要求右端点 u2 = ωπ/3 + π/4 ≤ π/2，解得 0 < ω ≤ 3/4。",
  },
  {
    id: "five-points-fit",
    name: "由图求式：五点特征定解析式",
    description: "最高点 (π/6, 2)，相邻零点 (5π/12, 0)",
    mode: "fivePoints",
    params: { A: 2, omega: 2, phi: -Math.PI / 6, k: 0 },
    keyTakeaway:
      "由波峰与相邻零点间距 T/4 = π/4 得 T = π → ω = 2；由 2*(π/6) + φ = π/2 得 φ = -π/6。",
  },
];

export function formatPiValue(val: number): string {
  if (Math.abs(val) < 1e-4) return "0";
  const ratio = val / Math.PI;
  const isNeg = ratio < 0;
  const absR = Math.abs(ratio);

  const prefix = isNeg ? "-" : "";
  if (Math.abs(absR - 1) < 1e-4) return isNeg ? "-\\pi" : "\\pi";
  if (Math.abs(absR - 2) < 1e-4) return isNeg ? "-2\\pi" : "2\\pi";
  if (Math.abs(absR - 0.5) < 1e-4) return `${prefix}\\frac{\\pi}{2}`;
  if (Math.abs(absR - 1 / 3) < 1e-4) return `${prefix}\\frac{\\pi}{3}`;
  if (Math.abs(absR - 2 / 3) < 1e-4) return `${prefix}\\frac{2\\pi}{3}`;
  if (Math.abs(absR - 0.25) < 1e-4) return `${prefix}\\frac{\\pi}{4}`;
  if (Math.abs(absR - 0.75) < 1e-4) return `${prefix}\\frac{3\\pi}{4}`;
  if (Math.abs(absR - 1 / 6) < 1e-4) return `${prefix}\\frac{\\pi}{6}`;
  if (Math.abs(absR - 5 / 6) < 1e-4) return `${prefix}\\frac{5\\pi}{6}`;
  if (Math.abs(absR - 4 / 3) < 1e-4) return `${prefix}\\frac{4\\pi}{3}`;
  if (Math.abs(absR - 5 / 3) < 1e-4) return `${prefix}\\frac{5\\pi}{3}`;

  return val.toFixed(2);
}

export function calcTrigProperties(
  A: number,
  omega: number,
  phi: number,
  k: number,
  xRange: [number, number] = [-8, 8],
): TrigProperties {
  const absOmega = Math.abs(omega) > 1e-9 ? Math.abs(omega) : 1;
  const period = (2 * Math.PI) / absOmega;
  const frequency = 1 / period;

  const phases = [
    { phaseName: "0", t: 0, type: "zero" as const },
    { phaseName: "π/2", t: Math.PI / 2, type: "max" as const },
    { phaseName: "π", t: Math.PI, type: "zero" as const },
    { phaseName: "3π/2", t: (3 * Math.PI) / 2, type: "min" as const },
    { phaseName: "2π", t: 2 * Math.PI, type: "zero" as const },
  ];

  const fivePoints: FivePointInfo[] = phases.map((p, idx) => {
    const x = (p.t - phi) / absOmega;
    const y = A * Math.sin(p.t) + k;
    return {
      index: idx,
      phaseName: p.phaseName,
      x,
      y,
      type: p.type,
    };
  });

  const incStart = (-Math.PI / 2 - phi) / absOmega;
  const incEnd = (Math.PI / 2 - phi) / absOmega;

  // 生成在 xRange 范围内的所有对称轴与对称中心
  const symmetryAxes: number[] = [];
  const symmetryCenters: Array<[number, number]> = [];

  const kMin = Math.floor((xRange[0] * absOmega + phi) / Math.PI - 2);
  const kMax = Math.ceil((xRange[1] * absOmega + phi) / Math.PI + 2);

  for (let m = kMin; m <= kMax; m++) {
    // 对称轴: omega*x + phi = pi/2 + m*pi => x = (pi/2 + m*pi - phi) / omega
    const xAxis = (Math.PI / 2 + m * Math.PI - phi) / absOmega;
    if (xAxis >= xRange[0] - 0.5 && xAxis <= xRange[1] + 0.5) {
      symmetryAxes.push(xAxis);
    }
    // 对称中心: omega*x + phi = m*pi => x = (m*pi - phi) / omega, y = k
    const xCenter = (m * Math.PI - phi) / absOmega;
    if (xCenter >= xRange[0] - 0.5 && xCenter <= xRange[1] + 0.5) {
      symmetryCenters.push([xCenter, k]);
    }
  }

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

export function calcFivePoints(
  A: number,
  omega: number,
  phi: number,
  k: number,
) {
  return calcTrigProperties(A, omega, phi, k).fivePoints;
}

export function solveParamsFromDrag(
  pointIndex: number,
  newX: number,
  newY: number,
  currentParams: { A: number; omega: number; phi: number; k: number },
): { A: number; omega: number; phi: number; k: number } {
  const { omega } = currentParams;
  let { A, phi, k } = currentParams;

  // 五点对应相位 t: 0, pi/2, pi, 3pi/2, 2pi
  const phases = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, 2 * Math.PI];
  const targetT = phases[pointIndex] ?? 0;

  if (pointIndex === 1) {
    // 拖动波峰点: y = k + A, x = (pi/2 - phi)/omega
    A = Math.max(0.2, Math.round((newY - k) * 10) / 10);
    // 反解 phi: phi = pi/2 - omega * newX
    let rawPhi = Math.PI / 2 - omega * newX;
    // 归一化到 [-PI, PI]
    while (rawPhi > Math.PI) rawPhi -= 2 * Math.PI;
    while (rawPhi < -Math.PI) rawPhi += 2 * Math.PI;
    phi = Math.round(rawPhi * 12) / 12;
  } else if (pointIndex === 3) {
    // 拖动波谷点
    A = Math.max(0.2, Math.round((k - newY) * 10) / 10);
    let rawPhi = (3 * Math.PI) / 2 - omega * newX;
    while (rawPhi > Math.PI) rawPhi -= 2 * Math.PI;
    while (rawPhi < -Math.PI) rawPhi += 2 * Math.PI;
    phi = Math.round(rawPhi * 12) / 12;
  } else if (pointIndex === 0) {
    // 拖动第一零点: omega*x + phi = 0 => phi = -omega*x
    k = Math.round(newY * 2) / 2;
    let rawPhi = -omega * newX;
    while (rawPhi > Math.PI) rawPhi -= 2 * Math.PI;
    while (rawPhi < -Math.PI) rawPhi += 2 * Math.PI;
    phi = Math.round(rawPhi * 12) / 12;
  } else {
    // 其他零点
    k = Math.round(newY * 2) / 2;
    let rawPhi = targetT - omega * newX;
    while (rawPhi > Math.PI) rawPhi -= 2 * Math.PI;
    while (rawPhi < -Math.PI) rawPhi += 2 * Math.PI;
    phi = Math.round(rawPhi * 12) / 12;
  }

  return { A, omega, phi, k };
}

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
  const phiSign = phi >= 0 ? "+" : "";

  if (pathType === "shift-first") {
    const direction = phi >= 0 ? "左" : "右";
    const absPhiStr = formatPiValue(Math.abs(phi));
    return [
      {
        step: 0,
        name: "基准图象",
        title: "步0：基准正弦曲线",
        expression: "y = \\sin x",
        fn: (x: number) => Math.sin(x),
        description: "起点：基础正弦曲线 y = sin x",
        explanation: "起点：标准正弦曲线 y = sin x，周期 2π，振幅 1",
      },
      {
        step: 1,
        name: "第一步：相位平移",
        title: "步1：相位平移（自变量代换 x → x + φ）",
        expression: `y = \\sin(x ${phiSign}${phiStr})`,
        fn: (x: number) => Math.sin(x + phi),
        description: `沿 x 轴向${direction}平移 |φ| = ${absPhiStr} 个单位`,
        explanation: `沿 x 轴向${direction}平移 |φ| = ${absPhiStr} 个单位（加左减右）`,
        vectorFrom: [0, 0],
        vectorTo: [-phi, 0],
        vectorLabel: `向${direction}移 ${absPhiStr}`,
      },
      {
        step: 2,
        name: "第二步：周期伸缩",
        title: "步2：横向周期伸缩（x → ωx）",
        expression: `y = \\sin(\\color{#D97706}{${omega.toFixed(1)}} x ${phiSign}${phiStr})`,
        fn: (x: number) => Math.sin(omega * x + phi),
        description: `横坐标变为原来的 1/${absOmega}，周期变为 T = 2π/${absOmega}`,
        explanation: `所有点的横坐标伸缩为 1/${absOmega} 倍，纵坐标保持不变`,
      },
      {
        step: 3,
        name: "第三步：振幅伸缩",
        title: "步3：纵向振幅伸缩（y → Ay）",
        expression: `y = \\color{#EF4444}{${A.toFixed(1)}} \\sin(${omega.toFixed(1)} x ${phiSign}${phiStr})`,
        fn: (x: number) => A * Math.sin(omega * x + phi),
        description: `纵坐标伸长为原来的 A = ${A.toFixed(1)} 倍`,
        explanation: `所有点的纵坐标变为 A 倍，波峰达 ${A.toFixed(1)}，波谷达 ${(-A).toFixed(1)}`,
      },
      {
        step: 4,
        name: "第四步：偏置平移",
        title: "步4：上下平衡平移（y → y + k）",
        expression: `y = ${A.toFixed(1)} \\sin(${omega.toFixed(1)} x ${phiSign}${phiStr}) ${k >= 0 ? "+" : ""}${k.toFixed(1)}`,
        fn: (x: number) => A * Math.sin(omega * x + phi) + k,
        description: `沿 y 轴平移 k = ${k.toFixed(1)}，平衡轴变为 y = ${k.toFixed(1)}`,
        explanation: `图象整体沿 y 轴上下移动 k 单位，平衡位置变为 y = ${k.toFixed(1)}`,
      },
    ];
  } else {
    const direction = shiftAmountPath2 >= 0 ? "左" : "右";
    const absShiftStr = formatPiValue(Math.abs(shiftAmountPath2));
    const shiftSign = shiftAmountPath2 >= 0 ? "+" : "";

    return [
      {
        step: 0,
        name: "基准图象",
        title: "步0：基准正弦曲线",
        expression: "y = \\sin x",
        fn: (x: number) => Math.sin(x),
        description: "起点：基础正弦曲线 y = sin x",
        explanation: "起点：标准正弦曲线 y = sin x，周期 2π，振幅 1",
      },
      {
        step: 1,
        name: "第一步：周期伸缩",
        title: "步1：横向周期伸缩（x → ωx）",
        expression: `y = \\sin(\\color{#D97706}{${omega.toFixed(1)}} x)`,
        fn: (x: number) => Math.sin(omega * x),
        description: `横坐标变为原来的 1/${absOmega}，周期变为 T = 2π/${absOmega}`,
        explanation: `先进行横向伸缩，图象横向缩短或伸长`,
      },
      {
        step: 2,
        name: "第二步：相位平移",
        title: "步2：相位平移（注意：平移自变量 x → x + φ/ω）",
        expression: `y = \\sin\\left[${omega.toFixed(1)}\\left(x ${shiftSign}${shiftAmountPath2Str}\\right)\\right] = \\sin(${omega.toFixed(1)} x ${phiSign}${phiStr})`,
        fn: (x: number) => Math.sin(omega * x + phi),
        description: `沿 x 轴向${direction}平移 φ/ω = ${absShiftStr} 个单位`,
        explanation: `【高考高频陷阱】先伸缩后平移时，平移量必须除以 ω，即移动 |φ|/ω = ${absShiftStr}！`,
        vectorFrom: [0, 0],
        vectorTo: [-shiftAmountPath2, 0],
        vectorLabel: `向${direction}移 φ/ω = ${absShiftStr}`,
      },
      {
        step: 3,
        name: "第三步：振幅伸缩",
        title: "步3：纵向振幅伸缩（y → Ay）",
        expression: `y = \\color{#EF4444}{${A.toFixed(1)}} \\sin(${omega.toFixed(1)} x ${phiSign}${phiStr})`,
        fn: (x: number) => A * Math.sin(omega * x + phi),
        description: `纵坐标伸长为原来的 A = ${A.toFixed(1)} 倍`,
        explanation: `所有点的纵坐标变为 A 倍`,
      },
      {
        step: 4,
        name: "第四步：偏置平移",
        title: "步4：上下平衡平移（y → y + k）",
        expression: `y = ${A.toFixed(1)} \\sin(${omega.toFixed(1)} x ${phiSign}${phiStr}) ${k >= 0 ? "+" : ""}${k.toFixed(1)}`,
        fn: (x: number) => A * Math.sin(omega * x + phi) + k,
        description: `沿 y 轴平移 k = ${k.toFixed(1)}`,
        explanation: `图象整体沿 y 轴移动 k 单位`,
      },
    ];
  }
}

export interface IntervalZerosInfo {
  x1: number;
  x2: number;
  u1: number;
  u2: number;
  deltaU: number;
  zeros: Array<{ x: number; y: number; m: number; isEndpoint: boolean }>;
  maxima: Array<{ x: number; y: number; m: number }>;
  minima: Array<{ x: number; y: number; m: number }>;
  zeroCount: number;
  extremumCount: number;
  isMonotone: boolean;
  monotoneType?: "increasing" | "decreasing" | "none";
}

export function calculateIntervalZeros(
  A: number,
  omega: number,
  phi: number,
  k: number,
  x1: number,
  x2: number,
): IntervalZerosInfo {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const absOmega = Math.abs(omega) > 1e-9 ? Math.abs(omega) : 1;

  const u1 = absOmega * minX + phi;
  const u2 = absOmega * maxX + phi;
  const deltaU = u2 - u1;

  // 找零点：u = m * PI
  const mMin = Math.ceil(u1 / Math.PI - 1e-9);
  const mMax = Math.floor(u2 / Math.PI + 1e-9);

  const zeros: Array<{ x: number; y: number; m: number; isEndpoint: boolean }> =
    [];
  for (let m = mMin; m <= mMax; m++) {
    const xZero = (m * Math.PI - phi) / absOmega;
    if (xZero >= minX - 1e-7 && xZero <= maxX + 1e-7) {
      const isEndpoint =
        Math.abs(xZero - minX) < 1e-4 || Math.abs(xZero - maxX) < 1e-4;
      zeros.push({
        x: xZero,
        y: k,
        m,
        isEndpoint,
      });
    }
  }

  // 找极值点：u = PI/2 + m * PI
  const maxima: Array<{ x: number; y: number; m: number }> = [];
  const minima: Array<{ x: number; y: number; m: number }> = [];

  const mExtMin = Math.ceil((u1 - Math.PI / 2) / Math.PI - 1e-9);
  const mExtMax = Math.floor((u2 - Math.PI / 2) / Math.PI + 1e-9);

  for (let m = mExtMin; m <= mExtMax; m++) {
    const u = Math.PI / 2 + m * Math.PI;
    const xExt = (u - phi) / absOmega;
    if (xExt >= minX - 1e-7 && xExt <= maxX + 1e-7) {
      const isMax = m % 2 === 0 ? A > 0 : A < 0;
      if (isMax) {
        maxima.push({ x: xExt, y: k + Math.abs(A), m });
      } else {
        minima.push({ x: xExt, y: k - Math.abs(A), m });
      }
    }
  }

  const extremumCount = maxima.length + minima.length;
  let isMonotone = false;
  let monotoneType: "increasing" | "decreasing" | "none" = "none";

  if (extremumCount === 0 && deltaU <= Math.PI + 1e-5) {
    isMonotone = true;
    const midX = (minX + maxX) / 2;
    const derivativeSign = A * absOmega * Math.cos(absOmega * midX + phi);
    monotoneType = derivativeSign > 0 ? "increasing" : "decreasing";
  }

  return {
    x1: minX,
    x2: maxX,
    u1,
    u2,
    deltaU,
    zeros,
    maxima,
    minima,
    zeroCount: zeros.length,
    extremumCount,
    isMonotone,
    monotoneType,
  };
}
