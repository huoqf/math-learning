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
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { NikeScene } from "./components/NikeScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/nike";

export function ShiftedPage() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
    a: 1.0,
    b: 4.0,
    h: 1.0,
    c: 2.0,
    x0: 3.0,
  }));

  const [preset, setPreset] = useState<string>("shifted_quad");

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () => buildMathQuantities("anim-nike", params, { activeMode: "shifted" }),
    [params],
  );

  const equationLatex = useMemo(() => {
    const aVal = params.a.toFixed(1);
    const bVal = params.b.toFixed(1);
    const hVal = params.h.toFixed(1);
    const cVal = params.c.toFixed(1);
    return `y = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}(x - \\color{${MATH_COLORS.paramTertiary}}{${hVal}}) + \\color{${MATH_COLORS.paramTertiary}}{${cVal}} + \\frac{\\color{${MATH_COLORS.paramSecondary}}{${bVal}}}{x - \\color{${MATH_COLORS.paramTertiary}}{${hVal}}}`;
  }, [params.a, params.b, params.h, params.c]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["a", "b", "h", "c", "x0"];
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
  }, [params]);

  const handleParamChange = useCallback((key: string, value: number) => {
    setPreset("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePresetChange = (key: string) => {
    setPreset(key);
    if (key === "shifted_quad") {
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 1.0, c: 2.0, x0: 3.0 }));
    } else if (key === "shifted_linear") {
      setParams((p) => ({ ...p, a: 0.0, b: 3.0, h: 2.0, c: 1.0, x0: 4.0 }));
    } else if (key === "shifted_streamer") {
      setParams((p) => ({ ...p, a: 1.0, b: -4.0, h: 2.0, c: 0.0, x0: 4.0 }));
    }
  };

  // 图例配置
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const { a, b, h, c } = params;
    const isNike = a * b > 0;
    return [
      {
        label: isNike
          ? "平移对勾曲线"
          : a * b < 0
            ? "平移飘带曲线"
            : "平移退化曲线",
        color: isNike
          ? MATH_COLORS.function
          : a * b < 0
            ? MATH_COLORS.functionTransformed
            : MATH_COLORS.degeneracy,
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
        label: `对称中心 C(${h.toFixed(1)}, ${c.toFixed(1)})`,
        color: MATH_COLORS.focusPoint,
        style: "point",
      },
    ];
  }, [params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 高考典型真题预设 */}
          <LeftPanelSection title="高考典型分式模型">
            <SelectGrid
              items={[
                {
                  key: "shifted_quad",
                  label: "二次分式对勾型",
                  formula: "y = (x-1) + 2 + \\frac{4}{x-1}",
                },
                {
                  key: "shifted_linear",
                  label: "分式线性平移型",
                  formula: "y = 1 + \\frac{3}{x-2}, \\; a = 0",
                },
                {
                  key: "shifted_streamer",
                  label: "二次分式飘带型",
                  formula: "y = (x-2) - \\frac{4}{x-2}",
                  fullWidth: true,
                },
              ]}
              value={preset}
              onChange={handlePresetChange}
              columns={1}
            />
          </LeftPanelSection>

          {/* 2. 对象化参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => {
                setPreset("shifted_quad");
                setParams({
                  ...defaultParams,
                  a: 1.0,
                  b: 4.0,
                  h: 1.0,
                  c: 2.0,
                  x0: 3.0,
                });
              }}
            />
          </LeftPanelSection>

          {/* 3. 教学导引与探究设问 */}
          <LeftPanelSection title="教学导引与探究设问" compact>
            <TipCard variant="primary">
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1 text-primary-700">
                <span>平移双曲模型与化归探究</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed text-neutral-700">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【模型特征 / 条件】
                  </span>
                  <span>对称中心为 </span>
                  <KatexFormula
                    formula={`(${params.h.toFixed(1)}, ${params.c.toFixed(1)})`}
                    mode="inline"
                  />
                  <span>，渐近线为 </span>
                  <KatexFormula
                    formula={`x = ${params.h.toFixed(1)}`}
                    mode="inline"
                  />
                  <span> 与 </span>
                  <KatexFormula
                    formula={`y = ${params.a.toFixed(1)}(x - ${params.h.toFixed(1)}) + ${params.c.toFixed(1)}`}
                    mode="inline"
                  />
                  <span>。令 </span>
                  <KatexFormula
                    formula={`u = x - ${params.h.toFixed(1)}`}
                    mode="inline"
                  />
                  <span> 可化为标准型 </span>
                  <KatexFormula
                    formula={`y - ${params.c.toFixed(1)} = ${params.a.toFixed(1)}u + \\frac{${params.b.toFixed(1)}}{u}`}
                    mode="inline"
                  />
                  <span>。</span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【核心设问 / 探究】
                  </span>
                  <span>
                    拖拽中心点 C
                    改变渐近线交点，观察函数图象如何整体平移？对比一次分式与二次分式在分离常数后的核心几何差异是什么？
                  </span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white overflow-hidden">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <NikeScene
              params={params}
              scale={scale}
              vp={vp}
              activeMode="shifted"
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
          title="平移双曲线看板"
        />
      }
    />
  );
}
