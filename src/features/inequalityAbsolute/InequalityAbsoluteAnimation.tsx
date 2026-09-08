/**
 * src/features/inequalityAbsolute/InequalityAbsoluteAnimation.tsx
 * 绝对值不等式几何意义三屏交互编排层
 */

import { useState, useMemo } from "react";
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
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { InequalityAbsoluteScene } from "./components/InequalityAbsoluteScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/inequalityAbsolute";
import type { InequalityMode, InequalityType } from "@/math/inequalityAbsolute";

export function InequalityAbsoluteAnimation() {
  const [studyMode, setStudyMode] = useState<InequalityMode>("sum");
  const [ineqType, setIneqType] = useState<InequalityType>("<=");

  // 本地参数状态
  const [params, setParams] = useState(() => ({
    a: defaultParams.a,
    b: defaultParams.b,
    c: defaultParams.c,
    m: defaultParams.m,
    x: defaultParams.x,
  }));

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

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setParams({
      a: defaultParams.a,
      b: defaultParams.b,
      c: defaultParams.c,
      m: defaultParams.m,
      x: defaultParams.x,
    });
  };

  // 按 current activeMode 动态过滤参数 (铁律 8)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<InequalityMode, string[]> = {
      single: ["a", "c", "x"],
      sum: ["a", "b", "m", "x"],
      diff: ["a", "b", "m", "x"],
      triangle: ["a", "b", "x"],
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
          value: params[key as keyof typeof params] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
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

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
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
              onChange={(k) => setStudyMode(k as InequalityMode)}
            />
          </LeftPanelSection>

          {/* 不等号方向 Section (仅非 triangle 模式展示) */}
          {studyMode !== "triangle" && (
            <LeftPanelSection title="不等号方向">
              <SelectGrid
                items={[
                  { key: "<=", formula: "f(x) \\le m" },
                  { key: ">=", formula: "f(x) \\ge m" },
                ]}
                value={ineqType}
                onChange={(k) => setIneqType(k as InequalityType)}
                variant="filled"
                color="success"
              />
            </LeftPanelSection>
          )}

          {/* 参数调节 Section */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学导引 */}
          <LeftPanelSection title="教学导引" compact>
            <TipCard
              variant="warning"
              badge="高考重点 · 绝对值几何距离与三角不等式"
              condition={
                studyMode === "single"
                  ? "数轴上动点 x 到定点 a 的几何距离 |x - a|。"
                  : studyMode === "sum"
                    ? "动点 x 到两定点 a, b 的距离之和 |x - a| + |x - b|。"
                    : studyMode === "diff"
                      ? "动点 x 到两定点 a, b 的距离之差 |x - a| - |x - b|。"
                      : "实数 a, b 的绝对值三角不等式 ||a| - |b|| ≤ |a ± b| ≤ |a| + |b|。"
              }
              question={
                studyMode === "sum"
                  ? "探究为何两点距离之和在闭区间 [a, b] 恒取最小值 |a - b|（平底杯杯底）。"
                  : studyMode === "diff"
                    ? "探究两点距离之差为何恒在 [-|a - b|, |a - b|] 形成阶梯上下界。"
                    : "观察阈值截线与折线交点，探究不等式解集的几何区间分布。"
              }
            />
          </LeftPanelSection>
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
