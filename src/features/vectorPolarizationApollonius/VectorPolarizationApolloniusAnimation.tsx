/**
 * src/features/vectorPolarizationApollonius/VectorPolarizationApolloniusAnimation.tsx
 * 向量极化恒等式与阿波罗尼斯圆动画编排主页面
 */

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
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  type VectorPolarizationApolloniusParams,
} from "@/data/registries/vectorPolarizationApollonius";
import { VectorPolarizationApolloniusScene } from "./components/VectorPolarizationApolloniusScene";

export function VectorPolarizationApolloniusAnimation() {
  // 研究模式：'polarization' | 'apollonius' | 'combined'
  const [studyMode, setStudyMode] = useState<
    "polarization" | "apollonius" | "combined"
  >("polarization");

  // 本地参数状态
  const [params, setParams] = useState<VectorPolarizationApolloniusParams>(
    () => ({ ...defaultParams }),
  );

  // 视口尺寸测量与自适应 Hook
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 数学坐标系 Scale: X [-8, 12], Y [-6.5, 6.5]
  const scale = useSceneScale({
    vp,
    xRange: [-8, 12],
    yRange: [-6.5, 6.5],
  });

  // 统一构建右屏看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities(
      "anim-vector-polarization-apollonius",
      params as unknown as Record<string, number>,
      { studyMode },
    );
  }, [params, studyMode]);

  // 参数更新
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  // 声明式参数配置 (按模式动态过滤参数，铁律 3 & 铁律 8)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<
      string,
      (keyof VectorPolarizationApolloniusParams)[]
    > = {
      polarization: ["bcLength", "pointX", "pointY"],
      apollonius: ["bcLength", "lambda", "pointAngle"],
      combined: ["bcLength", "lambda", "pointAngle"],
    };

    const activeKeys = keysByMode[studyMode] ?? Object.keys(paramMeta);

    return activeKeys.map((key) => {
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
  }, [params, studyMode]);

  // 悬浮公式动态生成（三位一体色彩绑定，铁律 4C）
  const formulaLatex = useMemo(() => {
    if (studyMode === "polarization") {
      return `\\vec{AB} \\cdot \\vec{AC} = \\color{${MATH_COLORS.paramPrimary}}{\\|\\vec{AM}\\|^2} - \\color{${MATH_COLORS.paramSecondary}}{\\|\\vec{BM}\\|^2}`;
    }
    if (studyMode === "apollonius") {
      return `\\frac{|PA|}{|PB|} = \\color{${MATH_COLORS.paramPrimary}}{\\lambda} \\quad (\\text{轨迹为阿波罗尼斯圆})`;
    }
    return `\\vec{PA} \\cdot \\vec{PB} = \\color{${MATH_COLORS.paramPrimary}}{\\|\\vec{PM}\\|^2} - \\color{${MATH_COLORS.paramSecondary}}{\\|\\vec{MB}\\|^2}`;
  }, [studyMode]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "polarization") return "向量极化恒等式看板";
    if (studyMode === "apollonius") return "阿波罗尼斯圆轨迹看板";
    return "极化恒等式 × 阿圆最值压轴看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模式选择 Section */}
          <LeftPanelSection title="研究模式" subtitle="选择数形结合探讨维度">
            <SelectGrid
              items={[
                {
                  key: "polarization",
                  label: "向量极化恒等式",
                  formula: "\\vec{a} \\cdot \\vec{b}",
                },
                {
                  key: "apollonius",
                  label: "阿波罗尼斯圆",
                  formula: "\\frac{|PA|}{|PB|}=\\lambda",
                },
                {
                  key: "combined",
                  label: "新高考压轴最值模型",
                  formula: "\\min / \\max (\\vec{PA} \\cdot \\vec{PB})",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as typeof studyMode)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 2. 参数调节 Section */}
          <LeftPanelSection
            title="参数控制台"
            subtitle="拖动滑块或画布控制点探究规律"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 中屏顶部悬浮 LaTeX 公式 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <VectorPolarizationApolloniusScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
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
          title={panelTitle}
        />
      }
    />
  );
}
