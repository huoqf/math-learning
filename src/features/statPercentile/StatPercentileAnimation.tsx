import { useState, useMemo, useCallback } from "react";
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
import { SceneLegend } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math/SceneLegend";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { StatPercentileScene } from "./components/StatPercentileScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  MODE_SCENARIOS,
} from "@/data/registries/statPercentile";
import type { StudyMode } from "@/data/registries/statPercentile";

export function StatPercentileAnimation() {
  // 一级探究模式：'histogram' | 'cumulative' | 'stratified'
  const [studyMode, setStudyMode] = useState<StudyMode>("histogram");

  // 二级典型高考情景预设（首选为 'free' 自由探索）
  const [activeScenario, setActiveScenario] = useState<string>("free");

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

  // 数学量看板数据计算与组装（带二级情景特化）
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-stat-percentile", params, {
      studyMode,
      activeScenario,
    });
  }, [params, studyMode, activeScenario]);

  // 参数更新处理器（学生主动调参或中屏拖拽动点时，自动切回 'free' 自由探索）
  const handleParamChange = useCallback((key: string, value: number) => {
    setActiveScenario("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 切换一级研究模式（单模式闭环：重置二级情景为 'free'）
  const handleStudyModeChange = (newMode: string) => {
    const m = newMode as StudyMode;
    setStudyMode(m);
    setActiveScenario("free");
  };

  // 载入二级情景预设（参数题设锁定与降维）
  const handleScenarioSelect = (scenarioKey: string) => {
    setActiveScenario(scenarioKey);
    const scenarioList = MODE_SCENARIOS[studyMode];
    const scenario = scenarioList.find((s) => s.key === scenarioKey);
    if (scenario?.params) {
      setParams((prev) => ({
        ...prev,
        ...scenario.params,
      }));
    }
  };

  // 重置参数
  const handleReset = () => {
    setActiveScenario("free");
    setParams({ ...defaultParams });
  };

  // 根据当前 activeMode 与 activeScenario 进行声明式参数裁剪（参数降维核心初衷）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const scenarioList = MODE_SCENARIOS[studyMode];
    const currentScenario =
      scenarioList.find((s) => s.key === activeScenario) ?? scenarioList[0];

    const defaultKeysByMode: Record<StudyMode, string[]> = {
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

    // 如果当前情景定义了可见参数白名单 visibleKeys，则仅展示白名单参数（降维隐藏从属/锁定参数）
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
          step: meta.step ?? 1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
          group: meta.group,
        };
      });
  }, [params, studyMode, activeScenario]);

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

  // 中屏右下角图例配置 (SceneLegend)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (studyMode === "histogram") {
      return [
        {
          color: MATH_COLORS.function,
          label: "直方图各组频率矩形",
          style: "area",
        },
        {
          color: MATH_COLORS.paramPrimary,
          label: `目标百分位 P${params.percentileP} 面积`,
          style: "area",
        },
        {
          color: MATH_COLORS.function,
          label: "估算平均数 x̄ (力矩重心)",
          style: "dash",
        },
        {
          color: MATH_COLORS.paramSecondary,
          label: "估算中位数 Me (面积平分)",
          style: "dash",
        },
        {
          color: MATH_COLORS.paramTertiary,
          label: "众数 Mo (最高组中值)",
          style: "dash",
        },
      ];
    }
    if (studyMode === "cumulative") {
      return [
        {
          color: MATH_COLORS.paramSecondary,
          label: "累积频率 S 型折线",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramPrimary,
          label: `目标百分位 ${params.percentileP}% 插值投影`,
          style: "dash",
        },
        {
          color: MATH_COLORS.paramPrimary,
          label: "分位数交互控制点",
          style: "point",
        },
      ];
    }
    // stratified
    return [
      {
        color: MATH_COLORS.paramPrimary,
        label: "层 1 高斯分布与均值 x̄₁",
        style: "solid",
      },
      {
        color: MATH_COLORS.paramSecondary,
        label: "层 2 高斯分布与均值 x̄₂",
        style: "solid",
      },
      {
        color: MATH_COLORS.paramTertiary,
        label: "层 3 高斯分布与均值 x̄₃",
        style: "solid",
      },
      {
        color: MATH_COLORS.function,
        label: "总体加权均值 x̄",
        style: "dash",
      },
      {
        color: MATH_COLORS.function,
        label: "组内方差贡献 ∑wᵢsᵢ²",
        style: "area",
      },
      {
        color: MATH_COLORS.paramSecondary,
        label: "组间离差贡献 ∑wᵢ(x̄ᵢ-x̄)²",
        style: "area",
      },
    ];
  }, [studyMode, params.percentileP]);

  // 左屏教学提示与题设导引 (说明初始条件与核心设问，KaTeX 规范渲染)
  const tipConfig = useMemo(() => {
    if (studyMode === "histogram") {
      return {
        variant: "primary" as const,
        badge: "高考基础 · 直方图与数字特征",
        conditionFormula:
          "\\text{样本划分为若干组，直方图矩形总面积恒等于 } \\sum f_i = 1",
        questionFormula:
          "\\text{求解众数 } M_o\\text{、中位数 } M_e \\text{ 与估算均值 } \\bar{x} = \\sum x_{\\text{mid}, i} f_i",
      };
    }
    if (studyMode === "cumulative") {
      return {
        variant: "warning" as const,
        badge: "高考高频 · 百分位数与累积频率折线",
        conditionFormula: `\\text{样本按升序排列，目标百分位数 } p = ${params.percentileP ?? 75}\\%`,
        questionFormula:
          "\\text{根据 S 型累积折线，求第 } p \\text{ 百分位数 } y_p \\text{ 的线性插值坐标}",
      };
    }
    // stratified
    return {
      variant: "danger" as const,
      badge: "高考压轴 · 分层抽样与总方差分解",
      conditionFormula: `\\text{总体分为 3 层 } (N_1, N_2, N_3)\\text{，按比例抽取样本 } n = ${params.sampleN ?? 100}`,
      questionFormula:
        "\\text{求解分层抽样总样本均值 } \\bar{x} \\text{ 与总样本方差 } s^2",
    };
  }, [studyMode, params.percentileP, params.sampleN]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section：单列 3 行布局 */}
          <LeftPanelSection title="研究模式">
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
              onChange={handleStudyModeChange}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 高考典型题型预设（严格模式级二级隔离） */}
          <LeftPanelSection title="典型高考情境">
            <SelectGrid
              columns={1}
              items={MODE_SCENARIOS[studyMode].map((s) => ({
                key: s.key,
                label: s.label,
                description: s.description,
              }))}
              value={activeScenario}
              onChange={handleScenarioSelect}
              variant="outline"
            />
          </LeftPanelSection>

          {/* 参数调节 Section（按情景降维展开） */}
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
                  <span className="font-semibold text-neutral-800 mr-1">
                    【初始条件】
                  </span>
                  <KatexFormula
                    formula={tipConfig.conditionFormula}
                    mode="inline"
                  />
                </div>
                <div>
                  <span className="font-semibold text-neutral-800 mr-1">
                    【核心设问】
                  </span>
                  <KatexFormula
                    formula={tipConfig.questionFormula}
                    mode="inline"
                  />
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

          {/* 右下角毛玻璃图例 (SceneLegend) */}
          <SceneLegend items={legendItems} title="图元与特征指示" />

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
