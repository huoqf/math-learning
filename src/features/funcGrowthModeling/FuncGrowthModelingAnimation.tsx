import React, { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  ParamPlayBar,
  TabSwitcher,
  SelectGrid,
  TipCard,
  MathPanel,
  KatexFormula,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import {
  useAnimationViewport,
  useParamPlay,
  useScenario,
  useSceneScale,
} from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  defaultParams,
  paramMeta,
  FUNC_GROWTH_SCENARIOS,
  type FuncGrowthParams,
} from "@/data/registries/funcGrowthModeling";
import {
  calcGrowthRace,
  calcPiecewiseBilling,
  calcScatterFitting,
  type FuncGrowthMode,
} from "@/math/funcGrowthModeling";
import { FuncGrowthModelingScene } from "./components/FuncGrowthModelingScene";

export const FuncGrowthModelingAnimation: React.FC = () => {
  const [mode, setMode] = useState<FuncGrowthMode>("growthRace");
  const [fitModel, setFitModel] = useState<
    "linear" | "quadratic" | "exponential"
  >("exponential");
  const [activeScenario, setActiveScenario] = useState<string>("free");
  const [params, setParams] = useState<FuncGrowthParams>(() => ({
    ...defaultParams,
  }));

  const scenariosForMode = FUNC_GROWTH_SCENARIOS[mode];
  const { tipProps, selectScenario } = useScenario<string, FuncGrowthParams>({
    scenarios: scenariosForMode,
    activeKey: activeScenario,
    params,
    onParamsChange: (next) =>
      setParams((prev) => ({
        ...prev,
        ...next,
      })),
  });

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: mode === "piecewiseBilling" ? [-1, 13] : [-0.8, 8.0],
    yRange:
      mode === "growthRace"
        ? [-4, 48]
        : mode === "piecewiseBilling"
          ? [-4, 48]
          : [-2, 24],
    keepAspectRatio: false,
  });

  const playCtrl = useParamPlay({
    min: 0.5,
    max: 7.5,
    step: 0.1,
    ratePerSecond: 1.4,
    mode: "bounce",
    getValue: () => params.xProbe,
    onChange: (val) =>
      setParams((prev) => ({ ...prev, xProbe: Number(val.toFixed(1)) })),
  });

  const handleModeChange = useCallback(
    (nextMode: string) => {
      playCtrl.pause();
      const m = nextMode as FuncGrowthMode;
      setMode(m);
      setActiveScenario("free");
      setParams({ ...defaultParams });
    },
    [playCtrl],
  );

  const handleScenarioChange = useCallback(
    (key: string) => {
      playCtrl.pause();
      setActiveScenario(key);
      selectScenario(key);
    },
    [playCtrl, selectScenario],
  );

  const handleParamChange = useCallback(
    (key: string, value: number) => {
      playCtrl.pause();
      setActiveScenario("free");
      setParams((prev) => ({ ...prev, [key]: value }));
    },
    [playCtrl],
  );

  const handleReset = useCallback(() => {
    playCtrl.pause();
    setActiveScenario("free");
    setParams({ ...defaultParams });
  }, [playCtrl]);

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-func-growth-modeling", params, {
      mode,
      fitModel,
    });
  }, [params, mode, fitModel]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<FuncGrowthMode, string[]> = {
      growthRace: ["baseA", "powerN", "linearK", "xProbe"],
      piecewiseBilling: ["usage", "rate1", "rate2", "rate3"],
      scatterFitting: ["gainScale"],
    };
    return keysByMode[mode].map((key) => {
      const meta = paramMeta[key];
      return {
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key as keyof FuncGrowthParams],
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        group: meta.group,
        marks: meta.marks,
        importance: meta.importance,
      };
    });
  }, [mode, params]);

  const headerFormula = useMemo(() => {
    if (mode === "growthRace") {
      const res = calcGrowthRace(
        params.baseA,
        params.powerN,
        params.linearK,
        params.xProbe,
      );
      return `x_0=${formatMathNumber(res.xProbe, 1)}: \\; ${formatMathNumber(res.a, 1)}^{x_0}=${formatMathNumber(res.yExp, 2)}, \\; x_0^{${res.powerN}}=${formatMathNumber(res.yPower, 2)}, \\; ${formatMathNumber(res.linearK, 1)}x_0=${formatMathNumber(res.yLinear, 2)}`;
    }
    if (mode === "piecewiseBilling") {
      const res = calcPiecewiseBilling(
        params.usage,
        params.rate1,
        params.rate2,
        params.rate3,
      );
      return `x=${formatMathNumber(res.usage, 1)} \\implies C(x)=${formatMathNumber(res.totalCost, 2)}, \\; \\bar{c}=${formatMathNumber(res.avgCost, 2)}`;
    }
    const res = calcScatterFitting(fitModel, params.gainScale);
    return `${res.formulaLatex} \\quad (SSE = ${formatMathNumber(res.sse, 3)})`;
  }, [mode, fitModel, params]);

  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (mode === "growthRace") {
      return [
        { formula: "y = a^x", color: MATH_COLORS.paramPrimary, style: "solid" },
        {
          formula: "y = x^n",
          color: MATH_COLORS.paramSecondary,
          style: "solid",
        },
        { formula: "y = kx", color: MATH_COLORS.paramTertiary, style: "solid" },
        {
          formula: "y = \\log_a x",
          color: MATH_COLORS.function,
          style: "dashed",
        },
      ];
    }
    if (mode === "piecewiseBilling") {
      return [
        {
          label: "分段累进总费用 C(x)",
          color: MATH_COLORS.function,
          style: "solid",
        },
        {
          label: "当前消费工作点",
          color: MATH_COLORS.paramPrimary,
          style: "point",
        },
      ];
    }
    return [
      { label: "观测样本散点", color: MATH_COLORS.statScatter, style: "point" },
      {
        label: "当前拟合曲线",
        color: MATH_COLORS.paramPrimary,
        style: "solid",
      },
      { label: "外推预测点", color: MATH_COLORS.inequality, style: "point" },
    ];
  }, [mode]);

  const scenarioGridItems = useMemo(() => {
    return Object.values(scenariosForMode).map((s) => ({
      key: s.id,
      label: s.name,
      fullWidth: s.id === "free",
    }));
  }, [scenariosForMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="增长与建模模块">
            <TabSwitcher
              tabs={[
                { key: "growthRace", label: "增长差异" },
                { key: "piecewiseBilling", label: "分段计费" },
                { key: "scatterFitting", label: "拟合选型" },
              ]}
              value={mode}
              onChange={handleModeChange}
              layout="horizontal"
              size="compact"
            />
          </LeftPanelSection>

          <LeftPanelSection title="课标应用情景">
            <SelectGrid
              items={scenarioGridItems}
              value={activeScenario}
              onChange={handleScenarioChange}
              columns={2}
            />
          </LeftPanelSection>

          {mode === "scatterFitting" && (
            <LeftPanelSection title="备选拟合模型">
              <TabSwitcher
                tabs={[
                  { key: "linear", label: "一次函数" },
                  { key: "quadratic", label: "二次函数" },
                  { key: "exponential", label: "指数函数" },
                ]}
                value={fitModel}
                onChange={(val) =>
                  setFitModel(val as "linear" | "quadratic" | "exponential")
                }
                layout="horizontal"
                size="compact"
              />
            </LeftPanelSection>
          )}

          <LeftPanelSection title="参数调控">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
            {mode === "growthRace" && (
              <div className="mt-2">
                <ParamPlayBar
                  isPlaying={playCtrl.isPlaying}
                  onToggle={playCtrl.toggle}
                  speed={playCtrl.speed}
                  onSpeedChange={playCtrl.setSpeed}
                  label="推进 x0 演示反超"
                />
              </div>
            )}
          </LeftPanelSection>

          {tipProps && (
            <LeftPanelSection title="题设与探究目标" compact>
              <TipCard
                variant={tipProps.variant}
                badge={tipProps.badge}
                background={tipProps.background}
                condition={tipProps.condition}
                question={tipProps.question}
              />
            </LeftPanelSection>
          )}
        </LeftPanel>
      }
      center={
        <div className="relative w-full h-full flex flex-col">
          <div className="px-4 py-2 border-b border-neutral-100 bg-white/80 backdrop-blur-xs flex items-center justify-center shrink-0">
            <KatexFormula formula={headerFormula} />
          </div>
          <div className="relative flex-1 min-h-0">
            <AnimationSvgCanvas
              containerRef={containerRef}
              transform={vp.transform}
            >
              <FuncGrowthModelingScene
                mode={mode}
                fitModel={fitModel}
                params={params}
                scale={scale}
                fontScale={canvasSize.font}
              />
            </AnimationSvgCanvas>
            <SceneLegend
              items={legendItems}
              position={mode === "growthRace" ? "top-right" : "bottom-right"}
            />
          </div>
        </div>
      }
      right={
        <MathPanel
          title="高考破题与推演看板"
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          warnings={mathData.warnings}
          reasoningSteps={mathData.reasoningSteps}
          gaokaoPoints={mathData.gaokaoPoints}
          examAnchor={mathData.examAnchor}
          mnemonic={mathData.mnemonic}
        />
      }
    />
  );
};

export default FuncGrowthModelingAnimation;
