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
  SelectGrid,
  Toggle,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { PowerScene } from "./components/PowerScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/funcExpLog";
import {
  calculatePowerFunction,
  STANDARD_POWER_FUNCTIONS,
} from "@/math/function";

export function PowerPage() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [showTangent, setShowTangent] = useState(false);
  const [showCompareLine, setShowCompareLine] = useState(false);

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-explog", params, {
        subExpLog: "power",
        powerMode: mode,
      }),
    [params, mode],
  );

  const powerRes = useMemo(
    () => calculatePowerFunction(params.powerAlpha ?? 2.0, params.x0 ?? 1.5),
    [params.powerAlpha, params.x0],
  );

  // 当前选中的基准元数据
  const currentPresetInfo = useMemo(() => {
    return (
      STANDARD_POWER_FUNCTIONS.find(
        (p) => Math.abs(p.alpha - (params.powerAlpha ?? 2.0)) < 1e-4,
      ) ?? STANDARD_POWER_FUNCTIONS[1]
    );
  }, [params.powerAlpha]);

  const formulaLatex = useMemo(() => {
    const alpha = params.powerAlpha ?? 2.0;
    const colorCmd = `\\color{${MATH_COLORS.paramPrimary}}`;

    // 1. 对比模式：展示 5 大基准族概括方程及当前高亮项
    if (mode === "compare") {
      const activeLatex = currentPresetInfo.latex;
      return `y = x^{\\alpha} \\; (\\alpha \\in \\{1, 2, 3, \\tfrac{1}{2}, -1\\}) \\quad [\\text{高亮: } \\color{${currentPresetInfo.colorToken}}{${activeLatex}}]`;
    }

    // 2. 单函数模式：展示单函数精准标准方程
    if (Math.abs(alpha - 1) < 1e-4) {
      return `y = x^{${colorCmd}{1}} = x`;
    }
    if (Math.abs(alpha - 2) < 1e-4) {
      return `y = x^{${colorCmd}{2}}`;
    }
    if (Math.abs(alpha - 3) < 1e-4) {
      return `y = x^{${colorCmd}{3}}`;
    }
    if (Math.abs(alpha - 0.5) < 1e-4) {
      return `y = \\sqrt{x} \\quad (x^{${colorCmd}{1/2}})`;
    }
    if (Math.abs(alpha - -1) < 1e-4) {
      return `y = \\frac{1}{x} \\quad (x^{${colorCmd}{-1}})`;
    }
    if (Math.abs(alpha) < 1e-4) {
      return `y = 1 \\quad (x^{${colorCmd}{0}},\\; x \\neq 0)`;
    }
    return `y = x^{${colorCmd}{${alpha.toFixed(1).replace(/\.0$/, "")}}}`;
  }, [params.powerAlpha, mode, currentPresetInfo]);

  // 根据模式自适应参数项（对比模式下参数降维，锁定 alpha 仅保留 x0）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = mode === "compare" ? ["x0"] : ["x0", "powerAlpha"];
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
  }, [params, mode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 5 大基准预设快速切换
  const handleSelectPreset = (key: string) => {
    const target = STANDARD_POWER_FUNCTIONS.find((p) => p.key === key);
    if (target) {
      setParams((prev) => ({ ...prev, powerAlpha: target.alpha }));
    }
  };

  const currentPresetKey = useMemo(() => {
    const matched = STANDARD_POWER_FUNCTIONS.find(
      (p) => Math.abs(p.alpha - (params.powerAlpha ?? 2.0)) < 1e-4,
    );
    return matched?.key ?? "power-2";
  }, [params.powerAlpha]);

  // 中屏右下角图例 items (与中屏内容 100% 准确同步)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (mode === "compare") {
      // 对比模式：完整呈现 5 大基准曲线 + 公共定点 + 辅助线
      const items: SceneLegendItem[] = STANDARD_POWER_FUNCTIONS.map((p) => {
        const isCurrent = Math.abs(p.alpha - (params.powerAlpha ?? 2.0)) < 1e-4;
        return {
          label: isCurrent ? `${p.name} (当前)` : p.name,
          formula: p.latex,
          color: p.colorToken,
          style: isCurrent ? "solid" : "dash",
        };
      });

      items.push({
        label: "公共定点",
        formula: "(1, 1)",
        color: MATH_COLORS.paramPrimary,
        style: "point",
      });

      if (showCompareLine) {
        items.push({
          label: "比较线",
          formula: "x = 2",
          color: MATH_COLORS.axis,
          style: "dash",
        });
      }

      return items;
    }

    // 自由单函数模式：呈现主曲线、公共定点、切线与比较线
    const items: SceneLegendItem[] = [
      {
        label: "主曲线",
        formula: formulaLatex.split("\\quad")[0],
        color: MATH_COLORS.function,
        style: "solid",
      },
      {
        label: "公共定点",
        formula: "(1, 1)",
        color: MATH_COLORS.paramPrimary,
        style: "point",
      },
    ];

    if (showTangent && powerRes.isTangentDifferentiable) {
      items.push({
        label: "切线",
        formula: powerRes.tangentEquationLatex,
        color: MATH_COLORS.tangentLine,
        style: "dash",
      });
    }

    if (showCompareLine) {
      items.push({
        label: "比较线",
        formula: "x = 2",
        color: MATH_COLORS.axis,
        style: "dash",
      });
    }

    return items;
  }, [
    mode,
    params.powerAlpha,
    formulaLatex,
    showTangent,
    powerRes,
    showCompareLine,
  ]);

  // 动态教学提示配置
  const tipConfig = useMemo(() => {
    const alpha = params.powerAlpha ?? 2.0;
    if (mode === "compare") {
      return {
        variant: "primary" as const,
        badge: "高考秒杀 · 5 大基准幂函数同屏对比",
        condition:
          "课标 5 大基准函数：y = x, y = x², y = x³, y = 1/x, y = √x 同屏对照。",
        question:
          "观察在 (0, 1) 与 (1, +∞) 区间内不同曲线的高低交错，并在 x = 2 处验证【指大图高】规律。",
      };
    }
    if (alpha > 1) {
      return {
        variant: "primary" as const,
        badge: "高考基础 · 幂函数超线性增长 (α > 1)",
        condition: `幂指数 α = ${alpha.toFixed(1).replace(/\.0$/, "")} > 1，第一象限图象恒过定点 (0, 0) 与 (1, 1)。`,
        question:
          "观察在 (0, 1) 区间内增长慢于 y = x，而在 (1, +∞) 区间内增长快于 y = x 且凹弧凸起的形态特征。",
      };
    } else if (alpha > 0) {
      return {
        variant: "warning" as const,
        badge: "高考高频 · 幂函数根号型下垂 (0 < α < 1)",
        condition: `幂指数 0 < α = ${alpha.toFixed(1).replace(/\.0$/, "")} < 1，恒过定点 (0, 0) 与 (1, 1)。`,
        question:
          "观察原点切线竖直趋向无穷大、在 (1, +∞) 上增长逐渐平缓且凸弧下垂的趋势。",
      };
    } else if (Math.abs(alpha) < 1e-6) {
      return {
        variant: "info" as const,
        badge: "特殊退化 · 零次常数水平线 (α = 0)",
        condition: "幂指数 α = 0，定义域去心 x ≠ 0，y = 1。",
        question: "观察第一象限与第二象限退化为 y = 1 水平线，x = 0 处无定义。",
      };
    } else {
      return {
        variant: "danger" as const,
        badge: "核心考点 · 负指数双曲线分支 (α < 0)",
        condition: `幂指数 α = ${alpha.toFixed(1).replace(/\.0$/, "")} < 0，定义域不含原点，图象恒过定点 (1, 1)。`,
        question:
          "验证在 (0, +∞) 上单调递减，且双坐标轴 x = 0 与 y = 0 均为渐近线。",
      };
    }
  }, [params.powerAlpha, mode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 探究维度 */}
          <LeftPanelSection title="探究维度">
            <TabSwitcher
              tabs={[
                { key: "compare", label: "5大基准同屏对比" },
                { key: "single", label: "自由连续指数探究" },
              ]}
              value={mode}
              onChange={(k) => setMode(k as "single" | "compare")}
            />
          </LeftPanelSection>

          {/* 2. 对比模式：展示 5 大基准聚焦选择器；自由模式：隐藏该选择器，完全由连续滑块驱动 */}
          {mode === "compare" && (
            <LeftPanelSection title="基准对比聚焦">
              <SelectGrid
                items={[
                  { key: "power-1", label: "正比例", formula: "y=x" },
                  { key: "power-2", label: "二次抛物线", formula: "y=x^2" },
                  { key: "power-3", label: "三次曲线", formula: "y=x^3" },
                  {
                    key: "power-half",
                    label: "平方根",
                    formula: "y=\\sqrt{x}",
                  },
                  {
                    key: "power-neg1",
                    label: "反比例",
                    formula: "y=\\frac{1}{x}",
                  },
                ]}
                value={currentPresetKey}
                onChange={handleSelectPreset}
                variant="outline"
              />
            </LeftPanelSection>
          )}

          {/* 3. 参数调节 (对比模式仅保留 x0 动点；自由模式展开 alpha 连续滑块) */}
          <LeftPanelSection
            title={mode === "compare" ? "探究动点调节" : "参数连续调节"}
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>

          {/* 4. 辅助图层开关 */}
          <LeftPanelSection title="高考辅助图层" compact>
            <div className="flex flex-col gap-2 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200/60">
              {mode === "single" && (
                <Toggle
                  label="显示切线与切点导数"
                  checked={showTangent}
                  onChange={setShowTangent}
                />
              )}
              <Toggle
                label="显示 x = 2 比较线 (指大图高)"
                checked={showCompareLine}
                onChange={setShowCompareLine}
              />
            </div>
          </LeftPanelSection>

          {/* 5. 教学导引与设问 */}
          <LeftPanelSection title="教学导引与设问" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【模型特征】
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
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <PowerScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              mode={mode}
              showTangent={showTangent}
              showCompareLine={showCompareLine}
            />
          </AnimationSvgCanvas>
          {/* 中屏右下角毛玻璃图例卡片 */}
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
          title="幂函数看板"
        />
      }
    />
  );
}
