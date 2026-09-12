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
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { ConicLineScene } from "./components/ConicLineScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  getConicLinePresets,
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

  // 参数变更处理器（拖拽或手动微调时自动退回 free 自由探究，并保证高中数学椭圆 a > b > 0 课标约束）
  const handleParamChange = (key: string, value: number) => {
    setActivePreset("free");
    setParams((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };
      if (conicType === "ellipse") {
        if (key === "a") {
          const curB = next.b ?? 2;
          if (value <= curB) {
            next.b = Number(Math.max(0.5, value - 0.5).toFixed(1));
          }
        } else if (key === "b") {
          const curA = next.a ?? 3;
          if (value >= curA) {
            next.a = Number((value + 0.5).toFixed(1));
          }
        }
      }
      return next;
    });
  };

  // 典型预设切换处理器（依当前曲线与研究视角双重派发）
  const handlePresetChange = (presetKey: string) => {
    setActivePreset(presetKey);
    const presets = getConicLinePresets(conicType, studyMode);
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

  // 曲线类型切换处理器（自动协同应用新曲线在该模式下的自由探究健康基准）
  const handleConicTypeChange = (type: ConicType) => {
    setConicType(type);
    setActivePreset("free");
    const presets = getConicLinePresets(type, studyMode);
    const freePreset = presets.find((p) => p.key === "free");
    if (freePreset && Object.keys(freePreset.params).length > 0) {
      setParams((prev) => {
        const next = { ...prev };
        Object.entries(freePreset.params).forEach(([k, v]) => {
          if (typeof v === "number") next[k] = v;
        });
        return next;
      });
    }
  };

  // 模式切换处理器（自动协同应用当前曲线在新模式下的自由探究健康基准）
  const handleModeChange = (mode: StudyMode) => {
    setStudyMode(mode);
    setActivePreset("free");
    const presets = getConicLinePresets(conicType, mode);
    const freePreset = presets.find((p) => p.key === "free");
    if (freePreset && Object.keys(freePreset.params).length > 0) {
      setParams((prev) => {
        const next = { ...prev };
        Object.entries(freePreset.params).forEach(([k, v]) => {
          if (typeof v === "number") next[k] = v;
        });
        return next;
      });
    }
  };

  // 重置参数（重置为当前曲线与当前视角的基准参数）
  const handleReset = () => {
    setActivePreset("free");
    const presets = getConicLinePresets(conicType, studyMode);
    const freePreset = presets.find((p) => p.key === "free");
    if (freePreset && Object.keys(freePreset.params).length > 0) {
      setParams((prev) => {
        const next = { ...prev };
        Object.entries(freePreset.params).forEach(([k, v]) => {
          if (typeof v === "number") next[k] = v;
        });
        return next;
      });
    } else {
      setParams({
        ...defaultParams,
      });
    }
  };

  // 当前曲线与模式下的精准特化预设列表
  const currentPresets = useMemo(() => {
    const list = getConicLinePresets(conicType, studyMode);
    return list.map((item) => ({
      key: item.key,
      label: item.label,
      description: item.description,
    }));
  }, [conicType, studyMode]);

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
      if (activePreset === "tangent") {
        // 临界相切：截距 m 由相切判别式锁定，仅调节斜率 k 与曲线形状
        modeKeyGroups = [
          { group: "切线斜率 k", keys: ["k"] },
          { group: conicGroupName, keys: conicKeys },
        ];
      } else if (activePreset === "axis_secant") {
        // 过原点对称轴正交弦：截距 m=0 锁定
        modeKeyGroups = [
          { group: "割线斜率 k", keys: ["k"] },
          { group: conicGroupName, keys: conicKeys },
        ];
      } else {
        modeKeyGroups = [
          { group: "直线斜截式参数 (k, m)", keys: ["k", "m"] },
          { group: conicGroupName, keys: conicKeys },
        ];
      }
    } else if (studyMode === "focus") {
      if (activePreset === "latus_rectum") {
        // 通径极值：θ = 90° 锁定，仅调节圆锥曲线底模
        modeKeyGroups = [{ group: conicGroupName, keys: conicKeys }];
      } else {
        modeKeyGroups = [
          { group: "焦点弦倾斜角 θ", keys: ["theta"] },
          { group: conicGroupName, keys: conicKeys },
        ];
      }
    } else if (studyMode === "midpoint") {
      modeKeyGroups = [
        { group: "弦中点 M(x₀, y₀) 坐标", keys: ["midpointX", "midpointY"] },
        { group: conicGroupName, keys: conicKeys },
      ];
    } else {
      modeKeyGroups = [
        { group: "曲线外极点 P₀(x₀, y₀) 坐标", keys: ["poleX", "poleY"] },
        { group: conicGroupName, keys: conicKeys },
      ];
    }

    const configs: ParamConfig[] = [];
    modeKeyGroups.forEach(({ group, keys }) => {
      keys.forEach((key) => {
        if (key in paramMeta) {
          const meta = paramMeta[key];
          const filteredMarks =
            key === "k" && conicType !== "hyperbola"
              ? meta.marks?.filter(
                  (m) =>
                    !m.label?.includes("渐近线") &&
                    !m.labelFormula?.includes("b/a"),
                )
              : meta.marks;

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
            marks: filteredMarks,
          });
        }
      });
    });

    return configs;
  }, [params, conicType, studyMode, activePreset]);

  // 悬浮在画布上的动态方程 LaTeX
  const floatingEquation = useMemo(() => {
    const a = params.a ?? 3;
    const b = params.b ?? 2;
    const p = params.p ?? 2;

    let curveTex = "";
    if (conicType === "ellipse") {
      curveTex = `\\frac{x^2}{\\color{${MATH_COLORS.paramPrimary}}{${a.toFixed(1).replace(/\.0$/, "")}}^2} + \\frac{y^2}{\\color{${MATH_COLORS.paramSecondary}}{${b.toFixed(1).replace(/\.0$/, "")}}^2} = 1`;
    } else if (conicType === "hyperbola") {
      curveTex = `\\frac{x^2}{\\color{${MATH_COLORS.paramPrimary}}{${a.toFixed(1).replace(/\.0$/, "")}}^2} - \\frac{y^2}{\\color{${MATH_COLORS.paramSecondary}}{${b.toFixed(1).replace(/\.0$/, "")}}^2} = 1`;
    } else {
      curveTex = `y^2 = 2(\\color{${MATH_COLORS.paramPrimary}}{${p.toFixed(1).replace(/\.0$/, "")}})x`;
    }

    let lineTex = "";
    if (studyMode === "general") {
      const k = params.k ?? 0.5;
      const m = params.m ?? 0.5;
      lineTex = `L: y = \\color{${MATH_COLORS.paramSecondary}}{${k.toFixed(2).replace(/\.?0+$/, "")}} x ${m >= 0 ? "+" : ""} \\color{${MATH_COLORS.paramTertiary}}{${m.toFixed(2).replace(/\.?0+$/, "")}}`;
    } else if (studyMode === "focus") {
      const thetaDeg = Math.round(
        ((params.theta ?? Math.PI / 4) * 180) / Math.PI,
      );
      lineTex = `L_{焦点}: \\theta = \\color{${MATH_COLORS.paramTertiary}}{${thetaDeg}^\\circ}`;
    } else if (studyMode === "midpoint") {
      const mx = params.midpointX ?? 1;
      const my = params.midpointY ?? 1;
      lineTex = `M_{中点}: (\\color{${MATH_COLORS.paramPrimary}}{${mx.toFixed(1).replace(/\.0$/, "")}}, \\color{${MATH_COLORS.paramSecondary}}{${my.toFixed(1).replace(/\.0$/, "")}})`;
    } else {
      const px = params.poleX ?? 4;
      const py = params.poleY ?? 3;
      lineTex = `P_{极点}: (\\color{${MATH_COLORS.paramPrimary}}{${px.toFixed(1).replace(/\.0$/, "")}}, \\color{${MATH_COLORS.paramSecondary}}{${py.toFixed(1).replace(/\.0$/, "")}})`;
    }

    return `${curveTex} \\quad \\text{与} \\quad ${lineTex}`;
  }, [conicType, studyMode, params]);

  // 左屏教学提示与题设导引（依当前曲线与研究视角双重深度特化）
  const tipConfig = useMemo(() => {
    const conicName =
      conicType === "ellipse"
        ? "椭圆"
        : conicType === "hyperbola"
          ? "双曲线"
          : "抛物线";

    if (activePreset !== "free") {
      const presets = getConicLinePresets(conicType, studyMode);
      const targetPreset = presets.find((p) => p.key === activePreset);
      if (targetPreset) {
        if (
          activePreset.includes("tangent") ||
          activePreset.includes("critical")
        ) {
          return {
            variant: "warning" as const,
            badge: `高考典型 · ${conicName}${targetPreset.label}`,
            condition:
              "动直线与" +
              conicName +
              "处于相切临界状态，此时联立判别式 $\\Delta = 0$，恰有唯一实数切点。",
            question: `如何列出联立方程求出相切临界参数，并求解唯一公共切点的坐标？`,
          };
        }
        if (
          activePreset.includes("latus") ||
          activePreset.includes("focus") ||
          activePreset === "latus_rectum"
        ) {
          return {
            variant: "primary" as const,
            badge: `高考压轴 · ${conicName}通径极值`,
            condition: `割线通过${conicName}焦点且垂直于对称轴（通径，$\\theta = \\pi/2$），此时斜率不存在。`,
            question: `证明垂直对称轴的焦点弦长（通径）为极小值，并探究通径两端点的代数坐标。`,
          };
        }
        if (
          activePreset.includes("asymptote") ||
          activePreset.includes("parallel")
        ) {
          return {
            variant: "danger" as const,
            badge: `易错陷阱 · ${conicName}降阶一元一次`,
            condition:
              conicType === "hyperbola"
                ? `直线平行于双曲线渐近线（$k = \\pm b/a$），联立方程二次项归零降阶。`
                : `直线平行于抛物线对称轴（$k = 0$），方程降阶为一元一次。`,
            question: `分析为什么方程仅有 $1$ 个实交点却绝对不是相切，如何避开高考分类讨论漏解陷阱？`,
          };
        }
      }
    }

    if (studyMode === "general") {
      return {
        variant: "info" as const,
        badge: `${conicName}位置关系判定与相交弦长`,
        condition:
          "平面内给定" +
          conicName +
          "标准方程与一般动割线方程 $L: y = kx + m$。",
        question:
          "如何通过联立消元判别式 $\\Delta$ 判定相交、相切与相离，并由韦达定理代入弦长公式求 $|AB|$？",
      };
    }
    if (studyMode === "focus") {
      return {
        variant: "primary" as const,
        badge: `${conicName}焦点弦长与焦半径定值`,
        condition:
          "动割线通过" + conicName + "右焦点，与曲线交于 $A, B$ 两点。",
        question:
          conicType === "parabola"
            ? "利用抛物线定义证明焦点弦长 $|AB| = x_1 + x_2 + p$，并证明焦半径倒数和 $\\frac{1}{|FA|} + \\frac{1}{|FB|} = \\frac{2}{p}$ 为常数。"
            : "探究" +
              conicName +
              "焦点弦长的最值变化规律，以及两端点焦半径倒数和 $\\frac{1}{|F_1 A|} + \\frac{1}{|F_1 B|}$ 的定值性质。",
      };
    }
    if (studyMode === "midpoint") {
      return {
        variant: "warning" as const,
        badge: `${conicName}中点弦与点差法`,
        condition: "已知" + conicName + "动弦 $AB$ 的中点为 $M(x_0, y_0)$。",
        question:
          "如何利用点差法平方差展开快速求解动弦斜率，并由判别式 $\\Delta > 0$ 检验弦中点存在性（防越界伪根）？",
      };
    }
    return {
      variant: "danger" as const,
      badge: `${conicName}极点极线与切点弦对偶`,
      condition:
        "从" +
        conicName +
        "外一点 $P(x_P, y_P)$ 引两条切线，切点分别为 $A, B$。",
      question:
        "如何利用极线对偶公式一步写出切点弦 $AB$ 方程，探究极点在定直线上运动时切点弦的定点规律？",
    };
  }, [conicType, studyMode, activePreset]);

  // 画布图例
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const items: SceneLegendItem[] = [
      {
        colorKey: "primary",
        label:
          conicType === "ellipse"
            ? "椭圆曲线"
            : conicType === "hyperbola"
              ? "双曲线"
              : "抛物线",
        style: "solid",
      },
      {
        colorKey: "paramPrimary",
        label:
          studyMode === "focus"
            ? "焦点割线 / 通径"
            : studyMode === "polePolar"
              ? "切点弦 AB"
              : "动直线 / 割线弦 AB",
        style: "solid",
      },
    ];

    if (studyMode === "general") {
      items.push({
        colorKey: "paramTertiary",
        label: "原点三角形 △OAB",
        style: "dash",
      });
    }

    if (conicType === "parabola") {
      items.push({
        colorKey: "paramTertiary",
        label: "准线与投影",
        style: "dash",
      });
    }

    if (studyMode === "midpoint") {
      items.push({
        colorKey: "paramSecondary",
        label: "中点连线 OM",
        style: "dash",
      });
    }

    if (studyMode === "polePolar") {
      items.push({
        colorKey: "paramSecondary",
        label: "极点切线 PA/PB",
        style: "dash",
      });
    }

    return items;
  }, [conicType, studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 圆锥曲线选择 Section */}
          <LeftPanelSection title="曲线类型">
            <TabSwitcher
              tabs={[
                { key: "ellipse", label: "椭圆" },
                { key: "hyperbola", label: "双曲线" },
                { key: "parabola", label: "抛物线" },
              ]}
              value={conicType}
              onChange={(key) => handleConicTypeChange(key as ConicType)}
            />
          </LeftPanelSection>

          {/* 研究视角 Section (2x2 黄金规范) */}
          <LeftPanelSection title="研究视角">
            <SelectGrid
              items={[
                { key: "general", label: "位置与弦长" },
                { key: "focus", label: "过焦点弦" },
                { key: "midpoint", label: "中点弦/点差" },
                { key: "polePolar", label: "极点极线弦" },
              ]}
              value={studyMode}
              onChange={(k) => handleModeChange(k as StudyMode)}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 典型预设 Section */}
          <LeftPanelSection title="典型预设">
            <SelectGrid
              items={currentPresets}
              value={activePreset}
              onChange={handlePresetChange}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 参数调节 Section */}
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

          {/* 画布右下角图例 */}
          <SceneLegend items={legendItems} />
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
          title="数学解析看板"
        />
      }
    />
  );
}
