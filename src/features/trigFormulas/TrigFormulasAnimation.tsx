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
  // 典型构型预设 (2x2 黄金规范：首项固定为 free 自由探究)
  const [activePreset, setActivePreset] = useState<string>("free");

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

  // 参数更新（拖拽或滑块改变时自动将预设切回 free）
  const handleParamChange = (key: string, value: number) => {
    setActivePreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setActivePreset("free");
    setParams({
      alphaDeg: defaultParams.alphaDeg,
      betaDeg: defaultParams.betaDeg,
      coeffA: defaultParams.coeffA,
      coeffB: defaultParams.coeffB,
    });
  };

  // 模式切换
  const handleModeChange = (mode: StudyMode) => {
    setStudyMode(mode);
    setActivePreset("free");
  };

  // 典型预设选择响应 (2x2 黄金规范)
  const handlePresetSelect = (key: string) => {
    setActivePreset(key);
    if (key === "free") return;

    if (studyMode === "sum_diff") {
      if (key === "preset_45_30") {
        setParams((p) => ({ ...p, alphaDeg: 45, betaDeg: 30 }));
      } else if (key === "preset_75_45") {
        setParams((p) => ({ ...p, alphaDeg: 75, betaDeg: 45 }));
      } else if (key === "preset_90_30") {
        setParams((p) => ({ ...p, alphaDeg: 90, betaDeg: 30 }));
      }
    } else if (studyMode === "double_angle") {
      if (key === "preset_15") {
        setParams((p) => ({ ...p, alphaDeg: 15 }));
      } else if (key === "preset_22_5") {
        setParams((p) => ({ ...p, alphaDeg: 22.5 }));
      } else if (key === "preset_45") {
        setParams((p) => ({ ...p, alphaDeg: 45 }));
      }
    } else {
      // auxiliary
      if (key === "p1") {
        setParams((p) => ({ ...p, coeffA: 1.0, coeffB: 1.73 }));
      } else if (key === "p3") {
        setParams((p) => ({ ...p, coeffA: -1.0, coeffB: 1.73 }));
      } else if (key === "p4") {
        setParams((p) => ({ ...p, coeffA: 1.0, coeffB: -1.0 }));
      }
    }
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
          group: meta.group,
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
                { key: "auxiliary", label: "辅助角化简", fullWidth: true },
              ]}
              value={studyMode}
              onChange={(k) => handleModeChange(k as StudyMode)}
              variant="filled"
            />
          </LeftPanelSection>

          {/* 2. 子公式选择 */}
          {studyMode === "sum_diff" && (
            <LeftPanelSection title="和差公式分类" subtitle="选择高考和差公式">
              <SelectGrid
                items={[
                  { key: "cos_minus", formula: "\\cos(\\alpha-\\beta)" },
                  { key: "cos_plus", formula: "\\cos(\\alpha+\\beta)" },
                  { key: "sin_plus", formula: "\\sin(\\alpha+\\beta)" },
                  { key: "sin_minus", formula: "\\sin(\\alpha-\\beta)" },
                  { key: "tan_plus", formula: "\\tan(\\alpha+\\beta)" },
                  { key: "tan_minus", formula: "\\tan(\\alpha-\\beta)" },
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
                  { key: "sin_2a", formula: "\\sin 2\\alpha" },
                  { key: "cos_2a", formula: "\\cos 2\\alpha" },
                  { key: "tan_2a", formula: "\\tan 2\\alpha" },
                  { key: "sin2_a", formula: "\\sin^2\\alpha" },
                  { key: "cos2_a", formula: "\\cos^2\\alpha", fullWidth: true },
                ]}
                value={doubleAngleKey}
                onChange={(k) => setDoubleAngleKey(k as DoubleAngleFormulaKey)}
                variant="filled"
                color="primary"
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 3. 高考经典预设 (2x2 黄金规范：首项为 free) */}
          <LeftPanelSection
            title="典型构型预设"
            subtitle="首项自由探究，其余一键载入新高考高频模型"
          >
            {studyMode === "sum_diff" && (
              <SelectGrid
                items={[
                  { key: "free", label: "自由探究", description: "全参数开放" },
                  {
                    key: "preset_45_30",
                    formula: "45^\\circ, 30^\\circ",
                    description: "求 15°/75°",
                  },
                  {
                    key: "preset_75_45",
                    formula: "75^\\circ, 45^\\circ",
                    description: "差角 30° 验证",
                  },
                  {
                    key: "preset_90_30",
                    formula: "90^\\circ, 30^\\circ",
                    description: "正交诱导检验",
                  },
                ]}
                value={activePreset}
                onChange={handlePresetSelect}
                variant="outline"
                color="primary"
                columns={2}
              />
            )}
            {studyMode === "double_angle" && (
              <SelectGrid
                items={[
                  { key: "free", label: "自由探究", description: "全参数开放" },
                  {
                    key: "preset_15",
                    formula: "15^\\circ",
                    description: "倍角得 30°",
                  },
                  {
                    key: "preset_22_5",
                    formula: "22.5^\\circ",
                    description: "半角求值",
                  },
                  {
                    key: "preset_45",
                    formula: "45^\\circ",
                    description: "倍角得 90°",
                  },
                ]}
                value={activePreset}
                onChange={handlePresetSelect}
                variant="outline"
                color="primary"
                columns={2}
              />
            )}
            {studyMode === "auxiliary" && (
              <SelectGrid
                items={[
                  { key: "free", label: "自由探究", description: "全参数开放" },
                  {
                    key: "p1",
                    formula: "(1, \\sqrt{3})",
                    description: "φ=60° (第Ⅰ象限)",
                  },
                  {
                    key: "p3",
                    formula: "(-1, \\sqrt{3})",
                    description: "φ=120° 易错陷阱",
                  },
                  {
                    key: "p4",
                    formula: "(1, -1)",
                    description: "φ=315° (第Ⅳ象限)",
                  },
                ]}
                value={activePreset}
                onChange={handlePresetSelect}
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
                ? "调节系数 a, b 或在中屏直接拖拽点 P"
                : "调节角 α, β 或在中屏直接拖拽点 A, B"
            }
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 5. 教学引导卡片 (置于底部辅助区，不阻断调参动线) */}
          <LeftPanelSection title="教学思考与探究" subtitle="启发式问题引导">
            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 text-xs text-neutral-600 space-y-2">
              <div>
                <span className="font-semibold text-neutral-800">
                  【基础条件】
                </span>
                {studyMode === "sum_diff" &&
                  "两动角终边交于单位圆上的动点 A、B，其几何向量点积对应两角差的余弦。"}
                {studyMode === "double_angle" &&
                  "倍角变换将单角 α 投射到 2α，降幂将二次项降为一次项且周期减半。"}
                {studyMode === "auxiliary" &&
                  "线性组合 a sin x + b cos x 等价于平面向量 (a, b) 模长与极角合成。"}
              </div>
              <div>
                <span className="font-semibold text-neutral-800">
                  【探究思考】
                </span>
                {studyMode === "sum_diff" &&
                  "拖动 A、B 观察向量夹角与弦长变化：为什么两角差的余弦公式是整个三角恒等变换的基石？"}
                {studyMode === "double_angle" &&
                  "观察曲线 y=sin²x 与 y=(1-cos 2x)/2 的重合轨迹，注意中轴线 y=0.5 和周期的变化。"}
                {studyMode === "auxiliary" &&
                  "尝试将 P 拖到第二、三象限，思考为什么初相 φ 的象限必须由点 (a, b) 唯一确定？"}
              </div>
            </div>
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
