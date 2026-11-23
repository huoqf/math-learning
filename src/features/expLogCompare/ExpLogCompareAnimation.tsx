import React, { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  TabSwitcher,
  SelectGrid,
  TipCard,
  MathPanel,
  KatexFormula,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale, useScenario } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  defaultParams,
  paramMeta,
  EXP_LOG_COMPARE_SCENARIOS,
  type ExpLogCompareParams,
} from "@/data/registries/expLogCompare";
import {
  calcCompareTriplet,
  calcLogOperations,
  type ExpLogCompareMode,
} from "@/math/expLogCompare";
import { ExpLogCompareScene } from "./components/ExpLogCompareScene";

export const ExpLogCompareAnimation: React.FC = () => {
  const [mode, setMode] = useState<ExpLogCompareMode>("logOps");
  const [activeScenario, setActiveScenario] = useState<string>("free");
  const [params, setParams] = useState<ExpLogCompareParams>(() => ({
    ...defaultParams,
  }));

  const scenariosForMode = EXP_LOG_COMPARE_SCENARIOS[mode];
  const { tipProps, selectScenario } = useScenario<string, ExpLogCompareParams>(
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

  const scale = useSceneScale({
    vp,
    xRange: mode === "logOps" ? [-1, 10] : [-1.5, 4.5],
    yRange: mode === "logOps" ? [-3.5, 4.5] : [-2.2, 3.0],
  });

  const handleModeChange = useCallback((nextMode: string) => {
    const m = nextMode as ExpLogCompareMode;
    setMode(m);
    setActiveScenario("free");
    setParams({ ...defaultParams });
  }, []);

  const handleScenarioChange = useCallback(
    (key: string) => {
      setActiveScenario(key);
      selectScenario(key);
    },
    [selectScenario],
  );

  const handleParamChange = useCallback((key: string, value: number) => {
    setActiveScenario("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setActiveScenario("free");
    setParams({ ...defaultParams });
  }, []);

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-exp-log-compare", params, {
      mode,
      activeScenario,
    });
  }, [params, mode, activeScenario]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<ExpLogCompareMode, string[]> = {
      logOps: ["baseA", "valM", "valN", "newBaseC"],
      medianBridge: activeScenario === "free" ? ["baseA", "xSample"] : [],
      monotoneCompare: activeScenario === "free" ? ["baseA", "xSample"] : [],
    };
    return keysByMode[mode].map((key) => {
      const meta = paramMeta[key];
      return {
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key as keyof ExpLogCompareParams],
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        group: meta.group,
        marks: meta.marks,
        importance: meta.importance,
      };
    });
  }, [mode, activeScenario, params]);

  const headerFormula = useMemo(() => {
    if (mode === "logOps") {
      const res = calcLogOperations(
        params.baseA,
        params.valM,
        params.valN,
        params.newBaseC,
      );
      if (res.validity !== "ok") {
        return "a = 1 \\text{ 或 } c = 1 \\text{（对数底数退化，请调节参数避开 1）}";
      }
      const aStr = formatMathNumber(params.baseA, 1);
      const mStr = formatMathNumber(params.valM, 1);
      const nStr = formatMathNumber(params.valN, 1);
      return `\\log_{\\color{${MATH_COLORS.paramPrimary}}{${aStr}}}(${mStr} \\cdot ${nStr}) = ${formatMathNumber(res.logAM, 2)} + ${formatMathNumber(res.logAN, 2)} = ${formatMathNumber(res.logAMN, 2)}`;
    }
    const tripletKey =
      mode === "monotoneCompare"
        ? activeScenario === "monotoneCross"
          ? "monotoneCross"
          : "free"
        : activeScenario === "bridge01" || activeScenario === "bridgeHalf"
          ? activeScenario
          : "free";
    const res = calcCompareTriplet(tripletKey, params.baseA, params.xSample);
    if (res.validity !== "ok") {
      return "a = 1 \\text{（指数底数退化，请调节参数）}";
    }
    return res.sortedAsc
      .map((item) => `${item.symbol}(${formatMathNumber(item.value, 3)})`)
      .join(" < ");
  }, [mode, activeScenario, params]);

  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (mode === "logOps") {
      return [
        {
          formula: "y = \\log_a x",
          color: MATH_COLORS.function,
          style: "solid",
        },
        {
          label: "真数 M 对应对数值",
          color: MATH_COLORS.paramSecondary,
          style: "point",
        },
        {
          label: "真数 N 对应对数值",
          color: MATH_COLORS.paramTertiary,
          style: "point",
        },
      ];
    }
    return [
      {
        label: "指数函数型值 A",
        color: MATH_COLORS.paramPrimary,
        style: "solid",
      },
      {
        label: "对数/过渡型值 B",
        color: MATH_COLORS.paramSecondary,
        style: "solid",
      },
      {
        label: "幂函数型值 C",
        color: MATH_COLORS.paramTertiary,
        style: "dashed",
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
          <LeftPanelSection title="探究维度">
            <TabSwitcher
              tabs={[
                { key: "logOps", label: "运算与换底" },
                { key: "medianBridge", label: "中间值搭桥" },
                { key: "monotoneCompare", label: "单调性构造" },
              ]}
              value={mode}
              onChange={handleModeChange}
              layout="horizontal"
              size="compact"
            />
          </LeftPanelSection>

          <LeftPanelSection title="典型题型母题">
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
              <ExpLogCompareScene
                mode={mode}
                activeScenario={activeScenario}
                params={params}
                scale={scale}
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

export default ExpLogCompareAnimation;
