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
import {
  getTransformPathSteps,
  formatPiValue,
  calculateIntervalZeros,
} from "./math/trigTransform";

export function TrigTransformAnimation() {
  // 研究模式：'properties' (图像性质) | 'fivePoints' (五点作图) | 'transformPath' (变换路径) | 'omegaZeros' (ω范围与零点分布)
  const [studyMode, setStudyMode] = useState<
    "properties" | "fivePoints" | "transformPath" | "omegaZeros"
  >("properties");

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
          group: meta.group,
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

  // 构建带色彩绑定的实时公式 (铁律 4C / 规范 1.1)
  const equationLatex = useMemo(() => {
    const A = params.A ?? 1;
    const omega = params.omega ?? 1;
    const phi = params.phi ?? 0;
    const k = params.k ?? 0;

    const phiStr = formatPiValue(phi);
    const signPhi = phi >= 0 ? "+" : "";
    const signK = k >= 0 ? "+" : "";

    const aPart = `\\color{${MATH_COLORS.paramPrimary}}{${A.toFixed(1)}}`;
    const wPart = `\\color{${MATH_COLORS.paramSecondary}}{${omega.toFixed(1)}}`;
    const phiPart =
      Math.abs(phi) < 1e-4
        ? ""
        : ` \\color{${MATH_COLORS.paramTertiary}}{${signPhi}${phiStr}}`;
    const kPart =
      Math.abs(k) > 1e-5
        ? ` \\color{${MATH_COLORS.functionSecondary}}{${signK}${k.toFixed(1)}}`
        : "";

    if (studyMode === "omegaZeros") {
      const x1Val = (params.x1 ?? 0).toFixed(2);
      const x2Val = (params.x2 ?? Math.PI).toFixed(2);
      return `f(x) = ${aPart} \\sin(${wPart} x${phiPart})${kPart}, \\quad x \\in [${x1Val}, ${x2Val}]`;
    }

    return `f(x) = ${aPart} \\sin(${wPart} x${phiPart})${kPart}`;
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
              }}
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

          {/* 6. 教学引导卡片 (规范 2.3: 置于左屏最底部辅助区) */}
          <LeftPanelSection title="教学探究引导" subtitle="启发式思考问题">
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs space-y-2 text-neutral-700">
              <div>
                <span className="font-semibold text-primary-700">
                  【基础条件】
                </span>
                {studyMode === "transformPath" &&
                  " 正弦函数图象平移变换均作用于自变量 x 自身。"}
                {studyMode === "omegaZeros" &&
                  " 令整体相位 u = ωx + φ，将 x 区间转化为 u 范围。"}
                {studyMode === "fivePoints" &&
                  " 一个周期内 5 个特征相位为 0, π/2, π, 3π/2, 2π。"}
                {studyMode === "properties" &&
                  " 函数周期 T = 2π/|ω|，值域为 [k - |A|, k + |A|]。"}
              </div>
              <div>
                <span className="font-semibold text-amber-700">
                  【探究问题】
                </span>
                {studyMode === "transformPath" &&
                  " 为什么先伸缩后平移时，平移量必须除以 ω？"}
                {studyMode === "omegaZeros" &&
                  " 当区间端点恰好为零点时，开闭区间对零点个数有何影响？"}
                {studyMode === "fivePoints" &&
                  " 为什么已知图象求解析式时，代入波峰比代入零点更准确？"}
                {studyMode === "properties" &&
                  " 对称轴方程与对称中心横坐标之间有什么内在距离规律？"}
              </div>
            </div>
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
