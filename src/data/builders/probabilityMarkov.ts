import type { MathPanelData } from "../types";
import { calculateMarkovChain } from "../../math/probabilityMarkov";
import { MARKOV_PRESETS } from "../registries/probabilityMarkov";
import { MATH_COLORS } from "../../theme";

export function buildProbabilityMarkovPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const p1Val = params.p1 ?? 1.0;
  const p11Val = params.p11 ?? 0.0;
  const p21Val = params.p21 ?? 0.5;
  const maxNVal = params.maxN ?? 10;
  const currStepVal = Math.min(
    maxNVal,
    Math.max(1, Math.round(params.currStep ?? 1)),
  );
  const scenarioKey = (config?.scenarioKey as string) || "pass_ball_2020";
  const currentPreset =
    MARKOV_PRESETS[scenarioKey] || MARKOV_PRESETS.pass_ball_2020;

  const markovRes = calculateMarkovChain(p1Val, p11Val, p21Val, maxNVal);
  const currentStepItem =
    markovRes.steps.find((s) => s.n === currStepVal) ?? markovRes.steps[0];

  const lambdaVal = markovRes.lambda;
  const tVal = markovRes.pStationary;

  return {
    quantities: [
      {
        label: `${currentPreset.labels.s1} 先验概率 p₁`,
        symbol: "p_1",
        value: p1Val.toFixed(3),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: `保持条件概率 P(Aₙ₊₁|Aₙ)`,
        symbol: "P(A_{n+1}|A_n)",
        value: p11Val.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: `转移条件概率 P(Aₙ₊₁|Āₙ)`,
        symbol: "P(A_{n+1}|\\overline{A_n})",
        value: p21Val.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "递推公比 λ = p₁₁ - p₂₁",
        symbol: "\\lambda",
        value: lambdaVal.toFixed(3),
        color: MATH_COLORS.functionTransformed,
      },
      {
        label: "待定不动点 (稳态极限) t",
        symbol: "t = \\lim_{n \\to \\infty} p_n",
        value: tVal.toFixed(4),
        color: MATH_COLORS.focusPoint,
      },
      {
        label: `当前第 ${currStepVal} 步概率 p_${currStepVal}`,
        symbol: `p_{${currStepVal}}`,
        value: currentStepItem.p1.toFixed(4),
        color: MATH_COLORS.function,
      },
      {
        label: `当前步与稳态偏差 |p_${currStepVal} - t|`,
        symbol: `|p_{${currStepVal}} - t|`,
        value: currentStepItem.absDelta.toFixed(4),
        color: MATH_COLORS.derivative,
      },
    ],
    theorems: [
      {
        name: "【高考采分步 1】完备划分与规范设元",
        latex:
          "P(A_n) = p_n, \\quad P(\\overline{A_n}) = 1 - p_n \\quad (A_n \\cup \\overline{A_n} = \\Omega, A_n \\cap \\overline{A_n} = \\emptyset)",
        condition: `设第 $n$ 步事件【${currentPreset.labels.s1}】发生概率为 $P(A_n) = p_n$，则对立事件【${currentPreset.labels.s2}】概率为 $P(\\overline{A_n}) = 1 - p_n$。$A_n$ 与 $\\overline{A_n}$ 构成样本空间 $\\Omega$ 的完备划分，初始先验条件 $p_1 = ${p1Val.toFixed(2)}$。`,
        note: "在解答题第 (1) 问中，必须先写清事件设元与互斥完备性，是首要评分采分点（通常占 2 分）。",
        level: "core",
      },
      {
        name: "【高考采分步 2】全概率公式建立一阶线性递推",
        latex:
          "P(A_{n+1}) = P(A_n)P(A_{n+1}|A_n) + P(\\overline{A_n})P(A_{n+1}|\\overline{A_n})",
        condition: markovRes.step2_recurrence,
        note: `本情景递推化简后为：$${markovRes.recurrenceLatex}$。递推公比为 $\\lambda = p_{11} - p_{21} = ${lambdaVal.toFixed(2)}$。`,
        level: "core",
      },
      {
        name: "【高考采分步 3】待定系数法配凑构造等比数列",
        latex:
          "p_{n+1} - t = \\lambda (p_n - t) \\iff p_{n+1} = \\lambda p_n + t(1 - \\lambda)",
        condition: markovRes.step3_geometric,
        note: `对比常数项 $t(1 - \\lambda) = p_{21}$，解得平衡不动点 $t = \\frac{p_{21}}{1 - \\lambda} = ${tVal.toFixed(3)}$。新高考阅卷要求展示配凑过程，严禁空降特征根。`,
        level: "important",
      },
      {
        name: "【高考采分步 4】等比数列通项与收敛极限",
        latex:
          "p_n - t = (p_1 - t)\\lambda^{n-1} \\implies p_n = t + (p_1 - t)\\lambda^{n-1}",
        condition: markovRes.step4_generalTerm,
        note: `${markovRes.generalTermLatex ? `当前代入通项：$${markovRes.generalTermLatex}$；` : ""}${
          markovRes.isOscillating
            ? "公比 $-1 < \\lambda < 0$：在平衡值两侧交替衰减收敛，奇数项偏大、偶数项偏小。"
            : "公比 $0 \\le \\lambda < 1$：单调递进逼近稳态极限。"
        }`,
        level: "derived",
      },
    ],
    gaokaoPoints: [
      {
        text: "【新高考大题 17 分标准采分点链路】①设第 $n$ 步状态事件 $A_n$ 与完备对立事件 $\\overline{A_n}$；②列全概率展开式 $p_{n+1} = p_{11}p_n + p_{21}(1-p_n)$；③待定系数配凑辅助等比数列 $\\{p_n - t\\}$；④求通项 $p_n$ 并由 $|\\lambda| < 1$ 求解稳态极限 $\\lim_{n \\to \\infty} p_n = t$。",
        importance: "gaokao",
      },
      {
        text: `【情景特征分析 · ${currentPreset.name}】${
          markovRes.isOscillating
            ? "公比 $-1 < \\lambda < 0$：交替振荡衰减收敛。若设问求前 $n$ 项和 $S_n$，需注意利用等比求和公式处理 $(-|\\lambda|)^{n-1}$ 项的正负交错。"
            : "公比 $0 \\le \\lambda < 1$：单调收敛。可直接通过作差 $p_{n+1} - p_n$ 判断单调递增/递减，规范解答单调性证明与最值问题。"
        }`,
        importance: "gaokao",
      },
      {
        text: "【规范避坑】切勿混淆初始下标！若题设“第 1 次操作后”对应 $p_1$，则初始确定状态为第 0 步 ($p_0=1$)；若题设首项为 $p_1$，则指数为 $n-1$ 次方，必须与题设对齐！",
        importance: "core",
      },
    ],
    warnings: [],
    mnemonic:
      "全概递推设划分，待定系数配等比，不动点处寻稳态，通项极限步步清。",
  };
}
