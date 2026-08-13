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
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { ConicLineScene } from "./components/ConicLineScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/conicLine";
import type { ConicType, StudyMode } from "@/math/conicLine";

export function ConicLineAnimation() {
  // 圆锥曲线类型：'ellipse' | 'hyperbola' | 'parabola'
  const [conicType, setConicType] = useState<ConicType>("ellipse");
  // 研究模式：'general' (位置关系与弦长) | 'focus' (过焦点弦) | 'midpoint' (中点弦点差法)
  const [studyMode, setStudyMode] = useState<StudyMode>("general");

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 坐标系比例尺 X [-6, 6], Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 数学量看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-conic-line", params, {
      conicType,
      studyMode,
    });
  }, [params, conicType, studyMode]);

  // 参数变更处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({
      ...defaultParams,
    });
  };

  // 根据当前圆锥曲线与模式动态过滤 ParamConfig
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    // 曲线固有的形状参数
    let conicKeys: string[] = ["a", "b"];
    if (conicType === "parabola") {
      conicKeys = ["p"];
    }

    // 直线/研究模式相关的参数
    let modeKeys: string[] = ["k", "m"];
    if (studyMode === "focus") {
      modeKeys = ["theta"];
    } else if (studyMode === "midpoint") {
      modeKeys = ["midpointX", "midpointY"];
    }

    const activeKeys = [...conicKeys, ...modeKeys];

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
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, conicType, studyMode]);

  // 悬浮在画布上的动态方程 LaTeX
  const floatingEquation = useMemo(() => {
    const a = params.a ?? 3;
    const b = params.b ?? 2;
    const p = params.p ?? 2;

    let curveTex = "";
    if (conicType === "ellipse") {
      curveTex = `\\frac{x^2}{\\color{#EF4444}{${a.toFixed(1)}}^2} + \\frac{y^2}{\\color{#D97706}{${b.toFixed(1)}}^2} = 1`;
    } else if (conicType === "hyperbola") {
      curveTex = `\\frac{x^2}{\\color{#EF4444}{${a.toFixed(1)}}^2} - \\frac{y^2}{\\color{#D97706}{${b.toFixed(1)}}^2} = 1`;
    } else {
      curveTex = `y^2 = 2(\\color{#EF4444}{${p.toFixed(1)}})x`;
    }

    let lineTex = "";
    if (studyMode === "general") {
      const k = params.k ?? 0.5;
      const m = params.m ?? 0.5;
      lineTex = `L: y = \\color{#D97706}{${k.toFixed(2)}} x ${m >= 0 ? "+" : ""} \\color{#059669}{${m.toFixed(2)}}`;
    } else if (studyMode === "focus") {
      const thetaDeg = Math.round(
        ((params.theta ?? Math.PI / 4) * 180) / Math.PI,
      );
      lineTex = `L_{焦点}: \\theta = \\color{#059669}{${thetaDeg}^\\circ}`;
    } else {
      const mx = params.midpointX ?? 1;
      const my = params.midpointY ?? 1;
      lineTex = `M_{中点}: (${mx.toFixed(1)}, ${my.toFixed(1)})`;
    }

    return `${curveTex} \\quad \\text{与} \\quad ${lineTex}`;
  }, [conicType, studyMode, params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 圆锥曲线选择 Section */}
          <LeftPanelSection title="曲线类型" subtitle="选择研究的圆锥曲线">
            <TabSwitcher
              tabs={[
                { key: "ellipse", label: "椭圆" },
                { key: "hyperbola", label: "双曲线" },
                { key: "parabola", label: "抛物线" },
              ]}
              value={conicType}
              onChange={(key) => setConicType(key as ConicType)}
            />
          </LeftPanelSection>

          {/* 研究视角 Section */}
          <LeftPanelSection title="研究视角" subtitle="选择高考核心专题模式">
            <SelectGrid
              items={[
                {
                  key: "general",
                  label: "位置关系与弦长",
                  formula: "\\text{位置关系与 } |AB|",
                },
                {
                  key: "focus",
                  label: "过焦点弦模型",
                  formula: "\\text{过焦点弦与通径}",
                },
                {
                  key: "midpoint",
                  label: "中点弦与点差法",
                  formula: "k_{AB} \\cdot k_{OM} \\text{ 点差法}",
                },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as StudyMode)}
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
          <LeftPanelSection
            title="动态参数调节"
            subtitle="拖动滑块改变几何形状与直线"
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
          {/* 画布左上角 KaTeX 悬浮展示 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={floatingEquation} mode="inline" />
          </div>

          {/* SVG 画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ConicLineScene
              params={params}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              conicType={conicType}
              studyMode={studyMode}
              onParamChange={handleParamChange}
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
          title="直线与圆锥曲线指标看板"
        />
      }
    />
  );
}
