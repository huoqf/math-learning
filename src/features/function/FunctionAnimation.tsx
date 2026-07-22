import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
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
            <TabSwitcher
              tabs={[
                { key: "properties", label: "基本性质" },
                { key: "explog", label: "指对幂反函数" },
                { key: "zero", label: "零点二分法" },
              ]}
              value={activeMode}
              onChange={(k) => setActiveMode(k as any)}
              className="mb-3"
            />

            {/* 基本性质模式下：切换基准函数 */}
            {activeMode === "properties" && (
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
                ]}
                value={fnType}
                onChange={(k) => setFnType(k as any)}
                variant="outline"
                className="mb-4"
              />
            )}

            {/* 指对数模式下：切换子类型 */}
            {activeMode === "explog" && (
              <SelectGrid
                items={[
                  { key: "explog", label: "指对数与反函数" },
                  { key: "power", label: "y = x^α", formula: "y=x^{\\alpha}" },
                ]}
                value={subExpLog}
                onChange={(k) => setSubExpLog(k as any)}
                variant="outline"
                className="mb-4"
              />
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
