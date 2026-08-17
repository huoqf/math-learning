/**
 * src/features/sequence/RecurrencePage.tsx
 * 递推数列与构造法求通项实验室 (基于 Nice-Number 刻度步长与高考经典母题预设体系)
 */
import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TabSwitcher,
  KatexFormula,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { RecurrenceScene } from "./components/RecurrenceScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  RECURRENCE_PRESETS,
} from "@/data/registries/sequence";
import {
  calcLinearRecurrence,
  calcAccumulationRecurrence,
  calcMultiplicationRecurrence,
  calcNonHomogeneousExpRecurrence,
  calcReciprocalRecurrence,
  calcSecondOrderRecurrence,
  type AccumulationFnType,
} from "@/math/sequence";

type RecurrenceModel =
  | "linear-pan"
  | "accumulation"
  | "multiplication"
  | "non-homogeneous"
  | "reciprocal"
  | "second-order";

const KEYS_BY_MODEL: Record<RecurrenceModel, string[]> = {
  "linear-pan": ["a1", "p_rec", "q_rec", "N"],
  accumulation: ["a1", "stepParam", "N"],
  multiplication: ["a1", "N"],
  "non-homogeneous": ["a1", "p_rec", "q_rec", "r_rec", "N"],
  reciprocal: ["a1", "coefA", "coefB", "coefC", "N"],
  "second-order": ["a1", "a2", "p_rec", "q_rec", "N"],
};

/**
 * 标准 Nice Number 刻度步长生成算法
 */
function calcNiceStep(span: number, targetTicks = 6): number {
  if (span <= 0 || !Number.isFinite(span)) return 1;
  const rawStep = span / Math.max(2, targetTicks);
  const power = Math.floor(Math.log10(rawStep));
  const base = Math.pow(10, power);
  const fraction = rawStep / base;

  let niceFraction = 1;
  if (fraction > 5) {
    niceFraction = 10;
  } else if (fraction > 2) {
    niceFraction = 5;
  } else if (fraction > 1) {
    niceFraction = 2;
  } else {
    niceFraction = 1;
  }
  return niceFraction * base;
}

export function RecurrencePage() {
  const [recurrenceModelType, setRecurrenceModelType] =
    useState<RecurrenceModel>("linear-pan");
  const [activePresetKey, setActivePresetKey] = useState<string>("converge");
  const [accumFnType, setAccumFnType] =
    useState<AccumulationFnType>("arithmetic");
  const [multType, setMultType] = useState<
    "n_over_n1" | "n1_over_n" | "pow_two"
  >("n_over_n1");
  const [highlightN, setHighlightN] = useState<number>(1);

  // 初始化参数
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
    ...(RECURRENCE_PRESETS["linear-pan"]?.[0]?.params ?? {}),
  }));

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  const a1 = params.a1 ?? 1;
  const p_rec = params.p_rec ?? 2;
  const q_rec = params.q_rec ?? 1;
  const r_rec = params.r_rec ?? 2;
  const stepParam = params.stepParam ?? 2;
  const a2 = params.a2 ?? 3;
  const coefA = params.coefA ?? 1;
  const coefB = params.coefB ?? 1;
  const coefC = params.coefC ?? 1;
  const N = Math.min(12, Math.max(4, Math.round(params.N ?? 6)));

  // 当前模型的经典预设列表
  const currentPresets = useMemo(() => {
    return RECURRENCE_PRESETS[recurrenceModelType] ?? [];
  }, [recurrenceModelType]);

  // 动态自适应计算最佳数学区间与刻度步长 (Nice-Number 算法)
  const { xRange, yRange, xStep, yStep, keepAspectRatio } = useMemo(() => {
    if (recurrenceModelType === "linear-pan") {
      const linearData = calcLinearRecurrence(a1, p_rec, q_rec, N);
      const allVals = [
        ...linearData.terms.map((t) => t.an),
        ...(linearData.fixedPoint !== null ? [linearData.fixedPoint] : []),
      ].filter(Number.isFinite);

      let minV = Math.min(-2, ...allVals);
      let maxV = Math.max(6, ...allVals);
      const span = Math.max(8, maxV - minV);
      const pad = span * 0.18;
      minV = Math.floor(minV - pad);
      maxV = Math.ceil(maxV + pad);

      const totalSpan = maxV - minV;
      const step = calcNiceStep(totalSpan, 6);

      return {
        xRange: [minV, maxV] as [number, number],
        yRange: [minV, maxV] as [number, number],
        xStep: step,
        yStep: step,
        keepAspectRatio: true, // 蛛网图保持 1:1 对角线 45 度角
      };
    }

    // 散点图模式：x 轴为项数区间 [0, N + 0.8]，xStep 恒为 1
    const xR: [number, number] = [-0.6, N + 0.8];
    const xS = 1;

    const allY: number[] = [0];

    if (recurrenceModelType === "accumulation") {
      const res = calcAccumulationRecurrence(a1, accumFnType, stepParam, N);
      allY.push(...res.terms.map((t) => t.an));
    } else if (recurrenceModelType === "multiplication") {
      const res = calcMultiplicationRecurrence(a1, multType, N);
      allY.push(...res.terms.map((t) => t.an));
    } else if (recurrenceModelType === "non-homogeneous") {
      const res = calcNonHomogeneousExpRecurrence(a1, p_rec, q_rec, r_rec, N);
      allY.push(...res.terms.map((t) => t.an), ...res.terms.map((t) => t.bn));
    } else if (recurrenceModelType === "reciprocal") {
      const res = calcReciprocalRecurrence(a1, coefA, coefB, coefC, N);
      allY.push(...res.terms.map((t) => t.an), ...res.terms.map((t) => t.bn));
    } else if (recurrenceModelType === "second-order") {
      const res = calcSecondOrderRecurrence(a1, a2, p_rec, q_rec, N);
      allY.push(...res.terms.map((t) => t.an), ...res.terms.map((t) => t.bn));
    }

    const validY = allY.filter(Number.isFinite);
    const minY = Math.min(...validY);
    let maxY = Math.max(...validY);

    if (maxY - minY < 4) {
      maxY = minY + 4;
    }

    // 教学包络保护：若发生极端指数激增，保持中低项与构造数列清晰可辨
    let visualMaxY = maxY;
    if (visualMaxY > 60) {
      const sortedY = [...validY].sort((a, b) => a - b);
      const medianTop = sortedY[Math.min(sortedY.length - 2, 4)] ?? 40;
      visualMaxY = Math.min(visualMaxY, Math.max(30, medianTop * 1.6));
    }

    const hSpan = visualMaxY - minY;
    const padY = Math.max(1, hSpan * 0.15);
    const yR: [number, number] = [
      Math.floor(minY - padY),
      Math.ceil(visualMaxY + padY),
    ];
    const totalH = yR[1] - yR[0];
    const yS = calcNiceStep(totalH, 6);

    return {
      xRange: xR,
      yRange: yR,
      xStep: xS,
      yStep: yS,
      keepAspectRatio: false, // 散点图模式自由缩放填满视口
    };
  }, [
    recurrenceModelType,
    a1,
    p_rec,
    q_rec,
    r_rec,
    stepParam,
    a2,
    coefA,
    coefB,
    coefC,
    N,
    accumFnType,
    multType,
  ]);

  const scale = useSceneScale({
    vp,
    xRange,
    yRange,
    keepAspectRatio,
  });

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-sequence", params, {
        activeMode: "recurrence",
        subModel: recurrenceModelType,
        accumFnType,
        multType,
      }),
    [params, recurrenceModelType, accumFnType, multType],
  );

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return KEYS_BY_MODEL[recurrenceModelType]
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
  }, [params, recurrenceModelType]);

  // 切换主模型时，自动加载该模型的第一个经典母题预设
  const handleModelChange = (model: RecurrenceModel) => {
    setRecurrenceModelType(model);
    setHighlightN(1);
    const presets = RECURRENCE_PRESETS[model] ?? [];
    if (presets.length > 0) {
      const first = presets[0];
      setActivePresetKey(first.key);
      setParams((prev) => ({
        ...prev,
        ...first.params,
      }));
    }
  };

  // 应用特定经典预设
  const handleApplyPreset = (presetKey: string) => {
    setActivePresetKey(presetKey);
    const found = currentPresets.find((p) => p.key === presetKey);
    if (found) {
      setParams((prev) => ({
        ...prev,
        ...found.params,
      }));
    }
  };

  // 中屏顶部核心递推与构造方程 KaTeX 表达式
  const headerFormulaLatex = useMemo(() => {
    if (recurrenceModelType === "linear-pan") {
      const fixedPoint =
        Math.abs(p_rec - 1) < 1e-9 ? null : q_rec / (1 - p_rec);
      if (fixedPoint !== null) {
        return `a_{n+1} = \\color{${MATH_COLORS.paramPrimary}}{${p_rec}} a_n + \\color{${MATH_COLORS.paramSecondary}}{${q_rec}} \\iff a_{n+1} - \\color{${MATH_COLORS.paramTertiary}}{${fixedPoint.toFixed(2)}} = \\color{${MATH_COLORS.paramPrimary}}{${p_rec}}(a_n - \\color{${MATH_COLORS.paramTertiary}}{${fixedPoint.toFixed(2)}})`;
      }
      return `a_{n+1} = a_n + \\color{${MATH_COLORS.paramSecondary}}{${q_rec}} \\quad (p=1 \\text{ 退化等差})`;
    }
    if (recurrenceModelType === "non-homogeneous") {
      if (Math.abs(p_rec - r_rec) < 1e-9) {
        return `a_{n+1} = ${p_rec} a_n + ${q_rec} \\cdot ${r_rec}^n \\iff \\frac{a_{n+1}}{${r_rec}^{n+1}} = \\frac{a_n}{${r_rec}^n} + \\frac{${q_rec}}{${r_rec}} \\quad (\\text{共振等差})`;
      }
      return `a_{n+1} = \\color{${MATH_COLORS.paramPrimary}}{${p_rec}} a_n + \\color{${MATH_COLORS.paramSecondary}}{${q_rec}} \\cdot \\color{${MATH_COLORS.paramTertiary}}{${r_rec}}^n \\iff \\frac{a_{n+1}}{${r_rec}^{n+1}} = \\frac{${p_rec}}{${r_rec}} \\cdot \\frac{a_n}{${r_rec}^n} + \\frac{${q_rec}}{${r_rec}}`;
    }
    if (recurrenceModelType === "second-order") {
      const delta = p_rec * p_rec + 4 * q_rec;
      const r1 = delta >= 0 ? (p_rec + Math.sqrt(delta)) / 2 : p_rec / 2;
      const r2 = delta >= 0 ? (p_rec - Math.sqrt(delta)) / 2 : p_rec / 2;
      return `a_{n+2} = ${p_rec} a_{n+1} + ${q_rec} a_n \\iff a_{n+2} - (${r1.toFixed(2)}) a_{n+1} = (${r2.toFixed(2)})(a_{n+1} - (${r1.toFixed(2)}) a_n)`;
    }
    if (recurrenceModelType === "accumulation") {
      const fnStr =
        accumFnType === "arithmetic"
          ? `${stepParam}n`
          : accumFnType === "geometric"
            ? `${stepParam}^n`
            : "\\frac{1}{n(n+1)}";
      return `a_{n+1} - a_n = ${fnStr} \\implies a_n = a_1 + \\sum_{k=1}^{n-1} f(k)`;
    }
    if (recurrenceModelType === "multiplication") {
      const fnStr =
        multType === "n_over_n1"
          ? "\\frac{n}{n+1}"
          : multType === "n1_over_n"
            ? "\\frac{n+1}{n}"
            : "2^n";
      return `\\frac{a_{n+1}}{a_n} = ${fnStr} \\implies a_n = a_1 \\prod_{k=1}^{n-1} f(k)`;
    }
    if (recurrenceModelType === "reciprocal") {
      return `a_{n+1} = \\frac{${coefA}a_n}{${coefB}a_n + ${coefC}} \\iff \\frac{1}{a_{n+1}} = \\frac{${coefC}}{${coefA}} \\cdot \\frac{1}{a_n} + \\frac{${coefB}}{${coefA}}`;
    }
    return "";
  }, [
    recurrenceModelType,
    p_rec,
    q_rec,
    r_rec,
    stepParam,
    coefA,
    coefB,
    coefC,
    accumFnType,
    multType,
  ]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="递推构造 6 大核心模型"
            subtitle="覆盖新高考大题核心待定系数与同除构造"
          >
            <SelectGrid
              items={[
                {
                  key: "linear-pan",
                  label: "待定系数/一阶线性",
                  formula: "a_{n+1}=pa_n+q",
                  fullWidth: true,
                },
                {
                  key: "non-homogeneous",
                  label: "指数非齐次构造",
                  formula: "a_{n+1}=pa_n+qr^n",
                  fullWidth: true,
                },
                {
                  key: "second-order",
                  label: "二阶特征根法",
                  formula: "a_{n+2}=pa_{n+1}+qa_n",
                  fullWidth: true,
                },
                {
                  key: "accumulation",
                  label: "累加法求通项",
                  formula: "a_{n+1}=a_n+f(n)",
                  fullWidth: true,
                },
                {
                  key: "multiplication",
                  label: "累乘法求通项",
                  formula: "a_{n+1}=f(n)a_n",
                  fullWidth: true,
                },
                {
                  key: "reciprocal",
                  label: "倒数与分式构造",
                  formula: "a_{n+1}=\\frac{Aa_n}{Ba_n+C}",
                  fullWidth: true,
                },
              ]}
              value={recurrenceModelType}
              onChange={(val) => handleModelChange(val as RecurrenceModel)}
            />
          </LeftPanelSection>

          {/* 高考经典母题预设 */}
          {currentPresets.length > 0 && (
            <LeftPanelSection
              title="高考经典母题预设"
              subtitle="一键加载高考典型递推参数模型"
            >
              <SelectGrid
                items={currentPresets.map((p) => ({
                  key: p.key,
                  label: p.name,
                  description: p.desc,
                  fullWidth: true,
                }))}
                value={activePresetKey}
                onChange={handleApplyPreset}
              />
            </LeftPanelSection>
          )}

          {/* 累加法函数类型切换 */}
          {recurrenceModelType === "accumulation" && (
            <LeftPanelSection
              title="增量函数 f(n) 类型"
              subtitle="选择不同差分增量模型"
            >
              <TabSwitcher
                tabs={[
                  { key: "arithmetic", label: "等差型 dn" },
                  { key: "geometric", label: "指数型 qⁿ" },
                  { key: "telescoping", label: "裂项 1/n(n+1)" },
                ]}
                value={accumFnType}
                onChange={(val) => setAccumFnType(val as AccumulationFnType)}
              />
            </LeftPanelSection>
          )}

          {/* 累乘法函数类型切换 */}
          {recurrenceModelType === "multiplication" && (
            <LeftPanelSection
              title="比值函数 f(n) 类型"
              subtitle="选择不同因式对消模型"
            >
              <TabSwitcher
                tabs={[
                  { key: "n_over_n1", label: "n/(n+1)" },
                  { key: "n1_over_n", label: "(n+1)/n" },
                  { key: "pow_two", label: "2ⁿ" },
                ]}
                value={multType}
                onChange={(val) =>
                  setMultType(val as "n_over_n1" | "n1_over_n" | "pow_two")
                }
              />
            </LeftPanelSection>
          )}

          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块实时观察构造演变"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={() => {
                const found = currentPresets.find(
                  (p) => p.key === activePresetKey,
                );
                if (found) {
                  setParams((prev) => ({ ...prev, ...found.params }));
                } else {
                  setParams({ ...defaultParams });
                }
              }}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 中屏核心数学递推与构造方程实时看板 */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm max-w-[90%] overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <div className="text-[11px] font-semibold text-neutral-500 mb-0.5 flex items-center gap-1">
              <span>📐 核心递推与构造方程</span>
            </div>
            <KatexFormula
              formula={headerFormulaLatex}
              mode="inline"
              className="!text-sm font-medium"
            />
          </div>

          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <RecurrenceScene
              params={params}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              recurrenceModelType={recurrenceModelType}
              accumFnType={accumFnType}
              multType={multType}
              highlightN={highlightN}
              onSelectN={setHighlightN}
              xStep={xStep}
              yStep={yStep}
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
          title="递推与构造法看板"
        />
      }
    />
  );
}
