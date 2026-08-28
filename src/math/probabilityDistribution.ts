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

/**
 * 5. 双分布对比 (超几何 vs 二项分布同屏逼近 N -> ∞)
 */
export interface DistributionComparisonResult {
  hyperDist: DistributionResult;
  binomDist: DistributionResult;
  varianceCorrectionFactor: number; // (N - n) / (N - 1)
  maxDifference: number; // 两分布各点最大概率绝对偏差
  N: number;
  p: number;
  sampleN: number;
}

export function computeHypergeometricBinomialComparison(
  N: number,
  p: number,
  sampleN: number,
): DistributionComparisonResult {
  const M = Math.round(N * p);
  const hyperDist = computeHypergeometricDistribution(N, M, sampleN);
  const binomDist = computeBinomialDistribution(sampleN, p);

  let maxDiff = 0;
  for (let k = 0; k <= sampleN; k++) {
    const pHyper = hyperDist.outcomes.find((o) => o.x === k)?.p || 0;
    const pBinom = binomDist.outcomes.find((o) => o.x === k)?.p || 0;
    const diff = Math.abs(pHyper - pBinom);
    if (diff > maxDiff) maxDiff = diff;
  }

  const factor = N > 1 ? (N - sampleN) / (N - 1) : 1;

  return {
    hyperDist,
    binomDist,
    varianceCorrectionFactor: factor,
    maxDifference: maxDiff,
    N,
    p,
    sampleN,
  };
}

/**
 * 6. 新高考决策模型：方案 A vs 方案 B 期望-方差双准则对比
 * 典型情境：
 *  - 'quality': 质检决策（方案 A 抽检 vs 方案 B 全检）
 *  - 'investment': 理财投资（方案 A 稳健理财 vs 方案 B 风险股票）
 */
export interface DecisionScenarioResult {
  scenario: "quality" | "investment";
  title: string;
  schemeAName: string;
  schemeBName: string;
  schemeADist: DistributionResult;
  schemeBDist: DistributionResult;
  bestByMean: "A" | "B" | "EQUAL";
  bestByRisk: "A" | "B" | "EQUAL";
  decisionConclusion: string;
}

export function computeDecisionModel(
  scenario: "quality" | "investment",
  paramRatio: number, // 质检次品率 (0.01~0.2) 或 投资牛市概率 (0.1~0.9)
): DecisionScenarioResult {
  if (scenario === "quality") {
    // 质检场景：次品率 p
    // 方案 A（抽检）：抽检成本低，但漏检有惩罚。设单件抽检费 2 元，漏检违约损失 50 元/件。抽检率 20%，漏检率 80%*p
    // 方案 B（全检）：全检费固定 8 元/件，完全无漏检违约损失（方差为 0）
    const p = Math.max(0.01, Math.min(0.2, paramRatio));
    // 方案 A 单件成本分布：未被抽中且是次品(成本50)概率 0.8*p；抽中(成本2)概率 0.2；未抽中且良品(成本0)概率 0.8*(1-p)
    const pDefectMiss = 0.8 * p;
    const pSampled = 0.2;
    const pGoodPass = Math.max(0, 1 - pDefectMiss - pSampled);

    const distA = computeGeneralDiscreteDistribution([
      { x: 0, p: pGoodPass, label: "0元(免检合格)" },
      { x: 2, p: pSampled, label: "2元(抽检)" },
      { x: 50, p: pDefectMiss, label: "50元(漏检违约)" },
    ]);

    // 方案 B 单件全检固定成本 8 元
    const distB = computeGeneralDiscreteDistribution([
      { x: 8, p: 1.0, label: "8元(全检固定)" },
    ]);

    const bestByMean =
      distA.mean < distB.mean ? "A" : distA.mean > distB.mean ? "B" : "EQUAL";
    const bestByRisk = distA.variance < distB.variance ? "A" : "B"; // 方案 B 方差为 0 风险最低

    const conclusion =
      p < 0.19
        ? `当前次品率 p=${(p * 100).toFixed(1)}% < 19%，方案 A 抽检期望成本 (¥${distA.mean.toFixed(2)}) 显著低于全检 (¥8.00)，推荐【方案 A 抽检】。`
        : `当前次品率 p=${(p * 100).toFixed(1)}% ≥ 19%，漏检违约风险剧增，方案 B 全检期望成本更优且零风险，推荐【方案 B 全检】。`;

    return {
      scenario: "quality",
      title: "产品质量检测决策模型（期望成本与风险分析）",
      schemeAName: "方案 A：部分抽检（期望成本浮动）",
      schemeBName: "方案 B：全数检验（固定成本零风险）",
      schemeADist: distA,
      schemeBDist: distB,
      bestByMean,
      bestByRisk,
      decisionConclusion: conclusion,
    };
  }

  // 投资理财场景：市场景气度概率 p (0.1~0.9)
  const p = Math.max(0.1, Math.min(0.9, paramRatio));
  // 方案 A（稳健理财）：收益率稳定 4% (¥4000/10万)
  const distA = computeGeneralDiscreteDistribution([
    { x: 4, p: 1.0, label: "+4%稳健" },
  ]);

  // 方案 B（进取股票）：牛市景气概率 p 收益 +20%，熊市概率 1-p 收益 -10%
  const distB = computeGeneralDiscreteDistribution([
    { x: -10, p: 1 - p, label: "-10%下行" },
    { x: 20, p: p, label: "+20%上涨" },
  ]);

  const bestByMean =
    distB.mean > distA.mean ? "B" : distB.mean < distA.mean ? "A" : "EQUAL";
  const bestByRisk = "A"; // 稳健理财方差为 0

  const conclusion =
    distB.mean > 4
      ? `景气概率 p=${p.toFixed(2)}，股票期望收益率 ${distB.mean.toFixed(1)}% 高于理财 (4.0%)，但方差较大 (${distB.variance.toFixed(1)})，适合风险承受力强的投资者。`
      : `景气概率 p=${p.toFixed(2)}，股票期望收益率 ${distB.mean.toFixed(1)}% 低于稳健理财 (4.0%) 且伴随下行风险，推荐【方案 A 稳健理财】。`;

  return {
    scenario: "investment",
    title: "资产配置与风险收益决策模型",
    schemeAName: "方案 A：稳健固定理财",
    schemeBName: "方案 B：进取权益股票",
    schemeADist: distA,
    schemeBDist: distB,
    bestByMean,
    bestByRisk,
    decisionConclusion: conclusion,
  };
}
