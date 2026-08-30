import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import {
  SceneLegend,
  type SceneLegendItem,
} from "@/components/Math/SceneLegend";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { ZeroScene } from "./components/ZeroScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  FUNC_ZERO_MODELS,
} from "@/data/registries/funcZero";

const MODEL_KEYS = ["cubic", "logMixed", "expMixed", "counterExample"];

export function FuncZeroAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-5, 6],
    yRange: [-4.5, 4.5],
  });

  const modelIdx = Math.max(
    0,
    Math.min(MODEL_KEYS.length - 1, Math.round(params.modelKey ?? 0)),
  );
  const modelKey = MODEL_KEYS[modelIdx] ?? "cubic";
  const currentModel = FUNC_ZERO_MODELS[modelKey] ?? FUNC_ZERO_MODELS.cubic;

  const mathData = useMemo(
    () => buildMathQuantities("anim-func-zero", params),
    [params],
  );

  const handleModelChange = useCallback((key: string) => {
    const idx = MODEL_KEYS.indexOf(key);
    if (idx >= 0) {
      const targetModel = FUNC_ZERO_MODELS[key];
      setParams({
        modelKey: idx,
        intervalM: targetModel.defaultM,
        intervalN: targetModel.defaultN,
        bisectionSteps: 3,
      });
    }
  }, []);

  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  // 动态参数范围自适应
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["intervalM", "intervalN", "bisectionSteps"];
    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        let min = meta.min;
        let max = meta.max;
        if (key === "intervalM") {
          if (currentModel.minM !== undefined) min = currentModel.minM;
          if (currentModel.maxM !== undefined) max = currentModel.maxM;
        }
        if (key === "intervalN") {
          if (currentModel.minN !== undefined) min = currentModel.minN;
          if (currentModel.maxN !== undefined) max = currentModel.maxN;
        }

        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min,
          max,
          step: meta.step ?? 0.1,
          importance: meta.importance,
        };
      });
  }, [params, currentModel]);

  const m = params.intervalM ?? currentModel.defaultM;
  const n = params.intervalN ?? currentModel.defaultN;
  const steps = Math.max(1, Math.round(params.bisectionSteps ?? 3));

  const fA = Number.isFinite(m) ? currentModel.fn(m) : NaN;
  const fB = Number.isFinite(n) ? currentModel.fn(n) : NaN;
  const prod = fA * fB;

  // 左上角精准公式卡片（包含色彩绑定）
  const formulaHeaderLatex = useMemo(() => {
    const fnLatex = currentModel.formula;
    const aColor = MATH_COLORS.paramPrimary;
    const bColor = MATH_COLORS.paramSecondary;
    if (prod < 0) {
      return `${fnLatex} \\quad [\\color{${aColor}}{a}, \\color{${bColor}}{b}] = [${m.toFixed(1).replace(/\.0$/, "")}, ${n.toFixed(1).replace(/\.0$/, "")}] \\implies f(\\color{${aColor}}{a})f(\\color{${bColor}}{b}) < 0`;
    }
    if (prod > 0) {
      return `${fnLatex} \\quad [\\color{${aColor}}{a}, \\color{${bColor}}{b}] = [${m.toFixed(1).replace(/\.0$/, "")}, ${n.toFixed(1).replace(/\.0$/, "")}] \\implies f(\\color{${aColor}}{a})f(\\color{${bColor}}{b}) > 0 \\text{ (同号)}`;
    }
    return `${fnLatex} \\quad 端点处 f(x)=0`;
  }, [currentModel.formula, m, n, prod]);

  // 动态教学提示配置（精炼去重）
  const tipConfig = useMemo(() => {
    const len = Math.abs(n - m) / Math.pow(2, steps);

    if (modelKey === "counterExample") {
      return {
        variant: "warning" as const,
        badge: "高考易错点 · 充分非必要辨析",
        condition: `区间 [${m.toFixed(1).replace(/\.0$/, "")}, ${n.toFixed(1).replace(/\.0$/, "")}] 端点同号 f(a)·f(b) > 0，但不代表无解：内部实际包含 2 个零点。`,
        question:
          "核心启示：定理异号条件是零点存在的【充分条件】而非【必要条件】。",
      };
    }

    return {
      variant: "primary" as const,
      badge: `高考必考 · ${currentModel.name}`,
      condition: `在 [${m.toFixed(1).replace(/\.0$/, "")}, ${n.toFixed(1).replace(/\.0$/, "")}] 上连续且严格单调，由 f(a)·f(b) < 0 锁定唯一零点。`,
      question: `二分迭代 ${steps} 次，误差限折半至 ε ≤ ${len.toFixed(4)}，逼近根 x* ≈ ${currentModel.approxZero.toFixed(3)}。`,
    };
  }, [m, n, steps, currentModel, modelKey]);

  // 图例说明项（精简几何语义）
  const legendItems: SceneLegendItem[] = useMemo(() => {
    return [
      {
        formula: currentModel.formula.split("=")[0],
        color: MATH_COLORS.function,
        style: "solid",
      },
      {
        label: "初始边界 a, b",
        color: MATH_COLORS.paramPrimary,
        style: "dash",
      },
      {
        label: `二分中点 c_{${steps}}`,
        color: MATH_COLORS.paramTertiary,
        style: "point",
      },
      {
        label: "收敛误差区间",
        color: MATH_COLORS.paramTertiary,
        style: "area",
      },
    ];
  }, [currentModel.formula, steps]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模型选择 */}
          <LeftPanelSection title="函数模型">
            <SelectGrid
              items={MODEL_KEYS.map((key) => {
                const item = FUNC_ZERO_MODELS[key];
                return {
                  key: item.key,
                  label: item.name,
                  formula: item.formula,
                  fullWidth: true,
                };
              })}
              value={modelKey}
              onChange={handleModelChange}
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          {/* 2. 参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() =>
                setParams({
                  modelKey: modelIdx,
                  intervalM: currentModel.defaultM,
                  intervalN: currentModel.defaultN,
                  bisectionSteps: 3,
                })
              }
            />
          </LeftPanelSection>

          {/* 3. 教学导引 */}
          <LeftPanelSection title="教学导引" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【特征】
                  </span>
                  <span className="text-neutral-600 ml-1">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【收敛】
                  </span>
                  <span className="text-neutral-600 ml-1">
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
          {/* 左上角当前函数公式卡片 */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={formulaHeaderLatex} mode="inline" />
          </div>

          {/* 右下角规范毛玻璃图例 */}
          <SceneLegend items={legendItems} />

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ZeroScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
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
          title="零点逼近看板"
        />
      }
    />
  );
}
