import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
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
        return `\\color{${MATH_COLORS.paramPrimary}}{A} \\cap \\color{${MATH_COLORS.paramSecondary}}{B} = \\{ x \\mid x \\in \\color{${MATH_COLORS.paramPrimary}}{A} \\land x \\in \\color{${MATH_COLORS.paramSecondary}}{B} \\}`;
      case "union":
        return `\\color{${MATH_COLORS.paramPrimary}}{A} \\cup \\color{${MATH_COLORS.paramSecondary}}{B} = \\{ x \\mid x \\in \\color{${MATH_COLORS.paramPrimary}}{A} \\lor x \\in \\color{${MATH_COLORS.paramSecondary}}{B} \\}`;
      case "complement_A":
        return `\\complement_U \\color{${MATH_COLORS.paramPrimary}}{A} = \\{ x \\mid x \\in U \\land x \\notin \\color{${MATH_COLORS.paramPrimary}}{A} \\}`;
      case "difference_A_B":
        return `\\color{${MATH_COLORS.paramPrimary}}{A} \\setminus \\color{${MATH_COLORS.paramSecondary}}{B} = \\{ x \\mid x \\in \\color{${MATH_COLORS.paramPrimary}}{A} \\land x \\notin \\color{${MATH_COLORS.paramSecondary}}{B} \\}`;
      default:
        return `\\color{${MATH_COLORS.paramPrimary}}{A} \\cap \\color{${MATH_COLORS.paramSecondary}}{B}`;
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
          <LeftPanelSection title="集合运算">
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
                  集合运算与 Venn 图：
                </div>
                <div className="leading-relaxed text-neutral-600">
                  通过拖动圆心 <KatexFormula formula="O_A, O_B" mode="inline" />{" "}
                  或样本点 <KatexFormula formula="P" mode="inline" />
                  ，直观理解交集、并集、补集及差集的空间阴影覆盖与元素归属判定。
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
