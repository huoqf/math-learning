import type { ParamConfig } from "@/components/UI";
import { MATH_COLORS } from "@/theme";
import { paramMeta, MARKOV_PRESETS } from "@/data/registries/probabilityMarkov";

export type MarkovModelType =
  "pass_ball" | "urn_replace" | "game_match" | "pure_oscillation";

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

export function getMarkovTipConfig(
  modelType: MarkovModelType,
  scenarioKey: string,
): TipConfig {
  const preset = MARKOV_PRESETS[scenarioKey];
  if (preset) {
    return {
      variant:
        modelType === "pure_oscillation"
          ? "danger"
          : modelType === "game_match"
            ? "warning"
            : "primary",
      badge: preset.badge,
      condition: preset.condition,
      question: preset.question,
    };
  }

  return {
    variant: "primary",
    badge: "自由探索 · 全概递推与等比数列构造",
    condition:
      "自由设定单步自保持概率 $p_{11}$ 与跨转移概率 $p_{21}$，列出全概率一阶递推式。",
    question:
      "探究公比 $\\lambda = p_{11} - p_{21}$ 正负号对数列振荡与单调收敛特性的决定性影响，并求解稳态极限。",
  };
}

export function buildMarkovParamConfigs(
  params: Record<string, number>,
): ParamConfig[] {
  return [
    {
      key: "p1",
      label: "初始概率 p₁",
      labelFormula: `\\text{初始概率 } \\color{${MATH_COLORS.paramPrimary}}{p_1}`,
      min: paramMeta.p1.min,
      max: paramMeta.p1.max,
      step: paramMeta.p1.step,
      value: params.p1 ?? 1.0,
      description: paramMeta.p1.description,
      group: "初始设定",
    },
    {
      key: "p11",
      label: "自保概率 p₁₁",
      labelFormula: `\\text{自保概率 } \\color{${MATH_COLORS.paramPrimary}}{p_{11}}`,
      min: paramMeta.p11.min,
      max: paramMeta.p11.max,
      step: paramMeta.p11.step,
      value: params.p11 ?? 0.0,
      description: paramMeta.p11.description,
      group: "转移矩阵",
    },
    {
      key: "p21",
      label: "跨转概率 p₂₁",
      labelFormula: `\\text{跨转概率 } \\color{${MATH_COLORS.paramSecondary}}{p_{21}}`,
      min: paramMeta.p21.min,
      max: paramMeta.p21.max,
      step: paramMeta.p21.step,
      value: params.p21 ?? 0.5,
      description: paramMeta.p21.description,
      group: "转移矩阵",
    },
    {
      key: "currStep",
      label: "当前步数 n",
      labelFormula: `\\text{当前步数 } \\color{${MATH_COLORS.function}}{n}`,
      min: paramMeta.currStep.min,
      max: params.maxN ?? 10,
      step: paramMeta.currStep.step,
      value: params.currStep ?? 1,
      description: paramMeta.currStep.description,
      group: "时序演化",
    },
    {
      key: "maxN",
      label: "最大模拟步数",
      labelFormula: `\\text{最大步数 } \\color{${MATH_COLORS.paramTertiary}}{N}`,
      min: paramMeta.maxN.min,
      max: paramMeta.maxN.max,
      step: paramMeta.maxN.step,
      value: params.maxN ?? 10,
      description: paramMeta.maxN.description,
      group: "时序演化",
    },
  ];
}
