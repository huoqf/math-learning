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
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { ConicLineScene } from "./components/ConicLineScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  presetsByMode,
} from "@/data/registries/conicLine";
import type { ConicType, StudyMode } from "@/math/conicLine";

export function ConicLineAnimation() {
  // 圆锥曲线类型：'ellipse' | 'hyperbola' | 'parabola'
  const [conicType, setConicType] = useState<ConicType>("ellipse");
  // 研究模式：'general' (位置关系与弦长) | 'focus' (过焦点弦) | 'midpoint' (中点弦点差法) | 'polePolar' (极点极线切点弦)
  const [studyMode, setStudyMode] = useState<StudyMode>("general");
  // 当前选中的典型预设 key
  const [activePreset, setActivePreset] = useState<string>("free");

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

  // 参数变更处理器（拖拽或手动微调时自动退回 free 自由探究）
  const handleParamChange = (key: string, value: number) => {
    setActivePreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 典型预设切换处理器
  const handlePresetChange = (presetKey: string) => {
    setActivePreset(presetKey);
    const presets = presetsByMode[studyMode] ?? [];
    const target = presets.find((p) => p.key === presetKey);
    if (target && Object.keys(target.params).length > 0) {
      setParams((prev) => {
        const next = { ...prev };
        Object.entries(target.params).forEach(([k, v]) => {
          if (typeof v === "number") {
            next[k] = v;
          }
        });
        return next;
      });
    }
  };

  // 模式切换处理器
  const handleModeChange = (mode: StudyMode) => {
    setStudyMode(mode);
    setActivePreset("free");
  };

  // 重置参数
  const handleReset = () => {
    setActivePreset("free");
    setParams({
      ...defaultParams,
    });
  };

  // 当前模式下的预设列表
  const currentPresets = useMemo(() => {
    const list = presetsByMode[studyMode] ?? [];
    return list.map((item) => ({
      key: item.key,
      label: item.label,
      description: item.description,
    }));
  }, [studyMode]);

  // 根据当前圆锥曲线与模式动态过滤并结构化分组 ParamConfig
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    // 曲线固有的形状底模参数
    const conicKeys = conicType === "parabola" ? ["p"] : ["a", "b"];
    const conicGroupName =
      conicType === "ellipse"
        ? "椭圆半轴 (a, b)"
        : conicType === "hyperbola"
          ? "双曲线半轴 (a, b)"
          : "抛物线焦准距 (p)";

    let modeKeyGroups: Array<{ group: string; keys: string[] }> = [];

    if (studyMode === "general") {
      modeKeyGroups = [
        { group: "直线斜截式参数 (k, m)", keys: ["k", "m"] },
        { group: conicGroupName, keys: conicKeys },
      ];
    } else if (studyMode === "focus") {
      modeKeyGroups = [
        { group: "焦点弦倾斜角 θ", keys: ["theta"] },
        { group: conicGroupName, keys: conicKeys },
      ];
    } else if (studyMode === "midpoint") {
      modeKeyGroups = [
        { group: "弦中点 M(x₀, y₀) 坐标", keys: ["midpointX", "midpointY"] },
        { group: conicGroupName, keys: conicKeys },
      ];
    } else {
      modeKeyGroups = [
        { group: "曲线外极点 P(x_P, y_P) 坐标", keys: ["poleX", "poleY"] },
        { group: conicGroupName, keys: conicKeys },
      ];
    }

    const configs: ParamConfig[] = [];
    modeKeyGroups.forEach(({ group, keys }) => {
      keys.forEach((key) => {
        if (key in paramMeta) {
          const meta = paramMeta[key];
          configs.push({
            key,
            label: meta.label,
            labelFormula: meta.labelFormula,
            value: params[key] ?? meta.defaultValue ?? 0,
            min: meta.min,
            max: meta.max,
            step: meta.step ?? 0.1,
            group,
            description: meta.description,
            descriptionFormula: meta.descriptionFormula,
            importance: meta.importance,
            marks: meta.marks,
          });
        }
      });
    });

    return configs;
  }, [params, conicType, studyMode]);

  // 悬浮在画布上的动态方程 LaTeX
  const floatingEquation = useMemo(() => {
    const a = params.a ?? 3;
    const b = params.b ?? 2;
    const p = params.p ?? 2;

    let curveTex = "";
    if (conicType === "ellipse") {
      curveTex = `\\frac{x^2}{\\color{${MATH_COLORS.paramPrimary}}{${a.toFixed(1)}}^2} + \\frac{y^2}{\\color{${MATH_COLORS.paramSecondary}}{${b.toFixed(1)}}^2} = 1`;
    } else if (conicType === "hyperbola") {
      curveTex = `\\frac{x^2}{\\color{${MATH_COLORS.paramPrimary}}{${a.toFixed(1)}}^2} - \\frac{y^2}{\\color{${MATH_COLORS.paramSecondary}}{${b.toFixed(1)}}^2} = 1`;
    } else {
      curveTex = `y^2 = 2(\\color{${MATH_COLORS.paramPrimary}}{${p.toFixed(1)}})x`;
    }

    let lineTex = "";
    if (studyMode === "general") {
      const k = params.k ?? 0.5;
      const m = params.m ?? 0.5;
      lineTex = `L: y = \\color{${MATH_COLORS.paramSecondary}}{${k.toFixed(2)}} x ${m >= 0 ? "+" : ""} \\color{${MATH_COLORS.paramTertiary}}{${m.toFixed(2)}}`;
    } else if (studyMode === "focus") {
      const thetaDeg = Math.round(
        ((params.theta ?? Math.PI / 4) * 180) / Math.PI,
      );
      lineTex = `L_{焦点}: \\theta = \\color{${MATH_COLORS.paramTertiary}}{${thetaDeg}^\\circ}`;
    } else if (studyMode === "midpoint") {
      const mx = params.midpointX ?? 1;
      const my = params.midpointY ?? 1;
      lineTex = `M_{中点}: (\\color{${MATH_COLORS.paramPrimary}}{${mx.toFixed(1)}}, \\color{${MATH_COLORS.paramSecondary}}{${my.toFixed(1)}})`;
    } else {
      const px = params.poleX ?? 4;
      const py = params.poleY ?? 3;
      lineTex = `P_{极点}: (\\color{${MATH_COLORS.paramPrimary}}{${px.toFixed(1)}}, \\color{${MATH_COLORS.paramSecondary}}{${py.toFixed(1)}})`;
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
                {
                  key: "polePolar",
                  label: "极点极线与切点弦",
                  formula: "\\frac{x_P x}{a^2}+\\frac{y_P y}{b^2}=1",
                },
              ]}
              value={studyMode}
              onChange={(k) => handleModeChange(k as StudyMode)}
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          {/* 典型预设 Section */}
          <LeftPanelSection title="典型预设" subtitle="一键复现高考经典构型">
            <SelectGrid
              items={currentPresets}
              value={activePreset}
              onChange={handlePresetChange}
              variant="filled"
              columns={2}
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
