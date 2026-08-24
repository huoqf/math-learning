import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
} from "@/data/registries/probabilityDistribution";
import {
  computeBinomialDistribution,
  computeHypergeometricDistribution,
  computeGeneralDiscreteDistribution,
  computeLinearTransformedDistribution,
  computeHypergeometricBinomialComparison,
  computeDecisionModel,
} from "@/math/probabilityDistribution";
import { ProbabilityDistributionScene } from "./components/ProbabilityDistributionScene";

export function ProbabilityDistributionAnimation() {
  // 6大教学研究模式
  const [studyMode, setStudyMode] = useState<
    | "binomial"
    | "hypergeometric"
    | "compare"
    | "linear"
    | "decision"
    | "general"
  >("binomial");

  // 决策场景切换 (质检 vs 投资)
  const [decisionScenario, setDecisionScenario] = useState<
    "quality" | "investment"
  >("quality");

  // 参数状态保存
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 1. 视口尺寸测量与自适应
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 2. 参数改动处理 (带超几何分布参数联动防越界)
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "N") {
        next.M = Math.min(next.M, value);
        next.sampleN = Math.min(next.sampleN, value);
      }
      return next;
    });
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  // 3. 计算数学模型分布结果
  const distResult = useMemo(() => {
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
      return computeBinomialDistribution(
        params.compareSampleN,
        params.compareP,
      );
    }
    if (studyMode === "linear") {
      return computeBinomialDistribution(params.n, params.p);
    }
    if (studyMode === "decision") {
      const dec = computeDecisionModel(decisionScenario, params.decisionParam);
      return dec.schemeADist;
    }
    // 一般离散分布: p0, p1, p2 可自由调节，p3 自动概率归一化
    const sum3 = params.p1 + params.p2 + params.p3;
    const p0 = params.p1;
    const p1 = params.p2;
    const p2 = params.p3;
    const p3 = Math.max(0, Number((1 - sum3).toFixed(2)));

    return computeGeneralDiscreteDistribution([
      { x: 0, p: p0 },
      { x: 1, p: p1 },
      { x: 2, p: p2 },
      { x: 3, p: p3 },
    ]);
  }, [studyMode, params, decisionScenario]);

  // 双分布对比计算结果 (模式 3)
  const comparisonResult = useMemo(() => {
    if (studyMode === "compare") {
      return computeHypergeometricBinomialComparison(
        params.compareN,
        params.compareP,
        params.compareSampleN,
      );
    }
    return undefined;
  }, [studyMode, params.compareN, params.compareP, params.compareSampleN]);

  // 决策模型计算结果 (模式 5)
  const decisionResult = useMemo(() => {
    if (studyMode === "decision") {
      return computeDecisionModel(decisionScenario, params.decisionParam);
    }
    return undefined;
  }, [studyMode, decisionScenario, params.decisionParam]);

  // 线性变换分布 (模式 4)
  const transformedDist = useMemo(() => {
    if (studyMode === "linear") {
      return computeLinearTransformedDistribution(
        distResult,
        params.linearA,
        params.linearB,
      ).transformed;
    }
    return undefined;
  }, [studyMode, distResult, params.linearA, params.linearB]);

  // 4. 数据驱动的自适应 X 轴范围 (根据当前模式的数据项自动居中展开，杜绝右侧大片空白)
  const xRange = useMemo<[number, number]>(() => {
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
  }, [
    studyMode,
    params.compareSampleN,
    params.n,
    params.sampleN,
    params.linearA,
    params.linearB,
  ]);

  const scale = useSceneScale({
    vp,
    xRange,
    yRange: studyMode === "linear" ? [-1.15, 1.35] : [-0.55, 1.25],
    keepAspectRatio: false,
  });

  // 5. 右屏看板数据 (根据 studyMode 动态刷新)
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-probability-distribution", params, {
      studyMode,
      distResult,
      transformedDist,
      comparisonResult,
      decisionResult,
      decisionScenario,
    });
  }, [
    params,
    studyMode,
    distResult,
    transformedDist,
    comparisonResult,
    decisionResult,
    decisionScenario,
  ]);

  // 6. 按模式精准过滤左屏参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
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
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode, decisionScenario]);

  // 当前主要模型的 KaTeX 悬浮公式
  const topFormulaLatex = useMemo(() => {
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
      return `\\lim_{N \\to \\infty} H(N, M, n) = B(n, p) \\quad \\text{方差修正} \\frac{N-n}{N-1} = ${comparisonResult?.varianceCorrectionFactor.toFixed(3)}`;
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
    )}`;
  }, [
    studyMode,
    params,
    distResult,
    comparisonResult,
    decisionResult,
    decisionScenario,
  ]);

  // 左屏教学提示与题设导引 (说明初始条件与核心设问)
  const tipConfig = useMemo(() => {
    if (studyMode === "binomial") {
      return {
        variant: "primary" as const,
        badge: "高考经典 · 二项分布模型与最值项",
        condition:
          "独立重复试验进行 n 次，单次成功概率为 p，随机变量 X ~ B(n, p)。",
        question:
          "求分布列、期望 E(X)=np、方差 D(X)=np(1-p) 及概率最大项 P(X=k) 的取值。",
      };
    }
    if (studyMode === "hypergeometric") {
      return {
        variant: "info" as const,
        badge: "高考高频 · 超几何分布不放回抽样",
        condition:
          "总数 N 件产品中含 M 件次品，不放回随机抽取 n 件，抽中次品数 X ~ H(N, M, n)。",
        question: "求超几何分布列、期望 E(X)=n·(M/N) 与方差，注意定义域边界。",
      };
    }
    if (studyMode === "compare") {
      return {
        variant: "warning" as const,
        badge: "高考思想 · 超几何向二项分布逼近",
        condition: "固定抽取样本量 n 和次品比例 p=M/N，逐步扩大总体总量 N。",
        question:
          "探究有限总体不放回抽样与无限总体独立重复试验之间的极限收敛关系。",
      };
    }
    if (studyMode === "decision") {
      const isQuality = decisionScenario === "quality";
      return {
        variant: "danger" as const,
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
        variant: "accent" as const,
        badge: "高考基础 · 随机变量线性变换性质",
        condition: "已知随机变量 X 的期望 E(X) 与方差 D(X)，令 Y = aX + b。",
        question:
          "探究伸缩因子 a 与平移量 b 对新变量 Y 的期望 E(Y) 与方差 D(Y) 的影响。",
      };
    }
    return {
      variant: "success" as const,
      badge: "高考基础 · 离散分布列与概率归一性",
      condition: "随机变量 X 取值为 xᵢ，对应概率为 pᵢ (pᵢ ≥ 0)。",
      question:
        "验证分布列概率归一性 ∑ pᵢ = 1，并求解期望 E(X)=∑ xᵢpᵢ 与方差 D(X)。",
    };
  }, [studyMode, decisionScenario]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 */}
          <LeftPanelSection
            title="概率模型与性质"
            subtitle="选择高中高考核心随机变量模型"
          >
            <SelectGrid
              items={[
                { key: "binomial", label: "二项分布与最值项" },
                { key: "hypergeometric", label: "超几何分布与边界" },
                { key: "compare", label: "双分布逼近收敛" },
                { key: "linear", label: "线性变换 Y=aX+b" },
                { key: "decision", label: "高考决策方案对比" },
                { key: "general", label: "一般分布列" },
              ]}
              value={studyMode}
              onChange={(k) =>
                setStudyMode(
                  k as
                    | "binomial"
                    | "hypergeometric"
                    | "compare"
                    | "linear"
                    | "decision"
                    | "general",
                )
              }
              variant="filled"
            />
          </LeftPanelSection>

          {/* 决策情境子切换 */}
          {studyMode === "decision" && (
            <LeftPanelSection
              title="决策场景选择"
              subtitle="高考典型应用题情境"
            >
              <SelectGrid
                items={[
                  { key: "quality", label: "产品质检(抽检vs全检)" },
                  { key: "investment", label: "资产配置(理财vs股票)" },
                ]}
                value={decisionScenario}
                onChange={(k) =>
                  setDecisionScenario(k as "quality" | "investment")
                }
                variant="filled"
              />
            </LeftPanelSection>
          )}

          {/* 参数调节 */}
          <LeftPanelSection title="模型参数" subtitle="拖动滑块调节分布参数">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学导引与题设背景 */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【初始条件】
                  </span>
                  <span className="text-neutral-600">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【核心设问】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative bg-white overflow-hidden">
          {/* 1. 顶部悬浮 HUD (KaTeX 公式 + 公理校验概览) */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-3 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-xl px-3.5 py-2 shadow-sm pointer-events-auto max-w-[65%]">
              <KatexFormula formula={topFormulaLatex} mode="inline" />
            </div>

            <div className="bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-xl px-3 py-1.5 shadow-sm pointer-events-auto flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {studyMode === "compare" && comparisonResult ? (
                <>
                  <span className="text-neutral-500 font-bold">方差修正:</span>
                  <span className="text-primary-700 font-bold">
                    {comparisonResult.varianceCorrectionFactor.toFixed(3)}
                  </span>
                  <span className="text-neutral-400">|</span>
                  <span className="text-neutral-500 font-bold">Δ_max:</span>
                  <span className="text-amber-700 font-bold">
                    {comparisonResult.maxDifference.toFixed(4)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-neutral-500 font-bold">公理校验:</span>
                  <span className="text-primary-700 font-bold">
                    ∑P = {distResult.sumP.toFixed(3)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 2. 底部高考规范分布矩阵表 */}
          <div className="absolute bottom-3 left-4 right-4 z-10 bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-xl p-2.5 shadow-md flex flex-col gap-1 max-h-[140px] transition-all">
            <div className="text-[11px] font-bold text-neutral-700 flex items-center justify-between px-1">
              <span className="text-primary-800 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                {studyMode === "linear"
                  ? "高考规范矩阵表 (X → Y 线性变换对照表)"
                  : studyMode === "decision"
                    ? "方案收益/成本分布对照表"
                    : "高考分布列规范矩阵表"}
              </span>
              <span className="text-[10px] text-neutral-400 font-normal">
                {studyMode === "linear"
                  ? "新变量 Y=aX+b 保持对应事件概率不变"
                  : "X 与 P(X=x) 规范对应表"}
              </span>
            </div>

            <div className="overflow-x-auto max-w-full">
              <table className="min-w-full text-center border-collapse bg-neutral-50/90 rounded border border-neutral-200 text-xs font-mono">
                {studyMode === "compare" && comparisonResult ? (
                  <>
                    <thead>
                      <tr className="bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200">
                        <th className="px-2.5 py-0.5 border-r border-neutral-200 text-primary-700 font-bold">
                          k
                        </th>
                        {comparisonResult.binomDist.outcomes.map((o) => (
                          <th
                            key={`th-k-${o.x}`}
                            className="px-2 py-0.5 border-r border-neutral-200 min-w-[36px]"
                          >
                            {o.x}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-blue-50/70 text-blue-900 border-b border-neutral-200">
                        <td className="px-2.5 py-0.5 font-bold text-blue-800 border-r border-neutral-200 bg-blue-100/60">
                          P_超
                        </td>
                        {comparisonResult.binomDist.outcomes.map((o) => {
                          const pHyper =
                            comparisonResult.hyperDist.outcomes.find(
                              (h) => h.x === o.x,
                            )?.p || 0;
                          return (
                            <td
                              key={`td-hyper-${o.x}`}
                              className="px-2 py-0.5 border-r border-neutral-200 font-medium"
                            >
                              {pHyper.toFixed(3)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="bg-amber-50/70 text-amber-900">
                        <td className="px-2.5 py-0.5 font-bold text-amber-800 border-r border-neutral-200 bg-amber-100/60">
                          P_二项
                        </td>
                        {comparisonResult.binomDist.outcomes.map((o) => (
                          <td
                            key={`td-binom-${o.x}`}
                            className="px-2 py-0.5 border-r border-neutral-200 font-medium"
                          >
                            {o.p.toFixed(3)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </>
                ) : studyMode === "decision" && decisionResult ? (
                  <>
                    <thead>
                      <tr className="bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200">
                        <th className="px-2.5 py-0.5 border-r border-neutral-200 text-primary-700 font-bold">
                          方案
                        </th>
                        <th className="px-2.5 py-0.5 border-r border-neutral-200 text-neutral-700">
                          分布状态与概率
                        </th>
                        <th className="px-2.5 py-0.5 border-r border-neutral-200 text-primary-800 font-bold">
                          期望 E
                        </th>
                        <th className="px-2.5 py-0.5 text-primary-800 font-bold">
                          方差 D
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-emerald-50/70 border-b border-neutral-200">
                        <td className="px-2.5 py-0.5 font-bold text-emerald-800 border-r border-neutral-200 bg-emerald-100/60">
                          方案 A
                        </td>
                        <td className="px-2.5 py-0.5 border-r border-neutral-200 text-left text-neutral-700">
                          {decisionResult.schemeADist.outcomes
                            .map(
                              (o) => `${o.label}: ${(o.p * 100).toFixed(0)}%`,
                            )
                            .join(" | ")}
                        </td>
                        <td className="px-2.5 py-0.5 font-bold text-emerald-800 border-r border-neutral-200">
                          {decisionResult.schemeADist.mean.toFixed(2)}
                        </td>
                        <td className="px-2.5 py-0.5 font-bold text-emerald-800">
                          {decisionResult.schemeADist.variance.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="bg-rose-50/70">
                        <td className="px-2.5 py-0.5 font-bold text-rose-800 border-r border-neutral-200 bg-rose-100/60">
                          方案 B
                        </td>
                        <td className="px-2.5 py-0.5 border-r border-neutral-200 text-left text-neutral-700">
                          {decisionResult.schemeBDist.outcomes
                            .map(
                              (o) => `${o.label}: ${(o.p * 100).toFixed(0)}%`,
                            )
                            .join(" | ")}
                        </td>
                        <td className="px-2.5 py-0.5 font-bold text-rose-800 border-r border-neutral-200">
                          {decisionResult.schemeBDist.mean.toFixed(2)}
                        </td>
                        <td className="px-2.5 py-0.5 font-bold text-rose-800">
                          {decisionResult.schemeBDist.variance.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead>
                      <tr className="bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200">
                        <th className="px-2.5 py-0.5 border-r border-neutral-200 text-primary-700 font-bold">
                          x_i
                        </th>
                        {distResult.outcomes.map((o) => (
                          <th
                            key={`th-x-${o.x}`}
                            className="px-2 py-0.5 border-r border-neutral-200 min-w-[32px]"
                          >
                            {o.label || o.x}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {studyMode === "linear" && (
                        <tr className="bg-amber-50/70 text-amber-900 font-bold border-b border-neutral-200">
                          <td className="px-2.5 py-0.5 font-bold text-amber-800 border-r border-neutral-200 bg-amber-100/60">
                            y_i
                          </td>
                          {distResult.outcomes.map((o) => (
                            <td
                              key={`td-y-${o.x}`}
                              className="px-2 py-0.5 border-r border-neutral-200 text-amber-900 font-bold"
                            >
                              {(params.linearA * o.x + params.linearB).toFixed(
                                1,
                              )}
                            </td>
                          ))}
                        </tr>
                      )}
                      <tr>
                        <td className="px-2.5 py-0.5 font-bold text-primary-700 border-r border-neutral-200 bg-neutral-100/50">
                          P_i
                        </td>
                        {distResult.outcomes.map((o) => (
                          <td
                            key={`td-p-${o.x}`}
                            className="px-2 py-0.5 border-r border-neutral-200 text-neutral-600 font-medium"
                          >
                            {o.p.toFixed(3)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </div>

          {/* 3. SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ProbabilityDistributionScene
              distResult={distResult}
              transformedDist={transformedDist}
              comparisonResult={comparisonResult}
              decisionResult={decisionResult}
              studyMode={studyMode}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              linearA={params.linearA}
              linearB={params.linearB}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title={
            studyMode === "binomial"
              ? "二项分布与最值项看板"
              : studyMode === "hypergeometric"
                ? "超几何分布指标看板"
                : studyMode === "compare"
                  ? "双分布逼近收敛看板"
                  : studyMode === "decision"
                    ? "高考方案决策指标看板"
                    : studyMode === "linear"
                      ? "线性变换 Y=aX+b 看板"
                      : "一般离散分布列看板"
          }
        />
      }
    />
  );
}
