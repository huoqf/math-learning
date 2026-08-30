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
import { TrigTangentScene } from "./components/TrigTangentScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/trigTangent";

export function TrigTangentAnimation() {
  // 研究模式：'unitCircle' | 'baseFunction' | 'generalTransform' | 'gaokaoProblem'
  const [studyMode, setStudyMode] = useState<
    "unitCircle" | "baseFunction" | "generalTransform" | "gaokaoProblem"
  >("generalTransform");

  // 单调区间高亮开关
  const [showMonotoneInterval, setShowMonotoneInterval] = useState(true);

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    theta: defaultParams.theta,
    A: defaultParams.A,
    omega: defaultParams.omega,
    phi: defaultParams.phi,
    C: defaultParams.C,
    targetIntervalEnd: defaultParams.targetIntervalEnd,
  }));

  // Viewport 适配
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 坐标系比例尺 X [-6, 6], Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 右屏 MathPanel 数据来源
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-trig-tangent", params, {
      mode: studyMode,
    });
  }, [params, studyMode]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setParams({
      theta: defaultParams.theta,
      A: defaultParams.A,
      omega: defaultParams.omega,
      phi: defaultParams.phi,
      C: defaultParams.C,
      targetIntervalEnd: defaultParams.targetIntervalEnd,
    });
  };

  // 根据 activeMode 过滤左屏参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      unitCircle: ["theta"],
      baseFunction: ["theta"],
      generalTransform: ["A", "omega", "phi", "C"],
      gaokaoProblem: ["omega", "targetIntervalEnd"],
    };

    const activeKeys = keysByMode[studyMode] ?? ["A", "omega", "phi", "C"];

    return activeKeys
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
  }, [params, studyMode]);

  // 构建当前公式 LaTeX（三位一体色彩绑定）
  const formulaLatex = useMemo(() => {
    if (studyMode === "unitCircle") {
      const cosT = Math.cos(params.theta ?? Math.PI / 4);
      const tanVal = Math.abs(cosT) > 1e-4 ? Math.tan(params.theta) : Infinity;
      return `\\tan(\\color{${MATH_COLORS.paramPrimary}}{${params.theta.toFixed(2)}}) = \\color{${MATH_COLORS.paramSecondary}}{${Number.isFinite(tanVal) ? tanVal.toFixed(3) : "\\infty"}}`;
    }
    if (studyMode === "baseFunction") {
      const cosT = Math.cos(params.theta ?? Math.PI / 4);
      const tanVal = Math.abs(cosT) > 1e-4 ? Math.tan(params.theta) : Infinity;
      return `f(x) = \\tan x, \\quad \\tan(\\color{${MATH_COLORS.paramPrimary}}{${params.theta.toFixed(2)}}) = \\color{${MATH_COLORS.function}}{${Number.isFinite(tanVal) ? tanVal.toFixed(3) : "\\infty"}}`;
    }
    if (studyMode === "gaokaoProblem") {
      const { omega, targetIntervalEnd } = params;
      return `f(x) = \\tan(\\color{${MATH_COLORS.paramSecondary}}{${omega}}x), \\quad x \\in [0, \\color{${MATH_COLORS.paramPrimary}}{${targetIntervalEnd?.toFixed(2)}}]`;
    }
    const { A, omega, phi, C } = params;
    const phiStr =
      phi >= 0 ? `+ ${phi.toFixed(2)}` : `- ${Math.abs(phi).toFixed(2)}`;
    const cStr = C >= 0 ? `+ ${C}` : `- ${Math.abs(C)}`;
    return `f(x) = \\color{${MATH_COLORS.paramPrimary}}{${A}}\\tan\\left(\\color{${MATH_COLORS.paramSecondary}}{${omega}}x \\color{${MATH_COLORS.paramTertiary}}{${phiStr}}\\right) ${cStr}`;
  }, [studyMode, params]);

  const panelTitle = useMemo(() => {
    if (studyMode === "unitCircle") return "正切线与单位圆极限看板";
    if (studyMode === "baseFunction") return "y = tan x 基础性质看板";
    if (studyMode === "gaokaoProblem") return "新高考 ω 范围探究看板";
    return "y = A tan(ωx + φ) + C 看板";
  }, [studyMode]);

  const tipConfig = useMemo(() => {
    const theta = params.theta ?? Math.PI / 4;
    const omega = params.omega ?? 1;
    switch (studyMode) {
      case "unitCircle":
        return {
          variant: "primary" as const,
          badge: "几何直观 · 单位圆正切线",
          condition: `单位圆上角 θ = ${theta.toFixed(2)}，过 (1, 0) 作圆切线。`,
          question:
            "sinθ 与 cosθ 之比在几何上如何用该切线长度表示？为何 tanθ 在切线所在直线上？",
        };
      case "baseFunction":
        return {
          variant: "info" as const,
          badge: "基础性质 · y = tan x",
          condition: "定义域排除 x = π/2 + kπ，周期为 π，值域为全体实数。",
          question:
            "基本周期为何是 π 而非 2π？各个单调开区间为何被渐近线隔开？",
        };
      case "gaokaoProblem":
        return {
          variant: "accent" as const,
          badge: "新高考热点 · ω 范围探究",
          condition: `f(x) = tan(ωx)，考虑在 [0, ${params.targetIntervalEnd?.toFixed(2)}] 上不含渐近线且单调。`,
          question: "要保证区间内无渐近线，ω 的取值范围应满足怎样的不等式？",
        };
      default:
        return {
          variant: "warning" as const,
          badge: "一般型 · y = A tan(ωx + φ) + C",
          condition: `A = ${params.A ?? 1}，ω = ${omega}，φ = ${params.phi ?? 0}，C = ${params.C ?? 0}。`,
          question:
            "A、ω、φ、C 各自如何影响振幅倾向、周期平移与上下平移？渐近线如何随参数移动？",
        };
    }
  }, [studyMode, params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="研究模式" subtitle="选择正切函数探讨视角">
            <SelectGrid
              items={[
                {
                  key: "unitCircle",
                  label: "正切线生成",
                  description: "单位圆与外切线",
                },
                {
                  key: "baseFunction",
                  label: "y=tan x 性质",
                  description: "基础图象与周期",
                },
                {
                  key: "generalTransform",
                  label: "一般型变换",
                  description: "A/ω/φ/C 综合参数",
                },
                {
                  key: "gaokaoProblem",
                  label: "高考 ω 范围",
                  description: "区间单调无渐近线",
                },
              ]}
              value={studyMode}
              onChange={(k) =>
                setStudyMode(
                  k as
                    | "unitCircle"
                    | "baseFunction"
                    | "generalTransform"
                    | "gaokaoProblem",
                )
              }
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {studyMode !== "unitCircle" && (
            <LeftPanelSection
              title="单调区间高亮"
              subtitle="显示与隐藏开区间阴影"
            >
              <TabSwitcher
                tabs={[
                  { key: "show", label: "高亮单调区间" },
                  { key: "hide", label: "隐藏区间阴影" },
                ]}
                value={showMonotoneInterval ? "show" : "hide"}
                onChange={(k) => setShowMonotoneInterval(k === "show")}
              />
            </LeftPanelSection>
          )}

          {paramConfigs.length > 0 && (
            <LeftPanelSection title="参数调节" subtitle="拖动滑块改变函数参数">
              <ParamControl
                params={paramConfigs}
                onParamChange={handleParamChange}
                onReset={handleReset}
              />
            </LeftPanelSection>
          )}

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
          {/* 顶端悬浮 LaTeX 公式 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TrigTangentScene
              params={
                params as {
                  theta: number;
                  A: number;
                  omega: number;
                  phi: number;
                  C: number;
                  targetIntervalEnd: number;
                }
              }
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              mode={studyMode}
              showMonotoneInterval={showMonotoneInterval}
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
          title={panelTitle}
        />
      }
    />
  );
}
