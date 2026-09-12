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
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { ParabolaScene } from "./components/ParabolaScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  PARABOLA_PRESETS,
} from "@/data/registries/parabola";
import type { ParabolaDirection } from "@/math/parabola";
import { formatMathNumber } from "@/utils/mathFormat";

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

    if (activePreset === "latus_rectum") {
      // 通径预设：倾斜角锁定为 90 度，仅调节焦准距 p
      activeKeys = ["p"];
    } else if (activePreset === "monge_symmetric") {
      // 对称切线：yQ 锁定为 0，展示焦准距 p
      activeKeys = ["p"];
    } else if (activePreset === "latus_tangent") {
      // 动点光路：展示焦准距 p 与动点坐标
      activeKeys = ["p", "tP"];
    } else {
      const keysByMode: Record<string, string[]> = {
        definition: ["p", "tP"],
        focalChord: ["p", "thetaDeg"],
        tangentOptical: ["p", "tP", "yQ"],
      };
      activeKeys = keysByMode[studyMode] ?? Object.keys(paramMeta);
    }

    const isAxisHorizontal = direction === "right" || direction === "left";

    return activeKeys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        let dynamicLabel = meta.label;
        let dynamicFormula = meta.labelFormula;

        if (key === "tP") {
          dynamicLabel = isAxisHorizontal
            ? "动点纵坐标 $y_P$"
            : "动点横坐标 $x_P$";
          dynamicFormula = isAxisHorizontal
            ? `\\text{动点纵坐标 } \\color{${MATH_COLORS.paramSecondary}}{y_P}`
            : `\\text{动点横坐标 } \\color{${MATH_COLORS.paramSecondary}}{x_P}`;
        } else if (key === "yQ") {
          dynamicLabel = isAxisHorizontal
            ? "准线点纵坐标 $y_Q$"
            : "准线点横坐标 $x_Q$";
          dynamicFormula = isAxisHorizontal
            ? `\\text{准线点纵坐标 } \\color{${MATH_COLORS.paramTertiary}}{y_Q}`
            : `\\text{准线点横坐标 } \\color{${MATH_COLORS.paramTertiary}}{x_Q}`;
        }

        return {
          key,
          label: dynamicLabel,
          labelFormula: dynamicFormula,
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
  }, [params, studyMode, activePreset, direction]);

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
    const pVal = 2 * params.p;
    const pStr = formatMathNumber(Math.round(pVal * 10) / 10);
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
    const eqSymbol =
      direction === "right"
        ? `y^2 = ${formatMathNumber(2 * params.p)}x`
        : direction === "left"
          ? `y^2 = -${formatMathNumber(2 * params.p)}x`
          : direction === "up"
            ? `x^2 = ${formatMathNumber(2 * params.p)}y`
            : `x^2 = -${formatMathNumber(2 * params.p)}y`;

    if (activePreset !== "free") {
      if (activePreset === "latus_rectum") {
        return {
          variant: "primary" as const,
          badge: "高考经典 · 通径极值性质",
          condition: `过抛物线 $${eqSymbol}$ 焦点 $F$ 作垂直于对称轴的弦（通径）。`,
          question: "求通径的弦长，并证明通径是所有过焦点相交弦中最短的弦。",
        };
      }
      if (activePreset === "latus_endpoint") {
        return {
          variant: "info" as const,
          badge: "第一定义 · 通径端点焦半径",
          condition: `动点 $P$ 位于通径端点，距对称轴距离恰为焦准距 $p$。`,
          question:
            "求焦半径 $|PF|$ 与到准线距离，证明通径端点焦半径恰等于 $p$。",
        };
      }
      if (activePreset === "vertex_near") {
        return {
          variant: "info" as const,
          badge: "第一定义 · 极限逼近顶点",
          condition: `动点 $P$ 沿着抛物线 $${eqSymbol}$ 不断滑向顶点 $(0, 0)$。`,
          question:
            "求动点 $P$ 逼近顶点时的焦半径极限值，并验证其恒等于 $\\frac{p}{2}$。",
        };
      }
      if (activePreset === "wide_aperture") {
        return {
          variant: "info" as const,
          badge: "几何张口 · 焦准距影响探究",
          condition: `调节焦准距至 $p = 4.0$，抛物线开口显著扁平开阔。`,
          question:
            "探究焦准距 $p$ 的增大对焦点坐标、准线位置及焦半径变化速率的影响。",
        };
      }
      if (activePreset === "chord_45deg" || activePreset === "chord_135deg") {
        return {
          variant: "primary" as const,
          badge: "高考经典 · 特殊倾角焦点弦",
          condition: `过焦点 $F$ 作与对称轴夹角为 $45^\\circ$ 或 $135^\\circ$ 的焦点弦 $AB$。`,
          question:
            "证明该弦长为通径长度的 2 倍（即 $|AB| = 4p$），且以 $AB$ 为直径的圆与准线相切。",
        };
      }
      if (activePreset === "monge_symmetric") {
        return {
          variant: "danger" as const,
          badge: "阿基米德三角形 · 通径双切线",
          condition: `从准线与对称轴交点 $Q$ 向抛物线 $${eqSymbol}$ 引切线 $QA, QB$。`,
          question:
            "证明两切线互相垂直且倾斜角互补，两切点连线 $AB$ 恰为垂直通径。",
        };
      }
      if (activePreset === "latus_tangent") {
        return {
          variant: "danger" as const,
          badge: "物理光学 · 焦点反射平行性质",
          condition: `从焦点 $F$ 发出光线射向抛物线上动点 $P$，经抛物线反射。`,
          question:
            "证明反射光线必平行于抛物线对称轴，且切线为入射光与反射光反向延长线的平分线。",
        };
      }
      if (activePreset === "high_aspect") {
        return {
          variant: "danger" as const,
          badge: "阿基米德三角形 · 一般正交切线",
          condition: `从准线上大偏位点 $Q$ 向抛物线 $${eqSymbol}$ 引切线 $QA, QB$。`,
          question:
            "证明两切线恒满足 $QA \\perp QB$，切点弦 $AB$ 必过焦点且 $QF \\perp AB$。",
        };
      }
    }

    if (studyMode === "definition") {
      return {
        variant: "info" as const,
        badge: "第一定义与焦半径转化",
        condition: `动点 $P$ 在抛物线 $${eqSymbol}$ 上，焦点为 $F$，准线为 $l$。`,
        question:
          "利用第一定义验证 $|PF| = d(P, l)$，并探究如何化折为直求解折线距离和最值。",
      };
    }
    if (studyMode === "focalChord") {
      return {
        variant: "primary" as const,
        badge: "高考焦点弦与相切圆",
        condition: `过焦点 $F$ 且与对称轴夹角为 $\\theta$ 的直线交抛物线 $${eqSymbol}$ 于 $A, B$ 两点。`,
        question:
          "求焦点弦长公式 $|AB| = \\frac{2p}{\\sin^2\\theta}$，并证明以 $AB$ 为直径的圆与准线恒相切。",
      };
    }
    return {
      variant: "danger" as const,
      badge: "阿基米德三角形与光学性质",
      condition: `准线上动点 $Q$ 引抛物线 $${eqSymbol}$ 的两条切线 $QA, QB$ 构成阿基米德三角形。`,
      question:
        "证明双切线互相垂直且切点弦恒过焦点，并探究焦点发射光线经抛物线反射平行于对称轴的光学性质。",
    };
  }, [studyMode, activePreset, params.p, direction]);

  // 中屏毛玻璃图例
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const items: SceneLegendItem[] = [
      {
        label: "抛物线主曲线",
        color: MATH_COLORS.function,
        style: "solid",
      },
      {
        label: "焦点 $F$ / 准线 $l$",
        color: MATH_COLORS.asymptote,
        style: "dash",
      },
    ];

    if (studyMode === "definition") {
      items.push(
        {
          label: "焦半径 $PF$",
          color: MATH_COLORS.paramPrimary,
          style: "dash",
        },
        {
          label: "准线垂线 $PH$",
          color: MATH_COLORS.paramSecondary,
          style: "dash",
        },
      );
    } else if (studyMode === "focalChord") {
      items.push(
        {
          label: "焦点弦 $AB$",
          color: MATH_COLORS.vectorPrimary,
          style: "solid",
        },
        {
          label: "以 $AB$ 为直径的圆",
          color: MATH_COLORS.vectorPrimary,
          style: "dash",
        },
        {
          label: "中点垂线 $MK$",
          color: MATH_COLORS.paramSecondary,
          style: "dash",
        },
      );
    } else {
      items.push(
        {
          label: "入射与反射光线",
          color: MATH_COLORS.vectorResult,
          style: "solid",
        },
        {
          label: "准线双切线 $QA, QB$",
          color: MATH_COLORS.paramTertiary,
          style: "solid",
        },
        {
          label: "切点弦 $AB$ (过焦点)",
          color: MATH_COLORS.paramPrimary,
          style: "dash",
        },
      );
    }

    return items;
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 顶层核心探究主题 Section */}
          <LeftPanelSection title="探究主题">
            <SelectGrid
              items={[
                { key: "definition", label: "第一定义与焦半径" },
                { key: "focalChord", label: "焦点弦相切圆" },
                {
                  key: "tangentOptical",
                  label: "切线与光学性质",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={handleModeChange}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 抛物线开向与标准方程 Section (2x2 紧凑对称水平网格) */}
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
              layout="horizontal"
              size="compact"
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

          {/* 教学提示与题设导引（置于最底部） */}
          <TipCard
            variant={tipConfig.variant}
            badge={tipConfig.badge}
            condition={tipConfig.condition}
            question={tipConfig.question}
          />
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
          title="抛物线几何指标看板"
        />
      }
    />
  );
}
