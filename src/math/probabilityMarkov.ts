/**
 * 全概递推数列与状态转移纯数学模型 (新高考压轴解答题专题)
 *
 * 核心数学逻辑：
 * 1. 完备划分：由事件 A_n 与 A_n^c 构成全集划分，P(A_n) = p_n, P(A_n^c) = 1 - p_n
 * 2. 全概率递推：p_{n+1} = p_{11} p_n + p_{21}(1 - p_n) = (p_{11} - p_{21}) p_n + p_{21}
 * 3. 待定系数构造：设 p_{n+1} - t = lambda(p_n - t)，其中 lambda = p_{11} - p_{21}, t = p_{21} / (1 - lambda)
 * 4. 等比数列通项：p_n - t = (p_1 - t) lambda^{n-1} ==> p_n = t + (p_1 - t) lambda^{n-1}
 * 5. 渐近行为与收敛性质讨论：
 *    - -1 < lambda < 0: 奇偶交替振荡衰减逼近 (如传球模型)
 *    - 0 <= lambda < 1: 单调趋近于稳态值 (如摸球置换模型)
 *    - lambda = -1: 永久等幅振荡 (如二项博弈互换发球)
 *    - lambda = 1: 退化恒等序列 (自封闭吸收态)
 */

export interface MarkovStepItem {
  n: number;
  p1: number;
  p2: number;
  deltaToStationary: number;
  /** 等比数列项绝对值 |p_n - t|，用于展示指数级衰减柱 */
  absDelta: number;
}

export interface MarkovChainResult {
  p1: number;
  p11: number;
  p12: number;
  p21: number;
  p22: number;
  lambda: number;
  pStationary: number;
  isOscillating: boolean;
  isPureOscillating: boolean;
  isDegenerate: boolean;
  steps: MarkovStepItem[];
  recurrenceLatex: string;
  geometricLatex: string;
  generalTermLatex: string;
  recurrenceText: string;
  geometricText: string;
  generalTermText: string;
  step1_partition: string;
  step2_recurrence: string;
  step3_geometric: string;
  step4_generalTerm: string;
  gaokaoSteps: {
    step1_define: string;
    step2_recurrence: string;
    step3_geometric: string;
    step4_generalTerm: string;
  };
  isValid: boolean;
}

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
  const isPureOscillating = Math.abs(lambda + 1) < 1e-6;
  const isOscillating = lambda < -1e-6 && !isPureOscillating;

  // 待定系数不动点（稳态渐近值）：t = p21 / (1 - lambda)
  const denominator = 1 - lambda;
  const pStationary = isDegenerate ? initP1 : cP21 / denominator;

  const steps: MarkovStepItem[] = [];
  let currP1 = initP1;
  const totalN = Math.max(3, Math.min(15, Math.round(maxSteps)));

  for (let n = 1; n <= totalN; n++) {
    const delta = currP1 - pStationary;
    steps.push({
      n,
      p1: currP1,
      p2: 1 - currP1,
      deltaToStationary: delta,
      absDelta: Math.abs(delta),
    });

    currP1 = currP1 * cP11 + (1 - currP1) * cP21;
  }

  const lambdaBaseStr = lambda.toFixed(2);
  const lambdaStr = lambda >= 0 ? lambdaBaseStr : `(${lambdaBaseStr})`;
  const betaStr = cP21.toFixed(2);
  const pInfStr = pStationary.toFixed(3);

  const recurrenceLatex = `p_{n+1} = ${lambdaStr} p_n + ${betaStr}`;
  const geometricLatex = `p_{n+1} - ${pInfStr} = ${lambdaStr}(p_n - ${pInfStr})`;

  const recurrenceText = `pₙ₊₁ = ${lambdaStr} pₙ + ${betaStr}`;
  const geometricText = `pₙ₊₁ - ${pInfStr} = ${lambdaStr}(pₙ - ${pInfStr})`;

  const diffInit = initP1 - pStationary;
  let generalTermLatex = "";
  let generalTermText = "";
  if (isDegenerate || Math.abs(diffInit) < 1e-6) {
    generalTermLatex = `p_n = ${pInfStr}`;
    generalTermText = `pₙ = ${pInfStr}`;
  } else {
    const diffStr =
      diffInit > 0
        ? `+ ${diffInit.toFixed(3)}`
        : `- ${Math.abs(diffInit).toFixed(3)}`;
    generalTermLatex = `p_n = ${pInfStr} ${diffStr} \\cdot (${lambdaBaseStr})^{n-1}`;
    generalTermText = `pₙ = ${pInfStr} ${diffStr} × (${lambdaBaseStr})ⁿ⁻¹`;
  }

  // 高考四步规范作答 (所有内嵌数学符号 100% 包裹 $...$，供 renderMixedLatex 完美渲染)
  const step1_partition = `设第 $n$ 步系统处于状态 $S_1$ 的事件为 $A_n$，其发生概率为 $P(A_n) = p_n$，则处于状态 $S_2$ 的概率为 $P(\\overline{A_n}) = 1 - p_n$。显然 $A_n$ 与 $\\overline{A_n}$ 构成完备划分，初始条件 $p_1 = ${initP1.toFixed(2)}$。`;
  const step2_recurrence = `由全概率公式，第 $n+1$ 步处于 $S_1$ 的概率满足：$P(A_{n+1}) = P(A_n)P(A_{n+1}|A_n) + P(\\overline{A_n})P(A_{n+1}|\\overline{A_n}) = ${cP11.toFixed(2)} p_n + ${cP21.toFixed(2)}(1 - p_n) = ${recurrenceLatex}$。`;

  let step3_geometric: string;
  let step4_generalTerm: string;

  if (isDegenerate) {
    step3_geometric = `公共比 $\\lambda = 1.00$，系统处于吸收/自封闭退化状态，状态概率恒定不变，无需构造等比数列。`;
    step4_generalTerm = `系统处于吸收退化态（$\\lambda = 1$），各步状态概率恒为初始值，即 $p_n = ${pInfStr}$（常数列）。`;
  } else if (Math.abs(diffInit) < 1e-6) {
    step3_geometric = `求解不动点方程 $x = ${lambdaStr} x + ${betaStr}$，得不动点 $x = ${pInfStr}$。
两边同减 $${pInfStr}$ 得：$p_{n+1} - ${pInfStr} = ${lambdaStr}(p_n - ${pInfStr})$。
故数列 $\\{p_n - ${pInfStr}\\}$ 为以 $0$ 为首项的常数数列。`;
    step4_generalTerm = `初始概率 $p_1 = ${initP1.toFixed(3)}$ 恰好等于不动点 $${pInfStr}$，故数列 $\\{p_n - ${pInfStr}\\}$ 为以 $0$ 为首项的常数列，即 $p_n = ${pInfStr}$（常数列），各项概率恒定不变。`;
  } else if (isPureOscillating) {
    step3_geometric = `递推式为 $p_{n+1} = -p_n + ${betaStr}$。设 $p_{n+1} - ${pInfStr} = -1(p_n - ${pInfStr})$，则数列 $\\{p_n - ${pInfStr}\\}$ 是以 $p_1 - ${pInfStr} = ${diffInit.toFixed(3)}$ 为首项、$-1$ 为公比的等比数列。`;
    step4_generalTerm = `通项公式为：$p_n = ${pInfStr} + (${diffInit.toFixed(3)}) \\cdot (-1)^{n-1}$。注意公比 $\\lambda = -1$，序列在两点间永久等幅振荡，不会趋近于单一稳定值。`;
  } else if (isOscillating) {
    step3_geometric = `设 $p_{n+1} - t = ${lambdaStr}(p_n - t)$，展开对比系数得待定常数 $t = \\frac{${betaStr}}{1 - (${lambdaBaseStr})} = ${pInfStr}$。因此数列 $\\{p_n - ${pInfStr}\\}$ 是以 $p_1 - ${pInfStr} = ${diffInit.toFixed(3)}$ 为首项、$\\lambda = ${lambdaBaseStr}$ 为公比的等比数列。`;
    step4_generalTerm = `由此得通项公式为：$p_n = ${generalTermLatex}$。由于 $|\\lambda| < 1$，随着项数 $n$ 增大，$\\lambda^{n-1}$ 迅速衰减，故 $p_n$ 在定值两侧交替振荡地趋近于 ${pInfStr}$。`;
  } else {
    step3_geometric = `设 $p_{n+1} - t = ${lambdaStr}(p_n - t)$，代入待定系数求得不动点 $t = \\frac{${betaStr}}{1 - ${lambdaBaseStr}} = ${pInfStr}$。故数列 $\\{p_n - ${pInfStr}\\}$ 为公比 $\\lambda = ${lambdaBaseStr}$ 的等比数列。`;
    step4_generalTerm = `由此得通项公式为：$p_n = ${generalTermLatex}$。由于 $0 \\le \\lambda < 1$，随着项数 $n$ 增大，$p_n$ 单调趋近于定值 ${pInfStr}$。`;
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
    isPureOscillating,
    isDegenerate,
    steps,
    recurrenceLatex,
    geometricLatex,
    generalTermLatex,
    recurrenceText,
    geometricText,
    generalTermText,
    step1_partition,
    step2_recurrence,
    step3_geometric,
    step4_generalTerm,
    gaokaoSteps: {
      step1_define: step1_partition,
      step2_recurrence,
      step3_geometric,
      step4_generalTerm,
    },
    isValid: true,
  };
}
