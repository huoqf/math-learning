/**
 * 频率分布直方图与正态分布纯数学计算函数
 * 严禁引入 React / DOM / window / Store
 */

/**
 * 误差函数 erf 近似计算 (用于正态分布 CDF)
 * 经典数值逼近法，最大误差 < 1.5e-7
 */
export function erf(x: number): number {
  // sign
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);

  // constants
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * 正态分布概率密度函数 f(x)
 * f(x) = (1 / (sqrt(2*pi)*sigma)) * exp(-(x-mu)^2 / (2*sigma^2))
 */
export function normalPdf(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return 0;
  const normCoeff = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
  return normCoeff * Math.exp(exponent);
}

/**
 * 标准正态分布累积分布函数 \Phi(z)
 */
export function standardNormalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * 一般正态分布累积分布函数 F(x) = P(X <= x)
 */
export function normalCdf(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return x >= mu ? 1 : 0;
  const z = (x - mu) / sigma;
  return standardNormalCdf(z);
}

/**
 * 正态分布区间概率 P(x1 <= X <= x2)
 */
export function calcIntervalProbability(
  mu: number,
  sigma: number,
  x1: number,
  x2: number,
): number {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const p1 = normalCdf(minX, mu, sigma);
  const p2 = normalCdf(maxX, mu, sigma);
  return Math.max(0, p2 - p1);
}

export interface HistogramBin {
  index: number;
  xStart: number;
  xEnd: number;
  mid: number;
  width: number;
  count: number;
  frequency: number;
  density: number; // 频率 / 组距（直方图纵轴）
}

/**
 * 确定性生成符合正态分布的频率分布直方图分组数据
 * 在 [mu - 3.5*sigma, mu + 3.5*sigma] 范围内均匀切分 binCount 个组
 */
export function generateHistogramBins(
  mu: number,
  sigma: number,
  binCount: number,
  sampleSize: number,
): HistogramBin[] {
  const safeBinCount = Math.max(4, Math.min(30, Math.round(binCount)));
  const safeSigma = Math.max(0.1, sigma);
  const safeSampleSize = Math.max(10, Math.round(sampleSize));

  // 确定数据范围
  const rangeWidth = 7 * safeSigma; // [-3.5sigma, 3.5sigma]
  const startX = mu - 3.5 * safeSigma;
  const binWidth = rangeWidth / safeBinCount;

  const bins: HistogramBin[] = [];

  // 利用 CDF 区间概率估算各 bin 的理论概率，并进行离散样本量取整与归一化
  let rawCounts: number[] = [];
  let totalRawCount = 0;

  for (let i = 0; i < safeBinCount; i++) {
    const xStart = startX + i * binWidth;
    const xEnd = xStart + binWidth;
    const p = calcIntervalProbability(mu, safeSigma, xStart, xEnd);
    const count = Math.round(p * safeSampleSize);
    rawCounts.push(count);
    totalRawCount += count;
  }

  // 防止因为取整导致总样本量偏移
  if (totalRawCount === 0) {
    rawCounts[Math.floor(safeBinCount / 2)] = safeSampleSize;
    totalRawCount = safeSampleSize;
  }

  // 构建真正的 bin 对象
  for (let i = 0; i < safeBinCount; i++) {
    const xStart = startX + i * binWidth;
    const xEnd = xStart + binWidth;
    const mid = (xStart + xEnd) / 2;
    const count = rawCounts[i];
    const frequency = count / totalRawCount;
    const density = frequency / binWidth;

    bins.push({
      index: i,
      xStart,
      xEnd,
      mid,
      width: binWidth,
      count,
      frequency,
      density,
    });
  }

  return bins;
}

export interface HistogramStats {
  mode: number; // 众数估算值
  median: number; // 中位数估算值
  mean: number; // 平均数估算值
  totalArea: number; // 直方图总面积（理论应为1）
}

/**
 * 根据直方图各组数据估计样本的统计数字特征
 */
export function estimateHistogramStats(bins: HistogramBin[]): HistogramStats {
  if (bins.length === 0) {
    return { mode: 0, median: 0, mean: 0, totalArea: 0 };
  }

  // 1. 众数：最高矩形底边中点
  let maxDensity = -1;
  let mode = bins[0].mid;
  for (const bin of bins) {
    if (bin.density > maxDensity) {
      maxDensity = bin.density;
      mode = bin.mid;
    }
  }

  // 2. 平均数：各个组中点 * 对应频率 之和
  let mean = 0;
  let totalArea = 0;
  for (const bin of bins) {
    mean += bin.mid * bin.frequency;
    totalArea += bin.density * bin.width; // 应该是1.0左右
  }

  // 3. 中位数：使左右累计频率各自达到 0.5 的 x 坐标（矩形内线性插值）
  let median = bins[0].mid;
  let cumFreq = 0;
  for (const bin of bins) {
    if (cumFreq + bin.frequency >= 0.5) {
      // 在此 bin 内部进行插值
      const neededFreq = 0.5 - cumFreq;
      const fraction = bin.frequency > 0 ? neededFreq / bin.frequency : 0.5;
      median = bin.xStart + fraction * bin.width;
      break;
    }
    cumFreq += bin.frequency;
  }

  return {
    mode,
    median,
    mean,
    totalArea,
  };
}

/**
 * 计算 3-Sigma 标准区间概率
 */
export function getThreeSigmaIntervals(mu: number, sigma: number) {
  return [
    {
      label: "[μ-σ, μ+σ]",
      prob: calcIntervalProbability(mu, sigma, mu - sigma, mu + sigma),
      expected: 0.6827,
      x1: mu - sigma,
      x2: mu + sigma,
    },
    {
      label: "[μ-2σ, μ+2σ]",
      prob: calcIntervalProbability(mu, sigma, mu - 2 * sigma, mu + 2 * sigma),
      expected: 0.9545,
      x1: mu - 2 * sigma,
      x2: mu + 2 * sigma,
    },
    {
      label: "[μ-3σ, μ+3σ]",
      prob: calcIntervalProbability(mu, sigma, mu - 3 * sigma, mu + 3 * sigma),
      expected: 0.9973,
      x1: mu - 3 * sigma,
      x2: mu + 3 * sigma,
    },
  ];
}
