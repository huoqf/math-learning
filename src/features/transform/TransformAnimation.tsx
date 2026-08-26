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
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS, withAlpha } from "@/theme";
import { TransformScene } from "./components/TransformScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/transform";
import {
  buildTransformLatex,
  type BaseFnType,
  type FoldMode,
} from "@/math/transform";

export function TransformAnimation() {
  const [params, setParams] = useState(() => ({ ...defaultParams }));
  const [fnType, setFnType] = useState<BaseFnType>("quadratic");
  const [foldMode, setFoldMode] = useState<FoldMode>("none");

  // Step 1: 自适应视口
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // Step 2: 比例尺
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // Step 3: 右屏数学数据组装
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-func-transform", params, { fnType, foldMode }),
    [params, fnType, foldMode],
  );

  // 严格标准消元与色彩绑定的 KaTeX 公式
  const formulaLatex = useMemo(() => {
    return buildTransformLatex(
      fnType,
      {
        h: params.h ?? 1.0,
        k: params.k ?? 0.5,
        A: params.A ?? 1.5,
        omega: params.omega ?? 1.0,
        foldMode,
      },
      {
        colorPrimary: MATH_COLORS.paramPrimary,
        colorSecondary: MATH_COLORS.paramSecondary,
      },
    );
  }, [fnType, foldMode, params]);

  // Step 4: 声明式参数配置 (按水平与竖直对象化分组)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return Object.keys(paramMeta).map((key) => {
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

  // 中屏右下角图例卡片
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const baseNames: Record<BaseFnType, string> = {
      quadratic: "y = x^2",
      sine: "y = \\sin x",
      cubic: "y = x^3",
      exp: "y = 2^x",
    };

    return [
      {
        label: `母函数 ${baseNames[fnType]}`,
        color: withAlpha(MATH_COLORS.function, 0.6),
        style: "dash",
      },
      {
        label: "目标图象 y = T[f](x)",
        color: MATH_COLORS.paramPrimary,
        style: "solid",
      },
      {
        label: "特征点迁移轨迹",
        color: withAlpha(MATH_COLORS.paramSecondary, 0.8),
        style: "dot",
      },
    ];
  }, [fnType]);

  // 动态教学提示 (说明模型条件和研究问题，防止学生看不懂当前场景)
  const tipContent = useMemo(() => {
    const { h, k, A, omega } = params;

    if (foldMode === "global") {
      return {
        variant: "warning" as const,
        badge: "整体绝对值翻折变换",
        conditionNode: (
          <span>
            基准母函数图象经整体绝对值变换为{" "}
            <KatexFormula formula="y = |f(x)|" mode="inline" />。
          </span>
        ),
        questionNode: (
          <span>
            观察图象如何保留 <KatexFormula formula="x" mode="inline" />{" "}
            轴上方并将下方翻折向上，理解值域非负 (
            <KatexFormula formula="y \ge 0" mode="inline" />)
            与零点处尖点的不可导性。
          </span>
        ),
      };
    }

    if (foldMode === "input") {
      return {
        variant: "info" as const,
        badge: "自变量绝对值翻折变换",
        conditionNode: (
          <span>
            基准母函数图象经自变量绝对值变换为{" "}
            <KatexFormula formula="y = f(|x|)" mode="inline" />。
          </span>
        ),
        questionNode: (
          <span>
            观察图象如何保留 <KatexFormula formula="y" mode="inline" />{" "}
            轴右侧并向左对称复制，理解{" "}
            <KatexFormula formula="f(|-x|) = f(|x|)" mode="inline" />{" "}
            恒为偶函数且单调性镜像反转。
          </span>
        ),
      };
    }

    const hDesc =
      h >= 0 ? `右移 ${h.toFixed(1)}` : `左移 ${Math.abs(h).toFixed(1)}`;
    const kDesc =
      k >= 0 ? `上移 ${k.toFixed(1)}` : `下移 ${Math.abs(k).toFixed(1)}`;

    return {
      variant: "primary" as const,
      badge: "函数平移与伸缩变换",
      conditionNode: (
        <span>
          基准母函数经历水平平移{" "}
          <KatexFormula formula={`h = ${h.toFixed(1)}`} mode="inline" /> (
          {hDesc})、竖直平移{" "}
          <KatexFormula formula={`k = ${k.toFixed(1)}`} mode="inline" /> (
          {kDesc})，横向伸缩{" "}
          <KatexFormula
            formula={`\\omega = ${omega.toFixed(1)}`}
            mode="inline"
          />
          ，纵向伸缩{" "}
          <KatexFormula formula={`A = ${A.toFixed(1)}`} mode="inline" />。
        </span>
      ),
      questionNode: (
        <span>
          探究各参数如何决定图象的位移与形变，体会“先平移后伸缩”与“先伸缩后平移”提公因式的代数本质。
        </span>
      ),
    };
  }, [foldMode, params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 母函数模型选择 */}
          <LeftPanelSection title="基准母函数">
            <SelectGrid
              items={[
                { key: "quadratic", formula: "y = x^2" },
                { key: "sine", formula: "y = \\sin x" },
                { key: "cubic", formula: "y = x^3" },
                { key: "exp", formula: "y = 2^x" },
              ]}
              value={fnType}
              onChange={(k) => setFnType(k as BaseFnType)}
              variant="outline"
              columns={2}
            />
          </LeftPanelSection>

          {/* 绝对值翻折模式 */}
          <LeftPanelSection title="绝对值翻折">
            <SelectGrid
              items={[
                { key: "none", formula: "\\text{无翻折}" },
                { key: "global", formula: "y = |f(x)|" },
                { key: "input", formula: "y = f(|x|)" },
              ]}
              value={foldMode}
              onChange={(k) => setFoldMode(k as FoldMode)}
              variant="outline"
              columns={3}
            />
          </LeftPanelSection>

          {/* 对象化参数调节 */}
          <LeftPanelSection title="平移与伸缩参数">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>

          {/* 教学提示 */}
          <LeftPanelSection title="教学提示" compact>
            <TipCard variant={tipContent.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipContent.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【模型条件】
                  </span>
                  <span className="text-neutral-600">
                    {tipContent.conditionNode}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【研究问题】
                  </span>
                  <span className="text-neutral-600">
                    {tipContent.questionNode}
                  </span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* Katex 公式浮标：精简消元与三位一体色彩绑定 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          {/* 中屏右下角图例 */}
          <SceneLegend items={legendItems} />

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TransformScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              fnType={fnType}
              foldMode={foldMode}
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
          title="图象变换看板"
        />
      }
    />
  );
}
