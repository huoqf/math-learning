import type { MathPanelData, ReasoningStep } from "../types";
import {
  calculateConditionalProb,
  calculateTotalProb,
  calculateBayesDiagnostic,
  calculateWarnerModel,
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

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法：设元与样本空间缩减判定",
        detail: `已知条件事件 $A$ 的概率 $P(A) = ${res.pA.toFixed(2)}$，目标事件 $B$ 的先验概率 $P(B) = ${res.pB.toFixed(2)}$，联合概率 $P(AB) = ${res.pAB.toFixed(2)}$。${res.pA > 0 ? "满足适用前提 $P(A) > 0$，样本空间由 $\\Omega$ 严格缩减至事件 $A$。" : "因 $P(A) = 0$，条件概率无意义。"}`,
        latex: "P(A) > 0 \\implies \\Omega' = A",
        rubric: "明确条件事件并确认分母非零（2分）",
      },
      {
        step: 2,
        title: "建模联立：代入条件概率定义公式展开",
        detail:
          "在已知事件 $A$ 发生的前提下，事件 $B$ 发生的条件概率等于联合概率 $P(AB)$ 与条件事件概率 $P(A)$ 之商：",
        latex: res.isDegenerate
          ? "P(B|A) = \\frac{P(AB)}{P(A)} \\quad (\\text{分母为 0 无意义})"
          : `P(B|A) = \\frac{P(AB)}{P(A)} = \\frac{${res.pAB.toFixed(2)}}{${res.pA.toFixed(2)}} = ${res.pB_given_A.toFixed(4)}`,
        rubric: "列出标准商式并代入具体数值求解（4分）",
      },
      {
        step: 3,
        title: "求解反思：事件关联性与高考定性判据",
        detail:
          condScenario === "independent"
            ? `对比发现 $P(B|A) = ${res.pB_given_A.toFixed(2)} = P(B)$，说明事件 $A$ 的发生对 $B$ 的发生无影响，符合相互独立充要条件 $P(AB) = P(A)P(B)$。`
            : condScenario === "correlated"
              ? "由子集包含关系 $A \\subseteq B$，交集 $P(AB) = P(A)$，故 $P(B|A) = 1.00$ 恒成立，条件概率达到理论最大值。"
              : condScenario === "exclusive"
                ? "由互斥条件 $AB = \\emptyset$，两事件无公共交集 $P(AB) = 0$，故条件概率 $P(B|A) = 0.00$。"
                : `对比先验基率：当前 $P(B|A) = ${res.pB_given_A.toFixed(2)}$，无条件先验 $P(B) = ${res.pB.toFixed(2)}$。`,
        latex:
          condScenario === "independent"
            ? "P(B|A) = P(B) \\iff P(AB) = P(A)P(B)"
            : condScenario === "correlated"
              ? "A \\subseteq B \\implies P(B|A) = 1.0"
              : condScenario === "exclusive"
                ? "A \\cap B = \\emptyset \\implies P(B|A) = 0"
                : "P(AB) = P(A)P(B|A)",
        rubric: "得出确切结论并给出充要条件判定（2分）",
      },
    ];

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
          note: "已知 A 发生后，样本空间由 $\\Omega$ 压缩缩减至 $A$，有效区域为 $AB$。",
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
          note: "条件概率 $P(\\cdot|A)$ 满足概率公理（非负性、规范性、可加性）。",
          level: "derived",
        },
      ],
      gaokaoPoints: [
        ...scenarioGaokaoPoints,
        {
          text: "【新高考大题第 1 步】识别题干中“在已知……前提下”为条件事件 $A$，将样本空间从 $\\Omega$ 缩小为 $A$，分子取交集 $AB$。",
          importance: "gaokao",
        },
        {
          text: "【乘法公式应用】求“连续两步依次发生”用乘法公式：$P(AB) = P(A)P(B|A)$。",
          importance: "core",
        },
      ],
      reasoningSteps,
      warnings: res.isDegenerate
        ? [
            {
              text: "当 $P(A) = 0$ 时，条件事件概率为 0 不能作为分母，条件概率 $P(B|A)$ 数学上无意义！",
              level: "danger",
            },
          ]
        : [],
      mnemonic: "已知求件缩样本，分子交集分母件。",
    };
  }

  // 2. 模式二：全概率公式与完备事件组划分
  if (activeMode === "total_prob") {
    if (totalScenario === "warner") {
      const pCard = params.pCard ?? 0.8;
      const pReportYes = params.pReportYes ?? 0.36;
      const warnerRes = calculateWarnerModel(pCard, pReportYes);

      const warnerSteps: ReasoningStep[] = [
        {
          step: 1,
          title: "审题设元：构建敏感问题随机化回答模型",
          detail: `设被调查群体具有真实敏感特征的比例为 $p_{\\text{real}}$。受访者随机抽取卡片 $C_1$（正面“我是”）的先验概率为 $P(C_1) = ${warnerRes.pCard.toFixed(2)}$，抽取卡片 $C_2$（反面“我不是”）的概率为 $P(C_2) = ${(1 - warnerRes.pCard).toFixed(2)}$。`,
          latex:
            "P(C_1) + P(C_2) = 1.00, \\quad P(\\text{Yes}|C_1) = p_{\\text{real}}, \\quad P(\\text{Yes}|C_2) = 1 - p_{\\text{real}}",
          rubric: "准确设定未知参数并写清互斥卡片先验概率（2分）",
        },
        {
          step: 2,
          title: "建模联立：由全概率公式建立一元线性方程",
          detail: `统计调查得到回答 Yes 的总概率为 $P(\\text{Yes}) = ${(warnerRes.pReportYes * 100).toFixed(1)}\\%$。由全概率公式展开路径加权：`,
          latex: `P(\\text{Yes}) = P(C_1)P(\\text{Yes}|C_1) + P(C_2)P(\\text{Yes}|C_2) = (2P(C_1) - 1)p_{\\text{real}} + (1 - P(C_1))`,
          rubric: "运用全概率公式建立含未知参数的线性方程（4分）",
        },
        {
          step: 3,
          title: "求解反思：反解真实敏感比例与退化临界讨论",
          detail: warnerRes.isDegenerate
            ? "当抽卡概率 $P(C_1) = 0.50$ 时，分母 $2P(C_1) - 1 = 0$，回答 Yes 的概率恒为 $50\\%$，信息完全对称抵消，无法反解真实比例！"
            : `代入数据 $${warnerRes.pReportYes.toFixed(2)} = (2 \\times ${warnerRes.pCard.toFixed(2)} - 1)p_{\\text{real}} + (1 - ${warnerRes.pCard.toFixed(2)})$，移项解得真实比例：$p_{\\text{real}} = ${(warnerRes.pReal * 100).toFixed(2)}\\%$。`,
          latex: warnerRes.isDegenerate
            ? "2P(C_1) - 1 = 0 \\implies \\text{退化无法解出}"
            : `p_{\\text{real}} = \\frac{P(\\text{Yes}) - (1 - P(C_1))}{2P(C_1) - 1} = ${(warnerRes.pReal * 100).toFixed(2)}\\%`,
          rubric: "准确求解一元一次方程并给出统计结论（2分）",
        },
      ];

      return {
        quantities: [
          {
            label: "正面卡片概率 P(C₁: 我是)",
            symbol: "P(C_1)",
            value: `${(warnerRes.pCard * 100).toFixed(1)}%`,
            color: MATH_COLORS.paramPrimary,
          },
          {
            label: "反面卡片概率 P(C₂: 我不是)",
            symbol: "P(C_2)",
            value: `${((1 - warnerRes.pCard) * 100).toFixed(1)}%`,
            color: MATH_COLORS.paramSecondary,
          },
          {
            label: "调查统计回答 Yes 比例 P(Yes)",
            symbol: "P(\\text{Yes})",
            value: `${(warnerRes.pReportYes * 100).toFixed(1)}%`,
            color: MATH_COLORS.functionTransformed,
          },
          {
            label: "★ 全概逆解真实具有特征率 $p_real$",
            symbol: "p_{\\text{real}}",
            value: warnerRes.isDegenerate
              ? "退化无法解出"
              : `${(warnerRes.pReal * 100).toFixed(2)}%`,
            color: MATH_COLORS.function,
          },
        ],
        theorems: [
          {
            name: "Warner 敏感问题随机化回答模型 (Randomized Response)",
            latex: `P(\\text{Yes}) = P(C_1)p_{\\text{real}} + P(C_2)(1 - p_{\\text{real}}) = (2P(C_1) - 1)p_{\\text{real}} + (1 - P(C_1))`,
            condition:
              "受访者随机抽取卡片 $C_1$ 或 $C_2$ 并如实回答（调查员不知道受访者抽到哪张卡）",
            prerequisites: [
              "$P(C_1) \\ne 0.5$（$P(C_1) = 0.5$ 时信息完全抵消退化）",
            ],
            note: "充分保护个人隐私的同时，利用全概率公式从群体回答率精确推算真实敏感比例。",
            level: "core",
          },
          {
            name: "全概逆向解算公式",
            latex: `p_{\\text{real}} = \\frac{P(\\text{Yes}) - (1 - P(C_1))}{2P(C_1) - 1}`,
            note: "新高考创新大题核心公式：代入统计数据一元线性方程秒解真实比例。",
            level: "important",
          },
        ],
        gaokaoPoints: [
          {
            text: "【新高考创新统计考点】利用全概公式破除被调查者戒备心理。全概列方程 $P(\\text{Yes}) = P(C_1)p + P(C_2)(1-p)$，直接移项解一元一次方程。",
            importance: "gaokao",
          },
          {
            text: "【退化临界分析】若抽卡概率 $P(C_1) = 0.5$，则无论真实比例 $p$ 为何值，$P(\\text{Yes})$ 恒为 $0.5$，无法反解未知参数 $p$；实际调查中常取 $P(C_1) = 0.7 \\sim 0.85$。",
            importance: "core",
          },
        ],
        reasoningSteps: warnerSteps,
        warnings: warnerRes.isDegenerate
          ? [
              {
                text: "当正面卡片概率 $P(C_1) = 0.5$ 时，分母 $2P(C_1) - 1 = 0$，回答 Yes 的概率恒为 $50\\%$，信息完全抵消，无法逆向推导真实比例！",
                level: "danger",
              },
            ]
          : [],
        mnemonic: "全概正列抽卡式，移项反解真实率。",
      };
    }

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
        text: "【高考工业大题标准答题规范】① 设 $A_i$ 为“产品由第 $i$ 车间生产”，$B$ 为“抽到次品”；② 证明 $A₁, A₂, A₃$ 构成完备事件组；③ 写出全概公式并代入数值求和。",
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

    const totalSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法：完备事件组划分检验与设元",
        detail: `设原因事件组 $A_1, A_2, A_3$ 对应各划分分支，先验权重分别为 $P(A_1) = ${pA1.toFixed(2)}$，$P(A_2) = ${pA2.toFixed(2)}$，$P(A_3) = ${pA3.toFixed(2)}$。满足两两互斥且并集为 $\\Omega$（和为 1.00），构成完备事件组。`,
        latex:
          "\\bigcup_{i=1}^3 A_i = \\Omega, \\quad A_i \\cap A_j = \\emptyset (i \\ne j), \\quad \\sum_{i=1}^3 P(A_i) = 1.00",
        rubric: "明确设出各划分原因事件并证明完备性（2分）",
      },
      {
        step: 2,
        title: "建模联立：写出全概率公式展开式",
        detail: `目标事件 $B$ 在各划分下的条件概率分别为 $P(B|A_1) = ${inputs[0].pB_given_Ai.toFixed(2)}$，$P(B|A_2) = ${inputs[1].pB_given_Ai.toFixed(2)}$，$P(B|A_3) = ${inputs[2].pB_given_Ai.toFixed(2)}$。由全概率定理写出展开式：`,
        latex: "P(B) = P(A_1)P(B|A_1) + P(A_2)P(B|A_2) + P(A_3)P(B|A_3)",
        rubric: "写出标准全概率加权求和公式（3分）",
      },
      {
        step: 3,
        title: "求解反思：各分支联合贡献相加与加权分析",
        detail: `代入具体数值累加：$P(B) = ${pA1.toFixed(2)} \\times ${inputs[0].pB_given_Ai.toFixed(2)} + ${pA2.toFixed(2)} \\times ${inputs[1].pB_given_Ai.toFixed(2)} + ${pA3.toFixed(2)} \\times ${inputs[2].pB_given_Ai.toFixed(2)} = ${res.partitions[0].pJoint.toFixed(3)} + ${res.partitions[1].pJoint.toFixed(3)} + ${res.partitions[2].pJoint.toFixed(3)} = ${res.pB.toFixed(4)}$。`,
        latex: `P(B) = ${res.pB.toFixed(4)} \\quad (${(res.pB * 100).toFixed(2)}\\%)`,
        rubric: "代入数值准确求解并写出最终概率（3分）",
      },
    ];

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
          text: "【高考大题核心策略】第一步找到原因划分 $A_i$，第二步写出各分支条件概率 $P(B|A_i)$，第三步代入加权累加。",
          importance: "gaokao",
        },
        {
          text: "【画树状图求概率】树的第一层节点连线表示先验概率 $P(A_i)$，第二层连线表示条件概率 $P(B|A_i)$，路径相乘求联合概率 $P(A_i B)$。",
          importance: "core",
        },
      ],
      reasoningSteps: totalSteps,
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

    const bayesSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法：确定完备划分与先验概率",
        detail: `设真实目标事件为 $${targetSymbol}$（先验概率 $P(${targetSymbol}) = ${(pPriorD * 100).toFixed(2)}\\%$），对立事件为 $\\bar{${targetSymbol}}$（先验概率 $P(\\bar{${targetSymbol}}) = ${((1 - pPriorD) * 100).toFixed(2)}\\%$）。检测灵敏度 $P(+|${targetSymbol}) = ${(pSensitivity * 100).toFixed(1)}\\%$，误报率 $P(+|\\bar{${targetSymbol}}) = ${(pFalsePositive * 100).toFixed(1)}\\%$。`,
        latex: `P(${targetSymbol}) + P(\\bar{${targetSymbol}}) = 1.00`,
        rubric: "准确设定原因事件与对立事件及其先验条件（2分）",
      },
      {
        step: 2,
        title: "建模联立：由全概率公式计算阳性总概率（分母）",
        detail: `由全概率公式，受检样本检测为阳性 (+) 的总概率等于“真阳性”与“假阳性”之和：$P(+) = P(${targetSymbol})P(+|${targetSymbol}) + P(\\bar{${targetSymbol}})P(+|\\bar{${targetSymbol}}) = ${pPriorD.toFixed(3)} \\times ${pSensitivity.toFixed(2)} + ${(1 - pPriorD).toFixed(3)} \\times ${pFalsePositive.toFixed(2)} = ${(res.pTotalPositive * 100).toFixed(2)}\\%$。`,
        latex: `P(+) = P(${targetSymbol})P(+|${targetSymbol}) + P(\\bar{${targetSymbol}})P(+|\\bar{${targetSymbol}}) = ${res.pTotalPositive.toFixed(4)}`,
        rubric: "运用全概率公式规范求出分母总概率（3分）",
      },
      {
        step: 3,
        title: "求解反思：贝叶斯后验逆概率与基率效应",
        detail: `由贝叶斯公式，在检测为阳性 (+) 的条件下，实际为真目标事件的后验概率为：$P(${targetSymbol}|+) = \\frac{P(${targetSymbol}+)}{P(+)} = \\frac{${(pPriorD * pSensitivity).toFixed(4)}}{${res.pTotalPositive.toFixed(4)}} = ${(res.pPosteriorD * 100).toFixed(2)}\\%$。即使仪器准确率高，极低先验下仍会被大量假阳性稀释。`,
        latex: `P(${targetSymbol}|+) = \\frac{P(${targetSymbol})P(+|${targetSymbol})}{P(+)} = ${(res.pPosteriorD * 100).toFixed(2)}\\%`,
        rubric: "列出后验计算式求得确切概率并做出合理反思（3分）",
      },
    ];

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
          name: "贝叶斯公式（选学 · 教材拓展）",
          latex: `P(A_k|B) = \\frac{P(A_k B)}{P(B)} = \\frac{P(A_k)P(B|A_k)}{\\sum_{i=1}^n P(A_i)P(B|A_i)}`,
          condition: "已知结果 $B$ 发生，逆向推断特定原因 $A_k$ 的后验概率",
          prerequisites: [
            "$A_1, A_2, \\ldots, A_n$ 构成 $\\Omega$ 的完备划分",
            "$P(B) > 0$",
          ],
          note: "分子是特定原因分支路径 $P(A_k B)$，分母是全概率求得的总结果 $P(B)$。新课标正文只要求全概率公式，贝叶斯公式为选学拓展内容。",
          level: "supplementary",
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
          text: "【选学拓展 · 全概与贝叶斯求解 3 步法】①确定原因划分 $A_i$ 与结果事件 $B$；②画出树状路径图，计算全概率分母 $P(B) = \\sum P(A_i)P(B|A_i)$；③将目标原因路径作分子，求出后验概率 $P(A_k|B) = P(A_k B) / P(B)$。",
          importance: "extend",
        },
        {
          text: isFactory
            ? "高考工业应用题：质检仪器精准度 $98\\% \\ne$ 测出阳性就 $98\\%$ 为次品！必须结合先验次品率 $P(\\text{Def})$ 计算后验概率 $P(\\text{Def}|+)$。"
            : "高考反直觉高频题：试剂准确率 $95\\% \\ne$ 测出阳性就 $95\\%$ 患病！必须结合先验患病率 $P(D)$ 计算后验概率 $P(D|+)$。",
          importance: "gaokao",
        },
        {
          text: "解题两步法：第一步用全概率公式算出分母 $P(+)$，第二步用目标分支联合概率作分子相除。",
          importance: "core",
        },
      ],
      reasoningSteps: bayesSteps,
      warnings: [
        {
          text: `💡 破除直觉陷阱：仪器/试剂准确率高达 ${(res.pSensitivity * 100).toFixed(0)}%，但由于先验${isFactory ? "次品率" : "患病率"}仅 ${(res.pPriorD * 100).toFixed(1)}%，在 1000 个样本中，${(1000 * (1 - res.pPriorD)).toFixed(0)} 名${isFactory ? "合格品" : "健康人"}产生的 ${(1000 * (1 - res.pPriorD) * res.pFalsePositive).toFixed(0)} 个“误报”稀释了真实阳性，导致实际${isFactory ? "次品" : "患病"}概率仅为 ${(res.pPosteriorD * 100).toFixed(1)}%！`,
          level: "warning",
        },
      ],
      mnemonic: "由果溯因贝叶斯，全概为底分母放，分支路径作分子。",
    };
  }

  return {
    quantities: [],
    theorems: [],
    gaokaoPoints: [],
    warnings: [],
  };
}
