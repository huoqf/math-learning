import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { SequenceScene } from "./components/SequenceScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/sequence";

type RecurrenceModel =
  | "linear-pan"
  | "accumulation"
  | "multiplication"
  | "reciprocal"
  | "second-order";

const Y_RANGES: Record<RecurrenceModel, [number, number]> = {
  "linear-pan": [-10, 30],
  accumulation: [-5, 45],
  multiplication: [-1, 10],
  reciprocal: [-5, 15],
  "second-order": [-10, 50],
};

const KEYS_BY_MODEL: Record<RecurrenceModel, string[]> = {
  "linear-pan": ["a1", "p_rec", "q_rec", "N"],
  accumulation: ["a1", "d", "N"],
  multiplication: ["a1", "N"],
  reciprocal: ["a1", "coefA", "coefB", "coefC", "N"],
  "second-order": ["a1", "a2", "p_rec", "q_rec", "N"],
};

export function RecurrencePage() {
  const [recurrenceModelType, setRecurrenceModelType] =
    useState<RecurrenceModel>("linear-pan");
  const [highlightN, setHighlightN] = useState<number>(1);
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({
    vp,
    xRange: [-1, 16.5],
    yRange: Y_RANGES[recurrenceModelType],
  });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-sequence", params, {
        activeMode: "recurrence",
        geometricViewType: "points",
        modelType: "arith-geo",
        subModel: recurrenceModelType,
      }),
    [params, recurrenceModelType],
  );

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return KEYS_BY_MODEL[recurrenceModelType]
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, recurrenceModelType]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="递推构造 5 大核心模型"
            subtitle="涵盖高考求通项待定系数与构造法"
          >
            <SelectGrid
              items={[
                {
                  key: "linear-pan",
                  label: "待定系数/一阶线性",
                  formula: "a_{n+1}=pa_n+q",
                  fullWidth: true,
                },
                {
                  key: "accumulation",
                  label: "累加法求通项",
                  formula: "a_{n+1}=a_n+f(n)",
                  fullWidth: true,
                },
                {
                  key: "multiplication",
                  label: "累乘法求通项",
                  formula: "a_{n+1}=f(n)a_n",
                  fullWidth: true,
                },
                {
                  key: "reciprocal",
                  label: "倒数构造法",
                  formula: "a_{n+1}=\\frac{Aa_n}{Ba_n+C}",
                  fullWidth: true,
                },
                {
                  key: "second-order",
                  label: "二阶特征根法",
                  formula: "a_{n+2}=pa_{n+1}+qa_n",
                  fullWidth: true,
                },
              ]}
              value={recurrenceModelType}
              onChange={(val) => setRecurrenceModelType(val as RecurrenceModel)}
            />
          </LeftPanelSection>
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块实时观察几何变化"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <AnimationSvgCanvas
          containerRef={containerRef}
          transform={vp.transform}
        >
          <SequenceScene
            params={params}
            scale={scale}
            vp={vp}
            fontScale={canvasSize.font}
            activeMode="recurrence"
            recurrenceModelType={recurrenceModelType}
            highlightN={highlightN}
            onSelectN={setHighlightN}
          />
        </AnimationSvgCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="递推与构造法看板"
        />
      }
    />
  );
}
