import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  KatexFormula,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { StatPercentileScene } from "./components/StatPercentileScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/statPercentile";

export function StatPercentileAnimation() {
  // 探究模式：'histogram' | 'cumulative' | 'stratified'
  const [studyMode, setStudyMode] = useState<
    "histogram" | "cumulative" | "stratified"
  >("histogram");

  // 参数状态保存
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 坐标系比例尺：三模式统一使用 xRange [42, 108]，横轴位置 100% 重合
  const scale = useSceneScale({
    vp,
    xRange: [42, 108],
    yRange:
      studyMode === "stratified"
        ? [-0.15, 1.15]
        : studyMode === "cumulative"
          ? [-0.12, 1.15]
          : [-0.007, 0.054],
    keepAspectRatio: false,
  });

  // 数学量看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-stat-percentile", params, { studyMode });
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
    setParams({ ...defaultParams });
  };

  // 根据当前 activeMode 过滤声明式参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      histogram: ["percentileP", "shift"],
      cumulative: ["percentileP", "shift"],
      stratified: [
        "sampleN",
        "N1",
        "N2",
        "N3",
        "mean1",
        "mean2",
        "mean3",
        "var1",
        "var2",
        "var3",
      ],
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
          step: meta.step ?? 1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "histogram") return "直方图与数字特征看板";
    if (studyMode === "cumulative") return "百分位数与累积频率看板";
    return "分层抽样与总体方差看板";
  }, [studyMode]);

  // 顶部悬浮公式
  const topFormulaLatex = useMemo(() => {
    if (studyMode === "histogram") {
      return "\\text{矩形面积 } f_i = h_i \\cdot d, \\quad \\bar{x} = \\sum x_{\\text{mid}, i} \\cdot f_i";
    }
    if (studyMode === "cumulative") {
      return `y_p = a + \\frac{\\color{${MATH_COLORS.paramPrimary}}{${params.percentileP}\\% - F_{\\text{prev}}}}{h}`;
    }
    return "s^2 = \\sum w_i \\left[ s_i^2 + (\\bar{x}_i - \\bar{x})^2 \\right]";
  }, [studyMode, params.percentileP]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection title="研究模式" subtitle="选择统计分析探究专题">
            <SelectGrid
              items={[
                { key: "histogram", label: "直方图与数字特征" },
                { key: "cumulative", label: "百分位数线性插值" },
                {
                  key: "stratified",
                  label: "分层抽样与总方差",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={(k) =>
                setStudyMode(k as "histogram" | "cumulative" | "stratified")
              }
              variant="filled"
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection title="参数调节" subtitle="拖动滑块改变统计参数">
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
          {/* 顶部悬浮 Katex 公式 */}
          <div className="absolute top-3 left-16 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={topFormulaLatex} mode="inline" />
          </div>

          {/* SVG 画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <StatPercentileScene
              params={
                params as {
                  percentileP: number;
                  shift: number;
                  sampleN: number;
                  N1: number;
                  N2: number;
                  N3: number;
                  mean1: number;
                  mean2: number;
                  mean3: number;
                  var1: number;
                  var2: number;
                  var3: number;
                }
              }
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

export default StatPercentileAnimation;
