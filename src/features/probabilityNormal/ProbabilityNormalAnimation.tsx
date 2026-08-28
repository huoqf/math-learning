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
  TipCard,
} from "@/components/UI";
import { HtmlTooltip } from "@/components/Math/SvgTooltip";
import { SceneLegend } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { ProbabilityNormalScene } from "./components/ProbabilityNormalScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/probabilityNormal";
import { calcSymmetricNormalIntervals } from "@/math/probabilityNormal";

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

type NormalStudyMode = "histogram" | "normalFit" | "paramsShape" | "sigmaRule";
type NormalPreset = "free" | "height" | "factory" | "standard";

export function ProbabilityNormalAnimation() {
  // 研究模式：'histogram' | 'normalFit' | 'paramsShape' | 'sigmaRule'
  const [studyMode, setStudyMode] = useState<NormalStudyMode>("histogram");
  const [preset, setPreset] = useState<NormalPreset>("free");

  // 辅助开关
  const [showStatsLines, setShowStatsLines] = useState(true);
  const [showFrequencyLine, setShowFrequencyLine] = useState(false);
  const [showSigmaIntervals, setShowSigmaIntervals] = useState(false);
  const [showBenchmarkNormal, setShowBenchmarkNormal] = useState(true);

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
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
        { label: "组距 Δx", value: bin.width.toFixed(2) },
        { label: "频率/组距", value: bin.density.toFixed(4) },
        { label: "本组频率", value: bin.frequency.toFixed(4) },
        { label: "样本频数", value: String(bin.count) },
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

  // 直角坐标系比例尺：X 轴量纲 [-6, 6]，Y 轴为概率密度/组距范围 [-0.08, 0.85]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-0.08, 0.85],
    keepAspectRatio: false,
  });

  // 预设情境切换
  const handlePresetChange = (newPreset: NormalPreset) => {
    setPreset(newPreset);
    if (newPreset === "free") return;

    if (newPreset === "height") {
      setParams((prev) => ({
        ...prev,
        mu: 0,
        sigma: 1.2,
        x0: -1.2,
        binCount: 12,
        sampleSize: 500,
        skewness: 0,
      }));
      setShowSigmaIntervals(false);
    } else if (newPreset === "factory") {
      setParams((prev) => ({
        ...prev,
        mu: 0,
        sigma: 0.8,
        x0: -1.6,
        binCount: 16,
        sampleSize: 800,
        skewness: 0,
      }));
      setShowSigmaIntervals(true);
    } else if (newPreset === "standard") {
      setParams((prev) => ({
        ...prev,
        mu: 0,
        sigma: 1.0,
        x0: -1.0,
        binCount: 10,
        sampleSize: 300,
        skewness: 0,
      }));
      setShowSigmaIntervals(false);
    }
  };

  // 数学量看板数据更新
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-probability-normal", params, {
      studyMode,
    });
  }, [params, studyMode]);

  // 参数变更（拖拽或滑块改变自动切回 free）
  const handleParamChange = (key: string, value: number) => {
    setPreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 恢复默认参数
  const handleReset = () => {
    setPreset("free");
    setParams({ ...defaultParams });
  };

  // 按当前探究模式过滤展示参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<NormalStudyMode, string[]> = {
      histogram: [
        "mu",
        "sigma",
        "binCount",
        "sampleSize",
        "skewness",
        "percentileP",
      ],
      normalFit: ["mu", "sigma", "binCount", "sampleSize", "blend"],
      paramsShape: ["mu", "sigma"],
      sigmaRule: ["mu", "sigma", "x0"],
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
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 悬浮 KaTeX 公式渲染 (三位一体色彩映射)
  const formulaLatex = useMemo(() => {
    const muVal = params.mu ?? 0;
    const sigVal = params.sigma ?? 1;

    if (studyMode === "histogram") {
      return `\\text{直方图矩形面积 } S_i = \\frac{\\text{频率}_i}{\\Delta x} \\times \\Delta x = \\text{频率}_i \\quad \\sum S_i = 1`;
    }

    if (studyMode === "normalFit") {
      return `\\lim_{N \\to \\infty, \\Delta x \\to 0} \\text{直方图} = f(x) = \\frac{1}{\\sqrt{2\\pi} \\cdot \\color{${MATH_COLORS.paramSecondary}}{${sigVal.toFixed(1)}}} e^{-\\frac{(x - \\color{${MATH_COLORS.paramPrimary}}{${muVal.toFixed(1)}})^2}{2 \\cdot \\color{${MATH_COLORS.paramSecondary}}{${sigVal.toFixed(1)}}^2}}`;
    }

    if (studyMode === "paramsShape") {
      const peak = (1 / (sigVal * Math.sqrt(2 * Math.PI))).toFixed(3);
      return `f(x) = \\frac{1}{\\sqrt{2\\pi}\\color{${MATH_COLORS.paramSecondary}}{${sigVal.toFixed(1)}}} e^{-\\frac{(x - \\color{${MATH_COLORS.paramPrimary}}{${muVal.toFixed(1)}})^2}{2\\color{${MATH_COLORS.paramSecondary}}{${sigVal.toFixed(1)}}^2}} \\quad f_{\\max} = f(\\color{${MATH_COLORS.paramPrimary}}{${muVal.toFixed(1)}}) = ${peak}`;
    }

    // sigmaRule 对称性
    const sym = calcSymmetricNormalIntervals(muVal, sigVal, params.x0 ?? -1);
    const pTail = (sym.tailProb * 100).toFixed(2);
    const pCenter = (sym.centerProb * 100).toFixed(2);

    return `P(X \\le ${sym.leftX.toFixed(1)}) = P(X \\ge ${sym.rightX.toFixed(1)}) = \\color{${MATH_COLORS.paramTertiary}}{${pTail}\\%} \\quad P(${sym.leftX.toFixed(1)} \\le X \\le ${sym.rightX.toFixed(1)}) = \\color{${MATH_COLORS.paramSecondary}}{${pCenter}\\%}`;
  }, [params, studyMode]);

  // 中屏右下角学术图例
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const muVal = params.mu ?? 0;
    const sigVal = Math.max(0.1, params.sigma ?? 1);
    const x0Val = params.x0 ?? -1;
    const x1Val = params.x1 ?? -1;
    const x2Val = params.x2 ?? 1;

    if (studyMode === "histogram") {
      const items: SceneLegendItem[] = [
        {
          formula: "\\text{矩形面积 } S_i \\text{ (频率)}",
          color: MATH_COLORS.barBorder,
          style: "area",
        },
      ];
      if (showStatsLines) {
        items.push(
          {
            formula: "\\text{众数 } m_o",
            color: MATH_COLORS.paramPrimary,
            style: "dash",
          },
          {
            formula: "\\text{中位数 } m_e",
            color: MATH_COLORS.paramSecondary,
            style: "dash",
          },
          {
            formula: "\\text{均值 } \\bar{x}",
            color: MATH_COLORS.function,
            style: "dash",
          },
        );
      }
      if (showFrequencyLine) {
        items.push({
          label: "频率折线图",
          color: MATH_COLORS.frequencyLine,
          style: "solid",
        });
      }
      return items;
    }

    if (studyMode === "normalFit") {
      const minX = Math.min(x1Val, x2Val);
      const maxX = Math.max(x1Val, x2Val);
      return [
        {
          formula: `f(x) \\sim N(${muVal.toFixed(1)}, ${sigVal.toFixed(1)}^2)`,
          color: MATH_COLORS.paramPrimary,
          style: "solid",
        },
        {
          formula: "\\text{样本频率直方图}",
          color: MATH_COLORS.barBorder,
          style: "area",
        },
        {
          formula: `P(${minX.toFixed(1)} \\le X \\le ${maxX.toFixed(1)})`,
          color: MATH_COLORS.paramTertiary,
          style: "area",
        },
      ];
    }

    if (studyMode === "paramsShape") {
      const items: SceneLegendItem[] = [
        {
          formula: `N(${muVal.toFixed(1)}, ${sigVal.toFixed(1)}^2)`,
          color: MATH_COLORS.paramPrimary,
          style: "solid",
        },
        {
          formula: `\\text{对称轴 } x = ${muVal.toFixed(1)}`,
          color: MATH_COLORS.paramPrimary,
          style: "dash",
        },
        {
          formula: "\\text{拐点 } \\mu \\pm \\sigma",
          color: MATH_COLORS.paramSecondary,
          style: "point",
        },
      ];
      if (showBenchmarkNormal) {
        items.push({
          formula: "N(0, 1) \\text{ 基准}",
          color: MATH_COLORS.textMuted,
          style: "dash",
        });
      }
      return items;
    }

    // sigmaRule
    const sym = calcSymmetricNormalIntervals(muVal, sigVal, x0Val);
    if (showSigmaIntervals) {
      return [
        {
          formula: `N(${muVal.toFixed(1)}, ${sigVal.toFixed(1)}^2)`,
          color: MATH_COLORS.paramPrimary,
          style: "solid",
        },
        {
          formula: "1\\text{-}\\sigma \\;(68.27\\%)",
          color: MATH_COLORS.paramPrimary,
          style: "area",
        },
        {
          formula: "2\\text{-}\\sigma \\;(95.45\\%)",
          color: MATH_COLORS.paramSecondary,
          style: "area",
        },
        {
          formula: "3\\text{-}\\sigma \\;(99.73\\%)",
          color: MATH_COLORS.paramTertiary,
          style: "area",
        },
      ];
    }

    return [
      {
        formula: `N(${muVal.toFixed(1)}, ${sigVal.toFixed(1)}^2)`,
        color: MATH_COLORS.paramPrimary,
        style: "solid",
      },
      {
        formula: `P(X \\le ${sym.leftX.toFixed(1)})`,
        color: MATH_COLORS.paramTertiary,
        style: "area",
      },
      {
        formula: `P(X \\ge ${sym.rightX.toFixed(1)})`,
        color: MATH_COLORS.setB,
        style: "area",
      },
      {
        formula: `P(${sym.leftX.toFixed(1)} \\le X \\le ${sym.rightX.toFixed(1)})`,
        color: MATH_COLORS.paramSecondary,
        style: "dash",
      },
    ];
  }, [
    studyMode,
    params,
    showStatsLines,
    showFrequencyLine,
    showBenchmarkNormal,
    showSigmaIntervals,
  ]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "histogram") return "频率分布直方图与特征数看板";
    if (studyMode === "normalFit") return "直方图向正态分布极限逼近看板";
    if (studyMode === "paramsShape") return "正态分布 μ 与 σ 形态探究看板";
    return "正态分布对称性与高考 3-σ 看板";
  }, [studyMode]);

  // 左屏教学提示与题设导引 (说明初始条件与核心设问)
  const tipConfig = useMemo(() => {
    if (studyMode === "histogram") {
      return {
        variant: "primary" as const,
        badge: "高考基础 · 频率分布直方图与特征数",
        condition:
          "样本数据划分为若干组，纵轴为『频率/组距』，各矩形面积之和恒等于 1。",
        question:
          "求解直方图的众数（最高矩形底边中点）、中位数（左右面积各 0.5 的等分垂线）与平均数（各组中值乘以频率加权）。",
      };
    }
    if (studyMode === "normalFit") {
      return {
        variant: "info" as const,
        badge: "高考思想 · 频率直方图向正态分布逼近",
        condition:
          "固定样本均值与方差，逐步增大样本容量 N 并无限细分区间组距 Δx。",
        question: "探究频率折线图向钟形光滑正态密度曲线 f(x) 的极限收敛过程。",
      };
    }
    if (studyMode === "paramsShape") {
      return {
        variant: "warning" as const,
        badge: "高考核心 · 参数 μ 与 σ 对正态曲线形态影响",
        condition:
          "正态分布 X ~ N(μ, σ²)，密度函数 f(x) 由期望 μ 与标准差 σ 完全决定。",
        question:
          "探究改变位置参数 μ 与形态参数 σ 时正态曲线的平移与胖瘦变化。",
      };
    }
    // sigmaRule
    return {
      variant: "danger" as const,
      badge: "高考秒杀 · 3-σ 准则与对称区间解题",
      condition: "X ~ N(μ, σ²)，正态曲线关于直线 x=μ 严格轴对称。",
      question:
        "利用 P(μ-σ<X<μ+σ)≈0.6827、P(μ-2σ<X<μ+2σ)≈0.9545、P(μ-3σ<X<μ+3σ)≈0.9973 求解单侧或任意对称区间概率。",
    };
  }, [studyMode]);

  return (
    <>
      <ThreePanel
        left={
          <LeftPanel>
            {/* 模式选择 Section (遵循铁律 3：省略无意义 subtitle) */}
            <LeftPanelSection title="探究模式">
              <SelectGrid
                items={[
                  { key: "histogram", label: "直方图与特征数" },
                  { key: "normalFit", label: "极限逼近与拟合" },
                  { key: "paramsShape", label: "参数 μ, σ 与形态" },
                  { key: "sigmaRule", label: "对称性与高考解题" },
                ]}
                value={studyMode}
                onChange={(k) => setStudyMode(k as NormalStudyMode)}
                variant="filled"
                columns={1}
              />
            </LeftPanelSection>

            {/* 高考典型情境预设 */}
            <LeftPanelSection title="典型情境预设">
              <SelectGrid
                items={[
                  { key: "free", label: "自由探索" },
                  { key: "standard", label: "标准正态 N(0, 1)" },
                  { key: "height", label: "体检身高模型" },
                  { key: "factory", label: "零件 3-σ 质检" },
                ]}
                value={preset}
                onChange={(k) => handlePresetChange(k as NormalPreset)}
                variant="filled"
                columns={2}
              />
            </LeftPanelSection>

            {/* 辅助开关 Section */}
            {studyMode === "histogram" && (
              <LeftPanelSection title="辅助图元">
                <div className="space-y-2">
                  <Toggle
                    label="显示众数/中位数/均值/百分位"
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

            {studyMode === "paramsShape" && (
              <LeftPanelSection title="对比参考">
                <Toggle
                  label="同屏显示 N(0, 1) 基准曲线"
                  checked={showBenchmarkNormal}
                  onChange={setShowBenchmarkNormal}
                />
              </LeftPanelSection>
            )}

            {studyMode === "sigmaRule" && (
              <LeftPanelSection title="3-σ 准则">
                <Toggle
                  label="显示 3-σ 标准区间高亮"
                  checked={showSigmaIntervals}
                  onChange={setShowSigmaIntervals}
                />
              </LeftPanelSection>
            )}

            {/* 声明式 ParamControl 参数调节 Section */}
            <LeftPanelSection title="参数调节">
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
                    <span className="text-neutral-600">
                      {tipConfig.question}
                    </span>
                  </div>
                </div>
              </TipCard>
            </LeftPanelSection>
          </LeftPanel>
        }
        center={
          <div className="w-full h-full relative flex flex-col bg-white">
            {/* 中屏顶部 KaTeX 公式悬浮展示 */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
              <KatexFormula formula={formulaLatex} mode="inline" />
            </div>

            {/* 中屏右下角毛玻璃图例卡片 */}
            <SceneLegend items={legendItems} />

            {/* SVG 动画画布 */}
            <AnimationSvgCanvas
              containerRef={containerRef}
              transform={vp.transform}
            >
              <ProbabilityNormalScene
                params={
                  params as {
                    mu: number;
                    sigma: number;
                    binCount: number;
                    sampleSize: number;
                    skewness?: number;
                    percentileP?: number;
                    blend?: number;
                    x0?: number;
                    x1?: number;
                    x2?: number;
                  }
                }
                scale={scale}
                vp={vp}
                fontScale={canvasSize.font}
                studyMode={studyMode}
                showStatsLines={showStatsLines}
                showFrequencyLine={showFrequencyLine}
                showSigmaIntervals={showSigmaIntervals}
                showBenchmarkNormal={showBenchmarkNormal}
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
