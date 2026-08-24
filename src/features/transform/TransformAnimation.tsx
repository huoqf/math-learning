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
  TipCard,
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

  // 动态教学提示配置
  const tipConfig = useMemo(() => {
    const { h, k, A, omega } = params;
    if (foldMode === "global") {
      return {
        variant: "warning" as const,
        badge: "高考必考 · 整体绝对值 y = |f(x)| 翻折变换",
        condition:
          "保留 x 轴及上方图象不动，将 x 轴下方的图象以 x 轴为对称轴翻折到上方。",
        question:
          "分析下翻上后函数值非负 (y ≥ 0) 的值域截断与零点处尖点导数不存在特征。",
      };
    } else if (foldMode === "input") {
      return {
        variant: "info" as const,
        badge: "高考必考 · 自变量绝对值 y = f(|x|) 偶函数化",
        condition:
          "保留 y 轴及右侧 (x ≥ 0) 图象不动，擦除左侧并关于 y 轴对称复制到左侧。",
        question:
          "验证变换后的函数满足 f(|-x|) = f(|x|)，恒为偶函数且图象关于 y 轴对称。",
      };
    } else {
      const hDesc =
        h >= 0 ? `右移 ${h.toFixed(1)}` : `左移 ${Math.abs(h).toFixed(1)}`;
      const kDesc =
        k >= 0 ? `上移 ${k.toFixed(1)}` : `下移 ${Math.abs(k).toFixed(1)}`;
      return {
        variant: "primary" as const,
        badge: "高考基石 · 四维几何平移与伸缩法则",
        condition: `基准函数经历水平平移 h = ${h.toFixed(1)} (${hDesc})、竖直平移 k = ${k.toFixed(1)} (${kDesc})，横向伸缩 ω = ${omega.toFixed(1)}，纵向拉伸 A = ${A.toFixed(1)}。`,
        question:
          "遵循“左加右减，上加下减，横缩纵扩”四步口诀，快速推导任意变换后的函数解析式与特征点迁移。",
      };
    }
  }, [foldMode, params.h, params.k, params.A, params.omega]);

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

          {/* 教学导引与题设背景 */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【初始条件】
                  </span>
                  <span className="text-neutral-600">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【核心设问】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
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
