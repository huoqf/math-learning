/**
 * src/math/statSamplingFeatures.ts
 * 必修二第 9 章：随机抽样、箱线图与数据数字特征纯数学层（Zero Side-effects）
 */

export type StatSamplingMode = "sampling" | "linearTransform" | "outlierImpact";

export interface SampleStats {
  n: number;
  sorted: number[];
  min: number;
  max: number;
  range: number;
  mean: number;
  variance: number;
  stdDev: number;
  q1: number;
  median: number;
  q3: number;
  iqr: number;
}

export interface SamplingStrataResult {
  strata: Array<{
    name: string;
    size: number;
    proportion: number;
    exactQuota: number;
    allocated: number;
  }>;
  totalN: number;
  sampleN: number;
  samplingFraction: number;
  validity: "ok" | "invalid";
}

export interface LinearTransformResult {
  a: number;
  b: number;
  orig: SampleStats;
  transformed: SampleStats;
  meanFormulaCheck: number;
  varFormulaCheck: number;
  stdFormulaCheck: number;
}

export interface OutlierImpactResult {
  base: SampleStats;
  perturbed: SampleStats;
  mode: "moveOutlier" | "insertMean";
  deltaMean: number;
  deltaMedian: number;
  deltaVariance: number;
}

/** 人教A版必修二第 p 百分位数算法 */
export function calcPercentile(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  if (n === 1) return sorted[0];
  const rawIdx = (n * p) / 100;
  if (Number.isInteger(rawIdx)) {
    const i = Math.max(0, Math.min(n - 2, rawIdx - 1));
    return (sorted[i] + sorted[i + 1]) / 2;
  }
  const j = Math.max(0, Math.min(n - 1, Math.ceil(rawIdx) - 1));
  return sorted[j];
}

/** 计算样本均值、总体方差、标准差及五数概括（箱线图） */
export function calcSampleStats(rawData: number[]): SampleStats {
  const valid = rawData.filter((v) => Number.isFinite(v));
  const n = valid.length;
  if (n === 0) {
    return {
      n: 0,
      sorted: [],
      min: 0,
      max: 0,
      range: 0,
      mean: 0,
      variance: 0,
      stdDev: 0,
      q1: 0,
      median: 0,
      q3: 0,
      iqr: 0,
    };
  }
  const sorted = [...valid].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;
  const variance =
    sorted.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / n;
  const stdDev = Math.sqrt(variance);
  const min = sorted[0];
  const max = sorted[n - 1];
  const q1 = calcPercentile(sorted, 25);
  const median = calcPercentile(sorted, 50);
  const q3 = calcPercentile(sorted, 75);
  return {
    n,
    sorted,
    min,
    max,
    range: max - min,
    mean,
    variance,
    stdDev,
    q1,
    median,
    q3,
    iqr: q3 - q1,
  };
}

/** 分层按比例抽样名额分配 */
export function calcSamplingComparison(
  n1Raw: number,
  n2Raw: number,
  n3Raw: number,
  sampleNRaw: number,
): SamplingStrataResult {
  const n1 = Math.max(10, Math.round(n1Raw));
  const n2 = Math.max(10, Math.round(n2Raw));
  const n3 = Math.max(10, Math.round(n3Raw));
  const totalN = n1 + n2 + n3;
  const sampleN = Math.max(1, Math.min(totalN, Math.round(sampleNRaw)));
  if (totalN <= 0) {
    return {
      strata: [],
      totalN: 0,
      sampleN: 0,
      samplingFraction: 0,
      validity: "invalid",
    };
  }
  const samplingFraction = sampleN / totalN;
  const rawQuotas = [
    n1 * samplingFraction,
    n2 * samplingFraction,
    n3 * samplingFraction,
  ];
  const floors = rawQuotas.map((q) => Math.floor(q));
  let remainder = sampleN - floors.reduce((a, b) => a + b, 0);
  const order = rawQuotas
    .map((q, idx) => ({ idx, frac: q - floors[idx] }))
    .sort((a, b) => b.frac - a.frac);
  const allocated = [...floors];
  for (let i = 0; i < remainder; i++) {
    allocated[order[i % order.length].idx] += 1;
  }

  const names = ["高一", "高二", "高三"];
  const sizes = [n1, n2, n3];

  return {
    strata: names.map((name, idx) => ({
      name,
      size: sizes[idx],
      proportion: sizes[idx] / totalN,
      exactQuota: rawQuotas[idx],
      allocated: allocated[idx],
    })),
    totalN,
    sampleN,
    samplingFraction,
    validity: "ok",
  };
}

/** 数据线性变换 y_i = a * x_i + b */
export function calcLinearTransformStats(
  baseData: number[],
  a: number,
  b: number,
): LinearTransformResult {
  const orig = calcSampleStats(baseData);
  const transformedData = baseData.map((x) => a * x + b);
  const transformed = calcSampleStats(transformedData);
  return {
    a,
    b,
    orig,
    transformed,
    meanFormulaCheck: a * orig.mean + b,
    varFormulaCheck: a * a * orig.variance,
    stdFormulaCheck: Math.abs(a) * orig.stdDev,
  };
}

/** 异常值偏移与插入均值对数字特征的影响 */
export function calcOutlierSensitivity(
  baseData: number[],
  outlierVal: number,
  insertMeanMode: boolean,
): OutlierImpactResult {
  const base = calcSampleStats(baseData);
  const perturbedData = insertMeanMode
    ? [...baseData, base.mean]
    : [...baseData.slice(0, -1), outlierVal];
  const perturbed = calcSampleStats(perturbedData);
  return {
    base,
    perturbed,
    mode: insertMeanMode ? "insertMean" : "moveOutlier",
    deltaMean: perturbed.mean - base.mean,
    deltaMedian: perturbed.median - base.median,
    deltaVariance: perturbed.variance - base.variance,
  };
}
