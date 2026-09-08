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
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams } from "@/data/registries/probabilityDistribution";
import { ProbabilityDistributionScene } from "./components/ProbabilityDistributionScene";
import { DistributionTable } from "./components/DistributionTable";
import {
  computeDistResult,
  computeComparisonResult,
  computeDecisionResult,
  computeTransformedDist,
  computeXRange,
  computeYRange,
  buildParamConfigs,
  getTopFormulaLatex,
  getTipConfig,
  getLegendItems,
  modeOptions,
  type StudyMode,
  type DecisionScenario,
} from "./components/modeConfig";

export function ProbabilityDistributionAnimation() {
  // 6大教学研究模式
  const [studyMode, setStudyMode] = useState<StudyMode>("binomial");

  // 决策场景切换 (质检 vs 投资)
  const [decisionScenario, setDecisionScenario] =
    useState<DecisionScenario>("quality");

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

  // 画布上直接拖拽柱高调整一般分布概率（保证前三项总和不超过 1.0）
  const handleCanvasProbabilityChange = (index: number, newP: number) => {
    setParams((prev) => {
      const pKey = index === 0 ? "p1" : index === 1 ? "p2" : "p3";
      const otherSum =
        index === 0
          ? prev.p2 + prev.p3
          : index === 1
            ? prev.p1 + prev.p3
            : prev.p1 + prev.p2;

      const safeP = Math.min(newP, Math.max(0, 1.0 - otherSum));
      return { ...prev, [pKey]: Number(safeP.toFixed(2)) };
    });
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  // 3. 各模式数学模型计算结果
  const distResult = useMemo(
    () => computeDistResult(studyMode, params, decisionScenario),
    [studyMode, params, decisionScenario],
  );

  const comparisonResult = useMemo(
    () => computeComparisonResult(studyMode, params),
    [studyMode, params],
  );

  const decisionResult = useMemo(
    () => computeDecisionResult(studyMode, params, decisionScenario),
    [studyMode, params, decisionScenario],
  );

  const transformedDist = useMemo(
    () => computeTransformedDist(studyMode, distResult, params),
    [studyMode, distResult, params],
  );

  // 4. 数据驱动的自适应坐标范围
  const xRange = useMemo(
    () => computeXRange(studyMode, params),
    [studyMode, params],
  );
  const yRange = useMemo(() => computeYRange(studyMode), [studyMode]);

  const scale = useSceneScale({
    vp,
    xRange,
    yRange,
    keepAspectRatio: false,
  });

  // 5. 右屏看板数据
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

  // 6. 按模式过滤左屏参数配置
  const paramConfigs = useMemo<ParamConfig[]>(
    () => buildParamConfigs(studyMode, params, decisionScenario),
    [studyMode, params, decisionScenario],
  );

  // 当前主要模型的 KaTeX 悬浮公式
  const topFormulaLatex = useMemo(
    () =>
      getTopFormulaLatex(
        studyMode,
        params,
        distResult,
        comparisonResult,
        decisionResult,
        decisionScenario,
      ),
    [
      studyMode,
      params,
      distResult,
      comparisonResult,
      decisionResult,
      decisionScenario,
    ],
  );

  // 左屏教学提示与题设导引
  const tipConfig = useMemo(
    () => getTipConfig(studyMode, decisionScenario),
    [studyMode, decisionScenario],
  );

  // 中屏右下角图例配置
  const legendItems = useMemo<SceneLegendItem[]>(
    () => getLegendItems(studyMode),
    [studyMode],
  );

  // 右屏看板标题
  const panelTitle = useMemo(() => {
    const titleMap: Record<StudyMode, string> = {
      binomial: "二项分布与最值项看板",
      hypergeometric: "超几何分布指标看板",
      compare: "双分布逼近收敛看板",
      decision: "高考方案决策指标看板",
      linear: "线性变换 Y=aX+b 看板",
      general: "一般离散分布列看板",
    };
    return titleMap[studyMode];
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 */}
          <LeftPanelSection title="概率模型与性质">
            <SelectGrid
              items={modeOptions.map((opt) => ({
                key: opt.key,
                label: opt.label,
                formula: opt.formula,
              }))}
              value={studyMode}
              onChange={(k) => setStudyMode(k as StudyMode)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 决策情境子切换 */}
          {studyMode === "decision" && (
            <LeftPanelSection title="决策场景选择">
              <SelectGrid
                items={[
                  {
                    key: "quality",
                    label: "产品质检",
                    formula: "\\text{抽检 vs 全检}",
                  },
                  {
                    key: "investment",
                    label: "资产配置",
                    formula: "\\text{理财 vs 股票}",
                  },
                ]}
                value={decisionScenario}
                onChange={(k) => setDecisionScenario(k as DecisionScenario)}
                variant="filled"
              />
            </LeftPanelSection>
          )}

          {/* 参数调节 */}
          <LeftPanelSection title="模型参数">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学导引与题设背景 */}
          <div className="mt-auto">
            <TipCard
              variant={tipConfig.variant}
              badge={tipConfig.badge}
              condition={tipConfig.condition}
              question={tipConfig.question}
            />
          </div>
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

            <DistributionTable
              studyMode={studyMode}
              distResult={distResult}
              linearA={params.linearA}
              linearB={params.linearB}
              comparisonResult={comparisonResult}
              decisionResult={decisionResult}
            />
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
              onProbabilityChange={handleCanvasProbabilityChange}
            />
          </AnimationSvgCanvas>

          {/* 4. 中屏右下角毛玻璃图例 */}
          {legendItems.length > 0 && <SceneLegend items={legendItems} />}
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title={panelTitle}
        />
      }
    />
  );
}
