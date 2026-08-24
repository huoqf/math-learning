import { useState, useMemo } from "react";
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
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { TranscendentalScene } from "./components/TranscendentalScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/transcendental";
import type { TranscendentalMode } from "@/math/transcendental";

export function TranscendentalAnimation() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));
  const [mode, setMode] = useState<TranscendentalMode>("exp");
  const [subMode, setSubMode] = useState<string>("tangent_0");

  // 1. Viewport 与自适应画布 (840x650 full preset)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 2. 比例尺 (超越函数范畴: x在[-4, 4], y在[-3, 5])
  const scale = useSceneScale({
    vp,
    xRange: [-4, 4],
    yRange: [-3, 5],
  });

  // 3. 右屏数学量组装
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-derivative-transcendental", params, {
        mode,
        subMode,
      }),
    [params, mode, subMode],
  );

  // 4. 左屏按模式过滤参数 (铁律：必须按 mode 过滤并包含在依赖项中)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<TranscendentalMode, string[]> = {
      exp: ["x0"],
      log: ["x0"],
      chain: [],
      param: ["a"],
    };

    const keys = keysByMode[mode] ?? Object.keys(paramMeta);
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
  }, [params, mode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 5. 悬浮公式字符串拼接（三位一体色彩绑定：paramPrimary #EF4444）
  const equationLatex = useMemo(() => {
    const pColor = MATH_COLORS.paramPrimary;
    if (mode === "exp") {
      const x0Val = params.x0.toFixed(1);
      return `f(x) = e^x \\ge \\color{${pColor}}{e^{${x0Val}}}(x - \\color{${pColor}}{${x0Val}}) + e^{${x0Val}} \\ge x + 1`;
    } else if (mode === "log") {
      const x0Val = params.x0 > 0 ? params.x0.toFixed(1) : "1.0";
      return `g(x) = \\ln x \\le \\frac{1}{\\color{${pColor}}{${x0Val}}}(x - \\color{${pColor}}{${x0Val}}) + \\ln \\color{${pColor}}{${x0Val}} \\le x - 1`;
    } else if (mode === "chain") {
      return `\\ln x + 1 \\le x \\le e^{x-1} \\quad (x > 0)`;
    } else {
      const aVal = params.a.toFixed(1);
      if (subMode === "exp_ax") {
        return `e^x \\ge \\color{${pColor}}{${aVal}} x \\quad (a_{\\text{临界}} = e)`;
      }
      return `e^x \\ge \\color{${pColor}}{${aVal}} x + 1 \\quad (a_{\\text{临界}} = 1)`;
    }
  }, [mode, subMode, params.x0, params.a]);

  // 6. 模式切换重置参数
  const handleModeChange = (newMode: string) => {
    const m = newMode as TranscendentalMode;
    setMode(m);
    if (m === "exp") {
      setSubMode("tangent_0");
      setParams((prev) => ({ ...prev, x0: 0.0 }));
    } else if (m === "log") {
      setSubMode("tangent_1");
      setParams((prev) => ({ ...prev, x0: 1.0 }));
    } else if (m === "chain") {
      setSubMode("default");
    } else if (m === "param") {
      setSubMode("exp_ax_1");
      setParams((prev) => ({ ...prev, a: 1.0 }));
    }
  };

  // 教学导引与题设背景配置
  const tipConfig = useMemo(() => {
    switch (mode) {
      case "exp":
        return {
          variant: "primary" as const,
          badge: "高考压轴 · 指数基准切线放缩 eˣ ≥ x+1",
          condition: "给定超越指数函数 f(x) = eˣ，切点为 x₀ (默认 (0, 1))。",
          question:
            "探究在切点处的切线方程，并求证不等式 eˣ ≥ x+1（及相关变体）在实数域恒成立。",
        };
      case "log":
        return {
          variant: "info" as const,
          badge: "高考压轴 · 对数基准切线放缩 ln x ≤ x-1",
          condition:
            "给定超越对数函数 g(x) = ln x (x > 0)，切点为 x₀ (默认 (1, 0))。",
          question:
            "探究在切点处的切线方程，并求证不等式 ln x ≤ x-1 在正实数域恒成立。",
        };
      case "chain":
        return {
          variant: "warning" as const,
          badge: "高考压轴 · 对偶双基准夹逼不等式链",
          condition:
            "在正实数域 x > 0 上同时考察指数曲线、对数曲线与一次函数 y = x。",
          question:
            "探究公切点 x=1 处的切线特征，求证双基准夹逼链 ln x + 1 ≤ x ≤ e^{x-1} 恒成立。",
        };
      case "param":
        return {
          variant: "primary" as const,
          badge: "高考压轴 · 切线临界与恒成立求参",
          condition: `已知不等式 ${subMode === "exp_ax" ? "eˣ ≥ ax" : "eˣ ≥ ax + 1"} 恒成立，待求参数为 a。`,
          question: "求实数参数 a 的最大临界值，使得不等式在定义域内恒成立。",
        };
      default:
        return {
          variant: "primary" as const,
          badge: "高考压轴 · 超越函数切线放缩",
          condition: "考察基准超越函数 (eˣ 与 ln x) 与切线方程的关系。",
          question: "求切线方程并证明相关切线放缩不等式。",
        };
    }
  }, [mode, subMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择区 */}
          <LeftPanelSection
            title="模式选择"
            subtitle="高考压轴切线放缩四大核心模型"
          >
            <SelectGrid
              items={[
                { key: "exp", label: "指数放缩", formula: "e^x \\ge x+1" },
                { key: "log", label: "对数放缩", formula: "\\ln x \\le x-1" },
                {
                  key: "chain",
                  label: "双基准对偶",
                  formula: "\\ln x+1 \\le x \\le e^{x-1}",
                },
                {
                  key: "param",
                  label: "切线临界求参",
                  formula: "e^x \\ge ax+1",
                },
              ]}
              value={mode}
              onChange={handleModeChange}
              columns={1}
            />
          </LeftPanelSection>

          {/* 子类型选择区 (SelectGrid) */}
          {mode === "exp" && (
            <LeftPanelSection title="不等式变体" subtitle="切换常见放缩切点">
              <SelectGrid
                items={[
                  {
                    key: "tangent_0",
                    label: "基准切点 x₀=0",
                    formula: "e^x \\ge x+1",
                  },
                  {
                    key: "tangent_1",
                    label: "切点 x₀=1",
                    formula: "e^x \\ge ex",
                  },
                  {
                    key: "shift_1",
                    label: "平移变体",
                    formula: "e^{x-1} \\ge x",
                    fullWidth: true,
                  },
                ]}
                value={subMode}
                onChange={(k) => {
                  setSubMode(k);
                  if (k === "tangent_0") handleParamChange("x0", 0);
                  if (k === "tangent_1") handleParamChange("x0", 1);
                  if (k === "shift_1") handleParamChange("x0", 1);
                }}
              />
            </LeftPanelSection>
          )}

          {mode === "log" && (
            <LeftPanelSection title="不等式变体" subtitle="切换常见对数放缩">
              <SelectGrid
                items={[
                  {
                    key: "tangent_1",
                    label: "基准切点 x₀=1",
                    formula: "\\ln x \\le x-1",
                  },
                  {
                    key: "tangent_e",
                    label: "切点 x₀=e",
                    formula: "\\ln x \\le \\frac{x}{e}",
                  },
                  {
                    key: "quadratic_bound",
                    label: "二次放缩",
                    formula: "\\ln x \\le \\frac{1}{2}(x^2-1)",
                    fullWidth: true,
                    description: "利用 upper bound 进一步二次放缩",
                  },
                ]}
                value={subMode}
                onChange={(k) => {
                  setSubMode(k);
                  if (k === "tangent_1") handleParamChange("x0", 1.0);
                  if (k === "tangent_e") handleParamChange("x0", 2.7);
                }}
              />
            </LeftPanelSection>
          )}

          {mode === "param" && (
            <LeftPanelSection
              title="恒成立模型"
              subtitle="选择常考切线临界大题题型"
            >
              <SelectGrid
                items={[
                  {
                    key: "exp_ax_1",
                    label: "定点 (0, 1)",
                    formula: "e^x \\ge ax+1",
                  },
                  {
                    key: "exp_ax",
                    label: "过原点 (0, 0)",
                    formula: "e^x \\ge ax",
                  },
                ]}
                value={subMode}
                onChange={(k) => {
                  setSubMode(k);
                  if (k === "exp_ax_1") handleParamChange("a", 1.0);
                  if (k === "exp_ax") handleParamChange("a", 2.7);
                }}
              />
            </LeftPanelSection>
          )}

          {/* 参数调节区 */}
          {paramConfigs.length > 0 && (
            <LeftPanelSection title="参数调节" subtitle="拖动滑块或拖拽切点">
              <ParamControl
                params={paramConfigs}
                onParamChange={handleParamChange}
                onReset={() => setParams({ ...defaultParams })}
              />
            </LeftPanelSection>
          )}

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
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 悬浮公式展示区 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* Svg 画布容器 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TranscendentalScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              mode={mode}
              subMode={subMode}
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
          title="切线放缩模型看板"
        />
      }
    />
  );
}
