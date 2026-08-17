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
 * 偏态正态分布 (Skew Normal Distribution) 概率密度函数
 * 用于模拟现实教学中左偏/右偏的频率直方图
 * @param x 自变量
 * @param mu 位置参数 (均值中心)
 * @param sigma 尺度参数
 * @param alpha 偏度系数 (alpha > 0 右偏，alpha < 0 左偏，alpha = 0 标准正态)
 */
export function skewNormalPdf(
  x: number,
  mu: number,
  sigma: number,
  alpha: number = 0,
): number {
  if (sigma <= 0) return 0;
  const phi = normalPdf(x, mu, sigma);
  if (Math.abs(alpha) < 1e-4) return phi;
  const z = (x - mu) / sigma;
  const capitalPhi = standardNormalCdf(alpha * z);
  return 2 * phi * capitalPhi;
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
 * 确定性生成符合正态分布或偏态分布的频率分布直方图分组数据
 * 在 [mu - 3.5*sigma, mu + 3.5*sigma] 范围内均匀切分 binCount 个组
 * @param skewness 偏度参数，-1 (左偏) ~ 0 (对称正态) ~ 1 (右偏)
 */
export function generateHistogramBins(
  mu: number,
  sigma: number,
  binCount: number,
  sampleSize: number,
  skewness: number = 0,
): HistogramBin[] {
  const safeBinCount = Math.max(4, Math.min(30, Math.round(binCount)));
  const safeSigma = Math.max(0.1, sigma);
  const safeSampleSize = Math.max(10, Math.round(sampleSize));

  // 确定数据范围
  const rangeWidth = 7 * safeSigma; // [-3.5sigma, 3.5sigma]
  const startX = mu - 3.5 * safeSigma;
  const binWidth = rangeWidth / safeBinCount;

  const bins: HistogramBin[] = [];
  const alpha = skewness * 4; // 偏度系数放大

  // 采样各区间概率
  let rawCounts: number[] = [];
  let totalRawCount = 0;

  for (let i = 0; i < safeBinCount; i++) {
    const xStart = startX + i * binWidth;
    const xEnd = xStart + binWidth;
    const mid = (xStart + xEnd) / 2;

    let p: number;
    if (Math.abs(alpha) < 1e-3) {
      p = calcIntervalProbability(mu, safeSigma, xStart, xEnd);
    } else {
      // 采用 Simpson 数值积分近似偏态概率
      const pMid = skewNormalPdf(mid, mu, safeSigma, alpha);
      const pStart = skewNormalPdf(xStart, mu, safeSigma, alpha);
      const pEnd = skewNormalPdf(xEnd, mu, safeSigma, alpha);
      p = ((pStart + 4 * pMid + pEnd) / 6) * binWidth;
    }

    const count = Math.max(0, Math.round(p * safeSampleSize));
    rawCounts.push(count);
    totalRawCount += count;
  }

  // 防止因为取整导致总样本量偏移
  if (totalRawCount === 0) {
    rawCounts[Math.floor(safeBinCount / 2)] = safeSampleSize;
    totalRawCount = safeSampleSize;
  }

  // 构建直方图各个组
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
  mode: number; // 众数估算值 (最高矩形底边中点)
  median: number; // 中位数估算值 (平分面积)
  mean: number; // 平均数估算值 (离散加权均值)
  totalArea: number; // 直方图总面积（恒等于1）
  q1: number; // 第25%百分位数（下四分位数）
  q3: number; // 第75%百分位数（上四分位数）
  percentilePValue: number; // 指定百分位 p 的插值估计值
}

/**
 * 根据直方图各组数据估计样本的统计数字特征
 * @param bins 直方图各组数据
 * @param targetPercentile 指定百分位数探究值 (0~100，如 50 代表中位数)
 */
export function estimateHistogramStats(
  bins: HistogramBin[],
  targetPercentile: number = 50,
): HistogramStats {
  if (bins.length === 0) {
    return {
      mode: 0,
      median: 0,
      mean: 0,
      totalArea: 0,
      q1: 0,
      q3: 0,
      percentilePValue: 0,
    };
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
    totalArea += bin.density * bin.width;
  }

  // 通用百分位数求值辅助函数
  const getPercentile = (pRate: number): number => {
    let cumFreq = 0;
    for (const bin of bins) {
      if (cumFreq + bin.frequency >= pRate) {
        const neededFreq = pRate - cumFreq;
        const fraction = bin.frequency > 0 ? neededFreq / bin.frequency : 0.5;
        return bin.xStart + fraction * bin.width;
      }
      cumFreq += bin.frequency;
    }
    return bins[bins.length - 1].xEnd;
  };

  // 3. 中位数 (50%)、下四分位数 (25%)、上四分位数 (75%) 与任意百分位 (p%)
  const median = getPercentile(0.5);
  const q1 = getPercentile(0.25);
  const q3 = getPercentile(0.75);
  const pClamped = Math.max(0.01, Math.min(0.99, targetPercentile / 100));
  const percentilePValue = getPercentile(pClamped);

  return {
    mode,
    median,
    mean,
    totalArea,
    q1,
    q3,
    percentilePValue,
  };
}

/**
 * 计算 3-Sigma 标准区间概率
 */
export function getThreeSigmaIntervals(mu: number, sigma: number) {
  const safeSigma = Math.max(0.1, sigma);
  return [
    {
      k: 1,
      label: "[μ-σ, μ+σ]",
      formula: `[\\color{#EF4444}{${(mu - safeSigma).toFixed(1)}}, \\color{#EF4444}{${(mu + safeSigma).toFixed(1)}}]`,
      prob: calcIntervalProbability(
        mu,
        safeSigma,
        mu - safeSigma,
        mu + safeSigma,
      ),
      expected: 0.6827,
      x1: mu - safeSigma,
      x2: mu + safeSigma,
    },
    {
      k: 2,
      label: "[μ-2σ, μ+2σ]",
      formula: `[\\color{#EF4444}{${(mu - 2 * safeSigma).toFixed(1)}}, \\color{#EF4444}{${(mu + 2 * safeSigma).toFixed(1)}}]`,
      prob: calcIntervalProbability(
        mu,
        safeSigma,
        mu - 2 * safeSigma,
        mu + 2 * safeSigma,
      ),
      expected: 0.9545,
      x1: mu - 2 * safeSigma,
      x2: mu + 2 * safeSigma,
    },
    {
      k: 3,
      label: "[μ-3σ, μ+3σ]",
      formula: `[\\color{#EF4444}{${(mu - 3 * safeSigma).toFixed(1)}}, \\color{#EF4444}{${(mu + 3 * safeSigma).toFixed(1)}}]`,
      prob: calcIntervalProbability(
        mu,
        safeSigma,
        mu - 3 * safeSigma,
        mu + 3 * safeSigma,
      ),
      expected: 0.9973,
      x1: mu - 3 * safeSigma,
      x2: mu + 3 * safeSigma,
    },
  ];
}

/**
 * 高考对称性区间求解计算器
 * 给定 x0，求其关于 μ 的对称点 x_sym = 2μ - x0，以及对应单侧与双侧对称概率
 */
export function calcSymmetricNormalIntervals(
  mu: number,
  sigma: number,
  x0: number,
) {
  const safeSigma = Math.max(0.1, sigma);
  const xSym = 2 * mu - x0;
  const leftX = Math.min(x0, xSym);
  const rightX = Math.max(x0, xSym);

  // 单侧尾部概率 P(X <= leftX) = P(X >= rightX)
  const tailProb = normalCdf(leftX, mu, safeSigma);
  // 中间对称概率 P(leftX <= X <= rightX) = 1 - 2*tailProb
  const centerProb = Math.max(0, 1 - 2 * tailProb);
  // 标准化值
  const zLeft = (leftX - mu) / safeSigma;
  const zRight = (rightX - mu) / safeSigma;

  return {
    x0,
    xSym,
    leftX,
    rightX,
    tailProb,
    centerProb,
    zLeft,
    zRight,
  };
}
