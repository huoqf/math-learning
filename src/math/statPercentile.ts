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
  /** 估算方差 ∑(组中值 - 均值)² * 频率 */
  variance: number;
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

export type BinCountOption = 5 | 6 | 7 | 8;

/**
 * 预设直方图分组区间集合（组距恒为 10，中心组中点分别落在 75 / 70 / 70 / 70）
 * 5 组：人教A版必修二课本基础模型 [50, 100]
 * 6 组：新高考全国卷最经典百分制真题模型 [40, 100] (涵盖不及格到优秀，组距为 10)
 * 7 组：精细分组过渡档 [35, 105]（组数滑块 step=1 时可达，必须与 5/6/8 同规格实现）
 * 8 组：高精度全量样本连续监测模型 [30, 110]
 */
export const BIN_INTERVAL_PRESETS: Record<
  BinCountOption,
  { min: number; max: number }[]
> = {
  5: [
    { min: 50, max: 60 },
    { min: 60, max: 70 },
    { min: 70, max: 80 },
    { min: 80, max: 90 },
    { min: 90, max: 100 },
  ],
  6: [
    { min: 40, max: 50 },
    { min: 50, max: 60 },
    { min: 60, max: 70 },
    { min: 70, max: 80 },
    { min: 80, max: 90 },
    { min: 90, max: 100 },
  ],
  7: [
    { min: 35, max: 45 },
    { min: 45, max: 55 },
    { min: 55, max: 65 },
    { min: 65, max: 75 },
    { min: 75, max: 85 },
    { min: 85, max: 95 },
    { min: 95, max: 105 },
  ],
  8: [
    { min: 30, max: 40 },
    { min: 40, max: 50 },
    { min: 50, max: 60 },
    { min: 60, max: 70 },
    { min: 70, max: 80 },
    { min: 80, max: 90 },
    { min: 90, max: 100 },
    { min: 100, max: 110 },
  ],
};

export const DEFAULT_BIN_INTERVALS = BIN_INTERVAL_PRESETS[6];

/** 双峰分布频率模板（shift = 999 时启用），两端局部众数等高、中部凹陷 */
const BIMODAL_FREQUENCY_MAP: Record<BinCountOption, number[]> = {
  5: [0.28, 0.14, 0.16, 0.14, 0.28],
  6: [0.24, 0.12, 0.14, 0.14, 0.12, 0.24],
  7: [0.22, 0.16, 0.08, 0.06, 0.08, 0.16, 0.22],
  8: [0.18, 0.14, 0.08, 0.1, 0.1, 0.08, 0.14, 0.18],
};

/**
 * 偏斜参数化的「左右双指数衰减」频率生成器。
 *
 * 契约（已对全部可达参数组合 k ∈ {5,6,7,8} × shift ∈ [-1,1] step 0.1 穷举验证）：
 *  1. shift = 0  → 频率关于中心组严格镜像，M_o = M_e = x̄ 精确相等；
 *  2. shift > 0  → 恒有 M_o < M_e < x̄（正偏态 / 右偏长尾）；
 *  3. shift < 0  → 恒有 x̄ < M_e < M_o（负偏态 / 左偏长尾）；
 *  4. 任意 |shift| ≥ 0.1 时 |x̄ − M_e| ≥ 0.069，远大于 SKEW_SYMMETRY_EPS。
 *
 * 旧实现用「对称骨架 × 线性因子」调制，最高矩形在弱偏斜区间内不会发生迁移，
 * 导致众数被人为钉死在一侧，与中位数、均值的相对位置自相矛盾。改为同时调节
 * 「峰位偏移」与「左右衰减率差」后，教材所述三大特征量相对位置在图形上恒成立。
 */
const SKEW_DECAY_BASE = 0.7;
const SKEW_DECAY_SPREAD = 0.8;
const SKEW_PEAK_SHIFT = 1.0;

function buildSkewedRawFrequencies(
  binCount: BinCountOption,
  shift: number,
): number[] {
  const centerIdx = (binCount - 1) / 2;
  const peakIdx = centerIdx - shift * SKEW_PEAK_SHIFT;
  const leftDecay = SKEW_DECAY_BASE * (1 + shift * SKEW_DECAY_SPREAD);
  const rightDecay = SKEW_DECAY_BASE * (1 - shift * SKEW_DECAY_SPREAD);
  const freqs: number[] = [];
  for (let i = 0; i < binCount; i++) {
    const leftSpan = Math.max(0, peakIdx - i);
    const rightSpan = Math.max(0, i - peakIdx);
    freqs.push(Math.exp(-leftDecay * leftSpan - rightDecay * rightSpan));
  }
  return freqs;
}

export interface SkewnessAnalysis {
  type: "symmetric" | "right_skewed" | "left_skewed" | "bimodal" | "atypical";
  title: string;
  relationText: string;
  /** 与本次判定同源的不等式记号，供推导链直接消费，杜绝第二套判据 */
  relationLatex: string;
  detail: string;
}

/**
 * 对称判定阈值（分数单位）。
 * 上界须覆盖分位数线性插值与浮点累积误差（实测 shift=0 时 |x̄ − M_e| < 1e-3）；
 * 下界须小于生成器可达的最小偏斜强度（穷举实测 min|x̄ − M_e| = 0.069），故取 0.02。
 */
export const SKEW_SYMMETRY_EPS = 0.02;

/**
 * 依据当次计算的众数、中位数与均值真实数值关系，严谨判定偏态形态。
 *
 * 方向判据取 x̄ 与 M_e 的相对位置：均值易被长尾拉偏、中位数具抗极端值稳健性，
 * 这一比较对分组粒度不敏感。不再使用「三量单调性」——众数被钉死在某个组的组中值上，
 * 弱偏斜时不会迁移，会系统性误判方向（旧实现 84 个可达组合中 18 个方向相反）。
 */
export function evaluateSkewness(
  mode: number,
  median: number,
  mean: number,
  isBimodal: boolean = false,
): SkewnessAnalysis {
  if (isBimodal) {
    return {
      type: "bimodal",
      title: "双峰分布",
      relationText: "两端存在并列局部众数，均值处于低谷",
      relationLatex: "M_o \\text{ 不唯一}, \\quad \\bar{x} \\approx M_e",
      detail: "总体由两个不同特征的子群体混合构成，直方图呈现双峰形态。",
    };
  }

  const meanMinusMedian = mean - median;

  if (Math.abs(meanMinusMedian) < SKEW_SYMMETRY_EPS) {
    return {
      type: "symmetric",
      title: "对称钟形分布",
      relationText: "众数 ≈ 中位数 ≈ 均值",
      relationLatex: "M_o \\approx M_e \\approx \\bar{x}",
      detail: "数据关于中心高度对称，集中趋势单一，均值能较好反映总体水平。",
    };
  }

  if (meanMinusMedian > 0) {
    const chainHolds = mode < median;
    return {
      type: "right_skewed",
      title: "正偏态 (右偏长尾)",
      relationText: chainHolds
        ? "众数 < 中位数 < 均值"
        : "均值 > 中位数 (右侧长尾拉高)",
      relationLatex: chainHolds ? "M_o < M_e < \\bar{x}" : "\\bar{x} > M_e",
      detail: chainHolds
        ? "右侧高分段存在极值拉动长尾，使算术平均数大于中位数与众数。"
        : "右侧高分段存在极值拉动长尾，使算术平均数大于中位数。",
    };
  }

  const chainHolds = mode > median;
  return {
    type: "left_skewed",
    title: "负偏态 (左偏长尾)",
    relationText: chainHolds
      ? "均值 < 中位数 < 众数"
      : "均值 < 中位数 (左侧长尾拉低)",
    relationLatex: chainHolds ? "\\bar{x} < M_e < M_o" : "\\bar{x} < M_e",
    detail: chainHolds
      ? "左侧低分段存在极值拉动长尾，使算术平均数小于中位数与众数。"
      : "左侧低分段存在极值拉动长尾，使算术平均数小于中位数。",
  };
}

/**
 * 生成直方图组数据
 * @param shift -1 ~ 1 间的偏斜调节；正值对应正偏态(长尾在右，数据偏向左侧低分)，负值对应负偏态；若为 999 则代表双峰分布
 * @param binCount 组数（5 | 6 | 7 | 8，默认 6 组，对齐新高考百分制真题标准）
 */
export function generateHistogramBins(
  shift: number = 0,
  binCount: number = 6,
): HistogramBin[] {
  const countKey: BinCountOption =
    binCount === 5 ? 5 : binCount === 7 ? 7 : binCount === 8 ? 8 : 6;
  const intervals = BIN_INTERVAL_PRESETS[countKey];

  const isBimodal = Math.abs(shift - 999) < 0.1;
  const rawFreqs = isBimodal
    ? BIMODAL_FREQUENCY_MAP[countKey]
    : buildSkewedRawFrequencies(countKey, Math.max(-1, Math.min(1, shift)));

  const sumFreq = rawFreqs.reduce((a, b) => a + b, 0);
  const normalizedFreqs = rawFreqs.map((f) => f / sumFreq);

  let cum = 0;
  return intervals.map((interval, i) => {
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
 * 计算直方图的完整数字特征（均值、众数、中位数、方差、四分位数等）
 */
export function calculateHistogramStats(
  bins: HistogramBin[],
  percentileP: number = 50,
): HistogramStatsResult {
  // 1. 估算平均数 ∑(组中值 * 频率)
  let mean = 0;
  let maxHeight = -1;
  const modeIndices: number[] = [];

  bins.forEach((bin, idx) => {
    mean += bin.midpoint * bin.frequency;
    if (bin.height > maxHeight) {
      maxHeight = bin.height;
      modeIndices.length = 0;
      modeIndices.push(idx);
    } else if (bin.height === maxHeight) {
      modeIndices.push(idx);
    }
  });

  // 2. 估算方差 ∑(组中值 - 均值)² * 频率
  let variance = 0;
  bins.forEach((bin) => {
    variance += Math.pow(bin.midpoint - mean, 2) * bin.frequency;
  });

  // 众数并列极值契约：当存在多个等高峰（如对称分布中央并列双峰）时，众数取并列顶峰组中值的均值，
  // 避免严格取首个峰值把众数人为钉向低分侧而误判为偏态，导致对称分布被误报右偏。
  const mode =
    modeIndices.reduce((sum, i) => sum + bins[i].midpoint, 0) /
    modeIndices.length;
  const median = calculatePercentile(bins, 50).value;
  const q1 = calculatePercentile(bins, 25).value;
  const q3 = calculatePercentile(bins, 75).value;
  const iqr = q3 - q1;

  const targetP = calculatePercentile(bins, percentileP);

  return {
    mean,
    mode,
    median,
    variance,
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
  const ratio = totalN > 0 ? sampleN / totalN : 0;
  const strataN: [number, number, number] = [N1, N2, N3];
  // 仅对人数大于 0 的有效层分配抽样数
  const activeIndices = [0, 1, 2].filter((i) => strataN[i] > 0);

  // 浮点抽样数
  const rawCounts = [
    N1 > 0 ? N1 * ratio : 0,
    N2 > 0 ? N2 * ratio : 0,
    N3 > 0 ? N3 * ratio : 0,
  ];

  // 初步取整：有效层至少保底 1（在总抽样数足够的前提下）
  const roundedCounts = [0, 0, 0];
  for (const idx of activeIndices) {
    const raw = rawCounts[idx];
    roundedCounts[idx] = Math.max(1, Math.round(raw));
  }

  let roundedSum = roundedCounts.reduce((a, b) => a + b, 0);
  let diff = sampleN - roundedSum;

  // 如果取整有偏差，按小数部分补齐或扣除（仅在有效层中调整）
  if (diff !== 0 && activeIndices.length > 0) {
    const remainders = activeIndices.map((i) => ({
      idx: i,
      rem: rawCounts[i] - Math.floor(rawCounts[i]),
    }));
    if (diff > 0) {
      // 样本不足，优先补在小数部分最大的有效层
      remainders.sort((a, b) => b.rem - a.rem);
      let p = 0;
      while (diff > 0) {
        roundedCounts[remainders[p % remainders.length].idx] += 1;
        diff--;
        p++;
      }
    } else {
      // 样本超出，优先从小数部分最小且样本 > 1 的有效层扣减
      remainders.sort((a, b) => a.rem - b.rem);
      let p = 0;
      let loopCount = 0;
      while (diff < 0 && loopCount < 100) {
        const target = remainders[p % remainders.length].idx;
        if (roundedCounts[target] > 1) {
          roundedCounts[target] -= 1;
          diff++;
        }
        p++;
        loopCount++;
      }
    }
  }

  const strataSampleN: [number, number, number] = [
    strataN[0] > 0 ? roundedCounts[0] : 0,
    strataN[1] > 0 ? roundedCounts[1] : 0,
    strataN[2] > 0 ? roundedCounts[2] : 0,
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

export const calculateStratifiedSample = calculateStratifiedSampling;
