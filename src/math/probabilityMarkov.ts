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

export type MarkovDynamicType =
  | "convergent_monotonic" // 0 <= lambda < 1 单调趋近
  | "convergent_damped" // -1 < lambda < 0 阻尼振荡衰减
  | "pure_oscillating" // lambda = -1 永久等幅振荡（无衰减）
  | "degenerate_constant"; // lambda = 1 退化为恒等常数列

export interface MarkovStepItem {
  n: number;
  p1: number;
  p2: number;
  deltaToStationary: number;
  /** 等比数列项绝对值 |p_n - t|，用于展示指数级衰减柱 */
  absDelta: number;
  /** 前 n 步累计概率和（即累计发生次数期望 E(Y_n) = sum_{k=1}^n p_k） */
  sumP1: number;
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
  dynamicType: MarkovDynamicType;
  steps: MarkovStepItem[];
  recurrenceLatex: string;
  geometricLatex: string;
  generalTermLatex: string;
  sumFormulaLatex: string;
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

/**
 * 格式化概率系数：优先识别常见精确有理分数（如 1/3, 2/3, -1/3, 1/6 等无法用两位有限小数准确表达的分数），
 * 其余常规小数保持简洁准确的小数表示，避免 .toFixed(2) 截断导致的代数假等式。
 */
function fmtMarkovVal(
  val: number,
  fallbackDecimals: number = 2,
): { latex: string; text: string } {
  if (Math.abs(val) < 1e-6) return { latex: "0", text: "0" };
  const sign = val < 0 ? "-" : "";
  const abs = Math.abs(val);
  // 若与两位小数有显著差异，尝试匹配分母 3~12 的精确分数
  if (Math.abs(abs - Math.round(abs * 100) / 100) > 1e-4) {
    for (let den = 3; den <= 12; den++) {
      const num = Math.round(abs * den);
      if (num > 0 && Math.abs(abs - num / den) < 1e-5) {
        const gcd = (a: number, b: number): number =>
          b === 0 ? a : gcd(b, a % b);
        const g = gcd(num, den);
        const sn = num / g;
        const sd = den / g;
        return {
          latex: `${sign}\\frac{${sn}}{${sd}}`,
          text: `${sign}${sn}/${sd}`,
        };
      }
    }
    const s = Number(val.toFixed(4)).toString();
    return { latex: s, text: s };
  }
  const fixed = val.toFixed(fallbackDecimals);
  // 保留简洁数值，避免 1.00 / 0.00 尾零，仅保留最多 fallbackDecimals 位有效小数
  const clean = Number(fixed).toString();
  return { latex: clean, text: clean };
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
  const isZeroLambda = Math.abs(lambda) < 1e-6;

  // 待定系数不动点（稳态渐近值）：t = p21 / (1 - lambda)
  const denominator = 1 - lambda;
  const pStationary = isDegenerate ? initP1 : cP21 / denominator;

  const steps: MarkovStepItem[] = [];
  let currP1 = initP1;
  let runningSum = 0;
  const totalN = Math.max(3, Math.min(15, Math.round(maxSteps)));

  for (let n = 1; n <= totalN; n++) {
    const delta = currP1 - pStationary;
    runningSum += currP1;
    steps.push({
      n,
      p1: currP1,
      p2: 1 - currP1,
      deltaToStationary: delta,
      absDelta: Math.abs(delta),
      sumP1: runningSum,
    });

    currP1 = currP1 * cP11 + (1 - currP1) * cP21;
  }

  let dynamicType: MarkovDynamicType;
  if (isDegenerate) {
    dynamicType = "degenerate_constant";
  } else if (isPureOscillating) {
    dynamicType = "pure_oscillating";
  } else if (isOscillating) {
    dynamicType = "convergent_damped";
  } else {
    dynamicType = "convergent_monotonic";
  }

  const p1Fmt = fmtMarkovVal(initP1, 3);
  const p11Fmt = fmtMarkovVal(cP11, 2);
  const p21Fmt = fmtMarkovVal(cP21, 2);
  const lambdaFmt = fmtMarkovVal(lambda, 3);
  const pInfFmt = fmtMarkovVal(pStationary, 4);

  const lambdaParenLatex =
    lambda >= 0 ? lambdaFmt.latex : `(${lambdaFmt.latex})`;
  const lambdaParenText = lambda >= 0 ? lambdaFmt.text : `(${lambdaFmt.text})`;

  const recurrenceLatex = isZeroLambda
    ? `p_{n+1} = ${p21Fmt.latex}`
    : `p_{n+1} = ${lambdaFmt.latex === "1" ? "" : lambdaFmt.latex === "-1" ? "-" : `${lambdaParenLatex} `}p_n + ${p21Fmt.latex}`;
  const geometricLatex = isDegenerate
    ? `p_{n+1} = p_n \\implies p_n = ${pInfFmt.latex}`
    : isZeroLambda
      ? `p_{n+1} = ${p21Fmt.latex} \\quad (n \\ge 1)`
      : `p_{n+1} - ${pInfFmt.latex} = ${lambdaParenLatex}(p_n - ${pInfFmt.latex})`;

  const recurrenceText = isZeroLambda
    ? `pₙ₊₁ = ${p21Fmt.text}`
    : `pₙ₊₁ = ${lambdaParenText} pₙ + ${p21Fmt.text}`;
  const geometricText = isDegenerate
    ? `pₙ₊₁ = pₙ ⟹ pₙ = ${pInfFmt.text}`
    : isZeroLambda
      ? `pₙ₊₁ = ${p21Fmt.text} (一步到位，与 pₙ 无关)`
      : `pₙ₊₁ - ${pInfFmt.text} = ${lambdaParenText}(pₙ - ${pInfFmt.text})`;

  const diffInit = initP1 - pStationary;
  const diffAbsFmt = fmtMarkovVal(Math.abs(diffInit), 4);
  const diffFmt = fmtMarkovVal(diffInit, 4);
  let generalTermLatex = "";
  let generalTermText = "";
  let sumFormulaLatex = "";
  if (isDegenerate || Math.abs(diffInit) < 1e-6) {
    generalTermLatex = `p_n = ${pInfFmt.latex}`;
    generalTermText = `pₙ = ${pInfFmt.text}`;
    sumFormulaLatex = `S_n = ${pInfFmt.latex === "0" ? "0" : pInfFmt.latex === "1" ? "n" : `${pInfFmt.latex}n`}`;
  } else if (isZeroLambda) {
    generalTermLatex = `p_n = ${pInfFmt.latex} \\;(n \\ge 2)`;
    generalTermText = `pₙ = ${pInfFmt.text} (n≥2)`;
    sumFormulaLatex = `S_n = ${p1Fmt.latex} + (n-1)\\cdot ${pInfFmt.latex}`;
  } else {
    const diffSignLatex =
      diffInit > 0 ? `+ ${diffAbsFmt.latex}` : `- ${diffAbsFmt.latex}`;
    const diffSignText =
      diffInit > 0 ? `+ ${diffAbsFmt.text}` : `- ${diffAbsFmt.text}`;
    generalTermLatex = `p_n = ${pInfFmt.latex} ${diffSignLatex} \\cdot (${lambdaFmt.latex})^{n-1}`;
    generalTermText = `pₙ = ${pInfFmt.text} ${diffSignText} × (${lambdaFmt.text})ⁿ⁻¹`;
    sumFormulaLatex = `S_n = ${pInfFmt.latex}n ${diffSignLatex} \\cdot \\frac{1 - (${lambdaFmt.latex})^n}{1 - (${lambdaFmt.latex})}`;
  }

  // 高考四步规范作答 (所有内嵌数学符号 100% 包裹 $...$，供 renderMixedLatex 完美渲染)
  const step1_partition = `设第 $n$ 步系统处于状态 $S_1$ 的事件为 $A_n$，其发生概率为 $P(A_n) = p_n$，则处于状态 $S_2$ 的概率为 $P(\\overline{A_n}) = 1 - p_n$。显然 $A_n$ 与 $\\overline{A_n}$ 构成完备划分，初始条件 $p_1 = ${p1Fmt.latex}$。`;
  const step2_recurrence = `由全概率公式，第 $n+1$ 步处于 $S_1$ 的概率满足：$P(A_{n+1}) = P(A_n)P(A_{n+1}|A_n) + P(\\overline{A_n})P(A_{n+1}|\\overline{A_n}) = ${p11Fmt.latex} p_n + ${p21Fmt.latex}(1 - p_n) = ${recurrenceLatex}$。`;

  let step3_geometric: string;
  let step4_generalTerm: string;

  if (isDegenerate) {
    step3_geometric = `公比 $\\lambda = 1$，递推式退化为 $p_{n+1} = p_n$。数列为恒等常数列，无需配凑辅助等比数列。`;
    step4_generalTerm = `公比 $\\lambda = 1$，递推关系退化，各步状态概率恒为初始值 $p_1$，即 $p_n = ${pInfFmt.latex}$（常数列）。`;
  } else if (Math.abs(diffInit) < 1e-6) {
    step3_geometric = `求解不动点方程 $x = ${lambdaParenLatex} x + ${p21Fmt.latex}$，得平衡不动点 $t = ${pInfFmt.latex}$。
两边同减 $t = ${pInfFmt.latex}$ 得：$p_{n+1} - ${pInfFmt.latex} = ${lambdaParenLatex}(p_n - ${pInfFmt.latex})$。
故数列 $\\{p_n - ${pInfFmt.latex}\\}$ 为以 $0$ 为首项的常数数列。`;
    step4_generalTerm = `初始概率 $p_1 = ${p1Fmt.latex}$ 恰好等于不动点 $t = ${pInfFmt.latex}$，故数列 $\\{p_n - ${pInfFmt.latex}\\}$ 为以 $0$ 为首项的常数列，即 $p_n = ${pInfFmt.latex}$（常数列），各项概率恒定不变。`;
  } else if (isPureOscillating) {
    step3_geometric = `递推式为 $p_{n+1} = -p_n + ${p21Fmt.latex}$。设 $p_{n+1} - ${pInfFmt.latex} = -1(p_n - ${pInfFmt.latex})$，则数列 $\\{p_n - ${pInfFmt.latex}\\}$ 是以 $p_1 - ${pInfFmt.latex} = ${diffFmt.latex}$ 为首项、$-1$ 为公比的等比数列。`;
    step4_generalTerm = `通项公式为：$p_n = ${pInfFmt.latex} + (${diffFmt.latex}) \\cdot (-1)^{n-1}$。公比 $\\lambda = -1$，序列在两个数值间交替进行永久等幅振荡（无衰减）。`;
  } else if (isOscillating) {
    step3_geometric = `设 $p_{n+1} - t = ${lambdaParenLatex}(p_n - t)$，展开对比常数项得平衡不动点 $t = \\frac{${p21Fmt.latex}}{1 - (${lambdaFmt.latex})} = ${pInfFmt.latex}$。因此数列 $\\{p_n - ${pInfFmt.latex}\\}$ 是以 $p_1 - ${pInfFmt.latex} = ${diffFmt.latex}$ 为首项、$\\lambda = ${lambdaFmt.latex}$ 为公比的等比数列。`;
    step4_generalTerm = `由此得通项公式为：$p_n = ${generalTermLatex}$。由于 $-1 < \\lambda < 0$，随着项数 $n$ 增大，$(\\lambda)^{n-1}$ 振荡衰减，故 $p_n$ 在平衡值两侧交替振荡趋近于定值 $${pInfFmt.latex}$。`;
  } else if (isZeroLambda) {
    step3_geometric = `转移系数 $\\lambda = p_{11} - p_{21} = 0$，递推式直接退化为与 $p_n$ 无关的定值关系 $p_{n+1} = ${p21Fmt.latex}$（对应平衡值 $t = ${pInfFmt.latex}$），无需再构造等比数列。`;
    step4_generalTerm = `由此得分段通项为：$p_1 = ${p1Fmt.latex}$，$p_n = ${pInfFmt.latex}\\;(n \\ge 2)$。因 $\\lambda = 0$，系统从第 $2$ 步起即一步到位进入稳态定值 $${pInfFmt.latex}$，不再适用幂次公比通项。`;
  } else {
    step3_geometric = `设 $p_{n+1} - t = ${lambdaParenLatex}(p_n - t)$，代入求得平衡不动点 $t = \\frac{${p21Fmt.latex}}{1 - ${lambdaParenLatex}} = ${pInfFmt.latex}$。故数列 $\\{p_n - ${pInfFmt.latex}\\}$ 为公比 $\\lambda = ${lambdaFmt.latex}$ 的等比数列。`;
    step4_generalTerm = `由此得通项公式为：$p_n = ${generalTermLatex}$。由于 $0 < \\lambda < 1$，随着项数 $n$ 增大，$p_n$ 单调递进趋近于定值 $${pInfFmt.latex}$。`;
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
    dynamicType,
    steps,
    recurrenceLatex,
    geometricLatex,
    generalTermLatex,
    sumFormulaLatex,
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
