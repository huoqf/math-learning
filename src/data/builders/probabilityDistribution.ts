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
  const sumPVal = distResult
    ? (distResult.rawSumP ?? distResult.sumP).toFixed(4)
    : "1.000";
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
          label: "峰值概率 $P_max$",
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
          text: "高考应用题判别：带有“有放回抽样”、“重复试验”、“每次射击/投篮成功概率不变”等字眼时，必为二项分布 $B(n,p)$。",
          importance: "gaokao",
        },
        {
          text: "最值求解技巧：若求使 $P(X=k)$ 最大的 $k$（众数），可利用递推比值 $\\frac{P(X=k)}{P(X=k-1)} \\ge 1$ 求解不等式组 $(n+1)p-1 \\le k \\le (n+1)p$。",
          importance: "core",
        },
      ],
      warnings: [],
      mnemonic: "有放回抽二项布，期望 np 方差 pq，直接套用最省时。",
      examAnchor: "新高考解答题 · 独立重复试验与二项分布列",
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 试验性质判定与设元",
          detail: `由题设已知，每次试验结果相互独立且成功概率恒为 $p = ${p}$，进行 $n = ${n}$ 次独立重复试验，故随机变量 $X \\sim B(${n}, ${p})$。`,
          latex: `X \\sim B(n, p) \\implies P(X=k) = C_n^k p^k (1-p)^{n-k} \\quad (k = 0, 1, \\dots, n)`,
          rubric: "【高考采分点】判定二项分布并写出通项概率模型得 2 分。",
        },
        {
          step: 2,
          title: "建模联立 · 期望方差与最值项不等式",
          detail:
            "根据二项分布均值方差公式直接计算数字特征；利用比值递推 $\\frac{P(X=k)}{P(X=k-1)} \\ge 1$ 导出最值项（众数）满足的不等式组 $(n+1)p - 1 \\le k \\le (n+1)p$。",
          latex: `\\begin{cases} E(X) = n p = ${n} \\times ${p} = ${(n * p).toFixed(2)} \\\\ D(X) = n p (1-p) = ${n} \\times ${p} \\times ${(1 - p).toFixed(2)} = ${(n * p * (1 - p)).toFixed(2)} \\\\ (n+1)p - 1 = ${((n + 1) * p - 1).toFixed(2)} \\le k \\le ${((n + 1) * p).toFixed(2)} = (n+1)p \\end{cases}`,
          rubric: "【高考采分点】代入期望方差公式并列出最值项不等式组得 4 分。",
        },
        {
          step: 3,
          title: "求解反思 · 整数解与最大概率项结论",
          detail: `在整数区间内求解 $k$，得到概率最大项为 $k_{\\max} = ${distResult?.modeX.join(", ") ?? "0"}$，对应最大概率 $P_{\\max} = ${maxPVal}$。`,
          latex: `k = ${distResult?.modeX.join(", ") ?? "0"} \\implies P(X=${distResult?.modeX[0] ?? 0}) = ${maxPVal}`,
          rubric: "【高考采分点】确定众数取值并规范作答得 2 分。",
        },
      ],
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
          name: "大样本二项近似 (N 远大于 n)",
          latex: `N \\gg n \\implies \\frac{C_M^k C_{N-M}^{n-k}}{C_N^n} \\approx C_n^k p^k (1-p)^{n-k} \\quad \\left(p = \\frac{M}{N}\\right)`,
          note: "当总体容量 $N$ 远大于抽取数 $n$（通常 $N \\ge 10n$）时，不放回抽样与有放回抽样的差别可忽略，超几何分布可用二项分布近似计算。该结论为近似表述，不属于课标正文要求。",
          level: "derived",
        },
      ],
      gaokaoPoints: [
        {
          text: "高考应用题判别：带有“无放回抽样”、“不放回抓取”、“从包含 $M$ 个次品的 $N$ 个产品中任取 $n$ 个”时，必为超几何分布 $H(N,M,n)$。",
          importance: "gaokao",
        },
        {
          text: "规范步骤：写明“$X$ 的所有可能取值为 $\\max(0, n-N+M), \\dots, \\min(n, M)$”，代入组合数计算概率，列写规范分布列表格。",
          importance: "core",
        },
      ],
      warnings:
        sampleN > N || M > N
          ? [
              {
                text: "参数不合法：抽取数 $n$ 或特征数 $M$ 不能大于总体数 $N$！",
                level: "danger",
              },
            ]
          : [],
      mnemonic: "无放回抽超几何，分母总组合 $C_N^n$，期望等于 $n$ 乘占比。",
      examAnchor: "新高考解答题 · 不放回抽样与超几何分布列",
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 特征提取与取值范围界定",
          detail: `从含有 $M = ${M}$ 件次品的 $N = ${N}$ 件总体中不放回随机抽取 $n = ${sampleN}$ 件，抽中次品数记为 $X \\sim H(${N}, ${M}, ${sampleN})$。确定 $X$ 的所有可能取值。`,
          latex: `X \\sim H(N, M, n), \\quad \\max(0, n-N+M) \\le k \\le \\min(n, M)`,
          rubric:
            "【高考采分点】判定超几何模型并规范确定随机变量可能取值得 3 分。",
        },
        {
          step: 2,
          title: "建模联立 · 组合数分布列计算",
          detail: `样本总组合数为 $C_N^n = C_{${N}}^{${sampleN}}$，恰好抽中 $k$ 件次品的组合数为 $C_M^k C_{N-M}^{n-k}$，代入计算各点概率并列成规范表格。`,
          latex: `P(X=k) = \\frac{C_M^k C_{N-M}^{n-k}}{C_N^n} = \\frac{C_{${M}}^k C_{${N - M}}^{${sampleN}-k}}{C_{${N}}^{${sampleN}}}`,
          rubric: "【高考采分点】代入组合数公式并列出分布列规范表格得 4 分。",
        },
        {
          step: 3,
          title: "求解反思 · 数学期望计算与结论",
          detail: `根据超几何分布数学期望公式 $E(X) = n \\cdot \\frac{M}{N}$，直接代入样本量与次品比例完成求解。`,
          latex: `E(X) = n \\cdot \\frac{M}{N} = ${sampleN} \\times \\frac{${M}}{${N}} = ${theoreticalMean}`,
          rubric: "【高考采分点】正确计算数学期望并给出结论得 3 分。",
        },
      ],
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
    const MVal = comparisonResult?.M ?? Math.round(N * p);
    const actualPVal = comparisonResult?.actualP ?? MVal / N;
    const hyperMean = comparisonResult?.hyperDist.mean ?? n * actualPVal;
    // 二项分布与超几何分布共用同一特征比例 p₀ = M/N，故两分布期望恒相等
    const binomMean = comparisonResult?.binomDist.mean ?? n * actualPVal;
    const factor =
      comparisonResult?.varianceCorrectionFactor ??
      (N > 1 ? (N - n) / (N - 1) : 1);
    const hyperVariance =
      comparisonResult?.hyperDist.variance ??
      n * actualPVal * (1 - actualPVal) * factor;
    const maxDiff = comparisonResult?.maxDifference ?? 0;

    return {
      quantities: [
        {
          label: "总体容量与次品数 (N, M)",
          symbol: "(N, M)",
          value: `(${N}, ${MVal})`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "抽取样本数 n",
          symbol: "n",
          value: `${n}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "实际特征比例 p₀ (两分布共用)",
          symbol: "p_0 = \\frac{M}{N}",
          value: `${actualPVal.toFixed(4)} (由设定 p=${p} 取整得来)`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "超几何分布期望 E(X_超)",
          symbol: "E(X_{\\text{超}})",
          value: hyperMean.toFixed(3),
          color: MATH_COLORS.tangentLine,
        },
        {
          label: "二项分布期望 E(X_二项)",
          symbol: "E(X_{\\text{二项}})",
          value: binomMean.toFixed(3),
          color: MATH_COLORS.function,
        },
        {
          label: "★ 方差修正系数 (N-n)/(N-1)（拓展）",
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
          latex: `D(X_{\\text{超}}) = n p_0 (1-p_0) \\cdot \\frac{N-n}{N-1}, \\quad p_0 = \\frac{M}{N}`,
          note: "两分布取同一特征比例 $p_0 = \\frac{M}{N}$ 时期望恒相等（$E(X) = n p_0$）；不放回抽样的方差比有放回抽样的方差恰小一个有限总体修正系数 $\\frac{N-n}{N-1} \\le 1$，当 $N$ 很大时该系数趋近于 $1$。新课标正文只要求超几何分布的期望，方差为选学拓展内容。",
          level: "supplementary",
          isExtension: true,
          extensionBadge: "拓展 · 超出课标",
        },
        {
          name: "大样本二项逼近",
          latex: `N \\gg n \\implies P(X_{\\text{超}} = k) \\approx P(X_{\\text{二项}} = k) = C_n^k p_0^k (1-p_0)^{n-k}, \\quad p_0 = \\frac{M}{N}`,
          note: "当总体容量 $N$ 远大于抽取样本数 $n$（通常 $N \\ge 10n$）时，不放回抽样可作为二项分布近似处理。该逼近结论用于建立超几何分布向二项分布转化的直觉，属拓展内容；书写时用「$N$ 远大于 $n$ 时近似相等」表述，不使用高等数学记号。",
          level: "supplementary",
          isExtension: true,
          extensionBadge: "拓展 · 超出课标",
        },
      ],
      gaokaoPoints: [
        {
          text: "高考建模选择依据：若总体数量明确且较小（如 10 件产品中抽 3 件），必须严格使用超几何分布模型；若总体极其庞大（如全国考生、全市灯泡寿命检测），直接建模为二项分布 $B(n,p)$。",
          importance: "gaokao",
        },
        {
          text: "数学思想：大样本近似与连续化过渡的思想，是高考考查数学抽象素养的重要载体；书写时以「总体远大于样本」的近似语言表述，不使用高等数学记号。",
          importance: "core",
        },
      ],
      warnings: [],
      mnemonic:
        "总体庞大无放回，二项逼近省力气；方差修正趋近一，抽样比小可近似。",
      examAnchor: "新高考高阶思维 · 不放回抽样向独立重复试验逼近",
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 建模背景与特征比例提取",
          detail: `固定抽取样本容量 $n = ${n}$ 及总体中目标特征比例 $p_0 = \\frac{M}{N} = ${actualPVal.toFixed(4)}$，将超几何分布与参数相同的二项分布建立映射。`,
          latex: `X_{\\text{超}} \\sim H(N, M, n) \\quad \\text{与} \\quad X_{\\text{二项}} \\sim B(n, p_0) \\quad \\left(p_0 = \\frac{M}{N} = ${actualPVal.toFixed(4)}\\right)`,
          rubric: "【高考采分点】明确两分布共有期望与参数对应关系得 3 分。",
        },
        {
          step: 2,
          title: "建模联立 · 大样本近似展开与方差修正",
          detail: `两分布共用特征比例 $p_0 = \\frac{M}{N} = ${actualPVal.toFixed(4)}$。当总体容量 $N$ 远大于抽取数 $n$ 时，不放回抽样的条件概率近乎不变，组合商逼近二项展开项，$D(X_{\\text{超}}) \\to D(X_{\\text{二项}})$；方差修正系数 $\\frac{N-n}{N-1}$ 趋向于 $1$。`,
          latex: `\\frac{N-n}{N-1} = \\frac{${N}-${n}}{${N}-1} = ${factor.toFixed(3)}, \\quad D(X_{\\text{超}}) = n p_0 (1-p_0) \\cdot \\frac{N-n}{N-1} = ${hyperVariance.toFixed(4)}`,
          rubric: "【高考采分点】量化方差修正系数与概率偏差得 4 分。",
        },
        {
          step: 3,
          title: "求解反思 · 大样本建模简化准则",
          detail: `最大概率绝对偏差 $\\Delta_{\\max} = ${maxDiff.toFixed(4)}$。当 $N \\ge 10n$ 时，不放回抽样在工程与统计上可安全近似为二项分布计算。`,
          latex: `N \\gg n \\implies P(X_{\\text{超}} = k) \\approx P(X_{\\text{二项}} = k) = C_n^k p_0^k (1-p_0)^{n-k}, \\quad p_0 = \\frac{M}{N}`,
          rubric: "【高考采分点】给出大样本建模判定结论得 3 分。",
        },
      ],
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

    const isQuality = (config?.decisionScenario as string) === "quality";

    return {
      quantities: isQuality
        ? [
            {
              label: "方案 A (抽检) 期望成本",
              symbol: "E(A)",
              value: `¥${meanA}`,
              color: MATH_COLORS.paramTertiary,
            },
            {
              label: "方案 A 方差 (损失波动)",
              symbol: "D(A)",
              value: `${varA}`,
              color: MATH_COLORS.paramTertiary,
            },
            {
              label: "方案 B (全检) 固定成本",
              symbol: "E(B)",
              value: `¥${meanB}`,
              color: MATH_COLORS.paramPrimary,
            },
            {
              label: "方案 B 方差 (零风险)",
              symbol: "D(B)",
              value: `${varB}`,
              color: MATH_COLORS.paramPrimary,
            },
          ]
        : [
            {
              label: "方案 A (理财) 期望收益率",
              symbol: "E(A)",
              value: `${meanA}%`,
              color: MATH_COLORS.paramTertiary,
            },
            {
              label: "方案 A 方差 (稳健零风险)",
              symbol: "D(A)",
              value: `${varA}`,
              color: MATH_COLORS.paramTertiary,
            },
            {
              label: "方案 B (股票) 期望收益率",
              symbol: "E(B)",
              value: `${meanB}%`,
              color: MATH_COLORS.paramPrimary,
            },
            {
              label: "方案 B 方差 (市场波动)",
              symbol: "D(B)",
              value: `${varB}`,
              color: MATH_COLORS.paramPrimary,
            },
          ],
      theorems: isQuality
        ? [
            {
              name: "质检期望成本方程与临界阈值",
              latex: `E(A) = 0.4 + 40p, \\quad E(B) = 8.00`,
              condition:
                "单件抽检费 2 元，次品漏检违约损失 50 元/件，全检费 8 元",
              note: "当且仅当 $E(A) < E(B) \\iff 0.4 + 40p < 8.00 \\iff p < 0.19$ 时，选择抽检期望成本更低。",
              level: "core",
            },
            {
              name: "期望成本最小化准则",
              latex: `\\min \\{ E(A), E(B) \\}`,
              note: "新高考应用大题以工业质检为背景，通过建立期望方程求解临界次品率 $p_0$，并对 $p$ 分段给出最优决策。",
              level: "important",
            },
          ]
        : [
            {
              name: "权益资产期望收益方程与临界阈值",
              latex: `E(B) = 20p - 10(1-p) = 30p - 10, \\quad E(A) = 4.0\\%`,
              condition:
                "股票牛市概率为 $p$ 收益率 +20%，熊市亏损 -10%，稳健理财年化 4%",
              note: "当且仅当 $E(B) > E(A) \\iff 30p - 10 > 4 \\iff p > \\frac{7}{15} \\approx 0.467$ 时，股票期望收益优于理财。",
              level: "core",
            },
            {
              name: "期望-方差双准则决策原理 (Mean-Variance Rule)",
              latex: `\\text{优选目标}: \\max E(X) \\text{ 且 } \\min D(X)`,
              note: "在不确定性决策中，数学期望反映平均收益水平，方差反映风险波动。股票收益高但方差大，需结合风险承受力综合权衡。",
              level: "core",
            },
          ],
      gaokaoPoints: [
        {
          text: "新高考规范解答采分点：第一步分别求解两方案的离散型分布列；第二步求出 $E(A)$、$E(B)$ 和 $D(A)$、$D(B)$；第三步结合题目目标（如成本最低或收益最稳）给出明确文字决策结论。",
          importance: "gaokao",
        },
        {
          text: "决策分界点探究：新高考常要求通过不等式 $E(A) < E(B)$ 解出临界概率阈值（如本例中的 $p_0$），并对 $p$ 分段讨论最优策略。",
          importance: "core",
        },
      ],
      warnings: [],
      mnemonic:
        "方案对比列两行，期望定标看高低，方差护航辨稳健，结论严谨扣题意。",
      examAnchor: "新高考压轴解答题 · 期望成本与风险收益决策",
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 设元与各方案分布状态划分",
          detail:
            (config?.decisionScenario as string) === "quality"
              ? "设方案 A (抽检) 单件成本为随机变量 $X_A$，方案 B (全检) 单件成本为随机变量 $X_B$。建立各状态概率分布。"
              : "设方案 A (理财) 年化收益率为 $X_A$，方案 B (股票) 收益率为 $X_B$。建立两方案离散收益分布列。",
          latex:
            (config?.decisionScenario as string) === "quality"
              ? `\\begin{cases} P(X_A = 0) = ${(decisionResult?.schemeADist.outcomes[0]?.p ?? 0).toFixed(2)}, \\; P(X_A = 2) = 0.20, \\; P(X_A = 50) = ${(decisionResult?.schemeADist.outcomes[2]?.p ?? 0).toFixed(2)} \\\\ P(X_B = 8) = 1.00 \\end{cases}`
              : `\\begin{cases} P(X_A = 4) = 1.00 \\\\ P(X_B = 20) = p, \\; P(X_B = -10) = 1-p \\end{cases}`,
          rubric: "【高考采分点】规范写出两方案的分布列得 4 分。",
        },
        {
          step: 2,
          title: "建模联立 · 期望方程构建与临界阈值联立",
          detail:
            (config?.decisionScenario as string) === "quality"
              ? "列出两方案期望成本函数 $E(A) = 0.4 + 40p$ 与 $E(B) = 8.00$，建立方程 $E(A) = E(B)$ 求临界次品率 $p_0$。"
              : "列出期望收益函数 $E(A) = 4.0$ 与 $E(B) = 20p - 10(1-p) = 30p - 10$，建立方程 $E(B) = E(A)$ 求临界景气概率 $p_0$。",
          latex:
            (config?.decisionScenario as string) === "quality"
              ? `0.4 + 40p_0 = 8.00 \\implies 40p_0 = 7.6 \\implies p_0 = 0.19 \\; (19.0\\%)`
              : `30p_0 - 10 = 4.0 \\implies 30p_0 = 14 \\implies p_0 = \\frac{14}{30} \\approx 0.467`,
          rubric: "【高考采分点】联立期望方程并解出临界阈值得 4 分。",
        },
        {
          step: 3,
          title: "求解反思 · 分段决策与方差风险综合评价",
          detail:
            (config?.decisionScenario as string) === "quality"
              ? `当前次品率 $p = ${(Number(params.decisionParam || 0.05) * 100).toFixed(1)}\\%$。${decisionResult?.decisionConclusion ?? ""}`
              : `当前景气概率 $p = ${(params.decisionParam ?? 0.5).toFixed(2)}$。${decisionResult?.decisionConclusion ?? ""}`,
          latex:
            (config?.decisionScenario as string) === "quality"
              ? `E(A) = \\text{¥}${meanA} \\quad \\text{vs} \\quad E(B) = \\text{¥}${meanB}`
              : `E(A) = 4.0\\% \\quad \\text{vs} \\quad E(B) = ${meanB}\\%`,
          rubric: "【高考采分点】分类讨论明确最优方案结论得 2 分。",
        },
      ],
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
          note: "关键考点：平移常数 $b$ 不改变数据的离散程度，因此 $b$ 对方差无贡献；乘积系数 $a$ 的贡献为 $a^2$ 倍！",
          level: "core",
        },
        {
          name: "标准差线性变换公式",
          latex: `\\sigma(aX + b) = |a| \\sigma(X)`,
          note: "标准差取绝对值 $|a|$ 倍，始终保持非负性。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "高考计算避坑：求 $D(aX+b)$ 时，切记常数 $b$ 直接舍去，且系数 $a$ 必须平方 ($a^2$)！例如 $D(2X+3) = 4 D(X)$，而非 $2D(X)+3$！",
          importance: "gaokao",
        },
        {
          text: "实际应用：用于标准化变量 $Z = \\frac{X - \\mu}{\\sigma}$，标准化后 $E(Z) = 0, D(Z) = 1$。",
          importance: "core",
        },
      ],
      warnings: [],
      mnemonic: "期望线性随 a,b 变，方差平移 b 舍去，a 变方差加平方！",
      examAnchor: "新高考解答题 · 随机变量线性变换性质",
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 原变量特征提取",
          detail: `提取原随机变量 $X$ 的数学期望 $E(X) = ${meanVal}$ 与方差 $D(X) = ${varVal}$。`,
          latex: `E(X) = ${meanVal}, \\quad D(X) = ${varVal}, \\quad \\sigma(X) = ${stdVal}`,
          rubric: "【高考采分点】明确原变量期望与方差得 2 分。",
        },
        {
          step: 2,
          title: "建模联立 · 线性算子展开定理",
          detail: `根据线性变换性质，常数平移 $b = ${b}$ 仅平移期望而不改变离散度；缩放系数 $a = ${a}$ 对期望一次缩放，对方差二次方缩放。`,
          latex: `\\begin{cases} E(aX+b) = a E(X) + b = ${a} \\times ${meanVal} + (${b}) \\\\ D(aX+b) = a^2 D(X) = (${a})^2 \\times ${varVal} \\end{cases}`,
          rubric: "【高考采分点】正确应用线性性质展开公式得 4 分。",
        },
        {
          step: 3,
          title: "求解反思 · 新变量数字特征计算",
          detail: `代入参数计算新变量 $Y$ 的数字特征，得到 $E(Y) = ${transformedDist ? transformedDist.mean.toFixed(3) : "0"}$，$D(Y) = ${transformedDist ? transformedDist.variance.toFixed(3) : "0"}$。`,
          latex: `E(Y) = ${transformedDist ? transformedDist.mean.toFixed(3) : "0"}, \\quad D(Y) = ${transformedDist ? transformedDist.variance.toFixed(3) : "0"}, \\quad \\sigma(Y) = ${transformedDist ? transformedDist.stdDev.toFixed(3) : "0"}`,
          rubric: "【高考采分点】准确计算新变量期望方差并完成作答得 2 分。",
        },
      ],
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
        label: "概率和 $\\sum p_i$ (规范性)",
        symbol: "\\sum p_i",
        value: sumPVal,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "最大概率峰值 $P_{\\max}$",
        symbol: "P_{max}",
        value: maxPVal,
        color: MATH_COLORS.paramSecondary,
      },
    ],
    theorems: [
      {
        name: "离散分布列基本公理",
        latex: `p_i \\ge 0, \\quad \\sum_{i=1}^n p_i = 1`,
        note: "离散型随机变量在各个取值上的概率非负，且全部可能取值的概率之和恒等于 $1$。",
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
        text: "高考解答题核心考法：首先列出分布列规范表格（第一行 $X$，第二行 $P$），其次校验 $\\sum p_i = 1$，最后代入公式求期望 $E(X)$ 与方差 $D(X)$。",
        importance: "gaokao",
      },
      {
        text: "决策应用题：比较方案优劣时，均值 $E(X)$ 代表平均收益，方差 $D(X)$ 代表风险波动，通常选择“均值大、方差小”的方案。",
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
        : distResult &&
            distResult.rawSumP !== undefined &&
            Math.abs(distResult.rawSumP - 1) > 1e-6
          ? [
              {
                text: `当前各柱概率之和为 $\\sum p_i = ${distResult.rawSumP.toFixed(3)} \\ne 1$，画布已按比例归一化显示。离散型随机变量必须满足 $p_i \\ge 0$ 且 $\\sum p_i = 1$，请调整柱高使概率之和恰为 1。`,
                level: "danger",
              },
            ]
          : [],
    mnemonic: "分布列出和为一，均值支点平衡处，方差拉伸加平移。",
    examAnchor: "新高考解答题 · 离散型随机变量分布列规范与期望",
    reasoningSteps: [
      {
        step: 1,
        title: "审题定法 · 概率非负与归一化公理校验",
        detail: `核查分布列规范性：各点概率必须满足 $p_i \\ge 0$，且概率总和 $\\sum_{i=0}^3 p_i = 1$。`,
        latex: `p_i \\ge 0 \\quad \\text{且} \\quad \\sum_{i=0}^3 p_i = ${sumPVal}`,
        rubric: "【高考采分点】写出分布列公理前提并完成校验得 2 分。",
      },
      {
        step: 2,
        title: "建模联立 · 数学期望加权和展开",
        detail: `按定义式 $E(X) = \\sum x_i p_i$ 逐项展开计算数学期望，反映分布的均值位置与物理受力重心。`,
        latex: `E(X) = \\sum_{i=0}^3 x_i p_i = ${meanVal}`,
        rubric: "【高考采分点】依据定义列出期望展开式并求解得 4 分。",
      },
      {
        step: 3,
        title: "求解反思 · 物理力矩平衡验证与方差离散度",
        detail: `检验各点关于均值的偏差加权和 $\\sum (x_i - E)p_i = 0$（杠杆合力矩为 0），并计算方差 $D(X) = \\sum (x_i - E)^2 p_i = ${varVal}$。`,
        latex: `\\sum_{i=0}^3 (x_i - E)p_i = 0, \\quad D(X) = E(X^2) - [E(X)]^2 = ${varVal}`,
        rubric: "【高考采分点】计算方差并给出波动度结论得 2 分。",
      },
    ],
  };
}
