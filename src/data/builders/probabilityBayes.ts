import type { MathPanelData } from "../types";
import {
  calculateConditionalProb,
  calculateTotalProb,
  calculateBayesDiagnostic,
  calculateMarkovChain,
} from "../../math/probabilityBayes";
import { MATH_COLORS } from "../../theme";

export function buildProbabilityBayesPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const activeMode = (config?.activeMode as string) || "conditional";
  const condScenario = (config?.condScenario as string) || "independent";
  const totalScenario = (config?.totalScenario as string) || "factory3";

  // 1. 模式一：条件概率与样本空间压缩
  if (activeMode === "conditional") {
    const pA = params.pA ?? 0.5;
    const pB = params.pB ?? 0.4;
    const pAB = Math.min(params.pAB ?? 0.2, Math.min(pA, pB));

    const res = calculateConditionalProb(pA, pB, pAB);

    // 根据情境动态定制定理与高考考点
    const scenarioTheorems = [];
    const scenarioGaokaoPoints = [];

    if (condScenario === "independent") {
      scenarioTheorems.push({
        name: "相互独立事件乘法公式 (Independence)",
        latex: `P(AB) = P(A)P(B) \\iff P(B|A) = P(B) \\quad (P(A) > 0)`,
        condition: "事件 A 的发生对事件 B 的发生概率无影响",
        note: "条件概率等于无条件先验概率，几何上两圆相交比例与全集比例一致。",
        level: "core" as const,
      });
      scenarioGaokaoPoints.push({
        text: "【新高考高频考点·独立性等价判定】四式等价：① P(AB)=P(A)P(B) ② P(B|A)=P(B) ③ P(A|B)=P(A) ④ P(~A~B)=P(~A)P(~B)。满足其一则全成立。",
        importance: "gaokao" as const,
      });
    } else if (condScenario === "exclusive") {
      scenarioTheorems.push({
        name: "互斥事件加法公式 (Mutual Exclusivity)",
        latex: `A \\cap B = \\emptyset \\implies P(AB) = 0 \\implies P(B|A) = 0`,
        condition: "事件 A 与 B 不可能同时发生",
        note: "两圆无公共交集区域，已知 A 发生后 B 绝不可能发生。",
        level: "core" as const,
      });
      scenarioGaokaoPoints.push({
        text: "【易错辨析·互斥 vs 独立】互斥是“不能同时发生”，独立是“互不影响”。若 P(A)>0 且 P(B)>0，则互斥事件必然不独立，独立事件必然不互斥！",
        importance: "gaokao" as const,
      });
    } else if (condScenario === "correlated") {
      scenarioTheorems.push({
        name: "子集包含条件概率 (Subset Relation)",
        latex: `A \\subseteq B \\implies P(AB) = P(A) \\implies P(B|A) = 1.0`,
        condition: "事件 A 是事件 B 的充分条件",
        note: "集合 A 完全包含在集合 B 内部，已知 A 发生则 B 必然发生。",
        level: "core" as const,
      });
      scenarioGaokaoPoints.push({
        text: "【极值几何性质】当 A ⊆ B 时，条件概率 P(B|A) 达到理论最大值 1.0；当 B ⊆ A 时，P(A|B) = 1.0。",
        importance: "core" as const,
      });
    }

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
        ...scenarioTheorems,
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
          name: "条件概率加法公式",
          latex: `P(B_1 \\cup B_2 | A) = P(B_1|A) + P(B_2|A) - P(B_1 B_2 | A)`,
          note: "条件概率 P(·|A) 满足概率公理（非负性、规范性、可加性）。",
          level: "derived",
        },
      ],
      gaokaoPoints: [
        ...scenarioGaokaoPoints,
        {
          text: "【新高考大题第 1 步】识别题干中“在已知……前提下”为条件事件 A，将样本空间从 Ω 缩小为 A，分子取交集 AB。",
          importance: "gaokao",
        },
        {
          text: "【乘法公式应用】求“连续两步依次发生”用乘法公式：P(AB) = P(A)P(B|A)。",
          importance: "core",
        },
      ],
      warnings: res.isDegenerate
        ? [
            {
              text: "当 P(A) = 0 时，条件事件概率为 0 不能作为分母，条件概率 P(B|A) 数学上无意义！",
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

    const scenarioTheorems = [];
    const scenarioGaokaoPoints = [];

    if (totalScenario === "factory3") {
      scenarioTheorems.push({
        name: "三车间次品全概模型 (Three-Partition Factory)",
        latex: `P(B) = P(A_1)P(B|A_1) + P(A_2)P(B|A_2) + P(A_3)P(B|A_3)`,
        condition: "A₁, A₂, A₃ 为三个互斥生产车间，B 为产出次品",
        note: "总次品率等于各车间产量占比乘以该车间自身次品率的加权和。",
        level: "core" as const,
      });
      scenarioGaokaoPoints.push({
        text: "【高考工业大题标准答题规范】① 设 A_i 为“产品由第 i 车间生产”，B 为“抽到次品”；② 证明 A₁, A₂, A₃ 构成完备事件组；③ 写出全概公式并代入数值求和。",
        importance: "gaokao" as const,
      });
    } else if (totalScenario === "balanced") {
      scenarioTheorems.push({
        name: "等权完备划分模型 (Equal-Weight Partition)",
        latex: `P(A_i) = \\frac{1}{n} \\implies P(B) = \\frac{1}{n} \\sum_{i=1}^n P(B|A_i)`,
        condition: "各原因分支先验等可能发生",
        note: "全概率退化为各分支条件概率的简单算术平均数。",
        level: "important" as const,
      });
      scenarioGaokaoPoints.push({
        text: "【均等简化速算】当各原因等可能发生时，直接将各分支条件概率相加除以分支数即可快速求得总概率。",
        importance: "core" as const,
      });
    }

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
        ...scenarioTheorems,
        {
          name: "全概率公式 (Total Probability Theorem)",
          latex: `P(B) = \\sum_{i=1}^n P(A_i)P(B|A_i)`,
          condition:
            "$A_1, A_2, \\ldots, A_n$ 构成 $\\Omega$ 的完备划分（两两互斥且并集为 $\\Omega$）",
          prerequisites: ["$P(A_i) > 0$ ($i = 1, \\ldots, n$)"],
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
        ...scenarioGaokaoPoints,
        {
          text: "【高考大题核心策略】第一步找到原因划分 A_i，第二步写出各分支条件概率 P(B|A_i)，第三步代入加权累加。",
          importance: "gaokao",
        },
        {
          text: "【画树状图求概率】树的第一层节点连线表示先验概率 P(A_i)，第二层连线表示条件概率 P(B|A_i)，路径相乘求联合概率 P(A_i B)。",
          importance: "core",
        },
      ],
      warnings: [],
      mnemonic: "化整为零全概率，分道分支路径乘，汇总相加求最终果。",
    };
  }

  // 3. 模式三：贝叶斯公式与试剂/次品诊断 (后验执因)
  if (activeMode === "bayes") {
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
          latex: `P(A_k|B) = \\frac{P(A_k B)}{P(B)} = \\frac{P(A_k)P(B|A_k)}{\\sum_{i=1}^n P(A_i)P(B|A_i)}`,
          condition: "已知结果 $B$ 发生，逆向推断特定原因 $A_k$ 的后验概率",
          prerequisites: [
            "$A_1, A_2, \\ldots, A_n$ 构成 $\\Omega$ 的完备划分",
            "$P(B) > 0$",
          ],
          note: "分子是特定原因分支路径 $P(A_k B)$，分母是全概率求得的总结果 $P(B)$。",
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

  // 4. 模式四：马尔可夫链与全概率状态转移递推
  const p1Val = params.p1 ?? 1.0;
  const p11Val = params.p11 ?? 0.0;
  const p21Val = params.p21 ?? 0.5;
  const maxNVal = params.maxN ?? 10;
  const currStepVal = Math.min(
    maxNVal,
    Math.max(1, Math.round(params.currStep ?? 1)),
  );
  const markovPreset = (config?.markovPreset as string) || "pass_ball";

  const markovRes = calculateMarkovChain(p1Val, p11Val, p21Val, maxNVal);
  const currentStepItem =
    markovRes.steps.find((s) => s.n === currStepVal) ?? markovRes.steps[0];
  const lastStepP1 = markovRes.steps[markovRes.steps.length - 1]?.p1 ?? 0;

  const modelName =
    markovPreset === "pass_ball"
      ? "甲乙传球模型"
      : markovPreset === "urn_ball"
        ? "摸球替换模型"
        : markovPreset === "weather"
          ? "晴雨天气转移模型"
          : "自定义马尔可夫链";

  return {
    quantities: [
      {
        label: "初始状态 1 概率 p1",
        symbol: "p_1",
        value: p1Val.toFixed(3),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "自保持概率 P(S_{n+1}=1|S_n=1)",
        symbol: "p_{11}",
        value: p11Val.toFixed(2),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "跨转移概率 P(S_{n+1}=1|S_n=2)",
        symbol: "p_{21}",
        value: p21Val.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "特征公比 λ = p_{11} - p_{21}",
        symbol: "\\lambda",
        value: markovRes.lambda.toFixed(3),
        color: MATH_COLORS.functionTransformed,
      },
      {
        label: "平稳分布 (极限概率) p_∞",
        symbol: "p_\\infty",
        value: markovRes.isDegenerate
          ? "退化恒定"
          : markovRes.pStationary.toFixed(4),
        color: MATH_COLORS.focusPoint,
      },
      {
        label: `当前第 ${currStepVal} 步状态 1 概率 p_${currStepVal}`,
        symbol: `p_{${currStepVal}}`,
        value: currentStepItem.p1.toFixed(4),
        color: MATH_COLORS.function,
      },
      {
        label: `终态第 ${markovRes.steps.length} 步状态 1 概率 p_${markovRes.steps.length}`,
        symbol: `p_{${markovRes.steps.length}}`,
        value: lastStepP1.toFixed(4),
        color: MATH_COLORS.labelText,
      },
    ],
    theorems: [
      {
        name: "【高考第 2 步】全概率一阶线性递推方程",
        latex: `p_{n+1} = p_{11} p_n + p_{21}(1 - p_n) = (p_{11} - p_{21}) p_n + p_{21}`,
        condition:
          "由 $S_n=1$ 与 $S_n=2$ 构成第 $n$ 步完备划分，写出全概递推式",
        note: `本模型递推化简为：$${markovRes.recurrenceLatex}$`,
        level: "core",
      },
      {
        name: "【高考第 3 步】不动点法构造等比数列",
        latex: `p_{n+1} - p_\\infty = \\lambda (p_n - p_\\infty) \\quad (\\lambda = p_{11}-p_{21}, p_\\infty = \\frac{p_{21}}{1-\\lambda})`,
        condition: "特征方程 $x = \\lambda x + p_{21}$ 的不动点解 $p_\\infty$",
        note: markovRes.isDegenerate
          ? "公比 $\\lambda = 1$ 时为恒等数列（退化状态）"
          : `两边同减不动点得：$${markovRes.geometricLatex}$`,
        level: "important",
      },
      {
        name: "【高考第 4 步】通项公式与稳态极限",
        latex: markovRes.generalTermLatex
          ? markovRes.generalTermLatex
          : `p_n = p_\\infty + (p_1 - p_\\infty)\\lambda^{n-1}`,
        note: markovRes.isOscillating
          ? "公比 $\\lambda < 0$：序列在 $p_\\infty$ 上下交替振荡衰减收敛（如传球模型）。"
          : "公比 $\\lambda > 0$：序列单调渐近收敛于平稳极限 $p_\\infty$。",
        level: "derived",
      },
    ],
    gaokaoPoints: [
      {
        text: "【新高考大题 4 步规范采分点】①设第 n 步状态事件 An (概率 pn)；②全概列递推 pn+1 = p11 pn + p21(1-pn)；③解不动点同减 p∞ 证明等比数列；④求通项公式并求 n→∞ 稳态极限。",
        importance: "gaokao",
      },
      {
        text: `【${modelName}考法点睛】${markovRes.isOscillating ? "公比 λ < 0 时为振荡收敛，偶数步与奇数步分别逼近极限，在求和或极值时需分类讨论。" : "公比 λ > 0 时为单调收敛，可直接通过导数或差分研究单调性。"}`,
        importance: "gaokao",
      },
      {
        text: "【避坑指南】切勿混淆初始条件下标！若第 1 次传球后为 p1，则第 0 次初始在甲手中的确定状态对应 p0=1；答题需明确首项是 p1 还是 p0。",
        importance: "core",
      },
    ],
    warnings: markovRes.isDegenerate
      ? [
          {
            text: "当 λ = p11 - p21 = 1 时（即 p11=1 且 p21=0），系统为单向自封闭环，概率恒定不变，无法构造非零等比数列。",
            level: "warning",
          },
        ]
      : [],
    mnemonic:
      "全概递推找分支，构造等比设不动，相减求得通项式，极限逼近稳态值。",
  };
}
