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
import {
  calcArithmeticSequence,
  calcArithGeoSplit,
  calcGroupedSequence,
} from "@/math/sequence";

export function SequenceAnimation() {
  // 当前研究大类模式: 'arithmetic' | 'geometric' | 'recurrence' | 'models'
  const [activeMode, setActiveMode] = useState<
    "arithmetic" | "geometric" | "recurrence" | "models"
  >("arithmetic");

  // 等差模式下的专题子模式: 'linear' | 'gauss' | 'quadratic' | 'segment' | 'absSum'
  const [arithmeticSubMode, setArithmeticSubMode] = useState<
    "linear" | "gauss" | "quadratic" | "segment" | "absSum"
  >("linear");

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

  const a1_param = params.a1 ?? 5;
  const d_param = params.d ?? -1.5;
  const N_param = Math.max(4, Math.min(12, Math.round(params.N ?? 8)));
  const kSeg_param = params.kSegment ?? 3;

  const { xRange, yRange } = useMemo<{
    xRange: [number, number];
    yRange: [number, number];
  }>(() => {
    if (activeMode === "arithmetic") {
      const res = calcArithmeticSequence(
        a1_param,
        d_param,
        N_param,
        kSeg_param,
      );
      const allAn = res.terms.map((t) => t.an);
      const allSn = res.terms.map((t) => t.Sn);
      const allTn = res.terms.map((t) => t.Tn);

      const minAn = Math.min(0, ...allAn);
      const maxAn = Math.max(0, ...allAn);
      const minSn = Math.min(0, ...allSn);
      const maxSn = Math.max(0, ...allSn);
      const maxTn = Math.max(0, ...allTn);

      const xR: [number, number] = [-0.8, N_param + 0.8];
      let yR: [number, number] = [-6, 10];

      if (arithmeticSubMode === "linear") {
        yR = [Math.floor(minAn - 1.5), Math.ceil(maxAn + 1.5)];
      } else if (arithmeticSubMode === "gauss") {
        const sumH = a1_param + (res.terms[N_param - 1]?.an ?? 0);
        const minH = Math.min(0, ...allAn, sumH);
        const maxH = Math.max(0, ...allAn, sumH);
        yR = [Math.floor(minH - 1.2), Math.ceil(maxH + 2.5)];
      } else if (arithmeticSubMode === "quadratic") {
        const vertexY =
          res.continuousAxis !== null ? res.parabolaFn(res.continuousAxis) : 0;
        const minY = Math.min(0, minSn, vertexY);
        const maxY = Math.max(0, maxSn, vertexY);
        yR = [Math.floor(minY - 2.0), Math.ceil(maxY + 2.5)];
      } else if (arithmeticSubMode === "segment") {
        yR = [Math.floor(minAn - 1.5), Math.ceil(maxAn + 3.0)];
      } else if (arithmeticSubMode === "absSum") {
        const minY = Math.min(0, minAn, minSn);
        const maxY = Math.max(0, maxTn);
        yR = [Math.floor(minY - 1.5), Math.ceil(maxY + 2.0)];
      }

      if (yR[1] - yR[0] < 6) {
        const mid = (yR[0] + yR[1]) / 2;
        yR = [Math.floor(mid - 3), Math.ceil(mid + 3)];
      }
      return { xRange: xR, yRange: yR };
    }

    let xR: [number, number] = [-1, N_param + 1.5];
    let yR: [number, number] = [-4, 16];

    if (activeMode === "models") {
      const a1_m = a1_param;
      const d_m = d_param;
      const q_m = params.q ?? 0.5;
      const N_m = N_param;
      const teleGap = params.teleGap ?? 1;

      if (modelType === "arith-geo") {
        xR = [-1, N_m + 2];
        const res = calcArithGeoSplit(a1_m, d_m, q_m, N_m);
        const allVals = res.terms.flatMap((t) => [
          t.cn,
          t.cn * q_m,
          t.an,
          t.bn,
        ]);
        const minV = Math.min(0, ...allVals);
        const maxV = Math.max(3, ...allVals);
        yR = [Math.floor(minV - 1.5), Math.ceil(maxV + 2.5)];
      } else if (modelType === "telescoping") {
        xR = [-1, N_m + 1.5];
        if (teleGap === 3) {
          const maxRad = Math.sqrt(N_m + 1);
          yR = [-Math.ceil(maxRad + 0.5), Math.ceil(maxRad + 1.5)];
        } else if (teleGap === 2) {
          yR = [-0.8, 1.2];
        } else {
          yR = [-1.2, 1.5];
        }
      } else if (modelType === "grouped") {
        xR = [-1, N_m + 1.5];
        const res = calcGroupedSequence(a1_m, d_m, q_m, N_m);
        const allVals = res.terms.flatMap((t) => [t.an, t.bn, t.cn]);
        const minV = Math.min(0, ...allVals);
        const maxV = Math.max(3, ...allVals);
        yR = [Math.floor(minV - 2), Math.ceil(maxV + 3)];
      } else if (modelType === "odd-even") {
        xR = [-1, N_m + 1.5];
        yR = [-(N_m + 2), N_m + 2];
      }
      if (yR[1] - yR[0] < 6) yR = [yR[0], yR[0] + 6];
      return { xRange: xR, yRange: yR };
    }

    const MODEL_Y_RANGES: Record<string, [number, number]> = {
      geometric: params.q > 1 ? [-2, 50] : [-1, 8],
      "linear-pan": [-10, 30],
      accumulation: [-5, 45],
      multiplication: [-1, 10],
      reciprocal: [-5, 15],
      "second-order": [-10, 50],
    };

    const defaultYR =
      activeMode === "recurrence"
        ? (MODEL_Y_RANGES[recurrenceModelType] ?? [-10, 30])
        : MODEL_Y_RANGES.geometric;

    return { xRange: [-1, 16.5], yRange: defaultYR };
  }, [
    activeMode,
    arithmeticSubMode,
    modelType,
    recurrenceModelType,
    a1_param,
    d_param,
    N_param,
    kSeg_param,
    params.q,
    params.teleGap,
  ]);

  const scale = useSceneScale({
    vp,
    xRange,
    yRange,
    keepAspectRatio: false,
  });

  // 右屏 MathPanel 看板组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-sequence", params, {
      activeMode,
      arithmeticSubMode,
      geometricViewType,
      modelType,
      subModel: activeMode === "recurrence" ? recurrenceModelType : modelType,
    });
  }, [
    params,
    activeMode,
    arithmeticSubMode,
    geometricViewType,
    modelType,
    recurrenceModelType,
  ]);

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
      arithmetic:
        arithmeticSubMode === "gauss"
          ? ["a1", "d", "N", "gaussRatio"]
          : arithmeticSubMode === "segment"
            ? ["a1", "d", "N", "kSegment"]
            : ["a1", "d", "N"],
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
  }, [params, activeMode, arithmeticSubMode, modelType, recurrenceModelType]);

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
          {activeMode === "arithmetic" && (
            <LeftPanelSection
              title="等差数列 5 大教学与高考专题"
              subtitle="数形结合深化理解通项、求和与最值"
            >
              <SelectGrid
                items={[
                  { key: "linear", label: "一次函数与通项" },
                  { key: "gauss", label: "高斯倒序拼图" },
                  { key: "quadratic", label: "二次函数与极值" },
                  { key: "segment", label: "等长片段和性质" },
                  { key: "absSum", label: "绝对值数列求和" },
                ]}
                value={arithmeticSubMode}
                onChange={(val) =>
                  setArithmeticSubMode(val as typeof arithmeticSubMode)
                }
              />
            </LeftPanelSection>
          )}

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
                  { key: "telescoping", label: "裂项相消法" },
                  { key: "cross-telescoping", label: "绝对值变号求和" },
                  { key: "grouped", label: "分组转化求和" },
                  { key: "odd-even", label: "奇偶并项求和" },
                ]}
                value={modelType}
                onChange={(val) => setModelType(val as typeof modelType)}
              />
            </LeftPanelSection>
          )}

          {/* 错位相减专属：推导步骤选择卡片 */}
          {activeMode === "models" && modelType === "arith-geo" && (
            <LeftPanelSection
              title="推导演化步骤"
              subtitle="分步展示错位相减标准答题过程"
            >
              <SelectGrid
                items={[
                  {
                    key: "1",
                    label: "Step 1: 原式列出",
                    description: "列出原始求和表达式 T_n",
                  },
                  {
                    key: "2",
                    label: "Step 2: 乘公比错位",
                    description: "同乘 q 整体向右平移 1 格",
                  },
                  {
                    key: "3",
                    label: "Step 3: 两式相减",
                    description: "首项直落，中间等比，尾项带负号",
                  },
                  {
                    key: "4",
                    label: "Step 4: 求和化简",
                    description: "代入等比求和公式完成化简",
                  },
                ]}
                value={String(params.sumStep ?? 1)}
                onChange={(k) => handleParamChange("sumStep", Number(k))}
                columns={1}
              />
            </LeftPanelSection>
          )}

          {/* 裂项相消专属：裂项题型选择卡片 */}
          {activeMode === "models" && modelType === "telescoping" && (
            <LeftPanelSection
              title="裂项相消题型"
              subtitle="覆盖新高考 3 大典型裂项构造"
            >
              <SelectGrid
                items={[
                  {
                    key: "1",
                    label: "标准差 1 型",
                    formula: "\\frac{1}{n(n+1)}",
                    description: "相邻抵消，留首尾各 1 项",
                  },
                  {
                    key: "2",
                    label: "跨项差 2 型",
                    formula: "\\frac{1}{n(n+2)}",
                    description: "提系数 1/2，留首尾各 2 项",
                  },
                  {
                    key: "3",
                    label: "根式有理化型",
                    formula: "\\frac{1}{\\sqrt{n}+\\sqrt{n+1}}",
                    description: "分子有理化，前后伸缩抵消",
                  },
                ]}
                value={String(params.teleGap ?? 1)}
                onChange={(k) => handleParamChange("teleGap", Number(k))}
                columns={1}
              />
            </LeftPanelSection>
          )}

          {/* 3. 动态声明式参数控制台 */}
          <LeftPanelSection
            title="数值参数调节"
            subtitle="拖动滑块探索参数对数列图像与求和的影响"
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
            arithmeticSubMode={arithmeticSubMode}
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
