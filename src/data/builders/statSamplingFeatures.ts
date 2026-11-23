import type { MathPanelData } from "../types";
import { MATH_COLORS } from "@/theme";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  calcLinearTransformStats,
  calcOutlierSensitivity,
  calcSamplingComparison,
  type StatSamplingMode,
} from "@/math/statSamplingFeatures";
import { BASE_SAMPLE_DATA } from "@/data/registries/statSamplingFeatures";

export function buildStatSamplingFeaturesPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as StatSamplingMode) || "sampling";
  const insertMean = Boolean(config?.insertMean);

  if (mode === "sampling") {
    const res = calcSamplingComparison(
      params.N1 ?? 120,
      params.N2 ?? 180,
      params.N3 ?? 300,
      params.sampleN ?? 30,
    );
    const pct = formatMathNumber(res.samplingFraction * 100, 2);
    return {
      examAnchor: "必修二第 9 章 · 随机抽样与分层抽样",
      mnemonic: "层间差异分层抽，抽样比同总比值，人人等概是底线！",
      quantities: [
        {
          label: "总体总人数",
          symbol: "N",
          value: res.totalN,
          color: MATH_COLORS.labelText,
        },
        {
          label: "抽样容量",
          symbol: "n",
          value: res.sampleN,
          color: MATH_COLORS.function,
        },
        {
          label: "抽样比例",
          symbol: "n / N",
          value: `${pct}\\%`,
          isInvariant: true,
          invariantNote:
            "各层样本与总体的比值均等于 $n/N$，保证每个个体等概率入样。",
          color: MATH_COLORS.paramPrimary,
        },
        ...res.strata.map((s, idx) => ({
          label: `${s.name}应抽名额`,
          symbol: `n_${idx + 1}`,
          value: s.allocated,
          color:
            idx === 0
              ? MATH_COLORS.paramPrimary
              : idx === 1
                ? MATH_COLORS.paramSecondary
                : MATH_COLORS.paramTertiary,
        })),
      ],
      theorems: [
        {
          name: "分层按比例抽样等概率定理",
          latex: "\\frac{n_i}{N_i} = \\frac{n}{N}",
          condition:
            "适用前提：总体由差异明显的若干层组成，层内独立采用简单随机抽样。",
          note: "当总体各层差异大（如不同年级、城乡地区）时，分层抽样代表性远高于直接简单随机抽样；两种方式每个个体被抽中的概率均为 $\\frac{n}{N}$。",
          level: "core",
        },
      ],
      warnings: [
        {
          text: "高频概念辨析：简单随机抽样（抽签法/随机数表）适用于总体个数较少且内部差异小的情形；分层随机抽样并非“不公平”，每个个体入样概率仍严格相等。",
          level: "info",
        },
      ],
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 求总体容量与抽样比",
          detail: "先汇总各层总体个体数得 $N$，再求样本容量与总体容量之比。",
          latex: `N = ${res.strata.map((s) => s.size).join("+")} = ${res.totalN}, \\quad k = \\frac{n}{N} = \\frac{${res.sampleN}}{${res.totalN}}`,
        },
        {
          step: 2,
          title: "建模联立 · 按比例分配各层名额",
          detail: "用抽样比乘各层规模得出理论配额，非整数时按最大余数调整。",
          latex: res.strata
            .map(
              (s, idx) =>
                `n_${idx + 1} = ${s.size} \\times \\frac{${res.sampleN}}{${res.totalN}} \\approx ${s.allocated}`,
            )
            .join(", \\quad "),
        },
        {
          step: 3,
          title: "求解反思 · 核对配额总和",
          detail: "检验各层抽取总数是否严格等于设定样本容量 $n$。",
          latex: `${res.strata.map((s) => s.allocated).join(" + ")} = ${res.sampleN}`,
        },
      ],
      gaokaoPoints: [
        {
          text: "简单随机抽样每次抽取时每个未被抽到的个体入样概率相同，放回与不放回的总体入样概率皆为 $n/N$。",
          importance: "core",
        },
      ],
    };
  }

  if (mode === "linearTransform") {
    const a = params.scaleA ?? 2;
    const b = params.shiftB ?? 5;
    const res = calcLinearTransformStats(BASE_SAMPLE_DATA, a, b);
    const meanStr = formatMathNumber(res.orig.mean, 2);
    const varStr = formatMathNumber(res.orig.variance, 2);
    const stdStr = formatMathNumber(res.orig.stdDev, 2);
    const newMeanStr = formatMathNumber(res.transformed.mean, 2);
    const newVarStr = formatMathNumber(res.transformed.variance, 2);
    const newStdStr = formatMathNumber(res.transformed.stdDev, 2);
    const aFmt = formatMathNumber(a, 1);
    const bFmt = formatMathNumber(b, 1);

    return {
      examAnchor: "必修二第 9 章 · 数据线性变换与箱线图",
      mnemonic: "平移不变离散度，均值随动方差平，标准差乘绝对值！",
      quantities: [
        {
          label: "原样本均值",
          symbol: "\\bar{x}",
          value: meanStr,
          color: MATH_COLORS.function,
        },
        {
          label: "变换后均值",
          symbol: "\\bar{y}",
          value: newMeanStr,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "原样本方差",
          symbol: "s_x^2",
          value: varStr,
          color: MATH_COLORS.function,
        },
        {
          label: "变换后方差",
          symbol: "s_y^2",
          value: newVarStr,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "变换后标准差",
          symbol: "s_y",
          value: newStdStr,
          color: MATH_COLORS.paramTertiary,
        },
        {
          label: "变换后中位数",
          symbol: "M_{e,y}",
          value: formatMathNumber(res.transformed.median, 2),
          color: MATH_COLORS.inequality,
        },
      ],
      theorems: [
        {
          name: "样本线性变换数字特征公式",
          latex:
            "\\bar{y} = a\\bar{x} + b, \\quad s_y^2 = a^2 s_x^2, \\quad s_y = |a|s_x",
          condition:
            "适用前提：所有样本数据均经过同一线性变换 $y_i = a x_i + b$。",
          note: "常数平移 $b$ 仅整体移动坐标位置（改变均值与各分位数），不影响点与均值的相对距离，故方差、标准差和极差、四分位距 $IQR$ 对平移完全免疫。",
          level: "core",
        },
      ],
      warnings:
        a < 0
          ? [
              {
                text: "注意负数缩放翻转：当 $a < 0$ 时原最小值变为新最大值，原下四分位数 $Q_1$ 变为新上四分位数 $Q_3$，且标准差缩放系数必须取 $|a|$。",
                level: "danger",
              },
            ]
          : a === 0
            ? [
                {
                  text: "退化提示：$a = 0$ 时所有样本均坍缩为同一常数 $b$，方差与标准差均为 $0$。",
                  level: "warning",
                },
              ]
            : [
                {
                  text: "高频误区：线性变换中方差乘以 $a^2$ 而非 $a$，标准差乘以 $|a|$；第 $p$ 百分位数同样满足集中趋势变换规则。",
                  level: "info",
                },
              ],
      reasoningSteps: [
        {
          step: 1,
          title: "审题定法 · 列出原样本基本统计量",
          detail: "先计算基准数据集的均值 $\\bar{x}$ 与方差 $s_x^2$。",
          latex: `\\bar{x} = ${meanStr}, \\quad s_x^2 = ${varStr}, \\quad s_x = ${stdStr}`,
        },
        {
          step: 2,
          title: "建模联立 · 代入线性变换法则",
          detail:
            "集中趋势指标受 $a, b$ 共同作用，离散程度指标仅受 $|a|$ 缩放。",
          latex: `\\bar{y} = ${aFmt} \\cdot ${meanStr} + (${bFmt}) = ${newMeanStr}, \\quad s_y^2 = (${aFmt})^2 \\cdot ${varStr} = ${newVarStr}`,
        },
        {
          step: 3,
          title: "求解反思 · 校核箱线图五数位置",
          detail: "验证极差与四分位距 $IQR = Q_3 - Q_1$ 同按 $|a|$ 放缩。",
          latex: `\\text{IQR}_y = |${aFmt}| \\cdot \\text{IQR}_x = ${formatMathNumber(res.transformed.iqr, 2)}`,
        },
      ],
      gaokaoPoints: [
        {
          text: "新高考多选题常把“全组数据同时加上同一常数”或“全体按百分比同涨”与方差、极差、中位数变化混考。",
          importance: "gaokao",
        },
      ],
    };
  }

  // outlierImpact 模式
  const outlierVal = params.outlierVal ?? 16;
  const res = calcOutlierSensitivity(BASE_SAMPLE_DATA, outlierVal, insertMean);
  return {
    examAnchor: "必修二第 9 章 · 异常值稳健性与添项变化",
    mnemonic: "均值方差畏极端，中位四分抗干扰，添入均值方差减！",
    quantities: [
      {
        label: "原样本均值",
        symbol: "\\bar{x}_0",
        value: formatMathNumber(res.base.mean, 2),
        color: MATH_COLORS.function,
      },
      {
        label: "扰动后均值",
        symbol: "\\bar{x}_1",
        value: formatMathNumber(res.perturbed.mean, 2),
        highlight: Math.abs(res.deltaMean) < 1e-6 ? "zero" : "positive",
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "原中位数",
        symbol: "M_{e0}",
        value: formatMathNumber(res.base.median, 2),
        color: MATH_COLORS.function,
      },
      {
        label: "扰动后中位数",
        symbol: "M_{e1}",
        value: formatMathNumber(res.perturbed.median, 2),
        color: MATH_COLORS.inequality,
      },
      {
        label: "原样本方差",
        symbol: "s_0^2",
        value: formatMathNumber(res.base.variance, 2),
        color: MATH_COLORS.function,
      },
      {
        label: "扰动后方差",
        symbol: "s_1^2",
        value: formatMathNumber(res.perturbed.variance, 2),
        highlight: res.deltaVariance < 0 ? "negative" : "positive",
        color: MATH_COLORS.paramSecondary,
      },
    ],
    theorems: [
      {
        name: "添入均值样本的均值不变与方差缩减定理",
        latex:
          "x_{n+1} = \\bar{x}_n \\implies \\bar{x}_{n+1} = \\bar{x}_n, \\quad s_{n+1}^2 = \\frac{n}{n+1} s_n^2",
        condition:
          "适用前提：向原样本中追加 $1$ 个恰好等于原样本均值 $\\bar{x}_n$ 的数据。",
        note: "新样本到均值的离差平方 $(x_{n+1} - \\bar{x}_n)^2 = 0$，分子离差平方和不变而分母由 $n$ 增为 $n+1$，故方差必然变小。",
        level: "core",
      },
    ],
    warnings: [
      {
        text: "统计图表识别要点：箱线图上下须之间为四分位距 $IQR = Q_3 - Q_1$，集中涵盖中间 $50\\%$ 数据；中位数只依赖位次排序，对右偏极端值稳健。",
        level: "info",
      },
    ],
    reasoningSteps: [
      {
        step: 1,
        title: "审题定法 · 对比基准样本特征量",
        detail: "读取原始 $8$ 个样本的均值、中位数与方差作为参照系。",
        latex: `\\bar{x}_0 = ${formatMathNumber(res.base.mean, 2)}, \\quad M_{e0} = ${formatMathNumber(res.base.median, 2)}, \\quad s_0^2 = ${formatMathNumber(res.base.variance, 2)}`,
      },
      {
        step: 2,
        title: "建模联立 · 分析扰动项对离差平方和贡献",
        detail: insertMean
          ? "新加样本与均值重合，离差增量为 $0$，仅样本总容量增加。"
          : `末位样本调至 $${outlierVal}$，直接改变总体和与离差平方项 $(x_{\\max} - \\bar{x}_1)^2$。`,
        latex: insertMean
          ? `s_1^2 = \\frac{${res.base.n}}{${res.perturbed.n}} s_0^2 = ${formatMathNumber(res.perturbed.variance, 2)}`
          : `\\Delta \\bar{x} = ${formatMathNumber(res.deltaMean, 2)}, \\quad \\Delta s^2 = ${formatMathNumber(res.deltaVariance, 2)}`,
      },
      {
        step: 3,
        title: "求解反思 · 评估中位数与均值稳健性",
        detail:
          "定量比较中位数与均值在扰动前后的变化幅度，辨析偏态分布中代表值的选取。",
        latex: `M_{e0} = ${formatMathNumber(res.base.median, 2)} \\to M_{e1} = ${formatMathNumber(res.perturbed.median, 2)}`,
      },
    ],
    gaokaoPoints: [
      {
        text: "若题干要求删除或新增一个大于或小于均值的数据，可直接利用“离差和为零”与“样本和”判断新均值的升降。",
        importance: "gaokao",
      },
    ],
  };
}
