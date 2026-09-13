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

  // 参数更新处理器（若调节焦准距 p，不强行重置预设情景）
  const handleParamChange = (key: string, value: number) => {
    if (key !== "p") {
      setActivePreset("free");
    }
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 切换模式处理器（重置为对应模式的基准参数）
  const handleModeChange = (modeKey: string) => {
    const nextMode = modeKey as typeof mode;
    setMode(nextMode);
    setActivePreset("free");
    if (nextMode === "archimedesTriangle") {
      setParams((prev) => ({ ...prev, yQ: 1.5 }));
    } else if (nextMode === "focalChordProperties") {
      setParams((prev) => ({ ...prev, thetaDeg: 60.0 }));
    } else if (nextMode === "orthogonalChords") {
      setParams((prev) => ({ ...prev, thetaDeg: 45.0 }));
    }
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

  // 教学提示双要素导引 (初始条件 + 探究设问，全量 12 个预设 100% 动态联动特化)
  const tipConfig = useMemo(() => {
    if (activePreset !== "free") {
      // 模式 1 预设
      if (activePreset === "min_area") {
        return {
          badge: "拓展 · 通径正交切线",
          condition:
            "外点 $Q$ 位于准线与对称轴交点 $(-\\frac{p}{2}, 0)$ 处，切点弦 $AB$ 为通径。",
          question:
            "求两切线斜率乘积，并证明阿基米德三角形面积如何达到全局极小值 $p^2$。",
        };
      }
      if (activePreset === "symmetric_tangent") {
        return {
          badge: "拓展 · 对称正交切线",
          condition:
            "外点 $Q$ 纵坐标设为 $y_Q = 2.0$，向抛物线引两条切线 $QA, QB$。",
          question:
            "验证切线斜率 $k_1, k_2$ 是否始终满足 $k_1 k_2 = -1$，并证明切点弦 $AB$ 必过焦点 $F$。",
        };
      }
      if (activePreset === "high_aspect") {
        return {
          badge: "拓展 · 高偏心切点弦",
          condition:
            "外点 $Q$ 移动至远离对称轴的 $y_Q = 3.5$ 处，两切点高度偏斜。",
          question:
            "探究高偏斜构型下中线 $QM$ 是否仍被抛物线平分，并分析三角形面积增长规律。",
        };
      }

      // 模式 2 预设
      if (activePreset === "latus_rectum") {
        return {
          badge: "拓展 · 最短焦点弦 (通径)",
          condition:
            "割线垂直于对称轴通过焦点 $F$，即倾角 $\\theta = 90^\\circ$ 的通径构型。",
          question:
            "证明通径长为 $2p$ 且为最短焦点弦，并验证以通径为直径的圆与准线相切于对称轴交点。",
        };
      }
      if (activePreset === "ratio_3to1") {
        return {
          badge: "拓展 · 3:1 分割焦点弦",
          condition:
            "割线倾斜角为 $\\theta = 60^\\circ$，焦点 $F$ 将弦长分割为两段焦半径。",
          question:
            "计算焦半径比值 $\\lambda = |AF|/|BF|$ 并验证其为 $3$，证明焦半径倒数和恒等于 $\\frac{2}{p}$。",
        };
      }
      if (activePreset === "chord_45deg") {
        return {
          badge: "拓展 · 45° 倾斜焦点弦",
          condition:
            "焦点弦割线倾角为 $\\theta = 45^\\circ$，割线方程为 $y = x - \\frac{p}{2}$。",
          question:
            "求该倾角下的焦点弦长 $|AB| = 4p$，并验证以 $AB$ 为直径的圆与准线的切点坐标。",
        };
      }

      // 模式 3 预设
      if (activePreset === "symmetric_45") {
        return {
          badge: "拓展 · 45° 对角双垂直弦",
          condition:
            "两条焦点弦互相垂直且倾角分别为 $45^\\circ$ 与 $135^\\circ$，构成对称四边形。",
          question:
            "探究双垂直弦长和与四边形面积在对称构型下的极小值，求出取等充要条件。",
        };
      }
      if (activePreset === "skew_30") {
        return {
          badge: "拓展 · 30°/120° 正交焦点弦",
          condition:
            "第一条焦点弦倾角为 $\\theta = 30^\\circ$，第二条垂直弦倾角为 $120^\\circ$。",
          question:
            "验证两正交弦长倒数和是否恒等于 $\\frac{1}{2p}$，并比较此时两弦长之和与极小值 $8p$ 的差距。",
        };
      }
      if (activePreset === "skew_60") {
        return {
          badge: "拓展 · 60°/150° 正交焦点弦",
          condition:
            "第一条焦点弦倾角为 $\\theta = 60^\\circ$，第二条垂直弦倾角为 $150^\\circ$。",
          question:
            "求四边形 $ACBD$ 的具体面积，并分析随倾角旋转四边形面积向极小值 $8p^2$ 回归的规律。",
        };
      }
    }

    if (mode === "archimedesTriangle") {
      return {
        badge: "拓展 · 准线蒙日正交定理",
        condition:
          "从准线上任意一点 $Q(-\\frac{p}{2}, y_Q)$ 向抛物线引两条切线切于 $A, B$。",
        question:
          "证明两切线互相垂直且切点弦必过焦点，并探究中线 $QM$ 被抛物线平分的几何性质。",
      };
    }
    if (mode === "focalChordProperties") {
      return {
        badge: "拓展 · 焦点弦与调和中项",
        condition:
          "过焦点 $F$ 作倾斜角为 $\\theta$ 的割线与抛物线交于 $A, B$ 两点。",
        question:
          "探究焦半径倒数和是否为常数定值 $\\frac{2}{p}$，并证明以 $AB$ 为直径的圆必与准线相切。",
      };
    }
    return {
      badge: "拓展 · 双垂直焦点弦极值",
      condition: "过焦点 $F$ 作互相垂直的两条割线 $AB \\perp CD$。",
      question:
        "求两垂直弦倒数和的定值，并探寻四边形 $ACBD$ 面积取得全局极小值的几何构型。",
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
          <LeftPanelSection title="拓展研究专题">
            <TabSwitcher
              tabs={[
                { key: "archimedesTriangle", label: "阿基米德" },
                { key: "focalChordProperties", label: "焦点弦性质" },
                { key: "orthogonalChords", label: "正交垂直弦" },
              ]}
              value={mode}
              onChange={handleModeChange}
            />
          </LeftPanelSection>

          {/* 2. 典型真题预设 Section (2列排版) */}
          <LeftPanelSection title="典型预设">
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

          {/* 4. 教学导引双要素 TipCard（置于最底部） */}
          <TipCard
            variant="primary"
            badge={tipConfig.badge}
            condition={tipConfig.condition}
            question={tipConfig.question}
          />
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
          reasoningSteps={mathData.reasoningSteps}
          examAnchor={mathData.examAnchor}
          mnemonic={mathData.mnemonic}
          title="抛物线阿基米德几何看板"
        />
      }
    />
  );
}
