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
  renderMixedLatex,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { ExpLogScene } from "./components/ExpLogScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams } from "@/data/registries/funcExpLog";

/**
 * 拓展图层（选择性必修二前瞻）——**默认关闭**。
 *
 * 本页正文属必修一「指数函数与对数函数」：正文、图例、推导链一律不出现导数记号，
 * 由 `src/test/syllabusContentBoundary.test.ts` 的内容边界门禁守护。
 * 「切线」图层来自选必二「一元函数的导数及其应用」，属前瞻性拓展，
 * 打开后徽标切换为「选必二前瞻 · 拓展（非必修一正文要求）」，与正文明确区分。
 * 该图层在门禁中以**声明式放行**登记（`EXTENSION_ALLOWLIST`），不是漏检。
 */
const EXTENSION_LAYER_LABEL = "展示切线（选必二前瞻 · 拓展）";
const EXTENSION_BADGE = "选必二前瞻 · 拓展（非必修一正文要求）";

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
        explogMode: mode,
      }),
    [params, mode],
  );

  const formulaLatex = useMemo(() => {
    const aVal = (params.baseA ?? 2.0).toFixed(1).replace(/\.0$/, "");
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
            label: "退化 (a=1 非对数函数)",
            labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a} = 1`,
          },
          {
            value: 2.7,
            variant: "recommended",
            label: "自然底数 e ≈ 2.718",
            labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a = e \\approx 2.7}`,
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
    const aVal = (params.baseA ?? 2.0).toFixed(1).replace(/\.0$/, "");
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
      items.push({
        label: "对称中点 M",
        color: MATH_COLORS.axis,
        style: "point",
      });
    }

    // @syllabus-extension:begin 拓展图层图例（选必二前瞻 · 切线）
    if (showTangent) {
      items.push({
        label: "切线 $f'(x_0)$",
        color: MATH_COLORS.tangentLine,
        style: "solid",
      });
    }
    // @syllabus-extension:end

    return items;
  }, [params.baseA, showInverse, showTangent]);

  // 教学提示配置
  const tipConfig = useMemo(() => {
    const a = params.baseA ?? 2.0;

    // ⚠ 拓展图层（选必二前瞻）：仅当切线开关打开时，才把设问切到导数口径，
    //   并以 EXTENSION_BADGE 显式标注——保证默认状态下页面不出现任何选必二内容。
    // @syllabus-extension:begin 拓展设问（选必二前瞻 · 切线方程 / 切线放缩 / 相切临界）
    if (showTangent) {
      return showInverse
        ? {
            variant: "accent" as const,
            badge: EXTENSION_BADGE,
            condition:
              "设对数函数 $y = \\log_a x$ 与指数函数 $y = a^x$ 互为反函数，对称轴为直线 $y = x$。",
            question:
              "（拓展）证明动点 $P(x_0, y_0)$ 与其对称点 $P'(y_0, x_0)$ 的连线被直线 $y = x$ 垂直平分，并求解两曲线相切时的底数临界值 $a_c$ 与切点坐标。",
          }
        : {
            variant: "accent" as const,
            badge: EXTENSION_BADGE,
            condition: `底数 $a = ${a.toFixed(1)}$，真数定义域 $x \\in (0, +\\infty)$，恒过定点 $(1, 0)$。`,
            question:
              "（拓展）求函数在探究动点处的切线方程，并写出该点处的高考切线放缩不等式。",
          };
    }
    // @syllabus-extension:end

    if (showInverse) {
      return {
        variant: "info" as const,
        badge: "高考高频 · 对数与指数反函数对称",
        condition:
          "设对数函数 $y = \\log_a x$ 与指数函数 $y = a^x$ 互为反函数，对称轴为直线 $y = x$。",
        question:
          "证明动点 $P(x_0, y_0)$ 与其对称点 $P'(y_0, x_0)$ 的连线被直线 $y = x$ 垂直平分，并据此说明两图象关于直线 $y = x$ 对称。",
      };
    }
    if (a > 1) {
      return {
        variant: "primary" as const,
        badge: "核心基准 · 对数缓增与垂直渐近线 (a > 1)",
        condition:
          "底数 $a > 1$，真数定义域 $x \\in (0, +\\infty)$，恒过定点 $(1, 0)$，竖直渐近线为 $x = 0$ (y 轴)。",
        question:
          "判定函数在定义域 $(0, +\\infty)$ 上的单调性与图象形态，并比较底数 $a > 1$ 增大时图象陡缓的变化规律（底数越大，图象越过定点后越平缓）。",
      };
    } else {
      return {
        variant: "warning" as const,
        badge: "核心基准 · 衰减对数模型 (0 < a < 1)",
        condition:
          "底数 $0 < a < 1$，真数定义域 $x \\in (0, +\\infty)$，恒过定点 $(1, 0)$。",
        question:
          "判定对数值在区间 $(0, 1)$ 与 $(1, +\\infty)$ 上的正负符号分界，并证明函数在区间 $(0, +\\infty)$ 上的严格单调递减性质。",
      };
    }
  }, [params.baseA, showInverse, showTangent]);

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
              {/* @syllabus-extension:begin 拓展图层开关（选必二前瞻），默认关闭 */}
              <Toggle
                label={EXTENSION_LAYER_LABEL}
                checked={showTangent}
                onChange={setShowTangent}
              />
              {/* @syllabus-extension:end */}
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
                    {renderMixedLatex(tipConfig.condition)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【核心设问】
                  </span>
                  <span className="text-neutral-600">
                    {renderMixedLatex(tipConfig.question)}
                  </span>
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
      right={<MathPanel {...mathData} title="对数函数看板" />}
    />
  );
}
