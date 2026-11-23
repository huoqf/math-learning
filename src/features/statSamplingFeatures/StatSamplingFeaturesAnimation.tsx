import React, { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  TabSwitcher,
  SelectGrid,
  Toggle,
  TipCard,
  MathPanel,
  KatexFormula,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useScenario } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  defaultParams,
  paramMeta,
  STAT_SAMPLING_SCENARIOS,
  BASE_SAMPLE_DATA,
  type StatSamplingParams,
} from "@/data/registries/statSamplingFeatures";
import {
  calcLinearTransformStats,
  calcOutlierSensitivity,
  calcSamplingComparison,
  type StatSamplingMode,
} from "@/math/statSamplingFeatures";
import { StatSamplingFeaturesScene } from "./components/StatSamplingFeaturesScene";

export const StatSamplingFeaturesAnimation: React.FC = () => {
  const [mode, setMode] = useState<StatSamplingMode>("sampling");
  const [activeScenario, setActiveScenario] = useState<string>("free");
  const [insertMean, setInsertMean] = useState<boolean>(false);
  const [params, setParams] = useState<StatSamplingParams>(() => ({
    ...defaultParams,
  }));

  const scenariosForMode = STAT_SAMPLING_SCENARIOS[mode];
  const { tipProps, selectScenario } = useScenario<string, StatSamplingParams>({
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

  const handleModeChange = useCallback((nextMode: string) => {
    const m = nextMode as StatSamplingMode;
    setMode(m);
    setActiveScenario("free");
    setInsertMean(false);
    setParams({ ...defaultParams });
  }, []);

  const handleScenarioChange = useCallback(
    (key: string) => {
      setActiveScenario(key);
      if (mode === "outlierImpact") {
        setInsertMean(key === "addMeanCheck");
      }
      selectScenario(key);
    },
    [mode, selectScenario],
  );

  const handleParamChange = useCallback((key: string, value: number) => {
    setActiveScenario("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setActiveScenario("free");
    setInsertMean(false);
    setParams({ ...defaultParams });
  }, []);

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-stat-sampling-features", params, {
      mode,
      insertMean,
    });
  }, [params, mode, insertMean]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<StatSamplingMode, string[]> = {
      sampling: ["N1", "N2", "N3", "sampleN"],
      linearTransform: ["scaleA", "shiftB"],
      outlierImpact: insertMean ? [] : ["outlierVal"],
    };
    return keysByMode[mode].map((key) => {
      const meta = paramMeta[key];
      return {
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key as keyof StatSamplingParams],
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 1,
        group: meta.group,
        marks: meta.marks,
        importance: meta.importance,
      };
    });
  }, [mode, params, insertMean]);

  const headerFormula = useMemo(() => {
    if (mode === "sampling") {
      const res = calcSamplingComparison(
        params.N1,
        params.N2,
        params.N3,
        params.sampleN,
      );
      return `k = \\frac{\\color{${MATH_COLORS.function}}{${res.sampleN}}}{${res.totalN}}, \\quad n_1=${res.strata[0]?.allocated},\\; n_2=${res.strata[1]?.allocated},\\; n_3=${res.strata[2]?.allocated}`;
    }
    if (mode === "linearTransform") {
      const res = calcLinearTransformStats(
        BASE_SAMPLE_DATA,
        params.scaleA,
        params.shiftB,
      );
      const aStr = formatMathNumber(params.scaleA, 1);
      const bStr = formatMathNumber(params.shiftB, 1);
      return `y_i = \\color{${MATH_COLORS.paramPrimary}}{${aStr}}x_i ${params.shiftB >= 0 ? "+" : ""} \\color{${MATH_COLORS.paramSecondary}}{${bStr}} \\implies \\bar{y}=${formatMathNumber(res.transformed.mean, 2)},\\; s_y^2=${formatMathNumber(res.transformed.variance, 2)}`;
    }
    const res = calcOutlierSensitivity(
      BASE_SAMPLE_DATA,
      params.outlierVal,
      insertMean,
    );
    return `\\bar{x}: ${formatMathNumber(res.base.mean, 2)} \\to ${formatMathNumber(res.perturbed.mean, 2)}, \\quad s^2: ${formatMathNumber(res.base.variance, 2)} \\to ${formatMathNumber(res.perturbed.variance, 2)}`;
  }, [mode, params, insertMean]);

  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (mode === "sampling") {
      return [
        {
          label: "高一总体与抽样",
          color: MATH_COLORS.paramPrimary,
          style: "solid",
        },
        {
          label: "高二总体与抽样",
          color: MATH_COLORS.paramSecondary,
          style: "solid",
        },
        {
          label: "高三总体与抽样",
          color: MATH_COLORS.paramTertiary,
          style: "solid",
        },
      ];
    }
    return [
      {
        label: "原样本（基准箱线图）",
        color: MATH_COLORS.function,
        style: "solid",
      },
      {
        label: mode === "linearTransform" ? "线性变换后新样本" : "扰动后新样本",
        color:
          mode === "linearTransform"
            ? MATH_COLORS.paramTertiary
            : MATH_COLORS.paramPrimary,
        style: "solid",
      },
      {
        label: "中位数 Me（竖线）",
        color: MATH_COLORS.paramPrimary,
        style: "solid",
      },
      {
        label: "样本均值（橙色标）",
        color: MATH_COLORS.paramSecondary,
        style: "point",
      },
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
          <LeftPanelSection title="统计探究模块">
            <TabSwitcher
              tabs={[
                { key: "sampling", label: "分层抽样" },
                { key: "linearTransform", label: "线性变换" },
                { key: "outlierImpact", label: "稳健与添项" },
              ]}
              value={mode}
              onChange={handleModeChange}
              layout="horizontal"
              size="compact"
            />
          </LeftPanelSection>

          <LeftPanelSection title="课标与真题情景">
            <SelectGrid
              items={scenarioGridItems}
              value={activeScenario}
              onChange={handleScenarioChange}
              columns={2}
            />
          </LeftPanelSection>

          {paramConfigs.length > 0 && (
            <LeftPanelSection title="参数调控">
              <ParamControl
                params={paramConfigs}
                onParamChange={handleParamChange}
                onReset={handleReset}
              />
            </LeftPanelSection>
          )}

          {mode === "outlierImpact" && (
            <LeftPanelSection title="新增样本开关" compact>
              <Toggle
                label="补入原均值样本（n: 8 → 9）"
                checked={insertMean}
                onChange={setInsertMean}
                size="compact"
              />
            </LeftPanelSection>
          )}

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
              <StatSamplingFeaturesScene
                mode={mode}
                params={params}
                insertMean={insertMean}
                fontScale={canvasSize.font}
              />
            </AnimationSvgCanvas>
            <SceneLegend items={legendItems} position="bottom-right" />
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

export default StatSamplingFeaturesAnimation;
