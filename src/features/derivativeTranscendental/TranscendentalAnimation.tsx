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
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { TranscendentalScene } from "./components/TranscendentalScene";
import { SceneLegend } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams } from "@/data/registries/transcendental";
import type { TranscendentalMode } from "@/math/transcendental";

export function TranscendentalAnimation() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));
  const [mode, setMode] = useState<TranscendentalMode>("exp");
  const [preset, setPreset] = useState<string>("free");
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
        preset,
      }),
    [params, mode, subMode, preset],
  );

  // 4. 左屏动态参数配置（根据模式动态调整定义域与特征刻度，彻底杜绝无效负数定义域）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    if (mode === "exp") {
      return [
        {
          key: "x0",
          label: "切点横坐标 x₀",
          labelFormula: "x_0",
          group: "切线控制参数",
          value: params.x0 ?? 0,
          min: -2.5,
          max: 2.0,
          step: 0.1,
          description: "控制 e^x 切点位置",
          descriptionFormula: "控制 $e^x$ 切线切点 $x_0$",
          importance: "core",
          marks: [
            {
              value: 0,
              variant: "critical",
              label: "基准",
              labelFormula: "x_0=0",
            },
            { value: 1, label: "切点", labelFormula: "x_0=1" },
          ],
        },
      ];
    } else if (mode === "log") {
      return [
        {
          key: "x0",
          label: "切点横坐标 x₀",
          labelFormula: "x_0",
          group: "切线控制参数",
          value: Math.max(0.1, params.x0 ?? 1.0),
          min: 0.1,
          max: 3.5,
          step: 0.1,
          description: "控制 ln x 切点位置 (x > 0)",
          descriptionFormula: "定义域保护 $x_0 > 0$",
          importance: "core",
          marks: [
            {
              value: 1,
              variant: "critical",
              label: "基准",
              labelFormula: "x_0=1",
            },
            { value: 2.7, label: "e点", labelFormula: "x_0=e" },
          ],
        },
      ];
    } else if (mode === "chain") {
      return [
        {
          key: "x0",
          label: "自变量考察点 x",
          labelFormula: "x",
          group: "自变量位置",
          value: Math.max(0.1, params.x0 ?? 1.0),
          min: 0.2,
          max: 3.0,
          step: 0.1,
          description: "观察三曲线夹逼态势",
          descriptionFormula: "观察 $x>0$ 处的包络差",
          importance: "core",
          marks: [
            {
              value: 1,
              variant: "critical",
              label: "公切点",
              labelFormula: "x=1",
            },
          ],
        },
      ];
    } else {
      return [
        {
          key: "a",
          label: "直线斜率参数 a",
          labelFormula: "a",
          group: "参变直线方程",
          value: params.a ?? 1.0,
          min: -1.0,
          max: 4.0,
          step: 0.1,
          description:
            subMode === "exp_ax" ? "直线 y = ax 斜率" : "直线 y = ax + 1 斜率",
          importance: "core",
          marks: [
            { value: 0, label: "水平", labelFormula: "a=0" },
            {
              value: 1,
              variant: "critical",
              label: "定点临界",
              labelFormula: "a=1",
            },
            {
              value: 2.7,
              variant: "critical",
              label: "原点临界",
              labelFormula: "a=e",
            },
          ],
        },
      ];
    }
  }, [params, mode, subMode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 画布拖拽动点时自动解耦切回自由探究
  const handleSceneDrag = useCallback((key: string, value: number) => {
    setPreset("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

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

  // 6. 模式切换重置参数
  const handleModeChange = (newMode: string) => {
    const m = newMode as TranscendentalMode;
    setMode(m);
    setPreset("free");
    if (m === "exp") {
      setSubMode("tangent_0");
      setParams((prev) => ({ ...prev, x0: 0.0 }));
    } else if (m === "log") {
      setSubMode("tangent_1");
      setParams((prev) => ({ ...prev, x0: 1.0 }));
    } else if (m === "chain") {
      setSubMode("default");
      setParams((prev) => ({ ...prev, x0: 1.0 }));
    } else if (m === "param") {
      setSubMode("exp_ax_1");
      setParams((prev) => ({ ...prev, a: 1.0 }));
    }
  };

  // 7. 预设选择回调 (黄金 2x2 规范)
  const handlePresetChange = (k: string) => {
    setPreset(k);
    if (mode === "exp") {
      if (k === "tangent_0") {
        setSubMode("tangent_0");
        handleParamChange("x0", 0.0);
      } else if (k === "tangent_1") {
        setSubMode("tangent_1");
        handleParamChange("x0", 1.0);
      } else if (k === "shift_1") {
        setSubMode("shift_1");
        handleParamChange("x0", 1.0);
      }
    } else if (mode === "log") {
      if (k === "tangent_1") {
        setSubMode("tangent_1");
        handleParamChange("x0", 1.0);
      } else if (k === "tangent_e") {
        setSubMode("tangent_e");
        handleParamChange("x0", 2.718);
      } else if (k === "quadratic_bound") {
        setSubMode("quadratic_bound");
        handleParamChange("x0", 1.0);
      }
    } else if (mode === "chain") {
      if (k === "tangent_1") {
        handleParamChange("x0", 1.0);
      } else if (k === "pos_2") {
        handleParamChange("x0", 2.0);
      } else if (k === "pos_half") {
        handleParamChange("x0", 0.5);
      }
    } else if (mode === "param") {
      if (k === "exp_ax_1_crit") {
        setSubMode("exp_ax_1");
        handleParamChange("a", 1.0);
      } else if (k === "exp_ax_crit") {
        setSubMode("exp_ax");
        handleParamChange("a", Math.E);
      } else if (k === "horizontal") {
        setSubMode("exp_ax_1");
        handleParamChange("a", 0.0);
      }
    }
  };

  // 教学导引与启发式设问配置（全面接入 KatexFormula 专业数学公式渲染）
  const tipConfig = useMemo(() => {
    switch (mode) {
      case "exp":
        return {
          variant: "primary" as const,
          badge: "指数放缩 · 凸性与切线",
          condition: (
            <span>
              指数曲线 <KatexFormula formula="f(x)=e^x" mode="inline" />{" "}
              为下凸函数，切线始终位于曲线下方。
            </span>
          ),
          question: (
            <span>
              观察为何仅在基准切点{" "}
              <KatexFormula formula="x_0=0" mode="inline" /> 处的切线{" "}
              <KatexFormula formula="y=x+1" mode="inline" /> 能提供截距为 1
              的全局线性下界？
            </span>
          ),
        };
      case "log":
        return {
          variant: "info" as const,
          badge: "对数放缩 · 上凸与二次界",
          condition: (
            <span>
              对数曲线 <KatexFormula formula="g(x)=\ln x" mode="inline" /> (
              <KatexFormula formula="x>0" mode="inline" />)
              为上凸函数，切线始终位于曲线上方。
            </span>
          ),
          question: (
            <span>
              对比线性切线{" "}
              <KatexFormula formula="\ln x \le x-1" mode="inline" />{" "}
              与抛物线上界{" "}
              <KatexFormula formula="\ln x \le \frac{x^2-1}{2}" mode="inline" />{" "}
              在 <KatexFormula formula="x>1" mode="inline" /> 时的逼近精度差异。
            </span>
          ),
        };
      case "chain":
        return {
          variant: "warning" as const,
          badge: "双基准对偶 · 对称与夹逼",
          condition: (
            <span>
              <KatexFormula formula="e^{x-1}" mode="inline" /> 与{" "}
              <KatexFormula formula="\ln x+1" mode="inline" />{" "}
              互为反函数，关于中轴线{" "}
              <KatexFormula formula="y=x" mode="inline" /> 对称。
            </span>
          ),
          question: (
            <span>
              三条曲线在 <KatexFormula formula="(1,1)" mode="inline" />{" "}
              处公共相切，高考中如何利用{" "}
              <KatexFormula formula="y=x" mode="inline" />{" "}
              这一“中间桥梁”实现双向链式放缩？
            </span>
          ),
        };
      case "param":
        return {
          variant: "primary" as const,
          badge: "切线临界 · 恒成立求参",
          condition: (
            <span>
              考察直线{" "}
              <KatexFormula
                formula={subMode === "exp_ax" ? "y=ax" : "y=ax+1"}
                mode="inline"
              />{" "}
              与指数曲线 <KatexFormula formula="e^x" mode="inline" />{" "}
              的位置关系。
            </span>
          ),
          question: (
            <span>
              斜率 <KatexFormula formula="a" mode="inline" />{" "}
              连续增大时，为何“曲线与直线相切”恰好是恒成立与产生交点的临界分水岭？
            </span>
          ),
        };
      default:
        return {
          variant: "primary" as const,
          badge: "超越函数切线放缩",
          condition: <span>利用导数切线构造不等式放缩桥梁。</span>,
          question: <span>探究切线方程与曲线凹凸性的代数几何关系。</span>,
        };
    }
  }, [mode, subMode]);

  // 右下角图例配置 (模式专属)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (mode === "exp") {
      const isShift = subMode === "shift_1";
      return [
        {
          color: MATH_COLORS.function,
          formula: isShift ? "f(x) = e^{x-1}" : "f(x) = e^x",
          style: "solid",
        },
        {
          color: MATH_COLORS.tangentLine,
          formula: isShift
            ? "y = x \\;(\\text{基准切线})"
            : "y = x + 1 \\;(\\text{基准切线})",
          style: "dash",
        },
        {
          color: MATH_COLORS.focusPoint,
          formula: isShift
            ? "P_0(1, 1) \\;(\\text{基准切点})"
            : "P_0(0, 1) \\;(\\text{基准切点})",
          style: "point",
        },
        {
          color: MATH_COLORS.paramPrimary,
          formula: "P(x_0, f(x_0)) \\;(\\text{动切点})",
          style: "point",
        },
        {
          color: MATH_COLORS.paramTertiary,
          label: "差值阴影区 f(x) - (x+1)",
          style: "area",
        },
      ];
    } else if (mode === "log") {
      const isQuad = subMode === "quadratic_bound";
      return [
        {
          color: MATH_COLORS.function,
          formula: "g(x) = \\ln x",
          style: "solid",
        },
        {
          color: isQuad ? MATH_COLORS.paramSecondary : MATH_COLORS.tangentLine,
          formula: isQuad
            ? "y = \\frac{x^2-1}{2} \\;(\\text{二次放缩上界})"
            : "y = x - 1 \\;(\\text{线性切线上界})",
          style: "dash",
        },
        {
          color: MATH_COLORS.focusPoint,
          formula: "P_0(1, 0) \\;(\\text{基准切点})",
          style: "point",
        },
        {
          color: MATH_COLORS.paramPrimary,
          formula: "P(x_0, \\ln x_0) \\;(\\text{动切点})",
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
          formula: "y = e^{x-1} \\;(\\text{上界指数})",
          style: "solid",
        },
        {
          color: MATH_COLORS.functionTransformed,
          formula: "y = \\ln x + 1 \\;(\\text{下界对数})",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramSecondary,
          formula: "y = x \\;(\\text{中轴线 / 公共切线})",
          style: "dash",
        },
        {
          color: MATH_COLORS.paramSecondary,
          formula: "P_0(1, 1) \\;(\\text{公共切点})",
          style: "point",
        },
        {
          color: MATH_COLORS.paramPrimary,
          formula: "P(x_0, x_0) \\;(\\text{中轴动点})",
          style: "point",
        },
      ];
    } else {
      return [
        {
          color: MATH_COLORS.function,
          formula: "y = e^x",
          style: "solid",
        },
        {
          color: MATH_COLORS.paramPrimary,
          formula: subMode === "exp_ax" ? "y = ax" : "y = ax + 1",
          style: "solid",
        },
        {
          color: MATH_COLORS.tangentLine,
          formula: "P_0(0, 1) \\;(\\text{临界切点})",
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
          <LeftPanelSection
            title="探究模式"
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
                  label: "切线求参",
                  formula: "e^x \\ge ax+1",
                },
              ]}
              value={mode}
              onChange={handleModeChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 高考典型切点与变体 (2x2 黄金规范，微描述精炼 <= 6 字) */}
          {mode === "exp" && (
            <LeftPanelSection
              title="高考典型切点"
              subtitle="切换基准切点与平移变体"
            >
              <SelectGrid
                items={[
                  { key: "free", label: "自由探究", description: "全参数开放" },
                  {
                    key: "tangent_0",
                    label: "基准切点",
                    formula: "x_0=0",
                    description: "切线 y=x+1",
                  },
                  {
                    key: "tangent_1",
                    label: "次级切点",
                    formula: "x_0=1",
                    description: "切线 y=ex",
                  },
                  {
                    key: "shift_1",
                    label: "平移变体",
                    formula: "e^{x-1} \\ge x",
                    description: "等价切线",
                  },
                ]}
                value={preset}
                onChange={handlePresetChange}
                columns={2}
              />
            </LeftPanelSection>
          )}

          {mode === "log" && (
            <LeftPanelSection
              title="高考典型切点"
              subtitle="切换基准切点与二次放缩"
            >
              <SelectGrid
                items={[
                  { key: "free", label: "自由探究", description: "全参数开放" },
                  {
                    key: "tangent_1",
                    label: "基准切点",
                    formula: "x_0=1",
                    description: "切线 y=x-1",
                  },
                  {
                    key: "tangent_e",
                    label: "次级切点",
                    formula: "x_0=e",
                    description: "切线 y=x/e",
                  },
                  {
                    key: "quadratic_bound",
                    label: "二次放缩",
                    formula: "\\ln x \\le \\frac{x^2-1}{2}",
                    description: "抛物线上界",
                  },
                ]}
                value={preset}
                onChange={handlePresetChange}
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 3. 核心参数调节滑块 */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动观察切线放缩与动点夹逼"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => {
                setParams({ ...defaultParams });
                setPreset("free");
              }}
            />
          </LeftPanelSection>

          {/* 4. 教学导引与考题设问 */}
          <LeftPanelSection title="教学导引与高考设问" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【前置条件】
                  </span>
                  <span className="text-neutral-600 ml-1">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【破题设问】
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
          mnemonic={mathData.mnemonic}
          title="切线放缩模型看板"
        />
      }
    />
  );
}
