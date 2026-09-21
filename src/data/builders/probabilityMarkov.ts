import type { MathPanelData } from "../types";
import { calculateMarkovChain } from "../../math/probabilityMarkov";
import {
  MARKOV_PRESETS,
  FREE_SCENARIO,
  MARKOV_ANSWER_STEPS,
} from "../registries/probabilityMarkov";
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
  const scenarioKey = (config?.scenarioKey as string) || "pass_ball_3";
  const currentPreset = MARKOV_PRESETS[scenarioKey] || FREE_SCENARIO;

  const markovRes = calculateMarkovChain(p1Val, p11Val, p21Val, maxNVal);
  const currentStepItem =
    markovRes.steps.find((s) => s.n === currStepVal) ?? markovRes.steps[0];

  const lambdaVal = markovRes.lambda;
  const tVal = markovRes.pStationary;

  /**
   * 四条定理的名称与步号全部取自 `MARKOV_ANSWER_STEPS`（SSOT）。
   * 与左屏 StepNavigator、中屏 MarkovScene 分区高亮三方同源：
   * 任一处改标题/调步序，另两处自动跟随，不会各自写死而漂移。
   */
  const answerStepTitle = (index: number) =>
    `【高考采分步 ${MARKOV_ANSWER_STEPS[index].step}】${MARKOV_ANSWER_STEPS[index].title}`;

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
        label: "待定系数平衡不动点 t",
        symbol: "t",
        value: markovRes.isDegenerate ? "无唯一解" : tVal.toFixed(4),
        color: MATH_COLORS.focusPoint,
      },
      {
        label: `当前第 ${currStepVal} 步概率 $p_{${currStepVal}}$`,
        symbol: `p_{${currStepVal}}`,
        value: currentStepItem.p1.toFixed(4),
        color: MATH_COLORS.function,
      },
      {
        label: `当前步与不动点偏差 $|p_{${currStepVal}} - t|$`,
        symbol: `|p_{${currStepVal}} - t|`,
        value: markovRes.isDegenerate
          ? "0.0000"
          : currentStepItem.absDelta.toFixed(4),
        color: MATH_COLORS.derivative,
      },
    ],
    theorems: [
      {
        name: answerStepTitle(0),
        step: MARKOV_ANSWER_STEPS[0].step,
        latex:
          "P(A_n) = p_n, \\quad P(\\overline{A_n}) = 1 - p_n \\quad (A_n \\cup \\overline{A_n} = \\Omega, A_n \\cap \\overline{A_n} = \\emptyset)",
        condition: `设第 $n$ 步事件【${currentPreset.labels.s1}】发生概率为 $P(A_n) = p_n$，则对立事件【${currentPreset.labels.s2}】概率为 $P(\\overline{A_n}) = 1 - p_n$。$A_n$ 与 $\\overline{A_n}$ 构成样本空间 $\\Omega$ 的完备划分，初始先验条件 $p_1 = ${p1Val.toFixed(2)}$。`,
        note: "在解答题第 (1) 问中，必须先写清事件设元与互斥完备性，是首要评分采分点（通常占 2 分）。",
        level: "core",
      },
      {
        name: answerStepTitle(1),
        step: MARKOV_ANSWER_STEPS[1].step,
        latex:
          "P(A_{n+1}) = P(A_n)P(A_{n+1}|A_n) + P(\\overline{A_n})P(A_{n+1}|\\overline{A_n})",
        condition: markovRes.step2_recurrence,
        note: `本情景递推化简后为：$${markovRes.recurrenceLatex}$。递推公比为 $\\lambda = p_{11} - p_{21} = ${lambdaVal.toFixed(2)}$。`,
        level: "core",
      },
      {
        name: answerStepTitle(2),
        step: MARKOV_ANSWER_STEPS[2].step,
        latex: markovRes.isDegenerate
          ? "p_{n+1} = p_n \\implies p_n = p_1"
          : "p_{n+1} - t = \\lambda (p_n - t) \\iff p_{n+1} = \\lambda p_n + t(1 - \\lambda)",
        condition: markovRes.step3_geometric,
        note: markovRes.isDegenerate
          ? `公比 $\\lambda = 1.00$，递推式退化为 $p_{n+1} = p_n$。数列为恒等常数列，各项恒等于 $p_1 = ${p1Val.toFixed(3)}$，无需待定系数配凑。`
          : `对比常数项 $t(1 - \\lambda) = p_{21}$，解得平衡不动点 $t = \\frac{p_{21}}{1 - \\lambda} = ${tVal.toFixed(3)}$。新高考阅卷要求展示配凑过程，严禁直接跳步给出平衡值。`,
        level: "important",
      },
      {
        name: answerStepTitle(3),
        step: MARKOV_ANSWER_STEPS[3].step,
        latex: markovRes.isDegenerate
          ? `p_n = ${p1Val.toFixed(3)}`
          : "p_n - t = (p_1 - t)\\lambda^{n-1} \\implies p_n = t + (p_1 - t)\\lambda^{n-1}",
        condition: markovRes.step4_generalTerm,
        note: `${markovRes.generalTermLatex ? `当前代入通项：$${markovRes.generalTermLatex}$；` : ""}${
          markovRes.dynamicType === "degenerate_constant"
            ? "公比 $\\lambda = 1.00$：系统处于吸收退化态，状态概率恒等于初始值。"
            : markovRes.dynamicType === "pure_oscillating"
              ? "公比 $\\lambda = -1.00$：在两个数值间交替进行永久等幅振荡（无衰减），不会趋于单一稳定值。"
              : markovRes.dynamicType === "convergent_damped"
                ? "公比 $-1 < \\lambda < 0$：在平衡值两侧交替振荡衰减收敛（高考作答用「随着项数增大振荡趋近于定值」表述，规避极限记号失分）。"
                : "公比 $0 \\le \\lambda < 1$：单调递进逼近（高考作答用「单调递增/递减趋近于定值」表述即可）。"
        }`,
        level: "derived",
      },
    ],
    gaokaoPoints: [
      {
        text: "【新高考大题 17 分标准采分点链路】①设第 $n$ 步状态事件 $A_n$ 与完备对立事件 $\\overline{A_n}$；②列全概率展开式 $p_{n+1} = p_{11}p_n + p_{21}(1-p_n)$；③待定系数配凑辅助等比数列 $\\{p_n - t\\}$；④求通项 $p_n$ 并由 $|\\lambda| < 1$ 分析收敛行为（高考作答使用「随着项数 $n$ 增大趋于定值 $t$」表述，不直接写极限记号）。",
        importance: "gaokao",
      },
      {
        text: `【情景特征分析 · ${currentPreset.name}】${
          markovRes.dynamicType === "degenerate_constant"
            ? "公比 $\\lambda = 1.00$：自封闭恒等常数列，状态概率保持恒定。"
            : markovRes.dynamicType === "pure_oscillating"
              ? "公比 $\\lambda = -1.00$：等幅交替振荡，无衰减性。"
              : markovRes.dynamicType === "convergent_damped"
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
    warnings: [
      {
        text: "【高考答题规范 · 渐近趋势表述避坑】「极限」为高等数学直观，高中课标解答题卷面严禁直接书写未定义的 $\\lim_{n \\to \\infty} p_n$ 记号；设问考查渐近行为时，必须使用「随着项数 $n$ 增大，$p_n$ 在两侧交替振荡（或单调）趋近于定值 $t$」标准中文表述，规避失分！",
        level: "warning",
      },
    ],
    reasoningSteps: [
      {
        step: 1,
        title: "审题定法 · 设全集事件与完备划分",
        latex: "P(A_n) = p_n, \\quad P(\\overline{A_n}) = 1 - p_n",
        detail: `设第 $n$ 步事件【${currentPreset.labels.s1}】发生概率为 $p_n$，对立事件【${currentPreset.labels.s2}】为 $1-p_n$。两事件构成完备划分，初始 $p_1 = ${p1Val.toFixed(2)}$。`,
        rubric:
          "【高考采分点】设出第 $n$ 步状态事件，说明与对立事件构成完备划分并写出初始概率，得 2 分。",
      },
      {
        step: 2,
        title: "建模联立 · 全概率公式列出递推关系",
        latex: `p_{n+1} = p_{11} p_n + p_{21}(1 - p_n) = ${markovRes.recurrenceLatex}`,
        detail: `由全概率公式展开状态转移，化简整理为一阶线性递推数列 $p_{n+1} = \\lambda p_n + p_{21}$，公比 $\\lambda = ${lambdaVal.toFixed(2)}$。`,
        rubric:
          "【高考采分点】应用全概率公式建立 $p_{n+1}$ 与 $p_n$ 的线性递推关系式，得 3 分。",
      },
      {
        step: 3,
        title: "待定系数 · 配凑辅助等比数列",
        latex: markovRes.isDegenerate
          ? "p_{n+1} = p_n \\implies p_n = p_1"
          : `p_{n+1} - ${tVal.toFixed(3)} = ${lambdaVal.toFixed(2)}(p_n - ${tVal.toFixed(3)})`,
        detail: markovRes.isDegenerate
          ? "公比 $\\lambda = 1.00$，递推关系退化为常数列，无需待定系数配凑。"
          : `设 $p_{n+1} - t = \\lambda(p_n - t)$，对比常数项解得平衡不动点 $t = \\frac{p_{21}}{1-\\lambda} = ${tVal.toFixed(3)}$，构成公比为 $\\lambda$ 的等比数列。`,
        rubric:
          "【高考采分点】待定系数配凑构造辅助等比数列，求出平衡不动点参数，得 3 分。",
      },
      {
        step: 4,
        title: "求解反思 · 通项公式与动态收敛分析",
        latex: markovRes.generalTermLatex,
        detail: `代入等比数列通项公式求出 $p_n$。${
          markovRes.dynamicType === "degenerate_constant"
            ? "序列恒为常数列。"
            : markovRes.dynamicType === "pure_oscillating"
              ? "公比 $\\lambda = -1$，序列永久等幅振荡。"
              : markovRes.dynamicType === "convergent_damped"
                ? "公比 $-1 < \\lambda < 0$，序列在平衡值两侧振荡趋于定值。"
                : "公比 $0 \\le \\lambda < 1$，序列单调趋于定值。"
        }`,
        rubric:
          "【高考采分点】正确求解通项公式 $p_n$ 并按课标规范表述渐近动态变化趋势，得 2 分。",
      },
    ],
    mnemonic:
      "全概递推设划分，待定系数配等比，不动点处定平衡，通项渐近趋势明。",
  };
}
