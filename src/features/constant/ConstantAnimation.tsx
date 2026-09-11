import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams } from "@/data/registries/constant";
import type { TransModelKey } from "@/math/constant";
import { SingleVarScene } from "./components/SingleVarScene";
import { DoubleVarScene } from "./components/DoubleVarScene";
import { SingleVarPanel } from "./components/SingleVarPanel";
import { DoubleVarPanel } from "./components/DoubleVarPanel";
import {
  buildParamConfigs,
  buildFormulasLatex,
  buildTipConfig,
  type ConstantTab,
  type FunModel,
  type SingleLogic,
  type SingleSubMode,
  type SelectedLogic,
} from "./components/modeConfig";

export function ConstantAnimation() {
  // 二级 Tab 状态：'single' (单变量实验室) | 'double' (双变量对垒)
  const [activeTab, setActiveTab] = useState<ConstantTab>("single");

  // 单变量函数模型：'quadratic' (二次函数) | 'transcendent' (超越函数)
  const [funModel, setFunModel] = useState<FunModel>("transcendent");

  // 超越函数子模型 (高考 4 大母题)
  const [transModel, setTransModel] = useState<TransModelKey>("ln_x_over_x");

  // 典型预设
  const [singlePresetKey, setSinglePresetKey] = useState<string>("free");
  const [doublePresetKey, setDoublePresetKey] = useState<string>("free");

  // 可视化辅助开关
  const [showDerivative, setShowDerivative] = useState<boolean>(false);
  const [showTangent, setShowTangent] = useState<boolean>(false);

  // 单变量探索模式与逻辑
  const [subMode, setSubMode] = useState<SingleSubMode>("sep");
  const [logic, setLogic] = useState<SingleLogic>("always");

  // 双变量所选逻辑
  const [selectedLogic, setSelectedLogic] = useState<SelectedLogic>("all_all");

  // 统一参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    a: defaultParams.a,
    a_axis: defaultParams.a_axis,
    m: defaultParams.m,
    n: defaultParams.n,
    yf: defaultParams.yf,
    xf: defaultParams.xf,
    yg: defaultParams.yg,
    xg: defaultParams.xg,
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const scale = useSceneScale({
    vp,
    xRange: activeTab === "single" ? [-2, 6] : [-0.5, 4],
    yRange: activeTab === "single" ? [-1, 5.5] : [-3, 7],
  });

  const handleParamChange = useCallback(
    (key: string, value: number) => {
      if (activeTab === "single") {
        setSinglePresetKey("free");
      } else {
        setDoublePresetKey("free");
      }

      setParams((prev) => {
        if (funModel === "transcendent" && activeTab === "single") {
          if (key === "m") {
            const clampedVal = Math.max(0.1, value);
            return {
              ...prev,
              m: clampedVal >= prev.n ? prev.n - 0.1 : clampedVal,
            };
          }
          if (key === "n") {
            const clampedVal = Math.max(0.2, value);
            return {
              ...prev,
              n: clampedVal <= prev.m ? prev.m + 0.1 : clampedVal,
            };
          }
        }

        if (key === "m" && value >= prev.n) {
          return { ...prev, m: prev.n - 0.1 };
        }
        if (key === "n" && value <= prev.m) {
          return { ...prev, n: prev.m + 0.1 };
        }
        return { ...prev, [key]: value };
      });
    },
    [activeTab, funModel],
  );

  const handleReset = () => {
    if (activeTab === "single") {
      setSinglePresetKey("free");
    } else {
      setDoublePresetKey("free");
    }
    setParams({
      a: defaultParams.a,
      a_axis: defaultParams.a_axis,
      m: funModel === "transcendent" ? 0.5 : defaultParams.m,
      n: funModel === "transcendent" ? 2.5 : defaultParams.n,
      yf: defaultParams.yf,
      xf: defaultParams.xf,
      yg: defaultParams.yg,
      xg: defaultParams.xg,
    });
  };

  // 组装看板数据
  const mathData = useMemo(() => {
    const animId =
      activeTab === "single" ? "anim-constant-single" : "anim-constant-double";
    return buildMathQuantities(animId, params, {
      subMode,
      logic,
      selectedLogic,
      funModel,
      transModel,
    });
  }, [params, activeTab, subMode, logic, selectedLogic, funModel, transModel]);

  // ParamControl 参数配置
  const paramConfigs = useMemo<ParamConfig[]>(
    () => buildParamConfigs({ activeTab, subMode, funModel, params }),
    [params, activeTab, subMode, funModel],
  );

  // 中屏公式 LateX
  const formulasLatex = useMemo(
    () =>
      buildFormulasLatex({
        activeTab,
        subMode,
        funModel,
        transModel,
        selectedLogic,
        params,
      }),
    [activeTab, subMode, funModel, transModel, selectedLogic, params],
  );

  // 教学导引与题设背景配置
  const tipConfig = useMemo(
    () =>
      buildTipConfig({
        activeTab,
        funModel,
        transModel,
        logic,
        selectedLogic,
        m: params.m,
        n: params.n,
      }),
    [activeTab, funModel, transModel, logic, selectedLogic, params.m, params.n],
  );

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Section 1: 顶层实验室切换 */}
          <LeftPanelSection title="实验室场景">
            <TabSwitcher
              tabs={[
                { key: "single", label: "单变量实验室" },
                { key: "double", label: "双变量对决" },
              ]}
              value={activeTab}
              onChange={(k) => setActiveTab(k as ConstantTab)}
            />
          </LeftPanelSection>

          {/* Section 2/3: 单/双变量业务面板 */}
          {activeTab === "single" ? (
            <SingleVarPanel
              funModel={funModel}
              setFunModel={setFunModel}
              transModel={transModel}
              setTransModel={setTransModel}
              singlePresetKey={singlePresetKey}
              setSinglePresetKey={setSinglePresetKey}
              subMode={subMode}
              setSubMode={setSubMode}
              logic={logic}
              setLogic={setLogic}
              showDerivative={showDerivative}
              setShowDerivative={setShowDerivative}
              showTangent={showTangent}
              setShowTangent={setShowTangent}
              setParams={setParams}
            />
          ) : (
            <DoubleVarPanel
              selectedLogic={selectedLogic}
              setSelectedLogic={setSelectedLogic}
              doublePresetKey={doublePresetKey}
              setDoublePresetKey={setDoublePresetKey}
              setParams={setParams}
            />
          )}

          {/* Section 4: 参数设置 (ParamControl 渲染) */}
          <LeftPanelSection title="参数调节" subtitle="改变研究区间与目标参数">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学导引与题设背景 */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard
              variant={tipConfig.variant}
              badge={tipConfig.badge}
              condition={tipConfig.condition}
              question={tipConfig.question}
            />
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
            {activeTab === "single" ? (
              <SingleVarScene
                subMode={subMode}
                logic={logic}
                funModel={funModel}
                transModel={transModel}
                showDerivative={showDerivative}
                showTangent={showTangent}
                params={params}
                scale={scale}
                vp={vp}
                fontScale={canvasSize.font}
                onParamChange={handleParamChange}
              />
            ) : (
              <DoubleVarScene
                selectedLogic={selectedLogic}
                params={params}
                scale={scale}
                vp={vp}
                fontScale={canvasSize.font}
                onParamChange={handleParamChange}
              />
            )}
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
          title={activeTab === "single" ? "单自变量看板" : "双动点博弈看板"}
        />
      }
    />
  );
}
