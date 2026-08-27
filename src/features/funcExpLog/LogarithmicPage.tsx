import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  TipCard,
  TabSwitcher,
  Toggle,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { ExpLogScene } from "./components/ExpLogScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams } from "@/data/registries/funcExpLog";

export function LogarithmicPage() {
  const [params, setParams] = useState(() => ({
    ...defaultParams,
    x0: 1.5,
    baseA: 2.0,
  }));
  const [mode, setMode] = useState<"single" | "inverse">("single");
  const [showTangent, setShowTangent] = useState(false);

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const showInverse = mode === "inverse";

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-explog", params, {
        subExpLog: "logarithmic",
      }),
    [params],
  );

  const formulaLatex = useMemo(() => {
    const aVal = (params.baseA ?? 2.0).toFixed(1);
    return showInverse
      ? `y = \\log_{\\color{${MATH_COLORS.paramPrimary}}{${aVal}}} x \\iff x = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}^y`
      : `y = \\log_{\\color{${MATH_COLORS.paramPrimary}}{${aVal}}} x`;
  }, [showInverse, params.baseA]);

  // 动态定义域保护参数配置 (对数真数严格 x0 > 0)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const aVal = params.baseA ?? 2.0;
    const x0Val = params.x0 ?? 1.5;

    return [
      {
        key: "x0",
        label: "探究真数 x0",
        labelFormula: `\\text{真数 } \\color{${MATH_COLORS.function}}{x_0}`,
        value: x0Val > 0 ? x0Val : 1.5,
        min: 0.1,
        max: 4.0,
        step: 0.1,
        descriptionFormula: "x_0 \\in [0.1, 4.0]",
        importance: "core",
      },
      {
        key: "baseA",
        label: "对数底数 a",
        labelFormula: `\\text{底数 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
        value: aVal,
        min: 0.2,
        max: 4.0,
        step: 0.1,
        importance: "core",
        marks: [
          {
            value: 1.0,
            variant: "critical",
            label: "退化 (a=1)",
            labelFormula: "a = 1",
          },
        ],
      },
    ];
  }, [params]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: key === "x0" ? Math.max(0.1, value) : value,
    }));
  };

  // 1-to-1 右下角图例配置
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const aVal = (params.baseA ?? 2.0).toFixed(1);
    const items: SceneLegendItem[] = [
      {
        formula: `y = \\log_{${aVal}} x`,
        color: MATH_COLORS.function,
        style: "solid",
      },
      {
        label: "(1, 0) 必过定点",
        color: MATH_COLORS.function,
        style: "point",
      },
    ];

    if (showInverse) {
      items.push({
        formula: `y = ${aVal}^x \\text{ (反函数)}`,
        color: MATH_COLORS.functionTransformed,
        style: "dash",
      });
      items.push({
        label: "y = x 对称轴",
        color: MATH_COLORS.labelText,
        style: "dash",
      });
    }

    if (showTangent) {
      items.push({
        label: "切线 $f'(x_0)$",
        color: MATH_COLORS.tangentLine,
        style: "solid",
      });
    }

    return items;
  }, [params.baseA, showInverse, showTangent]);

  // 教学提示配置
  const tipConfig = useMemo(() => {
    const a = params.baseA ?? 2.0;
    if (showInverse) {
      return {
        variant: "info" as const,
        badge: "高考高频 · 对数与指数反函数对称",
        condition: `对数函数 y = log_{${a.toFixed(1)}} x 与指数函数 y = ${a.toFixed(1)}ˣ 互为反函数。`,
        question:
          "观察动点 P 与对称点 P' 关于 y = x 轴垂直平分对称，体会定义域与值域的互换映射 (D ↔ R)。",
      };
    }
    if (a > 1) {
      return {
        variant: "primary" as const,
        badge: "核心基准 · 对数缓增与垂直渐近线 (a > 1)",
        condition: `底数 a = ${a.toFixed(1)} > 1，真数 x > 0，恒过定点 (1, 0)，竖直渐近线为 x = 0 (y 轴)。`,
        question:
          "观察 x → 0⁺ 时函数值跌入 -∞ 的垂直渐近行为，以及 x → +∞ 时的减速增长 (凹向下/上凸) 趋势。",
      };
    } else {
      return {
        variant: "warning" as const,
        badge: "核心基准 · 衰减对数模型 (0 < a < 1)",
        condition: `底数 0 < a = ${a.toFixed(1)} < 1，真数 x > 0，恒过定点 (1, 0)。`,
        question:
          "验证在定义域 (0, +∞) 上的单调递减性质，以及在 x → 0⁺ 时的趋向 +∞ 行为。",
      };
    }
  }, [params.baseA, showInverse]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="探究模式">
            <TabSwitcher
              tabs={[
                { key: "single", label: "单曲线性质" },
                { key: "inverse", label: "反函数对称" },
              ]}
              value={mode}
              onChange={(val) => setMode(val as "single" | "inverse")}
            />
            <div className="pt-2">
              <Toggle
                label="展示导数切线"
                checked={showTangent}
                onChange={setShowTangent}
              />
            </div>
          </LeftPanelSection>

          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() =>
                setParams({
                  ...defaultParams,
                  x0: 1.5,
                  baseA: 2.0,
                })
              }
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
        <div className="w-full h-full relative flex flex-col bg-white">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          {/* 右下角图例 */}
          <SceneLegend items={legendItems} />

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ExpLogScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              funcType="logarithmic"
              showInverse={showInverse}
              showTangent={showTangent}
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
          title="对数函数看板"
        />
      }
    />
  );
}
