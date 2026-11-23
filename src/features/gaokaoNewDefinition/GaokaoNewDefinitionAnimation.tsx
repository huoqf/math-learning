import React, { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  ParamPlayBar,
  StepNavigator,
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
  useGaokaoView,
} from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  defaultParams,
  paramMeta,
  NEW_DEFINITION_SCENARIOS,
  getNewDefinitionAnswerSteps,
  type GaokaoNewDefinitionParams,
} from "@/data/registries/gaokaoNewDefinition";
import {
  calcDivisibleSequence,
  calcFixedPointIter,
  calcManhattanGeom,
  type NewDefinitionStudyMode,
} from "@/math/gaokaoNewDefinition";
import { GaokaoNewDefinitionScene } from "./components/GaokaoNewDefinitionScene";

export const GaokaoNewDefinitionAnimation: React.FC = () => {
  const isGaokao = useGaokaoView();
  const [mode, setMode] = useState<NewDefinitionStudyMode>("divisibleSeq");
  const [activeScenario, setActiveScenario] = useState<string>("free");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isStepFocusOn, setIsStepFocusOn] = useState<boolean>(isGaokao);
  const [params, setParams] = useState<GaokaoNewDefinitionParams>(() => ({
    ...defaultParams,
  }));

  const scenariosForMode = NEW_DEFINITION_SCENARIOS[mode];
  const { tipProps, selectScenario } = useScenario<
    string,
    GaokaoNewDefinitionParams
  >({
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
    xRange: mode === "fixedPointIter" ? [-0.15, 1.15] : [-4.8, 4.8],
    yRange: mode === "fixedPointIter" ? [-0.15, 1.05] : [-3.6, 3.6],
  });

  const playCtrl = useParamPlay({
    min: 2,
    max: 12,
    step: 1,
    ratePerSecond: 2,
    mode: "loop",
    getValue: () => params.iterSteps,
    onChange: (val) =>
      setParams((prev) => ({ ...prev, iterSteps: Math.round(val) })),
  });

  const answerSteps = useMemo(() => getNewDefinitionAnswerSteps(mode), [mode]);

  const handleModeChange = useCallback(
    (nextMode: string) => {
      playCtrl.pause();
      const m = nextMode as NewDefinitionStudyMode;
      setMode(m);
      setActiveScenario("free");
      setActiveStep(1);
      setIsStepFocusOn(false);
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
      setParams((prev) => {
        const next = { ...prev, [key]: value };
        if (key === "seqM") {
          const maxN = 4 * value + 2;
          next.dropI = Math.min(next.dropI, maxN - 1);
          next.dropJ = Math.min(Math.max(next.dropI + 1, next.dropJ), maxN);
        }
        return next;
      });
    },
    [playCtrl],
  );

  const handleReset = useCallback(() => {
    playCtrl.pause();
    setActiveScenario("free");
    setActiveStep(1);
    setIsStepFocusOn(false);
    setParams({ ...defaultParams });
  }, [playCtrl]);

  const handleStepChange = useCallback((step: number) => {
    setActiveStep(step);
    setIsStepFocusOn(true);
  }, []);

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-gaokao-new-definition", params, { mode });
  }, [params, mode]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<NewDefinitionStudyMode, string[]> = {
      divisibleSeq: ["seqM", "dropI", "dropJ"],
      fixedPointIter: ["iterR", "iterX0", "iterSteps"],
      manhattanGeom: ["manRadius", "manC"],
    };
    const totalN = 4 * params.seqM + 2;
    return keysByMode[mode].map((key) => {
      const meta = paramMeta[key];
      let maxVal = meta.max;
      if (mode === "divisibleSeq" && key === "dropI") maxVal = totalN - 1;
      if (mode === "divisibleSeq" && key === "dropJ") maxVal = totalN;
      return {
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: Math.min(maxVal, params[key as keyof GaokaoNewDefinitionParams]),
        min: meta.min,
        max: maxVal,
        step: meta.step ?? 1,
        group: meta.group,
        marks: meta.marks,
        importance: meta.importance,
      };
    });
  }, [mode, params]);

  const headerFormula = useMemo(() => {
    if (mode === "divisibleSeq") {
      const res = calcDivisibleSequence(
        params.seqM,
        params.dropI,
        params.dropJ,
      );
      return `S=\\{1,\\dots,${res.totalN}\\} \\setminus \\{${res.i},${res.j}\\} \\implies ${res.isDivisible ? "\\text{可分}" : "\\text{不可分}"}`;
    }
    if (mode === "fixedPointIter") {
      const res = calcFixedPointIter(
        params.iterR,
        params.iterX0,
        params.iterSteps,
      );
      return `f(x)=${formatMathNumber(res.r, 1)}x(1-x), \\quad x^*=${formatMathNumber(res.fixedPoint, 3)}, \\quad |f'(x^*)|=${formatMathNumber(Math.abs(res.derivativeAtFixed), 2)}`;
    }
    const res = calcManhattanGeom(0, 0, params.manRadius, params.manC);
    return `|x|+|y|=${formatMathNumber(res.radius, 2)} \\implies S_M=${formatMathNumber(res.manhattanArea, 2)}, \\; S_E=${formatMathNumber(res.euclideanArea, 2)}`;
  }, [mode, params]);

  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (mode === "divisibleSeq") {
      return [
        {
          label: "剔除元素 (i, j)",
          color: MATH_COLORS.degeneracy,
          style: "solid",
        },
        {
          label: "第 1 等差四元组",
          color: MATH_COLORS.function,
          style: "solid",
        },
        {
          label: "第 2 等差四元组",
          color: MATH_COLORS.paramTertiary,
          style: "solid",
        },
      ];
    }
    if (mode === "fixedPointIter") {
      return [
        { formula: "y = rx(1-x)", color: MATH_COLORS.function, style: "solid" },
        { formula: "y = x", color: MATH_COLORS.secantLine, style: "dashed" },
        {
          label: "蛛网迭代折线",
          color: MATH_COLORS.sequenceCobweb,
          style: "solid",
        },
        { label: "不动点 x*", color: MATH_COLORS.paramPrimary, style: "point" },
      ];
    }
    return [
      {
        label: "曼哈顿菱形圆",
        color: MATH_COLORS.paramPrimary,
        style: "solid",
      },
      { label: "同半径欧氏圆", color: MATH_COLORS.function, style: "dashed" },
      {
        label: "L1 等距中垂折线",
        color: MATH_COLORS.paramTertiary,
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
          <LeftPanelSection title="新定义专题类型">
            <TabSwitcher
              tabs={[
                { key: "divisibleSeq", label: "可分数列" },
                { key: "fixedPointIter", label: "迭代不动点" },
                { key: "manhattanGeom", label: "曼哈顿距离" },
              ]}
              value={mode}
              onChange={handleModeChange}
              layout="horizontal"
              size="compact"
            />
          </LeftPanelSection>

          <LeftPanelSection title="新高考19题真题情景">
            <SelectGrid
              items={scenarioGridItems}
              value={activeScenario}
              onChange={handleScenarioChange}
              columns={2}
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="高考标准解答分步走"
            action={
              <button
                type="button"
                onClick={() => setIsStepFocusOn((prev) => !prev)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                  isStepFocusOn
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:text-neutral-700"
                }`}
              >
                {isStepFocusOn ? "聚光开" : "全图亮"}
              </button>
            }
          >
            <StepNavigator
              steps={answerSteps}
              active={activeStep}
              onChange={handleStepChange}
              hint="右屏已同步聚焦当前采分步"
            />
          </LeftPanelSection>

          <LeftPanelSection title="参数调控">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
            {mode === "fixedPointIter" && (
              <div className="mt-2">
                <ParamPlayBar
                  isPlaying={playCtrl.isPlaying}
                  onToggle={playCtrl.toggle}
                  speed={playCtrl.speed}
                  onSpeedChange={playCtrl.setSpeed}
                  label="演示蛛网迭代推进"
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
              <GaokaoNewDefinitionScene
                mode={mode}
                params={params}
                scale={scale}
                activeStep={activeStep}
                isStepFocusOn={isStepFocusOn}
                fontScale={canvasSize.font}
              />
            </AnimationSvgCanvas>
            <SceneLegend
              items={legendItems}
              position={mode === "divisibleSeq" ? "top-right" : "bottom-right"}
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
          focusStep={isStepFocusOn ? activeStep : undefined}
          focusTarget="reasoning"
        />
      }
    />
  );
};

export default GaokaoNewDefinitionAnimation;
