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
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { ParabolaArchimedesScene } from "./components/ParabolaArchimedesScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  PARABOLA_ARCHIMEDES_PRESETS,
} from "@/data/registries/parabolaArchimedes";

export function ParabolaArchimedesAnimation() {
  // 研究主题：'archimedesTriangle' | 'focalChordProperties' | 'orthogonalChords'
  const [mode, setMode] = useState<
    "archimedesTriangle" | "focalChordProperties" | "orthogonalChords"
  >("archimedesTriangle");

  // 当前激活预设 (默认 'free' 自由探索)
  const [activePreset, setActivePreset] = useState<string>("free");

  // 参数状态
  const [params, setParams] = useState(() => ({
    p: defaultParams.p,
    yQ: defaultParams.yQ,
    thetaDeg: defaultParams.thetaDeg,
  }));

  // 视口尺寸测量
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
    return buildMathQuantities("anim-parabola-archimedes", params, { mode });
  }, [params, mode]);

  // 画布拖拽交互时自动回归自由探索
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
    const nextMode = modeKey as typeof mode;
    setMode(nextMode);
    setActivePreset("free");
  };

  // 典型预设切换
  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    const modePresets = PARABOLA_ARCHIMEDES_PRESETS[mode] ?? [];
    const target = modePresets.find((p) => p.key === presetKey);
    if (target?.params) {
      setParams((prev) => ({
        ...prev,
        ...target.params,
      }));
    }
  };

  // 重置参数
  const handleReset = () => {
    setActivePreset("free");
    setParams({
      p: defaultParams.p,
      yQ: defaultParams.yQ,
      thetaDeg: defaultParams.thetaDeg,
    });
  };

  // 按 mode 与预设过滤参数配置 (参数降维)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let activeKeys: string[] = [];

    if (activePreset === "min_area") {
      // 极小值预设锁定 yQ = 0
      activeKeys = ["p"];
    } else if (activePreset === "latus_rectum") {
      // 通径预设锁定 theta = 90
      activeKeys = ["p"];
    } else if (activePreset === "symmetric_45") {
      // 45度预设锁定 theta = 45
      activeKeys = ["p"];
    } else {
      const keysByMode: Record<string, string[]> = {
        archimedesTriangle: ["p", "yQ"],
        focalChordProperties: ["p", "thetaDeg"],
        orthogonalChords: ["p", "thetaDeg"],
      };
      activeKeys = keysByMode[mode] ?? Object.keys(paramMeta);
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
          group: meta.group,
          marks: meta.marks,
        };
      });
  }, [params, mode, activePreset]);

  // 当前模式下的预设列表项
  const currentPresets = useMemo(() => {
    return (PARABOLA_ARCHIMEDES_PRESETS[mode] ?? []).map((p) => ({
      key: p.key,
      label: p.label,
    }));
  }, [mode]);

  // 方程公式悬浮 KaTeX
  const equationLatex = useMemo(() => {
    const pStr = params.p > 0 ? (2 * params.p).toFixed(1) : "2p";
    return `y^2 = \\color{${MATH_COLORS.paramPrimary}}{${pStr}} x \\quad (p=\\color{${MATH_COLORS.paramPrimary}}{${params.p.toFixed(1)}})`;
  }, [params.p]);

  // 教学提示双要素导引 (初始条件 + 探究设问)
  const tipConfig = useMemo(() => {
    if (activePreset !== "free") {
      if (activePreset === "min_area") {
        return {
          badge: "高考经典 · 通径正交切线",
          condition:
            "外点 Q 位于准线与对称轴交点 (-p/2, 0) 处，切点弦 AB 为通径。",
          question:
            "探究两切线斜率关系，并验证阿基米德三角形面积如何达到全局最小值？",
        };
      }
      if (activePreset === "latus_rectum") {
        return {
          badge: "高考经典 · 最短焦点弦",
          condition: "割线垂直于对称轴通过焦点 F，即通径构型。",
          question:
            "验证通径弦长与焦准距 p 的倍数关系，并观察以通径为直径的圆与准线的位置关系。",
        };
      }
      if (activePreset === "symmetric_45") {
        return {
          badge: "高考压轴 · 45°对角双垂直弦",
          condition: "两条焦点弦互相垂直且倾角为 45° 与 135°，构成对称四边形。",
          question: "探究双垂直弦长和与四边形面积在对称构型下的极值表现。",
        };
      }
    }

    if (mode === "archimedesTriangle") {
      return {
        badge: "新高考核心 · 准线蒙日正交定理",
        condition: "从准线上任意一点 Q(-p/2, yQ) 向抛物线引两条切线切于 A, B。",
        question:
          "探究切线 QA, QB 的垂直关系、弦 AB 与焦点 F 的位置关系，以及中线 QM 如何被抛物线二等分？",
      };
    }
    if (mode === "focalChordProperties") {
      return {
        badge: "新高考高频 · 焦点弦与调和中项",
        condition: "过焦点 F 作倾斜角为 θ 的割线与抛物线交于 A, B 两点。",
        question:
          "探究焦半径倒数和 1/AF + 1/BF 是否恒定，以及以 AB 为直径的圆与准线存在怎样的相切规律？",
      };
    }
    return {
      badge: "新高考压轴 · 双垂直焦点弦极值",
      condition: "过焦点 F 作互相垂直的两条割线 AB ⊥ CD。",
      question:
        "探究两弦倒数和 1/|AB| + 1/|CD| 的定值性质，并探寻四边形 ACBD 面积取得极小值的几何构型。",
    };
  }, [mode, activePreset]);

  // 中屏右下角图例卡片
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (mode === "archimedesTriangle") {
      return [
        {
          label: "抛物线 $y^2=2px$",
          color: MATH_COLORS.function,
          type: "line",
        },
        {
          label: "切线 $QA, QB$ (垂直)",
          color: MATH_COLORS.paramTertiary,
          type: "line",
        },
        {
          label: "切点弦 $AB$ (过焦点)",
          color: MATH_COLORS.vectorPrimary,
          type: "line",
        },
        {
          label: "阿基米德 $\\triangle QAB$",
          color: MATH_COLORS.paramTertiary,
          type: "area",
        },
        {
          label: "平分中线 $QM$",
          color: MATH_COLORS.paramSecondary,
          type: "dash",
        },
        {
          label: "焦点 $F$ / 准线 $l$",
          color: MATH_COLORS.focusPoint,
          type: "point",
        },
      ];
    }
    if (mode === "focalChordProperties") {
      return [
        {
          label: "抛物线 $y^2=2px$",
          color: MATH_COLORS.function,
          type: "line",
        },
        {
          label: "焦点弦 $AB$",
          color: MATH_COLORS.vectorPrimary,
          type: "line",
        },
        {
          label: "直径切圆 (切准线于 $K$)",
          color: MATH_COLORS.vectorPrimary,
          type: "dash",
        },
        {
          label: "弦中点公垂线 $MK$",
          color: MATH_COLORS.asymptote,
          type: "dash",
        },
        {
          label: "焦点 $F$ / 切点 $K$",
          color: MATH_COLORS.focusPoint,
          type: "point",
        },
      ];
    }
    return [
      {
        label: "第一焦点弦 $AB$",
        color: MATH_COLORS.vectorPrimary,
        type: "line",
      },
      {
        label: "第二垂直弦 $CD$",
        color: MATH_COLORS.vectorSecondary,
        type: "line",
      },
      { label: "四边形 $ACBD$", color: MATH_COLORS.paramPrimary, type: "area" },
      {
        label: "焦点 $F$ (直角交点)",
        color: MATH_COLORS.focusPoint,
        type: "point",
      },
    ];
  }, [mode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 探究主题 Section */}
          <LeftPanelSection title="高考研究专题">
            <TabSwitcher
              tabs={[
                { key: "archimedesTriangle", label: "阿基米德三角形" },
                { key: "focalChordProperties", label: "焦点弦与相切圆" },
                { key: "orthogonalChords", label: "双垂直焦点弦" },
              ]}
              value={mode}
              onChange={handleModeChange}
            />
          </LeftPanelSection>

          {/* 2. 典型真题预设 Section (2列排版) */}
          <LeftPanelSection title="典型高考预设">
            <SelectGrid
              items={currentPresets}
              value={activePreset}
              onChange={handlePresetSelect}
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 参数调节 Section */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 4. 教学导引双要素 TipCard */}
          <LeftPanelSection title="教学导引与题设设问" compact>
            <TipCard variant="primary">
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
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm pointer-events-none select-none">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ParabolaArchimedesScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              onInteractionStart={handleInteractionStart}
              fontScale={canvasSize.font}
              mode={mode}
            />
          </AnimationSvgCanvas>

          {/* 中屏右下角毛玻璃图例 (SceneLegend) */}
          <SceneLegend items={legendItems} title="几何图元指示" />
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="抛物线阿基米德几何看板"
        />
      }
    />
  );
}
