import type { MathPanelData } from "../types";
import type { DistributionResult } from "../../math/probabilityDistribution";
import { MATH_COLORS } from "../../theme";

export function buildProbabilityDistributionPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) || "binomial";
  const distResult = config?.distResult as DistributionResult | undefined;
  const transformedDist = config?.transformedDist as
    DistributionResult | undefined;

  const meanVal = distResult ? distResult.mean.toFixed(3) : "0";
  const varVal = distResult ? distResult.variance.toFixed(3) : "0";
  const stdVal = distResult ? distResult.stdDev.toFixed(3) : "0";
  const sumPVal = distResult ? distResult.sumP.toFixed(4) : "1.000";
  const maxPVal = distResult ? distResult.maxP.toFixed(3) : "0";

  // 1. 二项分布 B(n, p) 专属看板
  if (studyMode === "binomial") {
    const n = params.n ?? 5;
    const p = params.p ?? 0.4;
    const theoreticalMean = (n * p).toFixed(3);
    const theoreticalVar = (n * p * (1 - p)).toFixed(3);

    return {
      quantities: [
        {
          label: "试验次数 n",
          symbol: "n",
          value: `${n}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "成功概率 p",
          symbol: "p",
          value: `${p}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "数学期望 E(X) = np",
          symbol: "E(X)",
          value: theoreticalMean,
          color: MATH_COLORS.tangentLine,
        },
        {
          label: "方差 D(X) = np(1-p)",
          symbol: "D(X)",
          value: theoreticalVar,
          color: MATH_COLORS.function,
        },
        {
          label: "标准差 σ(X)",
          symbol: "\\sigma(X)",
          value: stdVal,
          color: MATH_COLORS.asymptote,
        },
        {
          label: "峰值概率 P_max",
          symbol: "P_{max}",
          value: maxPVal,
          color: MATH_COLORS.barFill,
        },
      ],
      theorems: [
        {
          name: "二项分布定义与 PMF (Binomial PMF)",
          latex: `X \\sim B(n, p) \\implies P(X=k) = C_n^k p^k (1-p)^{n-k}`,
          condition: "n 次独立重复试验 (伯努利试验)，每次成功概率为 p",
          note: "在 n 次试验中恰好成功 k 次的概率公式。",
          level: "core",
        },
        {
          name: "二项分布均值与方差定理",
          latex: `E(X) = np, \\quad D(X) = np(1-p)`,
          note: "高考避坑要点：对于二项分布直接代入 np 与 np(1-p)，严禁手动展开分布列计算累加！",
          level: "core",
        },
        {
          name: "伯努利试验独立性公理",
          latex: `P(A_1 A_2 \\cdots A_n) = P(A_1) P(A_2) \\cdots P(A_n)`,
          note: "各次试验结果互不影响，每次试验中事件 A 发生的概率保持不变。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "高考应用题判别：带有“有放回抽样”、“重复试验”、“每次射击/投篮成功概率不变”等字眼时，必为二项分布 B(n,p)。",
          importance: "gaokao",
        },
        {
          text: "最值求解技巧：若求使 P(X=k) 最大的 k（众数），可利用递推比值 P(X=k)/P(X=k-1) ≥ 1 求解不等式组。",
          importance: "core",
        },
      ],
      warnings: [],
      mnemonic: "有放回抽二项布，期望 np 方差 pq，直接套用最省时。",
    };
  }

  // 2. 超几何分布 H(N, M, n) 专属看板
  if (studyMode === "hypergeometric") {
    const N = params.N ?? 10;
    const M = params.M ?? 4;
    const sampleN = params.sampleN ?? 3;
    const theoreticalMean = ((sampleN * M) / N).toFixed(3);

    return {
      quantities: [
        {
          label: "总体容量 N",
          symbol: "N",
          value: `${N}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "目标特征数 M",
          symbol: "M",
          value: `${M}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "抽取样本数 n",
          symbol: "n",
          value: `${sampleN}`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "数学期望 E(X) = n(M/N)",
          symbol: "E(X)",
          value: theoreticalMean,
          color: MATH_COLORS.tangentLine,
        },
        {
          label: "样本方差 D(X)",
          symbol: "D(X)",
          value: varVal,
          color: MATH_COLORS.function,
        },
        {
          label: "标准差 σ(X)",
          symbol: "\\sigma(X)",
          value: stdVal,
          color: MATH_COLORS.asymptote,
        },
      ],
      theorems: [
        {
          name: "超几何分布定义与 PMF",
          latex: `X \\sim H(N, M, n) \\implies P(X=k) = \\frac{C_M^k C_{N-M}^{n-k}}{C_N^n}`,
          condition:
            "1 ≤ N, 0 ≤ M ≤ N, 1 ≤ n ≤ N, max(0, n-N+M) ≤ k ≤ min(n, M)",
          note: "在含有 M 个特殊元素的 N 个总体中，无放回抽取 n 个元素，抽中特殊元素个数 X 的分布。",
          level: "core",
        },
        {
          name: "超几何分布数学期望定理",
          latex: `E(X) = n \\cdot \\frac{M}{N}`,
          note: "期望值等于“抽取样本数”乘以“总体中特殊元素的占比 M/N”。",
          level: "important",
        },
        {
          name: "二项逼近极限定理 (N → ∞)",
          latex: `\\lim_{N \\to \\infty} \\frac{C_M^k C_{N-M}^{n-k}}{C_N^n} = C_n^k p^k (1-p)^{n-k} \\quad \\left(p = \\frac{M}{N}\\right)`,
          note: "当总体 N 极大时，不放回抽样可近似视为有放回抽样 (二项分布)。",
          level: "derived",
        },
      ],
      gaokaoPoints: [
        {
          text: "高考应用题判别：带有“无放回抽样”、“不放回抓取”、“从包含 M 个次品的 N 个产品中任取 n 个”时，必为超几何分布 H(N,M,n)。",
          importance: "gaokao",
        },
        {
          text: "规范步骤：写明“X 的所有可能取值为 0, 1, ..., min(n, M)”，代入组合数计算概率，列写规范二维表格。",
          importance: "core",
        },
      ],
      warnings:
        sampleN > N || M > N
          ? [
              {
                text: "参数不合法：抽取数 n 或特征数 M 不能大于总体数 N！",
                level: "danger",
              },
            ]
          : [],
      mnemonic: "无放回抽超几何，分母总组合 C_N^n，期望等于 n 乘占比。",
    };
  }

  // 3. 双分布逼近对比模式 H(N,M,n) vs B(n,p) 专属看板
  if (studyMode === "compare") {
    const comparisonResult = config?.comparisonResult as
      | import("../../math/probabilityDistribution").DistributionComparisonResult
      | undefined;

    const N = comparisonResult?.N ?? params.compareN ?? 30;
    const p = comparisonResult?.p ?? params.compareP ?? 0.35;
    const n = comparisonResult?.sampleN ?? params.compareSampleN ?? 4;
    const factor =
      comparisonResult?.varianceCorrectionFactor ??
      (N > 1 ? (N - n) / (N - 1) : 1);
    const maxDiff = comparisonResult?.maxDifference ?? 0;

    return {
      quantities: [
        {
          label: "总体容量 N",
          symbol: "N",
          value: `${N}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "抽取样本数 n",
          symbol: "n",
          value: `${n}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "特征比例 p = M/N",
          symbol: "p_0",
          value: `${p}`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "共同数学期望 E",
          symbol: "E",
          value: (n * p).toFixed(3),
          color: MATH_COLORS.tangentLine,
        },
        {
          label: "★ 方差修正系数 (N-n)/(N-1)",
          symbol: "\\frac{N-n}{N-1}",
          value: factor.toFixed(3),
          color: MATH_COLORS.function,
        },
        {
          label: "两分布最大概率差 Δ_max",
          symbol: "\\Delta_{max}",
          value: maxDiff.toFixed(4),
          color: MATH_COLORS.asymptote,
        },
      ],
      theorems: [
        {
          name: "超几何分布与二项分布方差关系定理",
          latex: `D(X_{\\text{超}}) = n p (1-p) \\cdot \\frac{N-n}{N-1} = D(X_{\\text{二项}}) \\cdot \\frac{N-n}{N-1}`,
          note: "不放回抽样的方差恒小于或等于有放回抽样的方差；当 N 很大时，修正系数 (N-n)/(N-1) 趋近于 1。",
          level: "core",
        },
        {
          name: "大样本二项逼近极限定理 (N → ∞)",
          latex: `\\lim_{N \\to \\infty} P(X_{\\text{超}} = k) = P(X_{\\text{二项}} = k) = C_n^k p^k (1-p)^{n-k}`,
          note: "当总体容量 N 远大于抽取样本数 n（通常 N ≥ 10n）时，不放回抽样可作为二项分布近似处理。",
          level: "core",
        },
      ],
      gaokaoPoints: [
        {
          text: "高考建模选择依据：若总体数量明确且较小（如 10 件产品中抽 3 件），必须严格使用超几何分布模型；若总体极其庞大（如全国考生、全市灯泡寿命检测），直接建模为二项分布 B(n,p)。",
          importance: "gaokao",
        },
        {
          text: "数学思想：极限逼近思想与连续化过渡，是新高考考查高阶数学抽象素养的重要载体。",
          importance: "core",
        },
      ],
      warnings: [],
      mnemonic:
        "总体庞大无放回，二项逼近省力气；方差修正趋近一，抽样比小可近似。",
    };
  }

  // 4. 新高考决策模型 (方案 A vs 方案 B 期望-方差准则) 专属看板
  if (studyMode === "decision") {
    const decisionResult = config?.decisionResult as
      | import("../../math/probabilityDistribution").DecisionScenarioResult
      | undefined;

    const meanA = decisionResult
      ? decisionResult.schemeADist.mean.toFixed(2)
      : "0";
    const varA = decisionResult
      ? decisionResult.schemeADist.variance.toFixed(2)
      : "0";
    const meanB = decisionResult
      ? decisionResult.schemeBDist.mean.toFixed(2)
      : "0";
    const varB = decisionResult
      ? decisionResult.schemeBDist.variance.toFixed(2)
      : "0";

    return {
      quantities: [
        {
          label: "方案 A 期望收益/成本",
          symbol: "E(A)",
          value: `${meanA}`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "方案 A 方差 (风险度)",
          symbol: "D(A)",
          value: `${varA}`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "方案 B 期望收益/成本",
          symbol: "E(B)",
          value: `${meanB}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "方案 B 方差 (风险度)",
          symbol: "D(B)",
          value: `${varB}`,
          color: MATH_COLORS.paramPrimary,
        },
      ],
      theorems: [
        {
          name: "期望-方差双准则决策原理 (Mean-Variance Rule)",
          latex: `\\text{优选目标}: \\max E(X) \\text{ 且 } \\min D(X) \\quad (\\text{或 } \\min E(\\text{成本}))`,
          note: "在不确定性决策中，数学期望反映平均回报水平，方差反映结果的不确定性风险。",
          level: "core",
        },
        {
          name: "全概率加权期望公式",
          latex: `E(X) = \\sum_{k} P(B_k) E(X | B_k)`,
          note: "将复杂情境按状态分解计算条件期望后再汇总，是新高考压轴概率大题的标准工具。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "新高考规范解答采分点：第一步分别求解两方案的离散型分布列；第二步求出 E(A)、E(B) 和 D(A)、D(B)；第三步结合题目目标（如成本最低或收益最稳）给出明确文字决策结论。",
          importance: "gaokao",
        },
        {
          text: "决策分界点探究：新高考常要求通过不等式 E(A) < E(B) 解出临界概率阈值（如本例中的 p_0），并对 p 分段讨论最优策略。",
          importance: "core",
        },
      ],
      warnings: [],
      mnemonic:
        "方案对比列两行，期望定标看高低，方差护航辨稳健，结论严谨扣题意。",
    };
  }

  // 5. 线性变换 Y = aX + b 专属看板
  if (studyMode === "linear") {
    const a = params.linearA ?? 2;
    const b = params.linearB ?? 1;

    return {
      quantities: [
        {
          label: "缩放因子 a",
          symbol: "a",
          value: `${a}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "平移量 b",
          symbol: "b",
          value: `${b}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "原变量期望 E(X)",
          symbol: "E(X)",
          value: meanVal,
          color: MATH_COLORS.tangentLine,
        },
        {
          label: "★ 变换后期望 E(aX+b)",
          symbol: "E(Y)",
          value: transformedDist ? transformedDist.mean.toFixed(3) : "0",
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "原变量方差 D(X)",
          symbol: "D(X)",
          value: varVal,
          color: MATH_COLORS.function,
        },
        {
          label: "★ 变换后方差 D(aX+b)",
          symbol: "D(Y)",
          value: transformedDist ? transformedDist.variance.toFixed(3) : "0",
          color: MATH_COLORS.paramSecondary,
        },
      ],
      theorems: [
        {
          name: "线性变换期望定理",
          latex: `E(aX + b) = a E(X) + b`,
          note: "随机变量进行线性变换后，期望满足线性缩放与平移特性。",
          level: "core",
        },
        {
          name: "线性变换方差定理",
          latex: `D(aX + b) = a^2 D(X)`,
          note: "关键考点：平移常数 b 不改变数据的离散程度，因此 b 对方差无贡献；乘积 a 的贡献为 a² 倍！",
          level: "core",
        },
        {
          name: "标准差线性变换公式",
          latex: `\\sigma(aX + b) = |a| \\sigma(X)`,
          note: "标准差取绝对值 |a| 倍，始终保持非负性。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "高考计算避坑：求 D(aX+b) 时，切记常数 b 直接舍去，且系数 a 必须平方 (a²)！例如 D(2X+3) = 4 D(X)，而非 2D(X)+3！",
          importance: "gaokao",
        },
        {
          text: "实际应用：用于标准化变量 Z = (X - μ) / σ，标准化后 E(Z) = 0, D(Z) = 1。",
          importance: "core",
        },
      ],
      warnings: [],
      mnemonic: "期望线性随 a,b 变，方差平移 b 舍去，a 变方差加平方！",
    };
  }

  // 4. 一般分布列看板 (默认)
  return {
    quantities: [
      {
        label: "数学期望 (均值) E(X)",
        symbol: "E(X)",
        value: meanVal,
        color: MATH_COLORS.tangentLine,
      },
      {
        label: "方差 D(X)",
        symbol: "D(X)",
        value: varVal,
        color: MATH_COLORS.function,
      },
      {
        label: "标准差 σ(X)",
        symbol: "\\sigma(X)",
        value: stdVal,
        color: MATH_COLORS.asymptote,
      },
      {
        label: "概率和 ∑p_i (规范性)",
        symbol: "\\sum p_i",
        value: sumPVal,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "最大概率峰值 P_max",
        symbol: "P_{max}",
        value: maxPVal,
        color: MATH_COLORS.paramSecondary,
      },
    ],
    theorems: [
      {
        name: "离散分布列基本公理",
        latex: `p_i \\ge 0, \\quad \\sum_{i=1}^n p_i = 1`,
        note: "离散型随机变量在各个取值上的概率非负，且全部可能取值的概率之和恒等于 1。",
        level: "core",
      },
      {
        name: "数学期望与物理杠杆重心",
        latex: `E(X) = \\sum_{i=1}^n x_i p_i \\iff \\sum_{i=1}^n (x_i - E(X)) p_i = 0`,
        note: "数学期望反映随机变量取值的平均水平与受力重心配重平衡点。",
        level: "core",
      },
      {
        name: "方差与离散度刻画",
        latex: `D(X) = E[(X - E(X))^2] = \\sum_{i=1}^n (x_i - E(X))^2 p_i = E(X^2) - [E(X)]^2`,
        note: "方差反映随机变量取值偏离期望均值的波动程度与离散带范围。",
        level: "important",
      },
    ],
    gaokaoPoints: [
      {
        text: "高考解答题核心考法：首先列出分布列规范表格（第一行 X，第二行 P），其次校验 ∑p_i = 1，最后代入公式求期望 E(X) 与方差 D(X)。",
        importance: "gaokao",
      },
      {
        text: "决策应用题：比较方案优劣时，均值 E(X) 代表平均收益，方差 D(X) 代表风险波动，通常选择“均值大、方差小”的方案。",
        importance: "gaokao",
      },
    ],
    warnings:
      distResult && !distResult.isValid
        ? [
            {
              text: distResult.invalidReason || "参数不合法",
              level: "danger",
            },
          ]
        : [],
    mnemonic: "分布列出和为一，均值支点平衡处，方差拉伸加平移。",
  };
}
