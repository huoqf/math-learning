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
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { QuantifiersScene } from "./components/QuantifiersScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/quantifiers";

export function SetQuantifiersPage() {
  const [activeTab, setActiveTab] = useState<
    "universal" | "existential" | "dual"
  >("universal");
  const [dualScenario, setDualScenario] = useState<
    "all_all" | "all_exist" | "exist_exist"
  >("all_all");
  const [params, setParams] = useState(() => ({ ...defaultParams }));

  // 1. 视口与缩放
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 2. 右屏数据构建
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-logic-quantifiers", params, {
      activeTab,
      dualScenario,
    });
  }, [params, activeTab, dualScenario]);

  // 3. 中屏顶部主公式条
  const headerFormula = useMemo(() => {
    if (activeTab === "universal") {
      return `p: \\forall x \\in [a, b],\\, f(x) \\ge \\color{${MATH_COLORS.paramPrimary}}{m} \\quad \\Longleftrightarrow \\quad \\neg p: \\exists x \\in [a, b],\\, f(x) < \\color{${MATH_COLORS.paramPrimary}}{m}`;
    }
    if (activeTab === "existential") {
      return `q: \\exists x \\in [a, b],\\, f(x) \\le \\color{${MATH_COLORS.paramPrimary}}{m} \\quad \\Longleftrightarrow \\quad \\neg q: \\forall x \\in [a, b],\\, f(x) > \\color{${MATH_COLORS.paramPrimary}}{m}`;
    }
    if (dualScenario === "all_all") {
      return `\\forall x_1 \\in I_1,\\, \\forall x_2 \\in I_2,\\, f(x_1) > g(x_2) \\iff f(x)_{\\min} > g(x)_{\\max}`;
    }
    if (dualScenario === "all_exist") {
      return `\\forall x_1 \\in I_1,\\, \\exists x_2 \\in I_2,\\, f(x_1) = g(x_2) \\iff \\text{Range}(f) \\subseteq \\text{Range}(g)`;
    }
    return `\\exists x_1 \\in I_1,\\, \\exists x_2 \\in I_2,\\, f(x_1) = g(x_2) \\iff \\text{Range}(f) \\cap \\text{Range}(g) \\neq \\emptyset`;
  }, [activeTab, dualScenario]);

  // 4. 参数配置列表过滤与动态呈现
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let keys: string[] = [];
    if (activeTab !== "dual") {
      keys = ["threshold", "intMin", "intMax", "probeX", "k", "h", "v"];
    } else {
      keys = [
        "intMin",
        "intMax",
        "k",
        "h",
        "v",
        "int2Min",
        "int2Max",
        "k2",
        "h2",
        "v2",
      ];
    }

    return keys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
          group: meta.group,
        };
      });
  }, [params, activeTab]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* ① 探究模式维度 */}
          <LeftPanelSection title="命题类型">
            <TabSwitcher
              tabs={[
                { key: "universal", label: "全称命题 ∀" },
                { key: "existential", label: "存在命题 ∃" },
                { key: "dual", label: "双变量博弈" },
              ]}
              value={activeTab}
              onChange={(key) => {
                setActiveTab(key as typeof activeTab);
              }}
            />
          </LeftPanelSection>

          {/* ② 典型双变量博弈情境（仅在 dual 模式下展示） */}
          {activeTab === "dual" && (
            <LeftPanelSection title="高考双变量模型">
              <SelectGrid
                columns={1}
                items={[
                  {
                    key: "all_all",
                    label: "∀x₁ ∀x₂ 恒大压制",
                    formula: "f_{\\min} > g_{\\max}",
                  },
                  {
                    key: "all_exist",
                    label: "∀x₁ ∃x₂ 值域包含",
                    formula: "\\text{Range}(f) \\subseteq \\text{Range}(g)",
                  },
                  {
                    key: "exist_exist",
                    label: "∃x₁ ∃x₂ 交集非空",
                    formula:
                      "\\text{Range}(f) \\cap \\text{Range}(g) \\neq \\emptyset",
                  },
                ]}
                value={dualScenario}
                onChange={(key) => setDualScenario(key as typeof dualScenario)}
              />
            </LeftPanelSection>
          )}

          {/* ③ 核心参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => setParams({ ...defaultParams })}
            />
          </LeftPanelSection>

          {/* ④ 教学导引与反例洞察 */}
          <LeftPanelSection title="教学导引" compact>
            <TipCard variant={activeTab === "universal" ? "info" : "primary"}>
              {activeTab === "universal" ? (
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-neutral-700">
                    全称命题证伪原则：
                  </div>
                  <div className="leading-relaxed">
                    全称命题{" "}
                    <KatexFormula formula="p: \forall x, P(x)" mode="inline" />{" "}
                    只要找到一个反例点{" "}
                    <KatexFormula formula="x_0" mode="inline" /> 使得{" "}
                    <KatexFormula formula="P(x_0)" mode="inline" />{" "}
                    为假，原命题即被证伪。
                  </div>
                </div>
              ) : activeTab === "existential" ? (
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-neutral-700">
                    存在命题证实原则：
                  </div>
                  <div className="leading-relaxed">
                    存在命题{" "}
                    <KatexFormula formula="q: \exists x, Q(x)" mode="inline" />{" "}
                    只要能找到一个特例点满足条件，命题即为真；若全域均不满足，则其否定{" "}
                    <KatexFormula formula="\neg q" mode="inline" /> 为真。
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-neutral-700">
                    双变量量词博弈：
                  </div>
                  <div className="leading-relaxed">
                    高考压轴题中常考“任意对任意”、“任意对存在”与“存在对存在”，核心本质是转化为值域的包含、最值压制与交集判定。
                  </div>
                </div>
              )}
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 顶部主公式条 */}
          <div className="h-[48px] border-b border-neutral-200 bg-white/90 backdrop-blur flex items-center px-4 shrink-0 shadow-sm z-10">
            <KatexFormula formula={headerFormula} mode="inline" />
          </div>

          {/* SVG 动画画布 */}
          <div className="flex-1 relative">
            <AnimationSvgCanvas
              containerRef={containerRef}
              transform={vp.transform}
            >
              <QuantifiersScene
                params={params}
                scale={scale}
                vp={vp}
                activeTab={activeTab}
                dualScenario={dualScenario}
                onParamChange={handleParamChange}
                fontScale={canvasSize.font}
              />
            </AnimationSvgCanvas>
          </div>
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="量词与逻辑看板"
        />
      }
    />
  );
}
