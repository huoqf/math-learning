import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  ReasoningStep,
  GaokaoPoint,
  WarningItem,
} from "@/data/types";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber, formatMathProb } from "@/utils/mathFormat";
import {
  calculateIndependenceMeasure,
  calculateDiscreteDiceEvents,
} from "@/math/probabilityIndependence";
import type { ProbabilityIndependenceParams } from "@/data/registries/probabilityIndependence";
import { DEFAULT_PROBABILITY_INDEPENDENCE_PARAMS } from "@/data/registries/probabilityIndependence";

export function buildProbabilityIndependencePanel(
  rawParams?: Record<string, unknown>,
  _config?: Record<string, unknown>,
): MathPanelData {
  const pA =
    typeof rawParams?.pA === "number"
      ? rawParams.pA
      : DEFAULT_PROBABILITY_INDEPENDENCE_PARAMS.pA;
  const pB =
    typeof rawParams?.pB === "number"
      ? rawParams.pB
      : DEFAULT_PROBABILITY_INDEPENDENCE_PARAMS.pB;
  const overlapRatio =
    typeof rawParams?.overlapRatio === "number"
      ? rawParams.overlapRatio
      : DEFAULT_PROBABILITY_INDEPENDENCE_PARAMS.overlapRatio;
  const activeMode =
    (rawParams?.activeMode as "venn" | "discrete") ||
    DEFAULT_PROBABILITY_INDEPENDENCE_PARAMS.activeMode;
  const dicePresetA =
    (rawParams?.dicePresetA as ProbabilityIndependenceParams["dicePresetA"]) ||
    DEFAULT_PROBABILITY_INDEPENDENCE_PARAMS.dicePresetA;
  const dicePresetB =
    (rawParams?.dicePresetB as ProbabilityIndependenceParams["dicePresetB"]) ||
    DEFAULT_PROBABILITY_INDEPENDENCE_PARAMS.dicePresetB;

  const mathRes = calculateIndependenceMeasure(pA, pB, overlapRatio);
  const diceRes = calculateDiscreteDiceEvents(dicePresetA, dicePresetB);

  // 1. 特征量构建
  const quantities: MathQuantity[] =
    activeMode === "venn"
      ? [
          {
            label: "事件 A 先验概率",
            symbol: "P(A)",
            value: formatMathProb(mathRes.pA),
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: "事件 B 先验概率",
            symbol: "P(B)",
            value: formatMathProb(mathRes.pB),
            color: MATH_COLORS.paramSecondary,
          },
          {
            label: "积事件概率",
            symbol: "P(AB)",
            value: formatMathProb(mathRes.pAB),
            color: MATH_COLORS.paramTertiary,
          },
          {
            label: "理论独立乘积",
            symbol: "P(A)P(B)",
            value: formatMathProb(mathRes.pA * mathRes.pB),
            color: MATH_COLORS.primary,
          },
          {
            label: "条件概率",
            symbol: "P(B|A)",
            value:
              mathRes.pConditionalBGivenA !== null
                ? formatMathProb(mathRes.pConditionalBGivenA)
                : "无定义",
            color: MATH_COLORS.setB,
          },
        ]
      : [
          {
            label: `事件 A (${diceRes.eventA.name})`,
            symbol: "P(A)",
            value: `${diceRes.outcomesA.length}/6 = ${formatMathNumber(diceRes.pA)}`,
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: `事件 B (${diceRes.eventB.name})`,
            symbol: "P(B)",
            value: `${diceRes.outcomesB.length}/6 = ${formatMathNumber(diceRes.pB)}`,
            color: MATH_COLORS.paramSecondary,
          },
          {
            label: "交集事件 AB",
            symbol: "P(AB)",
            value: `${diceRes.intersectionOutcomes.length}/6 = ${formatMathNumber(diceRes.pAB)}`,
            color: MATH_COLORS.paramTertiary,
          },
          {
            label: "独立判定乘积",
            symbol: "P(A)P(B)",
            value: formatMathNumber(diceRes.pA * diceRes.pB),
            color: MATH_COLORS.primary,
          },
          {
            label: "条件概率 (A发生下B)",
            symbol: "P(B|A)",
            value:
              diceRes.pConditionalBGivenA !== null
                ? `${diceRes.formulaPBGivenA} = ${formatMathNumber(diceRes.pConditionalBGivenA)}`
                : "无定义",
            color: MATH_COLORS.setB,
          },
        ];

  // 2. 推导链三部曲（符号 -> 代入 -> 结论）
  const reasoningSteps: ReasoningStep[] =
    activeMode === "venn"
      ? [
          {
            step: 1,
            title: "审题列式 · 提取先验与积事件测度",
            latex: `P(A) = ${formatMathProb(mathRes.pA)}, \\quad P(B) = ${formatMathProb(mathRes.pB)}, \\quad P(AB) = ${formatMathProb(mathRes.pAB)}`,
            detail:
              "审题明确两事件各自先验概率与两集合实际重叠交集概率，奠定辨析基准。",
            rubric: "【高考采分点】审题准确写出先验概率与积事件概率得 2 分。",
          },
          {
            step: 2,
            title: "建模联立 · 计算独立性乘积偏差",
            latex: `\\Delta = P(AB) - P(A)P(B) = ${formatMathProb(mathRes.pAB)} - (${formatMathProb(mathRes.pA)} \\times ${formatMathProb(mathRes.pB)}) = ${formatMathProb(mathRes.productDiff)}`,
            detail:
              "由独立性充要条件 $P(AB) = P(A)P(B)$ 构造差值方程，衡量两事件统计相关程度。",
            rubric: "【高考采分点】列出乘积判定式并计算独立性偏差值得 3 分。",
          },
          {
            step: 3,
            title: "求解反思 · 条件概率对比与关系判决",
            latex:
              mathRes.pConditionalBGivenA !== null
                ? `P(B|A) = \\frac{P(AB)}{P(A)} = \\frac{${formatMathProb(mathRes.pAB)}}{${formatMathProb(mathRes.pA)}} = ${formatMathProb(mathRes.pConditionalBGivenA)} ${mathRes.isIndependent ? "=" : "\\ne"} P(B) = ${formatMathProb(mathRes.pB)}`
                : `P(A)=0 \\implies P(B|A) \\text{ 未定义}`,
            detail: mathRes.isMutuallyExclusive
              ? "满足 $P(AB) = 0$，两事件互斥（集合无公共元素）。正概率下 $P(A)P(B) > 0 \\ne 0$，因此互斥事件必定不独立！"
              : mathRes.isIndependent
                ? "满足 $P(AB) = P(A)P(B)$ 且 $P(B|A) = P(B)$，两事件相互独立。条件概率等于无条件概率，先验信息不改变后验判断。"
                : "既不满足 $P(AB) = 0$ 亦不满足 $P(AB) = P(A)P(B)$，两事件相交但不独立（存在统计相关性）。",
            rubric:
              "【高考采分点】准确判定独立性与互斥排他关系并规范作答得 3 分。",
          },
        ]
      : [
          {
            step: 1,
            title: "审题列式 · 统计样本点与列举基本事件",
            latex: `|\\Omega|=6, \\quad |A|=${diceRes.outcomesA.length}, \\quad |B|=${diceRes.outcomesB.length}, \\quad |A \\cap B|=${diceRes.intersectionOutcomes.length}`,
            detail:
              "古典概型下等可能样本空间 $\\Omega = \\{1, 2, 3, 4, 5, 6\\}$，求出各事件样本点数。",
            rubric:
              "【高考采分点】列举基本事件并准确统计各事件样本点数得 2 分。",
          },
          {
            step: 2,
            title: "建模联立 · 计算古典概率与独立乘积",
            latex: `P(A)=\\frac{${diceRes.outcomesA.length}}{6}, \\quad P(B)=\\frac{${diceRes.outcomesB.length}}{6} \\implies P(A)P(B)=\\frac{${diceRes.outcomesA.length * diceRes.outcomesB.length}}{36}`,
            detail: "代入古典概型计算公式，求解独立性判据所需的先验概率乘积。",
            rubric: "【高考采分点】分别求出各自概率并计算先验乘积得 3 分。",
          },
          {
            step: 3,
            title: "求解反思 · 对比交集点数判定独立性与互斥性",
            latex: `P(AB)=\\frac{${diceRes.intersectionOutcomes.length}}{6} ${diceRes.isIndependent ? "=" : "\\ne"} P(A)P(B)=\\frac{${diceRes.outcomesA.length * diceRes.outcomesB.length}}{36}, \\quad P(B|A)=${diceRes.formulaPBGivenA}`,
            detail: diceRes.isIndependent
              ? `共有点为 $\\{${diceRes.intersectionOutcomes.join(", ")}\\}$，交集非空故不互斥；乘积严格相等且条件概率 $P(B|A) = P(B)$，故相互独立！`
              : diceRes.isMutuallyExclusive
                ? `交集无共同元素 $\\varnothing$，故两事件互斥；乘积为正故不独立！`
                : `交集有共有点 $\\{${diceRes.intersectionOutcomes.join(", ")}\\}$，但乘积不相等且 $P(B|A) \\ne P(B)$，两事件相交但不独立。`,
            rubric:
              "【高考采分点】由乘积关系对比得出独立与互斥判决结论得 3 分。",
          },
        ];

  // 3. 定理公式
  const theorems: Theorem[] = [
    {
      name: "事件相互独立性定义（乘法公式）",
      latex: "P(AB) = P(A)P(B)",
      level: "core",
      prerequisites: [
        "对于任意两随机事件 $A$ 与 $B$",
        "当 $P(A) > 0$ 时，充要等价于条件概率 $P(B|A) = P(B)$",
      ],
    },
    {
      name: "互斥事件定义与加法公式",
      latex:
        "A \\cap B = \\varnothing \\implies P(AB) = 0 \\implies P(A \\cup B) = P(A) + P(B)",
      level: "core",
      prerequisites: ["两事件在同一次试验中不可能同时发生"],
    },
    {
      name: "独立性与互斥性的对立排斥定理",
      latex:
        "P(A) > 0, P(B) > 0 \\implies (A, B \\text{ 互斥} \\implies A, B \\text{ 必不独立})",
      level: "important",
      prerequisites: [
        "互斥事件积事件 $P(AB)=0$，而独立乘积 $P(A)P(B)>0$，两者必矛盾",
      ],
    },
    {
      name: "独立事件的四对等价性质",
      latex:
        "A \\text{ 与 } B \\text{ 相互独立} \\iff A \\text{ 与 } \\bar{B} \\text{ 相互独立} \\iff \\bar{A} \\text{ 与 } B \\text{ 相互独立} \\iff \\bar{A} \\text{ 与 } \\bar{B} \\text{ 相互独立}",
      level: "important",
      prerequisites: [
        "事件 $A$ 与 $B$ 相互独立，任意一方替换为对立事件后独立性仍保持",
      ],
    },
  ];

  // 4. 高考压轴考点
  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "【高考避坑·概念混淆】“互斥”是试验结果能否并存的定性状态（不能同时发生），而“独立”是试验结果概率是否相互干扰的定量关系。答题时严禁用互斥公式计算独立事件概率。",
      importance: "gaokao",
    },
    {
      text: "【真题通法·四种等价检验】证明两事件独立：① 检验乘法公式 $P(AB) = P(A)P(B)$；② 检验条件概率 $P(B|A) = P(B)$；③ 检验反向条件概率 $P(A|B) = P(A)$；④ 检验对立乘积 $P(\\bar{A}\\bar{B}) = P(\\bar{A})P(\\bar{B})$。",
      importance: "gaokao",
    },
    {
      text: "【模型秒杀·并集逆向转化】对于相互独立事件至少发生一次的概率，正向求和计算繁杂，必须熟练使用逆向思维：$P(A \\cup B) = 1 - P(\\bar{A}\\bar{B}) = 1 - P(\\bar{A})P(\\bar{B})$。",
      importance: "core",
    },
  ];

  // 5. 警示项
  const warnings: WarningItem[] = [];
  const currentMutuallyExclusive =
    activeMode === "venn"
      ? mathRes.isMutuallyExclusive
      : diceRes.isMutuallyExclusive;
  const currentIndependent =
    activeMode === "venn" ? mathRes.isIndependent : diceRes.isIndependent;
  const currentPA = activeMode === "venn" ? mathRes.pA : diceRes.pA;
  const currentPB = activeMode === "venn" ? mathRes.pB : diceRes.pB;

  if (currentMutuallyExclusive && currentPA > 0.05 && currentPB > 0.05) {
    warnings.push({
      level: "danger",
      text: "【互斥不独立预警】当前两事件处于互斥状态 ($P(AB) = 0$)，因两事件概率均大于 0，乘积 $P(A)P(B) > 0$，故此时两事件绝对不独立！",
    });
  } else if (currentIndependent) {
    warnings.push({
      level: "info",
      text: "【严格独立状态】当前两事件精确满足 $P(AB) = P(A)P(B)$，条件概率 $P(B|A) = P(B)$，事件 $A$ 的发生对 $B$ 无任何概率扰动。",
    });
  }

  return {
    quantities,
    reasoningSteps,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "互斥两角不相交，独立乘积恰刚好；正率互斥必相关，逆向求并用补套。",
  };
}
