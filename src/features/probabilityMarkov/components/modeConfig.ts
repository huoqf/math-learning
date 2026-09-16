import type { ParamConfig } from "@/components/UI";
import { MATH_COLORS } from "@/theme";
import { paramMeta, MARKOV_PRESETS } from "@/data/registries/probabilityMarkov";

export type MarkovModelType =
  "pass_ball" | "urn_replace" | "game_match" | "pure_oscillation" | "all";

export interface TipConfig {
  variant: "info" | "primary" | "warning" | "danger";
  badge: string;
  condition: string;
  question: string;
}

export function getMarkovFormulaLatex(params: Record<string, number>): string {
  const p11 = params.p11 ?? 0.0;
  const p21 = params.p21 ?? 0.5;
  const lambda = p11 - p21;
  const lambdaBaseStr = lambda.toFixed(2);
  const lambdaStr = lambda >= 0 ? lambdaBaseStr : `(${lambdaBaseStr})`;
  const betaStr = p21.toFixed(2);
  const denom = 1 - lambda;
  const tStr = Math.abs(denom) > 1e-6 ? (p21 / denom).toFixed(3) : "1.000";

  return `\\color{${MATH_COLORS.function}}{p_{n+1}} = \\color{${MATH_COLORS.paramPrimary}}{${p11.toFixed(2)}} p_n + \\color{${MATH_COLORS.paramSecondary}}{${p21.toFixed(2)}}(1-p_n) = ${lambdaStr} p_n + ${betaStr} \\implies \\color{${MATH_COLORS.derivative}}{p_{n+1} - ${tStr}} = ${lambdaStr}(p_n - ${tStr})`;
}

export function getMarkovTipConfig(scenarioKey: string): TipConfig {
  const preset = MARKOV_PRESETS[scenarioKey];
  if (preset) {
    const variant =
      scenarioKey === "game_pingpong"
        ? "warning"
        : scenarioKey === "pass_ball_2020" || scenarioKey === "pass_ball_3"
          ? "primary"
          : "info";
    return {
      variant,
      badge: preset.badge,
      condition: preset.condition,
      question: preset.question,
    };
  }

  return {
    variant: "primary",
    badge: "自由探索 · 概率递推数列构造",
    condition:
      "【探究背景】探究二状态离散系统在一阶线性全概率转移下的动态演化规律与等比数列构造通法。\n【初始条件】设第 $n$ 步处于状态 1 的概率为 $p_n$。自主调节先验概率 $p_1$、单步自保持率 $p_{11}$ 与跨步转移率 $p_{21}$。",
    question:
      "(1) 由全概率公式写出一阶递推式 $p_{n+1} = (p_{11}-p_{21})p_n + p_{21}$；\n(2) 探究公比 $\\lambda = p_{11}-p_{21}$ 正负号对单调递进与摆动收敛的决定性作用，并求稳态极限。",
  };
}

export function buildMarkovParamConfigs(
  params: Record<string, number>,
  scenarioKey: string = "pass_ball_2020",
): ParamConfig[] {
  const isPassBall =
    scenarioKey === "pass_ball_2020" || scenarioKey === "pass_ball_3";
  const isUrn = scenarioKey === "urn_replace";
  const isGame = scenarioKey === "game_pingpong";

  const p1Formula = isPassBall
    ? `\\text{甲持球 } \\color{${MATH_COLORS.paramPrimary}}{p_1}`
    : isUrn
      ? `\\text{摸出白球 } \\color{${MATH_COLORS.paramPrimary}}{p_1}`
      : isGame
        ? `\\text{甲领先 } \\color{${MATH_COLORS.paramPrimary}}{p_1}`
        : `\\text{初始概率 } \\color{${MATH_COLORS.paramPrimary}}{p_1}`;

  const p11Formula = isPassBall
    ? `\\text{甲留球 } \\color{${MATH_COLORS.paramPrimary}}{P(A_{n+1}|A_n)}`
    : isUrn
      ? `\\text{白球放回 } \\color{${MATH_COLORS.paramPrimary}}{P(A_{n+1}|A_n)}`
      : isGame
        ? `\\text{甲发甲得分 } \\color{${MATH_COLORS.paramPrimary}}{P(A_{n+1}|A_n)}`
        : `\\text{保持概率 } \\color{${MATH_COLORS.paramPrimary}}{p_{11}}`;

  const p21Formula = isPassBall
    ? `\\text{乙传甲 } \\color{${MATH_COLORS.paramSecondary}}{P(A_{n+1}|\\overline{A_n})}`
    : isUrn
      ? `\\text{黑球换白 } \\color{${MATH_COLORS.paramSecondary}}{P(A_{n+1}|\\overline{A_n})}`
      : isGame
        ? `\\text{乙发甲得分 } \\color{${MATH_COLORS.paramSecondary}}{P(A_{n+1}|\\overline{A_n})}`
        : `\\text{转移概率 } \\color{${MATH_COLORS.paramSecondary}}{p_{21}}`;

  const p1Desc = isPassBall
    ? "第 1 次传球前球在甲手中的概率"
    : isUrn
      ? "第 1 次摸球摸出白球的先验概率"
      : isGame
        ? "平局开局时甲处于领先的初始概率"
        : "初始处于事件 A 的先验概率 p₁";

  const p11Desc = isPassBall
    ? "甲拿球留在甲手中的概率 P(Aₙ₊₁|Aₙ)"
    : isUrn
      ? "摸出白球后放回白球的概率 P(Aₙ₊₁|Aₙ)"
      : isGame
        ? "甲发球局甲得分的概率 P(Aₙ₊₁|Aₙ)"
        : "同状态保持条件概率 P(Aₙ₊₁|Aₙ)";

  const p21Desc = isPassBall
    ? "乙拿球后传给甲的概率 P(Aₙ₊₁|Āₙ)"
    : isUrn
      ? "摸出黑球后换入白球的概率 P(Aₙ₊₁|Āₙ)"
      : isGame
        ? "乙发球局甲得分的概率 P(Aₙ₊₁|Āₙ)"
        : "对立状态转移条件概率 P(Aₙ₊₁|Āₙ)";

  return [
    {
      key: "p1",
      label: "初始概率 p₁",
      labelFormula: p1Formula,
      min: paramMeta.p1.min,
      max: paramMeta.p1.max,
      step: paramMeta.p1.step,
      value: params.p1 ?? 1.0,
      description: p1Desc,
      group: "题设条件概率",
    },
    {
      key: "p11",
      label: "保持条件概率",
      labelFormula: p11Formula,
      min: paramMeta.p11.min,
      max: paramMeta.p11.max,
      step: paramMeta.p11.step,
      value: params.p11 ?? 0.0,
      description: p11Desc,
      group: "题设条件概率",
    },
    {
      key: "p21",
      label: "转移条件概率",
      labelFormula: p21Formula,
      min: paramMeta.p21.min,
      max: paramMeta.p21.max,
      step: paramMeta.p21.step,
      value: params.p21 ?? 0.5,
      description: p21Desc,
      group: "题设条件概率",
    },
    {
      key: "currStep",
      label: "观察步数 n",
      labelFormula: `\\text{观察步数 } \\color{${MATH_COLORS.function}}{n}`,
      min: paramMeta.currStep.min,
      max: params.maxN ?? 10,
      step: paramMeta.currStep.step,
      value: params.currStep ?? 1,
      description: "观察第 n 步状态分布与全概展开",
      group: "数列步数观察",
    },
    {
      key: "maxN",
      label: "最大项数 N",
      labelFormula: `\\text{最大项数 } \\color{${MATH_COLORS.paramTertiary}}{N}`,
      min: paramMeta.maxN.min,
      max: paramMeta.maxN.max,
      step: paramMeta.maxN.step,
      value: params.maxN ?? 10,
      description: "数列散点图观察的最大项数",
      group: "数列步数观察",
    },
  ];
}
