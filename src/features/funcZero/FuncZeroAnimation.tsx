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
    () => buildMathQuantities("anim-func-zero", params, { modelKey }),
    [params, modelKey],
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

  // 动态教学提示配置（规范初始条件与探究设问，严禁提前剧透答案）
  const tipConfig = useMemo(() => {
    const aStr = m.toFixed(1).replace(/\.0$/, "");
    const bStr = n.toFixed(1).replace(/\.0$/, "");

    if (modelKey === "counterExample") {
      return {
        variant: "warning" as const,
        badge: "高考易错辨析 · 充分非必要模型",
        condition: `研究函数 $f(x) = x^2 - 2x$ 在区间 $[${aStr}, ${bStr}]$ 上的零点，当前端点满足 $f(a) \\cdot f(b) > 0$。`,
        question:
          "(1) 检验当前区间是否满足零点存在性定理前提？(2) 思考端点同号时区间内是否一定不存在零点？说明依据。",
      };
    }

    return {
      variant: "primary" as const,
      badge: `高考必考 · ${currentModel.name}`,
      condition: `在区间 $[${aStr}, ${bStr}]$ 上探究方程 $${currentModel.formula}$ 的解，当前迭代步数设定为 $k = ${steps}$。`,
      question: `(1) 验证端点是否满足 $f(a) \\cdot f(b) < 0$ 并判定零点唯一性；(2) 运用二分法迭代计算，求零点近似值并评估误差限。`,
    };
  }, [m, n, steps, currentModel.name, currentModel.formula, modelKey]);

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
                  description:
                    item.key === "counterExample"
                      ? "端点同号多根辨析"
                      : "单调连续必考模型",
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
            <TipCard
              variant={tipConfig.variant}
              badge={tipConfig.badge}
              condition={tipConfig.condition}
              question={tipConfig.question}
            />
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
      right={<MathPanel {...mathData} title="零点逼近看板" />}
    />
  );
}
