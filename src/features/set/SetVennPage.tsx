import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { SetScene } from "./components/SetScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/set";
import type { VennOpType } from "@/math/set";

export function SetVennPage() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [vennOp, setVennOp] = useState<VennOpType>("intersection");

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  const mathData = useMemo(
    () => buildMathQuantities("anim-set-venn", params, { vennOp }),
    [params, vennOp],
  );

  const formulaLatex = useMemo(() => {
    switch (vennOp) {
      case "intersection":
        return "\\color{#EF4444}{A} \\cap \\color{#D97706}{B} = \\{ x \\mid x \\in \\color{#EF4444}{A} \\land x \\in \\color{#D97706}{B} \\}";
      case "union":
        return "\\color{#EF4444}{A} \\cup \\color{#D97706}{B} = \\{ x \\mid x \\in \\color{#EF4444}{A} \\lor x \\in \\color{#D97706}{B} \\}";
      case "complement_A":
        return "\\complement_U \\color{#EF4444}{A} = \\{ x \\mid x \\in U \\land x \\notin \\color{#EF4444}{A} \\}";
      case "difference_A_B":
        return "\\color{#EF4444}{A} \\setminus \\color{#D97706}{B} = \\{ x \\mid x \\in \\color{#EF4444}{A} \\land x \\notin \\color{#D97706}{B} \\}";
      default:
        return "\\color{#EF4444}{A} \\cap \\color{#D97706}{B}";
    }
  }, [vennOp]);

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
          <LeftPanelSection title="集合运算" subtitle="选择 Venn 图运算类型">
            <SelectGrid
              items={[
                { key: "intersection", label: "A ∩ B", formula: "A \\cap B" },
                { key: "union", label: "A ∪ B", formula: "A \\cup B" },
                {
                  key: "complement_A",
                  label: "∁UA",
                  formula: "\\complement_U A",
                },
                {
                  key: "difference_A_B",
                  label: "A \\ B",
                  formula: "A \\setminus B",
                },
              ]}
              value={vennOp}
              onChange={(k) => setVennOp(k as VennOpType)}
              variant="outline"
              className="mb-4"
            />
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
              vennOp={vennOp}
              showLogic={false}
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
          title="集合运算看板"
        />
      }
    />
  );
}
