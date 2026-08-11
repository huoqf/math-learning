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
  title?: string;
  expression: string;
  fn: (x: number) => number;
  description: string;
  explanation?: string;
}

export function formatPiValue(val: number): string {
  if (Math.abs(val) < 1e-4) return "0";
  const ratio = val / Math.PI;
  if (Math.abs(ratio - 1) < 1e-4) return "π";
  if (Math.abs(ratio + 1) < 1e-4) return "-π";
  if (Math.abs(ratio - 0.5) < 1e-4) return "π/2";
  if (Math.abs(ratio + 0.5) < 1e-4) return "-π/2";
  if (Math.abs(ratio - 1 / 3) < 1e-4) return "π/3";
  if (Math.abs(ratio + 1 / 3) < 1e-4) return "-π/3";
  if (Math.abs(ratio - 2 / 3) < 1e-4) return "2π/3";
  if (Math.abs(ratio + 2 / 3) < 1e-4) return "-2π/3";
  if (Math.abs(ratio - 0.25) < 1e-4) return "π/4";
  if (Math.abs(ratio + 0.25) < 1e-4) return "-π/4";
  if (Math.abs(ratio - 0.75) < 1e-4) return "3π/4";
  if (Math.abs(ratio + 0.75) < 1e-4) return "-3π/4";
  if (Math.abs(ratio - 1 / 6) < 1e-4) return "π/6";
  if (Math.abs(ratio + 1 / 6) < 1e-4) return "-π/6";

  return val.toFixed(2);
}

export function calcTrigProperties(
  A: number,
  omega: number,
  phi: number,
  k: number,
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

  const symmetryAxes = [
    (Math.PI / 2 - phi) / absOmega,
    ((3 * Math.PI) / 2 - phi) / absOmega,
  ];

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

export function calcFivePoints(
  A: number,
  omega: number,
  phi: number,
  k: number,
) {
  return calcTrigProperties(A, omega, phi, k).fivePoints;
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

  if (pathType === "shift-first") {
    const direction = phi >= 0 ? "左" : "右";
    const absPhiStr = formatPiValue(Math.abs(phi));
    return [
      {
        step: 0,
        name: "基准图象",
        title: "基准图象",
        expression: "y = \\sin x",
        fn: (x: number) => Math.sin(x),
        description: "起点：基础正弦曲线 y = sin x",
        explanation: "起点：基础正弦曲线 y = sin x",
      },
      {
        step: 1,
        name: "第一步：相位平移",
        title: "第一步：相位平移",
        expression: `y = \\sin(x + ${phiStr})`,
        fn: (x: number) => Math.sin(x + phi),
        description: `沿 x 轴向${direction}平移 ${absPhiStr} 个单位`,
        explanation: `沿 x 轴向${direction}平移 ${absPhiStr} 个单位`,
      },
      {
        step: 2,
        name: "第二步：周期伸缩",
        title: "第二步：周期伸缩",
        expression: `y = \\sin(${omega}x + ${phiStr})`,
        fn: (x: number) => Math.sin(omega * x + phi),
        description: `横向伸缩为原来的 1/${absOmega}，周期变为 T = 2π/${absOmega}`,
        explanation: `横向伸缩为原来的 1/${absOmega}，周期变为 T = 2π/${absOmega}`,
      },
      {
        step: 3,
        name: "第三步：振幅伸缩",
        title: "第三步：振幅伸缩",
        expression: `y = ${A}\\sin(${omega}x + ${phiStr})`,
        fn: (x: number) => A * Math.sin(omega * x + phi),
        description: `纵向伸缩 A = ${A} 倍`,
        explanation: `纵向伸缩 A = ${A} 倍`,
      },
      {
        step: 4,
        name: "第四步：偏置平移",
        title: "第四步：偏置平移",
        expression: `y = ${A}\\sin(${omega}x + ${phiStr}) + ${k}`,
        fn: (x: number) => A * Math.sin(omega * x + phi) + k,
        description: `沿 y 轴平移 k = ${k}，平衡位置变为 y = ${k}`,
        explanation: `沿 y 轴平移 k = ${k}，平衡位置变为 y = ${k}`,
      },
    ];
  } else {
    const direction = shiftAmountPath2 >= 0 ? "左" : "右";
    const absShiftStr = formatPiValue(Math.abs(shiftAmountPath2));
    return [
      {
        step: 0,
        name: "基准图象",
        title: "基准图象",
        expression: "y = \\sin x",
        fn: (x: number) => Math.sin(x),
        description: "起点：基础正弦曲线 y = sin x",
        explanation: "起点：基础正弦曲线 y = sin x",
      },
      {
        step: 1,
        name: "第一步：周期伸缩",
        title: "第一步：周期伸缩",
        expression: `y = \\sin(${omega}x)`,
        fn: (x: number) => Math.sin(omega * x),
        description: `横向伸缩为原来的 1/${absOmega}`,
        explanation: `横向伸缩为原来的 1/${absOmega}`,
      },
      {
        step: 2,
        name: "第二步：相位平移",
        title: "第二步：相位平移",
        expression: `y = \\sin(${omega}(x + ${shiftAmountPath2Str})) = \\sin(${omega}x + ${phiStr})`,
        fn: (x: number) => Math.sin(omega * x + phi),
        description: `沿 x 轴向${direction}平移 φ/ω = ${absShiftStr} 个单位`,
        explanation: `沿 x 轴向${direction}平移 φ/ω = ${absShiftStr} 个单位`,
      },
      {
        step: 3,
        name: "第三步：振幅伸缩",
        title: "第三步：振幅伸缩",
        expression: `y = ${A}\\sin(${omega}x + ${phiStr})`,
        fn: (x: number) => A * Math.sin(omega * x + phi),
        description: `纵向伸缩 A = ${A} 倍`,
        explanation: `纵向伸缩 A = ${A} 倍`,
      },
      {
        step: 4,
        name: "第四步：偏置平移",
        title: "第四步：偏置平移",
        expression: `y = ${A}\\sin(${omega}x + ${phiStr}) + ${k}`,
        fn: (x: number) => A * Math.sin(omega * x + phi) + k,
        description: `沿 y 轴平移 k = ${k}`,
        explanation: `沿 y 轴平移 k = ${k}`,
      },
    ];
  }
}
