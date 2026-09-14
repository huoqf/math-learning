import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { SceneLegend, type SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { ConicParamScene } from "./components/ConicParamScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  presetsByMode,
} from "@/data/registries/conicParam";
import {
  calculateParabolaYParam,
  calculateLineYFormConic,
} from "@/math/conicParam";
import { formatMathNumber, formatSignedTerm } from "@/utils/mathFormat";

export function ConicParamAnimation() {
  // 研究模式: 'ellipseTrig' (椭圆三角代换) | 'parabolaYParam' (抛物线纵坐标单参数) | 'lineYForm' (割线 x=my+n 降维)
  const [studyMode, setStudyMode] = useState<
    "ellipseTrig" | "parabolaYParam" | "lineYForm"
  >("ellipseTrig");

  // 典型预设 key
  const [activePreset, setActivePreset] = useState<string>("free");

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量 (840 x 650)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 直角坐标系比例尺：数学范围 X [-8, 8]，Y [-6, 6]
  const scale = useSceneScale({
    vp,
    xRange: [-8, 8],
    yRange: [-6, 6],
  });

  // 右屏看板数据计算
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-conic-param", params, { studyMode });
  }, [params, studyMode]);

  // 参数更新处理器（拖拽或微调时自动切回 free）
  const handleParamChange = (key: string, value: number) => {
    setActivePreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 预设切换处理器
  const handlePresetSelect = (presetKey: string) => {
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
  const handleModeChange = (mode: typeof studyMode) => {
    setStudyMode(mode);
    setActivePreset("free");
  };

  // 重置参数
  const handleReset = () => {
    setActivePreset("free");
    setParams({ ...defaultParams });
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

  // 按 studyMode 降维过滤并结构化分组参数列表
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let modeKeyGroups: Array<{ group: string; keys: string[] }> = [];

    if (studyMode === "ellipseTrig") {
      modeKeyGroups = [
        { group: "核心三角离心角", keys: ["theta"] },
        { group: "椭圆几何尺寸", keys: ["a", "b"] },
      ];
    } else if (studyMode === "parabolaYParam") {
      modeKeyGroups = [
        { group: "抛物线动点纵坐标参量", keys: ["y1", "y2"] },
        { group: "抛物线焦准距", keys: ["p"] },
      ];
    } else {
      modeKeyGroups = [
        { group: "割线斜截参数", keys: ["m", "n"] },
        { group: "椭圆几何底模", keys: ["a", "b"] },
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
  }, [params, studyMode]);

  // 构建中屏悬浮 LaTeX 方程
  const equationLatex = useMemo(() => {
    if (studyMode === "ellipseTrig") {
      const a = params.a ?? 4;
      const b = params.b ?? 3;
      const theta = params.theta ?? 45;
      return `\\begin{cases} x = \\color{${MATH_COLORS.paramPrimary}}{${formatMathNumber(a)}}\\cos\\color{${MATH_COLORS.paramTertiary}}{\\theta} \\\\ y = \\color{${MATH_COLORS.paramSecondary}}{${formatMathNumber(b)}}\\sin\\color{${MATH_COLORS.paramTertiary}}{\\theta} \\end{cases} \\quad (\\theta = ${theta}^\\circ)`;
    }
    if (studyMode === "parabolaYParam") {
      const p = params.p ?? 2;
      const y1 = params.y1 ?? 3;
      const y2 = params.y2 ?? -1.5;
      calculateParabolaYParam(p, y1, y2);
      const ySum = y1 + y2;
      const yProd = y1 * y2;
      return `(y_1 + y_2)y = 2px + y_1 y_2 \\implies ${formatMathNumber(ySum)}y = ${formatMathNumber(2 * p)}x ${formatSignedTerm(yProd, "")}`;
    }
    // lineYForm
    const a = params.a ?? 4;
    const b = params.b ?? 3;
    const m = params.m ?? 0.8;
    const n = params.n ?? 1;
    const res = calculateLineYFormConic(a, b, m, n);
    if (!res.valid)
      return `x = ${formatMathNumber(m)}y ${formatSignedTerm(n, "")} \\quad (\\Delta_y < 0)`;
    return `x = ${formatMathNumber(m)}y ${formatSignedTerm(n, "")} \\implies ${formatMathNumber(res.A)}y^2 ${formatSignedTerm(res.B, "y")} ${formatSignedTerm(res.C, "")} = 0`;
  }, [studyMode, params]);

  // 中屏图例
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    if (studyMode === "ellipseTrig") {
      return [
        {
          label: "椭圆标准曲线",
          colorKey: "ellipse",
          style: "line",
        },
        {
          label: "动点 P(a cosθ, b sinθ)",
          colorKey: "paramPrimary",
          style: "point",
        },
        {
          label: "辅助离心圆与中心角",
          colorKey: "paramPrimary",
          style: "dashed",
        },
        {
          label: "切线截距三角形",
          colorKey: "tangentLine",
          style: "line",
        },
      ];
    }
    if (studyMode === "parabolaYParam") {
      return [
        {
          label: "抛物线 y²=2px",
          colorKey: "parabola",
          style: "line",
        },
        {
          label: "动点 A, B (纵坐标参量)",
          colorKey: "paramSecondary",
          style: "point",
        },
        {
          label: "割线 (y₁+y₂)y=2px+y₁y₂",
          colorKey: "paramPrimary",
          style: "line",
        },
        {
          label: "弦中点 M",
          colorKey: "paramTertiary",
          style: "point",
        },
      ];
    }
    // lineYForm
    return [
      {
        label: "椭圆基底",
        colorKey: "ellipse",
        style: "line",
      },
      {
        label: "割线 x = my + n",
        colorKey: "paramPrimary",
        style: "line",
      },
      {
        label: "相交弦与两交点",
        colorKey: "paramSecondary",
        style: "point",
      },
      {
        label: "原点三角形 △OAB",
        colorKey: "accent",
        style: "area",
      },
    ];
  }, [studyMode]);

  // 左屏教学提示与题设导引（落实初始条件与核心设问）
  const tipConfig = useMemo(() => {
    if (studyMode === "ellipseTrig") {
      if (activePreset === "diag_45") {
        return {
          variant: "primary" as const,
          badge: "高考重点 · 椭圆切线截距面积极值",
          condition: `椭圆长半轴 a = ${params.a ?? 4}，短半轴 b = ${params.b ?? 3}，切点离心角处于 45° 临界。`,
          question:
            "探究切线与两坐标轴围成的直角三角形面积何时取得最小值，最小面积与半轴乘积 ab 有何关系？",
        };
      }
      return {
        variant: "info" as const,
        badge: "标内通法 · 椭圆三角代换求最值",
        condition: `椭圆动点设为 P(${formatMathNumber(params.a ?? 4)}\\cos\\theta, ${formatMathNumber(params.b ?? 3)}\\sin\\theta)，目标直线为 x - y - 6 = 0。`,
        question:
          "如何运用辅助角公式化简点到直线的距离公式，求解椭圆上动点到目标直线的最值范围？",
      };
    }

    if (studyMode === "parabolaYParam") {
      if (activePreset === "focus_chord") {
        return {
          variant: "primary" as const,
          badge: "压轴必考 · 抛物线焦点弦纵坐标定值",
          condition: `抛物线 y² = ${formatMathNumber(2 * (params.p ?? 2))}x，割线经过焦点 F(${formatMathNumber((params.p ?? 2) / 2)}, 0)。`,
          question:
            "证明过焦点弦两端点纵坐标乘积恒满足 y₁y₂ = -p²，并由此化简焦点弦长公式？",
        };
      }
      return {
        variant: "info" as const,
        badge: "新高考秒杀 · 抛物线单参数设点免联立",
        condition: `抛物线两动点分别设为 A(y₁²/(2p), y₁) 与 B(y₂²/(2p), y₂)。`,
        question:
          "如何由平方差公式直接写出割线方程 (y₁+y₂)y = 2px + y₁y₂，免去二次方程联立与韦达定理？",
      };
    }

    // lineYForm
    if (activePreset === "vertical_secant") {
      return {
        variant: "warning" as const,
        badge: "答题安全 · 铅垂割线自洽免分类讨论",
        condition: "割线方程设为 x = my + n，当前 m = 0，割线垂直于 x 轴。",
        question:
          "相比传统斜截式 y = kx + b 需讨论斜率不存在，设 x = my + n 如何实现全向割线无奇点通法解算？",
      };
    }

    return {
      variant: "info" as const,
      badge: "新高考标答 · 割线 x = my + n 韦达消元降维",
      condition: `割线 x = ${formatMathNumber(params.m ?? 0.8)}y ${formatSignedTerm(params.n ?? 1, "")} 与椭圆联立消去 x，导出关于 y 的一元二次方程。`,
      question:
        "如何利用以 y 为主元的韦达定理与横截距 n，极简推导原点三角形 △OAB 的面积计算公式？",
    };
  }, [studyMode, activePreset, params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 研究模式选择 */}
          <LeftPanelSection title="研究模式">
            <TabSwitcher
              tabs={[
                { key: "ellipseTrig", label: "椭圆三角代换" },
                { key: "parabolaYParam", label: "抛物线纵坐标" },
                { key: "lineYForm", label: "割线 x=my+n" },
              ]}
              value={studyMode}
              onChange={(v) => handleModeChange(v as typeof studyMode)}
            />
          </LeftPanelSection>

          {/* 典型预设 (2x2 对称网格) */}
          <LeftPanelSection title="典型预设">
            <SelectGrid
              items={currentPresets}
              value={activePreset}
              onChange={handlePresetSelect}
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
          {/* 方程公式 KaTeX 悬浮展示 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ConicParamScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
            />
          </AnimationSvgCanvas>

          {/* 右下角语义图例 */}
          <SceneLegend items={legendItems} />
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          reasoningSteps={mathData.reasoningSteps}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title={
            studyMode === "ellipseTrig"
              ? "椭圆动点三角设点与极值化简看板"
              : studyMode === "parabolaYParam"
                ? "抛物线纵坐标单参数设点免联立看板"
                : "割线方程 x=my+n 对称韦达降维看板"
          }
        />
      }
    />
  );
}
