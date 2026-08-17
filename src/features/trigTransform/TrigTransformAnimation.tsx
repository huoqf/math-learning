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
import { CANVAS_PRESETS } from "@/theme";
import { TrigTransformScene } from "./components/TrigTransformScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/trigTransform";
import {
  getTransformPathSteps,
  formatPiValue,
  calculateIntervalZeros,
  GAOKAO_PRESETS,
} from "./math/trigTransform";

export function TrigTransformAnimation() {
  // 研究模式：'properties' (图像性质) | 'fivePoints' (五点作图) | 'transformPath' (变换路径) | 'omegaZeros' (ω范围与零点分布)
  const [studyMode, setStudyMode] = useState<
    "properties" | "fivePoints" | "transformPath" | "omegaZeros"
  >("properties");

  // 当前激活的高考预设 ID（"" 表示用户自定义参数）
  const [activePresetId, setActivePresetId] = useState<string>("");

  // 高考变换路径类型：'shift-first' (先平移后伸缩) | 'stretch-first' (先伸缩后平移)
  const [pathType, setPathType] = useState<"shift-first" | "stretch-first">(
    "shift-first",
  );

  // 变换步骤索引 (0 ~ 4)
  const [stepIndex, setStepIndex] = useState<number>(0);

  // 是否显示对称轴/中心
  const [showSymmetry, setShowSymmetry] = useState<boolean>(true);

  // 1. 本地状态保存 A, omega, phi, k, x1, x2 参数
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

  // 5. 实时计算区间零点信息（用于中屏右上角徽章）
  const intervalInfo = useMemo(() => {
    const A = params.A ?? 1.5;
    const omega = params.omega ?? 2;
    const phi = params.phi ?? Math.PI / 3;
    const k = params.k ?? 0;
    const x1 = params.x1 ?? 0;
    const x2 = params.x2 ?? Math.PI;
    return calculateIntervalZeros(A, omega, phi, k, x1, x2);
  }, [params]);

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setActivePresetId(""); // 用户手动调参后清空预设高亮
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 载入高考真题预设
  const handleLoadPreset = (presetId: string) => {
    const preset = GAOKAO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setStudyMode(preset.mode);
    setParams((prev) => ({
      ...prev,
      ...preset.params,
    }));
    if (preset.pathType) setPathType(preset.pathType);
    if (preset.stepIndex !== undefined) setStepIndex(preset.stepIndex);
  };

  // 重置参数
  const handleReset = () => {
    setActivePresetId("");
    setParams({ ...defaultParams });
    setStepIndex(0);
  };

  // 声明式控制面板参数配置 (按模式过滤，遵循铁律 3)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      properties: ["A", "omega", "phi", "k"],
      fivePoints: ["A", "omega", "phi", "k"],
      transformPath: ["A", "omega", "phi", "k"],
      omegaZeros: ["omega", "phi", "x1", "x2", "A", "k"],
    };

    const activeKeys = keysByMode[studyMode] ?? Object.keys(paramMeta);

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
    const kPart =
      Math.abs(k) > 1e-5 ? ` \\color{#8B5CF6}{${signK}${k.toFixed(1)}}` : "";

    if (studyMode === "omegaZeros") {
      const x1Val = (params.x1 ?? 0).toFixed(2);
      const x2Val = (params.x2 ?? Math.PI).toFixed(2);
      return `f(x) = ${aPart} \\sin(${wPart} x ${phiPart})${kPart}, \\quad x \\in [${x1Val}, ${x2Val}]`;
    }

    return `f(x) = ${aPart} \\sin(${wPart} x ${phiPart})${kPart}`;
  }, [params, studyMode]);

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
    if (studyMode === "fivePoints") return "五点作图法与求式看板";
    if (studyMode === "transformPath") return "高考变换路径对比看板";
    return "ω范围与区间零点分布看板";
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 研究模式选择 Section (铁律 3: 模式选择置顶) */}
          <LeftPanelSection title="研究模式" subtitle="选择三角函数探讨维度">
            <TabSwitcher
              tabs={[
                { key: "properties", label: "图像性质" },
                { key: "fivePoints", label: "五点作图" },
                { key: "transformPath", label: "变换路径" },
                { key: "omegaZeros", label: "ω零点分布" },
              ]}
              value={studyMode}
              onChange={(k) => {
                setStudyMode(k as typeof studyMode);
                setActivePresetId("");
              }}
            />
          </LeftPanelSection>

          {/* 2. 高考真题预设案例 (情境快捷载入) */}
          <LeftPanelSection
            title="高考题型预设"
            subtitle="一键载入新高考典型题型情境"
          >
            <SelectGrid
              items={GAOKAO_PRESETS.map((p) => ({
                key: p.id,
                label: p.name,
                fullWidth: true,
                description: p.description,
              }))}
              value={activePresetId}
              onChange={handleLoadPreset}
              variant="filled"
              color="primary"
            />
          </LeftPanelSection>

          {/* 3. 图像性质模式特有配置 */}
          {studyMode === "properties" && (
            <LeftPanelSection
              title="对称性特征"
              subtitle="显示对称轴群与对称中心"
            >
              <TabSwitcher
                tabs={[
                  { key: "show", label: "显示对称元素" },
                  { key: "hide", label: "隐藏对称元素" },
                ]}
                value={showSymmetry ? "show" : "hide"}
                onChange={(k) => setShowSymmetry(k === "show")}
              />
            </LeftPanelSection>
          )}

          {/* 4. 高考变换路径特有配置 */}
          {studyMode === "transformPath" && (
            <>
              <LeftPanelSection
                title="变换路线"
                subtitle="对比平移量 |φ| 与 |φ|/ω 的差异"
              >
                <SelectGrid
                  items={[
                    {
                      key: "shift-first",
                      label: "路线一: 先平移后伸缩",
                      formula:
                        "\\sin x \\to \\sin(x+\\varphi) \\to \\sin(\\omega x+\\varphi)",
                      description: "平移 |φ| 单位，再横向伸缩 1/ω",
                      fullWidth: true,
                    },
                    {
                      key: "stretch-first",
                      label: "路线二: 先伸缩后平移 (高考陷阱)",
                      formula:
                        "\\sin x \\to \\sin(\\omega x) \\to \\sin\\left[\\omega\\left(x+\\frac{\\varphi}{\\omega}\\right)\\right]",
                      description: "先横向伸缩 1/ω，再平移 |φ|/ω",
                      fullWidth: true,
                    },
                  ]}
                  value={pathType}
                  onChange={(k) => {
                    setPathType(k as typeof pathType);
                    setStepIndex(0);
                  }}
                  variant="outline"
                  color="primary"
                />
              </LeftPanelSection>

              <LeftPanelSection
                title="变换步骤演示"
                subtitle="点击按步骤观察曲线与位移向量"
              >
                <TabSwitcher
                  tabs={[
                    { key: "0", label: "步0 (基准)" },
                    { key: "1", label: "步1" },
                    { key: "2", label: "步2" },
                    { key: "3", label: "步3" },
                    { key: "4", label: "步4 (目标)" },
                  ]}
                  value={String(stepIndex)}
                  onChange={(k) => setStepIndex(Number(k))}
                />
              </LeftPanelSection>
            </>
          )}

          {/* 5. 参数调节 Section (铁律 3: 声明式 ParamControl) */}
          <LeftPanelSection
            title="参数调节"
            subtitle={
              studyMode === "fivePoints"
                ? "拖动滑块或画布特征点改变参数"
                : "拖动滑块改变三角函数特征量"
            }
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
          {/* 左上角：公式 KaTeX 悬浮展示 */}
          <div className="absolute top-3.5 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-1.5 shadow-sm">
            <KatexFormula formula={equationLatex} mode="inline" />
          </div>

          {/* 右上角：按模式动态呈现状态与引导徽章 */}
          <div className="absolute top-3.5 right-4 z-10">
            {studyMode === "transformPath" && (
              <div className="bg-amber-50/95 border border-amber-200 rounded-lg px-3 py-1.5 shadow-sm text-xs text-amber-900 flex items-center gap-2">
                <span className="font-bold text-amber-950">
                  {currentStep.title}
                </span>
                <span className="text-neutral-300">|</span>
                <span className="font-medium text-amber-800">
                  {currentStep.explanation}
                </span>
              </div>
            )}

            {studyMode === "omegaZeros" && (
              <div className="bg-white/95 border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm text-xs flex items-center gap-3">
                <span className="font-semibold text-neutral-800">
                  零点:{" "}
                  <span className="font-bold text-primary-600 font-mono">
                    {intervalInfo.zeroCount}
                  </span>{" "}
                  个
                </span>
                <span className="text-neutral-300">|</span>
                <span className="font-semibold text-neutral-800">
                  极值:{" "}
                  <span className="font-bold text-amber-600 font-mono">
                    {intervalInfo.extremumCount}
                  </span>{" "}
                  个
                </span>
                <span className="text-neutral-300">|</span>
                <span
                  className={`font-semibold ${intervalInfo.isMonotone ? "text-emerald-600" : "text-neutral-500"}`}
                >
                  {intervalInfo.isMonotone
                    ? intervalInfo.monotoneType === "increasing"
                      ? "严格递增"
                      : "严格递减"
                    : "非严格单调"}
                </span>
              </div>
            )}

            {studyMode === "fivePoints" && (
              <div className="bg-blue-50/95 border border-blue-200 rounded-lg px-3 py-1.5 shadow-sm text-xs text-blue-900">
                <span className="font-bold">交互提示</span>
                ：直接拖拽画布中波峰或零点可反向联动滑块
              </div>
            )}
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <TrigTransformScene
              params={
                params as {
                  A: number;
                  omega: number;
                  phi: number;
                  k: number;
                  x1?: number;
                  x2?: number;
                }
              }
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
              pathType={pathType}
              stepIndex={stepIndex}
              showSymmetry={showSymmetry}
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
