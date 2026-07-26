/**
 * src/features/sequence/SequenceAnimation.tsx
 * 数列实验室 动画编排主页面 (包含 5 大高考求和模型)
 */
import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { SequenceScene } from "./components/SequenceScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/sequence";

export function SequenceAnimation() {
  // 当前研究大类模式: 'arithmetic' | 'geometric' | 'models'
  const [activeMode, setActiveMode] = useState<
    "arithmetic" | "geometric" | "models"
  >("arithmetic");

  // 等比模式下的视图: 'points' | 'tessellation'
  const [geometricViewType, setGeometricViewType] = useState<
    "points" | "tessellation"
  >("points");

  // 高考模型子类型: 5 大高考求和模型
  const [modelType, setModelType] = useState<
    "arith-geo" | "telescoping" | "cross-telescoping" | "grouped" | "odd-even"
  >("arith-geo");

  // 当前高亮/选中的项数 n
  const [highlightN, setHighlightN] = useState<number>(1);

  // 参数状态: a1, d, q, N
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量与 Hook
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 固定坐标轴：N ∈ [3, 15]，xRange 覆盖所有可能的 N
  const xRange: [number, number] = [-1, 16.5];

  // 各模型固定 canonical yRange（从默认参数数据范围推导，模型间自动切换，同一模型内不缩放）
  const MODEL_Y_RANGES: Record<string, [number, number]> = {
    // 等差: a_n ∈ [-4, 3], S_n ∈ [3, 20] (a1=3, d=-1, N=15)
    arithmetic: [-8, 25],
    // 等比 q<1: S_n → a1/(1-q)=6; q>1: 指数增长
    geometric: params.q > 1 ? [-2, 50] : [-1, 8],
    // 错位相减: cn = (a1+(n-1)d)*q^(n-1) ∈ [0.02, 3]
    "arith-geo": [-5, 15],
    // 裂项: partA=1/n ∈ (0,1], -partB=-1/(n+1) ∈ [-0.5,0)
    telescoping: [-0.5, 1.5],
    // 跨项裂项: partA=0.5/n ∈ (0,0.5], -partB=-0.5/(n+2)
    "cross-telescoping": [-0.2, 1],
    // 分组: cn = an+bn ∈ [-3.5, 4]
    grouped: [-8, 25],
    // 奇偶: cn = (-1)^n*n ∈ [-15, 15] (N_MAX=15)
    "odd-even": [-17, 17],
  };

  const yRange: [number, number] =
    activeMode === "models"
      ? (MODEL_Y_RANGES[modelType] ?? [-6, 22])
      : activeMode === "geometric"
        ? MODEL_Y_RANGES.geometric
        : MODEL_Y_RANGES.arithmetic;

  const scale = useSceneScale({
    vp,
    xRange,
    yRange,
  });

  // 右屏 MathPanel 看板组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-sequence", params, {
      activeMode,
      geometricViewType,
      modelType,
      subModel: modelType,
    });
  }, [params, activeMode, geometricViewType, modelType]);

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
  };

  // 按 activeMode 过滤并生成声明式 LeftPanel 参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      arithmetic: ["a1", "d", "N"],
      geometric: ["a1", "q", "N"],
      models:
        modelType === "arith-geo" || modelType === "grouped"
          ? ["a1", "d", "q", "N"]
          : ["N"],
    };

    const keys = keysByMode[activeMode] ?? Object.keys(paramMeta);
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
          importance: meta.importance as any,
          marks: meta.marks,
        };
      });
  }, [params, activeMode, modelType]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 主模式切换区 */}
          <LeftPanelSection
            title="数列类型与研究模式"
            subtitle="选择基础数列或高考模型"
          >
            <TabSwitcher
              tabs={[
                { key: "arithmetic", label: "等差数列" },
                { key: "geometric", label: "等比数列" },
                { key: "models", label: "高考求和模型" },
              ]}
              value={activeMode}
              onChange={(val) => setActiveMode(val as any)}
            />
          </LeftPanelSection>

          {/* 2. 子模式视图选择 */}
          {activeMode === "geometric" && (
            <LeftPanelSection
              title="视口表达形式"
              subtitle="离散曲线或几何剖分"
            >
              <SelectGrid
                items={[
                  { key: "points", label: "离散点与指数" },
                  { key: "tessellation", label: "正方形无限剖分" },
                ]}
                value={geometricViewType}
                onChange={(val) => setGeometricViewType(val as any)}
              />
            </LeftPanelSection>
          )}

          {activeMode === "models" && (
            <LeftPanelSection
              title="高考 5 大核心求和模型"
              subtitle="完整覆盖高考解答题与压轴考种"
            >
              <SelectGrid
                items={[
                  { key: "arith-geo", label: "错位相减法" },
                  { key: "telescoping", label: "标准裂项相消" },
                  { key: "cross-telescoping", label: "跨项裂项相消" },
                  { key: "grouped", label: "分组求和法" },
                  { key: "odd-even", label: "奇偶并项求和" },
                ]}
                value={modelType}
                onChange={(val) => setModelType(val as any)}
              />
            </LeftPanelSection>
          )}

          {/* 3. 动态声明式参数控制台 */}
          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块实时观察几何变化"
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
        <AnimationSvgCanvas
          containerRef={containerRef}
          transform={vp.transform}
        >
          <SequenceScene
            params={params}
            scale={scale}
            vp={vp}
            fontScale={canvasSize.font}
            activeMode={activeMode}
            geometricViewType={geometricViewType}
            modelType={modelType}
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
          title="数列数形结合看板"
        />
      }
    />
  );
}
