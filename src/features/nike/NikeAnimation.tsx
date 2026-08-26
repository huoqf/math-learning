import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
} from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { NikeScene } from "./components/NikeScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/nike";

export function NikeAnimation() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const [activeMode, setActiveMode] = useState<"standard" | "amgm" | "shifted">(
    "standard",
  );

  const [preset, setPreset] = useState<string>("nike_std");

  // 1. Viewport 与自适应画布 (Preset: full)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 2. 比例尺 (数学坐标 x: [-6, 6], y: [-4.5, 4.5])
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 3. 右屏数学量组装 (根据 anim-nike 与 activeMode)
  const mathData = useMemo(
    () => buildMathQuantities("anim-nike", params, { activeMode }),
    [params, activeMode],
  );

  // 4. 中屏悬浮公式字符串拼接 (参数 a, b 应用三位一体语义色)
  const equationLatex = useMemo(() => {
    const aVal = params.a.toFixed(1);
    const bVal = params.b.toFixed(1);
    const hVal = params.h.toFixed(1);
    const cVal = params.c.toFixed(1);

    const colA = `\\color{${MATH_COLORS.paramPrimary}}{${aVal}}`;
    const colB = `\\color{${MATH_COLORS.paramSecondary}}{${bVal}}`;
    const colH = `\\color{${MATH_COLORS.paramTertiary}}{${hVal}}`;
    const colC = `\\color{${MATH_COLORS.paramTertiary}}{${cVal}}`;

    if (activeMode === "shifted") {
      return `y = ${colA}(x - ${colH}) + ${colC} + \\frac{${colB}}{x - ${colH}}`;
    }
    if (activeMode === "amgm") {
      return `f(x) = ${colA}x + \\frac{${colB}}{x} \\ge 2\\sqrt{${colA} \\cdot ${colB}}`;
    }
    return `y = ${colA}x + \\frac{${colB}}{x}`;
  }, [params.a, params.b, params.h, params.c, activeMode]);

  // 5. 左屏参数过滤与配置 (声明式ParamControl)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      standard: ["a", "b", "x0"],
      amgm: ["a", "b", "x0"],
      shifted: ["a", "b", "h", "c", "x0"],
    };
    const keys = keysByMode[activeMode] ?? Object.keys(paramMeta);
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
          group: meta.group,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, activeMode]);

  // 6. 模式与预设联动
  const handleModeChange = (newMode: string) => {
    const m = newMode as "standard" | "amgm" | "shifted";
    setActiveMode(m);
    if (m === "standard") {
      setPreset("nike_std");
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 0, c: 0, x0: 3.0 }));
    } else if (m === "amgm") {
      setPreset("amgm_std");
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 0, c: 0, x0: 2.0 }));
    } else if (m === "shifted") {
      setPreset("shifted_quad");
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 1.0, c: 2.0, x0: 3.0 }));
    }
  };

  const handlePresetChange = (key: string) => {
    setPreset(key);
    if (key === "nike_std") {
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 0, c: 0, x0: 3.0 }));
    } else if (key === "streamer_std") {
      setParams((p) => ({ ...p, a: 1.0, b: -4.0, h: 0, c: 0, x0: 3.0 }));
    } else if (key === "inverse_std") {
      setParams((p) => ({ ...p, a: 0.0, b: 4.0, h: 0, c: 0, x0: 3.0 }));
    } else if (key === "amgm_std") {
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 0, c: 0, x0: 2.0 }));
    } else if (key === "amgm_double") {
      setParams((p) => ({ ...p, a: 2.0, b: 8.0, h: 0, c: 0, x0: 2.0 }));
    } else if (key === "amgm_unit") {
      setParams((p) => ({ ...p, a: 1.0, b: 1.0, h: 0, c: 0, x0: 1.0 }));
    } else if (key === "shifted_quad") {
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 1.0, c: 2.0, x0: 3.0 }));
    } else if (key === "shifted_linear") {
      setParams((p) => ({ ...p, a: 0.0, b: 3.0, h: 2.0, c: 1.0, x0: 4.0 }));
    } else if (key === "shifted_streamer") {
      setParams((p) => ({ ...p, a: 1.0, b: -4.0, h: 2.0, c: 0.0, x0: 4.0 }));
    }
  };

  const handleParamChange = useCallback((key: string, value: number) => {
    setPreset("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = () => {
    handleModeChange(activeMode);
  };

  // 图例配置
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const { a, b, h, c } = params;
    const isNike = a * b > 0;
    if (activeMode === "shifted") {
      return [
        {
          label: isNike
            ? "平移对勾曲线"
            : a * b < 0
              ? "平移飘带曲线"
              : "平移退化曲线",
          color: isNike
            ? MATH_COLORS.function
            : MATH_COLORS.functionTransformed,
          style: "solid",
        },
        {
          label: `垂直渐近线 x = ${h.toFixed(1)}`,
          color: MATH_COLORS.asymptote,
          style: "dash",
        },
        {
          label: `斜渐近线 y = ${a.toFixed(1)}(x-${h.toFixed(1)})+${c.toFixed(1)}`,
          color: MATH_COLORS.asymptote,
          style: "dash",
        },
        {
          label: `中心 C(${h.toFixed(1)}, ${c.toFixed(1)})`,
          color: MATH_COLORS.focusPoint,
          style: "point",
        },
      ];
    }
    if (activeMode === "amgm") {
      return [
        {
          label: "和函数 f(x)=ax+b/x",
          color: MATH_COLORS.function,
          style: "solid",
        },
        {
          label: `y1 = ${a.toFixed(1)}x`,
          color: MATH_COLORS.paramPrimary,
          style: "dash",
        },
        {
          label: `y2 = ${b.toFixed(1)}/x`,
          color: MATH_COLORS.paramSecondary,
          style: "dash",
        },
        {
          label: "均值等号极小点",
          color: MATH_COLORS.vertexPoint,
          style: "point",
        },
      ];
    }
    return [
      {
        label: isNike
          ? "对勾函数曲线"
          : a * b < 0
            ? "双曲飘带曲线"
            : "退化函数图象",
        color: isNike
          ? MATH_COLORS.function
          : a * b < 0
            ? MATH_COLORS.functionTransformed
            : MATH_COLORS.degeneracy,
        style: "solid",
      },
      {
        label: "垂直渐近线 x = 0",
        color: MATH_COLORS.asymptote,
        style: "dash",
      },
      {
        label: `斜渐近线 y = ${a.toFixed(1)}x`,
        color: MATH_COLORS.asymptote,
        style: "dash",
      },
      {
        label: "特征极值点",
        color: MATH_COLORS.vertexPoint,
        style: "point",
      },
    ];
  }, [params, activeMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模式选择区 (TabSwitcher) */}
          <LeftPanelSection title="探究场景模式">
            <TabSwitcher
              tabs={[
                { key: "standard", label: "基本性质" },
                { key: "amgm", label: "均值不等式" },
                { key: "shifted", label: "平移双曲线" },
              ]}
              value={activeMode}
              onChange={handleModeChange}
            />
          </LeftPanelSection>

          {/* 2. 随模式动态切换典型真题形态预设 */}
          <LeftPanelSection title="典型形态预设">
            {activeMode === "standard" && (
              <SelectGrid
                items={[
                  {
                    key: "nike_std",
                    label: "经典对勾型",
                    formula: "y = x + \\frac{4}{x}",
                  },
                  {
                    key: "streamer_std",
                    label: "双曲飘带型",
                    formula: "y = x - \\frac{4}{x}",
                  },
                  {
                    key: "inverse_std",
                    label: "反比例退化",
                    formula: "y = \\frac{4}{x}, \\; a = 0",
                    fullWidth: true,
                  },
                ]}
                value={preset}
                onChange={handlePresetChange}
                columns={2}
              />
            )}
            {activeMode === "amgm" && (
              <SelectGrid
                items={[
                  {
                    key: "amgm_std",
                    label: "标准对勾配凑",
                    formula: "x + \\frac{4}{x} \\ge 4",
                  },
                  {
                    key: "amgm_double",
                    label: "倍数系数模型",
                    formula: "2x + \\frac{8}{x} \\ge 8",
                  },
                  {
                    key: "amgm_unit",
                    label: "单位系数模型",
                    formula: "x + \\frac{1}{x} \\ge 2",
                    fullWidth: true,
                  },
                ]}
                value={preset}
                onChange={handlePresetChange}
                columns={2}
              />
            )}
            {activeMode === "shifted" && (
              <SelectGrid
                items={[
                  {
                    key: "shifted_quad",
                    label: "二次分式对勾",
                    formula: "y = (x-1) + 2 + \\frac{4}{x-1}",
                  },
                  {
                    key: "shifted_linear",
                    label: "分式线性平移",
                    formula: "y = 1 + \\frac{3}{x-2}",
                  },
                  {
                    key: "shifted_streamer",
                    label: "二次分式飘带",
                    formula: "y = (x-2) - \\frac{4}{x-2}",
                    fullWidth: true,
                  },
                ]}
                value={preset}
                onChange={handlePresetChange}
                columns={2}
              />
            )}
          </LeftPanelSection>

          {/* 3. 对象化参数调节控制台 */}
          <LeftPanelSection title="动态参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white overflow-hidden">
          {/* 顶部悬浮公式卡片 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 交互画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <NikeScene
              params={params}
              scale={scale}
              vp={vp}
              activeMode={activeMode}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
            />
          </AnimationSvgCanvas>
          <SceneLegend items={legendItems} />
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="对勾与双曲型看板"
        />
      }
    />
  );
}
