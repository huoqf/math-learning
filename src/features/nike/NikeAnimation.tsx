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
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, activeMode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择区 */}
          <LeftPanelSection title="模式选择" subtitle="切换高考核心场景模式">
            <SelectGrid
              items={[
                {
                  key: "standard",
                  label: "基本性质",
                  formula: "y = ax + \\frac{b}{x}",
                },
                {
                  key: "amgm",
                  label: "均值不等式",
                  formula: "a x + \\frac{b}{x} \\ge 2\\sqrt{ab}",
                },
                {
                  key: "shifted",
                  label: "平移双曲线",
                  formula: "y = a(x-h)+c+\\frac{b}{x-h}",
                },
              ]}
              value={activeMode}
              onChange={(k) => setActiveMode(k)}
              columns={1}
              variant="outline"
            />
          </LeftPanelSection>

          {/* 快捷配置网格 */}
          <LeftPanelSection
            title="典型形态预设"
            subtitle="快速加载高考典型函数曲线"
          >
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
              value={
                params.a === 1 && params.b === 4
                  ? "nike_std"
                  : params.a === 1 && params.b === -4
                    ? "streamer_std"
                    : params.a === 0
                      ? "inverse_std"
                      : ""
              }
              onChange={(key) => {
                if (key === "nike_std") {
                  setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 0, c: 0 }));
                } else if (key === "streamer_std") {
                  setParams((p) => ({ ...p, a: 1.0, b: -4.0, h: 0, c: 0 }));
                } else if (key === "inverse_std") {
                  setParams((p) => ({ ...p, a: 0.0, b: 4.0, h: 0, c: 0 }));
                }
              }}
              columns={2}
            />
          </LeftPanelSection>

          {/* 参数调节控制台 */}
          <LeftPanelSection
            title="动态参数调节"
            subtitle="拖动滑块或中屏控制点探索"
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
