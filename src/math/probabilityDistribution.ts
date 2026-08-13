/**
 * 离散型随机变量分布列与数字特征核心计算逻辑
 * 包含：二项分布 B(n, p)、超几何分布 H(N, M, n)、一般离散分布与线性变换 Y = aX + b
 * 纯函数逻辑，无 React / DOM 依赖
 */

export interface DiscreteOutcome {
  x: number;
  p: number;
  label?: string;
}

export interface DistributionResult {
  outcomes: DiscreteOutcome[];
  mean: number; // 数学期望 E(X)
  variance: number; // 方差 D(X)
  stdDev: number; // 标准差 σ(X)
  sumP: number; // 概率和 ∑p_i (应该为 1)
  modeX: number[]; // 众数取值
  maxP: number; // 概率峰值
  isValid: boolean;
  invalidReason?: string;
}

/**
 * 组合数 C(n, k)
 */
export function combinations(n: number, k: number): number {
  if (k < 0 || k > n || n < 0) return 0;
  if (k === 0 || k === n) return 1;
  let res = 1;
  const m = Math.min(k, n - k);
  for (let i = 1; i <= m; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

/**
 * 1. 二项分布 X ~ B(n, p)
 */
export function computeBinomialDistribution(
  n: number,
  p: number,
): DistributionResult {
  if (n < 1 || n > 50 || p < 0 || p > 1) {
    return {
      outcomes: [],
      mean: 0,
      variance: 0,
      stdDev: 0,
      sumP: 0,
      modeX: [],
      maxP: 0,
      isValid: false,
      invalidReason: "参数不合法：需满足 1 <= n <= 50, 0 <= p <= 1",
    };
  }

  const outcomes: DiscreteOutcome[] = [];
  let sumP = 0;
  let maxP = -1;

  for (let k = 0; k <= n; k++) {
    const pk = combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    outcomes.push({ x: k, p: pk, label: `${k}` });
    sumP += pk;
    if (pk > maxP) maxP = pk;
  }

  const mean = n * p;
  const variance = n * p * (1 - p);
  const stdDev = Math.sqrt(Math.max(0, variance));

  const modeX = outcomes
    .filter((o) => Math.abs(o.p - maxP) < 1e-7)
    .map((o) => o.x);

  return {
    outcomes,
    mean,
    variance,
    stdDev,
    sumP,
    modeX,
    maxP,
    isValid: true,
  };
}

/**
 * 2. 超几何分布 X ~ H(N, M, n)
 * N: 总体容量
 * M: 总体中含有某种特征的个体数
 * n: 抽取的样本容量
 */
export function computeHypergeometricDistribution(
  N: number,
  M: number,
  n: number,
): DistributionResult {
  if (N < 1 || M < 0 || M > N || n < 1 || n > N) {
    return {
      outcomes: [],
      mean: 0,
      variance: 0,
      stdDev: 0,
      sumP: 0,
      modeX: [],
      maxP: 0,
      isValid: false,
      invalidReason: "退化警示：需满足 1 <= N, 0 <= M <= N, 1 <= n <= N",
    };
  }

  const minK = Math.max(0, n - (N - M));
  const maxK = Math.min(n, M);

  const outcomes: DiscreteOutcome[] = [];
  let sumP = 0;
  let maxP = -1;
  const totalWays = combinations(N, n);

  for (let k = 0; k <= n; k++) {
    let pk = 0;
    if (k >= minK && k <= maxK && totalWays > 0) {
      pk = (combinations(M, k) * combinations(N - M, n - k)) / totalWays;
    }
    outcomes.push({ x: k, p: pk, label: `${k}` });
    sumP += pk;
    if (pk > maxP) maxP = pk;
  }

  const mean = (n * M) / N;
  let variance = 0;
  if (N > 1) {
    variance = n * (M / N) * (1 - M / N) * ((N - n) / (N - 1));
  }
  const stdDev = Math.sqrt(Math.max(0, variance));

  const modeX = outcomes
    .filter((o) => Math.abs(o.p - maxP) < 1e-7)
    .map((o) => o.x);

  return {
    outcomes,
    mean,
    variance,
    stdDev,
    sumP,
    modeX,
    maxP,
    isValid: true,
  };
}

/**
 * 3. 一般离散型分布列计算 (E(X), D(X))
 */
export function computeGeneralDiscreteDistribution(
  outcomesInput: { x: number; p: number; label?: string }[],
): DistributionResult {
  if (!outcomesInput || outcomesInput.length === 0) {
    return {
      outcomes: [],
      mean: 0,
      variance: 0,
      stdDev: 0,
      sumP: 0,
      modeX: [],
      maxP: 0,
      isValid: false,
      invalidReason: "离散分布列为空",
    };
  }

  // 1. 权重累加与自动归一化（保证数学公理 ∑p_i = 1 恒成立）
  let totalWeight = outcomesInput.reduce((acc, o) => acc + Math.max(0, o.p), 0);
  if (totalWeight < 1e-9) totalWeight = 1;

  const normalizedOutcomes: DiscreteOutcome[] = outcomesInput.map((o) => ({
    x: o.x,
    p: Math.max(0, o.p) / totalWeight,
    label: o.label || `${o.x}`,
  }));

  let mean = 0;
  let maxP = -1;

  normalizedOutcomes.forEach((o) => {
    mean += o.x * o.p;
    if (o.p > maxP) maxP = o.p;
  });

  let variance = 0;
  normalizedOutcomes.forEach((o) => {
    variance += Math.pow(o.x - mean, 2) * o.p;
  });

  const stdDev = Math.sqrt(Math.max(0, variance));
  const modeX = normalizedOutcomes
    .filter((o) => Math.abs(o.p - maxP) < 1e-7)
    .map((o) => o.x);

  return {
    outcomes: normalizedOutcomes,
    mean,
    variance,
    stdDev,
    sumP: 1.0,
    modeX,
    maxP,
    isValid: true,
  };
}

/**
 * 4. 线性变换 Y = aX + b
 */
export function computeLinearTransformedDistribution(
  baseResult: DistributionResult,
  a: number,
  b: number,
): {
  transformed: DistributionResult;
  a: number;
  b: number;
} {
  const newOutcomes: DiscreteOutcome[] = baseResult.outcomes.map((o) => {
    const newX = a * o.x + b;
    return {
      x: Number(newX.toFixed(2)),
      p: o.p,
      label: `y=${newX.toFixed(1)}`,
    };
  });

  const mean = a * baseResult.mean + b;
  const variance = a * a * baseResult.variance;
  const stdDev = Math.abs(a) * baseResult.stdDev;

  return {
    transformed: {
      outcomes: newOutcomes,
      mean,
      variance,
      stdDev,
      sumP: baseResult.sumP,
      modeX: baseResult.modeX.map((x) => a * x + b),
      maxP: baseResult.maxP,
      isValid: baseResult.isValid,
      invalidReason: baseResult.invalidReason,
    },
    a,
    b,
  };
}
