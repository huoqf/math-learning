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

export function AmgmPage() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
    a: 1.0,
    b: 4.0,
    x0: 2.0,
  }));

  const [preset, setPreset] = useState<string>("amgm_std");

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () => buildMathQuantities("anim-nike", params, { activeMode: "amgm" }),
    [params],
  );

  const equationLatex = useMemo(() => {
    const aVal = params.a.toFixed(1);
    const bVal = params.b.toFixed(1);
    return `f(x) = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}x + \\frac{\\color{${MATH_COLORS.paramSecondary}}{${bVal}}}{x} \\ge 2\\sqrt{\\color{${MATH_COLORS.paramPrimary}}{${aVal}} \\cdot \\color{${MATH_COLORS.paramSecondary}}{${bVal}}}`;
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
    if (key === "amgm_std") {
      setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 0, c: 0, x0: 2.0 }));
    } else if (key === "amgm_double") {
      setParams((p) => ({ ...p, a: 2.0, b: 8.0, h: 0, c: 0, x0: 2.0 }));
    } else if (key === "amgm_unit") {
      setParams((p) => ({ ...p, a: 1.0, b: 1.0, h: 0, c: 0, x0: 1.0 }));
    }
  };

  // 图例配置
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const { a, b } = params;
    return [
      {
        label: "对勾和函数 f(x)=ax+b/x",
        color: MATH_COLORS.function,
        style: "solid",
      },
      {
        label: `项一：y1 = ${a.toFixed(1)}x`,
        color: MATH_COLORS.paramPrimary,
        style: "dash",
      },
      {
        label: `项二：y2 = ${b.toFixed(1)}/x`,
        color: MATH_COLORS.paramSecondary,
        style: "dash",
      },
      {
        label: "均值等号成立极小点",
        color: MATH_COLORS.vertexPoint,
        style: "point",
      },
    ];
  }, [params]);

  const xMinVal = Math.sqrt(
    Math.max(1e-4, params.b / Math.max(1e-4, params.a)),
  ).toFixed(2);
  const minValStr = (2 * Math.sqrt(Math.max(0, params.a * params.b))).toFixed(
    2,
  );

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 典型均值不等式模型 */}
          <LeftPanelSection title="均值不等式经典配凑">
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
          </LeftPanelSection>

          {/* 2. 对象化参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => {
                setPreset("amgm_std");
                setParams({ ...defaultParams, a: 1.0, b: 4.0, x0: 2.0 });
              }}
            />
          </LeftPanelSection>

          {/* 3. 教学导引与题设背景 */}
          <LeftPanelSection title="教学导引与等号条件" compact>
            <TipCard variant="success">
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1 text-success-800">
                <span>高考核心 · 均值不等式“一正二定三相等”</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed text-neutral-700">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【三要素核查】
                  </span>
                  <span>① </span>
                  <b>正</b>：
                  <KatexFormula formula="a>0, b>0, x>0" mode="inline" />
                  ；② <b>定</b>：积为定值{" "}
                  <KatexFormula
                    formula={`(ax)(\\frac{b}{x}) = ${(params.a * params.b).toFixed(1)}`}
                    mode="inline"
                  />
                  ；③ <b>等</b>：当且仅当{" "}
                  <KatexFormula formula="ax = b/x" mode="inline" />。
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【理论最小值】
                  </span>
                  <span>在 </span>
                  <KatexFormula
                    formula={`x = \\sqrt{b/a} = ${xMinVal}`}
                    mode="inline"
                  />
                  <span> 处取得理论最小值 </span>
                  <KatexFormula
                    formula={`y_{\\min} = 2\\sqrt{ab} = ${minValStr}`}
                    mode="inline"
                  />
                  <span>。拖动动点 P 逼近该处观察两项拆分高线等长。</span>
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
              activeMode="amgm"
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
          title="均值不等式看板"
        />
      }
    />
  );
}
