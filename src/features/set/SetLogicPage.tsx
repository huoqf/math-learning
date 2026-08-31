import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
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

  const formulaLatex = `p: x \\in \\color{${MATH_COLORS.paramPrimary}}{A}, \\quad q: x \\in \\color{${MATH_COLORS.paramSecondary}}{B} \\quad (p \\implies q \\iff \\color{${MATH_COLORS.paramPrimary}}{A} \\subseteq \\color{${MATH_COLORS.paramSecondary}}{B})`;

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
          <LeftPanelSection title="参数调节与位置控制">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>

          <LeftPanelSection title="教学导引" compact>
            <TipCard variant="primary">
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-neutral-700">
                  充分必要条件判定四步法：
                </div>
                <div className="leading-relaxed text-neutral-600">
                  ① 明确条件 <KatexFormula formula="p" mode="inline" /> 与结论{" "}
                  <KatexFormula formula="q" mode="inline" />
                  ；② 确定对应集合{" "}
                  <KatexFormula
                    formula="A=\{x \mid p\}, B=\{x \mid q\}"
                    mode="inline"
                  />
                  ；③ 判断集合包含关系（
                  <KatexFormula
                    formula="A \subseteq B \iff p \implies q"
                    mode="inline"
                  />
                  ）；④ “小范围推大范围”，得出充要结论。
                </div>
              </div>
            </TipCard>
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
