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
