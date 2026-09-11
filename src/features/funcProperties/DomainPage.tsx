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
import { SceneLegend } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math";
import { PropertiesScene } from "./components/PropertiesScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/funcProperties";

import type { PropertiesFnType } from "./components/types";

const FORMULA_MAP: Record<PropertiesFnType, string> = {
  cubic: "f(x) = x^3 \\quad (D = \\mathbb{R}, \\ R = \\mathbb{R})",
  quadratic: "f(x) = x^2 \\quad (D = \\mathbb{R}, \\ R = [0, +\\infty))",
  root: "f(x) = \\sqrt{x} \\quad (D = [0, +\\infty), \\ R = [0, +\\infty))",
  abs: "f(x) = |x| \\quad (D = \\mathbb{R}, \\ R = [0, +\\infty))",
  reciprocal:
    "f(x) = \\frac{1}{x} \\quad (D = (-\\infty, 0) \\cup (0, +\\infty), \\ R = (-\\infty, 0) \\cup (0, +\\infty))",
  sin: "f(x) = \\sin x \\quad (D = \\mathbb{R}, \\ R = [-1, 1])",
};

export function DomainPage() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [fnType, setFnType] = useState<PropertiesFnType>("cubic");

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-properties", params, {
        mode: "domain",
        fnType,
      }),
    [params, fnType],
  );

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return ["x0"]
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

  // 动态教学提示配置（严格包裹 $...$，符合新高考破题设问要求）
  const tipConfig = useMemo(() => {
    switch (fnType) {
      case "cubic":
        return {
          variant: "primary" as const,
          badge: "基础认知 · 三次多项式定义域与值域",
          condition:
            "函数 $f(x) = x^3$，初等解析式中无分母、根号或对数等限制结构。",
          question:
            "求解自变量与函数值的取值范围 $D$ 与 $R$，并检验垂直线 $x = x_0$ 与图象交点的唯一性。",
        };
      case "quadratic":
        return {
          variant: "primary" as const,
          badge: "核心考点 · 二次函数单侧有界值域",
          condition:
            "函数 $f(x) = x^2$ ($x \\in \\mathbb{R}$)，抛物线开口向上且顶点位于原点 $(0, 0)$。",
          question:
            "移动探针 $x_0$，求解函数在实数域上的最值并写出对应的值域区间。",
        };
      case "root":
        return {
          variant: "primary" as const,
          badge: "典型课标 · 偶次根式非负定义域约束",
          condition:
            "函数 $f(x) = \\sqrt{x}$，初等算术平方根要求被开方数非负。",
          question:
            "列出被开方数满足的充要不等式，求解定义域边界与垂直线检验在越界时的表现。",
        };
      case "abs":
        return {
          variant: "warning" as const,
          badge: "高考高频 · 绝对值非负值域模型",
          condition:
            "函数 $f(x) = |x|$，依据定义在 $x = 0$ 折叠为两支对称射线。",
          question:
            "求解绝对值在折点处的极小值下界，并说明为何自变量取任意实数均有唯一定义。",
        };
      case "reciprocal":
        return {
          variant: "danger" as const,
          badge: "易错陷阱 · 反比例分母去心无定义点",
          condition: "函数 $f(x) = \\frac{1}{x}$，分母包含自变量要求分母非零。",
          question:
            "探究 $x_0$ 趋近于奇点 $x = 0$ 时的函数表现，求解去心定义域与渐近线方程。",
        };
      case "sin":
        return {
          variant: "info" as const,
          badge: "周期有界 · 正弦波动紧致值域",
          condition: "函数 $f(x) = \\sin x$，具有 $2\\pi$ 周期性与全局有界性。",
          question:
            "结合单位圆几何投影，求解正弦函数的上确界与下确界，并确定紧致闭区间值域。",
        };
    }
  }, [fnType]);

  // 中屏右下角图例卡片
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const items: SceneLegendItem[] = [
      {
        color: MATH_COLORS.function,
        formula:
          fnType === "cubic"
            ? "y = x^3"
            : fnType === "quadratic"
              ? "y = x^2"
              : fnType === "root"
                ? "y = \\sqrt{x}"
                : fnType === "abs"
                  ? "y = |x|"
                  : fnType === "reciprocal"
                    ? "y = \\frac{1}{x}"
                    : "y = \\sin x",
        style: "solid",
      },
      {
        color: MATH_COLORS.paramPrimary,
        label: "动探针 P₀(x₀, f(x₀))",
        style: "point",
      },
      {
        color: MATH_COLORS.paramPrimary,
        label: "垂线检验 x = x₀",
        style: "dashed",
      },
      {
        color: MATH_COLORS.functionTransformed,
        label: "X 轴投影：定义域 D",
        style: "solid",
      },
      {
        color: MATH_COLORS.functionSecondary,
        label: "Y 轴投影：值域 R",
        style: "solid",
      },
    ];

    if (fnType === "reciprocal") {
      items.push({
        color: MATH_COLORS.degeneracy,
        label: "x = 0 (去心奇点)",
        style: "hollow-point",
      });
    } else if (fnType === "root") {
      items.push({
        color: MATH_COLORS.degeneracy,
        label: "x < 0 (超出定义域)",
        style: "hollow-point",
      });
    }

    return items;
  }, [fnType]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="基准函数选择">
            <SelectGrid
              items={[
                { key: "cubic", label: "三次函数", formula: "y=x^3" },
                { key: "quadratic", label: "二次函数", formula: "y=x^2" },
                { key: "root", label: "根式函数", formula: "y=\\sqrt{x}" },
                { key: "abs", label: "绝对值函数", formula: "y=|x|" },
                {
                  key: "reciprocal",
                  label: "反比例函数",
                  formula: "y=\\frac{1}{x}",
                },
                { key: "sin", label: "正弦函数", formula: "y=\\sin x" },
              ]}
              value={fnType}
              onChange={(k) => setFnType(k as PropertiesFnType)}
              variant="outline"
              className="mb-4"
            />
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
            <TipCard
              variant={tipConfig.variant}
              badge={tipConfig.badge}
              condition={tipConfig.condition}
              question={tipConfig.question}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={FORMULA_MAP[fnType]} mode="inline" />
          </div>
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <PropertiesScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              fnType={fnType}
              mode="domain"
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
          reasoningSteps={mathData.reasoningSteps}
          title="定义域与值域看板"
        />
      }
    />
  );
}
