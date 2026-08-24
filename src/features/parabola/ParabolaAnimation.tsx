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
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { ParabolaScene } from "./components/ParabolaScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  PARABOLA_PRESETS,
} from "@/data/registries/parabola";
import type { ParabolaDirection } from "@/math/parabola";

export function ParabolaAnimation() {
  // 抛物线开口方向：'right' | 'left' | 'up' | 'down'
  const [direction, setDirection] = useState<ParabolaDirection>("right");

  // 研究模式：'definition' | 'focalChord' | 'tangentOptical'
  const [studyMode, setStudyMode] = useState<
    "definition" | "focalChord" | "tangentOptical"
  >("definition");

  // 当前激活的典型预设 key（默认 "free" 自由探究）
  const [activePreset, setActivePreset] = useState<string>("free");

  // 参数状态
  const [params, setParams] = useState(() => ({
    p: defaultParams.p,
    tP: defaultParams.tP,
    thetaDeg: defaultParams.thetaDeg,
    yQ: defaultParams.yQ,
  }));

  // 视口尺寸测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 数学视图坐标范围 [-7, 7] x [-5.5, 5.5]
  const scale = useSceneScale({
    vp,
    xRange: [-7, 7],
    yRange: [-5.5, 5.5],
  });

  // 数学量看板数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-conic-parabola", params, {
      direction,
      studyMode,
    });
  }, [params, direction, studyMode]);

  // 画布拖拽交互时自动回归自由探究
  const handleInteractionStart = useCallback(() => {
    setActivePreset("free");
  }, []);

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setActivePreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 切换模式处理器
  const handleModeChange = (modeKey: string) => {
    const nextMode = modeKey as typeof studyMode;
    setStudyMode(nextMode);
    setActivePreset("free");
  };

  // 典型预设切换
  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    const modePresets = PARABOLA_PRESETS[studyMode] ?? [];
    const targetPreset = modePresets.find((p) => p.key === presetKey);
    if (targetPreset && targetPreset.params) {
      setParams((prev) => ({
        ...prev,
        ...targetPreset.params,
      }));
    }
  };

  // 重置参数
  const handleReset = () => {
    setActivePreset("free");
    setParams({
      p: defaultParams.p,
      tP: defaultParams.tP,
      thetaDeg: defaultParams.thetaDeg,
      yQ: defaultParams.yQ,
    });
  };

  // 按 current studyMode 过滤参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      definition: ["p", "tP"],
      focalChord: ["p", "thetaDeg"],
      tangentOptical: ["p", "tP", "yQ"],
    };

    const activeKeys = keysByMode[studyMode] ?? Object.keys(paramMeta);

    return activeKeys
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

  // 当前模式下的预设列表项
  const currentPresets = useMemo(() => {
    return (PARABOLA_PRESETS[studyMode] ?? []).map((preset) => ({
      key: preset.key,
      label: preset.label,
      description: preset.description,
    }));
  }, [studyMode]);

  // 抛物线标准方程 LaTeX 字符串（使用动态 Token 色彩）
  const equationLatex = useMemo(() => {
    const pStr = params.p > 0 ? (2 * params.p).toFixed(1) : "2p";
    switch (direction) {
      case "right":
        return `y^2 = \\color{${MATH_COLORS.paramPrimary}}{${pStr}} x`;
      case "left":
        return `y^2 = -\\color{${MATH_COLORS.paramPrimary}}{${pStr}} x`;
      case "up":
        return `x^2 = \\color{${MATH_COLORS.paramPrimary}}{${pStr}} y`;
      case "down":
        return `x^2 = -\\color{${MATH_COLORS.paramPrimary}}{${pStr}} y`;
    }
  }, [params.p, direction]);

  // 左屏教学提示与题设导引（说明初始条件、设问目标与高考通法）
  const tipConfig = useMemo(() => {
    if (activePreset !== "free") {
      const modePresets = PARABOLA_PRESETS[studyMode] ?? [];
      const targetPreset = modePresets.find((p) => p.key === activePreset);
      if (targetPreset) {
        if (activePreset === "latusRectum") {
          return {
            variant: "primary" as const,
            badge: "高考经典 · 通径性质",
            condition: "过焦点 F 作垂直于对称轴的弦，交抛物线于 A, B 两点。",
            question: "求解通径长 |AB| 及其端点坐标。",
            method:
              "通径长 |AB| = 2p，端点坐标为 (p/2, ±p)，为所有焦点弦长极小值。",
          };
        }
        if (activePreset === "orthogonalTangents") {
          return {
            variant: "danger" as const,
            badge: "高考经典 · 垂直切线与阿基米德三角形",
            condition: "割线 AB 为焦点弦，分别过 A, B 作切线交于点 P。",
            question: "探究交点 P 的位置与切线夹角 ∠APB。",
            method:
              "交点 P 必在准线 x = -p/2 上，且 PA ⊥ PB（夹角 90°），PF ⊥ AB。",
          };
        }
      }
    }

    if (studyMode === "definition") {
      return {
        variant: "info" as const,
        badge: "第一定义与焦半径最值",
        condition: `抛物线标准方程及动点 P，焦点 F 与准线 l（焦准距 p = ${params.p.toFixed(1)}）。`,
        question:
          "探究动点 P 到焦点的距离 |PF| 与到准线垂线段距离的等价转化关系。",
        method:
          "几何转化法：|PF| = d(P, l) = x_P + p/2，将折线距离和最值问题转化为到准线的单条垂直线段。",
      };
    }
    if (studyMode === "focalChord") {
      return {
        variant: "primary" as const,
        badge: "高考焦点弦与相切圆",
        condition: "过焦点 F 的直线交抛物线于 A(x₁,y₁), B(x₂,y₂)，倾斜角为 θ。",
        question: "求焦点弦长 |AB|，探究以 AB 为直径的圆与准线的位置关系。",
        method:
          "弦长公式 |AB| = x₁ + x₂ + p = 2p / sin²θ；以 AB 为直径的圆必与准线相切；以焦半径为直径的圆与切于顶点的直线相切。",
      };
    }
    return {
      variant: "danger" as const,
      badge: "阿基米德三角形与光学性质",
      condition: "过抛物线上两点 A, B 作切线交于点 P（阿基米德三角形）。",
      question: "探究焦点弦切线交点 P 的轨迹、正交性及切线光学反射规律。",
      method:
        "高考秒杀三大定律：① 当 AB 过焦点时，P 在准线上且 PA ⊥ PB；② PF ⊥ AB；③ 焦点发出的光线经抛物面反射后平行于对称轴。",
    };
  }, [studyMode, activePreset, params.p]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 开口方向选择 Section */}
          <LeftPanelSection
            title="抛物线开向"
            subtitle="选择四种标准抛物线姿态"
          >
            <TabSwitcher
              tabs={[
                { key: "right", label: "向右 y²=2px" },
                { key: "left", label: "向左 y²=-2px" },
                { key: "up", label: "向上 x²=2py" },
                { key: "down", label: "向下 x²=-2py" },
              ]}
              value={direction}
              onChange={(key) => setDirection(key as ParabolaDirection)}
            />
          </LeftPanelSection>

          {/* 2. 研究主题 Section */}
          <LeftPanelSection
            title="高考焦点与准线几何"
            subtitle="选择深入研究范畴"
          >
            <SelectGrid
              items={[
                { key: "definition", label: "第一定义与焦半径" },
                { key: "focalChord", label: "焦点弦与相切圆" },
                { key: "tangentOptical", label: "切线光学与准线几何" },
              ]}
              value={studyMode}
              onChange={handleModeChange}
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          {/* 3. 典型预设 Section (2x2 对称网格) */}
          <LeftPanelSection
            title="典型预设"
            subtitle="一键切换高考经典几何构型"
          >
            <SelectGrid
              items={currentPresets}
              value={activePreset}
              onChange={handlePresetSelect}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 4. 参数调节 Section */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块探索动态几何规律"
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
                <div>
                  <span className="font-semibold text-neutral-800">
                    【秒杀通法】
                  </span>
                  <span className="text-neutral-600">{tipConfig.method}</span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 方程公式悬浮框 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ParabolaScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              onInteractionStart={handleInteractionStart}
              fontScale={canvasSize.font}
              direction={direction}
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
          title="抛物线几何指标看板"
        />
      }
    />
  );
}
