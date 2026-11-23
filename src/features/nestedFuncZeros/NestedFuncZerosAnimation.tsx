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
  NESTED_FUNC_SCENARIOS,
  type NestedFuncParams,
} from "@/data/registries/nestedFuncZeros";
import {
  solveNestedEquation,
  type NestedFuncMode,
} from "@/math/nestedFuncZeros";
import { NestedFuncZerosScene } from "./components/NestedFuncZerosScene";

export const NestedFuncZerosAnimation: React.FC = () => {
  const [mode, setMode] = useState<NestedFuncMode>("quadraticNested");
  const [activeScenario, setActiveScenario] = useState<string>("free");
  const [params, setParams] = useState<NestedFuncParams>(() => ({
    ...defaultParams,
  }));

  const scenariosForMode = NESTED_FUNC_SCENARIOS[mode];
  const { tipProps, selectScenario } = useScenario<string, NestedFuncParams>({
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
    xRange: mode === "piecewiseNested" ? [-4.0, 5.5] : [-2.5, 4.5],
    yRange: [-1.2, 3.6],
  });

  const playCtrl = useParamPlay({
    min: -0.2,
    max: 2.6,
    step: 0.05,
    ratePerSecond: 0.6,
    mode: "bounce",
    getValue: () => params.targetA,
    onChange: (val) =>
      setParams((prev) => ({ ...prev, targetA: Number(val.toFixed(2)) })),
  });

  const handleModeChange = useCallback(
    (nextMode: string) => {
      playCtrl.pause();
      const m = nextMode as NestedFuncMode;
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
    return buildMathQuantities("anim-nested-func-zeros", params, { mode });
  }, [params, mode]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys =
      mode === "piecewiseNested"
        ? ["targetA", "shiftC"]
        : ["targetA", "paramB", "shiftC"];
    return keys.map((key) => {
      const meta = paramMeta[key];
      return {
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key as keyof NestedFuncParams],
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
    const res = solveNestedEquation(
      mode,
      params.targetA,
      params.paramB,
      params.shiftC,
    );
    return `f(f(x)) = \\color{${MATH_COLORS.paramPrimary}}{${formatMathNumber(params.targetA, 2)}} \\implies \\text{外层根 } ${res.outerRoots.length} \\text{ 个},\\; \\text{内层总实根 } ${res.totalCount} \\text{ 个}`;
  }, [mode, params]);

  const legendItems = useMemo<SceneLegendItem[]>(
    () => [
      { formula: "y = f(x)", color: MATH_COLORS.function, style: "solid" },
      {
        label: "外层扫线 y = a",
        color: MATH_COLORS.paramPrimary,
        style: "solid",
      },
      {
        label: "外层方程根",
        color: MATH_COLORS.paramSecondary,
        style: "point",
      },
      { label: "内层展开根 x", color: MATH_COLORS.inequality, style: "point" },
    ],
    [],
  );

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
          <LeftPanelSection title="嵌套模型切换">
            <TabSwitcher
              tabs={[
                { key: "quadraticNested", label: "翻折双谷" },
                { key: "piecewiseNested", label: "分段嵌套" },
                { key: "paramBound", label: "逆向定参" },
              ]}
              value={mode}
              onChange={handleModeChange}
              layout="horizontal"
              size="compact"
            />
          </LeftPanelSection>

          <LeftPanelSection title="选填压轴母题">
            <SelectGrid
              items={scenarioGridItems}
              value={activeScenario}
              onChange={handleScenarioChange}
              columns={2}
            />
          </LeftPanelSection>

          <LeftPanelSection title="参数调控">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
            <div className="mt-2">
              <ParamPlayBar
                isPlaying={playCtrl.isPlaying}
                onToggle={playCtrl.toggle}
                speed={playCtrl.speed}
                onSpeedChange={playCtrl.setSpeed}
                label="扫描高度 a 统计突变"
              />
            </div>
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
              <NestedFuncZerosScene
                mode={mode}
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

export default NestedFuncZerosAnimation;
