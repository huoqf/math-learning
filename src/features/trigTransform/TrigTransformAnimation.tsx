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
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { TrigTransformScene } from "./components/TrigTransformScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/trigTransform";
import { getTransformPathSteps, formatPiValue } from "./math/trigTransform";

export function TrigTransformAnimation() {
  // 研究模式：'properties' (图像性质) | 'fivePoints' (五点作图) | 'transformPath' (变换路径)
  const [studyMode, setStudyMode] = useState<
    "properties" | "fivePoints" | "transformPath"
  >("properties");

  // 高考变换路径类型：'shift-first' (先平移后伸缩) | 'stretch-first' (先伸缩后平移)
  const [pathType, setPathType] = useState<"shift-first" | "stretch-first">(
    "shift-first",
  );

  // 变换步骤索引 (0 ~ 4)
  const [stepIndex, setStepIndex] = useState<number>(0);

  // 1. 本地状态保存 A, omega, phi, k 参数
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 2. 视口尺寸测量与防抖
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 3. 构建直角坐标系比例尺：数学范围 X [-8, 8]，Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-8, 8],
    yRange: [-4.5, 4.5],
  });

  // 4. 数学看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-trig-transform", params, {
      studyMode,
      pathType,
      stepIndex,
    });
  }, [params, studyMode, pathType, stepIndex]);

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 重置参数
  const handleReset = () => {
    setParams({ ...defaultParams });
    setStepIndex(0);
  };

  // 声明式控制面板参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return Object.entries(paramMeta).map(([key, meta]) => ({
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
    }));
  }, [params]);

  // 构建带色彩绑定的实时公式 (铁律 4C)
  const equationLatex = useMemo(() => {
    const A = params.A ?? 1;
    const omega = params.omega ?? 1;
    const phi = params.phi ?? 0;
    const k = params.k ?? 0;

    const phiStr = formatPiValue(phi);
    const signPhi = phi >= 0 ? "+" : "";
    const signK = k >= 0 ? "+" : "";

    const aPart = `\\color{#EF4444}{${A.toFixed(1)}}`;
    const wPart = `\\color{#D97706}{${omega.toFixed(1)}}`;
    const phiPart = `\\color{#059669}{${signPhi}${phiStr}}`;
    const kPart = Math.abs(k) > 1e-5 ? ` ${signK}${k.toFixed(1)}` : "";

    return `f(x) = ${aPart} \\sin(${wPart} x ${phiPart})${kPart}`;
  }, [params]);

  // 获取路径步骤标题与说明
  const transformPathSteps = useMemo(
    () =>
      getTransformPathSteps(
        params.A,
        params.omega,
        params.phi,
        params.k,
        pathType,
      ),
    [params, pathType],
  );
  const currentStep = transformPathSteps[stepIndex] ?? transformPathSteps[0];

  // 看板标题
  const panelTitle = useMemo(() => {
    if (studyMode === "properties") return "三角函数性质看板";
    if (studyMode === "fivePoints") return "五点作图法指标看板";
    return "高考变换路径对比看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 研究模式选择 Section */}
          <LeftPanelSection title="研究模式" subtitle="选择三角函数探讨维度">
            <TabSwitcher
              tabs={[
                { key: "properties", label: "图像性质" },
                { key: "fivePoints", label: "五点作图" },
                { key: "transformPath", label: "变换路径" },
              ]}
              value={studyMode}
              onChange={(k) => setStudyMode(k as any)}
            />
          </LeftPanelSection>

          {/* 高考变换路径特有 Section */}
          {studyMode === "transformPath" && (
            <>
              <LeftPanelSection
                title="变换路线"
                subtitle="先平移后伸缩 vs 先伸缩后平移(高考重点)"
              >
                <SelectGrid
                  items={[
                    { key: "shift-first", label: "路线一: 先平移后伸缩" },
                    {
                      key: "stretch-first",
                      label: "路线二: 先伸缩后平移 (平移φ/ω)",
                      fullWidth: true,
                    },
                  ]}
                  value={pathType}
                  onChange={(k) => {
                    setPathType(k as any);
                    setStepIndex(0);
                  }}
                  variant="filled"
                  color="primary"
                />
              </LeftPanelSection>

              <LeftPanelSection
                title="变换步骤"
                subtitle="点击按步骤演示动画演化"
              >
                <TabSwitcher
                  tabs={[
                    { key: "0", label: "步0" },
                    { key: "1", label: "步1" },
                    { key: "2", label: "步2" },
                    { key: "3", label: "步3" },
                    { key: "4", label: "步4" },
                  ]}
                  value={String(stepIndex)}
                  onChange={(k) => setStepIndex(Number(k))}
                />
              </LeftPanelSection>
            </>
          )}

          {/* 参数调节 Section */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块改变三角函数特征量"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 公式 KaTeX 悬浮展示 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* 高考变换路径模式下的步骤指示标签 */}
          {studyMode === "transformPath" && (
            <div className="absolute top-4 right-4 z-10 bg-amber-50/90 border border-amber-200 rounded-lg px-3 py-1.5 shadow-sm text-xs text-amber-900">
              <span className="font-semibold">{currentStep.title}</span>：
              <span className="font-mono text-amber-700">
                {currentStep.explanation}
              </span>
            </div>
          )}

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TrigTransformScene
              params={params as any}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              pathType={pathType}
              stepIndex={stepIndex}
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
