import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { TrigTangentScene } from "./components/TrigTangentScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/trigTangent";

export function TrigTangentAnimation() {
  // 研究模式：'unitCircle' | 'baseFunction' | 'generalTransform'
  const [studyMode, setStudyMode] = useState<
    "unitCircle" | "baseFunction" | "generalTransform"
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
    });
  };

  // 根据 activeMode 过滤左屏参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      unitCircle: ["theta"],
      baseFunction: [],
      generalTransform: ["A", "omega", "phi", "C"],
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

  // 构建当前公式 LaTeX
  const formulaLatex = useMemo(() => {
    if (studyMode === "unitCircle") {
      const tanVal = Math.tan(params.theta ?? Math.PI / 4);
      return `\\tan(${params.theta.toFixed(2)}) = ${tanVal.toFixed(3)}`;
    }
    if (studyMode === "baseFunction") {
      return "f(x) = \\tan x \\quad \\left(x \\neq k\\pi + \\frac{\\pi}{2}\\right)";
    }
    const { A, omega, phi, C } = params;
    const phiStr =
      phi >= 0 ? `+ ${phi.toFixed(2)}` : `- ${Math.abs(phi).toFixed(2)}`;
    const cStr = C >= 0 ? `+ ${C}` : `- ${Math.abs(C)}`;
    return `f(x) = \\color{#EF4444}{${A}}\\tan\\left(\\color{#D97706}{${omega}}x \\color{#059669}{${phiStr}}\\right) ${cStr}`;
  }, [studyMode, params]);

  const panelTitle = useMemo(() => {
    if (studyMode === "unitCircle") return "正切线与单位圆逼近";
    if (studyMode === "baseFunction") return "y = tan x 基础性质";
    return "y = A tan(ωx + φ) + C 看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="研究模式" subtitle="选择正切函数探讨视角">
            <SelectGrid
              items={[
                { key: "unitCircle", label: "正切线生成" },
                { key: "baseFunction", label: "y=tan x 性质" },
                {
                  key: "generalTransform",
                  label: "一般型变换",
                  fullWidth: true,
                },
              ]}
              value={studyMode}
              onChange={(k) =>
                setStudyMode(
                  k as "unitCircle" | "baseFunction" | "generalTransform",
                )
              }
              variant="filled"
            />
          </LeftPanelSection>

          {studyMode !== "unitCircle" && (
            <LeftPanelSection title="图层显示" subtitle="显示与隐藏辅助图像">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-neutral-600">
                  高亮单调递增开区间
                </span>
                <input
                  type="checkbox"
                  checked={showMonotoneInterval}
                  onChange={(e) => setShowMonotoneInterval(e.target.checked)}
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
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
