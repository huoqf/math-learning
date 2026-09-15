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
  const lastStepP1 = markovRes.steps[markovRes.steps.length - 1]?.p1 ?? 0;

  const lambdaVal = markovRes.lambda;
  const tVal = markovRes.pStationary;

  return {
    quantities: [
      {
        label: "初始状态 1 概率 p₁",
        symbol: "p_1",
        value: p1Val.toFixed(3),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "自保持概率 P(Sₙ₊₁=1|Sₙ=1)",
        symbol: "p_{11}",
        value: p11Val.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "跨转移概率 P(Sₙ₊₁=1|Sₙ=2)",
        symbol: "p_{21}",
        value: p21Val.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "特征公比 λ = p₁₁ - p₂₁",
        symbol: "\\lambda",
        value: lambdaVal.toFixed(3),
        color: MATH_COLORS.functionTransformed,
      },
      {
        label: "待定系数不动点 (平稳极限) t",
        symbol: "t = p_\\infty",
        value: markovRes.isDegenerate ? "退化恒定" : tVal.toFixed(4),
        color: MATH_COLORS.focusPoint,
      },
      {
        label: `当前观察第 ${currStepVal} 步概率 p_${currStepVal}`,
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
      {
        label: `第 ${markovRes.steps.length} 步渐近概率 p_${markovRes.steps.length}`,
        symbol: `p_{${markovRes.steps.length}}`,
        value: lastStepP1.toFixed(4),
        color: MATH_COLORS.labelText,
      },
    ],
    theorems: [
      {
        name: "【高考采分步 1】完备划分与设元规范",
        latex:
          "P(A_n) = p_n, \\quad P(\\overline{A_n}) = 1 - p_n \\quad (A_n \\cup \\overline{A_n} = \\Omega, A_n \\cap \\overline{A_n} = \\emptyset)",
        condition: markovRes.step1_partition,
        note: "在解答题第 (1) 问中，必须先写清事件设元与互斥完备性，是首要评分采分点。",
        level: "core",
      },
      {
        name: "【高考采分步 2】全概率公式建立一阶线性递推",
        latex:
          "P(A_{n+1}) = P(A_n)P(A_{n+1}|A_n) + P(\\overline{A_n})P(A_{n+1}|\\overline{A_n})",
        condition: markovRes.step2_recurrence,
        note: `本情景递推整理后为：$${markovRes.recurrenceLatex}$。公比项为 $\\lambda = p_{11} - p_{21} = ${lambdaVal.toFixed(2)}$。`,
        level: "core",
      },
      {
        name: "【高考采分步 3】待定系数法配凑构造等比数列",
        latex:
          "p_{n+1} - t = \\lambda (p_n - t) \\iff p_{n+1} = \\lambda p_n + t(1 - \\lambda)",
        condition: markovRes.step3_geometric,
        note: markovRes.isDegenerate
          ? "公比 $\\lambda = 1$ 时无需配凑，数列各项恒等。"
          : `对比常数项 $t(1 - \\lambda) = p_{21}$，解得 $t = \\frac{p_{21}}{1 - \\lambda} = ${tVal.toFixed(3)}$。新高考阅卷要求展示配凑过程，严禁空降特征根。`,
        level: "important",
      },
      {
        name: "【高考采分步 4】等比数列通项与稳态极限",
        latex:
          "p_n - t = (p_1 - t)\\lambda^{n-1} \\implies p_n = t + (p_1 - t)\\lambda^{n-1}",
        condition: markovRes.step4_generalTerm,
        note: `${markovRes.generalTermLatex ? `当前代入通项：$${markovRes.generalTermLatex}$；` : ""}${
          markovRes.isPureOscillating
            ? "公比 $\\lambda = -1$：在两点间永久等幅振荡，通项存在但极限不存在。"
            : markovRes.isDegenerate
              ? "公比 $\\lambda = 1$：自封闭吸收态，各步概率恒定不变。"
              : markovRes.isOscillating
                ? "公比 $-1 < \\lambda < 0$：在平衡值两侧交替衰减收敛，奇数项偏大、偶数项偏小。"
                : "公比 $0 \\le \\lambda < 1$：单调递进逼近稳态极限。"
        }`,
        level: "derived",
      },
    ],
    gaokaoPoints: [
      {
        text: "【新高考大题 17 分标准采分点链路】①设第 $n$ 步状态事件 $A_n$；②列全概公式展开式 $p_{n+1} = p_{11}p_n + p_{21}(1-p_n)$；③待定系数配凑等比数列；④求通项 $p_n$ 并由 $|\\lambda| < 1$ 求稳态极限 $\\lim_{n \\to \\infty} p_n = t$。",
        importance: "gaokao",
      },
      {
        text: `【情景特征分析 · ${currentPreset.name}】${
          markovRes.isPureOscillating
            ? "公比 $\\lambda = -1$：序列在奇偶步间等幅振荡，大题中常结合周期性考察奇偶分段求和。"
            : markovRes.isDegenerate
              ? "公比 $\\lambda = 1$：系统处于绝对吸收态，概率始终等于初值。"
              : markovRes.isOscillating
                ? "公比 $-1 < \\lambda < 0$：交替振荡衰减收敛，若求前 $n$ 项和 $S_n$，需用裂项或错位相减/等比求和公式处理 $(-|\\lambda|)^{n-1}$。"
                : "公比 $0 \\le \\lambda < 1$：单调收敛，可直接通过差分 $p_{n+1} - p_n$ 判断单调性，解答最值问题。"
        }`,
        importance: "gaokao",
      },
      {
        text: "【规范避坑】切勿混淆初始下标！若题设“第 1 次操作后”对应 $p_1$，则初始确定状态为第 0 步 ($p_0=1$)；若题设首项为 $p_1$，则指数为 $n-1$ 次方，必须与题设对齐！",
        importance: "core",
      },
    ],
    warnings: markovRes.isDegenerate
      ? [
          {
            text: "⚠️ 临界警示：公比 $\\lambda = 1$ ($p_{11} - p_{21} = 1$)，系统处于自封闭吸收态，各步概率恒定不变。",
            level: "warning",
          },
        ]
      : markovRes.isPureOscillating
        ? [
            {
              text: "⚠️ 临界警示：公比 $\\lambda = -1$，系统在两状态间发生永久等幅振荡，极限不存在，前 $n$ 项和呈现周期性。",
              level: "warning",
            },
          ]
        : [],
    mnemonic:
      "全概递推设划分，待定系数配等比，不动点处寻稳态，通项极限步步清。",
  };
}
