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
import { PairedDataScene } from "./components/PairedDataScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/pairedData";
import {
  REGRESSION_PRESETS,
  INDEPENDENCE_PRESETS,
  calculateLinearRegression,
  calculateIndependenceTest,
  Point2D,
} from "@/math/pairedData";

export function PairedDataAnimation() {
  // 研究模式：'regression' (一元线性回归) | 'independence' (2x2 独立性检验)
  const [studyMode, setStudyMode] = useState<"regression" | "independence">(
    "regression",
  );

  // 统一参数管理
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 回归模式下特有的当前点集状态 (支持拖拽散点)
  const [regPresetIndex, setRegPresetIndex] = useState<number>(0);
  const [points, setPoints] = useState<Point2D[]>(
    () => REGRESSION_PRESETS[0].points,
  );

  // 独立性检验特有的当前预设索引
  const [indPresetIndex, setIndPresetIndex] = useState<number>(0);

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

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 预设数据集切换 (回归模式)
  const handleRegPresetSelect = (index: number) => {
    setRegPresetIndex(index);
    setPoints(REGRESSION_PRESETS[index].points);
    handleParamChange("presetIndex", index);
  };

  // 预设情境切换 (独立性检验)
  const handleIndPresetSelect = (index: number) => {
    setIndPresetIndex(index);
    const p = INDEPENDENCE_PRESETS[index];
    setParams((prev) => ({
      ...prev,
      presetIndex: index,
      freqA: p.a,
      freqB: p.b,
      freqC: p.c,
      freqD: p.d,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({ ...defaultParams });
    setRegPresetIndex(0);
    setIndPresetIndex(0);
    setPoints(REGRESSION_PRESETS[0].points);
  };

  // 构建声明式控制面板配置参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      regression: ["noise"],
      independence: ["freqA", "freqB", "freqC", "freqD"],
    };
    const keys = keysByMode[studyMode] ?? Object.keys(paramMeta);

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
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance as any,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 计算看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-paired-data", params, {
      studyMode,
      points,
    });
  }, [params, studyMode, points]);

  // 回归方程或卡方算式的 LaTeX 文本
  const headerFormulaLatex = useMemo(() => {
    if (studyMode === "regression") {
      const res = calculateLinearRegression(points);
      if (!res.isValid) return "\\text{数据无法求解线性回归方程}";
      const bStr = res.b.toFixed(3);
      const aSign = res.a >= 0 ? "+" : "-";
      const aStr = Math.abs(res.a).toFixed(3);
      return `\\hat{y} = ${bStr}x ${aSign} ${aStr} \\quad (r = ${res.r.toFixed(3)}, R^2 = ${res.rSquare.toFixed(3)})`;
    } else {
      const a = params.freqA ?? 85;
      const b = params.freqB ?? 15;
      const c = params.freqC ?? 40;
      const d = params.freqD ?? 60;
      const res = calculateIndependenceTest(a, b, c, d);
      return `\\chi^2 = \\frac{${res.n} \\times (${a} \\times ${d} - ${b} \\times ${c})^2}{${a + b} \\times ${c + d} \\times ${a + c} \\times ${b + d}} = ${res.chiSquare.toFixed(3)}`;
    }
  }, [studyMode, points, params]);

  // 看板标题
  const panelTitle = useMemo(() => {
    return studyMode === "regression"
      ? "一元线性回归分析看板"
      : "2×2 列联表独立性检验看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 研究模式选择 */}
          <LeftPanelSection
            title="统计分析模式"
            subtitle="成对数据分析 vs 列联表检验"
          >
            <SelectGrid
              items={[
                {
                  key: "regression",
                  label: "一元线性回归分析",
                  fullWidth: true,
                },
                {
                  key: "independence",
                  label: "2×2 独立性检验",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as any)}
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          {/* 回归模式下的高考例题预设 */}
          {studyMode === "regression" && (
            <LeftPanelSection
              title="高考典型例题预设"
              subtitle="选择真实考题背景数据"
            >
              <SelectGrid
                items={REGRESSION_PRESETS.map((p, idx) => ({
                  key: String(idx),
                  label: p.name,
                  fullWidth: true,
                }))}
                value={String(regPresetIndex)}
                onChange={(k) => handleRegPresetSelect(Number(k))}
                variant="filled"
                columns={1}
              />
            </LeftPanelSection>
          )}

          {/* 独立性检验下的情景预设 */}
          {studyMode === "independence" && (
            <LeftPanelSection
              title="列联表测试情境预设"
              subtitle="选择高考分类变量应用"
            >
              <SelectGrid
                items={INDEPENDENCE_PRESETS.map((p, idx) => ({
                  key: String(idx),
                  label: p.name,
                  fullWidth: true,
                }))}
                value={String(indPresetIndex)}
                onChange={(k) => handleIndPresetSelect(Number(k))}
                variant="filled"
                columns={1}
              />
            </LeftPanelSection>
          )}

          {/* 参数与频数控制 */}
          <LeftPanelSection
            title={
              studyMode === "regression"
                ? "散点控制"
                : "列联表频数调节 (a,b,c,d)"
            }
            subtitle={
              studyMode === "regression" ? "拖动散点或微调" : "拖动滑块改变频数"
            }
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
              points={points}
              onPointsChange={setPoints}
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
