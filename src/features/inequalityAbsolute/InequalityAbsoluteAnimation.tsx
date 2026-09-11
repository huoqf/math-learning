/**
 * src/features/inequalityAbsolute/InequalityAbsoluteAnimation.tsx
 * 绝对值不等式几何意义三屏交互编排层
 */

import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TabSwitcher,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale, useScenario } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { InequalityAbsoluteScene } from "./components/InequalityAbsoluteScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/inequalityAbsolute";
import type { InequalityMode, InequalityType } from "@/math/inequalityAbsolute";
import { SCENARIOS_BY_MODE, type ScenarioParams } from "./scenarios";

export function InequalityAbsoluteAnimation() {
  const [studyMode, setStudyMode] = useState<InequalityMode>("sum");
  const [ineqType, setIneqType] = useState<InequalityType>("<=");
  const [scenarioKey, setScenarioKey] = useState<string>("sum-classic");

  // 本地参数状态
  const [params, setParams] = useState<ScenarioParams>(() => ({
    a: defaultParams.a,
    b: defaultParams.b,
    c: defaultParams.c,
    m: defaultParams.m,
    x: defaultParams.x,
  }));

  // 当前模式的情景列表
  const currentScenarios = useMemo(() => {
    return SCENARIOS_BY_MODE[studyMode];
  }, [studyMode]);

  // 场景驱动 Hook (SSOT)
  const { tipProps, selectScenario } = useScenario<string, ScenarioParams>({
    scenarios: currentScenarios,
    activeKey: scenarioKey,
    params,
    onParamsChange: setParams,
  });

  // 模式切换
  const handleStudyModeChange = (modeKey: string) => {
    const nextMode = modeKey as InequalityMode;
    setStudyMode(nextMode);
    const firstScenario = SCENARIOS_BY_MODE[nextMode][0];
    if (firstScenario) {
      setScenarioKey(firstScenario.id);
      if (firstScenario.presetParams) {
        setParams((prev) => ({
          ...prev,
          ...firstScenario.presetParams,
        }));
      }
    }
  };

  // 情景切换
  const handleScenarioChange = (id: string) => {
    setScenarioKey(id);
    selectScenario(id);
  };

  // 画布视口测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 坐标系比例尺：数学坐标范围 X [-6, 6], Y [-2, 8]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-2, 8],
  });

  // 组装看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-ineq-absolute", params, {
      studyMode,
      ineqType,
    });
  }, [params, studyMode, ineqType]);

  const handleParamChange = useCallback(
    (key: string, value: number) => {
      setParams((prev) => ({
        ...prev,
        [key]: value,
      }));
      // 手动调参切回 free 探索
      const freeId = `${studyMode}-free`;
      setScenarioKey(freeId);
    },
    [studyMode],
  );

  const handleReset = () => {
    const activeSpec = currentScenarios.find((s) => s.id === scenarioKey);
    if (activeSpec?.presetParams) {
      setParams((prev) => ({
        ...prev,
        ...activeSpec.presetParams,
      }));
    } else {
      setParams({
        a: defaultParams.a,
        b: defaultParams.b,
        c: defaultParams.c,
        m: defaultParams.m,
        x: defaultParams.x,
      });
    }
  };

  // 动态过滤参数并透传 group 分组
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<InequalityMode, string[]> = {
      single: ["a", "c", "x"],
      sum: ["a", "b", "m", "x"],
      diff: ["a", "b", "m", "x"],
      triangle: ["a", "b"],
    };

    const keys = keysByMode[studyMode] ?? Object.keys(paramMeta);

    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key as keyof ScenarioParams] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
          group: meta.group,
        };
      });
  }, [params, studyMode]);

  // 构建悬浮 LaTeX 动态公式卡片 (带参数色彩绑定)
  const equationLatex = useMemo(() => {
    const colorA = `\\color{#EF4444}{a}`;
    const colorB = `\\color{#D97706}{b}`;
    const colorC = `\\color{#059669}{c}`;
    const colorM = `\\color{#059669}{m}`;
    const op = ineqType === "<=" ? "\\le" : "\\ge";

    if (studyMode === "single") {
      return `|x - ${colorA}| ${op} ${colorC}`;
    } else if (studyMode === "sum") {
      return `|x - ${colorA}| + |x - ${colorB}| ${op} ${colorM}`;
    } else if (studyMode === "diff") {
      return `|x - ${colorA}| - |x - ${colorB}| ${op} ${colorM}`;
    } else {
      return `||${colorA}| - |${colorB}|| \\le |${colorA} \\pm ${colorB}| \\le |${colorA}| + |${colorB}|`;
    }
  }, [studyMode, ineqType]);

  const panelTitle = useMemo(() => {
    const titles: Record<InequalityMode, string> = {
      single: "单绝对值几何模型看板",
      sum: "双绝对值和 (平底杯) 看板",
      diff: "双绝对值差 (阶梯) 看板",
      triangle: "绝对值三角不等式看板",
    };
    return titles[studyMode];
  }, [studyMode]);

  // 中屏图例项
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (studyMode === "triangle") {
      return [
        { label: "向量 a (OA)", color: MATH_COLORS.paramPrimary },
        { label: "向量 b (AB)", color: MATH_COLORS.paramSecondary },
        { label: "和向量 a+b (OB)", color: MATH_COLORS.paramTertiary },
      ];
    }
    return [
      { label: "折线函数 y = f(x)", color: MATH_COLORS.function },
      {
        label: studyMode === "single" ? "常数线 y = c" : "常数线 y = m",
        color: MATH_COLORS.paramTertiary,
        isDashed: true,
      },
      { label: "解集投影区间", color: MATH_COLORS.inequality },
      { label: "基准定点 A", color: MATH_COLORS.paramPrimary },
      ...(studyMode !== "single"
        ? [{ label: "基准定点 B", color: MATH_COLORS.paramSecondary }]
        : []),
      { label: "动点 P(x)", color: MATH_COLORS.focusPoint },
    ];
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 模式选择 Section */}
          <LeftPanelSection title="研究模式">
            <TabSwitcher
              layout="horizontal"
              tabs={[
                { key: "single", label: "单绝对值" },
                { key: "sum", label: "距离之和" },
                { key: "diff", label: "距离之差" },
                { key: "triangle", label: "三角不等式" },
              ]}
              value={studyMode}
              onChange={handleStudyModeChange}
            />
          </LeftPanelSection>

          {/* 2. 典型情景 Section */}
          <LeftPanelSection title="典型情景与考题">
            <SelectGrid
              items={currentScenarios.map((s) => ({
                key: s.id,
                label: s.name,
              }))}
              value={scenarioKey}
              onChange={handleScenarioChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 不等号方向 Section (仅非 triangle 模式展示，纯中文选项) */}
          {studyMode !== "triangle" && (
            <LeftPanelSection title="不等号方向">
              <SelectGrid
                items={[
                  { key: "<=", label: "小于等于 (求内部区间)" },
                  { key: ">=", label: "大于等于 (求外部区间)" },
                ]}
                value={ineqType}
                onChange={(k) => setIneqType(k as InequalityType)}
                variant="filled"
                color="success"
              />
            </LeftPanelSection>
          )}

          {/* 4. 参数调节 Section (透传 group) */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 5. 教学导引与核心设问 (SSOT useScenario 驱动闭环) */}
          {tipProps && (
            <LeftPanelSection title="教学导引" compact>
              <TipCard
                variant={tipProps.variant}
                badge={tipProps.badge}
                condition={tipProps.condition}
                question={tipProps.question}
              />
            </LeftPanelSection>
          )}
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 公式 KaTeX 悬浮展示 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <InequalityAbsoluteScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              ineqType={ineqType}
            />
          </AnimationSvgCanvas>

          {/* 右下角悬浮图例 */}
          <SceneLegend items={legendItems} title="几何图元指示" />
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
