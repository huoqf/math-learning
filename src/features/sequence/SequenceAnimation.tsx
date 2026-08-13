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
  // 当前研究大类模式: 'arithmetic' | 'geometric' | 'recurrence' | 'models'
  const [activeMode, setActiveMode] = useState<
    "arithmetic" | "geometric" | "recurrence" | "models"
  >("arithmetic");

  // 等比模式下的视图: 'points' | 'tessellation'
  const [geometricViewType, setGeometricViewType] = useState<
    "points" | "tessellation"
  >("points");

  // 高考模型子类型: 5 大高考求和模型
  const [modelType, setModelType] = useState<
    "arith-geo" | "telescoping" | "cross-telescoping" | "grouped" | "odd-even"
  >("arith-geo");

  // 递推构造求通项子模型: 5 大核心递推构造模型
  const [recurrenceModelType, setRecurrenceModelType] = useState<
    | "linear-pan"
    | "accumulation"
    | "multiplication"
    | "reciprocal"
    | "second-order"
  >("linear-pan");

  // 当前高亮/选中的项数 n
  const [highlightN, setHighlightN] = useState<number>(1);

  // 参数状态
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
  }));

  // 视口尺寸测量与 Hook
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 固定坐标轴：N ∈ [3, 15]，xRange 覆盖所有可能的 N
  const xRange: [number, number] = [-1, 16.5];

  // 各模型固定 canonical yRange
  const MODEL_Y_RANGES: Record<string, [number, number]> = {
    arithmetic: [-8, 25],
    geometric: params.q > 1 ? [-2, 50] : [-1, 8],
    "arith-geo": [-5, 15],
    telescoping: [-0.5, 1.5],
    "cross-telescoping": [-0.2, 1],
    grouped: [-8, 25],
    "odd-even": [-17, 17],
    // 递推与构造法 Y 轴范围
    "linear-pan": [-10, 30],
    accumulation: [-5, 45],
    multiplication: [-1, 10],
    reciprocal: [-5, 15],
    "second-order": [-10, 50],
  };

  const yRange: [number, number] =
    activeMode === "models"
      ? (MODEL_Y_RANGES[modelType] ?? [-6, 22])
      : activeMode === "recurrence"
        ? (MODEL_Y_RANGES[recurrenceModelType] ?? [-10, 30])
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
      subModel: activeMode === "recurrence" ? recurrenceModelType : modelType,
    });
  }, [params, activeMode, geometricViewType, modelType, recurrenceModelType]);

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
      recurrence:
        recurrenceModelType === "linear-pan"
          ? ["a1", "p_rec", "q_rec", "N"]
          : recurrenceModelType === "accumulation"
            ? ["a1", "d", "N"]
            : recurrenceModelType === "multiplication"
              ? ["a1", "N"]
              : recurrenceModelType === "reciprocal"
                ? ["a1", "coefA", "coefB", "coefC", "N"]
                : ["a1", "a2", "p_rec", "q_rec", "N"],
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
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, activeMode, modelType, recurrenceModelType]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 主模式切换区 */}
          <LeftPanelSection
            title="数列类型与研究模式"
            subtitle="选择基础数列、递推构造或高考模型"
          >
            <TabSwitcher
              tabs={[
                { key: "arithmetic", label: "等差数列" },
                { key: "geometric", label: "等比数列" },
                { key: "recurrence", label: "递推与构造法" },
                { key: "models", label: "高考求和模型" },
              ]}
              value={activeMode}
              onChange={(val) => setActiveMode(val as typeof activeMode)}
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
                onChange={(val) =>
                  setGeometricViewType(val as typeof geometricViewType)
                }
              />
            </LeftPanelSection>
          )}

          {activeMode === "recurrence" && (
            <LeftPanelSection
              title="递推构造 5 大核心模型"
              subtitle="涵盖高考求通项待定系数与构造法"
            >
              <SelectGrid
                items={[
                  {
                    key: "linear-pan",
                    label: "待定系数/一阶线性",
                    formula: "a_{n+1}=pa_n+q",
                  },
                  {
                    key: "accumulation",
                    label: "累加法求通项",
                    formula: "a_{n+1}=a_n+f(n)",
                  },
                  {
                    key: "multiplication",
                    label: "累乘法求通项",
                    formula: "a_{n+1}=f(n)a_n",
                  },
                  {
                    key: "reciprocal",
                    label: "倒数构造法",
                    formula: "a_{n+1}=\\frac{Aa_n}{Ba_n+C}",
                  },
                  {
                    key: "second-order",
                    label: "二阶特征根法",
                    formula: "a_{n+2}=pa_{n+1}+qa_n",
                    fullWidth: true,
                  },
                ]}
                value={recurrenceModelType}
                onChange={(val) =>
                  setRecurrenceModelType(val as typeof recurrenceModelType)
                }
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
                onChange={(val) => setModelType(val as typeof modelType)}
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
            recurrenceModelType={recurrenceModelType}
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
