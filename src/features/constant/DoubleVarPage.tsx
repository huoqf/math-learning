import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/constant";
import { DoubleVarScene } from "./components/DoubleVarScene";

export function DoubleVarPage() {
  const [selectedLogic, setSelectedLogic] = useState<
    "all_all" | "all_exist" | "exist_all" | "exist_exist" | "same_var"
  >("all_all");
  const [presetKey, setPresetKey] = useState<string>("free");

  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-0.5, 4],
    yRange: [-3, 7],
  });

  const mathData = useMemo(() => {
    return buildMathQuantities("anim-constant-double", params, {
      selectedLogic,
    });
  }, [params, selectedLogic]);

  const handleParamChange = useCallback((key: string, value: number) => {
    setPresetKey("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    if (key === "free") return;

    if (key === "critical_touch") {
      // 临界相切：f_min = g_max = 2.00
      setParams((prev) => ({
        ...prev,
        xf: 1.25,
        yf: 2.0,
        xg: 2.25,
        yg: 2.0,
      }));
    } else if (key === "safe_isolate") {
      // 极值完全隔离：f_min = 3.00 > g_max = 1.00
      setParams((prev) => ({
        ...prev,
        xf: 1.25,
        yf: 3.0,
        xg: 2.25,
        yg: 1.0,
      }));
    } else if (key === "partial_overlap") {
      // 值域交叉重叠：g_min <= f_min < g_max
      setParams((prev) => ({
        ...prev,
        xf: 1.25,
        yf: 1.4,
        xg: 2.25,
        yg: 2.2,
      }));
    }
  };

  const handleReset = () => {
    setPresetKey("free");
    setParams({ ...defaultParams });
  };

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keys = ["yf", "xf", "yg", "xg"];
    return keys.map((key) => {
      const meta = paramMeta[key];
      const group =
        key === "xf" || key === "yf"
          ? "抛物线 f(x) (开口向上)"
          : "抛物线 g(x) (开口向下)";

      return {
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
      };
    });
  }, [params]);

  const formulasLatex = useMemo(() => {
    const fStr = `f(x) = (x - ${params.xf.toFixed(2)})^2 + \\color{${MATH_COLORS.paramPrimary}}{${params.yf.toFixed(2)}} \\quad (x \\in I_1 = [0.5, 2.0])`;
    const gStr = `g(x) = -(x - ${params.xg.toFixed(2)})^2 + \\color{${MATH_COLORS.paramSecondary}}{${params.yg.toFixed(2)}} \\quad (x \\in I_2 = [1.5, 3.0])`;

    let goalStr = "";
    switch (selectedLogic) {
      case "all_all":
        goalStr = `\\text{博弈目标：} \\forall x_1 \\in I_1, \\; \\forall x_2 \\in I_2, \\; f(x_1) \\ge g(x_2)`;
        break;
      case "all_exist":
        goalStr = `\\text{博弈目标：} \\forall x_1 \\in I_1, \\; \\exists x_2 \\in I_2, \\; f(x_1) \\ge g(x_2)`;
        break;
      case "exist_all":
        goalStr = `\\text{博弈目标：} \\exists x_1 \\in I_1, \\; \\forall x_2 \\in I_2, \\; f(x_1) \\ge g(x_2)`;
        break;
      case "exist_exist":
        goalStr = `\\text{博弈目标：} \\exists x_1 \\in I_1, \\; \\exists x_2 \\in I_2, \\; f(x_1) \\ge g(x_2)`;
        break;
      case "same_var":
        goalStr = `\\text{博弈目标：对 } \\forall x \\in I_1 \\cap I_2 = [1.50, 2.00], \\; f(x) \\ge g(x)`;
        break;
    }
    return { line1: `${fStr}, \\; ${gStr}`, line2: goalStr };
  }, [selectedLogic, params]);

  // 教学导引与启发思考（精简重复，突出本质与设问）
  const tipConfig = useMemo(() => {
    switch (selectedLogic) {
      case "all_all":
        return {
          variant: "primary" as const,
          badge: "∀x₁, ∀x₂ · 任意对任意 (极值隔离)",
          essence:
            "两动点独立滑动，f 必须在整个区间全面高于 g，最弱项守住底线：f_min ≥ g_max。",
          question:
            "拖动 f(x) 顶点上下移动，观察刚好相切 (f_min = g_max) 时的临界状态。",
        };
      case "all_exist":
        return {
          variant: "info" as const,
          badge: "∀x₁, ∃x₂ · 任意对存在 (极小保底)",
          essence:
            "对每一个 f(x₁)，只需在 g 域内能找到不大于它的点即可，充要条件化为：f_min ≥ g_min。",
          question:
            "尝试制造 f_min < g_max 但 f_min ≥ g_min 的交叉状态，思考为什么此时博弈依然成立？",
        };
      case "exist_all":
        return {
          variant: "warning" as const,
          badge: "∃x₁, ∀x₂ · 存在对任意 (顶峰压制)",
          essence:
            "只需 f 的最高点能压住 g 的整个图象，最强项单点击破：f_max ≥ g_max。",
          question:
            "观察 f 的峰顶何时突破 g 的极值点，理解“存在”关注最强优势点的数学内涵。",
        };
      case "exist_exist":
        return {
          variant: "warning" as const,
          badge: "∃x₁, ∃x₂ · 存在对存在 (门槛超越)",
          essence:
            "只需两函数值域有重叠或局部超越，充要条件化为最低门槛：f_max ≥ g_min。",
          question:
            "只要 f 的最高点没有跌破 g 的最低点，即存在满足条件的点对 (x₁, x₂)。",
        };
      case "same_var":
        return {
          variant: "primary" as const,
          badge: "∀x ∈ I₁ ∩ I₂ · 同自变量对垒 (差函数法)",
          essence:
            "自变量为同一动点，无需极值完全隔离，构造差函数 h(x) = f(x) - g(x) ≥ 0 即可。",
          question:
            "两曲线可以有高低交叉吗？观察交集 [1.5, 2.0] 内违背区间的动态变化。",
        };
      default:
        return {
          variant: "primary" as const,
          badge: "双变量博弈问题",
          essence: "考察全称与存在量词组合下两函数最值的博弈关系。",
          question: "通过拖拽与预设探索满足不等式的充要条件。",
        };
    }
  }, [selectedLogic]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 双变量博弈量词模式 */}
          <LeftPanelSection
            title="博弈量词关系"
            subtitle="选择全称/存在量词或同变量差函数"
          >
            <SelectGrid
              items={[
                {
                  key: "all_all",
                  label: "∀x₁, ∀x₂",
                  description: "任意对任意(极值隔离)",
                },
                {
                  key: "all_exist",
                  label: "∀x₁, ∃x₂",
                  description: "任意对存在(极小保底)",
                },
                {
                  key: "exist_all",
                  label: "∃x₁, ∀x₂",
                  description: "存在对任意(顶峰压制)",
                },
                {
                  key: "exist_exist",
                  label: "∃x₁, ∃x₂",
                  description: "存在对存在(门槛超越)",
                },
                {
                  key: "same_var",
                  label: "∀x ∈ I₁ ∩ I₂ (同变量)",
                  description: "同变量对垒 (差函数法 h(x) ≥ 0)",
                  fullWidth: true,
                },
              ]}
              value={selectedLogic}
              onChange={(k) => setSelectedLogic(k)}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 黄金 2x2 典型构型预设 */}
          <LeftPanelSection
            title="典型构型预设"
            subtitle="一键直达双动点临界与博弈构型"
          >
            <SelectGrid
              items={[
                {
                  key: "free",
                  label: "自由探究",
                  description: "全参数开放",
                },
                {
                  key: "critical_touch",
                  label: "临界相切",
                  description: "f_min = g_max",
                },
                {
                  key: "safe_isolate",
                  label: "安全隔离",
                  description: "f_min > g_max",
                },
                {
                  key: "partial_overlap",
                  label: "图象交叉",
                  description: "值域部分重叠",
                },
              ]}
              value={presetKey}
              onChange={handlePresetChange}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 参数调节 (按 group 分组) */}
          <LeftPanelSection
            title="顶点参数调节"
            subtitle="拖动滑块改变两抛物线位置"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 4. 教学导引与启发思考 */}
          <LeftPanelSection title="教学导引与启发思考" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【核心本质】
                  </span>
                  <span className="text-neutral-600">{tipConfig.essence}</span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【启发探究】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white select-none">
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-250 rounded-xl px-4 py-2.5 shadow-md flex flex-col gap-1 font-mono">
            <div className="text-xs text-neutral-400 font-bold mb-0.5">
              高考数学方程
            </div>
            <div className="text-sm">
              <KatexFormula formula={formulasLatex.line1} mode="inline" />
            </div>
            {formulasLatex.line2 && (
              <div className="text-sm border-t border-neutral-100 pt-1 mt-0.5">
                <KatexFormula formula={formulasLatex.line2} mode="inline" />
              </div>
            )}
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <DoubleVarScene
              selectedLogic={selectedLogic}
              params={params}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
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
          title="双动点博弈看板"
        />
      }
    />
  );
}
