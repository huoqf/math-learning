/**
 * src/math/statPercentile.ts
 * 统计分析纯数学计算层：直方图、百分位数与分层抽样
 * 零 React/DOM/window 副作用
 */

export interface HistogramBin {
  /** 区间左端点 */
  xMin: number;
  /** 区间右端点 */
  xMax: number;
  /** 组距 */
  width: number;
  /** 组中值 */
  midpoint: number;
  /** 频率 f_i (0~1) */
  frequency: number;
  /** 纵轴高度 h_i = frequency / width */
  height: number;
  /** 累积频率 F_i */
  cumFrequency: number;
}

export interface HistogramStatsResult {
  /** 估算平均数 ∑(组中值 * 频率) */
  mean: number;
  /** 众数（最高矩形组中值） */
  mode: number;
  /** 估算中位数 (50% 百分位数) */
  median: number;
  /** 25% 百分位数 (下四分位数 Q1) */
  q1: number;
  /** 75% 百分位数 (上四分位数 Q3) */
  q3: number;
  /** 四分位距 IQR = Q3 - Q1 */
  iqr: number;
  /** 当前指定 p% 百分位数的估算值 */
  percentileVal: number;
  /** 指定 p% 百分位落在哪一个 bin 索引 */
  percentileBinIndex: number;
}

export interface StratifiedResult {
  /** 总体总人数 N */
  totalN: number;
  /** 抽样总数 n */
  sampleN: number;
  /** 抽样比 f = n / N */
  samplingRatio: number;
  /** 各层总体人数 N_i */
  strataN: [number, number, number];
  /** 各层分配抽样数 n_i (和恰好等于 sampleN) */
  strataSampleN: [number, number, number];
  /** 各层权重 w_i = N_i / N */
  strataWeights: [number, number, number];
  /** 各层均值 */
  strataMeans: [number, number, number];
  /** 各层方差 */
  strataVars: [number, number, number];
  /** 总体加权均值 x̄ = ∑ w_i x̄_i */
  totalMean: number;
  /** 总体加权方差 s² = ∑ w_i [s_i² + (x̄_i - x̄)²] */
  totalVar: number;
  /** 总体标准差 s = √totalVar */
  totalStd: number;
}

/**
 * 预设数据分布样本
 * 提供标准的 5 组数据：如 [50,60), [60,70), [70,80), [80,90), [90,100)
 */
export const DEFAULT_BIN_INTERVALS = [
  { min: 50, max: 60 },
  { min: 60, max: 70 },
  { min: 70, max: 80 },
  { min: 80, max: 90 },
  { min: 90, max: 100 },
];

/** 基础预设频率配置 */
const BASE_FREQUENCIES = [0.1, 0.25, 0.35, 0.2, 0.1];

/**
 * 根据偏斜参数 shift 生成归一化的直方图分组数据
 * @param shift -1 ~ 1 间的偏斜调节
 */
export function generateHistogramBins(shift: number = 0): HistogramBin[] {
  // 调整频数分布
  const rawFreqs = BASE_FREQUENCIES.map((f, idx) => {
    // 根据 idx 与 shift 微调
    const factor = 1 + shift * (idx - 2) * 0.4;
    return Math.max(0.04, f * factor);
  });
  const sumFreq = rawFreqs.reduce((a, b) => a + b, 0);
  const normalizedFreqs = rawFreqs.map((f) => f / sumFreq);

  let cum = 0;
  return DEFAULT_BIN_INTERVALS.map((interval, i) => {
    const freq = normalizedFreqs[i];
    cum += freq;
    const width = interval.max - interval.min;
    return {
      xMin: interval.min,
      xMax: interval.max,
      width,
      midpoint: (interval.min + interval.max) / 2,
      frequency: freq,
      height: freq / width,
      cumFrequency: cum,
    };
  });
}

/**
 * 高考线性插值计算百分位数 P_p (p ∈ (0, 100))
 * 极简公式：L + (p/100 - F_prev) / height
 */
export function calculatePercentile(
  bins: HistogramBin[],
  pPercentage: number,
): { value: number; binIndex: number } {
  const targetRatio = Math.min(0.999, Math.max(0.001, pPercentage / 100));

  let prevCum = 0;
  for (let i = 0; i < bins.length; i++) {
    const bin = bins[i];
    if (bin.cumFrequency >= targetRatio || i === bins.length - 1) {
      const needed = targetRatio - prevCum;
      // 线性插值：y_p = xMin + needed / height
      const val = bin.xMin + needed / bin.height;
      return {
        value: Math.min(bin.xMax, Math.max(bin.xMin, val)),
        binIndex: i,
      };
    }
    prevCum = bin.cumFrequency;
  }

  const last = bins[bins.length - 1];
  return { value: last.xMax, binIndex: bins.length - 1 };
}

/**
 * 计算直方图的完整数字特征（均值、众数、中位数、四分位数等）
 */
export function calculateHistogramStats(
  bins: HistogramBin[],
  percentileP: number = 50,
): HistogramStatsResult {
  // 1. 估算平均数 ∑(组中值 * 频率)
  let mean = 0;
  let maxHeight = -1;
  let modeIndex = 0;

  bins.forEach((bin, idx) => {
    mean += bin.midpoint * bin.frequency;
    if (bin.height > maxHeight) {
      maxHeight = bin.height;
      modeIndex = idx;
    }
  });

  const mode = bins[modeIndex].midpoint;
  const median = calculatePercentile(bins, 50).value;
  const q1 = calculatePercentile(bins, 25).value;
  const q3 = calculatePercentile(bins, 75).value;
  const iqr = q3 - q1;

  const targetP = calculatePercentile(bins, percentileP);

  return {
    mean,
    mode,
    median,
    q1,
    q3,
    iqr,
    percentileVal: targetP.value,
    percentileBinIndex: targetP.binIndex,
  };
}

export interface PercentileShadeBin {
  xMin: number;
  xMax: number;
  height: number;
  isFull: boolean;
  isPartial: boolean;
  fraction: number; // 0~1
}

/**
 * 计算百分位数 P_p 在各矩形 bin 中的覆盖阴影区间
 */
export function calculatePercentileShadeBins(
  bins: HistogramBin[],
  percentileVal: number,
): PercentileShadeBin[] {
  return bins.map((bin) => {
    if (percentileVal <= bin.xMin) {
      return {
        xMin: bin.xMin,
        xMax: bin.xMin,
        height: bin.height,
        isFull: false,
        isPartial: false,
        fraction: 0,
      };
    } else if (percentileVal >= bin.xMax) {
      return {
        xMin: bin.xMin,
        xMax: bin.xMax,
        height: bin.height,
        isFull: true,
        isPartial: false,
        fraction: 1,
      };
    } else {
      const frac = (percentileVal - bin.xMin) / bin.width;
      return {
        xMin: bin.xMin,
        xMax: percentileVal,
        height: bin.height,
        isFull: false,
        isPartial: true,
        fraction: Math.max(0, Math.min(1, frac)),
      };
    }
  });
}

/**
 * 分层抽样按比例分配与总均值、总方差推导
 */
export function calculateStratifiedSampling(
  sampleN: number,
  N1: number,
  N2: number,
  N3: number,
  mean1: number,
  mean2: number,
  mean3: number,
  var1: number,
  var2: number,
  var3: number,
): StratifiedResult {
  const totalN = N1 + N2 + N3;
  const ratio = sampleN / totalN;

  // 浮点抽样数
  const rawCounts = [N1 * ratio, N2 * ratio, N3 * ratio];
  // 四舍五入取整
  const roundedCounts = rawCounts.map((v) => Math.round(v));
  const roundedSum = roundedCounts.reduce((a, b) => a + b, 0);
  const diff = sampleN - roundedSum;

  // 如果取整有尾数偏差，补在余数最大的那一层
  if (diff !== 0) {
    const remainders = rawCounts.map((v, i) => ({
      idx: i,
      rem: v - Math.floor(v),
    }));
    remainders.sort((a, b) => b.rem - a.rem);
    roundedCounts[remainders[0].idx] += diff;
  }

  const strataN: [number, number, number] = [N1, N2, N3];
  const strataSampleN: [number, number, number] = [
    Math.max(1, roundedCounts[0]),
    Math.max(1, roundedCounts[1]),
    Math.max(1, roundedCounts[2]),
  ];

  const w1 = N1 / totalN;
  const w2 = N2 / totalN;
  const w3 = N3 / totalN;
  const strataWeights: [number, number, number] = [w1, w2, w3];
  const strataMeans: [number, number, number] = [mean1, mean2, mean3];
  const strataVars: [number, number, number] = [var1, var2, var3];

  // 总体加权均值 x̄ = ∑ w_i x̄_i
  const totalMean = w1 * mean1 + w2 * mean2 + w3 * mean3;

  // 总体加权方差 s² = ∑ w_i [s_i² + (x̄_i - x̄)²]
  const term1 = w1 * (var1 + Math.pow(mean1 - totalMean, 2));
  const term2 = w2 * (var2 + Math.pow(mean2 - totalMean, 2));
  const term3 = w3 * (var3 + Math.pow(mean3 - totalMean, 2));
  const totalVar = term1 + term2 + term3;
  const totalStd = Math.sqrt(totalVar);

  return {
    totalN,
    sampleN,
    samplingRatio: ratio,
    strataN,
    strataSampleN,
    strataWeights,
    strataMeans,
    strataVars,
    totalMean,
    totalVar,
    totalStd,
  };
}
