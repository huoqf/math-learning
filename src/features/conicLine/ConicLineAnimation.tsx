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

  // 左屏教学提示与题设导引（说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    if (activePreset !== "free") {
      const targetPreset = (presetsByMode[studyMode] ?? []).find(
        (p) => p.key === activePreset,
      );
      if (targetPreset) {
        if (
          activePreset.includes("tangent") ||
          activePreset.includes("critical")
        ) {
          return {
            variant: "warning" as const,
            badge: `高考经典 · ${targetPreset.label}`,
            condition: `直线与${conicType === "ellipse" ? "椭圆" : conicType === "hyperbola" ? "双曲线" : "抛物线"}处于相切临界状态 (Δ = 0)。`,
            question: "探究相切时的切点坐标与切线斜率截距关系。",
          };
        }
        if (activePreset.includes("latus") || activePreset.includes("focus")) {
          return {
            variant: "primary" as const,
            badge: `高考经典 · ${targetPreset.label}`,
            condition: "割线过焦点且垂直于对称轴 (θ = 90°)，构成通径。",
            question: "求解最短焦点弦长（通径长），探究通径端点坐标。",
          };
        }
      }
    }

    if (studyMode === "general") {
      return {
        variant: "info" as const,
        badge: "位置关系判定与弦长公式",
        condition: `直线 l: y=kx+m 与${conicType === "ellipse" ? "椭圆" : conicType === "hyperbola" ? "双曲线" : "抛物线"}联立，判别式为 Δ。`,
        question:
          "判定直线与曲线交点个数（相交/相切/相离），求解相交弦长 |AB|。",
      };
    }
    if (studyMode === "focus") {
      return {
        variant: "primary" as const,
        badge: "高考焦点弦与通径极值",
        condition: "割线过焦点 F(c,0)，倾斜角为 θ，交曲线于 A, B 两点。",
        question:
          "探究焦点弦长 |AB| 的最值规律，以及两焦半径倒数和的定值性质。",
      };
    }
    if (studyMode === "midpoint") {
      return {
        variant: "warning" as const,
        badge: "中点弦与点差法秒杀",
        condition:
          "已知动弦 AB 的中点为 M(x₀, y₀)，两端点 A(x₁,y₁), B(x₂,y₂) 在曲线上。",
        question:
          "求割线 AB 所在的直线方程与斜率，并判定该中点是否在曲线内部（存在性）。",
      };
    }
    return {
      variant: "danger" as const,
      badge: "极点极线与切点弦对偶",
      condition: "从曲线外一点 P(x_P, y_P) 引曲线的两条切线，切点分别为 A, B。",
      question:
        "求切点弦 AB 所在的直线方程，探究当点 P 在定直线上运动时切点弦恒过定点的规律。",
    };
  }, [studyMode, activePreset, conicType]);

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

          {/* 教学提示与题设导引（置于参数调节下方） */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed">
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
                    【探究设问】
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
