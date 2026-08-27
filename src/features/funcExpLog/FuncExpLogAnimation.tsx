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
import { ExpLogScene } from "./components/ExpLogScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/funcExpLog";

export function FuncExpLogAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [funcType, setFuncType] = useState<
    "exponential" | "logarithmic" | "power"
  >("exponential");
  const [showInverse, setShowInverse] = useState(false);

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-func-explog", params, {
      subExpLog: funcType,
    });
  }, [params, funcType]);

  const formulaLatex = useMemo(() => {
    const aVal = (params.baseA ?? 2.0).toFixed(1);
    const alphaVal = (params.powerAlpha ?? 2.0).toFixed(1);
    if (funcType === "exponential") {
      return showInverse
        ? `y = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}^x \\iff x = \\log_{\\color{${MATH_COLORS.paramPrimary}}{${aVal}}} y`
        : `y = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}^x`;
    } else if (funcType === "logarithmic") {
      return showInverse
        ? `y = \\log_{\\color{${MATH_COLORS.paramPrimary}}{${aVal}}} x \\iff x = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}^y`
        : `y = \\log_{\\color{${MATH_COLORS.paramPrimary}}{${aVal}}} x`;
    } else {
      return `y = x^{\\color{${MATH_COLORS.paramPrimary}}{${alphaVal}}}`;
    }
  }, [funcType, showInverse, params.powerAlpha, params.baseA]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = funcType === "power" ? ["x0", "powerAlpha"] : ["x0", "baseA"];
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
  }, [params, funcType]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="函数选择" subtitle="指数、对数与幂函数">
            <SelectGrid
              items={[
                { key: "exponential", label: "y = aˣ", formula: "y=a^x" },
                {
                  key: "logarithmic",
                  label: "y = logₐx",
                  formula: "y=\\log_a x",
                },
                { key: "power", label: "y = xᵅ", formula: "y=x^{\\alpha}" },
              ]}
              value={funcType}
              onChange={(k) => setFuncType(k)}
              variant="outline"
              className="mb-4"
            />

            {/* 反函数对称关系：仅在指数或对数模式下可选 */}
            {(funcType === "exponential" || funcType === "logarithmic") && (
              <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showInverse}
                  onChange={(e) => setShowInverse(e.target.checked)}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                显示反函数对称 (y = x)
              </label>
            )}
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

          {/* 教学导引卡片 */}
          <LeftPanelSection title="教学导引" compact>
            <TipCard variant="primary">
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>
                  {funcType === "exponential"
                    ? "指数函数模型"
                    : funcType === "logarithmic"
                      ? "对数函数模型"
                      : "幂函数模型"}
                </span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed text-neutral-600">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【模型特征】
                  </span>
                  {funcType === "exponential"
                    ? "恒过定点 (0, 1)，以 x 轴为渐近线；底数 a > 1 增，0 < a < 1 减。"
                    : funcType === "logarithmic"
                      ? "恒过定点 (1, 0)，以 y 轴为渐近线；与同底指数函数关于 y = x 对称。"
                      : "恒过定点 (1, 1)；α > 0 过原点单调递增，α < 0 含双渐近线单调递减。"}
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
            <ExpLogScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              funcType={funcType}
              showInverse={showInverse}
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
          title="初等函数看板"
        />
      }
    />
  );
}
