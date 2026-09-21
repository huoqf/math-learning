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
import {
  defaultParams,
  paramMeta,
  MODE_SCENARIOS,
} from "@/data/registries/probabilityNormal";
import type { NormalStudyMode } from "@/data/registries/probabilityNormal";
import { calcSymmetricNormalIntervals } from "@/math/probabilityNormal";
import type { HistogramBin } from "@/math/probabilityNormal";

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  items: Array<{ label: string; value: string; color?: string }>;
}

export function ProbabilityNormalAnimation() {
  // 一级研究模式：'normalFit' | 'paramsShape' | 'sigmaRule'
  // （原 'histogram' 直方图特征数模式已按分册职能边界移除，交由必修二 /stat-percentile 承载）
  const [studyMode, setStudyMode] = useState<NormalStudyMode>("normalFit");
  // 二级典型情景预设（默认首选 'free' 自由探索）
  const [preset, setPreset] = useState<string>("free");

  // 辅助开关
  const [showSigmaIntervals, setShowSigmaIntervals] = useState(false);
  const [showBenchmarkNormal, setShowBenchmarkNormal] = useState(true);

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 当前模式专属的二级情景集合
  const currentScenarios =
    MODE_SCENARIOS[studyMode] ?? MODE_SCENARIOS.normalFit;
  const currentScenario =
    currentScenarios.find((s) => s.key === preset) ?? currentScenarios[0];

  // Tooltip 状态
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });

  // Tooltip 事件处理
  const handleBinMouseEnter = useCallback(
    (bin: HistogramBin, e: React.MouseEvent) => {
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

  // 直角坐标系比例尺：X 轴量纲 [-8, 8]，Y 轴为概率密度/组距范围 [-0.08, 1.08] (确保 σ=0.4 时 f_max=0.997 完整可见，且极值下 3σ 区域完整落入视口)
  const scale = useSceneScale({
    vp,
    xRange: [-8, 8],
    yRange: [-0.08, 1.08],
    keepAspectRatio: false,
  });

  // 切换一级模式（重置二级预设为 'free'，避免上一模式状态残留）
  const handleStudyModeChange = (newMode: string) => {
    const m = newMode as NormalStudyMode;
    setStudyMode(m);
    setPreset("free");
  };

  // 预设情境切换（参数联动与辅助开关同步）
  const handlePresetChange = (newPreset: string) => {
    setPreset(newPreset);
    const scenario = currentScenarios.find((s) => s.key === newPreset);
    if (scenario?.params) {
      setParams((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(scenario.params!)) {
          if (typeof v === "number") {
            next[k] = v;
          }
        }
        return next;
      });
    }
    if (typeof scenario?.showSigmaIntervals === "boolean") {
      setShowSigmaIntervals(scenario.showSigmaIntervals);
    }
  };

  // 数学量看板数据更新
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-probability-normal", params, {
      studyMode,
      activeScenario: preset,
    });
  }, [params, studyMode, preset]);

  // 参数变更（拖拽或滑块改变自动切回 free 探索）
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

  // 按当前探究模式与二级情景白名单裁剪参数展示（参数降维）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const defaultKeysByMode: Record<NormalStudyMode, string[]> = {
      normalFit: ["mu", "sigma", "binCount", "sampleSize", "blend"],
      paramsShape: ["mu", "sigma"],
      sigmaRule: ["mu", "sigma", "x0"],
    };

    const allowedKeys =
      currentScenario.visibleKeys ?? defaultKeysByMode[studyMode];

    return allowedKeys
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
  }, [params, studyMode, currentScenario]);

  // 悬浮 KaTeX 公式渲染 (三位一体色彩映射)
  const formulaLatex = useMemo(() => {
    const muVal = params.mu ?? 0;
    const sigVal = params.sigma ?? 1;

    if (studyMode === "normalFit") {
      return `\\text{直方图连续化逼近 } f(x) = \\frac{1}{\\sqrt{2\\pi} \\cdot \\color{${MATH_COLORS.paramSecondary}}{${sigVal.toFixed(1)}}} e^{-\\frac{(x - \\color{${MATH_COLORS.paramPrimary}}{${muVal.toFixed(1)}})^2}{2 \\cdot \\color{${MATH_COLORS.paramSecondary}}{${sigVal.toFixed(1)}}^2}}`;
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

  // 中屏学术图例
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const muVal = params.mu ?? 0;
    const sigVal = Math.max(0.1, params.sigma ?? 1);
    const x0Val = params.x0 ?? -1;
    const x1Val = params.x1 ?? -1;
    const x2Val = params.x2 ?? 1;

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
          label: "频率折线图",
          color: MATH_COLORS.frequencyLine,
          style: "dash",
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
          formula: "\\text{弯曲改变处 } \\mu \\pm \\sigma",
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
  }, [studyMode, params, showBenchmarkNormal, showSigmaIntervals]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "normalFit") return "直方图向正态分布极限逼近看板";
    if (studyMode === "paramsShape") return "正态分布 μ 与 σ 形态探究看板";
    return "正态分布对称性与高考 3-σ 看板";
  }, [studyMode]);

  // 左屏教学导引：融合真实背景（background）、初始条件与核心设问，随二级情景 100% 动态特化
  const tipConfig = useMemo(() => {
    return {
      variant:
        studyMode === "normalFit"
          ? ("info" as const)
          : studyMode === "paramsShape"
            ? ("warning" as const)
            : ("danger" as const),
      badge: currentScenario.badge,
      background: currentScenario.background,
      condition: currentScenario.condition,
      question: currentScenario.question,
    };
    // 依赖中保留二级选项变量：TipCard 教学提示须随二级选项切换同步特化（项目纪律 left/tipcard-secondary-sync）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyMode, preset, currentScenario]);

  return (
    <>
      <ThreePanel
        left={
          <LeftPanel>
            {/* 模式选择 Section */}
            <LeftPanelSection title="探究模式">
              <SelectGrid
                items={[
                  { key: "normalFit", label: "极限逼近拟合" },
                  { key: "paramsShape", label: "参数 μ, σ 形态" },
                  { key: "sigmaRule", label: "对称性与解题" },
                ]}
                value={studyMode}
                onChange={handleStudyModeChange}
                variant="filled"
                columns={2}
              />
            </LeftPanelSection>

            {/* 高考典型情境预设：按当前模式动态联动 */}
            <LeftPanelSection title="典型情境预设">
              <SelectGrid
                items={currentScenarios.map((sc) => ({
                  key: sc.key,
                  label: sc.label,
                }))}
                value={preset}
                onChange={handlePresetChange}
                variant="filled"
                columns={2}
              />
            </LeftPanelSection>

            {/* 辅助开关 Section */}
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
            <div className="mt-auto">
              <TipCard
                variant={tipConfig.variant}
                badge={tipConfig.badge}
                background={tipConfig.background}
                condition={tipConfig.condition}
                question={tipConfig.question}
              />
            </div>
          </LeftPanel>
        }
        center={
          <div className="w-full h-full relative flex flex-col bg-white">
            {/* 中屏顶部 KaTeX 公式悬浮展示 */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
              <KatexFormula formula={formulaLatex} mode="inline" />
            </div>

            {/* 右上角毛玻璃图例卡片，利用正态分布两翼低垂空白彻底避免右下角遮挡 */}
            <SceneLegend
              items={legendItems}
              title="图例说明"
              position="top-right"
            />

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
        right={<MathPanel {...mathData} title={panelTitle} />}
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

export default ProbabilityNormalAnimation;
