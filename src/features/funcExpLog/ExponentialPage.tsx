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
import { defaultParams, paramMeta } from "@/data/registries/funcExpLog";

export function ExponentialPage() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
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
        subExpLog: "exponential",
      }),
    [params],
  );

  const formulaLatex = useMemo(() => {
    const aVal = (params.baseA ?? 2.0).toFixed(1);
    return showInverse
      ? `y = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}^x \\iff x = \\log_{\\color{${MATH_COLORS.paramPrimary}}{${aVal}}} y`
      : `y = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}^x`;
  }, [showInverse, params.baseA]);

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["x0", "baseA"];
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
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 1-to-1 右下角图例配置
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const aVal = (params.baseA ?? 2.0).toFixed(1);
    const items: SceneLegendItem[] = [
      {
        formula: `y = ${aVal}^x`,
        color: MATH_COLORS.function,
        style: "solid",
      },
      {
        label: "(0, 1) 必过定点",
        color: MATH_COLORS.function,
        style: "point",
      },
    ];

    if (showInverse) {
      items.push({
        formula: `y = \\log_{${aVal}} x \\text{ (反函数)}`,
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

  // 动态教学提示配置
  const tipConfig = useMemo(() => {
    const a = params.baseA ?? 2.0;
    if (showInverse) {
      return {
        variant: "info" as const,
        badge: "高考高频 · 指数与对数反函数对称",
        condition: `指数函数 y = ${a.toFixed(1)}ˣ 与对数函数 y = log_{${a.toFixed(1)}} x 互为反函数。`,
        question:
          "观察两曲线关于直线 y = x 严格轴对称，且定点 (0,1) 与 (1,0) 互为对称镜像，体会定义域与值域的互换映射 (D ↔ R)。",
      };
    }
    if (a > 1) {
      return {
        variant: "primary" as const,
        badge: "核心基准 · 指数爆炸与递增模型 (a > 1)",
        condition: `底数 a = ${a.toFixed(1)} > 1，函数恒过定点 (0, 1)，水平渐近线为 x 轴 (y = 0)。`,
        question:
          "探究 x → +∞ 时的指数爆炸增长速度，以及 x → -∞ 时图象单侧无限贴近 x 轴的性质。",
      };
    } else {
      return {
        variant: "warning" as const,
        badge: "核心基准 · 衰减指数与递减模型 (0 < a < 1)",
        condition: `底数 0 < a = ${a.toFixed(1)} < 1，函数恒过定点 (0, 1)。`,
        question:
          "验证在 R 上的单调递减性，以及随自变量增大函数值快速趋向 0 的衰减趋势。",
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
              funcType="exponential"
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
          title="指数函数看板"
        />
      }
    />
  );
}
