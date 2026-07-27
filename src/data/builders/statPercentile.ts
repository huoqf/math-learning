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
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "上四分位数 Q₃ (75%)",
          value: `${stats.q3.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "四分位距 IQR",
          value: `${stats.iqr.toFixed(2)}`,
          color: MATH_COLORS.function,
        },
      ],
      theorems: [
        {
          name: "频率分布直方图三大特征",
          latex:
            "\\sum (\\text{高}_i \\times \\text{组距}_i) = \\sum \\text{频率}_i = 1",
          note: "纵轴为 频率/组距，矩形面积为频率，矩形总面积恒等于 1。",
          level: "core",
        },
        {
          name: "数字特征估算方法 (高考常考)",
          latex:
            "\\bar{x} = \\sum x_{\\text{mid}, i} \\cdot f_i, \\quad M_e \\text{ 平分矩形总面积为 } 0.5",
          note: "平均数 = ∑(组中值×频率)；众数为最高矩形底边中点；中位数为平分总面积垂直线。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】频率分布直方图纵轴是 频率/组距，求解各组频率需乘以组距 d！",
          importance: "gaokao",
        },
        {
          text: "【高考考点】直方图估计平均数必须用各组【组中值】乘以对应组【频率】后累加。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】中位数是把直方图左右面积平分为 0.5 的垂直切线。",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "易错警示：切勿把纵轴高度 h_i 直接当成频率！频率 = h_i × 组距 d。",
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
          name: "百分位数线性插值公式 (高考标准)",
          latex:
            "y_p = a + \\frac{\\color{#EF4444}{\\frac{p}{100} - F_{\\text{prev}}}}{\\color{#D97706}{h}} = a + \\frac{\\frac{p}{100} - F_{\\text{prev}}}{f_i} \\cdot d",
          prerequisites: [
            "$a$ 为目标所在组左端点",
            "$F_{\\text{prev}}$ 为此前各组累积频率",
            "$h$ 为该组矩形高度",
          ],
          note: "累积频率达到 p% 时，在该组内按矩形面积线性插值补足所需频率。",
          level: "core",
        },
        {
          name: "三大常考百分位数",
          latex:
            "Q_1: p=25\\% (\\text{下四分位数}), \\quad M_e: p=50\\% (\\text{中位数}), \\quad Q_3: p=75\\% (\\text{上四分位数})",
          note: "四分位距 IQR = Q₃ - Q₁ 反映数据中间 50% 的离散程度。",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】百分位数计算题解答时需先算各组累积频率，定位所在区间后再插值。",
          importance: "gaokao",
        },
        {
          text: "【高考考点】第 p 百分位数代表样本中至少有 p% 的数据小于或等于该值。",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "线性插值公式中分子为(p% - F_prev)，分母是矩形高度 h（或频率除以组距），注意量纲单位！",
          level: "warning",
        },
      ],
      mnemonic:
        "定位区间看累加，缺多少频率向上插；除以高度加左界，百分位数轻松拿！",
    };
  } else {
    // stratified 模式
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
          label: "总体标准差 s",
          value: `${stratResult.totalStd.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary,
        },
      ],
      theorems: [
        {
          name: "分层抽样比例分配公式",
          latex:
            "n_i = N_i \\cdot \\frac{n}{N} = N_i \\cdot f, \\quad \\sum n_i = n",
          note: "各层抽取的样本量与该层在总体中所占的人数比例成正比。",
          level: "core",
        },
        {
          name: "分层抽样总体均值与方差公式 (高考高频新大纲)",
          latex:
            "\\bar{x} = \\sum_{i=1}^{k} w_i \\bar{x}_i, \\quad s^2 = \\sum_{i=1}^{k} w_i \\left[ s_i^2 + (\\bar{x}_i - \\bar{x})^2 \\right]",
          prerequisites: ["$w_i = \\frac{N_i}{N}$ 满足 $\\sum w_i = 1$"],
          note: "总体方差由【组内方差加权和】与【组间均值离差平方和】两部分共同决定！",
          level: "important",
        },
      ],
      gaokaoPoints: [
        {
          text: "【高考新考点】分层抽样的总体方差计算公式：必须考虑各层本身的方差以及各层均值与总体均值偏差的平方！",
          importance: "gaokao",
        },
        {
          text: "【高考考点】当总体由差异明显的几部分组成时，必须采用分层抽样以提高估计精度。",
          importance: "gaokao",
        },
      ],
      warnings: [
        {
          text: "特别提醒：总体方差 s² 绝非简单的 ∑ w_i s_i²！必须加上组间均值偏差项 w_i (x̄_i - x̄)²。",
          level: "warning",
        },
      ],
      mnemonic:
        "按比例抽样本，总体均值权加和；总体方差两部分，层内方差加层间！",
    };
  }
}
