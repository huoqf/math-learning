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

  // 按 current studyMode 与预设过滤参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let activeKeys: string[] = [];

    if (activePreset === "latusRectum") {
      // 通径预设：倾斜角锁定为 90 度，仅调节焦准距 p
      activeKeys = ["p"];
    } else if (activePreset === "orthogonalTangents") {
      // 正交切线：切点联动，仅展示焦准距 p 与动切点 tP
      activeKeys = ["p", "tP"];
    } else {
      const keysByMode: Record<string, string[]> = {
        definition: ["p", "tP"],
        focalChord: ["p", "thetaDeg"],
        tangentOptical: ["p", "tP", "yQ"],
      };
      activeKeys = keysByMode[studyMode] ?? Object.keys(paramMeta);
    }

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
  }, [params, studyMode, activePreset]);

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

  // 左屏教学提示与题设导引（说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    if (activePreset !== "free") {
      const modePresets = PARABOLA_PRESETS[studyMode] ?? [];
      const targetPreset = modePresets.find((p) => p.key === activePreset);
      if (targetPreset) {
        if (activePreset === "latusRectum") {
          return {
            variant: "primary" as const,
            badge: "高考经典 · 通径极值性质",
            condition: "过焦点作垂直于对称轴的相交弦（通径）。",
            question: "求解通径的长度，并证明通径是所有焦点弦中最短的弦。",
          };
        }
        if (activePreset === "orthogonalTangents") {
          return {
            variant: "danger" as const,
            badge: "高考经典 · 阿基米德正交切线",
            condition: "割线 AB 为焦点弦，分别过端点 A, B 作切线交于外点 P。",
            question:
              "证明两切线互相垂直且交点 P 必在准线上，探究弦 AB 与连线 PF 的垂直平分关系。",
          };
        }
      }
    }

    if (studyMode === "definition") {
      return {
        variant: "info" as const,
        badge: "第一定义与焦半径转化",
        condition: "抛物线上动点 P 到焦点与到准线的连线几何系统。",
        question:
          "如何利用焦半径与准线垂线段的等长关系，解决折线距离和的最小值问题？",
      };
    }
    if (studyMode === "focalChord") {
      return {
        variant: "primary" as const,
        badge: "高考焦点弦与相切圆",
        condition: "过焦点的割线与抛物线相交于 A, B 两点构成焦点弦。",
        question:
          "如何利用横坐标与焦准距表示焦点弦长，并探究以 AB 为直径的圆与准线的位置关系？",
      };
    }
    return {
      variant: "danger" as const,
      badge: "阿基米德三角形与光学性质",
      condition: "过抛物线上两点引切线交于点 P，构成阿基米德三角形。",
      question:
        "探究切点弦中点与外点 P 的坐标几何关系，以及平行入射光线经抛物线反射过焦点的光学性质。",
    };
  }, [studyMode, activePreset]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 开口方向选择 Section */}
          <LeftPanelSection title="抛物线开向">
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
          <LeftPanelSection title="高考焦点与准线几何">
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
          <LeftPanelSection title="典型预设">
            <SelectGrid
              items={currentPresets}
              value={activePreset}
              onChange={handlePresetSelect}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 4. 参数调节 Section */}
          <LeftPanelSection title="参数调节">
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
