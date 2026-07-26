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
import { CANVAS_PRESETS } from "@/theme";
import { PropertiesScene } from "./components/PropertiesScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/funcProperties";

type FnType = "cubic" | "quadratic" | "abs" | "reciprocal" | "sin";

export function SymmetryPage() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [fnType, setFnType] = useState<FnType>("cubic");

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-properties", params, {
        mode: "symmetry",
        fnType,
      }),
    [params, fnType],
  );

  const formulaLatex = useMemo(() => {
    const axisA = (params.axisA ?? 0).toFixed(1);
    const axisB = (params.axisB ?? 2).toFixed(1);
    const dist = Math.abs((params.axisB ?? 2) - (params.axisA ?? 0));
    const period = (2 * dist).toFixed(1);
    return `x = ${axisA}, \\ x = ${axisB} \\text{ 对称 } \\Rightarrow T = 2|a - b| = ${period}`;
  }, [params]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return ["axisA", "axisB"]
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
            title="基准函数选择"
            subtitle="切换观察不同函数的对称性"
          >
            <SelectGrid
              items={[
                { key: "cubic", label: "y = x³", formula: "y=x^3" },
                { key: "quadratic", label: "y = x²", formula: "y=x^2" },
                { key: "abs", label: "y = |x|", formula: "y=|x|" },
                {
                  key: "reciprocal",
                  label: "y = 1/x",
                  formula: "y=\\frac{1}{x}",
                },
                { key: "sin", label: "y = sin x", formula: "y=\\sin x" },
              ]}
              value={fnType}
              onChange={(k) => setFnType(k)}
              variant="outline"
              className="mb-4"
            />
          </LeftPanelSection>
          <LeftPanelSection
            title="参数调节"
            subtitle="调节参数观察曲线与几何演变"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>
          <LeftPanelSection
            title="观察与操作指引"
            subtitle="对称与周期性探索要点"
          >
            <TipCard variant="primary">
              <p className="font-bold mb-1">对称与周期性观察要点：</p>
              <p>
                1. <b>双对称轴</b>：拖动 a, b 控制红/橙两条虚线对称轴 x = a 与 x
                = b。
              </p>
              <p>
                2. <b>导出周期</b>
                ：当图象关于两条直线均对称时，两次折叠形成周期循环，周期长度正好等于{" "}
                <b>两倍轴距 T = 2|a - b|</b>。
              </p>
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
            <PropertiesScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              fnType={fnType}
              mode="symmetry"
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
          title="对称与周期看板"
        />
      }
    />
  );
}
