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
import { InequalityBasicScene } from "./components/InequalityBasicScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/inequalityBasic";

export function InequalityBasicAnimation() {
  // 研究模式：'semicircle' (半圆证明) | 'square' (赵爽弦图) | 'nike' (最值应用)
  const [studyMode, setStudyMode] = useState<"semicircle" | "square" | "nike">(
    "semicircle",
  );

  // 1. 本地状态 a, b, k
  const [params, setParams] = useState(() => ({
    a: defaultParams.a,
    b: defaultParams.b,
    k: defaultParams.k,
  }));

  // 2. 视口尺寸测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 3. 根据研究模式动态自适应 Y 轴范围，确保几何图形与标注完整显示不被裁切
  const yRange = useMemo<[number, number]>(() => {
    if (studyMode === "semicircle") return [-2.2, 5.8];
    if (studyMode === "square") return [-4.8, 4.8];
    return [-1.5, 6.5];
  }, [studyMode]);

  // 构建直角坐标系比例尺
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange,
  });

  // 4. 数学量看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-ineq-basic", params, { studyMode });
  }, [params, studyMode]);

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({
      a: defaultParams.a,
      b: defaultParams.b,
      k: defaultParams.k,
    });
  };

  // 根据模式过滤参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      semicircle: ["a", "b"],
      square: ["a", "b"],
      nike: ["k", "a"],
    };
    const keys = keysByMode[studyMode] ?? ["a", "b"];
    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key as keyof typeof params] ?? meta.defaultValue ?? 0,
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

  // 三位一体公式渲染 (使用参数语义色着色)
  const topFormulaLatex = useMemo(() => {
    if (studyMode === "semicircle" || studyMode === "square") {
      const colorA = MATH_COLORS.paramPrimary;
      const colorB = MATH_COLORS.paramSecondary;
      return `\\frac{\\color{${colorA}}{a} + \\color{${colorB}}{b}}{2} \\ge \\sqrt{\\color{${colorA}}{a} \\color{${colorB}}{b}} \\quad (a, b > 0)`;
    } else {
      const colorK = MATH_COLORS.paramTertiary;
      return `x + \\frac{\\color{${colorK}}{k}}{x} \\ge 2\\sqrt{\\color{${colorK}}{k}} \\quad (x > 0)`;
    }
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection title="几何与应用场景" subtitle="切换均值证明模式">
            <SelectGrid
              items={[
                { key: "semicircle", label: "半圆四均值证明", fullWidth: true },
                { key: "square", label: "赵爽弦图面积法", fullWidth: true },
                { key: "nike", label: "对勾函数与最值", fullWidth: true },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as typeof studyMode)}
              columns={1}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection title="参数调节" subtitle="拖动滑块改变变量">
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
          {/* 顶部悬浮公式说明 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={topFormulaLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <InequalityBasicScene
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
          title="基本不等式看板"
        />
      }
    />
  );
}
