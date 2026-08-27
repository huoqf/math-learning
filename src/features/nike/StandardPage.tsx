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

export function StandardPage() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const [preset, setPreset] = useState<string>("nike_std");

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () => buildMathQuantities("anim-nike", params, { activeMode: "standard" }),
    [params],
  );

  const equationLatex = useMemo(() => {
    const aVal = params.a.toFixed(1);
    const bVal = params.b.toFixed(1);
    return `y = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}x + \\frac{\\color{${MATH_COLORS.paramSecondary}}{${bVal}}}{x}`;
  }, [params.a, params.b]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["a", "b", "x0"];
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
    if (key === "nike_std") {
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 0, c: 0, x0: 3.0 }));
    } else if (key === "streamer_std") {
      setParams((p) => ({ ...p, a: 1.0, b: -4.0, h: 0, c: 0, x0: 3.0 }));
    } else if (key === "inverse_std") {
      setParams((p) => ({ ...p, a: 0.0, b: 4.0, h: 0, c: 0, x0: 3.0 }));
    }
  };

  // 图例配置
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const { a, b } = params;
    const isNike = a * b > 0;
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
        label: "垂直渐近线 x = 0 (y轴)",
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
  }, [params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 典型形态预设 */}
          <LeftPanelSection title="典型形态预设">
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
          </LeftPanelSection>

          {/* 2. 对象化参数调节 */}
          <LeftPanelSection title="动态参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => {
                setPreset("nike_std");
                setParams({ ...defaultParams });
              }}
            />
          </LeftPanelSection>

          {/* 3. 教学导引与探究设问 */}
          <LeftPanelSection title="教学导引与探究设问" compact>
            <TipCard
              variant={
                params.a * params.b > 0
                  ? "primary"
                  : params.a * params.b < 0
                    ? "warning"
                    : "danger"
              }
            >
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>
                  {params.a * params.b > 0
                    ? "经典对勾函数模型 (ab > 0)"
                    : params.a * params.b < 0
                      ? "双曲飘带型函数 (ab < 0)"
                      : "初等退化函数形态"}
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【模型特征 / 条件】
                  </span>
                  <span>定义域去心 </span>
                  <KatexFormula formula="x \ne 0" mode="inline" />
                  <span>，为奇函数 </span>
                  <KatexFormula formula="f(-x) = -f(x)" mode="inline" />
                  <span>
                    。
                    {params.a * params.b > 0 ? (
                      <span>
                        在第一象限驻点{" "}
                        <KatexFormula
                          formula={`x = \\sqrt{b/a} = ${Math.sqrt(Math.max(1e-4, params.b / Math.max(1e-4, params.a))).toFixed(2)}`}
                          mode="inline"
                        />{" "}
                        取得极小值，在{" "}
                        <KatexFormula formula="(0, \sqrt{b/a}]" mode="inline" />{" "}
                        单调递减，在{" "}
                        <KatexFormula
                          formula="[\sqrt{b/a}, +\infty)"
                          mode="inline"
                        />{" "}
                        单调递增。
                      </span>
                    ) : (
                      <span>
                        导数{" "}
                        <KatexFormula
                          formula="f'(x) = a - b/x^2"
                          mode="inline"
                        />{" "}
                        恒{params.a > 0 ? "正" : "负"}，全域单调
                        {params.a > 0 ? "递增" : "递减"}无极值。
                      </span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【核心设问 / 探究】
                  </span>
                  <span>
                    {params.a * params.b > 0
                      ? "调节分子系数 b，观察特征驻点如何沿双曲线向外迁移？拖动切点 P 观察切线何时变为水平？"
                      : "改变斜率 a 的正负，观察为何飘带形态不具备驻点？渐近线与曲线的位置关系如何变化？"}
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
              activeMode="standard"
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
