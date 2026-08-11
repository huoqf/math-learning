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
import { VectorDotProductScene } from "./components/VectorDotProductScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/vectorDotProduct";
import { computeVectorDotProduct } from "@/math/vectorDotProduct";

export function VectorDotProductAnimation() {
  // 研究模式：'defProj' | 'properties' | 'polarization'
  const [studyMode, setStudyMode] = useState<
    "defProj" | "properties" | "polarization"
  >("defProj");

  // 本地参数状态 (xa, ya, xb, yb)
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 直角坐标系比例尺：数学范围 X [-6, 6]，Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 右屏看板数据构建
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-vector-dot-product", params, {
      studyMode,
    });
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
    setParams({
      ...defaultParams,
    });
  };

  // 左屏 ParamControl 参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return Object.entries(paramMeta).map(([key, meta]) => ({
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
    }));
  }, [params]);

  // 计算中屏顶端悬浮的 KaTeX 动态公式
  const topFormulaLatex = useMemo(() => {
    const mathRes = computeVectorDotProduct(params);
    const {
      a,
      b,
      normA,
      normB,
      dotProduct,
      cosTheta,
      scalarProjBtoA,
      polarizationVal,
    } = mathRes;

    if (studyMode === "defProj") {
      return `\\vec{a} \\cdot \\vec{b} = |\\vec{a}||\\vec{b}|\\cos\\theta = ${normA.toFixed(1)} \\times ${normB.toFixed(1)} \\times ${cosTheta.toFixed(2)} = \\mathbf{${dotProduct.toFixed(2)}}, \\quad W_{\\vec{a}}(\\vec{b}) = \\mathbf{${scalarProjBtoA.toFixed(2)}}`;
    } else if (studyMode === "properties") {
      return `\\vec{a} \\cdot \\vec{b} = x_1 x_2 + y_1 y_2 = (${a.x.toFixed(1)})(${b.x.toFixed(1)}) + (${a.y.toFixed(1)})(${b.y.toFixed(1)}) = \\mathbf{${dotProduct.toFixed(2)}}`;
    } else {
      return `\\vec{a} \\cdot \\vec{b} = \\frac{1}{4}(|\\vec{a}+\\vec{b}|^2 - |\\vec{a}-\\vec{b}|^2) = |\\vec{OM}|^2 - |\\vec{MB}|^2 = \\mathbf{${polarizationVal.toFixed(2)}}`;
    }
  }, [params, studyMode]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "defProj") return "数量积与几何投影看板";
    if (studyMode === "properties") return "坐标运算与模长垂直看板";
    return "极化恒等式与中点公式看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection
            title="研究模式"
            subtitle="选择平面向量数量积研讨主题"
          >
            <SelectGrid
              items={[
                { key: "defProj", label: "几何定义与投影" },
                { key: "properties", label: "坐标与模长垂直" },
                { key: "polarization", label: "极化恒等式 (高考极值)" },
              ]}
              value={studyMode}
              onChange={(k) =>
                setStudyMode(k as "defProj" | "properties" | "polarization")
              }
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection
            title="向量坐标调节"
            subtitle="拖动滑块改变向量 a 与 b 的分量"
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
          {/* 顶端 KaTeX 悬浮公式 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={topFormulaLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <VectorDotProductScene
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
