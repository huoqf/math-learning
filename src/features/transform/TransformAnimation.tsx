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
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { TransformScene } from "./components/TransformScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/transform";
import type { BaseFnType, FoldMode } from "@/math/transform";

export function TransformAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [fnType, setFnType] = useState<BaseFnType>("quadratic");
  const [foldMode, setFoldMode] = useState<FoldMode>("none");

  // Step 1: 自适应视口
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
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-transform", params, { fnType, foldMode }),
    [params, fnType, foldMode],
  );

  // 动态拼装 KaTeX 颜色标记公式
  const formulaLatex = useMemo(() => {
    const hVal = (params.h ?? 1.0).toFixed(1);
    const kVal = (params.k ?? 0.5).toFixed(1);
    const aVal = (params.A ?? 1.5).toFixed(1);
    const wVal = (params.omega ?? 1.0).toFixed(1);

    let baseStr = "";
    switch (fnType) {
      case "quadratic":
        baseStr = `(${wVal}(x - \\color{${MATH_COLORS.paramPrimary}}{${hVal}}))^2`;
        break;
      case "sine":
        baseStr = `\\sin(${wVal}(x - \\color{${MATH_COLORS.paramPrimary}}{${hVal}}))`;
        break;
      case "cubic":
        baseStr = `(${wVal}(x - \\color{${MATH_COLORS.paramPrimary}}{${hVal}}))^3`;
        break;
      case "exp":
        baseStr = `2^{${wVal}(x - \\color{${MATH_COLORS.paramPrimary}}{${hVal}})}`;
        break;
    }

    let coreLatex = `\\color{${MATH_COLORS.paramPrimary}}{${aVal}} \\cdot ${baseStr} + \\color{${MATH_COLORS.paramSecondary}}{${kVal}}`;

    if (foldMode === "global") {
      return `y = \\left| ${coreLatex} \\right|`;
    } else if (foldMode === "input") {
      return `y = f(|x|) = T\\left[ f(|x|) \\right]`;
    }
    return `y = ${coreLatex}`;
  }, [fnType, foldMode, params.h, params.k, params.A, params.omega]);

  // Step 4: 声明式参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return Object.keys(paramMeta).map((key) => {
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
            title="基准函数与变换法则"
            subtitle="选择基准函数与绝对值翻折模式"
          >
            {/* 基准函数选择器 */}
            <SelectGrid
              items={[
                { key: "quadratic", label: "y = x²", formula: "y = x^2" },
                { key: "sine", label: "y = sin x", formula: "y = \\sin x" },
                { key: "cubic", label: "y = x³", formula: "y = x^3" },
                { key: "exp", label: "y = 2^x", formula: "y = 2^x" },
              ]}
              value={fnType}
              onChange={(k) => setFnType(k)}
              variant="outline"
              className="mb-3"
            />

            {/* 翻折模式选择 */}
            <div className="text-[11px] font-semibold text-neutral-500 mb-1">
              绝对值翻折模式：
            </div>
            <TabSwitcher
              tabs={[
                { key: "none", label: "无翻折", formula: "\\text{无翻折}" },
                {
                  key: "global",
                  label: "|f(x)| 整体",
                  formula: "|f(x)| \\text{ 整体}",
                },
                {
                  key: "input",
                  label: "f(|x|) 自变量",
                  formula: "f(|x|) \\text{ 自变量}",
                },
              ]}
              value={foldMode}
              onChange={(k) => setFoldMode(k)}
              className="mb-4"
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="平移与伸缩参数"
            subtitle="拖动滑块或拖拽中屏控制点"
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
          {/* Katex 公式浮标 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TransformScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              fnType={fnType}
              foldMode={foldMode}
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
          title="图象变换看板"
        />
      }
    />
  );
}
