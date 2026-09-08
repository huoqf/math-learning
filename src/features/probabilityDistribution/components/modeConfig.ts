/**
 * ProbabilityDistribution 6 大教学研究模式的声明式配置与纯逻辑封装
 *
 * 职责：
 *  - 统一 6 模式（二项/超几何/双分布逼近/线性变换/高考决策/一般分布）的类型声明
 *  - 集中各模式的分布计算、X 轴范围、左屏参数筛选、悬浮公式、教学导引与图例
 * 使 Animation 变为纯 JSX 编排组件，模式相关业务逻辑全部下沉到此模块。
 */
import type { ParamConfig } from "@/components/UI";
import type { SceneLegendItem } from "@/components/Math";
import { MATH_COLORS } from "@/theme";
import { paramMeta } from "@/data/registries/probabilityDistribution";
import type {
  DistributionResult,
  DistributionComparisonResult,
  DecisionScenarioResult,
} from "@/math/probabilityDistribution";
import {
  computeBinomialDistribution,
  computeHypergeometricDistribution,
  computeGeneralDiscreteDistribution,
  computeLinearTransformedDistribution,
  computeHypergeometricBinomialComparison,
  computeDecisionModel,
} from "@/math/probabilityDistribution";

/** 6 大教学研究模式联合类型 */
export type StudyMode =
  "binomial" | "hypergeometric" | "compare" | "linear" | "decision" | "general";

/** 高考决策场景：质检 vs 投资 */
export type DecisionScenario = "quality" | "investment";

/** 左屏教学导引 TipCard 配置 */
export interface DistributionTipConfig {
  variant: "info" | "primary" | "warning" | "danger" | "success" | "accent";
  badge: string;
  condition: string;
  question: string;
}

/** 模式切换下拉的预设条目 */
export interface ModeOption {
  key: StudyMode;
  label: string;
  formula: string;
}

/** 模式描述与选项（驱动左屏 SelectGrid 与参数过滤共用） */
export const modeOptions: ModeOption[] = [
  { key: "binomial", label: "二项分布与最值项", formula: "X \\sim B(n, p)" },
  { key: "hypergeometric", label: "超几何分布", formula: "X \\sim H(N, M, n)" },
  {
    key: "compare",
    label: "双分布逼近收敛",
    formula: "\\lim_{N \\to \\infty} H = B",
  },
  { key: "linear", label: "线性变换", formula: "Y = aX + b" },
  { key: "decision", label: "高考决策方案", formula: "E(A) \\text{ vs } E(B)" },
  { key: "general", label: "一般分布列与天平", formula: "\\sum p_i = 1" },
];

/**
 * 3. 计算主分布结果（按模式分发）
 * 一般分布模式 p0/p1/p2 可调、p3 自动归一化补全
 */
export function computeDistResult(
  studyMode: StudyMode,
  params: Record<string, number>,
  decisionScenario: DecisionScenario,
): DistributionResult {
  if (studyMode === "binomial") {
    return computeBinomialDistribution(params.n, params.p);
  }
  if (studyMode === "hypergeometric") {
    return computeHypergeometricDistribution(
      params.N,
      params.M,
      params.sampleN,
    );
  }
  if (studyMode === "compare") {
    return computeBinomialDistribution(params.compareSampleN, params.compareP);
  }
  if (studyMode === "linear") {
    return computeBinomialDistribution(params.n, params.p);
  }
  if (studyMode === "decision") {
    return computeDecisionModel(decisionScenario, params.decisionParam)
      .schemeADist;
  }
  // 一般离散分布: p0, p1, p2 可自由调节，p3 自动概率归一化
  const sum3 = params.p1 + params.p2 + params.p3;
  const p3 = Math.max(0, Number((1 - sum3).toFixed(2)));
  return computeGeneralDiscreteDistribution([
    { x: 0, p: params.p1 },
    { x: 1, p: params.p2 },
    { x: 2, p: params.p3 },
    { x: 3, p: p3 },
  ]);
}

/** 双分布对比计算结果（模式 3：超几何 vs 二项逼近） */
export function computeComparisonResult(
  studyMode: StudyMode,
  params: Record<string, number>,
): DistributionComparisonResult | undefined {
  if (studyMode === "compare") {
    return computeHypergeometricBinomialComparison(
      params.compareN,
      params.compareP,
      params.compareSampleN,
    );
  }
  return undefined;
}

/** 决策模型计算结果（模式 5） */
export function computeDecisionResult(
  studyMode: StudyMode,
  params: Record<string, number>,
  decisionScenario: DecisionScenario,
): DecisionScenarioResult | undefined {
  if (studyMode === "decision") {
    return computeDecisionModel(decisionScenario, params.decisionParam);
  }
  return undefined;
}

/** 线性变换分布结果（模式 4：Y = aX + b） */
export function computeTransformedDist(
  studyMode: StudyMode,
  distResult: DistributionResult,
  params: Record<string, number>,
): DistributionResult | undefined {
  if (studyMode === "linear") {
    return computeLinearTransformedDistribution(
      distResult,
      params.linearA,
      params.linearB,
    ).transformed;
  }
  return undefined;
}

/** 4. 数据驱动的自适应 X 轴范围 */
export function computeXRange(
  studyMode: StudyMode,
  params: Record<string, number>,
): [number, number] {
  if (studyMode === "compare") {
    const n = params.compareSampleN || 4;
    return [-0.8, n + 0.8];
  }
  if (studyMode === "binomial") {
    const n = params.n || 6;
    return [-0.8, n + 0.8];
  }
  if (studyMode === "hypergeometric") {
    const n = params.sampleN || 4;
    return [-0.8, n + 0.8];
  }
  if (studyMode === "decision") {
    return [-0.3, 5.0];
  }
  if (studyMode === "general") {
    return [-0.8, 3.8];
  }
  if (studyMode === "linear") {
    const a = params.linearA ?? 2;
    const b = params.linearB ?? 1;
    const n = params.n ?? 6;
    const yVals = [b, a * n + b];
    const minVal = Math.min(0, ...yVals) - 1.0;
    const maxVal = Math.max(n, ...yVals) + 1.2;
    return [minVal, maxVal];
  }
  return [-0.8, 8.8];
}

/** 各模式 Y 轴取值区间（线性变换模式量纲不同） */
export function computeYRange(studyMode: StudyMode): [number, number] {
  return studyMode === "linear" ? [-1.15, 1.35] : [-0.55, 1.25];
}

/** 6. 按模式精准过滤左屏参数配置（含超几何防越界 / 决策场景动态值域） */
export function buildParamConfigs(
  studyMode: StudyMode,
  params: Record<string, number>,
  decisionScenario: DecisionScenario,
): ParamConfig[] {
  const keysByMode: Record<StudyMode, string[]> = {
    binomial: ["n", "p"],
    hypergeometric: ["N", "M", "sampleN"],
    compare: ["compareN", "compareP", "compareSampleN"],
    linear: ["n", "p", "linearA", "linearB"],
    decision: ["decisionParam"],
    general: ["p1", "p2", "p3"],
  };

  const keys = keysByMode[studyMode] || ["n", "p"];

  return keys
    .filter((key) => key in paramMeta)
    .map((key) => {
      const meta = paramMeta[key];
      let maxVal = meta.max;
      let minVal = meta.min;

      if (studyMode === "linear" && key === "n") {
        minVal = 2;
        maxVal = 8;
      }

      if (
        studyMode === "hypergeometric" &&
        (key === "M" || key === "sampleN")
      ) {
        maxVal = Math.min(meta.max, params.N);
      }

      if (studyMode === "decision") {
        if (decisionScenario === "quality") {
          minVal = 0.01;
          maxVal = 0.2;
        } else {
          minVal = 0.1;
          maxVal = 0.9;
        }
      }

      return {
        key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min: minVal,
        max: maxVal,
        step: meta.step ?? 0.1,
        importance: meta.importance,
        marks: meta.marks,
      };
    });
}

/** 当前主要模型的 KaTeX 悬浮公式 */
export function getTopFormulaLatex(
  studyMode: StudyMode,
  params: Record<string, number>,
  distResult: DistributionResult,
  comparisonResult?: DistributionComparisonResult,
  decisionResult?: DecisionScenarioResult,
  decisionScenario?: DecisionScenario,
): string {
  if (studyMode === "binomial") {
    const modeStr = distResult.modeX.join(", ");
    const modeTip = `\\quad k_{\\text{最值}} = ${modeStr}`;
    return `X \\sim B(${params.n}, ${params.p}) \\quad P(X=k) = C_{${
      params.n
    }}^k (${params.p})^k (${(1 - params.p).toFixed(2)})^{${
      params.n
    }-k} ${modeTip}`;
  }
  if (studyMode === "hypergeometric") {
    const kMin = Math.max(0, params.sampleN - (params.N - params.M));
    const kMax = Math.min(params.sampleN, params.M);
    return `X \\sim H(${params.N}, ${params.M}, ${params.sampleN}) \\quad k \\in [${kMin}, ${kMax}] \\quad P(X=k) = \\frac{C_{${params.M}}^k C_{${params.N - params.M}}^{${params.sampleN}-k}}{C_{${params.N}}^{${params.sampleN}}}`;
  }
  if (studyMode === "compare") {
    return `\\lim_{N \\to \\infty} H(N, M, n) = B(n, p) \\quad \\text{修正系数 } \\frac{N-n}{N-1} = ${comparisonResult?.varianceCorrectionFactor.toFixed(3)}`;
  }
  if (studyMode === "decision") {
    return decisionScenario === "quality"
      ? `\\text{质检决策} \\quad E(A) = \\text{¥}${decisionResult?.schemeADist.mean.toFixed(2)} \\text{ vs } E(B) = \\text{¥}8.00`
      : `\\text{投资决策} \\quad E(\\text{股票}) = ${decisionResult?.schemeBDist.mean.toFixed(1)}\\% \\text{ vs } E(\\text{理财}) = 4.0\\%`;
  }
  if (studyMode === "linear") {
    const aStr = params.linearA === 1 ? "" : `${params.linearA}`;
    const bVal = params.linearB;
    const bStr =
      bVal > 0 ? ` + ${bVal}` : bVal < 0 ? ` - ${Math.abs(bVal)}` : "";
    const exprY = `Y = ${aStr}X${bStr}`;
    return `${exprY} \\implies E(Y) = ${params.linearA} E(X) ${bStr}, \\; D(Y) = ${params.linearA}^2 D(X)`;
  }
  return `\\sum_{i=0}^3 p_i = 1 \\quad E(X) = \\sum x_i p_i = ${distResult.mean.toFixed(
    2,
  )} \\quad \\sum (x_i - E)p_i = 0`;
}

/** 左屏教学提示与题设导引 */
export function getTipConfig(
  studyMode: StudyMode,
  decisionScenario: DecisionScenario,
): DistributionTipConfig {
  if (studyMode === "binomial") {
    return {
      variant: "primary",
      badge: "高考经典 · 二项分布模型与最值项",
      condition:
        "独立重复试验进行 n 次，单次成功概率为 p，随机变量 X ~ B(n, p)。",
      question:
        "求分布列、期望 E(X)=np、方差 D(X)=np(1-p) 及概率最大项 P(X=k) 的取值。",
    };
  }
  if (studyMode === "hypergeometric") {
    return {
      variant: "info",
      badge: "高考高频 · 超几何分布不放回抽样",
      condition:
        "总数 N 件产品中含 M 件次品，不放回随机抽取 n 件，抽中次品数 X ~ H(N, M, n)。",
      question: "求超几何分布列、期望 E(X)=n·(M/N) 与方差，注意定义域边界。",
    };
  }
  if (studyMode === "compare") {
    return {
      variant: "warning",
      badge: "高考思想 · 超几何向二项分布逼近",
      condition: "固定抽取样本量 n 和次品比例 p=M/N，逐步扩大总体总量 N。",
      question:
        "探究有限总体不放回抽样与无限总体独立重复试验之间的极限收敛关系。",
    };
  }
  if (studyMode === "decision") {
    const isQuality = decisionScenario === "quality";
    return {
      variant: "danger",
      badge: isQuality
        ? "高考压轴 · 产品质检期望成本决策"
        : "高考压轴 · 资产配置期望收益决策",
      condition: isQuality
        ? "方案 A(抽检): 检验费 0.4 元，次品流出损失 40p；方案 B(全检): 检验费固定 8 元，杜绝流出。"
        : "方案 A(股票): 景气概率 p 收益 20%，不景气亏损 10%；方案 B(理财): 固定年化收益 4%。",
      question: isQuality
        ? "求两方案期望成本方程 E(A), E(B)，并确定选择抽检或全检的临界次品率 p₀。"
        : "求股票期望收益 E(X)，并计算使股票优于固定理财的临界景气概率 p₀。",
    };
  }
  if (studyMode === "linear") {
    return {
      variant: "accent",
      badge: "高考基础 · 随机变量线性变换性质",
      condition: "已知随机变量 X 的期望 E(X) 与方差 D(X)，令 Y = aX + b。",
      question:
        "探究伸缩因子 a 与平移量 b 对新变量 Y 的期望 E(Y) 与方差 D(Y) 的影响。",
    };
  }
  return {
    variant: "success",
    badge: "高考基础 · 离散分布列与力矩天平平衡",
    condition: "随机变量 X 取值为 xᵢ，对应概率为 pᵢ (pᵢ ≥ 0 且 ∑pᵢ=1)。",
    question:
      "可在中屏画布直接上下拖拽柱顶调节概率，观察期望支点力矩平衡 ∑(xᵢ-E)pᵢ=0。",
  };
}

/** 中屏右下角图例配置（仅双分布逼近 / 决策模式有图例） */
export function getLegendItems(studyMode: StudyMode): SceneLegendItem[] {
  if (studyMode === "compare") {
    return [
      {
        label: "超几何分布 H",
        formula: "X \\sim H(N, M, n)",
        color: MATH_COLORS.primary,
        style: "solid",
      },
      {
        label: "二项分布 B",
        formula: "X \\sim B(n, p)",
        color: MATH_COLORS.paramSecondary,
        style: "solid",
      },
      {
        label: "期望支点",
        formula: "E(X)",
        color: MATH_COLORS.tangentLine,
        style: "point",
      },
    ];
  }
  if (studyMode === "decision") {
    return [
      {
        label: "方案 A",
        color: MATH_COLORS.paramTertiary,
        style: "solid",
      },
      {
        label: "方案 B",
        color: MATH_COLORS.paramPrimary,
        style: "solid",
      },
    ];
  }
  return [];
}
