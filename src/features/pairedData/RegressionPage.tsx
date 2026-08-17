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
  fitAllRegressionModels,
  RegressionModelType,
  Point2D,
} from "@/math/pairedData";

export function RegressionPage() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));
  const [selectedModel, setSelectedModel] =
    useState<RegressionModelType>("linear");
  const [regPresetIndex, setRegPresetIndex] = useState<number>(0);
  const [basePoints, setBasePoints] = useState<Point2D[]>(
    () => REGRESSION_PRESETS[0].points,
  );

  // 根据当前 noise 强度动态计算活跃散点集 (完全同步左屏滑块)
  const activePoints = useMemo(() => {
    const noise = params.noise ?? 0;
    if (noise <= 0.001) return basePoints;
    return basePoints.map((p, idx) => {
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

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const currentPreset = REGRESSION_PRESETS[regPresetIndex];
  const xRange: [number, number] = currentPreset.xRange;
  const yRange: [number, number] = currentPreset.yRange;

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

  const handleRegPresetSelect = (index: number) => {
    setRegPresetIndex(index);
    const p = REGRESSION_PRESETS[index];
    setBasePoints(p.points);
    if (p.recommendedModel) {
      setSelectedModel(p.recommendedModel);
    }
    handleParamChange("presetIndex", index);
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
    setRegPresetIndex(0);
    setSelectedModel("linear");
    setBasePoints(REGRESSION_PRESETS[0].points);
  };

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["noise", "showResidualSquares", "showResidualPlot"];
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
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params]);

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-paired-data", params, {
      studyMode: "regression",
      selectedModel,
      points: activePoints,
    });
  }, [params, selectedModel, activePoints]);

  const headerFormulaLatex = useMemo(() => {
    const fits = fitAllRegressionModels(activePoints);
    const fit = fits.find((m) => m.type === selectedModel) ?? fits[0];
    if (!fit || !fit.isValid) return "\\text{当前数据无法求解该回归模型}";
    return `${fit.name}: \\; ${fit.originalFormula} \\quad (R^2 = ${fit.rSquare.toFixed(3)}, \\text{SSE} = ${fit.sse.toFixed(2)})`;
  }, [selectedModel, activePoints]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="回归模型选择"
            subtitle="新高考线性化转换与优度比较"
          >
            <SelectGrid
              items={[
                {
                  key: "linear",
                  label: "一元线性模型",
                  formula: "\\hat{y} = bx + a",
                  fullWidth: true,
                },
                {
                  key: "exponential",
                  label: "指数模型 (z=lny)",
                  formula: "y = c e^{kx}",
                  fullWidth: true,
                },
                {
                  key: "logarithmic",
                  label: "对数模型 (u=lnx)",
                  formula: "y = a + b\\ln x",
                  fullWidth: true,
                },
                {
                  key: "power",
                  label: "幂函数模型",
                  formula: "y = c x^k",
                  fullWidth: true,
                },
                {
                  key: "inverse",
                  label: "双曲线逆模型",
                  formula: "y = a + \\frac{b}{x}",
                  fullWidth: true,
                },
              ]}
              value={selectedModel}
              onChange={(k) => setSelectedModel(k as RegressionModelType)}
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="高考经典例题情境"
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

          <LeftPanelSection
            title="残差与扰动控制"
            subtitle="支持拖拽散点 / 控制残差正方形与残差图"
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
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm max-w-[90%] overflow-hidden">
            <KatexFormula formula={headerFormulaLatex} mode="inline" />
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <PairedDataScene
              studyMode="regression"
              selectedModel={selectedModel}
              showResidualSquares={Boolean(params.showResidualSquares ?? 1)}
              showResidualPlot={Boolean(params.showResidualPlot ?? 0)}
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
