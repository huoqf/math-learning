import type { MathPanelData } from "../types";
import {
  generateHistogramBins,
  calculateHistogramStats,
  calculateStratifiedSampling,
} from "@/math/statPercentile";
import { MATH_COLORS } from "@/theme";

export function buildStatPercentilePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) ?? "histogram";
  const scenarioKey = (config?.activeScenario as string) ?? "free";

  const percentileP = params.percentileP ?? 50;
  const shift = params.shift ?? 0;
  const sampleN = params.sampleN ?? 100;
  const N1 = params.N1 ?? 300;
  const N2 = params.N2 ?? 500;
  const N3 = params.N3 ?? 200;
  const mean1 = params.mean1 ?? 72;
  const mean2 = params.mean2 ?? 78;
  const mean3 = params.mean3 ?? 85;
  const var1 = params.var1 ?? 36;
  const var2 = params.var2 ?? 49;
  const var3 = params.var3 ?? 25;

  const bins = generateHistogramBins(shift);
  const stats = calculateHistogramStats(bins, percentileP);
  const stratResult = calculateStratifiedSampling(
    sampleN,
    N1,
    N2,
    N3,
    mean1,
    mean2,
    mean3,
    var1,
    var2,
    var3,
  );

  if (studyMode === "histogram") {
    const skewText =
      shift > 0.1
        ? "正偏态 (右偏): 众数 < 中位数 < 均值"
        : shift < -0.1
          ? "负偏态 (左偏): 均值 < 中位数 < 众数"
          : "对称钟形: 众数 ≈ 中位数 ≈ 均值";

    return {
      quantities: [
        {
          label: `第 ${percentileP}% 百分位数 P_${percentileP}`,
          value: `${stats.percentileVal.toFixed(2)}`,
          color: MATH_COLORS.paramPrimary,
          highlight: "positive",
        },
        {
          label: "直方图估算平均数 x̄",
          value: `${stats.mean.toFixed(2)}`,
          color: MATH_COLORS.function,
        },
        {
          label: "估算中位数 Me (50%)",
          value: `${stats.median.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "估算众数 Mo",
          value: `${stats.mode.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "下四分位数 Q₁ (25%)",
          value: `${stats.q1.toFixed(2)}`,
          color: MATH_COLORS.function,
        },
        {
          label: "上四分位数 Q₃ (75%)",
          value: `${stats.q3.toFixed(2)}`,
          color: MATH_COLORS.function,
        },
        {
          label: "四分位距 IQR (Q₃ - Q₁)",
          value: `${stats.iqr.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "分布偏态判断",
          value: skewText,
          color: MATH_COLORS.labelText,
        },
      ],
      theorems: [
        {
          name: "频率分布直方图三大特征",
          latex: `\\begin{aligned}
\\sum (h_i \\times d) &= \\sum f_i = 1 \\\\
h_i &= \\frac{f_i}{d}
\\end{aligned}`,
          note: "纵轴为频率/组距 $h$，矩形面积表示频率 $f$，直方图矩形总面积恒等于 $1$。",
          level: "core",
        },
        {
          name: "直方图数字特征估计公式",
          latex: `\\begin{aligned}
\\bar{x} &\\approx \\sum_{i=1}^k x_{\\text{mid}, i} \\cdot f_i \\\\
s^2 &\\approx \\sum_{i=1}^k (x_{\\text{mid}, i} - \\bar{x})^2 \\cdot f_i
\\end{aligned}`,
          note: "平均数 $\\bar{x}$ 对应直方图的物理重心支点；方差 $s^2$ 估计用各组组中值偏离平方加权求和。",
          level: "important",
        },
        {
          name: "分布偏态与特征量关系",
          latex: `\\begin{aligned}
\\text{正偏态 (右偏长尾): } & \\text{众数} < M_e < \\bar{x} \\\\
\\text{负偏态 (左偏长尾): } & \\bar{x} < M_e < \\text{众数}
\\end{aligned}`,
          note: "极端极大值会大幅拉高平均数 $\\bar{x}$，而中位数 $M_e$ 具有抗极端值的稳健性。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考必考】频率分布直方图纵轴是频率/组距，求解各组频率需乘以组距 $d$（即 $f_i = h_i \\cdot d$）！",
          importance: "gaokao",
        },
        {
          text: "【高考考点】直方图估计平均数必须用各组【组中值】乘以对应组【频率】后累加，即 $\\bar{x} = \\sum x_{\\text{mid}, i} f_i$。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】中位数是把直方图左右面积平分为 $0.5$ 的垂直切线；在对称单峰分布下，$\\text{众数} \\approx M_e \\approx \\bar{x}$。",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "易错警示：切勿把纵轴高度 $h_i$ 直接当成频率！各组频率为 $f_i = h_i \\times d$（$d$ 为组距）。",
          level: "warning",
        },
      ],
      mnemonic:
        "组中值乘频率求均值，平分面积求中位，最高矩形找众数，纵轴高度乘以距！",
    };
  } else if (studyMode === "cumulative") {
    const activeBin = bins[stats.percentileBinIndex];
    const prevCum =
      stats.percentileBinIndex > 0
        ? bins[stats.percentileBinIndex - 1].cumFrequency
        : 0;

    return {
      quantities: [
        {
          label: `目标百分位 p%`,
          value: `${percentileP}%`,
          color: MATH_COLORS.paramPrimary,
          highlight: "positive",
        },
        {
          label: `估算百分位数 P_${percentileP}`,
          value: `${stats.percentileVal.toFixed(2)}`,
          color: MATH_COLORS.paramPrimary,
          highlight: "positive",
        },
        {
          label: "落入区间",
          value: `[${activeBin.xMin}, ${activeBin.xMax})`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "前组累积频率 F_prev",
          value: `${(prevCum * 100).toFixed(1)}%`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "该组矩形高度 h",
          value: `${activeBin.height.toFixed(4)}`,
          color: MATH_COLORS.function,
        },
        {
          label: "四分位距 IQR (Q₃ - Q₁)",
          value: `${stats.iqr.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary,
        },
      ],
      theorems: [
        {
          name: "百分位数线性插值公式 (新课标标准)",
          latex: `\\begin{aligned}
y_p &= a + \\frac{\\color{${MATH_COLORS.paramPrimary}}{\\frac{p}{100} - F_{\\text{prev}}}}{\\color{${MATH_COLORS.paramSecondary}}{h}} \\\\
&= a + \\frac{\\frac{p}{100} - F_{\\text{prev}}}{f_i} \\cdot d
\\end{aligned}`,
          prerequisites: [
            "$a$ 为目标所在组左端点",
            "$F_{\\text{prev}}$ 为此前各组累积频率",
            "$h = \\frac{f_i}{d}$ 为该组矩形高度（$d$ 为组距，$f_i$ 为该组频率）",
          ],
          note: "累积频率达到 $p\\%$ 时，在该组内按矩形面积线性插值补足所需频率。",
          level: "core",
        },
        {
          name: "三大常考百分位数与箱线图",
          latex: `\\begin{aligned}
Q_1&: p=25\\% \\ (\\text{下四分位数}) \\\\
M_e&: p=50\\% \\ (\\text{中位数}) \\\\
Q_3&: p=75\\% \\ (\\text{上四分位数})
\\end{aligned}`,
          note: "四分位距 $\\text{IQR} = Q_3 - Q_1$ 反映数据中间 $50\\%$ 的离散程度，具有抗极端值稳健性。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】百分位数计算题解答时需先算各组累积频率 $F_i$，定位所在区间后再进行线性插值。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】第 $p$ 百分位数代表样本中至少有 $p\\%$ 的数据小于或等于该值。",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "线性插值公式中分子为 $(\\frac{p}{100} - F_{\\text{prev}})$，分母是矩形高度 $h$（即 $\\frac{f_i}{d}$），计算横坐标偏移时切勿遗漏组距！",
          level: "warning",
        },
      ],
      mnemonic:
        "定位区间看累加，缺多少频率向上插；除以高度加左界，百分位数轻松拿！",
    };
  } else {
    // stratified 模式
    const intraVar =
      stratResult.strataWeights[0] * stratResult.strataVars[0] +
      stratResult.strataWeights[1] * stratResult.strataVars[1] +
      stratResult.strataWeights[2] * stratResult.strataVars[2];
    const interMeanVar = Math.max(0, stratResult.totalVar - intraVar);

    const allTheorems = [
      {
        name: "分层抽样比例分配公式",
        latex: `\\begin{aligned}
n_i &= N_i \\cdot \\frac{n}{N} = N_i \\cdot f \\\\
\\sum n_i &= n
\\end{aligned}`,
        note: "各层抽取的样本量与该层在总体中所占的人数比例成正比。",
        level: "core" as const,
      },
      {
        name: "分层抽样总体均值与方差分解公式 (新高考核心)",
        latex: `\\begin{aligned}
\\bar{x} &= \\sum_{i=1}^{k} w_i \\bar{x}_i \\\\
s^2 &= \\sum_{i=1}^{k} \\color{${MATH_COLORS.paramPrimary}}{w_i s_i^2} + \\sum_{i=1}^{k} \\color{${MATH_COLORS.paramSecondary}}{w_i (\\bar{x}_i - \\bar{x})^2}
\\end{aligned}`,
        prerequisites: ["$w_i = \\frac{N_i}{N}$ 满足 $\\sum w_i = 1$"],
        note: "总体方差由【组内方差加权和】与【组间均值离差平方和】两部分共同决定！",
        level: "important" as const,
      },
      {
        name: "高考秒杀特例: 两层合并方差极速公式",
        latex: `\\begin{aligned}
s^2 &= w_1 s_1^2 + w_2 s_2^2 + w_1 w_2 (\\bar{x}_1 - \\bar{x}_2)^2
\\end{aligned}`,
        prerequisites: ["$w_1 + w_2 = 1$（如男女生成绩合并）"],
        note: "两层合并时，组间方差项可直接化简为 $w_1 w_2 (\\bar{x}_1 - \\bar{x}_2)^2$，避免二次计算总均值 $\\bar{x}$！",
        level: "important" as const,
      },
    ];

    // 二级情景置顶特化：若为两层合并，置顶两层极速公式
    const sortedTheorems =
      scenarioKey === "twoStrata"
        ? [allTheorems[2], allTheorems[0], allTheorems[1]]
        : allTheorems;

    return {
      quantities: [
        {
          label: "总体规模 N",
          value: `${stratResult.totalN}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "样本总量 n",
          value: `${stratResult.sampleN}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "抽样比例 f = n/N",
          value: `${(stratResult.samplingRatio * 100).toFixed(1)}%`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "各层抽样数 (n₁, n₂, n₃)",
          value: `(${stratResult.strataSampleN.join(", ")})`,
          color: MATH_COLORS.paramSecondary,
          highlight: "positive",
        },
        {
          label: "总体加权均值 x̄",
          value: `${stratResult.totalMean.toFixed(2)}`,
          color: MATH_COLORS.function,
        },
        {
          label: "总体加权方差 s²",
          value: `${stratResult.totalVar.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary,
          highlight: "positive",
        },
        {
          label: "• 组内方差贡献 ∑w_i s_i²",
          value: `${intraVar.toFixed(2)} (${((intraVar / Math.max(0.1, stratResult.totalVar)) * 100).toFixed(0)}%)`,
          color: MATH_COLORS.function,
        },
        {
          label: "• 组间均值离差贡献",
          value: `${interMeanVar.toFixed(2)} (${((interMeanVar / Math.max(0.1, stratResult.totalVar)) * 100).toFixed(0)}%)`,
          color: MATH_COLORS.paramSecondary,
        },
      ],
      theorems: sortedTheorems,
      gaokaoPoints: [
        {
          text: "【高考新考点】分层抽样总方差公式 $s^2 = \\sum w_i s_i^2 + \\sum w_i (\\bar{x}_i - \\bar{x})^2$：必须同时考虑各层内方差 $s_i^2$ 与均值偏离平方 $(\\bar{x}_i - \\bar{x})^2$！",
          importance: "gaokao",
        },
        {
          text: "【秒杀技巧】两组数据合并计算总方差时，利用 $s^2 = w_1 s_1^2 + w_2 s_2^2 + w_1 w_2 (\\bar{x}_1 - \\bar{x}_2)^2$ 能够直接口算，节省大题 5 分钟草稿时间！",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "特别提醒：总体方差 $s^2$ 绝非简单的 $\\sum w_i s_i^2$！必须加上组间均值偏差项 $\\sum w_i (\\bar{x}_i - \\bar{x})^2$。",
          level: "warning",
        },
      ],
      mnemonic:
        "按比例抽样本，总体均值权加和；总体方差两部分，层内方差加层间！两组速算乘权积，均值差方一秒析！",
    };
  }
}
