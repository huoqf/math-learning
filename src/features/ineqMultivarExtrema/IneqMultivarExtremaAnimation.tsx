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
import { useAnimationViewport, useScenario, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { formatMathNumber } from "@/utils/mathFormat";
import {
  defaultParams,
  paramMeta,
  INEQ_MULTIVAR_SCENARIOS,
  type IneqMultivarParams,
} from "@/data/registries/ineqMultivarExtrema";
import {
  calcElimMethod,
  calcHomogMethod,
  calcOneSubstitution,
  calcSumProdMethod,
  type MultivarIneqMode,
} from "@/math/ineqMultivarExtrema";
import { IneqMultivarExtremaScene } from "./components/IneqMultivarExtremaScene";

export const IneqMultivarExtremaAnimation: React.FC = () => {
  const [mode, setMode] = useState<MultivarIneqMode>("oneSub");
  const [activeScenario, setActiveScenario] = useState<string>("free");
  const [params, setParams] = useState<IneqMultivarParams>(() => ({
    ...defaultParams,
  }));

  const scenariosForMode = INEQ_MULTIVAR_SCENARIOS[mode];
  const { tipProps, selectScenario } = useScenario<string, IneqMultivarParams>({
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
    xRange: [-0.6, 6.4],
    yRange: mode === "homog" ? [-0.6, 8.4] : [-0.6, 5.4],
  });

  const handleModeChange = useCallback((nextMode: string) => {
    const m = nextMode as MultivarIneqMode;
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
    return buildMathQuantities("anim-ineq-multivar-extrema", params, { mode });
  }, [params, mode]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<MultivarIneqMode, string[]> = {
      oneSub: ["coefP", "coefQ", "numM", "numN", "constC", "probeX"],
      elim: ["elimA", "elimB", "constC", "probeX"],
      homog: ["homogK", "ratioT"],
      sumProd: ["constC", "probeX"],
    };
    return keysByMode[mode].map((key) => {
      const meta = paramMeta[key];
      return {
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key as keyof IneqMultivarParams],
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.5,
        group: meta.group,
        marks: meta.marks,
        importance: meta.importance,
      };
    });
  }, [mode, params]);

  const headerFormula = useMemo(() => {
    if (mode === "oneSub") {
      const res = calcOneSubstitution(
        params.coefP,
        params.coefQ,
        params.numM,
        params.numN,
        params.constC,
        params.probeX,
      );
      return `T = \\frac{${formatMathNumber(res.m, 1)}}{x} + \\frac{${formatMathNumber(res.n, 1)}}{y} \\ge ${formatMathNumber(res.minVal, 3)}`;
    }
    if (mode === "elim") {
      const res = calcElimMethod(
        params.elimA,
        params.elimB,
        params.constC,
        params.probeX,
      );
      return `(x+${formatMathNumber(res.b, 1)})(y+${formatMathNumber(res.a, 1)})=${formatMathNumber(res.kVal, 1)} \\implies (x+y)_{\\min}=${formatMathNumber(res.minSum, 3)}`;
    }
    if (mode === "homog") {
      const res = calcHomogMethod(params.homogK, params.ratioT);
      return `t + \\frac{${formatMathNumber(res.k, 1)}}{t} \\ge ${formatMathNumber(res.minVal, 3)}`;
    }
    const res = calcSumProdMethod(params.constC, params.probeX);
    return `x+y+xy=${formatMathNumber(res.c, 1)} \\implies x+y \\ge ${formatMathNumber(res.minSum, 3)},\\; xy \\le ${formatMathNumber(res.maxProd, 3)}`;
  }, [mode, params]);

  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (mode === "homog") {
      return [
        {
          label: "一元对勾函数图象",
          color: MATH_COLORS.function,
          style: "solid",
        },
        {
          label: "取等最小值点",
          color: MATH_COLORS.inequality,
          style: "point",
        },
        {
          label: "当前比值探测点",
          color: MATH_COLORS.paramSecondary,
          style: "point",
        },
      ];
    }
    return [
      { label: "条件约束曲线", color: MATH_COLORS.function, style: "solid" },
      {
        label: "目标最优等值线",
        color: MATH_COLORS.paramPrimary,
        style: "dashed",
      },
      { label: "取等最值点", color: MATH_COLORS.inequality, style: "point" },
      {
        label: "可行域试探点",
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
          <LeftPanelSection title="多元最值通法">
            <TabSwitcher
              tabs={[
                { key: "oneSub", label: "1的代换" },
                { key: "elim", label: "凑因式消元" },
                { key: "homog", label: "齐次比值" },
                { key: "sumProd", label: "和积互化" },
              ]}
              value={mode}
              onChange={handleModeChange}
              layout="horizontal"
              size="compact"
            />
          </LeftPanelSection>

          <LeftPanelSection title="课标与真题母题">
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
              <IneqMultivarExtremaScene
                mode={mode}
                params={params}
                scale={scale}
                fontScale={canvasSize.font}
              />
            </AnimationSvgCanvas>
            <SceneLegend items={legendItems} position="top-right" />
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

export default IneqMultivarExtremaAnimation;
