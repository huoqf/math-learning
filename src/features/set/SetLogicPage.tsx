import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { SetScene } from "./components/SetScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/set";

export function SetLogicPage() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  const mathData = useMemo(
    () => buildMathQuantities("anim-logic-conditions", params, {}),
    [params],
  );

  const formulaLatex =
    "p: x \\in \\color{#EF4444}{A}, \\quad q: x \\in \\color{#D97706}{B} \\quad (p \\implies q \\iff \\color{#EF4444}{A} \\subseteq \\color{#D97706}{B})";

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["xA", "yA", "rA", "xB", "yB", "rB", "xP", "yP"];
    return keys
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
  }, [params]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="充分必要条件"
            subtitle="探索集合包含与逻辑蕴含"
          >
            <div className="text-sm text-neutral-600 mb-3 p-3 bg-neutral-50 rounded-lg">
              <p className="mb-1">
                <strong>p ⇒ q</strong>（p 是 q 的充分条件）
              </p>
              <p className="mb-1">
                <strong>q ⇒ p</strong>（p 是 q 的必要条件）
              </p>
              <p>
                <strong>A ⊆ B</strong> ⟺ x∈A ⇒ x∈B
              </p>
            </div>
          </LeftPanelSection>

          <LeftPanelSection
            title="参数调节与位置控制"
            subtitle="可拖动图形点或调节参数"
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
        <div className="w-full h-full relative flex flex-col bg-white">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <SetScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              vennOp="intersection"
              showLogic={true}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="逻辑条件看板"
        />
      }
    />
  );
}
