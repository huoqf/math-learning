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
import { TrigLinesScene } from "./components/TrigLinesScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/trigLines";

export function TrigLinesAnimation() {
  // 研究模式：'lines' | 'comparison' | 'quadrant'
  const [studyMode, setStudyMode] = useState<"lines" | "comparison" | "quadrant">("lines");

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口与尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.square,
  });

  // 数学坐标系比例尺：正方形比例尺 [-1.6, 1.6]
  const scale = useSceneScale({
    vp,
    xRange: [-1.6, 1.6],
    yRange: [-1.6, 1.6],
  });

  // 数学量看板组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-trig-lines", params, { studyMode });
  }, [params, studyMode]);

  // 参数变更
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({ ...defaultParams });
  };

  // 左屏声明式参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return Object.entries(paramMeta).map(([key, meta]) => ({
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
    }));
  }, [params]);

  // 动态拼装三位一体公式 (带有 Hex 色彩)
  const equationLatex = useMemo(() => {
    const alpha = params.alphaDeg ?? 45;
    const rad = (alpha * Math.PI) / 180;
    const sinV = Math.sin(rad).toFixed(3);
    const cosV = Math.cos(rad).toFixed(3);
    const isTanDef = Math.abs(Math.cos(rad)) > 1e-7;
    const tanV = isTanDef ? Math.tan(rad).toFixed(3) : "\\text{无意义}";

    // 色彩映射：
    // MP (正弦): #EF4444
    // OM (余弦): #D97706
    // AT (正切): #059669
    return `\\sin\\alpha = \\color{#EF4444}{${sinV}}, \\quad \\cos\\alpha = \\color{#D97706}{${cosV}}, \\quad \\tan\\alpha = \\color{#059669}{${tanV}}`;
  }, [params.alphaDeg]);

  // 标题
  const panelTitle = useMemo(() => {
    if (studyMode === "lines") return "三角函数线定义看板";
    if (studyMode === "comparison") return "大小比较与不等式看板";
    return "象限符号与全正法则看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 Section */}
          <LeftPanelSection title="研究模式" subtitle="选择三角函数线研讨视角">
            <SelectGrid
              items={[
                { key: "lines", label: "三角函数线定义" },
                { key: "comparison", label: "几何大小比较" },
                { key: "quadrant", label: "象限符号法则" },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as any)}
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          {/* 特殊角快捷切换 Section */}
          <LeftPanelSection title="快捷特殊角" subtitle="一键设定高考常考特殊角度">
            <SelectGrid
              items={[
                { key: "0", label: "0°" },
                { key: "30", label: "30°" },
                { key: "45", label: "45°" },
                { key: "60", label: "60°" },
                { key: "90", label: "90°" },
                { key: "120", label: "120°" },
                { key: "135", label: "135°" },
                { key: "150", label: "150°" },
                { key: "180", label: "180°" },
                { key: "270", label: "270°" },
                { key: "315", label: "315°" },
                { key: "360", label: "360°" },
              ]}
              value={String(params.alphaDeg)}
              onChange={(k) => handleParamChange("alphaDeg", Number(k))}
              variant="filled"
              columns={3}
            />
          </LeftPanelSection>

          {/* 动态显示开关 */}
          <LeftPanelSection title="函数线显隐" subtitle="勾选控制展示的三大有向线段">
            <SelectGrid
              items={[
                { key: "sin", label: "正弦线 MP", formula: "\\overrightarrow{MP}" },
                { key: "cos", label: "余弦线 OM", formula: "\\overrightarrow{OM}" },
                { key: "tan", label: "正切线 AT", formula: "\\overrightarrow{AT}", fullWidth: true },
              ]}
              value={
                params.showSine && params.showCosine && params.showTangent
                  ? "all"
                  : params.showSine
                  ? "sin"
                  : params.showCosine
                  ? "cos"
                  : "tan"
              }
              onChange={(k) => {
                if (k === "sin") {
                  handleParamChange("showSine", 1);
                  handleParamChange("showCosine", 0);
                  handleParamChange("showTangent", 0);
                } else if (k === "cos") {
                  handleParamChange("showSine", 0);
                  handleParamChange("showCosine", 1);
                  handleParamChange("showTangent", 0);
                } else if (k === "tan") {
                  handleParamChange("showSine", 0);
                  handleParamChange("showCosine", 0);
                  handleParamChange("showTangent", 1);
                } else {
                  handleParamChange("showSine", 1);
                  handleParamChange("showCosine", 1);
                  handleParamChange("showTangent", 1);
                }
              }}
              variant="filled"
              color="primary"
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection title="连续动角调节" subtitle="拖动滑块连续改变动角 α">
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
          {/* 三位一体 LaTeX 公式悬浮窗口 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TrigLinesScene
              params={params as any}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
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
