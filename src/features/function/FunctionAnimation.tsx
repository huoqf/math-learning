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
import { FunctionScene } from "./components/FunctionScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/function";

export function FunctionAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [activeMode, setActiveMode] = useState<
    "properties" | "explog" | "zero"
  >("properties");
  const [fnType, setFnType] = useState<
    "cubic" | "quadratic" | "abs" | "reciprocal"
  >("cubic");
  const [subExpLog, setSubExpLog] = useState<"explog" | "power">("explog");

  // Step 1: Viewport 自适应视口
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // Step 2: 比例尺
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // Step 3: 右屏数学数据组装
  const animId =
    activeMode === "properties"
      ? "anim-func-properties"
      : activeMode === "explog"
        ? "anim-func-explog"
        : "anim-func-zero";

  const mathData = useMemo(
    () => buildMathQuantities(animId, params, { fnType, subExpLog }),
    [animId, params, fnType, subExpLog],
  );

  // 动态公式
  const formulaLatex = useMemo(() => {
    if (activeMode === "properties") {
      switch (fnType) {
        case "cubic":
          return "f(x) = x^3 \\quad (\\text{奇函数: } f(-x) = -f(x))";
        case "quadratic":
          return "f(x) = x^2 \\quad (\\text{偶函数: } f(-x) = f(x))";
        case "abs":
          return "f(x) = |x| \\quad (\\text{偶函数: } f(-x) = f(x))";
        case "reciprocal":
          return "f(x) = \\frac{1}{x} \\quad (\\text{奇函数: } f(-x) = -f(x))";
        default:
          return "y = f(x)";
      }
    } else if (activeMode === "explog") {
      if (subExpLog === "power") {
        const aVal = (params.powerAlpha ?? 2.0).toFixed(1);
        return `y = x^{\\color{#EF4444}{${aVal}}}`;
      } else {
        const aVal = (params.baseA ?? 2.0).toFixed(1);
        return `y = \\color{#EF4444}{${aVal}}^x \\iff x = \\log_{\\color{#EF4444}{${aVal}}} y`;
      }
    } else {
      return "f(x) = x^3 - x - 2 = 0 \\quad (f(a) \\cdot f(b) < 0)";
    }
  }, [activeMode, fnType, subExpLog, params.powerAlpha, params.baseA]);

  // Step 4: 按模式过滤的声明式参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      properties: ["x0"],
      explog: subExpLog === "explog" ? ["x0", "baseA"] : ["x0", "powerAlpha"],
      zero: ["intervalM", "intervalN", "bisectionSteps"],
    };
    const keys = keysByMode[activeMode] ?? [];
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
          importance: meta.importance as any,
          marks: meta.marks,
        };
      });
  }, [params, activeMode, subExpLog]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="模式选择"
            subtitle="切换函数性质与基本初等函数"
          >
            <div className="flex bg-neutral-100 p-1 rounded-lg gap-1 mb-3">
              <button
                onClick={() => setActiveMode("properties")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  activeMode === "properties"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                基本性质
              </button>
              <button
                onClick={() => setActiveMode("explog")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  activeMode === "explog"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                指对幂反函数
              </button>
              <button
                onClick={() => setActiveMode("zero")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  activeMode === "zero"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                零点二分法
              </button>
            </div>

            {/* 基本性质模式下：切换基准函数 */}
            {activeMode === "properties" && (
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {[
                  { key: "cubic", formula: "y=x^3" },
                  { key: "quadratic", formula: "y=x^2" },
                  { key: "abs", formula: "y=|x|" },
                  { key: "reciprocal", formula: "y=\\frac{1}{x}" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFnType(item.key as any)}
                    className={`py-1 px-2 text-[11px] font-semibold border rounded-md transition-all ${
                      fnType === item.key
                        ? "border-primary-500 bg-primary-50 text-primary-700 font-bold"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                    }`}
                  >
                    <KatexFormula
                      formula={item.formula}
                      mode="inline"
                      className="!text-[11px] !my-0"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* 指对数模式下：切换子类型 */}
            {activeMode === "explog" && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSubExpLog("explog")}
                  className={`flex-1 py-1 text-xs font-semibold border rounded-md transition-all ${
                    subExpLog === "explog"
                      ? "border-primary-500 bg-primary-50 text-primary-700 font-bold"
                      : "border-neutral-200 bg-white text-neutral-600"
                  }`}
                >
                  指对数与反函数
                </button>
                <button
                  onClick={() => setSubExpLog("power")}
                  className={`flex-1 py-1 text-xs font-semibold border rounded-md transition-all ${
                    subExpLog === "power"
                      ? "border-primary-500 bg-primary-50 text-primary-700 font-bold"
                      : "border-neutral-200 bg-white text-neutral-600"
                  }`}
                >
                  <KatexFormula
                    formula={"y=x^{\\alpha}"}
                    mode="inline"
                    className="!text-xs !my-0"
                  />
                </button>
              </div>
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
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 公式悬浮浮标 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <FunctionScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              mode={activeMode}
              fnType={fnType}
              subExpLog={subExpLog}
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
          title={
            activeMode === "properties"
              ? "函数性质看板"
              : activeMode === "explog"
                ? "初等函数看板"
                : "零点逼近看板"
          }
        />
      }
    />
  );
}
