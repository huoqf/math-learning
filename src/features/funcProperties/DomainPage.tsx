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

const FORMULA_MAP: Record<FnType, string> = {
  cubic: "f(x) = x^3 \\quad (D = \\mathbb{R}, \\ R = \\mathbb{R})",
  quadratic: "f(x) = x^2 \\quad (D = \\mathbb{R}, \\ R = [0, +\\infty))",
  abs: "f(x) = |x| \\quad (D = \\mathbb{R}, \\ R = [0, +\\infty))",
  reciprocal:
    "f(x) = \\frac{1}{x} \\quad (D = (-\\infty, 0) \\cup (0, +\\infty))",
  sin: "f(x) = \\sin x \\quad (D = \\mathbb{R}, \\ R = [-1, 1])",
};

export function DomainPage() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [fnType, setFnType] = useState<FnType>("cubic");

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-properties", params, {
        mode: "domain",
        fnType,
      }),
    [params, fnType],
  );

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return ["x0"]
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
            subtitle="切换观察不同函数的定义域与值域"
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
            subtitle="定义域与值域探索要点"
          >
            <TipCard variant="info">
              <p className="font-bold mb-1">概念与定义域观察要点：</p>
              <p>
                1. <b>定义域 D</b>：允许取值的自变量集合（X 轴淡阴影区）。
              </p>
              <p>
                2. <b>值域 R</b>：所有函数值 f(x) 的集合（Y 轴淡阴影区）。
              </p>
              <p>
                3. <b>拖动验证</b>：拖动滑块 x₀。切换到 y = 1/x 试着拖动到 x₀ =
                0，观察无定义点警示。
              </p>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={FORMULA_MAP[fnType]} mode="inline" />
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
              mode="domain"
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
          title="定义域与值域看板"
        />
      }
    />
  );
}
