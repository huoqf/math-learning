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
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { useScenario } from "@/hooks/useScenario";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { TranscendentalScene } from "./components/TranscendentalScene";
import { SceneLegend } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  transcendentalScenarios,
} from "@/data/registries/transcendental";
import type { TranscendentalMode } from "@/math/transcendental";

export function TranscendentalAnimation() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));
  const [mode, setMode] = useState<TranscendentalMode>("exp");
  const [preset, setPreset] = useState<string>("tangent_0");
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

  // 3. 当前探究模式下的统一场景列表 (SSOT)
  const currentScenarios = useMemo(() => {
    return transcendentalScenarios[mode] ?? [];
  }, [mode]);

  // 4. 数学情景统一驱动 Hook (三屏严格对账)
  const { tipProps, selectScenario, isParamLocked } = useScenario({
    scenarios: currentScenarios,
    activeKey: preset,
    params,
    onParamsChange: setParams,
  });

  // 5. 右屏数学量组装
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-derivative-transcendental", params, {
        mode,
        subMode,
        preset,
      }),
    [params, mode, subMode, preset],
  );

  // 6. 左屏动态参数配置（根据模式动态调整定义域与特征刻度）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    if (mode === "exp") {
      return [
        {
          key: "x0",
          label: "切点横坐标 x₀",
          labelFormula: `\\text{切点 } \\color{${MATH_COLORS.paramPrimary}}{x_0}`,
          group: "切线控制参数",
          value: params.x0 ?? 0,
          min: -2.5,
          max: 2.0,
          step: 0.1,
          description: "控制 $e^x$ 切点位置",
          descriptionFormula: `控制 $e^x$ 切线切点 $\\color{${MATH_COLORS.paramPrimary}}{x_0}$`,
          importance: "core",
          disabled: isParamLocked("x0"),
          marks: [
            {
              value: 0,
              variant: "critical",
              label: "基准一",
              labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_0=0}`,
            },
            {
              value: 1,
              label: "基准二",
              labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_0=1}`,
            },
          ],
        },
      ];
    } else if (mode === "log") {
      return [
        {
          key: "x0",
          label: "切点横坐标 x₀",
          labelFormula: `\\text{切点 } \\color{${MATH_COLORS.paramPrimary}}{x_0}`,
          group: "切线控制参数",
          value: Math.max(0.1, params.x0 ?? 1.0),
          min: 0.1,
          max: 3.5,
          step: 0.1,
          description: "控制 $\\ln x$ 切点位置 ($x > 0$)",
          descriptionFormula: `定义域保护 $\\color{${MATH_COLORS.paramPrimary}}{x_0} > 0$`,
          importance: "core",
          disabled: isParamLocked("x0"),
          marks: [
            {
              value: 1,
              variant: "critical",
              label: "基准一",
              labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_0=1}`,
            },
            {
              value: 2.7,
              label: "基准二",
              labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x_0=e}`,
            },
          ],
        },
      ];
    } else if (mode === "chain") {
      return [
        {
          key: "x0",
          label: "自变量考察点 x",
          labelFormula: `\\text{自变量 } \\color{${MATH_COLORS.paramPrimary}}{x}`,
          group: "自变量位置",
          value: Math.max(0.1, params.x0 ?? 1.0),
          min: 0.2,
          max: 3.0,
          step: 0.1,
          description: "观察三曲线夹逼态势",
          descriptionFormula: "观察 $x>0$ 处的包络差",
          importance: "core",
          disabled: isParamLocked("x0"),
          marks: [
            {
              value: 1,
              variant: "critical",
              label: "公切点",
              labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{x=1}`,
            },
          ],
        },
      ];
    } else {
      return [
        {
          key: "a",
          label: "直线斜率参数 a",
          labelFormula: `\\text{斜率 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
          group: "参变直线方程",
          value: params.a ?? 1.0,
          min: -1.0,
          max: 4.0,
          step: 0.1,
          description:
            subMode === "exp_ax"
              ? "直线 $y = ax$ 斜率"
              : "直线 $y = ax + 1$ 斜率",
          importance: "core",
          disabled: isParamLocked("a"),
          marks: [
            {
              value: 0,
              label: "水平",
              labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a=0}`,
            },
            {
              value: 1,
              variant: "critical",
              label: "定点临界",
              labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a=1}`,
            },
            {
              value: 2.7,
              variant: "critical",
              label: "原点临界",
              labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a=e}`,
            },
          ],
        },
      ];
    }
  }, [params, mode, subMode, isParamLocked]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 画布拖拽动点时自动解耦切回自由探究
  const handleSceneDrag = useCallback((key: string, value: number) => {
    setPreset("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  // 7. 悬浮公式字符串拼接（三位一体色彩绑定：paramPrimary #EF4444）
  const equationLatex = useMemo(() => {
    const pColor = MATH_COLORS.paramPrimary;
    if (mode === "exp") {
      const x0Val = params.x0.toFixed(1);
      if (subMode === "shift_1") {
        return `f(x) = e^{x-1} \\ge \\color{${pColor}}{x}`;
      } else if (subMode === "tangent_1") {
        return `f(x) = e^x \\ge \\color{${pColor}}{e}x`;
      } else if (subMode === "tangent_0") {
        return `f(x) = e^x \\ge \\color{${pColor}}{x + 1}`;
      }
      return `f(x) = e^x \\ge \\color{${pColor}}{e^{${x0Val}}}(x - \\color{${pColor}}{${x0Val}}) + e^{${x0Val}}`;
    } else if (mode === "log") {
      const x0Val = params.x0 > 0 ? params.x0.toFixed(1) : "1.0";
      if (subMode === "quadratic_bound") {
        return `g(x) = \\ln x \\le \\color{${pColor}}{\\frac{x^2-1}{2}} \\le x - 1`;
      } else if (subMode === "tangent_e") {
        return `g(x) = \\ln x \\le \\color{${pColor}}{\\frac{x}{e}}`;
      } else if (subMode === "tangent_1") {
        return `g(x) = \\ln x \\le \\color{${pColor}}{x - 1}`;
      }
      return `g(x) = \\ln x \\le \\frac{1}{\\color{${pColor}}{${x0Val}}}(x - \\color{${pColor}}{${x0Val}}) + \\ln \\color{${pColor}}{${x0Val}}`;
    } else if (mode === "chain") {
      const x0Val = (params.x0 > 0 ? params.x0 : 1.0).toFixed(1);
      return `\\ln \\color{${pColor}}{${x0Val}} + 1 \\le \\color{${pColor}}{${x0Val}} \\le e^{\\color{${pColor}}{${x0Val}} - 1}`;
    } else {
      const aVal = params.a.toFixed(1);
      if (subMode === "exp_ax") {
        return `e^x \\ge \\color{${pColor}}{${aVal}} x \\quad (a_{\\text{临界}} = e)`;
      }
      return `e^x \\ge \\color{${pColor}}{${aVal}} x + 1 \\quad (a_{\\text{临界}} = 1)`;
    }
  }, [mode, subMode, params.x0, params.a]);

  // 8. 模式切换重置参数与默认情景
  const handleModeChange = (newMode: string) => {
    const m = newMode as TranscendentalMode;
    setMode(m);
    if (m === "exp") {
      setPreset("tangent_0");
      setSubMode("tangent_0");
      setParams((prev) => ({ ...prev, x0: 0.0 }));
    } else if (m === "log") {
      setPreset("tangent_1");
      setSubMode("tangent_1");
      setParams((prev) => ({ ...prev, x0: 1.0 }));
    } else if (m === "chain") {
      setPreset("tangent_1");
      setSubMode("default");
      setParams((prev) => ({ ...prev, x0: 1.0 }));
    } else if (m === "param") {
      setPreset("exp_ax_1_crit");
      setSubMode("exp_ax_1");
      setParams((prev) => ({ ...prev, a: 1.0 }));
    }
  };

  // 9. 预设情景选择回调 (useScenario 自动派发参数并特化 subMode)
  const handleScenarioChange = (k: string) => {
    setPreset(k);
    selectScenario(k);

    if (mode === "exp") {
      if (k === "shift_1") {
        setSubMode("shift_1");
      } else if (k === "tangent_1") {
        setSubMode("tangent_1");
      } else {
        setSubMode("tangent_0");
      }
    } else if (mode === "log") {
      if (k === "quadratic_bound") {
        setSubMode("quadratic_bound");
      } else if (k === "tangent_e") {
        setSubMode("tangent_e");
      } else {
        setSubMode("tangent_1");
      }
    } else if (mode === "param") {
      if (k === "exp_ax_crit") {
        setSubMode("exp_ax");
      } else {
        setSubMode("exp_ax_1");
      }
    }
  };

  // 右下角图例配置 (模式专属)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (mode === "exp") {
      const isShift = subMode === "shift_1";
      const isTangent1 = subMode === "tangent_1";
      return [
        {
          color: MATH_COLORS.function,
          formula: isShift ? "f(x) = e^{x-1}" : "f(x) = e^x",
          style: "solid",
        },
        {
          color: MATH_COLORS.tangentLine,
          label: isTangent1 ? "次级切线" : "基准切线",
          formula: isShift ? "y = x" : isTangent1 ? "y = ex" : "y = x + 1",
          style: "dash",
        },
        {
          color: MATH_COLORS.focusPoint,
          label: isTangent1 ? "次级切点" : "基准切点",
          formula: isShift
            ? "P_0(1, 1)"
            : isTangent1
              ? "P_1(1, e)"
              : "P_0(0, 1)",
          style: "point",
        },
        {
          color: MATH_COLORS.paramPrimary,
          label: "动切点",
          formula: "P(x_0, f(x_0))",
          style: "point",
        },
        {
          color: MATH_COLORS.paramTertiary,
          label: "差值阴影区",
          style: "area",
        },
      ];
    } else if (mode === "log") {
      const isQuad = subMode === "quadratic_bound";
      const isTangentE = subMode === "tangent_e";
      return [
        {
          color: MATH_COLORS.function,
          formula: "g(x) = \\ln x",
          style: "solid",
        },
        {
          color: isQuad ? MATH_COLORS.paramSecondary : MATH_COLORS.tangentLine,
          label: isQuad
            ? "二次放缩上界"
            : isTangentE
              ? "次级切线上界"
              : "线性切线上界",
          formula: isQuad
            ? "y = \\frac{x^2-1}{2}"
            : isTangentE
              ? "y = \\frac{x}{e}"
              : "y = x - 1",
          style: "dash",
        },
        {
          color: MATH_COLORS.focusPoint,
          label: isTangentE ? "次级切点" : "基准切点",
          formula: isTangentE ? "P_1(e, 1)" : "P_0(1, 0)",
          style: "point",
        },
        {
          color: MATH_COLORS.paramPrimary,
          label: "动切点",
          formula: "P(x_0, \\ln x_0)",
          style: "point",
        },
        {
          color: MATH_COLORS.paramTertiary,
          label: "放缩差值区",
          style: "area",
        },
      ];
    } else if (mode === "chain") {
      return [
        {
          color: MATH_COLORS.function,
          label: "上界指数",
          formula: "y = e^{x-1}",
          style: "solid",
        },
        {
          color: MATH_COLORS.functionTransformed,
          label: "下界对数",
          formula: "y = \\ln x + 1",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramSecondary,
          label: "中轴公切线",
          formula: "y = x",
          style: "dash",
        },
        {
          color: MATH_COLORS.paramSecondary,
          label: "公共切点",
          formula: "P_0(1, 1)",
          style: "point",
        },
        {
          color: MATH_COLORS.paramPrimary,
          label: "中轴动点",
          formula: "P(x_0, x_0)",
          style: "point",
        },
      ];
    } else {
      const isExpAx = subMode === "exp_ax";
      return [
        {
          color: MATH_COLORS.function,
          formula: "y = e^x",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramPrimary,
          formula: isExpAx ? "y = ax" : "y = ax + 1",
          style: "solid",
        },
        {
          color: MATH_COLORS.tangentLine,
          label: "临界切点",
          formula: isExpAx ? "P_0(1, e)" : "P_0(0, 1)",
          style: "point",
        },
      ];
    }
  }, [mode, subMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 核心专题模式选择 (SelectGrid 2x2) */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              items={[
                {
                  key: "exp",
                  label: "指数放缩",
                  description: "切线不等式基础",
                },
                {
                  key: "log",
                  label: "对数放缩",
                  description: "切线与二次放缩",
                },
                {
                  key: "chain",
                  label: "双基准对偶",
                  description: "指数对数双向夹逼",
                },
                {
                  key: "param",
                  label: "切线求参",
                  description: "临界切线与参变量",
                },
              ]}
              value={mode}
              onChange={handleModeChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 典型情景与考法 (全模式统一接入 ScenarioSpec DSL 2x2 网格) */}
          <LeftPanelSection title="典型情景与考法">
            <SelectGrid
              items={currentScenarios.map((s) => ({
                key: s.id,
                label: s.name,
                description: s.badge.split(" · ")[1] || s.name,
              }))}
              value={preset}
              onChange={handleScenarioChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 核心参数调节滑块 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => {
                setParams({ ...defaultParams });
                setPreset("free");
              }}
            />
          </LeftPanelSection>

          {/* 4. 教学导引与考题设问 (由 useScenario SSOT 驱动闭环) */}
          {tipProps && (
            <div className="mt-auto">
              <TipCard
                variant={tipProps.variant}
                badge={tipProps.badge}
                condition={tipProps.condition}
                question={tipProps.question}
              />
            </div>
          )}
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 悬浮公式展示区 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* 右下角图例说明 */}
          <SceneLegend items={legendItems} />

          {/* Svg 画布容器 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TranscendentalScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleSceneDrag}
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
          reasoningSteps={mathData.reasoningSteps}
          examAnchor={mathData.examAnchor}
          mnemonic={mathData.mnemonic}
          title="数学解析看板"
        />
      }
    />
  );
}
