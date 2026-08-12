/**
 * 条件概率、全概率公式与贝叶斯求解纯函数库
 * 遵循铁律 6：零 React/DOM/window 依赖，纯计算与 validity 检查
 */

export interface ConditionalProbResult {
  pA: number;
  pB: number;
  pAB: number;
  pB_given_A: number; // P(B|A) = P(AB) / P(A)
  pA_given_B: number; // P(A|B) = P(AB) / P(B)
  pUnion: number; // P(A U B) = P(A) + P(B) - P(AB)
  pB_given_notA: number; // P(B|~A) = (P(B) - P(AB)) / (1 - P(A))
  isValid: boolean;
  isDegenerate: boolean; // P(A) = 0 时条件概率退化
  warningMsg?: string;
}

export interface PartitionItem {
  key: string;
  name: string;
  pAi: number; // P(A_i) 先验概率
  pB_given_Ai: number; // P(B|A_i) 条件概率
  pJoint: number; // P(A_i B) = P(A_i) * P(B|A_i)
  posterior: number; // P(A_i|B) = P(A_i B) / P(B) 后验概率
}

export interface TotalProbResult {
  partitions: PartitionItem[];
  pB: number; // P(B) 全概率
  isValid: boolean;
  warningMsg?: string;
}

export interface BayesDiagnosticResult {
  pPriorD: number; // P(D) 患病先验概率
  pPriorNotD: number; // P(~D) 健康先验概率 = 1 - P(D)
  pSensitivity: number; // P(+|D) 灵敏度/真阳性率
  pFalsePositive: number; // P(+|~D) 误报率/假阳性率
  pTruePositiveJoint: number; // P(D ∩ +) = P(D) * P(+|D)
  pFalsePositiveJoint: number; // P(~D ∩ +) = P(~D) * P(+|~D)
  pTotalPositive: number; // P(+) 全概率阳性率
  pPosteriorD: number; // P(D|+) 后验患病概率 = P(D ∩ +) / P(+)
  falseAlarmRatio: number; // 假阳性在所有阳性中的比例 = P(~D ∩ +) / P(+)
  isValid: boolean;
}

export interface MarkovStepItem {
  n: number;
  p1: number; // 第 n 步处于状态 1 的概率
  p2: number; // 第 n 步处于状态 2 的概率 (1 - p1)
  deltaToStationary: number; // p1 - pStationary
}

export interface MarkovChainResult {
  p1: number;
  p11: number;
  p12: number; // 1 - p11
  p21: number;
  p22: number; // 1 - p21
  lambda: number; // 公比 = p11 - p21
  pStationary: number; // 平稳分布 p_infty = p21 / (1 - lambda)
  isOscillating: boolean; // lambda < 0 时为交替震荡收敛
  isDegenerate: boolean; // lambda == 1 时为退化恒定
  recurrenceLatex: string; // p_{n+1} = a * p_n + b
  geometricLatex: string; // p_{n+1} - p_infty = lambda (p_n - p_infty)
  generalTermLatex: string; // p_n = (p1 - p_infty) * lambda^(n-1) + p_infty
  steps: MarkovStepItem[];
  isValid: boolean;
}

/**
 * 1. 条件概率求解器
 */
export function calculateConditionalProb(
  pA: number,
  pB: number,
  pAB: number,
): ConditionalProbResult {
  // 边界钳制
  const clampedPA = Math.max(0, Math.min(1, pA));
  const clampedPB = Math.max(0, Math.min(1, pB));
  const maxAB = Math.min(clampedPA, clampedPB);
  const clampedPAB = Math.max(0, Math.min(maxAB, pAB));

  const isDegenerate = clampedPA <= 1e-6;
  const isBDegenerate = clampedPB <= 1e-6;

  const pB_given_A = isDegenerate ? 0 : clampedPAB / clampedPA;
  const pA_given_B = isBDegenerate ? 0 : clampedPAB / clampedPB;
  const pUnion = Math.min(1, clampedPA + clampedPB - clampedPAB);

  const pNotA = 1 - clampedPA;
  const pBNotAJoint = clampedPB - clampedPAB;
  const pB_given_notA = pNotA <= 1e-6 ? 0 : Math.max(0, pBNotAJoint / pNotA);

  let warningMsg: string | undefined;
  if (isDegenerate) {
    warningMsg =
      "已知事件 A 的概率 P(A) = 0，条件概率 P(B|A) 无意义（退化状态）";
  } else if (clampedPAB > maxAB) {
    warningMsg = "交集概率 P(AB) 不能超过 P(A) 与 P(B) 的最小值";
  }

  return {
    pA: clampedPA,
    pB: clampedPB,
    pAB: clampedPAB,
    pB_given_A,
    pA_given_B,
    pUnion,
    pB_given_notA,
    isValid: true,
    isDegenerate,
    warningMsg,
  };
}

/**
 * 2. 全概率求解器 (完备事件组划分)
 */
export function calculateTotalProb(
  inputs: Array<{
    key: string;
    name: string;
    pAi: number;
    pB_given_Ai: number;
  }>,
): TotalProbResult {
  if (!inputs || inputs.length === 0) {
    return { partitions: [], pB: 0, isValid: false, warningMsg: "划分为空" };
  }

  // 计算总和并归一化
  const rawSum = inputs.reduce((acc, cur) => acc + Math.max(0, cur.pAi), 0);
  const normalizedSum = rawSum <= 1e-6 ? 1 : rawSum;

  let pB = 0;
  const partitionsTemp = inputs.map((item) => {
    const pAi = Math.max(0, item.pAi) / normalizedSum;
    const pB_given_Ai = Math.max(0, Math.min(1, item.pB_given_Ai));
    const pJoint = pAi * pB_given_Ai;
    pB += pJoint;
    return {
      key: item.key,
      name: item.name,
      pAi,
      pB_given_Ai,
      pJoint,
      posterior: 0,
    };
  });

  // 计算后验概率
  const partitions: PartitionItem[] = partitionsTemp.map((item) => ({
    ...item,
    posterior: pB <= 1e-6 ? 0 : item.pJoint / pB,
  }));

  return {
    partitions,
    pB,
    isValid: true,
  };
}

/**
 * 3. 贝叶斯诊断（试剂检测 / 高考医疗与次品检验）求解器
 */
export function calculateBayesDiagnostic(
  pPriorD: number,
  pSensitivity: number,
  pFalsePositive: number,
): BayesDiagnosticResult {
  const clampedPriorD = Math.max(0.0001, Math.min(0.9999, pPriorD));
  const clampedPriorNotD = 1 - clampedPriorD;
  const clampedSensitivity = Math.max(0, Math.min(1, pSensitivity));
  const clampedFalsePos = Math.max(0, Math.min(1, pFalsePositive));

  const pTruePositiveJoint = clampedPriorD * clampedSensitivity;
  const pFalsePositiveJoint = clampedPriorNotD * clampedFalsePos;

  const pTotalPositive = pTruePositiveJoint + pFalsePositiveJoint;
  const pPosteriorD =
    pTotalPositive <= 1e-8 ? 0 : pTruePositiveJoint / pTotalPositive;
  const falseAlarmRatio =
    pTotalPositive <= 1e-8 ? 0 : pFalsePositiveJoint / pTotalPositive;

  return {
    pPriorD: clampedPriorD,
    pPriorNotD: clampedPriorNotD,
    pSensitivity: clampedSensitivity,
    pFalsePositive: clampedFalsePos,
    pTruePositiveJoint,
    pFalsePositiveJoint,
    pTotalPositive,
    pPosteriorD,
    falseAlarmRatio,
    isValid: true,
  };
}

/**
 * 4. 马尔可夫链一阶状态转移与数列递推求解器
 * 全概率公式：P(S_{n+1}=1) = P(S_n=1)P(S_{n+1}=1|S_n=1) + P(S_n=2)P(S_{n+1}=1|S_n=2)
 * 即 p_{n+1} = p_n * p11 + (1 - p_n) * p21 = (p11 - p21) * p_n + p21
 */
export function calculateMarkovChain(
  p1: number,
  p11: number,
  p21: number,
  maxSteps: number = 10,
): MarkovChainResult {
  const initP1 = Math.max(0, Math.min(1, p1));
  const cP11 = Math.max(0, Math.min(1, p11));
  const cP21 = Math.max(0, Math.min(1, p21));
  const cP12 = 1 - cP11;
  const cP22 = 1 - cP21;

  const lambda = cP11 - cP21;
  const isDegenerate = Math.abs(1 - lambda) < 1e-6;
  const isOscillating = lambda < -1e-6;

  // 平稳分布：p_infty = p21 / (1 - lambda) = p21 / (1 - p11 + p21)
  const denominator = 1 - lambda;
  const pStationary = isDegenerate ? initP1 : cP21 / denominator;

  const steps: MarkovStepItem[] = [];
  let currP1 = initP1;
  const totalN = Math.max(3, Math.min(15, Math.round(maxSteps)));

  for (let n = 1; n <= totalN; n++) {
    steps.push({
      n,
      p1: currP1,
      p2: 1 - currP1,
      deltaToStationary: currP1 - pStationary,
    });
    // 全概率递推一步
    currP1 = currP1 * cP11 + (1 - currP1) * cP21;
  }

  // 格式化系数 LaTeX
  const lambdaStr = lambda >= 0 ? lambda.toFixed(2) : `(${lambda.toFixed(2)})`;
  const betaStr = cP21.toFixed(2);
  const pInfStr = pStationary.toFixed(3);

  const recurrenceLatex = `p_{n+1} = ${lambdaStr} p_n + ${betaStr}`;
  const geometricLatex = `p_{n+1} - ${pInfStr} = ${lambdaStr}(p_n - ${pInfStr})`;

  const diffInit = initP1 - pStationary;
  let generalTermLatex = "";
  if (Math.abs(diffInit) < 1e-6) {
    generalTermLatex = `p_n = ${pInfStr}`;
  } else {
    const diffStr =
      diffInit > 0
        ? `+ ${diffInit.toFixed(3)}`
        : `- ${Math.abs(diffInit).toFixed(3)}`;
    generalTermLatex = `p_n = ${pInfStr} ${diffStr} \\cdot (${lambdaStr})^{n-1}`;
  }

  return {
    p1: initP1,
    p11: cP11,
    p12: cP12,
    p21: cP21,
    p22: cP22,
    lambda,
    pStationary,
    isOscillating,
    isDegenerate,
    recurrenceLatex,
    geometricLatex,
    generalTermLatex,
    steps,
    isValid: true,
  };
}
