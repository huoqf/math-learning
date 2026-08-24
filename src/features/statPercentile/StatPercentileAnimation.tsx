import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  KatexFormula,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { StatPercentileScene } from "./components/StatPercentileScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  STAT_PRESETS,
} from "@/data/registries/statPercentile";

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

  // 载入预设场景（联动更新参数与探究模式）
  const handlePresetSelect = (presetKey: string) => {
    const preset = STAT_PRESETS.find((p) => p.key === presetKey);
    if (preset) {
      setParams((prev) => ({
        ...prev,
        ...preset.params,
      }));
      if (preset.mode) {
        setStudyMode(preset.mode);
      }
    }
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

  // 顶部悬浮公式（铁律 4C 色彩绑定）
  const topFormulaLatex = useMemo(() => {
    if (studyMode === "histogram") {
      return `\\text{矩形面积 } f_i = h_i \\cdot d, \\quad \\color{${MATH_COLORS.function}}{\\bar{x} = \\sum x_{\\text{mid}, i} \\cdot f_i}`;
    }
    if (studyMode === "cumulative") {
      return `y_p = a + \\frac{\\color{${MATH_COLORS.paramPrimary}}{${(params.percentileP / 100).toFixed(2)} - F_{\\text{prev}}}}{\\color{${MATH_COLORS.paramSecondary}}{h}}`;
    }
    return `s^2 = \\sum \\color{${MATH_COLORS.paramPrimary}}{w_i s_i^2} + \\sum \\color{${MATH_COLORS.paramSecondary}}{w_i (\\bar{x}_i - \\bar{x})^2}`;
  }, [studyMode, params.percentileP]);

  // 左屏教学提示与题设导引 (说明初始条件与核心设问)
  const tipConfig = useMemo(() => {
    if (studyMode === "histogram") {
      return {
        variant: "primary" as const,
        badge: "高考基础 · 直方图与数字特征",
        condition:
          "样本数据划分为若干区间，直方图矩形面积表示频率，总面积恒为 1。",
        question:
          "求解众数（最高矩形底边中点）、中位数（面积平分点）与平均数（各组中值加权平均）。",
      };
    }
    if (studyMode === "cumulative") {
      return {
        variant: "warning" as const,
        badge: "高考高频 · 百分位数与累积频率折线",
        condition: `样本容量按升序排列，给定目标分位数 p = ${params.percentileP ?? 75}%。`,
        question:
          "根据累积频率 S 型折线，求第 p 百分位数 yₚ 的精确线性插值坐标。",
      };
    }
    // stratified
    return {
      variant: "danger" as const,
      badge: "高考压轴 · 分层抽样与总方差分解",
      condition: `总体分为 3 层，各层容量为 N₁, N₂, N₃，层内均值与方差已知，按比例抽取样本容量 n = ${params.sampleN ?? 100}。`,
      question: "求解分层抽样总样本均值 x̄ 与总样本方差 s²。",
    };
  }, [studyMode, params.percentileP, params.sampleN]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section：单列 3 行布局，完整展示文字与描述 */}
          <LeftPanelSection title="研究模式" subtitle="选择统计分析探究专题">
            <SelectGrid
              columns={1}
              items={[
                {
                  key: "histogram",
                  label: "直方图与数字特征",
                  description: "众数、中位数、均值与物理力矩支点",
                },
                {
                  key: "cumulative",
                  label: "百分位数线性插值",
                  description: "S 型累积折线与面积补齐插值",
                },
                {
                  key: "stratified",
                  label: "分层抽样与总方差",
                  description: "各层高斯分布、离差拉扯与总方差分解",
                },
              ]}
              value={studyMode}
              onChange={(k) =>
                setStudyMode(k as "histogram" | "cumulative" | "stratified")
              }
              variant="filled"
            />
          </LeftPanelSection>

          {/* 高考经典题型预设 */}
          <LeftPanelSection
            title="典型高考情境"
            subtitle="一键载入高考经典分布数据"
          >
            <SelectGrid
              columns={1}
              items={STAT_PRESETS.map((p) => ({
                key: p.key,
                label: p.label,
                description: p.description,
              }))}
              value=""
              onChange={handlePresetSelect}
              variant="outline"
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
