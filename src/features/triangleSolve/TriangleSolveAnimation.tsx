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
import { TriangleSolveScene } from "./components/TriangleSolveScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/triangleSolve";
import { solveTriangleFromSAS, solveSSA } from "@/math/triangleSolve";

export function TriangleSolveAnimation() {
  // 研究模式: 'sine' | 'ssa' | 'cosine' | 'area'
  const [studyMode, setStudyMode] = useState<"sine" | "ssa" | "cosine" | "area">(
    "sine"
  );

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 直角坐标系比例尺: X [-8, 8], Y [-6, 6]
  const scale = useSceneScale({
    vp,
    xRange: [-8, 8],
    yRange: [-6, 6],
  });

  // 数学量看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-triangle-solve", params, { studyMode });
  }, [params, studyMode]);

  // 参数变更
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

  // 按研究模式过滤参数项 (铁律要求)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      sine: ["angleA", "b", "c"],
      ssa: ["angleA", "b", "a"],
      cosine: ["angleA", "b", "c"],
      area: ["angleA", "b", "c"],
    };

    const keys = keysByMode[studyMode] ?? Object.keys(paramMeta);

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
          unit: meta.unit,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 悬浮公式动态生成
  const floatFormulaLatex = useMemo(() => {
    if (studyMode === "sine") {
      const sas = solveTriangleFromSAS(params.b, params.c, params.angleA);
      const ratio = sas.sineRatios.ratioA.toFixed(2);
      const r = sas.circumcircle.radius.toFixed(2);
      return `\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R \\approx ${ratio} = 2 \\times ${r}`;
    }
    if (studyMode === "ssa") {
      const ssa = solveSSA(params.a, params.b, params.angleA);
      const countStr = ssa.solutionCount;
      const hStr = ssa.h.toFixed(2);
      return `a = ${params.a.toFixed(1)}, \\; h = b \\sin A = ${hStr} \\implies \\text{解的个数: } ${countStr}`;
    }
    if (studyMode === "cosine") {
      const sas = solveTriangleFromSAS(params.b, params.c, params.angleA);
      const aVal = sas.sides.a.toFixed(2);
      const aSq = (sas.sides.a ** 2).toFixed(2);
      return `a^2 = b^2 + c^2 - 2bc \\cos A \\implies a^2 = ${aSq} \\quad (a = ${aVal})`;
    }
    // area
    const sas = solveTriangleFromSAS(params.b, params.c, params.angleA);
    const areaVal = sas.area.toFixed(2);
    return `S = \\frac{1}{2}bc \\sin A = r \\cdot p = ${areaVal}`;
  }, [params, studyMode]);

  const panelTitle = useMemo(() => {
    switch (studyMode) {
      case "sine":
        return "正弦定理与外接圆看板";
      case "ssa":
        return "SSA 边角条件与双解看板";
      case "cosine":
        return "余弦定理与投影定理看板";
      case "area":
        return "三角形面积与切接圆看板";
      default:
        return "解三角形指标看板";
    }
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection title="解三角形专题模式" subtitle="选择高考核心探讨机制">
            <SelectGrid
              items={[
                { key: "sine", label: "正弦定理与外接圆" },
                { key: "ssa", label: "SSA边角双解探究" },
                { key: "cosine", label: "余弦定理与勾股推广" },
                { key: "area", label: "面积与内切圆外接圆" },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as any)}
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection title="参数调节" subtitle="拖动滑块探索解的变化">
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
          {/* 顶端悬浮动态 KaTeX 公式 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={floatFormulaLatex} mode="inline" />
          </div>

          {/* SVG 画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TriangleSolveScene
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
