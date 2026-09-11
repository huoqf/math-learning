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
    const absB = Math.abs(params.b).toFixed(1);
    const aPart =
      Math.abs(params.a) < 1e-4
        ? ""
        : `\\color{${MATH_COLORS.paramPrimary}}{${aVal}}x`;
    const bSign = params.b >= 0 ? "+" : "-";
    const bPart = `${bSign} \\frac{\\color{${MATH_COLORS.paramSecondary}}{${absB}}}{x}`;

    if (Math.abs(params.a) < 1e-4) {
      return params.b >= 0
        ? `y = \\frac{\\color{${MATH_COLORS.paramSecondary}}{${absB}}}{x}`
        : `y = -\\frac{\\color{${MATH_COLORS.paramSecondary}}{${absB}}}{x}`;
    }
    return `y = ${aPart} ${bPart}`;
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
        label:
          Math.abs(a) < 1e-4
            ? "水平渐近线 y = 0 (x轴)"
            : `斜渐近线 y = ${a.toFixed(1)}x`,
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
                  description: "同号象限双极值 (ab > 0)",
                },
                {
                  key: "streamer_std",
                  label: "双曲飘带型",
                  description: "异号象限单调增 (ab < 0)",
                },
                {
                  key: "inverse_std",
                  label: "反比例退化",
                  description: "斜渐近线水平退化 (a = 0)",
                  fullWidth: true,
                },
              ]}
              value={preset}
              onChange={handlePresetChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => {
                setPreset("nike_std");
                setParams({ ...defaultParams });
              }}
            />
          </LeftPanelSection>

          {/* 3. 教学导引 */}
          <LeftPanelSection title="教学导引" compact>
            <TipCard
              variant={
                params.a * params.b > 0
                  ? "primary"
                  : params.a * params.b < 0
                    ? "warning"
                    : "danger"
              }
              badge={
                params.a * params.b > 0
                  ? "高考母题 · 经典对勾函数模型 (ab > 0)"
                  : params.a * params.b < 0
                    ? "高考延伸 · 双曲飘带型函数 (ab < 0)"
                    : "退化模型 · 反比例函数"
              }
              condition={
                <span>
                  定义域去心 <KatexFormula formula="x \ne 0" mode="inline" />
                  ，奇函数{" "}
                  <KatexFormula formula="f(-x) = -f(x)" mode="inline" />
                  ，渐近线为{" "}
                  <KatexFormula
                    formula={
                      Math.abs(params.a) < 1e-4
                        ? "y = 0"
                        : `y = ${params.a.toFixed(1)}x`
                    }
                    mode="inline"
                  />{" "}
                  与 <KatexFormula formula="x = 0" mode="inline" />。
                </span>
              }
              question={
                params.a * params.b > 0
                  ? params.a > 0
                    ? "(1) 求导解驻点并确定单调递减区间；(2) 探究第一象限极小值点与第三象限极大值点的中心对称关系。"
                    : "(1) 分析导函数符号，确定倒对勾函数的单调递增区间；(2) 求解第四象限极大值点与第二象限极小值点坐标。"
                  : "(1) 求导证明导函数在去心定义域上恒号；(2) 分析为何双曲飘带形态全域单调且无极值点。"
              }
            />
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
