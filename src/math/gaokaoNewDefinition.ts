/**
 * src/math/gaokaoNewDefinition.ts
 * 新高考 19 题新定义与创新压轴纯计算层（Zero Side-effects）
 *
 * 1. 可分数列（对标 2024 新课标 I 卷第 19 题）：精确回溯判定 {1..4m+2} \ {i, j} 是否可划分为 m 个 4 项等差数列
 * 2. 函数迭代不动点与周期轨：y = f(x) 蛛网迭代、不动点稳定性判定与周期检测
 * 3. 曼哈顿广义距离（L1 度量）：L1 菱形“圆”周长/面积与两点等距线折线构造
 */

export type NewDefinitionStudyMode =
  "divisibleSeq" | "fixedPointIter" | "manhattanGeom";

export interface DivisibleSeqResult {
  m: number;
  totalN: number;
  i: number;
  j: number;
  isDivisible: boolean;
  groups: number[][];
  commonDiffs: number[];
  modSummary: string;
  validity: "ok" | "invalid_pair";
}

export interface FixedPointIterResult {
  r: number;
  x0: number;
  steps: number;
  fixedPoint: number;
  derivativeAtFixed: number;
  stability: "attracting" | "neutral" | "repelling_or_periodic";
  trajectory: Array<{ n: number; x: number; fx: number }>;
}

export interface ManhattanGeomResult {
  x0: number;
  y0: number;
  radius: number;
  cDist: number;
  diamondVertices: Array<{ x: number; y: number }>;
  manhattanArea: number;
  euclideanArea: number;
  manhattanPerimeter: number;
  bisectorPoints: Array<{ x: number; y: number }>;
}

/** 精确回溯划分剩余元素为 m 个 4 项等差数列 */
function searchArithmeticQuadPartition(remaining: number[]): number[][] | null {
  if (remaining.length === 0) return [];
  const first = remaining[0];
  const avail = new Set(remaining);
  const maxVal = remaining[remaining.length - 1];

  for (let d = 1; first + 3 * d <= maxVal; d++) {
    const q1 = first + d;
    const q2 = first + 2 * d;
    const q3 = first + 3 * d;
    if (avail.has(q1) && avail.has(q2) && avail.has(q3)) {
      const nextRemaining = remaining.filter(
        (v) => v !== first && v !== q1 && v !== q2 && v !== q3,
      );
      const sub = searchArithmeticQuadPartition(nextRemaining);
      if (sub !== null) {
        return [[first, q1, q2, q3], ...sub];
      }
    }
  }
  return null;
}

/** 判定 (4m+2, i, j)-可分数列并求出一组构造划分 */
export function calcDivisibleSequence(
  mRaw: number,
  iRaw: number,
  jRaw: number,
): DivisibleSeqResult {
  const m = Math.max(1, Math.min(3, Math.round(mRaw)));
  const totalN = 4 * m + 2;
  const i = Math.max(1, Math.min(totalN - 1, Math.round(iRaw)));
  const j = Math.max(1, Math.min(totalN, Math.round(jRaw)));

  if (i >= j) {
    return {
      m,
      totalN,
      i,
      j,
      isDivisible: false,
      groups: [],
      commonDiffs: [],
      modSummary: "须满足 1 ≤ i < j ≤ 4m+2",
      validity: "invalid_pair",
    };
  }

  const remaining: number[] = [];
  for (let val = 1; val <= totalN; val++) {
    if (val !== i && val !== j) {
      remaining.push(val);
    }
  }

  const solution = searchArithmeticQuadPartition(remaining);
  const isDivisible = solution !== null;
  const groups = solution ?? [];
  const commonDiffs = groups.map((g) => g[1] - g[0]);

  return {
    m,
    totalN,
    i,
    j,
    isDivisible,
    groups,
    commonDiffs,
    modSummary: `i ≡ ${i % 4} (mod 4), j ≡ ${j % 4} (mod 4)`,
    validity: "ok",
  };
}

/** 逻辑斯蒂迭代 f(x) = r*x*(1-x) 的不动点与蛛网轨迹 */
export function calcFixedPointIter(
  rRaw: number,
  x0Raw: number,
  stepsRaw: number,
): FixedPointIterResult {
  const r = Math.max(0.5, Math.min(3.55, rRaw));
  const x0 = Math.max(0.05, Math.min(0.95, x0Raw));
  const steps = Math.max(2, Math.min(12, Math.round(stepsRaw)));

  const fixedPoint = r > 1 ? 1 - 1 / r : 0;
  // f'(x) = r*(1 - 2x)
  const derivativeAtFixed = r * (1 - 2 * fixedPoint);
  const absSlope = Math.abs(derivativeAtFixed);

  const stability: FixedPointIterResult["stability"] =
    absSlope < 0.999
      ? "attracting"
      : absSlope <= 1.001
        ? "neutral"
        : "repelling_or_periodic";

  const trajectory: Array<{ n: number; x: number; fx: number }> = [];
  let cur = x0;
  for (let n = 0; n < steps; n++) {
    const next = r * cur * (1 - cur);
    trajectory.push({ n, x: cur, fx: next });
    cur = next;
  }

  return {
    r,
    x0,
    steps,
    fixedPoint,
    derivativeAtFixed,
    stability,
    trajectory,
  };
}

/** 曼哈顿广义距离（L1 度量）：菱形“圆”与两定点 A(-c, -0.8), B(c, 0.8) 折线中垂线 */
export function calcManhattanGeom(
  x0: number,
  y0: number,
  radiusRaw: number,
  cDistRaw: number,
): ManhattanGeomResult {
  const radius = Math.max(0.5, Math.min(3.5, radiusRaw));
  const cDist = Math.max(0.5, Math.min(3.0, cDistRaw));

  const diamondVertices = [
    { x: x0 + radius, y: y0 },
    { x: x0, y: y0 + radius },
    { x: x0 - radius, y: y0 },
    { x: x0, y: y0 - radius },
  ];

  // 对对称定点 A(-c, -1) 和 B(c, 1) 的 L1 等距集（其中 c > 1 时水平段折线清晰）
  const k = Math.min(cDist - 0.1, 1.0);
  const bisectorPoints = [
    { x: -k, y: 4.0 },
    { x: -k, y: k },
    { x: k, y: -k },
    { x: k, y: -4.0 },
  ];

  return {
    x0,
    y0,
    radius,
    cDist,
    diamondVertices,
    manhattanArea: 2 * radius * radius,
    euclideanArea: Math.PI * radius * radius,
    manhattanPerimeter: 4 * Math.SQRT2 * radius,
    bisectorPoints,
  };
}
