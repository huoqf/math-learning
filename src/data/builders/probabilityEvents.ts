import type { MathPanelData } from "../types";
import {
  calculateVennProbabilities,
  filterDiceEvents,
  type DiceEventPreset,
} from "@/math/probabilityEvents";
import { MATH_COLORS } from "@/theme";

export interface ProbabilityEventsOptions {
  activeMode?: "venn" | "discrete";
  animId?: string;
}

export function buildProbabilityEventsPanel(
  params: Record<string, number | string>,
  config?: ProbabilityEventsOptions,
): MathPanelData {
  const activeMode = config?.activeMode ?? "venn";

  const pA = Number(params.pA ?? 0.45);
  const pB = Number(params.pB ?? 0.55);
  const overlapRatio = Number(params.overlapRatio ?? 0.4);
  const dicePresetA = (params.dicePresetA ?? "sum_even") as DiceEventPreset;
  const dicePresetB = (params.dicePresetB ?? "same_points") as DiceEventPreset;
  const highlightOp = String(params.highlightOp ?? "none");

  const vennRes = calculateVennProbabilities(pA, pB, overlapRatio);
  const diceRes = filterDiceEvents(dicePresetA, dicePresetB);

  // 1. 实时数学量 (Quantities) - 联动 highlightOp 实现跨屏同频高亮
  const quantities: MathPanelData["quantities"] =
    activeMode === "venn"
      ? [
          {
            label: "事件 A 概率",
            symbol: "P(A)",
            value: vennRes.pA.toFixed(2),
            color: MATH_COLORS.paramPrimary,
            highlight: highlightOp === "onlyA" ? "positive" : undefined,
          },
          {
            label: "事件 B 概率",
            symbol: "P(B)",
            value: vennRes.pB.toFixed(2),
            color: MATH_COLORS.paramSecondary,
            highlight: highlightOp === "onlyB" ? "positive" : undefined,
          },
          {
            label: "交事件(积)概率",
            symbol: "P(A ∩ B)",
            value: vennRes.pIntersection.toFixed(2),
            color: MATH_COLORS.paramTertiary,
            highlight: highlightOp === "intersection" ? "positive" : undefined,
          },
          {
            label: "并事件(和)概率",
            symbol: "P(A ∪ B)",
            value: vennRes.pUnion.toFixed(2),
            color: MATH_COLORS.primary,
            highlight: highlightOp === "union" ? "positive" : undefined,
          },
          {
            label: "事件关系类型",
            value: vennRes.relationText,
            highlight:
              highlightOp === "notA"
                ? "extreme"
                : vennRes.isOpposite
                  ? "extreme"
                  : vennRes.isMutuallyExclusive
                    ? "positive"
                    : undefined,
          },
        ]
      : [
          {
            label: "样本空间容量",
            symbol: "n(Ω)",
            value: "36",
            color: MATH_COLORS.axis,
          },
          {
            label: "事件 A 样本数与概率",
            symbol: "P(A)",
            value: `${diceRes.countA}/36 ≈ ${diceRes.pA.toFixed(3)}`,
            color: MATH_COLORS.paramPrimary,
            highlight: highlightOp === "onlyA" ? "positive" : undefined,
          },
          {
            label: "事件 B 样本数与概率",
            symbol: "P(B)",
            value: `${diceRes.countB}/36 ≈ ${diceRes.pB.toFixed(3)}`,
            color: MATH_COLORS.paramSecondary,
            highlight: highlightOp === "onlyB" ? "positive" : undefined,
          },
          {
            label: "交事件样本数与概率",
            symbol: "P(A ∩ B)",
            value: `${diceRes.countIntersection}/36 ≈ ${diceRes.pIntersection.toFixed(3)}`,
            color: MATH_COLORS.paramTertiary,
            highlight: highlightOp === "intersection" ? "positive" : undefined,
          },
          {
            label: "并事件样本数与概率",
            symbol: "P(A ∪ B)",
            value: `${diceRes.countUnion}/36 ≈ ${diceRes.pUnion.toFixed(3)}`,
            color: MATH_COLORS.primary,
            highlight: highlightOp === "union" ? "positive" : undefined,
          },
        ];

  // 2. 演绎推导链 (Reasoning Steps) —— 严格遵循「符号表达式 → 代入解析式 → 计算结果」三要素
  let reasoningSteps: MathPanelData["reasoningSteps"];

  if (activeMode === "venn") {
    if (vennRes.relation === "subset_A_in_B") {
      reasoningSteps = [
        {
          step: 1,
          title: "审题定法 · 事件包含关系与交集判定",
          latex: `A \\subseteq B \\implies A \\cap B = A \\implies P(A \\cap B) = P(A) = ${vennRes.pA.toFixed(2)}`,
          detail:
            "事件 $A$ 的发生必然导致事件 $B$ 发生，交事件即为事件 $A$ 本身。",
          rubric:
            "【高考采分点】判定事件包含关系并明确交事件即为子事件本身，得 2 分。",
        },
        {
          step: 2,
          title: "建模联立 · 概率单调性与差事件分解",
          latex: `P(A) = ${vennRes.pA.toFixed(2)} \\le P(B) = ${vennRes.pB.toFixed(2)}, \\quad P(B - A) = P(B) - P(A)`,
          detail:
            "由包含性质可知概率具有单调性，差事件概率等于大事件概率减去子事件概率。",
          rubric: "【高考采分点】应用概率单调性与差事件概率分解公式，得 2 分。",
        },
        {
          step: 3,
          title: "求解反思 · 并事件与差事件概率输出",
          latex: `P(A \\cup B) = P(B) = ${vennRes.pB.toFixed(2)}, \\quad P(B - A) = ${vennRes.pB.toFixed(2)} - ${vennRes.pA.toFixed(2)} = ${(vennRes.pB - vennRes.pA).toFixed(2)}`,
          detail:
            "并事件填满外层大集合，差事件 $B - A$（即 $B$ 发生且 $A$ 未发生）测度确立。",
          rubric: "【高考采分点】正确计算并事件与差事件概率数值，得 2 分。",
        },
      ];
    } else if (vennRes.relation === "opposite") {
      reasoningSteps = [
        {
          step: 1,
          title: "审题定法 · 对立事件充要条件检验",
          latex:
            "A \\cap B = \\varnothing \\text{ 且 } A \\cup B = \\Omega \\implies B = \\overline{A}",
          detail: "两事件互斥且并集填满样本空间，满足对立事件定义。",
          rubric:
            "【高考采分点】检验互斥与并全双重条件，确认两事件互为对立事件，得 2 分。",
        },
        {
          step: 2,
          title: "建模联立 · 对立事件互补公式展开",
          latex: `P(\\overline{A}) = 1 - P(A) = 1.00 - ${vennRes.pA.toFixed(2)}`,
          detail: "运用高考“正难则反”逆向破题思想，全集测度减去对立面测度。",
          rubric: "【高考采分点】应用正难则反对立事件互补概率公式，得 2 分。",
        },
        {
          step: 3,
          title: "求解反思 · 对立事件与全集概率确定",
          latex: `P(\\overline{A}) = ${(1 - vennRes.pA).toFixed(2)}, \\quad P(A \\cup \\overline{A}) = P(\\Omega) = 1.00`,
          detail: "必然事件概率恒为 1，对立事件概率之和严格等于 1。",
          rubric:
            "【高考采分点】正确求出对立事件概率并验证与原事件和为 1，得 2 分。",
        },
      ];
    } else if (vennRes.relation === "mutually_exclusive") {
      reasoningSteps = [
        {
          step: 1,
          title: "审题定法 · 辨析事件互斥关系",
          latex: "A \\cap B = \\varnothing \\implies P(A \\cap B) = 0.00",
          detail:
            "两事件不能同时发生，公共样本点为空集，互斥加法公式直接适用。",
          rubric:
            "【高考采分点】说明两事件不能同时发生，指出交集为空集，得 2 分。",
        },
        {
          step: 2,
          title: "建模联立 · 互斥事件概率加法公式展开",
          latex: `P(A \\cup B) = P(A) + P(B) = ${vennRes.pA.toFixed(2)} + ${vennRes.pB.toFixed(2)}`,
          detail: "无公共交集测度，并事件概率直接等于各自分立事件概率代数和。",
          rubric: "【高考采分点】代入互斥事件概率加法公式列出算式，得 2 分。",
        },
        {
          step: 3,
          title: "求解反思 · 并事件概率计算与区间检验",
          latex: `P(A \\cup B) = ${vennRes.pUnion.toFixed(2)}`,
          detail:
            "互斥事件并集概率处于 $[0, 1]$ 之间，完全符合概率可加性公理。",
          rubric:
            "【高考采分点】正确计算并事件概率并检验位于 [0, 1] 区间内，得 2 分。",
        },
      ];
    } else {
      reasoningSteps = [
        {
          step: 1,
          title: "审题定法 · 辨析事件相交性与交集测度",
          latex: `P(A \\cap B) = ${vennRes.pIntersection.toFixed(2)} > 0`,
          detail: "两事件存在公共基本事件，必须应用广义加法公式扣除重复测度。",
          rubric:
            "【高考采分点】明确两事件可同时发生，交集概率大于 0，得 2 分。",
        },
        {
          step: 2,
          title: "建模联立 · 广义概率加法公式展开",
          latex: `P(A \\cup B) = P(A) + P(B) - P(A \\cap B) = ${vennRes.pA.toFixed(2)} + ${vennRes.pB.toFixed(2)} - ${vennRes.pIntersection.toFixed(2)}`,
          detail: "容斥原理：两集合并集测度减去重复计算的交集测度。",
          rubric:
            "【高考采分点】应用广义概率加法公式（容斥原理）扣除交集重复项，得 2 分。",
        },
        {
          step: 3,
          title: "求解反思 · 并事件与补事件概率确定",
          latex: `P(A \\cup B) = ${vennRes.pUnion.toFixed(2)}, \\quad P(\\overline{A}) = 1 - P(A) = ${(1 - vennRes.pA).toFixed(2)}`,
          detail: "任意两随机事件并集概率恒满足广义加法定理。",
          rubric: "【高考采分点】正确计算出并事件与补事件概率，得 2 分。",
        },
      ];
    }
  } else {
    // 离散型推导链特化 (AGENTS.md 公理 1 & 2：根据古典样本点几何关系演绎)
    const isSubsetBinA =
      diceRes.countIntersection === diceRes.countB && diceRes.countB > 0;
    const isSubsetAinB =
      diceRes.countIntersection === diceRes.countA && diceRes.countA > 0;

    if (diceRes.isOpposite) {
      reasoningSteps = [
        {
          step: 1,
          title: "审题定法 · 检验离散对立充要条件",
          latex: `n(A \\cap B) = 0 \\quad \\text{且} \\quad n(A \\cup B) = 36 = n(\\Omega)`,
          detail: "两事件无公共样本点且占满整个样本空间，构成对立事件。",
          rubric:
            "【高考采分点】检验离散点阵中无公共点且占满样本空间，明确对立关系，得 2 分。",
        },
        {
          step: 2,
          title: "建模联立 · 对立事件概率互补展开",
          latex: `P(A) + P(B) = \\frac{${diceRes.countA}}{36} + \\frac{${diceRes.countB}}{36} = \\frac{36}{36}`,
          detail: "两对立事件的概率之和严格恒等于必然事件的概率 1。",
          rubric:
            "【高考采分点】列出对立事件概率之和等于必然事件概率的等式，得 2 分。",
        },
        {
          step: 3,
          title: "求解反思 · 正难则反逆向概率计算",
          latex: `P(B) = 1 - P(A) = 1 - ${(diceRes.countA / 36).toFixed(3)} = ${(diceRes.countB / 36).toFixed(3)}`,
          detail: "符合新高考正难则反逆向破题规范，直接化简计算。",
          rubric:
            "【高考采分点】应用正难则反公式准确计算出对立事件概率值，得 2 分。",
        },
      ];
    } else if (isSubsetBinA) {
      reasoningSteps = [
        {
          step: 1,
          title: "审题定法 · 离散样本点包含关系判定",
          latex: `n(A \\cap B) = n(B) = ${diceRes.countB} \\implies B \\subseteq A`,
          detail:
            "事件 $B$ 的所有样本点均属于事件 $A$，事件 $B$ 蕴含事件 $A$。",
          rubric: "【高考采分点】根据点阵交集容量判定子集蕴含关系，得 2 分。",
        },
        {
          step: 2,
          title: "建模联立 · 概率单调性与差事件样本数",
          latex: `P(B) = \\frac{${diceRes.countB}}{36} \\le P(A) = \\frac{${diceRes.countA}}{36}, \\quad n(A - B) = ${diceRes.countA} - ${diceRes.countB} = ${diceRes.countA - diceRes.countB}`,
          detail:
            "子事件概率不大于母事件概率，差事件对应 A 发生而 B 不发生的基本事件数。",
          rubric: "【高考采分点】列出差事件样本数与包含单调性不等式，得 2 分。",
        },
        {
          step: 3,
          title: "求解反思 · 差事件与并事件概率输出",
          latex: `P(A - B) = \\frac{${diceRes.countA - diceRes.countB}}{36} \\approx ${((diceRes.countA - diceRes.countB) / 36).toFixed(3)}, \\quad P(A \\cup B) = P(A) \\approx ${diceRes.pA.toFixed(3)}`,
          detail: "并事件容量等同于母事件 $A$，差事件点数严格等于基数之差。",
          rubric: "【高考采分点】正确计算差事件与并事件古典概率比值，得 2 分。",
        },
      ];
    } else if (isSubsetAinB) {
      reasoningSteps = [
        {
          step: 1,
          title: "审题定法 · 离散样本点包含关系判定",
          latex: `n(A \\cap B) = n(A) = ${diceRes.countA} \\implies A \\subseteq B`,
          detail:
            "事件 $A$ 的所有样本点均属于事件 $B$，事件 $A$ 蕴含事件 $B$。",
          rubric: "【高考采分点】根据点阵交集容量判定子集蕴含关系，得 2 分。",
        },
        {
          step: 2,
          title: "建模联立 · 概率单调性与差事件样本数",
          latex: `P(A) = \\frac{${diceRes.countA}}{36} \\le P(B) = \\frac{${diceRes.countB}}{36}, \\quad n(B - A) = ${diceRes.countB} - ${diceRes.countA} = ${diceRes.countB - diceRes.countA}`,
          detail:
            "子事件概率不大于母事件概率，差事件对应 B 发生而 A 不发生的基本事件数。",
          rubric: "【高考采分点】列出差事件样本数与包含单调性不等式，得 2 分。",
        },
        {
          step: 3,
          title: "求解反思 · 差事件与并事件概率输出",
          latex: `P(B - A) = \\frac{${diceRes.countB - diceRes.countA}}{36} \\approx ${((diceRes.countB - diceRes.countA) / 36).toFixed(3)}, \\quad P(A \\cup B) = P(B) \\approx ${diceRes.pB.toFixed(3)}`,
          detail: "并事件容量等同于母事件 $B$，差事件点数严格等于基数之差。",
          rubric: "【高考采分点】正确计算差事件与并事件古典概率比值，得 2 分。",
        },
      ];
    } else if (diceRes.isMutuallyExclusive) {
      reasoningSteps = [
        {
          step: 1,
          title: "审题定法 · 辨析离散点阵互斥关系",
          latex: `n(A \\cap B) = 0 \\implies A \\cap B = \\varnothing`,
          detail: "两事件在 36 个点阵中无任何公共交点，不能同时发生。",
          rubric:
            "【高考采分点】确认离散点阵交集为空集，判定两事件互斥，得 2 分。",
        },
        {
          step: 2,
          title: "建模联立 · 互斥事件加法公式展开",
          latex: `P(A \\cup B) = \\frac{n(A) + n(B)}{36} = \\frac{${diceRes.countA} + ${diceRes.countB}}{36}`,
          detail:
            "两事件互斥无公共重复点，并集样本数直接等于两事件样本数之和。",
          rubric:
            "【高考采分点】应用互斥加法公式累加各自分立样本容量，得 2 分。",
        },
        {
          step: 3,
          title: "求解反思 · 并事件概率计算与自洽核验",
          latex: `P(A \\cup B) = \\frac{${diceRes.countUnion}}{36} \\approx ${diceRes.pUnion.toFixed(3)}`,
          detail: "互斥加法公式计算结果与点阵计数完全一致。",
          rubric:
            "【高考采分点】正确计算出并事件概率并验证与点阵计数一致，得 2 分。",
        },
      ];
    } else {
      reasoningSteps = [
        {
          step: 1,
          title: "审题定法 · 建立等可能样本空间坐标系",
          latex: "n(\\Omega) = 6 \\times 6 = 36",
          detail:
            "掷两枚质地均匀骰子，每个结果点对 $(x, y)$ 出现的概率均为 $\\frac{1}{36}$。",
          rubric:
            "【高考采分点】利用坐标法或网格列表写明样本空间包含 36 种等可能结果，得 2 分。",
        },
        {
          step: 2,
          title: "建模联立 · 集合基数统计与交事件样本列举",
          latex: `n(A) = ${diceRes.countA}, \\quad n(B) = ${diceRes.countB}, \\quad n(A \\cap B) = ${diceRes.countIntersection}`,
          detail: "网格坐标法统计两事件各自包含的基本事件数及公共交集样本点。",
          rubric:
            "【高考采分点】准确统计事件 $A$、$B$ 及交事件包含的基本事件个数，得 2 分。",
        },
        {
          step: 3,
          title: "求解反思 · 广义加法公式验算与概率比值输出",
          latex: `P(A \\cup B) = \\frac{n(A \\cup B)}{36} = \\frac{${diceRes.countA} + ${diceRes.countB} - ${diceRes.countIntersection}}{36} = \\frac{${diceRes.countUnion}}{36} \\approx ${diceRes.pUnion.toFixed(3)}`,
          detail: "离散计数与广义加法公式结果完全吻合，符合高考大题规范书写。",
          rubric:
            "【高考采分点】应用古典概型公式与容斥原理正确算出并事件概率，得 2 分。",
        },
      ];
    }
  }

  // 3. 课标核心定理 (Theorems)
  const theorems: MathPanelData["theorems"] = [
    {
      name: "概率的基本性质与取值范围",
      latex:
        "0 \\le P(A) \\le 1, \\quad P(\\Omega) = 1, \\quad P(\\varnothing) = 0",
      level: "core",
      prerequisites: ["必然事件必然发生，不可能事件必然不发生"],
    },
    {
      name: "互斥事件概率加法公式",
      latex: "A \\cap B = \\varnothing \\implies P(A \\cup B) = P(A) + P(B)",
      level: "core",
      prerequisites: ["事件 $A$ 与事件 $B$ 不能同时发生（互斥）"],
    },
    {
      name: "对立事件概率公式",
      latex:
        "A \\cap B = \\varnothing \\text{ 且 } A \\cup B = \\Omega \\implies P(B) = P(\\overline{A}) = 1 - P(A)",
      level: "core",
      prerequisites: ["事件 $A$ 与事件 $B$ 必有一个发生且仅有一个发生"],
    },
    {
      name: "广义概率加法公式 (容斥原理)",
      latex: "P(A \\cup B) = P(A) + P(B) - P(A \\cap B)",
      level: "important",
      prerequisites: ["对任意两个随机事件 $A$ 与 $B$ 恒成立"],
    },
    {
      name: "事件包含与概率单调性",
      latex:
        "A \\subseteq B \\implies P(A) \\le P(B) \\quad \\text{且} \\quad P(B - A) = P(B) - P(A)",
      level: "important",
      prerequisites: ["事件 $A$ 发生必然导致事件 $B$ 发生"],
    },
  ];

  // 4. 高考秒杀考点 (GaokaoPoints)
  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "互斥与对立辨析口诀：「互斥不并全，对立必互斥」。两事件互斥指不能同时发生（$A \\cap B = \\varnothing$），但不一定占满全集；对立则要求互斥且并集填满全集 $\\Omega$。",
      importance: "gaokao",
    },
    {
      text: "逆向破题法「正难则反」：题目出现「至少有一个」、「至多有一个」或正面分类讨论繁琐时，优先转向对立事件，利用 $P(A) = 1 - P(\\overline{A})$ 快速化简。",
      importance: "gaokao",
    },
    {
      text: "新高考大题第 (1) 问规范作答：书写样本空间时务必使用坐标法 $(x, y)$ 或树状图/列表法，确保 36 种等可能结果不重不漏，严防遗漏标号顺序导致分母错误。",
      importance: "core",
    },
  ];

  // 5. 警示项 (Warnings)
  const warnings: MathPanelData["warnings"] = [];
  if (vennRes.warningMessage) {
    warnings.push({
      text: vennRes.warningMessage,
      level: "danger",
    });
  }

  return {
    quantities,
    reasoningSteps,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "概率取值零到一，必然是一空为零；互斥加法直接加，相交莫忘减交集；正难则反寻对立，减去反面最省力。",
  };
}
