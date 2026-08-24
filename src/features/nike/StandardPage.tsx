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
import { NikeScene } from "./components/NikeScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/nike";

export function StandardPage() {
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

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
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 动态教学提示配置
  const tipConfig = useMemo(() => {
    const { a, b } = params;
    if (a > 0 && b > 0) {
      const xExt = Math.sqrt(b / a).toFixed(2);
      const yExt = (2 * Math.sqrt(a * b)).toFixed(2);
      return {
        variant: "primary" as const,
        badge: "高考核心 · 经典对勾函数模型 (a > 0, b > 0)",
        condition: `函数 y = ${a.toFixed(1)}x + ${b.toFixed(1)}/x，定义域去心 x ≠ 0，为奇函数。`,
        question: `求第一象限极小值点 (${xExt}, ${yExt})，分析在 (0, ${xExt}] 减、[${xExt}, +∞) 增的单调性与斜渐近线 y = ${a.toFixed(1)}x。`,
      };
    } else if (a > 0 && b < 0) {
      return {
        variant: "warning" as const,
        badge: "高考辨析 · 双曲飘带型函数 (a > 0, b < 0)",
        condition: `函数 y = ${a.toFixed(1)}x - ${Math.abs(b).toFixed(1)}/x，定义域去心 x ≠ 0，无极值点。`,
        question:
          "验证函数在 (-∞, 0) 与 (0, +∞) 上均为严格单调递增，并观察双支双曲线形态。",
      };
    } else if (Math.abs(a) < 1e-6) {
      return {
        variant: "danger" as const,
        badge: "特殊退化 · 反比例函数退化形态 (a = 0)",
        condition: `斜率项系数 a = 0，退化为标准反比例函数 y = ${b.toFixed(1)}/x。`,
        question:
          "观察斜渐近线退化为水平 x 轴 (y = 0)，奇函数关于原点中心对称。",
      };
    } else {
      return {
        variant: "info" as const,
        badge: "倒置对勾 · 倒置对勾函数模型 (a < 0, b < 0)",
        condition: `函数 y = ${a.toFixed(1)}x + ${b.toFixed(1)}/x，a < 0, b < 0。`,
        question: "分析在第一象限极大值点与在各区间的单调性变化。",
      };
    }
  }, [params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
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
                if (key === "nike_std")
                  setParams((p) => ({ ...p, a: 1.0, b: 4.0, h: 0, c: 0 }));
                else if (key === "streamer_std")
                  setParams((p) => ({ ...p, a: 1.0, b: -4.0, h: 0, c: 0 }));
                else if (key === "inverse_std")
                  setParams((p) => ({ ...p, a: 0.0, b: 4.0, h: 0, c: 0 }));
              }}
              columns={2}
            />
          </LeftPanelSection>
          <LeftPanelSection
            title="动态参数调节"
            subtitle="拖动滑块或中屏控制点探索"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>
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
