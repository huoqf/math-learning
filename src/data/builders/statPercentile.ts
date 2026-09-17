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

  const groupCount = params.groupCount ?? 6;
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

  const bins = generateHistogramBins(shift, groupCount);
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
    const isBimodal = Math.abs(shift - 999) < 0.1;
    const skewText = isBimodal
      ? "双峰分布: 存在两个局部众数，均值处于低谷"
      : shift > 0.1
        ? "正偏态 (右偏长尾): 众数 < 中位数 < 均值"
        : shift < -0.1
          ? "负偏态 (左偏长尾): 均值 < 中位数 < 众数"
          : "对称钟形分布: 众数 ≈ 中位数 ≈ 均值";

    return {
      quantities: [
        {
          label: "矩形组数与面积总和",
          value: `${bins.length} 组 ($\\sum f_i = 1.00$)`,
          color: MATH_COLORS.axis,
        },
        {
          label: "估算众数 Mo (最高组中点)",
          value: `${stats.mode.toFixed(1)}`,
          color: MATH_COLORS.paramTertiary,
          highlight: "positive",
        },
        {
          label: "估算中位数 Me (面积二等分)",
          value: `${stats.median.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary,
          highlight: "positive",
        },
        {
          label: "估算平均数 x̄ (力矩重心)",
          value: `${stats.mean.toFixed(2)}`,
          color: MATH_COLORS.function,
          highlight: "positive",
        },
        {
          label: "估算方差 s² (离散度)",
          value: `${stats.variance.toFixed(2)}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "估算标准差 s",
          value: `${Math.sqrt(stats.variance).toFixed(2)}`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "数据偏态判断",
          value: skewText,
          color: MATH_COLORS.labelText,
        },
      ],
      theorems: [
        {
          name: "频率分布直方图两大几何公理",
          latex: `\\begin{aligned}
h_i &= \\frac{f_i}{d} \\quad (\\text{高度} = \\frac{\\text{频率}}{\\text{组距}}) \\\\
\\sum_{i=1}^k (h_i \\cdot d) &= \\sum_{i=1}^k f_i = 1 \\quad (\\text{矩形总面积恒等于 } 1)
\\end{aligned}`,
          note: "纵轴为频率/组距 $h$，各小矩形面积才代表频率 $f$；全部矩形面积总和恒等于 $1$。",
          level: "core",
        },
        {
          name: "直方图估算均值与方差 (组中值加权)",
          latex: `\\begin{aligned}
\\bar{x} &\\approx \\sum_{i=1}^k x_{\\text{mid}, i} \\cdot f_i \\\\
s^2 &\\approx \\sum_{i=1}^k (x_{\\text{mid}, i} - \\bar{x})^2 \\cdot f_i
\\end{aligned}`,
          note: "估算平均数 $\\bar{x}$ 在几何与力学上对应直方图的【力矩天平平衡支点】（重心），各组组中值到均值的力矩代数和恒为零：$\\sum (x_{\\text{mid}, i} - \\bar{x}) f_i = 0$。",
          level: "important",
        },
        {
          name: "三大特征量在偏态分布下的相对位置关系",
          latex: `\\begin{aligned}
\\text{对称分布: } & M_o \\approx M_e \\approx \\bar{x} \\\\
\\text{正偏态 (右偏长尾): } & M_o < M_e < \\bar{x} \\\\
\\text{负偏态 (左偏长尾): } & \\bar{x} < M_e < M_o
\\end{aligned}`,
          note: "平均数极易受到右侧极端极大值的拉扯而虚高；中位数具有抗极端值的稳健性，是反映偏态数据集中趋势更优的代表量。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考必考】频率分布直方图纵轴是频率/组距，求解各组频率必须乘以组距 $d$（即 $f_i = h_i \\cdot d$）！",
          importance: "gaokao",
        },
        {
          text: "【高考考点】直方图估计平均数必须用各组【组中值】乘以对应组【频率】后累加，即 $\\bar{x} = \\sum x_{\\text{mid}, i} f_i$。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】中位数是把直方图左右面积平分为 $0.5$ 的垂直切线；众数是最高矩形底边区间的中点。",
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

    const neededRatio = percentileP / 100 - prevCum;
    const offsetInBin = neededRatio / activeBin.height;

    return {
      quantities: [
        {
          label: "目标百分位 p%",
          value: `${percentileP}% (比率 ${(percentileP / 100).toFixed(2)})`,
          color: MATH_COLORS.paramPrimary,
          highlight: "positive",
        },
        {
          label: `估算第 ${percentileP}% 百分位数 P_${percentileP}`,
          value: `${stats.percentileVal.toFixed(2)}`,
          color: MATH_COLORS.paramPrimary,
          highlight: "positive",
        },
        {
          label: "落入组区间 $[a, b)$",
          value: `[${activeBin.xMin}, ${activeBin.xMax}) (组距 d=${activeBin.width})`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "前组累积频率 $F_{\\text{prev}}$",
          value: `${(prevCum * 100).toFixed(1)}%`,
          color: MATH_COLORS.labelText,
        },
        {
          label: "组内待补频率比 ($p\\% - F_{\\text{prev}}$)",
          value: `${(neededRatio * 100).toFixed(1)}%`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "该组矩形高度 $h$",
          value: `${activeBin.height.toFixed(4)} (频率 ${(activeBin.frequency * 100).toFixed(0)}%)`,
          color: MATH_COLORS.function,
        },
        {
          label: "下四分位数 Q₁ (25%)",
          value: `${stats.q1.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "中位数 Me (50%)",
          value: `${stats.median.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "上四分位数 Q₃ (75%)",
          value: `${stats.q3.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "四分位距 IQR (Q₃ - Q₁)",
          value: `${stats.iqr.toFixed(2)} (中间 50% 跨度)`,
          color: MATH_COLORS.paramSecondary,
        },
      ],
      theorems: [
        {
          name: "频率分布直方图百分位数线性插值算法 (课标核心)",
          latex: `\\begin{aligned}
x_p &= a + \\frac{\\color{${MATH_COLORS.paramPrimary}}{\\frac{p}{100} - F_{\\text{prev}}}}{\\color{${MATH_COLORS.function}}{h}} \\\\
&= ${activeBin.xMin} + \\frac{${(percentileP / 100).toFixed(2)} - ${prevCum.toFixed(2)}}{${activeBin.height.toFixed(3)}} \\\\
&= ${activeBin.xMin} + ${offsetInBin.toFixed(2)} = ${stats.percentileVal.toFixed(2)}
\\end{aligned}`,
          prerequisites: [
            `$a = ${activeBin.xMin}$ 为目标所在组区间左端点`,
            `$F_{\\text{prev}} = ${(prevCum * 100).toFixed(1)}\\%$ 为目标组之前各组频率总和`,
            `$h = ${activeBin.height.toFixed(3)}$ 为目标组矩形高度（$\\frac{f_i}{d}$）`,
          ],
          note: "在已分组的直方图中，第 $p$ 百分位数等于该组左端点加上组内未补齐频率除以矩形高度的横向偏移量。",
          level: "core",
        },
        {
          name: "未分组原始数据百分位数课标算法 (人教A版必修二对比)",
          latex: `\\begin{aligned}
& \\text{将容量为 } n \\text{ 的样本数据按从小到大升序排列，计算 } i = n \\cdot \\frac{p}{100} \\\\
& \\text{① 若 } i \\notin \\mathbb{Z} \\text{，设大于 } i \\text{ 的最小整数为 } j \\text{，则 } P_p = x_{(j)} \\\\
& \\text{② 若 } i \\in \\mathbb{Z} \\text{，则 } P_p = \\frac{x_{(i)} + x_{(i+1)}}{2}
\\end{aligned}`,
          note: "高考题中必须分清：【原始离散数列】用 $i=n \\cdot p\\%$ 取整法；【已分组直方图】用面积线性插值法。",
          level: "important",
        },
        {
          name: "四分位数与箱线图五数概括 (Five-Number Summary)",
          latex: `\\begin{aligned}
Q_1 &= P_{25} \\quad (\\text{下四分位数}) \\\\
M_e &= P_{50} \\quad (\\text{中位数}) \\\\
Q_3 &= P_{75} \\quad (\\text{上四分位数}) \\\\
\\text{IQR} &= Q_3 - Q_1 \\quad (\\text{四分位距，表征中间 } 50\\% \\text{ 数据离散度})
\\end{aligned}`,
          note: "箱线图由最小值、下四分位数 $Q_1$、中位数 $M_e$、上四分位数 $Q_3$、最大值组成，能够极其清晰地展现数据的集中趋势与偏斜形态。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】第 $p$ 百分位数的统计意义：样本中至少有 $p\\%$ 的数据小于或等于该值，至少有 $(100-p)\\%$ 的数据大于或等于该值。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】直方图求中位数即为求第 50 百分位数 $P_{50}$，实质都是基于面积累积二等分进行线性插值。",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "易错点：线性插值公式分母为矩形高度 $h$（即 $f/d$）。若误用频率 $f$，切记乘以组距 $d$（即 $\\frac{\\Delta f}{f} \\times d$）。",
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
          label: "• 组内方差贡献 $∑w_i s_i²$",
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
