import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
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
} from "@/math/probabilityDistribution";
import { ProbabilityDistributionScene } from "./components/ProbabilityDistributionScene";

export function ProbabilityDistributionAnimation() {
  // 研究模式：'binomial' | 'hypergeometric' | 'general' | 'linear'
  const [studyMode, setStudyMode] = useState<
    "binomial" | "hypergeometric" | "general" | "linear"
  >("binomial");

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
    if (studyMode === "linear") {
      return computeBinomialDistribution(params.n, params.p);
    }
    // 一般离散分布 (权重归一化)
    return computeGeneralDiscreteDistribution([
      { x: 0, p: params.p1 },
      { x: 1, p: params.p2 },
      { x: 2, p: params.p3 },
      { x: 3, p: params.p4 },
    ]);
  }, [studyMode, params]);

  // 线性变换分布
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

  // 4. 根据模式与概率峰值动态自适应 X / Y 轴视口范围 (避免柱形过扁)
  const { minX, maxX, yMin, yMax } = useMemo(() => {
    const xs = distResult.outcomes.map((o) => o.x);
    if (transformedDist) {
      xs.push(...transformedDist.outcomes.map((o) => o.x));
    }
    const mn = Math.min(...xs, 0) - 0.8;
    const mx = Math.max(...xs, 5) + 0.8;

    // 动态控制 Y 轴高度范围，将柱体高度拉高充实中央屏幕 (60%~75% 比例)
    const maxProb = distResult.maxP || 0.3;
    const calculatedYMax = Math.max(0.32, Math.min(1.05, maxProb * 1.35));
    const calculatedYMin = -0.16;

    return { minX: mn, maxX: mx, yMin: calculatedYMin, yMax: calculatedYMax };
  }, [distResult, transformedDist]);

  const scale = useSceneScale({
    vp,
    xRange: [minX, maxX],
    yRange: [yMin, yMax],
  });

  // 5. 右屏看板数据 (根据 studyMode 动态刷新)
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-probability-distribution", params, {
      studyMode,
      distResult,
      transformedDist,
    });
  }, [params, studyMode, distResult, transformedDist]);

  // 6. 按模式过滤左屏参数配置，并应用超几何分布动态 max 联动
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      binomial: ["n", "p"],
      hypergeometric: ["N", "M", "sampleN"],
      general: ["p1", "p2", "p3", "p4"],
      linear: ["n", "p", "linearA", "linearB"],
    };

    const keys = keysByMode[studyMode] || ["n", "p"];

    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        let maxVal = meta.max;
        if (
          studyMode === "hypergeometric" &&
          (key === "M" || key === "sampleN")
        ) {
          maxVal = Math.min(meta.max, params.N);
        }

        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: maxVal,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance as any,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 当前主要模型的 KaTeX 悬浮公式
  const topFormulaLatex = useMemo(() => {
    if (studyMode === "binomial") {
      return `X \\sim B(${params.n}, ${params.p}) \\quad P(X=k) = C_{${
        params.n
      }}^k (${params.p})^k (${(1 - params.p).toFixed(2)})^{${params.n}-k}`;
    }
    if (studyMode === "hypergeometric") {
      return `X \\sim H(${params.N}, ${params.M}, ${params.sampleN}) \\quad P(X=k) = \\frac{C_{${params.M}}^k C_{${params.N - params.M}}^{${params.sampleN}-k}}{C_{${params.N}}^{${params.sampleN}}}`;
    }
    if (studyMode === "linear") {
      return `Y = ${params.linearA}X + ${params.linearB} \\implies E(Y) = ${params.linearA} E(X) + ${params.linearB}, \\; D(Y) = ${params.linearA}^2 D(X)`;
    }
    return `\\sum_{i=1}^k p_i = 1 \\quad E(X) = \\sum x_i p_i = ${distResult.mean.toFixed(
      2,
    )}`;
  }, [studyMode, params, distResult]);

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
                { key: "binomial", label: "二项分布 B(n,p)" },
                { key: "hypergeometric", label: "超几何分布 H(N,M,n)" },
                { key: "general", label: "一般分布列" },
                { key: "linear", label: "线性变换 Y=aX+b" },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as any)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 参数调节 */}
          <LeftPanelSection title="模型参数" subtitle="拖动滑块调节分布参数">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative bg-white overflow-hidden">
          {/* 1. 左上角悬浮公式看板 (KaTeX 渲染) */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-200/90 rounded-xl px-4 py-2.5 shadow-sm max-w-[50%]">
            <KatexFormula formula={topFormulaLatex} mode="inline" />
          </div>

          {/* 2. 右上角高考规范分布矩阵卡片 (Glassmorphism Overlay 优雅融入中屏右上留白) */}
          <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-xl p-3 shadow-md max-w-[48%] flex flex-col gap-1.5 transition-all">
            <div className="text-[11px] font-bold text-neutral-700 flex items-center justify-between gap-2 border-b border-neutral-100 pb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                高考分布列规范矩阵表
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                ∑P = {distResult.sumP.toFixed(3)}
              </span>
            </div>

            <div className="overflow-x-auto max-w-full">
              <table className="min-w-full text-center border-collapse bg-neutral-50/80 rounded border border-neutral-200 text-xs font-mono">
                <thead>
                  <tr className="bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200">
                    <th className="px-2.5 py-0.5 border-r border-neutral-200 text-primary-700">
                      X
                    </th>
                    {distResult.outcomes.map((o) => (
                      <th
                        key={`th-${o.x}`}
                        className="px-2 py-0.5 border-r border-neutral-200"
                      >
                        {o.x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2.5 py-0.5 font-bold text-primary-700 border-r border-neutral-200 bg-neutral-100/50">
                      P
                    </td>
                    {distResult.outcomes.map((o) => (
                      <td
                        key={`td-${o.x}`}
                        className="px-2 py-0.5 border-r border-neutral-200 text-neutral-600 font-medium"
                      >
                        {o.p.toFixed(3)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. SVG 自适应画布 占据 100% 中屏高度 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ProbabilityDistributionScene
              distResult={distResult}
              transformedDist={transformedDist}
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
              ? "二项分布 B(n,p) 指标看板"
              : studyMode === "hypergeometric"
                ? "超几何分布 H(N,M,n) 指标看板"
                : studyMode === "linear"
                  ? "线性变换 Y=aX+b 指标看板"
                  : "一般离散分布列指标看板"
          }
        />
      }
    />
  );
}
