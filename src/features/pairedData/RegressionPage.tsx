import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TabSwitcher,
  TipCard,
} from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { PairedDataScene } from "./components/PairedDataScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/pairedData";
import {
  REGRESSION_PRESETS,
  calculateLinearRegression,
  fitAllRegressionModels,
  RegressionModelType,
  Point2D,
} from "@/math/pairedData";

// 辅助渲染混合文本（支持 $...$ 内嵌公式与普通文本自然换行）
function renderMixedText(text: string) {
  if (!text) return null;
  const parts = text.split(/\$(.*?)\$/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <KatexFormula
          key={i}
          formula={part}
          mode="inline"
          className="!text-[11px] !my-0 !mx-0.5"
        />
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function RegressionPage() {
  // 顶层模式：'linear' (一元线性回归) | 'nonlinear' (非线性模型转换)
  const [analysisMode, setAnalysisMode] = useState<"linear" | "nonlinear">(
    "linear",
  );

  // 选中的模型类型
  const [selectedModel, setSelectedModel] =
    useState<RegressionModelType>("linear");

  // 当前选中的预设情境 key ('free' | 'ad_sales' | 'temp_power' | 'outlier' | 'ev_growth' | 'chip_rnd')
  const [selectedScenarioKey, setSelectedScenarioKey] =
    useState<string>("ad_sales");

  // 基础散点集状态
  const [basePoints, setBasePoints] = useState<Point2D[]>(
    () => REGRESSION_PRESETS[0].points,
  );

  // 参数状态 (noise 强度等)
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 辅助视图开关状态
  const [showResidualSquares, setShowResidualSquares] = useState<boolean>(true);
  const [showResidualPlot, setShowResidualPlot] = useState<boolean>(false);

  // 根据当前 noise 扰动、重心平移 meanShiftY 及离群点偏移 outlierOffset 动态计算活跃散点集
  const activePoints = useMemo(() => {
    const noise = params.noise ?? 0;
    const meanShiftY = params.meanShiftY ?? 0;
    const outlierOffset = params.outlierOffset ?? 0;

    return basePoints.map((p, idx) => {
      const perturbation =
        noise > 0.001 ? noise * Math.sin(idx * 2.3 + 1.2) * 0.9 : 0;
      // 离群点额外偏移（仅在 outlier 情境作用于最后一个异常点）
      const extraOutlier =
        selectedScenarioKey === "outlier" && idx === basePoints.length - 1
          ? outlierOffset
          : 0;
      return {
        id: p.id,
        x: p.x,
        y: Number((p.y + perturbation + meanShiftY + extraOutlier).toFixed(2)),
      };
    });
  }, [
    basePoints,
    params.noise,
    params.meanShiftY,
    params.outlierOffset,
    selectedScenarioKey,
  ]);

  // 处理散点拖拽更新：自动切入【自由探索 (free)】
  const handlePointsChange = (newActivePoints: Point2D[]) => {
    setSelectedScenarioKey("free");
    const noise = params.noise ?? 0;
    const meanShiftY = params.meanShiftY ?? 0;
    setBasePoints(
      newActivePoints.map((p, idx) => {
        const perturbation =
          noise > 0.001 ? noise * Math.sin(idx * 2.3 + 1.2) * 0.9 : 0;
        return {
          id: p.id,
          x: p.x,
          y: Number((p.y - perturbation - meanShiftY).toFixed(2)),
        };
      }),
    );
  };

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 动态视口范围计算
  const currentPreset = useMemo(() => {
    return (
      REGRESSION_PRESETS.find((p) => p.id === selectedScenarioKey) ??
      REGRESSION_PRESETS[0]
    );
  }, [selectedScenarioKey]);

  const xRange = useMemo<[number, number]>(() => {
    if (selectedScenarioKey === "free") {
      const xs = activePoints.map((p) => p.x);
      const minX = Math.min(...xs, 0);
      const maxX = Math.max(...xs, 10);
      const margin = (maxX - minX) * 0.25 || 2;
      return [Math.floor(minX - margin), Math.ceil(maxX + margin)];
    }
    const [minX, maxX] = currentPreset.xRange;
    const margin = (maxX - minX) * 0.18;
    return [Math.floor(minX - margin), Math.ceil(maxX + margin)];
  }, [selectedScenarioKey, activePoints, currentPreset]);

  const yRange = useMemo<[number, number]>(() => {
    if (selectedScenarioKey === "free") {
      const ys = activePoints.map((p) => p.y);
      const minY = Math.min(...ys, 0);
      const maxY = Math.max(...ys, 10);
      const margin = (maxY - minY) * 0.25 || 2;
      return [Math.floor(minY - margin), Math.ceil(maxY + margin)];
    }
    const [minY, maxY] = currentPreset.yRange;
    const margin = (maxY - minY) * 0.18;
    return [Math.floor(minY - margin), Math.ceil(maxY + margin)];
  }, [selectedScenarioKey, activePoints, currentPreset]);

  const calcStep = (range: number) => {
    if (range <= 8) return 1;
    if (range <= 16) return 2;
    if (range <= 30) return 5;
    return 10;
  };
  const xStep = calcStep(xRange[1] - xRange[0]);
  const yStep = calcStep(yRange[1] - yRange[0]);

  const scale = useSceneScale({ vp, xRange, yRange });

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 切换情景预设
  const handleScenarioSelect = (scenarioKey: string) => {
    setSelectedScenarioKey(scenarioKey);
    if (scenarioKey === "free") return;

    const preset = REGRESSION_PRESETS.find((p) => p.id === scenarioKey);
    if (preset) {
      setBasePoints(preset.points);
      if (preset.recommendedModel) {
        setSelectedModel(preset.recommendedModel);
      }
    }
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
    setAnalysisMode("linear");
    setSelectedModel("linear");
    setSelectedScenarioKey("ad_sales");
    setBasePoints(REGRESSION_PRESETS[0].points);
    setShowResidualSquares(true);
    setShowResidualPlot(false);
  };

  // 按情景自适应动态装配核心参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const list: ParamConfig[] = [
      {
        key: "noise",
        label: paramMeta.noise.label,
        labelFormula: paramMeta.noise.labelFormula,
        value: params.noise ?? 0,
        min: paramMeta.noise.min,
        max: paramMeta.noise.max,
        step: paramMeta.noise.step ?? 0.2,
        importance: "core",
      },
    ];

    if (selectedScenarioKey === "outlier") {
      list.push({
        key: "outlierOffset",
        label: paramMeta.outlierOffset.label,
        labelFormula: paramMeta.outlierOffset.labelFormula,
        value: params.outlierOffset ?? 0,
        min: paramMeta.outlierOffset.min,
        max: paramMeta.outlierOffset.max,
        step: paramMeta.outlierOffset.step ?? 0.5,
        importance: "core",
      });
    } else {
      list.push({
        key: "meanShiftY",
        label: paramMeta.meanShiftY.label,
        labelFormula: paramMeta.meanShiftY.labelFormula,
        value: params.meanShiftY ?? 0,
        min: paramMeta.meanShiftY.min,
        max: paramMeta.meanShiftY.max,
        step: paramMeta.meanShiftY.step ?? 0.5,
        importance: "core",
      });
    }

    return list;
  }, [
    params.noise,
    params.meanShiftY,
    params.outlierOffset,
    selectedScenarioKey,
  ]);

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-paired-data", params, {
      studyMode: "regression",
      selectedModel,
      scenarioKey: selectedScenarioKey,
      points: activePoints,
    });
  }, [params, selectedModel, selectedScenarioKey, activePoints]);

  const linearRes = useMemo(() => {
    return calculateLinearRegression(activePoints);
  }, [activePoints]);

  const fits = useMemo(() => {
    return fitAllRegressionModels(activePoints);
  }, [activePoints]);

  const currentFit = useMemo(() => {
    return fits.find((m) => m.type === selectedModel) ?? fits[0];
  }, [fits, selectedModel]);

  const headerFormulaLatex = useMemo(() => {
    if (!currentFit || !currentFit.isValid)
      return "\\text{当前数据点不足或异常，无法拟合回归方程}";
    return `\\text{${currentFit.name}: } \\; ${currentFit.originalFormula} \\quad (R^2 = ${currentFit.rSquare.toFixed(3)}, \\; \\text{SSE} = ${currentFit.sse.toFixed(2)})`;
  }, [currentFit]);

  // 中屏右下角图例配置 (SceneLegend)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const items: SceneLegendItem[] = [
      {
        color: MATH_COLORS.function,
        formula: `${currentFit?.name ?? "拟合曲线"} \\; (R^2 = ${(currentFit?.rSquare ?? 0).toFixed(3)})`,
        style: "solid",
      },
    ];

    if (linearRes.isValid) {
      items.push({
        color: MATH_COLORS.paramSecondary,
        formula: `\\text{样本重心 } (\\bar{x}=${linearRes.meanX.toFixed(1)}, \\bar{y}=${linearRes.meanY.toFixed(1)})`,
        style: "point",
      });
    }

    items.push({
      color: MATH_COLORS.tangentLine,
      formula: `\\text{残差 } e_i = y_i - \\hat{y}_i \\; (\\text{SSE}=${(currentFit?.sse ?? 0).toFixed(2)})`,
      style: "dash",
    });

    if (showResidualSquares) {
      items.push({
        color: MATH_COLORS.paramTertiary,
        formula: "\\text{残差正方形 } \\sum e_i^2 = \\text{SSE}",
        style: "area",
      });
    }

    return items;
  }, [currentFit, linearRes, showResidualSquares]);

  // 左屏教学提示与题设导引 (说明初始条件与核心设问)
  const tipConfig = useMemo(() => {
    const modelNameMap: Record<RegressionModelType, string> = {
      linear: "一元线性模型 $\\hat{y} = bx + a$",
      exponential: "指数模型 $y = c e^{kx}$（令 $z = \\ln y$ 线性化）",
      logarithmic: "对数模型 $y = a + b \\ln x$（令 $u = \\ln x$ 线性化）",
      power: "幂函数模型 $y = c x^k$（令 $z = \\ln y, u = \\ln x$ 线性化）",
      inverse:
        "双曲线逆模型 $y = a + \\frac{b}{x}$（令 $u = \\frac{1}{x}$ 线性化）",
    };

    const isFree = selectedScenarioKey === "free";
    return {
      variant: (selectedModel === "linear" ? "primary" : "warning") as
        "primary" | "warning",
      badge: isFree
        ? "自主探究 · 自由拖拽散点"
        : `高考例题 · ${currentPreset?.name ?? "成对数据分析"}`,
      condition: isFree
        ? `在画布中自由拖拽散点 $P_1 \\sim P_5$，当前聚焦 ${modelNameMap[selectedModel]}。`
        : `成对观测样本 (${currentPreset?.xName ?? "x"}, ${currentPreset?.yName ?? "y"})，拟合模型设定为 ${modelNameMap[selectedModel]}。`,
      question:
        "求解回归方程系数、相关系数 $r$、决定系数 $R^2$ 以及残差平方和 $\\sum e_i^2$ 最小化。",
    };
  }, [selectedModel, currentPreset, selectedScenarioKey]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 第 1 层：统计分析模式 (TabSwitcher 纵向单列独占) */}
          <LeftPanelSection title="统计分析模式">
            <TabSwitcher
              layout="vertical"
              tabs={[
                {
                  key: "linear",
                  label: "一元线性回归模型",
                  formula: "\\hat{y}=bx+a",
                },
                {
                  key: "nonlinear",
                  label: "非线性回归转换模型",
                  formula: "z=\\ln y",
                },
              ]}
              value={analysisMode}
              onChange={(k: string) => {
                const nextMode = k as "linear" | "nonlinear";
                setAnalysisMode(nextMode);
                if (nextMode === "linear") {
                  setSelectedModel("linear");
                  setSelectedScenarioKey("ad_sales");
                  setBasePoints(REGRESSION_PRESETS[0].points);
                } else {
                  setSelectedModel("exponential");
                  setSelectedScenarioKey("ev_growth");
                  setBasePoints(REGRESSION_PRESETS[2].points);
                }
              }}
            />
          </LeftPanelSection>

          {/* 第 2 层：高考典型情境 (SelectGrid 单列全宽，题设与模型一体化绑定) */}
          {analysisMode === "linear" ? (
            <LeftPanelSection title="典型考题与情境">
              <SelectGrid
                columns={1}
                items={[
                  {
                    key: "free",
                    label: "自由探索",
                    formula: "\\text{自由拖拽 5 点探究}",
                    fullWidth: true,
                  },
                  {
                    key: "ad_sales",
                    label: "广告支出与销售额",
                    formula: "r = +0.98 \\; (\\text{强正相关})",
                    fullWidth: true,
                  },
                  {
                    key: "temp_power",
                    label: "气温与用电量",
                    formula: "r = -0.99 \\; (\\text{强负相关})",
                    fullWidth: true,
                  },
                  {
                    key: "outlier",
                    label: "含异常干扰点",
                    formula: "\\text{离群点杠杆效应检验}",
                    fullWidth: true,
                  },
                ]}
                value={selectedScenarioKey}
                onChange={handleScenarioSelect}
              />
            </LeftPanelSection>
          ) : (
            <LeftPanelSection title="非线性考题与模型">
              <SelectGrid
                columns={1}
                items={[
                  {
                    key: "free",
                    label: "自由探索 (自主切换模型)",
                    formula: "\\text{拖拽散点与选模}",
                    fullWidth: true,
                  },
                  {
                    key: "ev_growth",
                    label: "新能源汽车销量增长",
                    formula: "\\text{指数模型 } y = c e^{kx}",
                    fullWidth: true,
                  },
                  {
                    key: "chip_rnd",
                    label: "研发投入与技术产出",
                    formula: "\\text{对数模型 } y = a+b\\ln x",
                    fullWidth: true,
                  },
                  {
                    key: "inverse_current",
                    label: "物理电阻与电流强度",
                    formula: "\\text{双曲线逆 } y = a+\\frac{b}{x}",
                    fullWidth: true,
                  },
                ]}
                value={selectedScenarioKey}
                onChange={handleScenarioSelect}
              />

              {/* 仅在非线性自由探索模式下，才展示拟合模型自主切换选择器 */}
              {selectedScenarioKey === "free" && (
                <div className="mt-2.5 pt-2 border-t border-neutral-100">
                  <span className="text-[11px] font-semibold text-neutral-600 mb-1.5 block">
                    拟合转换模型
                  </span>
                  <SelectGrid
                    columns={2}
                    items={[
                      {
                        key: "exponential",
                        label: "指数模型",
                        formula: "y = c e^{kx}",
                      },
                      {
                        key: "logarithmic",
                        label: "对数模型",
                        formula: "y = a+b\\ln x",
                      },
                      {
                        key: "power",
                        label: "幂函数",
                        formula: "y = c x^k",
                      },
                      {
                        key: "inverse",
                        label: "双曲线逆",
                        formula: "y = a+\\frac{b}{x}",
                      },
                    ]}
                    value={selectedModel}
                    onChange={(k) => setSelectedModel(k as RegressionModelType)}
                  />
                </div>
              )}
            </LeftPanelSection>
          )}

          {/* 第 3 层：核心参数调节区 (ParamControl) */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 第 4 层：几何辅助开关 (紧凑排列) */}
          <LeftPanelSection title="几何辅助开关">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10.5px] font-medium text-neutral-600 truncate">
                  残差正方形 (∑eᵢ²)
                </span>
                <TabSwitcher
                  layout="horizontal"
                  tabs={[
                    { key: "on", label: "开启" },
                    { key: "off", label: "隐藏" },
                  ]}
                  value={showResidualSquares ? "on" : "off"}
                  onChange={(k: string) => setShowResidualSquares(k === "on")}
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10.5px] font-medium text-neutral-600 truncate">
                  残差分布图 (xᵢ, eᵢ)
                </span>
                <TabSwitcher
                  layout="horizontal"
                  tabs={[
                    { key: "off", label: "隐藏" },
                    { key: "on", label: "叠加" },
                  ]}
                  value={showResidualPlot ? "on" : "off"}
                  onChange={(k: string) => setShowResidualPlot(k === "on")}
                />
              </div>
            </div>
          </LeftPanelSection>

          {/* 第 5 层：教学导引与题设背景 (自然折行排版) */}
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
                    {renderMixedText(tipConfig.condition)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【核心设问】
                  </span>
                  <span className="text-neutral-600">
                    {renderMixedText(tipConfig.question)}
                  </span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white overflow-hidden">
          {/* 顶部居中拟合公式卡片 */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-lg px-4 py-1.5 shadow-sm max-w-[90%] overflow-hidden">
            <KatexFormula formula={headerFormulaLatex} mode="inline" />
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <PairedDataScene
              studyMode="regression"
              selectedModel={selectedModel}
              showResidualSquares={showResidualSquares}
              showResidualPlot={showResidualPlot}
              points={activePoints}
              onPointsChange={handlePointsChange}
              freqA={85}
              freqB={15}
              freqC={40}
              freqD={60}
              presetXName={currentPreset.xName}
              presetYName={currentPreset.yName}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              xStep={xStep}
              yStep={yStep}
            />
          </AnimationSvgCanvas>

          {/* 中屏右下角标准毛玻璃图例 (SceneLegend) */}
          <SceneLegend items={legendItems} title="回归分析图例" />
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="成对数据与回归分析看板"
        />
      }
    />
  );
}
