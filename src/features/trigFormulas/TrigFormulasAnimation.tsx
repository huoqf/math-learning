import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { TrigFormulasScene } from "./components/TrigFormulasScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/trigFormulas";
import {
  calculateSumDiff,
  calculateDoubleAngle,
  calculateAuxiliary,
  type StudyMode,
  type SumDiffFormulaKey,
  type DoubleAngleFormulaKey,
} from "./math/trigFormulas";

export function TrigFormulasAnimation() {
  // 高考预设选择状态
  const [activePreset, setActivePreset] = useState<string>("");

  // 研究模式：'sum_diff' | 'double_angle' | 'auxiliary'
  const [studyMode, setStudyMode] = useState<StudyMode>("sum_diff");

  // 子公式选项
  const [sumDiffKey, setSumDiffKey] = useState<SumDiffFormulaKey>("cos_minus");
  const [doubleAngleKey, setDoubleAngleKey] =
    useState<DoubleAngleFormulaKey>("sin_2a");

  // 本地参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    alphaDeg: defaultParams.alphaDeg,
    betaDeg: defaultParams.betaDeg,
    coeffA: defaultParams.coeffA,
    coeffB: defaultParams.coeffB,
  }));

  // 视口尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 根据研究模式确定 Scene 场景数学范围
  const scaleRanges = useMemo<{
    xRange: [number, number];
    yRange: [number, number];
  }>(() => {
    if (studyMode === "auxiliary") {
      return { xRange: [-6.0, 6.0], yRange: [-5.5, 5.5] };
    }
    return { xRange: [-2.0, 2.0], yRange: [-1.5, 1.5] };
  }, [studyMode]);

  const scale = useSceneScale({
    vp,
    xRange: scaleRanges.xRange,
    yRange: scaleRanges.yRange,
  });

  // 数学量看板数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-trig-formulas", params, {
      studyMode,
      sumDiffKey,
      doubleAngleKey,
    });
  }, [params, studyMode, sumDiffKey, doubleAngleKey]);

  // 参数更新
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({
      alphaDeg: defaultParams.alphaDeg,
      betaDeg: defaultParams.betaDeg,
      coeffA: defaultParams.coeffA,
      coeffB: defaultParams.coeffB,
    });
  };

  // 按研究模式过滤参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<StudyMode, string[]> = {
      sum_diff: ["alphaDeg", "betaDeg"],
      double_angle: ["alphaDeg"],
      auxiliary: ["coeffA", "coeffB"],
    };
    const activeKeys = keysByMode[studyMode] ?? ["alphaDeg"];

    return activeKeys
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
          step: meta.step ?? 1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode]);

  // 顶端悬浮 KaTeX 公式渲染
  const headerFormulaLatex = useMemo(() => {
    if (studyMode === "sum_diff") {
      const res = calculateSumDiff(
        params.alphaDeg ?? 45,
        params.betaDeg ?? 30,
        sumDiffKey,
      );
      const valStr = res.isTanDefined
        ? res.resultVal.toFixed(3)
        : "\\text{无意义}";
      return `${res.formulaLatex} = ${valStr}`;
    } else if (studyMode === "double_angle") {
      const res = calculateDoubleAngle(params.alphaDeg ?? 45, doubleAngleKey);
      let valStr = "";
      if (doubleAngleKey === "sin_2a") valStr = res.sin2Alpha.toFixed(3);
      else if (doubleAngleKey === "cos_2a") valStr = res.cos2Alpha.toFixed(3);
      else if (doubleAngleKey === "tan_2a")
        valStr =
          res.isTanDefined && res.tan2Alpha !== undefined
            ? res.tan2Alpha.toFixed(3)
            : "\\text{无意义}";
      else if (doubleAngleKey === "sin2_a") valStr = res.sinSqAlpha.toFixed(3);
      else if (doubleAngleKey === "cos2_a") valStr = res.cosSqAlpha.toFixed(3);
      return `${res.formulaLatex} = ${valStr}`;
    } else {
      const res = calculateAuxiliary(
        params.coeffA ?? 1.0,
        params.coeffB ?? 1.73,
      );
      return res.formulaLatex;
    }
  }, [
    studyMode,
    sumDiffKey,
    doubleAngleKey,
    params.alphaDeg,
    params.betaDeg,
    params.coeffA,
    params.coeffB,
  ]);

  // 看板标题
  const panelTitle = useMemo(() => {
    switch (studyMode) {
      case "sum_diff":
        return "两角和差公式看板";
      case "double_angle":
        return "倍角与升降幂公式看板";
      case "auxiliary":
        return "辅助角化简看板";
    }
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 研究模式选择 */}
          <LeftPanelSection title="研究模式" subtitle="选择三角恒等变换专题">
            <SelectGrid
              items={[
                { key: "sum_diff", label: "两角和差公式" },
                { key: "double_angle", label: "倍角与升降幂" },
                { key: "auxiliary", label: "辅助角化简" },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as StudyMode)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 2. 子公式选择 */}
          {studyMode === "sum_diff" && (
            <LeftPanelSection title="和差公式分类" subtitle="选择高考和差公式">
              <SelectGrid
                items={[
                  { key: "cos_minus", label: "cos(α-β)" },
                  { key: "cos_plus", label: "cos(α+β)" },
                  { key: "sin_plus", label: "sin(α+β)" },
                  { key: "sin_minus", label: "sin(α-β)" },
                  { key: "tan_plus", label: "tan(α+β)" },
                  { key: "tan_minus", label: "tan(α-β)" },
                ]}
                value={sumDiffKey}
                onChange={(k) => setSumDiffKey(k as SumDiffFormulaKey)}
                variant="filled"
                color="primary"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {studyMode === "double_angle" && (
            <LeftPanelSection
              title="倍角与降幂公式"
              subtitle="选择二倍角或降幂变形"
            >
              <SelectGrid
                items={[
                  { key: "sin_2a", label: "sin 2α" },
                  { key: "cos_2a", label: "cos 2α" },
                  { key: "tan_2a", label: "tan 2α" },
                  { key: "sin2_a", label: "sin²α" },
                  { key: "cos2_a", label: "cos²α" },
                ]}
                value={doubleAngleKey}
                onChange={(k) => setDoubleAngleKey(k as DoubleAngleFormulaKey)}
                variant="filled"
                color="primary"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 3. 高考经典预设 */}
          <LeftPanelSection
            title="高考经典预设"
            subtitle="一键载入新高考高频参数组合"
          >
            {studyMode === "sum_diff" && (
              <SelectGrid
                items={[
                  { key: "preset_45_30", formula: "45^\\circ, 30^\\circ" },
                  { key: "preset_75_45", formula: "75^\\circ, 45^\\circ" },
                  { key: "preset_90_30", formula: "90^\\circ, 30^\\circ" },
                ]}
                value={activePreset}
                onChange={(k: string) => {
                  setActivePreset(k);
                  if (k === "preset_45_30")
                    setParams((p) => ({ ...p, alphaDeg: 45, betaDeg: 30 }));
                  if (k === "preset_75_45")
                    setParams((p) => ({ ...p, alphaDeg: 75, betaDeg: 45 }));
                  if (k === "preset_90_30")
                    setParams((p) => ({ ...p, alphaDeg: 90, betaDeg: 30 }));
                }}
                variant="outline"
                color="primary"
                columns={3}
              />
            )}
            {studyMode === "double_angle" && (
              <SelectGrid
                items={[
                  { key: "preset_15", formula: "15^\\circ" },
                  { key: "preset_30", formula: "30^\\circ" },
                  { key: "preset_45", formula: "45^\\circ" },
                ]}
                value={activePreset}
                onChange={(k: string) => {
                  setActivePreset(k);
                  if (k === "preset_15")
                    setParams((p) => ({ ...p, alphaDeg: 15 }));
                  if (k === "preset_30")
                    setParams((p) => ({ ...p, alphaDeg: 30 }));
                  if (k === "preset_45")
                    setParams((p) => ({ ...p, alphaDeg: 45 }));
                }}
                variant="outline"
                color="primary"
                columns={3}
              />
            )}
            {studyMode === "auxiliary" && (
              <SelectGrid
                items={[
                  { key: "p1", formula: "(1, \\sqrt{3})" },
                  { key: "p2", formula: "(\\sqrt{3}, 1)" },
                  { key: "p3", formula: "(-1, \\sqrt{3})" },
                  { key: "p4", formula: "(1, 1)" },
                ]}
                value={activePreset}
                onChange={(k: string) => {
                  setActivePreset(k);
                  if (k === "p1")
                    setParams((p) => ({ ...p, coeffA: 1.0, coeffB: 1.73 }));
                  if (k === "p2")
                    setParams((p) => ({ ...p, coeffA: 1.73, coeffB: 1.0 }));
                  if (k === "p3")
                    setParams((p) => ({ ...p, coeffA: -1.0, coeffB: 1.73 }));
                  if (k === "p4")
                    setParams((p) => ({ ...p, coeffA: 1.0, coeffB: 1.0 }));
                }}
                variant="outline"
                color="primary"
                columns={2}
              />
            )}
          </LeftPanelSection>

          {/* 4. 参数调节 */}
          <LeftPanelSection
            title="参数调节"
            subtitle={
              studyMode === "auxiliary"
                ? "拖动滑块改变系数 a, b 或在中屏直接拖拽 P 点"
                : "拖动滑块改变角 α, β 或在中屏拖拽 A, B 点"
            }
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 顶端 KaTeX 公式悬浮框 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={headerFormulaLatex} mode="inline" />
          </div>

          {/* SVG 画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TrigFormulasScene
              params={
                params as {
                  alphaDeg: number;
                  betaDeg: number;
                  coeffA: number;
                  coeffB: number;
                }
              }
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              sumDiffKey={sumDiffKey}
              doubleAngleKey={doubleAngleKey}
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

export default TrigFormulasAnimation;
