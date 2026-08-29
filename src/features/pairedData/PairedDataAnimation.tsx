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
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { PairedDataScene } from "./components/PairedDataScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/pairedData";
import {
  REGRESSION_PRESETS,
  INDEPENDENCE_PRESETS,
  calculateIndependenceTest,
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

export function PairedDataAnimation() {
  // 研究模式：'regression' (成对数据与回归分析) | 'independence' (2x2 独立性检验)
  const [studyMode, setStudyMode] = useState<"regression" | "independence">(
    "regression",
  );

  // 回归拟合模型选择
  const [selectedModel, setSelectedModel] =
    useState<RegressionModelType>("linear");

  // 统一参数管理
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 回归模式下特有的基准点集状态 (支持拖拽散点)
  const [regPresetIndex, setRegPresetIndex] = useState<number>(0);
  const [basePoints, setBasePoints] = useState<Point2D[]>(
    () => REGRESSION_PRESETS[0].points,
  );

  // 根据当前 noise 强度动态计算活跃散点集 (完全同步左屏滑块)
  const activePoints = useMemo(() => {
    const noise = params.noise ?? 0;
    if (noise <= 0.001) return basePoints;
    return basePoints.map((p, idx) => {
      // 确定性正弦伪随机波动
      const perturbation = noise * Math.sin(idx * 2.3 + 1.2) * 0.9;
      return {
        id: p.id,
        x: p.x,
        y: Number((p.y + perturbation).toFixed(2)),
      };
    });
  }, [basePoints, params.noise]);

  // 处理散点拖拽更新
  const handlePointsChange = (newActivePoints: Point2D[]) => {
    const noise = params.noise ?? 0;
    if (noise <= 0.001) {
      setBasePoints(newActivePoints);
    } else {
      setBasePoints(
        newActivePoints.map((p, idx) => {
          const perturbation = noise * Math.sin(idx * 2.3 + 1.2) * 0.9;
          return {
            id: p.id,
            x: p.x,
            y: Number((p.y - perturbation).toFixed(2)),
          };
        }),
      );
    }
  };

  // 独立性检验特有的当前预设 key
  const [indPresetKey, setIndPresetKey] = useState<string>("0");

  // 2. 视口尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 3. 根据当前预设动态计算坐标范围
  const currentPreset =
    studyMode === "regression" ? REGRESSION_PRESETS[regPresetIndex] : null;

  const xRange: [number, number] = currentPreset?.xRange ?? [-6, 35];
  const yRange: [number, number] = currentPreset?.yRange ?? [-4, 30];

  // 自适应刻度步长：范围越小步长越小
  const calcStep = (range: number) => {
    if (range <= 8) return 1;
    if (range <= 16) return 2;
    if (range <= 30) return 5;
    return 10;
  };
  const xStep = calcStep(xRange[1] - xRange[0]);
  const yStep = calcStep(yRange[1] - yRange[0]);

  const scale = useSceneScale({
    vp,
    xRange,
    yRange,
  });

  const handleStudyModeChange = (mode: "regression" | "independence") => {
    setStudyMode(mode);
  };

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (key.startsWith("freq")) {
      setIndPresetKey("free");
    }
  };

  // 预设数据集切换 (回归模式)
  const handleRegPresetSelect = (index: number) => {
    setRegPresetIndex(index);
    const p = REGRESSION_PRESETS[index];
    setBasePoints(p.points);
    if (p.recommendedModel) {
      setSelectedModel(p.recommendedModel);
    }
    handleParamChange("presetIndex", index);
  };

  // 预设情境切换 (独立性检验)
  const handleIndPresetSelect = (key: string) => {
    setIndPresetKey(key);
    if (key === "free") return;
    const index = Number(key);
    const p = INDEPENDENCE_PRESETS[index];
    if (p) {
      setParams((prev) => ({
        ...prev,
        presetIndex: index,
        freqA: p.a,
        freqB: p.b,
        freqC: p.c,
        freqD: p.d,
      }));
    }
  };

  // 重置参数
  const handleReset = () => {
    setParams({ ...defaultParams });
    setRegPresetIndex(0);
    setIndPresetKey("0");
    setSelectedModel("linear");
    setBasePoints(REGRESSION_PRESETS[0].points);
  };

  const isFreeIndMode = indPresetKey === "free";

  // 构建声明式控制面板配置参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let keys: string[] = [];

    if (studyMode === "regression") {
      keys = [
        "noise",
        "meanShiftY",
        ...(regPresetIndex === 4 ? ["outlierOffset"] : []),
        "showResidualSquares",
        "showResidualPlot",
      ];
    } else {
      // 独立性检验：自由探索开放全部参数，预设模式锁定题设
      if (isFreeIndMode) {
        keys = ["freqA", "freqB", "freqC", "freqD", "scaleMultiplier"];
      } else {
        keys = ["scaleMultiplier"];
      }
    }

    return keys
      .filter((k) => k in paramMeta)
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
          importance: meta.importance,
        };
      });
  }, [studyMode, regPresetIndex, isFreeIndMode, params]);

  // 计算看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-paired-data", params, {
      studyMode,
      selectedModel,
      points: activePoints,
    });
  }, [params, studyMode, selectedModel, activePoints]);

  // 回归方程或卡方算式的 LaTeX 文本
  const headerFormulaLatex = useMemo(() => {
    if (studyMode === "regression") {
      const fits = fitAllRegressionModels(activePoints);
      const fit = fits.find((m) => m.type === selectedModel) ?? fits[0];
      if (!fit || !fit.isValid) return "y = f(x)";
      return `${fit.name}: \\; ${fit.originalFormula} \\quad (R^2 = ${fit.rSquare.toFixed(3)}, \\text{SSE} = ${fit.sse.toFixed(2)})`;
    } else {
      const a = params.freqA ?? 85;
      const b = params.freqB ?? 15;
      const c = params.freqC ?? 40;
      const d = params.freqD ?? 60;
      const res = calculateIndependenceTest(a, b, c, d);
      return `\\chi^2 = \\frac{${res.n} \\times (${a} \\times ${d} - ${b} \\times ${c})^2}{${a + b} \\times ${c + d} \\times ${a + c} \\times ${b + d}} = ${res.chiSquare.toFixed(3)}`;
    }
  }, [studyMode, selectedModel, activePoints, params]);

  // 左屏教学提示与题设导引 (说明初始条件与核心设问)
  const tipConfig = useMemo(() => {
    if (studyMode === "regression") {
      const modelNameMap: Record<RegressionModelType, string> = {
        linear: "一元线性模型 $\\hat{y} = bx + a$",
        exponential: "指数模型 $y = c e^{kx}$（令 $z = \\ln y$ 线性化）",
        logarithmic: "对数模型 $y = a + b \\ln x$（令 $u = \\ln x$ 线性化）",
        power: "幂函数模型 $y = c x^k$（令 $u = \\ln x, z = \\ln y$ 线性化）",
        inverse:
          "双曲线逆模型 $y = a + \\frac{b}{x}$（令 $u = \\frac{1}{x}$ 线性化）",
      };
      return {
        variant: "info" as const,
        badge: `高考经典 · ${currentPreset?.name ?? "成对数据回归分析"}`,
        condition: `当前选定【${modelNameMap[selectedModel]}】，样本容量 $n=${activePoints.length}$。`,
        question:
          "通过最小二乘法拟合曲线，对比决定系数 $R^2$ 与残差平方和 $\\text{SSE}$，评估模型拟合优度与预报效果。",
      };
    }

    // independence
    if (indPresetKey === "free") {
      const a = params.freqA ?? 85;
      const b = params.freqB ?? 15;
      const c = params.freqC ?? 40;
      const d = params.freqD ?? 60;
      const totalN = a + b + c + d;
      return {
        variant: "danger" as const,
        badge: "自由探索 · 2×2 列联表",
        condition: `自定义四格观测频数 ($a=${a}, b=${b}, c=${c}, d=${d}$)，总样本容量 $n=${totalN}$。`,
        question:
          "计算卡方统计量 $\\chi^2 = \\frac{n(ad-bc)^2}{(a+b)(c+d)(a+c)(b+d)}$，对比临界值推断两分类变量是否关联。",
      };
    }

    const curInd =
      INDEPENDENCE_PRESETS[Number(indPresetKey)] ?? INDEPENDENCE_PRESETS[0];

    return {
      variant: "danger" as const,
      badge: `高考真题 · ${curInd.shortName}`,
      condition: curInd.conditionDesc,
      question: curInd.questionDesc,
    };
  }, [
    studyMode,
    selectedModel,
    currentPreset,
    indPresetKey,
    activePoints.length,
    params,
  ]);

  // 看板标题
  const panelTitle = useMemo(() => {
    return studyMode === "regression"
      ? "成对数据与回归分析看板"
      : "2×2 列联表独立性检验看板";
  }, [studyMode]);

  const indPresetGridItems = useMemo(() => {
    return [
      {
        key: "free",
        label: "自由探索",
      },
      ...INDEPENDENCE_PRESETS.map((p, idx) => ({
        key: String(idx),
        label: p.shortName,
      })),
    ];
  }, []);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 研究模式切换 */}
          <LeftPanelSection title="研究模块">
            <TabSwitcher
              tabs={[
                { key: "regression", label: "回归分析" },
                { key: "independence", label: "独立性检验" },
              ]}
              value={studyMode}
              onChange={handleStudyModeChange}
            />
          </LeftPanelSection>

          {/* 回归模式下的特定控制区 */}
          {studyMode === "regression" && (
            <>
              <LeftPanelSection title="回归模型类型选择">
                <TabSwitcher
                  tabs={[
                    { key: "linear", label: "线性" },
                    { key: "exponential", label: "指数" },
                    { key: "logarithmic", label: "对数" },
                    { key: "power", label: "幂函数" },
                    { key: "inverse", label: "双曲线逆" },
                  ]}
                  value={selectedModel}
                  onChange={(key) =>
                    setSelectedModel(key as RegressionModelType)
                  }
                />
              </LeftPanelSection>

              <LeftPanelSection title="高考真实数据集预设">
                <SelectGrid
                  items={REGRESSION_PRESETS.map((p, idx) => ({
                    key: String(idx),
                    label: p.name.split("：")[0] || p.name,
                  }))}
                  value={String(regPresetIndex)}
                  onChange={(k) => handleRegPresetSelect(Number(k))}
                  variant="filled"
                  columns={2}
                />
              </LeftPanelSection>
            </>
          )}

          {/* 独立性检验下的情景预设 */}
          {studyMode === "independence" && (
            <LeftPanelSection title="高考典型情境预设">
              <SelectGrid
                items={indPresetGridItems}
                value={indPresetKey}
                onChange={handleIndPresetSelect}
                variant="filled"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 参数与频数控制 */}
          <LeftPanelSection
            title={
              studyMode === "regression"
                ? "残差与扰动控制"
                : "四格频数与倍增调节"
            }
          >
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
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 公式与结果 KaTeX 顶部居中 */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm max-w-[90%] overflow-hidden">
            <KatexFormula formula={headerFormulaLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <PairedDataScene
              studyMode={studyMode}
              selectedModel={selectedModel}
              showResidualSquares={Boolean(params.showResidualSquares ?? 1)}
              showResidualPlot={Boolean(params.showResidualPlot ?? 0)}
              points={activePoints}
              onPointsChange={handlePointsChange}
              freqA={params.freqA ?? 85}
              freqB={params.freqB ?? 15}
              freqC={params.freqC ?? 40}
              freqD={params.freqD ?? 60}
              presetXName={currentPreset?.xName ?? "x"}
              presetYName={currentPreset?.yName ?? "y"}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              xStep={xStep}
              yStep={yStep}
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
