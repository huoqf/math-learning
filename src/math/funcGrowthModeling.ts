/**
 * src/math/funcGrowthModeling.ts
 * 必修一第 3.4 & 4.5 节：不同函数增长差异与实际建模纯计算层（Zero Side-effects）
 */

export type FuncGrowthMode =
  "growthRace" | "piecewiseBilling" | "scatterFitting";

export interface GrowthRaceResult {
  a: number;
  powerN: number;
  linearK: number;
  xProbe: number;
  yExp: number;
  yPower: number;
  yLinear: number;
  yLog: number;
  /** 指数函数反超线性与幂函数的近似阈值说明 */
  leaderName: string;
}

export interface PiecewiseBillingResult {
  usage: number;
  tier1Limit: number;
  rate1: number;
  rate2: number;
  rate3: number;
  tier2Limit: number;
  totalCost: number;
  avgCost: number;
  activeTier: 1 | 2 | 3;
}

export interface ScatterFitResult {
  modelType: "linear" | "quadratic" | "exponential";
  points: Array<{ x: number; y: number }>;
  predict: (x: number) => number;
  formulaLatex: string;
  sse: number;
  nextX: number;
  nextPred: number;
}

/** 增长速率赛道实时求值 */
export function calcGrowthRace(
  aRaw: number,
  nRaw: number,
  kRaw: number,
  xProbeRaw: number,
): GrowthRaceResult {
  const a = Math.max(1.1, aRaw);
  const powerN = Math.max(1, Math.min(4, Math.round(nRaw)));
  const linearK = Math.max(1, kRaw);
  const xProbe = Math.max(0.5, xProbeRaw);

  const yExp = Math.pow(a, xProbe);
  const yPower = Math.pow(xProbe, powerN);
  const yLinear = linearK * xProbe;
  const yLog = Math.log(xProbe) / Math.log(a);

  const entries: Array<[string, number]> = [
    ["指数模型 a^x", yExp],
    ["幂模型 x^n", yPower],
    ["一次模型 kx", yLinear],
    ["对数模型 log_a(x)", yLog],
  ];
  entries.sort((p, q) => q[1] - p[1]);

  return {
    a,
    powerN,
    linearK,
    xProbe,
    yExp,
    yPower,
    yLinear,
    yLog,
    leaderName: entries[0][0],
  };
}

/** 阶梯计价分段函数建模 */
export function calcPiecewiseBilling(
  usageRaw: number,
  rate1Raw: number,
  rate2Raw: number,
  rate3Raw: number,
): PiecewiseBillingResult {
  const usage = Math.max(0, usageRaw);
  const tier1Limit = 4;
  const tier2Limit = 8;
  const rate1 = Math.max(0.5, rate1Raw);
  const rate2 = Math.max(rate1, rate2Raw);
  const rate3 = Math.max(rate2, rate3Raw);

  let totalCost = 0;
  let activeTier: 1 | 2 | 3 = 1;
  if (usage <= tier1Limit) {
    totalCost = rate1 * usage;
    activeTier = 1;
  } else if (usage <= tier2Limit) {
    totalCost = rate1 * tier1Limit + rate2 * (usage - tier1Limit);
    activeTier = 2;
  } else {
    totalCost =
      rate1 * tier1Limit +
      rate2 * (tier2Limit - tier1Limit) +
      rate3 * (usage - tier2Limit);
    activeTier = 3;
  }

  const avgCost = usage > 1e-6 ? totalCost / usage : rate1;
  return {
    usage,
    tier1Limit,
    tier2Limit,
    rate1,
    rate2,
    rate3,
    totalCost,
    avgCost,
    activeTier,
  };
}

/** 散点数据经验函数模型拟合与误差平方和对比 */
export function calcScatterFitting(
  modelType: "linear" | "quadratic" | "exponential",
  gainScale = 1.0,
): ScatterFitResult {
  // 模拟真实增长采集数据（呈现明显加速上扬趋势）
  const points = [
    { x: 1, y: 2.0 },
    { x: 2, y: 3.1 },
    { x: 3, y: 4.9 },
    { x: 4, y: 8.1 },
    { x: 5, y: 12.8 },
  ];

  const predict = (x: number) => {
    if (modelType === "linear") {
      return (2.6 * x - 1.7) * gainScale;
    }
    if (modelType === "quadratic") {
      return (0.45 * x * x + 0.05 * x + 1.5) * gainScale;
    }
    return 1.25 * Math.pow(1.6, x) * gainScale;
  };

  const sse = points.reduce((acc, pt) => {
    const diff = pt.y - predict(pt.x);
    return acc + diff * diff;
  }, 0);

  const formulaLatex =
    modelType === "linear"
      ? `y = ${gainScale === 1 ? "2.6x - 1.7" : `${gainScale.toFixed(1)}(2.6x - 1.7)`}`
      : modelType === "quadratic"
        ? `y = ${gainScale === 1 ? "0.45x^2 + 0.05x + 1.5" : `${gainScale.toFixed(1)}(0.45x^2 + 0.05x + 1.5)`}`
        : `y = ${(1.25 * gainScale).toFixed(2)} \\cdot 1.6^x`;

  const nextX = 6;
  return {
    modelType,
    points,
    predict,
    formulaLatex,
    sse,
    nextX,
    nextPred: predict(nextX),
  };
}
