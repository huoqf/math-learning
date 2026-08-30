import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { SequenceScene } from "./components/SequenceScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/sequence";
import { calcGeometricSequence } from "@/math/sequence";

export function GeometricPage() {
  const [geometricSubMode, setGeometricSubMode] = useState<
    "exponential" | "staggerSum" | "segment" | "productMax" | "tessellation"
  >("exponential");
  const [highlightN, setHighlightN] = useState<number>(1);
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
    a1: 3,
    q: 0.5,
    N: 8,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 动态视口范围：根据当前模式与实际数据自适应包络，限制在合理教学尺度内，杜绝指数爆炸导致的网格墨染与轴变形
  const yRange = useMemo<[number, number]>(() => {
    const a1 = params.a1 ?? 3;
    const q = params.q ?? 0.5;
    const N = Math.max(3, Math.min(15, Math.round(params.N ?? 8)));
    const kSegment = params.kSegment ?? 3;

    if (
      geometricSubMode === "staggerSum" ||
      geometricSubMode === "tessellation"
    ) {
      return [-2, 10];
    }

    const geo = calcGeometricSequence(a1, q, N, kSegment);
    const yValues: number[] = [0];

    if (geometricSubMode === "exponential") {
      // 观察通项在指数曲线上的演化，对爆炸项做视口上限截断保护
      geo.terms.forEach((t) => {
        if (Math.abs(t.an) <= 32) {
          yValues.push(t.an);
        } else {
          yValues.push(Math.sign(t.an) * 32);
        }
        if (Math.abs(t.Sn) <= 36) {
          yValues.push(t.Sn);
        }
      });
      if (geo.limitSum !== null && Math.abs(geo.limitSum) <= 40) {
        yValues.push(geo.limitSum);
      }
    } else if (geometricSubMode === "segment") {
      geo.terms.forEach((t) => {
        if (Math.abs(t.an) <= 32) yValues.push(t.an);
      });
      if (geo.segmentedSums) {
        geo.segmentedSums.segments.forEach((s) => {
          if (Math.abs(s.sumValue) <= 40) yValues.push(s.sumValue);
        });
      }
    } else if (geometricSubMode === "productMax") {
      yValues.push(1); // 临界基准线 y=1
      geo.terms.forEach((t) => {
        if (Math.abs(t.an) <= 30) yValues.push(t.an);
        if (Number.isFinite(t.Pn) && Math.abs(t.Pn) <= 36) {
          yValues.push(t.Pn);
        }
      });
    }

    let minY = Math.min(...yValues);
    let maxY = Math.max(...yValues);

    if (maxY - minY < 5) {
      minY = Math.min(minY, -1.5);
      maxY = Math.max(maxY, 4.5);
    }

    minY = Math.max(-25, minY);
    maxY = Math.min(42, maxY);

    const padding = (maxY - minY) * 0.15;
    return [minY - padding, maxY + padding];
  }, [params, geometricSubMode]);

  const xRange = useMemo<[number, number]>(() => {
    const N = Math.max(3, Math.min(15, Math.round(params.N ?? 8)));
    if (geometricSubMode === "productMax") {
      return [-0.8, N + 1.2];
    }
    return [-1, N + 1.6];
  }, [params.N, geometricSubMode]);

  const scale = useSceneScale({
    vp,
    xRange,
    yRange,
  });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-sequence", params, {
        activeMode: "geometric",
        geometricSubMode,
      }),
    [params, geometricSubMode],
  );

  // 严格按子模式过滤参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      exponential: ["a1", "q", "N"],
      staggerSum: ["a1", "q", "N"],
      segment: ["a1", "q", "N", "kSegment"],
      productMax: ["a1", "q", "N"],
      tessellation: ["a1", "q", "N"],
    };

    const keys = keysByMode[geometricSubMode] ?? ["a1", "q", "N"];
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
        };
      });
  }, [params, geometricSubMode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const tipConfig = useMemo(() => {
    const a1 = params.a1 ?? 3;
    const q = params.q ?? 0.5;
    const N = Math.max(3, Math.min(15, Math.round(params.N ?? 8)));
    const kSegment = params.kSegment ?? 3;
    const common = `a₁ = ${a1}，公比 q = ${q}，前 ${N} 项。`;
    switch (geometricSubMode) {
      case "staggerSum":
        return {
          variant: "primary" as const,
          badge: "高考经典 · 错位相减推导",
          condition: common + " 先写 Sₙ，再同乘公比 q 后按位错开作差。",
          question: "错位相减为何能消去中间全部 q 的连续次幂项？",
        };
      case "segment":
        return {
          variant: "accent" as const,
          badge: "片段性质 · 等长片段和仍等比",
          condition:
            common + ` 取等长片段 ${kSegment} 项划分：Sₖ, S₂ₖ−Sₖ, S₃ₖ−S₂ₖ…。`,
          question: "等长片段和之间满足怎样的等比关系？公比是多少？",
        };
      case "productMax":
        return {
          variant: "warning" as const,
          badge: "最值探究 · 乘积最大项",
          condition: common + " 考察前 n 项之积 Pₙ 的最值。",
          question: "何时 Pₙ 取得最值？与公比绝对值 |q| 的关系如何判定？",
        };
      case "tessellation":
        return {
          variant: "success" as const,
          badge: "几何直观 · 无限剖分面积",
          condition: `边长 a₁ = ${a1}，公比 q = ${q}，观察无限剖分面积之和收敛趋势。`,
          question: "面积无限累加为何又能有界收敛？（|q| < 1 无穷级数）",
        };
      default:
        return {
          variant: "info" as const,
          badge: "通项与指数 · 指数增长模型",
          condition: common + " aₙ = a₁·qⁿ⁻¹。",
          question:
            "当 q > 1 时项如何爆炸增长？q 在 (0,1) 时无穷项之和如何逼近极限？",
        };
    }
  }, [geometricSubMode, params.a1, params.q, params.N, params.kSegment]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="教学专题"
            subtitle="等比数列 5 大新高考核心专题"
          >
            <SelectGrid
              columns={2}
              items={[
                {
                  key: "exponential",
                  label: "通项与指数模型",
                  formula: "a_n = a_1 q^{n-1}",
                },
                {
                  key: "staggerSum",
                  label: "错位相减推导",
                  formula: "S_n - qS_n",
                },
                {
                  key: "segment",
                  label: "等长片段性质",
                  formula: "S_k, S_{2k}-S_k",
                },
                {
                  key: "productMax",
                  label: "前 n 项积极值",
                  formula: "P_n = a_1^n q^{\\dots}",
                },
                {
                  key: "tessellation",
                  label: "自相似无穷求和",
                  formula: "S_\\infty = \\frac{a_1}{1-q}",
                  fullWidth: true,
                },
              ]}
              value={geometricSubMode}
              onChange={(val) =>
                setGeometricSubMode(val as typeof geometricSubMode)
              }
            />
          </LeftPanelSection>

          {/* 专题 A 专属：公比形态典型预设 (2 列对称：左正右负，彻底根除折行与截断) */}
          {geometricSubMode === "exponential" && (
            <LeftPanelSection
              title="公比形态典型预设"
              subtitle="一键切换 6 大典型单调/震荡形态"
            >
              <SelectGrid
                columns={2}
                items={[
                  { key: "growth", formula: "q = 2", description: "激增增长" },
                  {
                    key: "osc-div",
                    formula: "q = -1.5",
                    description: "发散震荡",
                  },
                  { key: "decay", formula: "q = 0.5", description: "衰减收敛" },
                  {
                    key: "osc-dec",
                    formula: "q = -0.5",
                    description: "衰减震荡",
                  },
                  {
                    key: "const",
                    formula: `\\color{${MATH_COLORS.paramPrimary}}{q = 1}`,
                    description: "常数列退化",
                  },
                  {
                    key: "osc-per",
                    formula: `\\color{${MATH_COLORS.paramSecondary}}{q = -1}`,
                    description: "周期摆动",
                  },
                ]}
                value={
                  params.q === 2
                    ? "growth"
                    : params.q === 0.5
                      ? "decay"
                      : params.q === 1
                        ? "const"
                        : params.q === -0.5
                          ? "osc-dec"
                          : params.q === -1
                            ? "osc-per"
                            : params.q === -1.5
                              ? "osc-div"
                              : ""
                }
                onChange={(key) => {
                  const qMap: Record<string, number> = {
                    growth: 2,
                    decay: 0.5,
                    const: 1,
                    "osc-dec": -0.5,
                    "osc-per": -1,
                    "osc-div": -1.5,
                  };
                  if (key in qMap) {
                    setParams((prev) => ({ ...prev, q: qMap[key] }));
                  }
                }}
              />
            </LeftPanelSection>
          )}

          {/* 专题 D 专属：积的最值典型预设 */}
          {geometricSubMode === "productMax" && (
            <LeftPanelSection
              title="极值典型预设"
              subtitle="观察项与 1 临界比较与二次顶点"
            >
              <SelectGrid
                columns={2}
                items={[
                  {
                    key: "max-case",
                    label: "衰减极大 (a₁=4, q=0.5)",
                    formula: "P_2 = P_3 = 8.0",
                    description: "双最值",
                  },
                  {
                    key: "min-case",
                    label: "激增极小 (a₁=0.25, q=2)",
                    formula: "P_2 = 0.125",
                    description: "极小值",
                  },
                ]}
                value={
                  params.a1 === 4 && params.q === 0.5
                    ? "max-case"
                    : params.a1 === 0.25 && params.q === 2
                      ? "min-case"
                      : ""
                }
                onChange={(key) => {
                  if (key === "max-case") {
                    setParams((prev) => ({ ...prev, a1: 4, q: 0.5, N: 6 }));
                  } else if (key === "min-case") {
                    setParams((prev) => ({ ...prev, a1: 0.25, q: 2, N: 6 }));
                  }
                }}
              />
            </LeftPanelSection>
          )}

          {/* 专题 E 专属：自相似剖分典型预设 */}
          {geometricSubMode === "tessellation" && (
            <LeftPanelSection
              title="无字证明典型预设"
              subtitle="选择经典分数公比观察面积细分"
            >
              <SelectGrid
                columns={3}
                items={[
                  {
                    key: "half",
                    formula: "q = \\frac{1}{2}",
                    description: "二分",
                  },
                  {
                    key: "third",
                    formula: "q = \\frac{1}{3}",
                    description: "三分",
                  },
                  {
                    key: "quarter",
                    formula: "q = \\frac{1}{4}",
                    description: "四分",
                  },
                ]}
                value={
                  Math.abs(params.q - 0.5) < 0.01
                    ? "half"
                    : Math.abs(params.q - 1 / 3) < 0.02 ||
                        Math.abs(params.q - 0.33) < 0.02
                      ? "third"
                      : Math.abs(params.q - 0.25) < 0.01
                        ? "quarter"
                        : ""
                }
                onChange={(key) => {
                  if (key === "half") {
                    setParams((prev) => ({ ...prev, a1: 4, q: 0.5, N: 6 }));
                  } else if (key === "third") {
                    setParams((prev) => ({ ...prev, a1: 4, q: 1 / 3, N: 6 }));
                  } else if (key === "quarter") {
                    setParams((prev) => ({ ...prev, a1: 4, q: 0.25, N: 6 }));
                  }
                }}
              />
            </LeftPanelSection>
          )}

          <LeftPanelSection
            title="参数精准调节"
            subtitle="拖动滑块实时观察数形联动"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() =>
                setParams({ ...defaultParams, a1: 3, q: 0.5, N: 8 })
              }
            />
          </LeftPanelSection>

          {/* 教学提示与题设导引（置于最底部） */}
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
        <AnimationSvgCanvas
          containerRef={containerRef}
          transform={vp.transform}
        >
          <SequenceScene
            params={params}
            scale={scale}
            vp={vp}
            fontScale={canvasSize.font}
            activeMode="geometric"
            geometricSubMode={geometricSubMode}
            highlightN={highlightN}
            onSelectN={setHighlightN}
          />
        </AnimationSvgCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="等比数列实验室"
        />
      }
    />
  );
}
