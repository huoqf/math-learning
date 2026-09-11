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
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale, useScenario } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildPolyLatex } from "@/utils/polyBuilder";
import { QuadraticScene } from "./components/QuadraticScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/quadratic";
import { quadraticScenarios } from "./scenarios";

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

  // 当前情景 ID，默认为 "intersect"
  const [scenarioId, setScenarioId] = useState<string>("intersect");

  const { selectScenario } = useScenario({
    scenarios: quadraticScenarios,
    activeKey: scenarioId,
    params,
    onParamsChange: (newParams) => {
      setParams((prev) => ({ ...prev, ...newParams }));
    },
  });

  const handleScenarioChange = useCallback(
    (key: string) => {
      setScenarioId(key);
      selectScenario(key);
    },
    [selectScenario],
  );

  // 参数更新处理器（若手动微调则切到自由探索）
  const handleParamChange = useCallback((key: string, value: number) => {
    setScenarioId("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 重置参数
  const handleReset = useCallback(() => {
    setScenarioId("intersect");
    selectScenario("intersect");
  }, [selectScenario]);

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

  // 计算当前抛物线多项式的 LaTeX 表达式（统一采用红、橙、绿标准 Token 着色）
  const polyLatex = useMemo(() => {
    const terms = [];
    if (Math.abs(params.a) > 1e-9) {
      terms.push({
        coeff: params.a,
        power: 2,
        color: MATH_COLORS.paramPrimary,
      });
    }
    if (Math.abs(params.b) > 1e-9) {
      terms.push({
        coeff: params.b,
        power: 1,
        color: MATH_COLORS.paramSecondary,
      });
    }
    if (
      Math.abs(params.c) > 1e-9 ||
      (Math.abs(params.a) < 1e-9 && Math.abs(params.b) < 1e-9)
    ) {
      terms.push({
        coeff: params.c,
        power: 0,
        color: MATH_COLORS.paramTertiary,
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

  // 中屏毛玻璃图例 (SceneLegend)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const legendList: SceneLegendItem[] = [
      {
        label: "二次函数曲线",
        formula: "y = ax^2 + bx + c",
        colorKey: "function",
      },
    ];

    if (Math.abs(params.a) >= 1e-9) {
      legendList.push({
        label: "对称轴",
        // legend formula
        formula: "x = -\\frac{b}{2a}",
        colorKey: "asymptote",
        style: "dashed",
      });
      legendList.push({
        label: "抛物线顶点",
        // legend formula
        formula: "V(h, k)",
        colorKey: "focusPoint",
        style: "point",
      });
    }

    legendList.push({
      label: "y 轴截距",
      // legend formula
      formula: "(0, c)",
      colorKey: "paramTertiary",
      style: "point",
    });

    if (studyMode === "equation") {
      legendList.push({
        label: "方程实根",
        // legend formula
        formula: "x_1, x_2",
        colorKey: "focusPoint",
        style: "point",
      });
    } else if (studyMode === "inequality") {
      legendList.push({
        label: `解集区间 (${ineqType === ">" ? "上方" : "下方"})`,
        // legend formula
        formula: `f(x) ${ineqType} 0`,
        colorKey: "inequality",
        style: "area",
      });
    }

    return legendList;
  }, [params.a, studyMode, ineqType]);

  // 动态教学提示配置（100% LaTeX 包裹，左问右解闭环）
  const tipConfig = useMemo(() => {
    const matchedScenario = quadraticScenarios.find((s) => s.id === scenarioId);
    if (matchedScenario && scenarioId !== "free") {
      return {
        variant: "primary" as const,
        badge: matchedScenario.badge,
        condition: matchedScenario.condition,
        question: matchedScenario.question,
      };
    }

    const delta = params.b * params.b - 4 * params.a * params.c;
    switch (studyMode) {
      case "function":
        return {
          variant: "primary" as const,
          badge: "高考核心 · 二次函数图象特征与最值",
          condition: `二次项系数 $a = ${params.a.toFixed(1)}$，一次项 $b = ${params.b.toFixed(1)}$，常数项 $c = ${params.c.toFixed(1)}$。`,
          question:
            "求抛物线对称轴方程 $x = -\\frac{b}{2a}$ 与顶点坐标，并推导函数在给定闭区间上的单调性与最值分布。",
        };
      case "equation":
        return {
          variant: delta >= 0 ? ("success" as const) : ("danger" as const),
          badge: "高考高频 · 判别式 Δ 与实根对应",
          condition: `一元二次方程 $ax^2 + bx + c = 0$，判别式 $\\Delta = b^2 - 4ac = ${delta.toFixed(2)}$。`,
          question:
            delta > 0
              ? "求两相异实根 $x_1, x_2$，并验证根与系数关系（韦达定理）。"
              : delta === 0
                ? "求方程重根 $x_0$，说明抛物线与 $x$ 轴相切的代数几何对应。"
                : "判定实根个数，说明为何方程在实数集无解以及判别式的几何意义。",
        };
      case "inequality":
        return {
          variant: "warning" as const,
          badge: "高考基石 · 一元二次不等式解集几何化",
          condition: `探究不等式 $ax^2 + bx + c ${ineqType} 0$，开口方向由 $a = ${params.a.toFixed(1)}$ 决定，判别式 $\\Delta = ${delta.toFixed(2)}$。`,
          question:
            "结合二次函数图象在 $x$ 轴上下的区间分布，写出不等式的完整解集，并分析端点开闭性。",
        };
    }
  }, [scenarioId, params.a, params.b, params.c, studyMode, ineqType]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模式选择 Section */}
          <LeftPanelSection title="研究模式">
            <SelectGrid
              items={[
                { key: "function", label: "二次函数性质" },
                { key: "equation", label: "一元二次方程" },
                { key: "inequality", label: "一元二次不等式", fullWidth: true },
              ]}
              value={studyMode}
              onChange={(k) =>
                setStudyMode(k as "function" | "equation" | "inequality")
              }
              variant="filled"
            />
          </LeftPanelSection>

          {/* 2. 典型高考情景 Section */}
          <LeftPanelSection title="典型高考情景">
            <SelectGrid
              items={[
                ...quadraticScenarios.map((s) => ({
                  key: s.id,
                  label: s.name,
                })),
                { key: "free", label: "自由探索" },
              ]}
              value={scenarioId}
              onChange={handleScenarioChange}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 3. 不等号方向 Section（纯中文规范标题） */}
          {studyMode === "inequality" && (
            <LeftPanelSection title="不等号方向">
              <SelectGrid
                items={[
                  { key: ">", label: "大于零 (上方)" },
                  { key: "<", label: "小于零 (下方)" },
                ]}
                value={ineqType}
                onChange={(k) => setIneqType(k as ">" | "<")}
                variant="filled"
                color="success"
              />
            </LeftPanelSection>
          )}

          {/* 4. 参数调节 Section */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 5. 教学导引与考题设问 */}
          <LeftPanelSection title="教学导引" compact>
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
          {/* 方程公式 KaTeX 悬浮展示 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* 中屏右下角毛玻璃图例 (SceneLegend) */}
          <SceneLegend items={legendItems} title="图元指引" />

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
          reasoningSteps={mathData.reasoningSteps}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title={panelTitle}
        />
      }
    />
  );
}
