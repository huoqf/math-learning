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
import {
  defaultParams,
  paramMeta,
  COMBINATORICS_SCENARIOS,
  GROUPING_PRESET_SIZES,
  type CombinatoricsParams,
} from "@/data/registries/combinatoricsModels";
import {
  calcBundleModel,
  calcGapModel,
  calcGroupingModel,
  calcStarsBarsModel,
  type CombinatoricsModelMode,
} from "@/math/combinatoricsModels";
import { CombinatoricsModelsScene } from "./components/CombinatoricsModelsScene";

export const CombinatoricsModelsAnimation: React.FC = () => {
  const [mode, setMode] = useState<CombinatoricsModelMode>("bundle");
  const [activeScenario, setActiveScenario] = useState<string>("free");
  const [allowZero, setAllowZero] = useState<boolean>(false);
  const [distinctTargets, setDistinctTargets] = useState<boolean>(true);
  const [params, setParams] = useState<CombinatoricsParams>(() => ({
    ...defaultParams,
  }));

  const groupingPreset =
    mode === "grouping" && activeScenario !== "free"
      ? activeScenario
      : "equal3";

  const scenariosForMode = COMBINATORICS_SCENARIOS[mode];
  const { tipProps, selectScenario } = useScenario<string, CombinatoricsParams>(
    {
      scenarios: scenariosForMode,
      activeKey: activeScenario,
      params,
      onParamsChange: (next) =>
        setParams((prev) => ({
          ...prev,
          ...next,
        })),
    },
  );

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const handleModeChange = useCallback((nextMode: string) => {
    const m = nextMode as CombinatoricsModelMode;
    setMode(m);
    setActiveScenario("free");
    setAllowZero(false);
    setParams({ ...defaultParams });
  }, []);

  const handleScenarioChange = useCallback(
    (key: string) => {
      setActiveScenario(key);
      if (mode === "starsBars") {
        setAllowZero(key === "allowEmpty");
      }
      selectScenario(key);
    },
    [mode, selectScenario],
  );

  const handleParamChange = useCallback((key: string, value: number) => {
    setActiveScenario("free");
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      // 相邻捆绑时确保 k 不超过 n
      if (key === "n" && next.k > value) {
        next.k = Math.max(1, value);
      }
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setActiveScenario("free");
    setAllowZero(false);
    setDistinctTargets(true);
    setParams({ ...defaultParams });
  }, []);

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-combinatorics-models", params, {
      mode,
      allowZero,
      distinctTargets,
      groupingPreset,
    });
  }, [params, mode, allowZero, distinctTargets, groupingPreset]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<CombinatoricsModelMode, string[]> = {
      bundle: ["n", "k"],
      gap: ["m", "k"],
      starsBars: ["n", "r"],
      grouping: [],
    };
    return keysByMode[mode].map((key) => {
      const meta = paramMeta[key];
      let maxVal = meta.max;
      if (mode === "bundle" && key === "k") {
        maxVal = Math.min(meta.max, params.n);
      }
      if (mode === "bundle" && key === "n") {
        maxVal = 8;
      }
      return {
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: Math.min(maxVal, params[key as keyof CombinatoricsParams]),
        min: meta.min,
        max: maxVal,
        step: meta.step ?? 1,
        group: meta.group,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
      };
    });
  }, [mode, params]);

  const headerFormula = useMemo(() => {
    if (mode === "bundle") {
      const res = calcBundleModel(params.n, params.k);
      return `N = A_{\\color{${MATH_COLORS.paramSecondary}}{${res.k}}}^{\\color{${MATH_COLORS.paramSecondary}}{${res.k}}} \\cdot A_{${res.superCount}}^{${res.superCount}} = ${res.total}`;
    }
    if (mode === "gap") {
      const res = calcGapModel(params.m, params.k);
      return res.validity === "ok"
        ? `N = A_{\\color{${MATH_COLORS.paramPrimary}}{${res.m}}}^{\\color{${MATH_COLORS.paramPrimary}}{${res.m}}} \\cdot A_{${res.slots}}^{\\color{${MATH_COLORS.paramSecondary}}{${res.k}}} = ${res.total}`
        : `k = ${res.k} > m + 1 = ${res.slots} \\implies N = 0`;
    }
    if (mode === "starsBars") {
      const res = calcStarsBarsModel(params.n, params.r, allowZero);
      return res.validity === "ok"
        ? `N = C_{${res.effectiveN - 1}}^{${res.barsCount}} = ${res.total}`
        : `n = ${res.n} < r = ${res.r} \\implies N = 0`;
    }
    const sizes = GROUPING_PRESET_SIZES[groupingPreset] ?? [2, 2, 2];
    const res = calcGroupingModel(sizes, distinctTargets);
    return distinctTargets
      ? `N = \\frac{${res.rawCombinationProduct}}{${res.duplicateFactor}} \\cdot A_{${res.groupCount}}^{${res.groupCount}} = ${res.total}`
      : `N = \\frac{${res.rawCombinationProduct}}{${res.duplicateFactor}} = ${res.total}`;
  }, [mode, params, allowZero, distinctTargets, groupingPreset]);

  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (mode === "bundle") {
      return [
        {
          label: "捆绑整体元素",
          color: MATH_COLORS.paramSecondary,
          style: "solid",
        },
        {
          label: "独立自由元素",
          color: MATH_COLORS.function,
          style: "solid",
        },
      ];
    }
    if (mode === "gap") {
      return [
        {
          label: "底座先排元素",
          color: MATH_COLORS.paramPrimary,
          style: "solid",
        },
        {
          label: "插入不相邻元素",
          color: MATH_COLORS.paramSecondary,
          style: "solid",
        },
      ];
    }
    if (mode === "starsBars") {
      return [
        {
          label: "相同待分元素",
          color: MATH_COLORS.paramPrimary,
          style: "point",
        },
        {
          label: "组别分隔隔板",
          color: MATH_COLORS.paramSecondary,
          style: "solid",
        },
      ];
    }
    return [
      {
        label: "相同规模分组（须消序）",
        color: MATH_COLORS.paramSecondary,
        style: "solid",
      },
      {
        label: "不同规模分组",
        color: MATH_COLORS.function,
        style: "solid",
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
          <LeftPanelSection title="计数模型切换">
            <TabSwitcher
              tabs={[
                { key: "bundle", label: "捆绑法" },
                { key: "gap", label: "插空法" },
                { key: "starsBars", label: "隔板法" },
                { key: "grouping", label: "分组分配" },
              ]}
              value={mode}
              onChange={handleModeChange}
              layout="horizontal"
              size="compact"
            />
          </LeftPanelSection>

          <LeftPanelSection title="典型高考母题">
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

          {(mode === "starsBars" || mode === "grouping") && (
            <LeftPanelSection title="条件开关" compact>
              {mode === "starsBars" && (
                <Toggle
                  label="允许空组（先借后还转化）"
                  checked={allowZero}
                  onChange={setAllowZero}
                  size="compact"
                />
              )}
              {mode === "grouping" && (
                <Toggle
                  label="定向分配给不同对象（再乘组数阶乘）"
                  checked={distinctTargets}
                  onChange={setDistinctTargets}
                  size="compact"
                />
              )}
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
              <CombinatoricsModelsScene
                mode={mode}
                params={params}
                allowZero={allowZero}
                distinctTargets={distinctTargets}
                groupingPreset={groupingPreset}
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

export default CombinatoricsModelsAnimation;
