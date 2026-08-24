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
import { CANVAS_PRESETS, ALGEBRA_COLORS, CALCULUS_COLORS } from "@/theme";
import { buildPolyLatex } from "@/utils/polyBuilder";
import { QuadraticScene } from "./components/QuadraticScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/quadratic";

export function QuadraticAnimation() {
  // 研究模式：'function' | 'equation' | 'inequality'
  const [studyMode, setStudyMode] = useState<
    "function" | "equation" | "inequality"
  >("function");
  // 不等式方向：'>' | '<'
  const [ineqType, setIneqType] = useState<">" | "<">(">");

  // 1. 本地状态保存 a, b, c 参数
  const [params, setParams] = useState(() => ({
    a: defaultParams.a,
    b: defaultParams.b,
    c: defaultParams.c,
  }));

  // 2. 视口尺寸测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 3. 构建直角坐标系比例尺：数学范围 X [-6, 6]，Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 4. 数学量看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-quadratic", params, {
      studyMode,
      ineqType,
    });
  }, [params, studyMode, ineqType]);

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({
      a: defaultParams.a,
      b: defaultParams.b,
      c: defaultParams.c,
    });
  };

  // 构建声明式控制面板配置参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return Object.entries(paramMeta).map(([key, meta]) => ({
      key,
      label: meta.label,
      labelFormula: meta.labelFormula,
      value: params[key as keyof typeof params] ?? meta.defaultValue ?? 0,
      min: meta.min,
      max: meta.max,
      step: meta.step ?? 0.1,
      description: meta.description,
      descriptionFormula: meta.descriptionFormula,
      importance: meta.importance,
      marks: meta.marks,
    }));
  }, [params]);

  // 计算当前抛物线多项式的 LaTeX 表达式（带参数着色）
  const polyLatex = useMemo(() => {
    const terms = [];
    if (Math.abs(params.a) > 1e-9) {
      terms.push({ coeff: params.a, power: 2, color: ALGEBRA_COLORS.sequence });
    }
    if (Math.abs(params.b) > 1e-9) {
      terms.push({
        coeff: params.b,
        power: 1,
        color: ALGEBRA_COLORS.inequality,
      });
    }
    if (
      Math.abs(params.c) > 1e-9 ||
      (Math.abs(params.a) < 1e-9 && Math.abs(params.b) < 1e-9)
    ) {
      terms.push({
        coeff: params.c,
        power: 0,
        color: CALCULUS_COLORS.derivative,
      });
    }
    return buildPolyLatex(terms);
  }, [params]);

  // 组装最终的公式
  const equationLatex = useMemo(() => {
    if (studyMode === "function") {
      return `f(x) = ${polyLatex}`;
    } else if (studyMode === "equation") {
      return `${polyLatex} = 0`;
    } else {
      return `${polyLatex} ${ineqType} 0`;
    }
  }, [polyLatex, studyMode, ineqType]);

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "function") return "二次函数指标看板";
    if (studyMode === "equation") return "一元二次方程指标看板";
    return "一元二次不等式指标看板";
  }, [studyMode]);

  // 动态教学提示配置
  const tipConfig = useMemo(() => {
    const delta = params.b * params.b - 4 * params.a * params.c;
    switch (studyMode) {
      case "function":
        return {
          variant: "primary" as const,
          badge: "高考核心 · 二次函数图象特征与最值",
          condition: `二次项系数 a = ${params.a.toFixed(1)}，一次项 b = ${params.b.toFixed(1)}，常数项 c = ${params.c.toFixed(1)}。`,
          question:
            "观察抛物线开口方向、对称轴 x = -b/(2a) 与顶点坐标，确定在给定区间上的最值分布。",
        };
      case "equation":
        return {
          variant: delta >= 0 ? ("success" as const) : ("danger" as const),
          badge: "高考高频 · 判别式 Δ 与实根个数对应",
          condition: `一元二次方程 ax² + bx + c = 0，判别式 Δ = b² - 4ac = ${delta.toFixed(2)}。`,
          question:
            delta > 0
              ? "Δ > 0，抛物线与 x 轴有两个相异交点，求两实根 x₁, x₂。"
              : delta === 0
                ? "Δ = 0，抛物线与 x 轴相切，方程有两相等实根。"
                : "Δ < 0，抛物线与 x 轴无交点，方程无实数根。",
        };
      case "inequality":
        return {
          variant: "warning" as const,
          badge: "高考基石 · 一元二次不等式解集几何化",
          condition: `探究不等式 ax² + bx + c ${ineqType} 0，抛物线开口与判别式 Δ = ${delta.toFixed(2)}。`,
          question:
            ineqType === ">"
              ? params.a > 0
                ? delta > 0
                  ? "a > 0, Δ > 0：取抛物线上方两侧区间 (-∞, x₁) ∪ (x₂, +∞)。"
                  : "a > 0, Δ ≤ 0：恒成立或全实数除顶点。"
                : "a < 0：开口向下，图象上方位于两根之间 (x₁, x₂)。"
              : params.a > 0
                ? delta > 0
                  ? "a > 0, Δ > 0：取抛物线下方中间开区间 (x₁, x₂)。"
                  : "a > 0, Δ ≤ 0：解集为空集 ∅。"
                : "a < 0：开口向下，图象下方位于两根外侧。",
        };
    }
  }, [params.a, params.b, params.c, studyMode, ineqType]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection title="研究模式" subtitle="选择三位一体探讨对象">
            <SelectGrid
              items={[
                { key: "function", label: "二次函数性质" },
                { key: "equation", label: "一元二次方程" },
                { key: "inequality", label: "一元二次不等式", fullWidth: true },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 不等号方向 Section */}
          {studyMode === "inequality" && (
            <LeftPanelSection
              title="不等号方向"
              subtitle="选择解集的大于/小于关系"
            >
              <SelectGrid
                items={[
                  { key: ">", label: "f(x) > 0", formula: "f(x) > 0" },
                  { key: "<", label: "f(x) < 0", formula: "f(x) < 0" },
                ]}
                value={ineqType}
                onChange={(k) => setIneqType(k as ">" | "<")}
                variant="filled"
                color="success"
              />
            </LeftPanelSection>
          )}

          {/* 参数调节 Section */}
          <LeftPanelSection title="参数调节" subtitle="拖动滑块改变抛物线系数">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
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
          {/* 方程公式 KaTeX 悬浮展示 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <QuadraticScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              ineqType={ineqType}
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
          title={panelTitle}
        />
      }
    />
  );
}
