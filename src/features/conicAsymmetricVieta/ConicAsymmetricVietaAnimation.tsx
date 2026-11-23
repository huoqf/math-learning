import React, { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  StepNavigator,
  TabSwitcher,
  SelectGrid,
  TipCard,
  MathPanel,
  KatexFormula,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useScenario, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  defaultParams,
  paramMeta,
  CONIC_ASYM_SCENARIOS,
  getConicAsymAnswerSteps,
  type ConicAsymParams,
} from "@/data/registries/conicAsymmetricVieta";
import {
  calcAsymVieta,
  calcHiddenCircle,
  calcSymmetryShortest,
  type ConicAsymStudyMode,
  type HiddenCircleType,
} from "@/math/conicAsymmetricVieta";
import { ConicAsymmetricVietaScene } from "./components/ConicAsymmetricVietaScene";

export const ConicAsymmetricVietaAnimation: React.FC = () => {
  const [mode, setMode] = useState<ConicAsymStudyMode>("asymVieta");
  const [activeScenario, setActiveScenario] = useState<string>("free");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isStepFocusOn, setIsStepFocusOn] = useState<boolean>(false);
  const [params, setParams] = useState<ConicAsymParams>(() => ({
    ...defaultParams,
  }));

  const circleType: HiddenCircleType =
    mode === "hiddenCircle" &&
    (activeScenario === "diameter" ||
      activeScenario === "fixedAngle" ||
      activeScenario === "distSumSq")
      ? activeScenario
      : "diameter";

  const scenariosForMode = CONIC_ASYM_SCENARIOS[mode];
  const { tipProps, selectScenario } = useScenario<string, ConicAsymParams>({
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
    xRange: mode === "asymVieta" ? [-5.5, 6.5] : [-5.5, 5.5],
    yRange: [-4.0, 4.0],
  });

  const answerSteps = useMemo(() => getConicAsymAnswerSteps(), []);

  const handleModeChange = useCallback((nextMode: string) => {
    const m = nextMode as ConicAsymStudyMode;
    setMode(m);
    setActiveScenario("free");
    setActiveStep(1);
    setIsStepFocusOn(false);
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
    if (key !== "angleDeg" && key !== "probePx") {
      setActiveScenario((prev) =>
        prev === "diameter" || prev === "fixedAngle" || prev === "distSumSq"
          ? prev
          : "free",
      );
    }
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setActiveScenario("free");
    setActiveStep(1);
    setIsStepFocusOn(false);
    setParams({ ...defaultParams });
  }, []);

  const handleStepChange = useCallback((step: number) => {
    setActiveStep(step);
    setIsStepFocusOn(true);
  }, []);

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-conic-asymmetric-vieta", params, {
      mode,
      circleType,
    });
  }, [params, mode, circleType]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<ConicAsymStudyMode, string[]> = {
      asymVieta: ["a", "b", "x0", "m"],
      hiddenCircle:
        circleType === "fixedAngle"
          ? ["halfSpan", "thetaDeg", "angleDeg"]
          : circleType === "distSumSq"
            ? ["halfSpan", "sqSumK", "angleDeg"]
            : ["halfSpan", "angleDeg"],
      symmetryShortest: ["lineK", "lineB", "probePx"],
    };
    return keysByMode[mode].map((key) => {
      const meta = paramMeta[key];
      let minVal = meta.min;
      if (mode === "hiddenCircle" && key === "sqSumK") {
        minVal = 2 * params.halfSpan * params.halfSpan + 2;
      }
      return {
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: Math.max(minVal, params[key as keyof ConicAsymParams]),
        min: minVal,
        max: meta.max,
        step: meta.step ?? 0.1,
        unit: meta.unit,
        group: meta.group,
        marks: meta.marks,
        importance: meta.importance,
      };
    });
  }, [mode, circleType, params]);

  const headerFormula = useMemo(() => {
    if (mode === "asymVieta") {
      const res = calcAsymVieta(params.a, params.b, params.x0, params.m);
      return `x = \\color{${MATH_COLORS.paramPrimary}}{${formatMathNumber(res.m, 1)}}y + ${formatMathNumber(res.x0, 1)} \\implies x_T \\equiv \\frac{a^2}{x_0} = ${formatMathNumber(res.fixedLineX, 2)}`;
    }
    if (mode === "hiddenCircle") {
      const res = calcHiddenCircle(
        circleType,
        params.halfSpan,
        circleType === "fixedAngle" ? params.thetaDeg : params.sqSumK,
        params.angleDeg,
      );
      return `O(${formatMathNumber(res.center.x, 1)}, ${formatMathNumber(res.center.y, 2)}), \\quad R = ${formatMathNumber(res.radius, 2)}`;
    }
    const res = calcSymmetryShortest(
      params.lineK,
      params.lineB,
      params.probePx,
    );
    return `|PA|+|PB| = ${formatMathNumber(res.currentSum, 2)} \\ge ${res.isSameSide ? "|A'B|" : "|AB|"} = ${formatMathNumber(res.minSum, 2)}`;
  }, [mode, circleType, params]);

  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (mode === "asymVieta") {
      return [
        { label: "椭圆轨迹", color: MATH_COLORS.ellipse, style: "solid" },
        {
          label: "过定点动直线 AB",
          color: MATH_COLORS.paramPrimary,
          style: "solid",
        },
        {
          label: "顶点连线 PA / QB",
          color: MATH_COLORS.paramSecondary,
          style: "solid",
        },
        {
          label: "交点定直线 x=a²/x0",
          color: MATH_COLORS.inequality,
          style: "dashed",
        },
      ];
    }
    if (mode === "hiddenCircle") {
      return [
        { label: "隐圆标准轨迹", color: MATH_COLORS.circle, style: "dashed" },
        { label: "拖拽动点 P", color: MATH_COLORS.inequality, style: "point" },
        {
          label: "两定点连线 PA / PB",
          color: MATH_COLORS.paramSecondary,
          style: "solid",
        },
      ];
    }
    return [
      {
        label: "对称轴 y = kx + b",
        color: MATH_COLORS.function,
        style: "solid",
      },
      {
        label: "当前折线 PA + PB",
        color: MATH_COLORS.paramPrimary,
        style: "solid",
      },
      {
        label: "拉直最短下界 A'B",
        color: MATH_COLORS.inequality,
        style: "dashed",
      },
      {
        label: "轴上拖拽动点 P",
        color: MATH_COLORS.paramTertiary,
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
          <LeftPanelSection title="解析几何高阶模型">
            <TabSwitcher
              tabs={[
                { key: "asymVieta", label: "非对称韦达" },
                { key: "hiddenCircle", label: "隐圆模型" },
                { key: "symmetryShortest", label: "对称最值" },
              ]}
              value={mode}
              onChange={handleModeChange}
              layout="horizontal"
              size="compact"
            />
          </LeftPanelSection>

          <LeftPanelSection title="典型题型情景">
            <SelectGrid
              items={scenarioGridItems}
              value={activeScenario}
              onChange={handleScenarioChange}
              columns={2}
            />
          </LeftPanelSection>

          {mode === "asymVieta" && (
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
          )}

          <LeftPanelSection title="参数调控">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
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
              <ConicAsymmetricVietaScene
                mode={mode}
                circleType={circleType}
                params={params}
                scale={scale}
                vp={vp}
                activeStep={activeStep}
                isStepFocusOn={isStepFocusOn}
                fontScale={canvasSize.font}
                onParamChange={handleParamChange}
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
          focusStep={
            mode === "asymVieta" && isStepFocusOn ? activeStep : undefined
          }
          focusTarget="reasoning"
        />
      }
    />
  );
};

export default ConicAsymmetricVietaAnimation;
