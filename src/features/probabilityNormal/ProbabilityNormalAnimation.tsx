import { useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  Toggle,
} from "@/components/UI";
import { HtmlTooltip } from "@/components/Math/SvgTooltip";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { ProbabilityNormalScene } from "./components/ProbabilityNormalScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/probabilityNormal";
import { calcIntervalProbability } from "@/math/probabilityNormal";

interface TooltipBinData {
  xStart: number;
  xEnd: number;
  mid: number;
  width: number;
  density: number;
  frequency: number;
  count: number;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  items: Array<{ label: string; value: string; color?: string }>;
}

export function ProbabilityNormalAnimation() {
  // 研究模式：'histogram' | 'normalFit' | 'sigmaRule'
  const [studyMode, setStudyMode] = useState<
    "histogram" | "normalFit" | "sigmaRule"
  >("histogram");

  // 是否显示特征数参考虚线 (众数、中位数、平均数)
  const [showStatsLines, setShowStatsLines] = useState(true);

  // 是否显示频率分布折线图
  const [showFrequencyLine, setShowFrequencyLine] = useState(false);

  // 是否显示3-σ原则区间高亮
  const [showSigmaIntervals, setShowSigmaIntervals] = useState(false);

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    mu: defaultParams.mu,
    sigma: defaultParams.sigma,
    binCount: defaultParams.binCount,
    sampleSize: defaultParams.sampleSize,
    x1: defaultParams.x1,
    x2: defaultParams.x2,
  }));

  // Tooltip 状态
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });

  // Tooltip 事件处理
  const handleBinMouseEnter = useCallback(
    (bin: TooltipBinData, e: React.MouseEvent) => {
      const items = [
        {
          label: "区间",
          value: `[${bin.xStart.toFixed(2)}, ${bin.xEnd.toFixed(2)})`,
          color: MATH_COLORS.paramSecondary,
        },
        { label: "组中值", value: bin.mid.toFixed(2) },
        { label: "组距", value: bin.width.toFixed(2) },
        { label: "频率/组距", value: bin.density.toFixed(4) },
        { label: "频率", value: bin.frequency.toFixed(4) },
        { label: "频数", value: String(bin.count) },
      ];
      setTooltip({ visible: true, x: e.clientX, y: e.clientY, items });
    },
    [],
  );

  const handleBinMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
  }, []);

  const handleBinMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  // 视口尺寸测量与响应式 scale
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 直角坐标系比例尺：X 轴量纲 [-5.5, 5.5]，Y 轴精确为概率密度/组距范围 [-0.1, 0.8]
  // 必须使用 keepAspectRatio: false 禁用 1:1 强绑定，实现两轴独立充满视口
  const scale = useSceneScale({
    vp,
    xRange: [-5.5, 5.5],
    yRange: [-0.1, 0.8],
    keepAspectRatio: false,
  });

  // 数学量看板数据更新
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-probability-normal", params, {
      studyMode,
    });
  }, [params, studyMode]);

  // 参数变更
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 恢复默认参数
  const handleReset = () => {
    setParams({
      mu: defaultParams.mu,
      sigma: defaultParams.sigma,
      binCount: defaultParams.binCount,
      sampleSize: defaultParams.sampleSize,
      x1: defaultParams.x1,
      x2: defaultParams.x2,
    });
  };

  // 按当前模式过滤展示参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      histogram: ["mu", "sigma", "binCount", "sampleSize"],
      normalFit: ["mu", "sigma", "binCount", "x1", "x2"],
      sigmaRule: ["mu", "sigma", "x1", "x2"],
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
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance as any,
          marks: meta.marks as any,
        };
      });
  }, [params, studyMode]);

  // 悬浮 KaTeX 公式渲染 (正态密度公式与概率值)
  const formulaLatex = useMemo(() => {
    const muVal = params.mu ?? 0;
    const sigVal = params.sigma ?? 1;

    if (studyMode === "histogram") {
      return `\\text{直方图矩形面积 } S_i = \\frac{\\text{频率}_i}{\\Delta x} \\times \\Delta x = \\text{频率}_i`;
    }

    const minX = Math.min(params.x1, params.x2).toFixed(1);
    const maxX = Math.max(params.x1, params.x2).toFixed(1);
    const pVal = (
      calcIntervalProbability(muVal, sigVal, params.x1, params.x2) * 100
    ).toFixed(2);

    return `f(x) = \\frac{1}{\\sqrt{2\\pi} \\cdot \\color{#D97706}{${sigVal.toFixed(1)}}} e^{-\\frac{(x - \\color{#EF4444}{${muVal.toFixed(1)}})^2}{2 \\cdot \\color{#D97706}{${sigVal.toFixed(1)}}^2}} \\quad P(${minX} \\le X \\le ${maxX}) = \\color{#059669}{${pVal}\\%}`;
  }, [params, studyMode]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "histogram") return "频率分布直方图与数字特征";
    if (studyMode === "normalFit") return "直方图与正态曲线拟合看板";
    return "正态分布 3-σ 原则与区间概率看板";
  }, [studyMode]);

  return (
    <>
      <ThreePanel
        left={
          <LeftPanel>
            {/* 模式选择 Section */}
            <LeftPanelSection
              title="探究模式"
              subtitle="选择频率分布与正态分布学习视角"
            >
              <SelectGrid
                items={[
                  { key: "histogram", label: "直方图与数字特征" },
                  { key: "normalFit", label: "正态分布曲线拟合" },
                  { key: "sigmaRule", label: "3-σ 原则与区间概率" },
                ]}
                value={studyMode}
                onChange={(k) => setStudyMode(k as any)}
                variant="filled"
                columns={1}
              />
            </LeftPanelSection>

            {/* 直方图模式下开关 Section */}
            {studyMode !== "sigmaRule" && (
              <LeftPanelSection
                title="辅助线与折线"
                subtitle="控制图表辅助元素显示"
              >
                <div className="space-y-2">
                  <Toggle
                    label="显示众数/中位数/均值"
                    checked={showStatsLines}
                    onChange={setShowStatsLines}
                  />
                  <Toggle
                    label="显示频率折线图"
                    checked={showFrequencyLine}
                    onChange={setShowFrequencyLine}
                  />
                </div>
              </LeftPanelSection>
            )}

            {/* 3-σ 原则区间高亮开关 Section */}
            {studyMode === "sigmaRule" && (
              <LeftPanelSection title="3-σ 原则" subtitle="高亮显示区间概率">
                <Toggle
                  label="显示3-σ区间高亮"
                  checked={showSigmaIntervals}
                  onChange={setShowSigmaIntervals}
                />
              </LeftPanelSection>
            )}

            {/* 声明式 ParamControl 参数调节 Section */}
            <LeftPanelSection
              title="参数调节"
              subtitle="拖动滑块改变分布状态或区间"
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
            {/* 中屏顶部 KaTeX 公式悬浮展示 */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
              <KatexFormula formula={formulaLatex} mode="inline" />
            </div>

            {/* SVG 动画画布 */}
            <AnimationSvgCanvas
              containerRef={containerRef}
              transform={vp.transform}
            >
              <ProbabilityNormalScene
                params={params as any}
                scale={scale}
                vp={vp}
                fontScale={canvasSize.font}
                studyMode={studyMode}
                showStatsLines={showStatsLines}
                showFrequencyLine={showFrequencyLine}
                showSigmaIntervals={showSigmaIntervals}
                onParamChange={handleParamChange}
                onBinMouseEnter={handleBinMouseEnter}
                onBinMouseMove={handleBinMouseMove}
                onBinMouseLeave={handleBinMouseLeave}
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
      {createPortal(
        <HtmlTooltip
          visible={tooltip.visible}
          x={tooltip.x}
          y={tooltip.y}
          items={tooltip.items}
          fontScale={canvasSize.font}
        />,
        document.body,
      )}
    </>
  );
}
