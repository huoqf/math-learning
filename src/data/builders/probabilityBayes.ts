import type { MathPanelData } from "../types";
import {
  calculateConditionalProb,
  calculateTotalProb,
  calculateBayesDiagnostic,
} from "../../math/probabilityBayes";
import { MATH_COLORS } from "../../theme";

export function buildProbabilityBayesPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const activeMode = (config?.activeMode as string) || "conditional";

  // 1. 模式一：条件概率与样本空间压缩
  if (activeMode === "conditional") {
    const pA = params.pA ?? 0.5;
    const pB = params.pB ?? 0.4;
    const pAB = Math.min(params.pAB ?? 0.2, Math.min(pA, pB));

    const res = calculateConditionalProb(pA, pB, pAB);

    return {
      quantities: [
        {
          label: "条件事件 A 概率 P(A)",
          symbol: "P(A)",
          value: res.pA.toFixed(3),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "目标事件 B 先验概率 P(B)",
          symbol: "P(B)",
          value: res.pB.toFixed(3),
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "联合交集概率 P(AB)",
          symbol: "P(AB)",
          value: res.pAB.toFixed(3),
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "已知 A 发生下的条件概率 P(B|A)",
          symbol: "P(B|A)",
          value: res.isDegenerate ? "无意义" : res.pB_given_A.toFixed(4),
          color: MATH_COLORS.function,
        },
        {
          label: "已知 B 发生下的条件概率 P(A|B)",
          symbol: "P(A|B)",
          value: res.pA_given_B.toFixed(4),
          color: MATH_COLORS.derivative,
        },
        {
          label: "并集概率 P(A ∪ B)",
          symbol: "P(A \\cup B)",
          value: res.pUnion.toFixed(3),
          color: MATH_COLORS.functionTransformed,
        },
      ],
      theorems: [
        {
          name: "条件概率定义 (Conditional Probability)",
          latex: `P(B|A) = \\frac{P(AB)}{P(A)} \\quad (P(A) > 0)`,
          condition: "P(A) > 0",
          note: "已知 A 发生后，样本空间由 Ω 压缩缩减至 A，有效区域为 AB。",
          level: "core",
        },
        {
          name: "概率乘法公式 (Multiplication Rule)",
          latex: `P(AB) = P(A)P(B|A) = P(B)P(A|B)`,
          note: "联合概率等于“第一阶段先验概率”乘以“第二阶段条件概率”。",
          level: "important",
        },
        {
          name: "条件概率的加法公式与性质",
          latex: `P(B_1 \\cup B_2 | A) = P(B_1|A) + P(B_2|A) - P(B_1 B_2 | A)`,
          note: "条件概率 P(·|A) 满足概率的三条公理（非负性、规范性、可加性）。",
          level: "derived",
        },
      ],
      gaokaoPoints: [
        {
          text: "高考一轮必考：识别“已知……”为条件事件 A，将样本空间锁定在 A 集合内部分子为交集 AB 的元素个数。",
          importance: "gaokao",
        },
        {
          text: "独立性判定：若 P(B|A) = P(B) 或 P(AB) = P(A)P(B)，则事件 A 与 B 相互独立。",
          importance: "core",
        },
      ],
      warnings: res.isDegenerate
        ? [
            {
              text: "当 P(A) = 0 时，条件 P(A) 不能作为分母，条件概率 P(B|A) 无意义（退化状态）！",
              level: "danger",
            },
          ]
        : [],
      mnemonic: "已知求件缩样本，分子交集分母件。",
    };
  }

  // 2. 模式二：全概率公式与完备事件组划分
  if (activeMode === "total_prob") {
    const pA1 = params.pA1 ?? 0.4;
    const pA2 = params.pA2 ?? 0.35;
    const pA3 = Math.max(0, 1 - pA1 - pA2);

    const inputs = [
      {
        key: "A1",
        name: "划分 A₁",
        pAi: pA1,
        pB_given_Ai: params.pB_A1 ?? 0.6,
      },
      {
        key: "A2",
        name: "划分 A₂",
        pAi: pA2,
        pB_given_Ai: params.pB_A2 ?? 0.3,
      },
      {
        key: "A3",
        name: "划分 A₃",
        pAi: pA3,
        pB_given_Ai: params.pB_A3 ?? 0.8,
      },
    ];

    const res = calculateTotalProb(inputs);

    return {
      quantities: [
        {
          label: "划分 A₁ 先验概率 P(A₁)",
          symbol: "P(A_1)",
          value: res.partitions[0].pAi.toFixed(3),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "划分 A₂ 先验概率 P(A₂)",
          symbol: "P(A_2)",
          value: res.partitions[1].pAi.toFixed(3),
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "划分 A₃ 先验概率 P(A₃)",
          symbol: "P(A_3)",
          value: res.partitions[2].pAi.toFixed(3),
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "目标事件 B 的全概率 P(B)",
          symbol: "P(B)",
          value: res.pB.toFixed(4),
          color: MATH_COLORS.function,
        },
        {
          label: "分支 1 贡献联合概率 P(A₁B)",
          symbol: "P(A_1 B)",
          value: res.partitions[0].pJoint.toFixed(4),
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "分支 2 贡献联合概率 P(A₂B)",
          symbol: "P(A_2 B)",
          value: res.partitions[1].pJoint.toFixed(4),
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "分支 3 贡献联合概率 P(A₃B)",
          symbol: "P(A_3 B)",
          value: res.partitions[2].pJoint.toFixed(4),
          color: MATH_COLORS.paramTertiary,
        },
      ],
      theorems: [
        {
          name: "全概率公式 (Total Probability Theorem)",
          latex: `P(B) = \\sum_{i=1}^n P(A_i)P(B|A_i)`,
          condition:
            "$A_1, A_2, \\ldots, A_n$ 构成 $\\Omega$ 的完备划分（两两互斥且并集为 $\\Omega$）",
          prerequisites: ["$P(A_i) > 0$， $i = 1, \\ldots, n$"],
          note: '"化整为零，分道汇合"：把复杂事件 $B$ 分解到各完备划分分支路径上进行加权求和。',
          level: "core",
        },
        {
          name: "完备事件组前提条件",
          latex: `A_i \\cap A_j = \\emptyset (i \\ne j), \\quad \\bigcup_{i=1}^n A_i = \\Omega, \\quad P(A_i) > 0`,
          note: "划分必须无遗漏、无重叠。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "高考大题核心策略：第一步找到原因划分 A_i，第二步写出各分支条件概率 P(B|A_i)，第三步代入加权累加。",
          importance: "gaokao",
        },
        {
          text: "画树状图求概率：树的第一层节点连线表示先验概率 P(A_i)，第二层连线表示条件概率 P(B|A_i)，路径相乘求联合概率 P(A_i B)。",
          importance: "core",
        },
      ],
      warnings: [],
      mnemonic: "化整为零全概率，分道分支路径乘，汇总相加求最终果。",
    };
  }

  // 3. 模式三：贝叶斯公式与试剂/次品诊断 (后验执因)
  const pPriorD = params.pPriorD ?? 0.02;
  const pSensitivity = params.pSensitivity ?? 0.95;
  const pFalsePositive = params.pFalsePositive ?? 0.05;
  const bayesPreset = (config?.bayesPreset as string) || "screening";
  const isFactory = bayesPreset === "factory";

  const res = calculateBayesDiagnostic(pPriorD, pSensitivity, pFalsePositive);
  const targetSymbol = isFactory ? "Def" : "D";

  const priorLabel = isFactory ? "次品先验概率 P(Def)" : "先验患病率 P(D)";
  const sensLabel = isFactory ? "次品检出率 P(+|Def)" : "真阳性率 P(+|D)";
  const falsePosLabel = isFactory
    ? "合格误判率 P(+|~Def)"
    : "假阳性误报率 P(+|~D)";
  const posteriorLabel = isFactory
    ? "★ 检测阳性实际为次品率 P(Def|+)"
    : "★ 阳性后验患病率 P(D|+)";

  return {
    quantities: [
      {
        label: priorLabel,
        symbol: `P(${targetSymbol})`,
        value: `${(res.pPriorD * 100).toFixed(2)}%`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: sensLabel,
        symbol: `P(+|${targetSymbol})`,
        value: `${(res.pSensitivity * 100).toFixed(1)}%`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: falsePosLabel,
        symbol: `P(+|\\bar{${targetSymbol}})`,
        value: `${(res.pFalsePositive * 100).toFixed(1)}%`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "总体阳性检出率 P(+)",
        symbol: "P(+)",
        value: `${(res.pTotalPositive * 100).toFixed(2)}%`,
        color: MATH_COLORS.functionTransformed,
      },
      {
        label: posteriorLabel,
        symbol: `P(${targetSymbol}|+)`,
        value: `${(res.pPosteriorD * 100).toFixed(2)}%`,
        color: MATH_COLORS.derivative,
      },
      {
        label: "阳性结果中“误报/误判”占比",
        symbol: "\\text{False Alarm Ratio}",
        value: `${(res.falseAlarmRatio * 100).toFixed(2)}%`,
        color: MATH_COLORS.degeneracy,
      },
    ],
    theorems: [
      {
        name: "贝叶斯公式 (Bayes' Theorem)",
        latex: `P(A_k|B) = \\frac{P(A_k)P(B|A_k)}{\\sum_{i=1}^n P(A_i)P(B|A_i)} = \\frac{P(A_k B)}{P(B)}`,
        condition: "已知结果 B 发生，逆向推断特定原因 A_k 的后验概率",
        prerequisites: [
          "$A_1, A_2, \\ldots, A_n$ 构成 $\\Omega$ 的完备划分",
          "$P(B) > 0$",
        ],
        note: "分子是特定原因分支路径 P(A_k B)，分母是全概率求得的总结果 P(B)。",
        level: "core",
      },
      {
        name: isFactory
          ? "工业质检逆向模型"
          : "试剂检测模型 (Medical Screening)",
        latex: isFactory
          ? `P(\\text{Def}|+) = \\frac{P(\\text{Def})P(+|\\text{Def})}{P(\\text{Def})P(+|\\text{Def}) + P(\\bar{\\text{Def}})P(+|\\bar{\\text{Def}})}`
          : `P(D|+) = \\frac{P(D)P(+|D)}{P(D)P(+|D) + P(\\bar{D})P(+|\\bar{D})}`,
        note: "基数效应：小概率先验事件中，庞大合格/健康人群基数即使乘以极低误报率，也会产生不可忽视的虚假阳性！",
        level: "important",
      },
    ],
    gaokaoPoints: [
      {
        text: "【新高考通法·全概与贝叶斯求解 3 步法】①确定原因划分 A_i 与结果事件 B；②画出树状路径图，计算全概率分母 P(B) = ∑ P(A_i)P(B|A_i)；③将目标原因路径作分子，求出后验概率 P(A_k|B) = P(A_k B) / P(B)。",
        importance: "gaokao",
      },
      {
        text: isFactory
          ? "高考工业应用题：质检仪器精准度 98% ≠ 测出阳性就 98% 为次品！必须结合先验次品率 P(Def) 计算后验概率 P(Def|+)。"
          : "高考反直觉高频题：试剂准确率 95% ≠ 测出阳性就 95% 患病！必须结合先验患病率 P(D) 计算后验概率 P(D|+)。",
        importance: "gaokao",
      },
      {
        text: "解题两步法：第一步用全概率公式算出分母 P(+)，第二步用目标分支联合概率作分子相除。",
        importance: "core",
      },
    ],
    warnings: [
      {
        text: `💡 破除直觉陷阱：仪器/试剂准确率高达 ${(res.pSensitivity * 100).toFixed(0)}%，但由于先验${isFactory ? "次品率" : "患病率"}仅 ${(res.pPriorD * 100).toFixed(1)}%，在 1000 个样本中，${(1000 * (1 - res.pPriorD)).toFixed(0)} 名${isFactory ? "合格品" : "健康人"}产生的 ${(1000 * (1 - res.pPriorD) * res.pFalsePositive).toFixed(0)} 个“误报”稀释了真实阳性，导致实际${isFactory ? "次品" : "患病"}概率仅为 ${(res.pPosteriorD * 100).toFixed(1)}%！`,
        level: "warning",
      },
    ],
    mnemonic: "由果溯因贝叶斯，全概为底分母放，分支路径作分子。",
  };
}
