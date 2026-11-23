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
  TipCard,
  StepNavigator,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale, useGaokaoView } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { fitSteppedViewRange } from "@/math/viewRange";
import { formatMathNumber } from "@/utils/mathFormat";
import { RecurrenceScene } from "./components/RecurrenceScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  RECURRENCE_PRESETS,
  LINEAR_RECURRENCE_ANSWER_STEPS,
  NEW_DEFINITION_ANSWER_STEPS,
  SN_MIXED_ANSWER_STEPS,
} from "@/data/registries/sequence";
import {
  calcLinearRecurrence,
  calcAccumulationRecurrence,
  calcMultiplicationRecurrence,
  calcNonHomogeneousExpRecurrence,
  calcReciprocalRecurrence,
  calcSecondOrderRecurrence,
  calcInductionVerification,
  calcSnMixedRecurrence,
  calcNewDefinitionSequence,
  type AccumulationFnType,
  type InductionClaimId,
  type SnMixedMode,
  type NewDefinitionType,
} from "@/math/sequence";

type RecurrenceModel =
  | "linear-pan"
  | "accumulation"
  | "multiplication"
  | "non-homogeneous"
  | "reciprocal"
  | "second-order"
  | "induction"
  | "sn-mixed"
  | "new-definition";

const KEYS_BY_MODEL: Record<RecurrenceModel, string[]> = {
  "linear-pan": ["a1", "p_rec", "q_rec", "N"],
  accumulation: ["a1", "stepParam", "N"],
  multiplication: ["a1", "N"],
  "non-homogeneous": ["a1", "p_rec", "q_rec", "r_rec", "N"],
  reciprocal: ["a1", "coefA", "coefB", "coefC", "N"],
  "second-order": ["a1", "a2", "p_rec", "q_rec", "N"],
  induction: ["a1", "stepParam", "N"],
  "sn-mixed": ["mixedP", "mixedC", "a1", "N"],
  "new-definition": ["a1", "p_rec", "q_rec", "N"],
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
  const isGaokao = useGaokaoView();
  const initialModel: RecurrenceModel = isGaokao
    ? "new-definition"
    : "linear-pan";
  const initialPreset = RECURRENCE_PRESETS[initialModel]?.[0];

  const [recurrenceModelType, setRecurrenceModelType] =
    useState<RecurrenceModel>(initialModel);
  const [activePresetKey, setActivePresetKey] = useState<string>(
    initialPreset?.key ?? "converge",
  );
  const [accumFnType, setAccumFnType] =
    useState<AccumulationFnType>("arithmetic");
  const [multType, setMultType] = useState<
    "n_over_n1" | "n1_over_n" | "pow_two"
  >("n_over_n1");
  const [highlightN, setHighlightN] = useState<number>(1);
  const [linearViewMode, setLinearViewMode] = useState<"shift" | "cobweb">(
    "shift",
  );
  const [activeStep, setActiveStep] = useState<number>(1);
  const [inductionClaim, setInductionClaim] =
    useState<InductionClaimId>("sum_odd");
  const [snMixedMode, setSnMixedMode] = useState<SnMixedMode>("sn_linear_an");
  const [newDefType, setNewDefType] = useState<NewDefinitionType>("diff_ratio");

  // 初始化参数
  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaultParams,
    ...(initialPreset?.params ?? {}),
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
  const mixedP = params.mixedP ?? 2;
  const mixedC = params.mixedC ?? -1;
  const N = Math.min(12, Math.max(4, Math.round(params.N ?? 6)));

  // 当前模型的经典预设列表
  const currentPresets = useMemo(() => {
    return RECURRENCE_PRESETS[recurrenceModelType] ?? [];
  }, [recurrenceModelType]);

  // 动态自适应计算最佳数学区间与刻度步长 (Nice-Number 算法)
  const { xRange, yRange, xStep, yStep, keepAspectRatio } = useMemo(() => {
    if (recurrenceModelType === "linear-pan") {
      if (linearViewMode === "cobweb") {
        // 蛛网图稳态分档视口（保持 1:1 对角线纵横比）：
        // 基准锁定 [-8, 8] × [-8, 8]，常规调参期间坐标轴绝对静止；
        // 纳入起始点 a1、不动点 c 与前 4 项核心迭代点，越界时按档位外扩（上限 3× 防发散爆表）。
        const fixedPt = p_rec !== 1 ? q_rec / (1 - p_rec) : null;
        const linearData = calcLinearRecurrence(
          a1,
          p_rec,
          q_rec,
          Math.min(N, 4),
        );
        const keyCoords: number[] = [a1];
        if (
          fixedPt !== null &&
          Number.isFinite(fixedPt) &&
          Math.abs(fixedPt) <= 24
        ) {
          keyCoords.push(fixedPt);
        }
        for (const t of linearData.terms) {
          if (Number.isFinite(t.an) && Math.abs(t.an) <= 24) {
            keyCoords.push(t.an);
          }
        }
        const diagPoints = keyCoords.map((v) => ({ x: v, y: v }));
        const vr = fitSteppedViewRange(diagPoints, {
          defaultXRange: [-8, 8],
          defaultYRange: [-8, 8],
          stepMultipliers: [1.5, 2, 3],
          maxExpandFactor: 3,
          minPadding: 1,
        });
        const cobwebStep = calcNiceStep(vr.xRange[1] - vr.xRange[0], 8);

        return {
          xRange: vr.xRange,
          yRange: vr.yRange,
          xStep: cobwebStep,
          yStep: cobwebStep,
          keepAspectRatio: true,
        };
      } else {
        // 平移构造双轴图模式：x 为项数 [0, N + 0.8]，y 涵盖原数列 an 与辅助等比数列 bn
        const linearData = calcLinearRecurrence(a1, p_rec, q_rec, N);
        const allY = [
          ...linearData.terms.map((t) => t.an),
          ...linearData.terms.map((t) => t.bn),
          ...(linearData.fixedPoint !== null ? [linearData.fixedPoint] : []),
          0,
        ].filter(Number.isFinite);

        let minY = Math.min(...allY);
        let maxY = Math.max(...allY);
        if (maxY - minY < 4) maxY = minY + 4;

        let visualMaxY = maxY;
        if (visualMaxY > 60) {
          const sortedY = [...allY].sort((a, b) => a - b);
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
          xRange: [-0.6, N + 0.8] as [number, number],
          yRange: yR,
          xStep: 1,
          yStep: yS,
          keepAspectRatio: false,
        };
      }
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
    } else if (recurrenceModelType === "sn-mixed") {
      const res = calcSnMixedRecurrence(snMixedMode, mixedP, mixedC, a1, N);
      allY.push(...res.terms.map((t) => t.an));
    } else if (recurrenceModelType === "new-definition") {
      const res = calcNewDefinitionSequence(newDefType, a1, p_rec, q_rec, N);
      allY.push(
        ...res.terms.map((t) => t.an),
        ...res.terms
          .map((t) => t.derived)
          .filter((v): v is number => v !== null),
      );
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
    linearViewMode,
    a1,
    p_rec,
    q_rec,
    r_rec,
    stepParam,
    a2,
    coefA,
    coefB,
    coefC,
    mixedP,
    mixedC,
    snMixedMode,
    newDefType,
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
        inductionClaim,
        snMixedMode,
        newDefType,
        highlightN,
      }),
    [
      params,
      recurrenceModelType,
      accumFnType,
      multType,
      inductionClaim,
      snMixedMode,
      newDefType,
      highlightN,
    ],
  );

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return KEYS_BY_MODEL[recurrenceModelType]
      .filter((key) => {
        if (
          recurrenceModelType === "accumulation" &&
          accumFnType === "telescoping" &&
          key === "stepParam"
        ) {
          return false;
        }
        if (
          recurrenceModelType === "sn-mixed" &&
          snMixedMode === "sn_linear_an" &&
          key === "a1"
        ) {
          return false;
        }
        if (
          recurrenceModelType === "new-definition" &&
          newDefType === "bounded_period" &&
          (key === "p_rec" || key === "q_rec")
        ) {
          return false;
        }
        if (
          recurrenceModelType === "new-definition" &&
          newDefType === "alt_sum_arith" &&
          key === "p_rec"
        ) {
          return false;
        }
        return key in paramMeta;
      })
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
  }, [params, recurrenceModelType, accumFnType, snMixedMode, newDefType]);

  // 切换主模型时，自动加载该模型的第一个经典母题预设
  const handleModelChange = (model: RecurrenceModel) => {
    setRecurrenceModelType(model);
    setHighlightN(1);
    setActiveStep(1);
    setLinearViewMode("shift");
    setSnMixedMode("sn_linear_an");
    setNewDefType("diff_ratio");
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
    if (recurrenceModelType === "sn-mixed") {
      setSnMixedMode(
        presetKey === "an1-sn-split" ? "an1_linear_sn" : "sn_linear_an",
      );
    } else if (recurrenceModelType === "new-definition") {
      if (
        presetKey === "diff-ratio" ||
        presetKey === "alt-sum-arith" ||
        presetKey === "bounded-period"
      ) {
        const map: Record<string, NewDefinitionType> = {
          "diff-ratio": "diff_ratio",
          "alt-sum-arith": "alt_sum_arith",
          "bounded-period": "bounded_period",
        };
        setNewDefType(map[presetKey]);
      }
    }
    const found = currentPresets.find((p) => p.key === presetKey);
    if (found) {
      setParams((prev) => ({
        ...prev,
        ...found.params,
      }));
    }
  };

  const fmtSigned = (v: number) =>
    v >= 0 ? `+ ${formatMathNumber(v)}` : `- ${formatMathNumber(Math.abs(v))}`;

  // 中屏顶部核心递推与构造方程 KaTeX 表达式
  const headerFormulaLatex = useMemo(() => {
    if (recurrenceModelType === "linear-pan") {
      const fixedPoint =
        Math.abs(p_rec - 1) < 1e-9 ? null : q_rec / (1 - p_rec);
      const qTerm = fmtSigned(q_rec);
      if (fixedPoint !== null) {
        const cMinus =
          fixedPoint >= 0
            ? `- ${formatMathNumber(fixedPoint, 2)}`
            : `+ ${formatMathNumber(Math.abs(fixedPoint), 2)}`;
        return `a_{n+1} = \\color{${MATH_COLORS.paramPrimary}}{${formatMathNumber(p_rec)}} a_n ${qTerm} \\iff a_{n+1} ${cMinus} = \\color{${MATH_COLORS.paramPrimary}}{${formatMathNumber(p_rec)}}(a_n ${cMinus})`;
      }
      return `a_{n+1} = a_n ${qTerm} \\quad (p=1 \\text{ 退化等差})`;
    }
    if (recurrenceModelType === "non-homogeneous") {
      if (Math.abs(p_rec - r_rec) < 1e-9) {
        return `a_{n+1} = ${formatMathNumber(p_rec)} a_n + ${formatMathNumber(q_rec)} \\cdot ${r_rec}^n \\iff \\frac{a_{n+1}}{${r_rec}^{n+1}} = \\frac{a_n}{${r_rec}^n} + \\frac{${formatMathNumber(q_rec)}}{${r_rec}} \\quad (\\text{共振等差})`;
      }
      return `a_{n+1} = \\color{${MATH_COLORS.paramPrimary}}{${formatMathNumber(p_rec)}} a_n ${fmtSigned(q_rec)} \\cdot \\color{${MATH_COLORS.paramTertiary}}{${r_rec}}^n \\iff \\frac{a_{n+1}}{${r_rec}^{n+1}} = \\frac{${formatMathNumber(p_rec)}}{${r_rec}} \\cdot \\frac{a_n}{${r_rec}^n} + \\frac{${formatMathNumber(q_rec)}}{${r_rec}}`;
    }
    if (recurrenceModelType === "second-order") {
      const delta = p_rec * p_rec + 4 * q_rec;
      const pTerm = `${formatMathNumber(p_rec)} a_{n+1}`;
      const qTerm =
        q_rec >= 0
          ? `+ ${formatMathNumber(q_rec)} a_n`
          : `- ${formatMathNumber(Math.abs(q_rec))} a_n`;
      if (delta < 0) {
        return `a_{n+2} = ${pTerm} ${qTerm} \\quad (\\Delta = ${formatMathNumber(delta, 2)} < 0，\\text{降阶等比不适用})`;
      }
      const r1 = (p_rec + Math.sqrt(delta)) / 2;
      const r2 = (p_rec - Math.sqrt(delta)) / 2;
      const r1Str = formatMathNumber(r1, 2);
      const r2Str =
        r2 < 0 ? `(${formatMathNumber(r2, 2)})` : formatMathNumber(r2, 2);
      const subR1 =
        r1 >= 0 ? `- ${r1Str}` : `+ ${formatMathNumber(Math.abs(r1), 2)}`;
      return `a_{n+2} = ${pTerm} ${qTerm} \\iff a_{n+2} ${subR1} a_{n+1} = ${r2Str}(a_{n+1} ${subR1} a_n)`;
    }
    if (recurrenceModelType === "accumulation") {
      const fnStr =
        accumFnType === "arithmetic"
          ? `${formatMathNumber(stepParam)}n`
          : accumFnType === "geometric"
            ? `${formatMathNumber(stepParam)}^n`
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
      return `a_{n+1} = \\frac{${formatMathNumber(coefA)}a_n}{${formatMathNumber(coefB)}a_n ${fmtSigned(coefC)}} \\iff \\frac{1}{a_{n+1}} = \\frac{${formatMathNumber(coefC)}}{${formatMathNumber(coefA)}} \\cdot \\frac{1}{a_n} ${coefB >= 0 ? "+" : "-"} \\frac{${formatMathNumber(Math.abs(coefB))}}{${formatMathNumber(coefA)}}`;
    }
    if (recurrenceModelType === "induction") {
      return calcInductionVerification(inductionClaim, {
        a1,
        d: stepParam,
        N,
      }).claimLatex;
    }
    if (recurrenceModelType === "sn-mixed") {
      const cTerm = fmtSigned(mixedC);
      return snMixedMode === "sn_linear_an"
        ? `S_n = ${formatMathNumber(mixedP)}a_n ${cTerm} \\implies (n \\ge 2)\\; a_n = \\frac{${formatMathNumber(mixedP)}}{${formatMathNumber(mixedP)}-1} a_{n-1}`
        : `a_{n+1} = ${formatMathNumber(mixedP)}S_n ${cTerm} \\implies (n \\ge 2)\\; a_{n+1} = (${formatMathNumber(mixedP)}+1)a_n`;
    }
    if (recurrenceModelType === "new-definition") {
      return newDefType === "diff_ratio"
        ? `a_{n+1} = ${formatMathNumber(p_rec)}a_n ${fmtSigned(q_rec)} \\implies \\Delta a_{n+1} = ${formatMathNumber(p_rec)} \\Delta a_n`
        : newDefType === "alt_sum_arith"
          ? `a_n + a_{n+1} = 2n ${fmtSigned(q_rec)} \\implies a_{n+2} - a_n = 2`
          : `a_{n+1} = \\frac{1}{1 - a_n} \\implies a_{n+3} = a_n\\; (3\\text{-周期有界})`;
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
    mixedP,
    mixedC,
    snMixedMode,
    newDefType,
    accumFnType,
    multType,
    inductionClaim,
    a1,
    N,
  ]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const tipConfig = useMemo(() => {
    const a1v = params.a1 ?? 1;
    const N = Math.min(12, Math.max(4, Math.round(params.N ?? 6)));
    const common = `初始项 $a_1 = ${a1v}$，考察前 $N = ${N}$ 项的通项演化。`;
    switch (recurrenceModelType) {
      case "linear-pan":
        if (linearViewMode === "cobweb") {
          return {
            variant: "accent" as const,
            badge: "选学拓展 · 蛛网图与不动点动力系统",
            background:
              "【近代数学观点】利用函数图象 $y = px+q$ 与恒等线 $y = x$ 的阶梯与螺旋迭代，直观定性判定不动点吸引与发散逃逸。",
            condition: `初始项 $a_1 = ${formatMathNumber(a1v)}$，递推函数 $f(x) = ${formatMathNumber(p_rec)}x ${fmtSigned(q_rec)}$，迭代考察前 $N = ${N}$ 项。`,
            question:
              "当 $|p| < 1$ 时折线如何向不动点迭代收敛？当 $|p| > 1$ 时为何发散逃逸？它如何解释待定系数法不动点方程 $c = pc+q$ 的几何本质？",
          };
        }
        return {
          variant: "primary" as const,
          badge: "核心基准 · 待定系数构造等比",
          background:
            "【真实情境建模】新高考常以药物代谢补充、房贷等额本息或差分新定义为背景，前后项满足一阶线性递推。",
          condition: `初始项 $a_1 = ${formatMathNumber(a1v)}$，前 $N = ${N}$ 项演化，递推式 $a_{n+1} = ${formatMathNumber(p_rec)}a_n ${fmtSigned(q_rec)}$。`,
          question:
            "能否找到基准平移量 $c$ 使 $a_{n+1}-c = p(a_n-c)$？如何规范写出证明步并求得 $a_n$？",
        };
      case "non-homogeneous":
        return {
          variant: "info" as const,
          badge: "进阶构造 · 指数非齐次同除",
          condition:
            common +
            ` 递推式 $a_{n+1} = ${formatMathNumber(p_rec)}a_n ${fmtSigned(q_rec)} \\cdot ${r_rec}^n$。`,
          question:
            "两边同除以 $r^{n+1}$ 能否转为关于辅助数列 $\\frac{a_n}{r^n}$ 的一阶线性递推？当 $r = p$ 时为何呈现等差递推？",
        };
      case "second-order":
        return {
          variant: "accent" as const,
          badge: "选学拓展 · 二阶线性递推",
          condition: `初始项 $a_1 = ${formatMathNumber(a1v)}$，$a_2 = ${formatMathNumber(a2)}$，递推式 $a_{n+2} = ${formatMathNumber(p_rec)}a_{n+1} ${fmtSigned(q_rec)}a_n$。`,
          question:
            "对应二次方程 $x^2 - px - q = 0$ 的实根结构如何决定辅助等比数列 $b_n = a_{n+1} - r_1 a_n$ 的构造？",
        };
      case "accumulation":
        return {
          variant: "success" as const,
          badge: "累加叠代 · 累加法求通项",
          condition:
            common +
            " 递推式 $a_{n+1} - a_n = f(n)$，其中 $f(n)$ 为等差、等比或裂项形式。",
          question:
            "将相邻差分式从 $n=1$ 到 $n-1$ 逐项累加，中间项如何对消？求和公式如何给出通项 $a_n$？",
        };
      case "multiplication":
        return {
          variant: "warning" as const,
          badge: "连乘约分 · 累乘法求通项",
          condition:
            common +
            " 比值递推 $\\frac{a_{n+1}}{a_n} = f(n)$，其中 $f(n)$ 可逐项约分相消。",
          question:
            "相邻比值逐项连乘，中间分子分母如何交替对消？由此如何求得通项 $a_n$？",
        };
      case "reciprocal":
        return {
          variant: "info" as const,
          badge: "倒置转化 · 分式递推构造",
          condition:
            common + " 分式递推 $a_{n+1} = \\frac{A a_n}{B a_n + C}$。",
          question:
            "对递推式两边同取倒数，能否转化为关于辅助数列 $b_n = \\frac{1}{a_n}$ 的线性递推并求出通项？",
        };
      case "induction":
        return {
          variant: "accent" as const,
          badge: "选学拓展 · 数学归纳法两步框架",
          background:
            "数学归纳法是课标星号选学内容，但在数列证明题中反复出现：凡是「对一切正整数 $n$ 成立」的命题，标准证法就是它。",
          condition: `当前命题为 $${calcInductionVerification(inductionClaim, { a1: a1v, d: stepParam, N }).claimLatex}$，考察 $n=1$ 至 $n=${N}$ 是否成立。`,
          question:
            "第一步把 $P(1)$ 验算成立之后，为什么还必须证明「$P(k)$ 成立能推出 $P(k+1)$ 成立」？只验算前若干项为什么不算证明？",
        };
      case "sn-mixed":
        return {
          variant: "warning" as const,
          badge: "高频大题 · Sn 与 an 混合作差消元",
          background:
            "选择性必修二高频大题第一问：已知前 $n$ 项和 $S_n$ 与通项 $a_n$ 的线性关系，须作差消去 $S_n$ 并检验首项。",
          condition:
            snMixedMode === "sn_linear_an"
              ? `关系式 $S_n = ${formatMathNumber(mixedP)}a_n ${fmtSigned(mixedC)}$，考察前 $N = ${N}$ 项演化。`
              : `初始 $a_1 = ${formatMathNumber(a1v)}$，关系式 $a_{n+1} = ${formatMathNumber(mixedP)}S_n ${fmtSigned(mixedC)}$，考察前 $N = ${N}$ 项。`,
          question:
            "为什么 $a_n = S_n - S_{n-1}$ 仅对 $n \\ge 2$ 成立？如何判定真实首项是否能并入 $n \\ge 2$ 的等比通项？",
        };
      case "new-definition":
        return {
          variant: "primary" as const,
          badge: "压轴探究 · 新定义数列与派生性质",
          background:
            "新高考 19 题常引入陌生新定义约束，考查从前几项实验归纳、通过作差或迭代构造派生数列并证明周期/有界性。",
          condition:
            newDefType === "diff_ratio"
              ? `初始 $a_1 = ${formatMathNumber(a1v)}$，规则 $a_{n+1} = ${formatMathNumber(p_rec)}a_n ${fmtSigned(q_rec)}$，考察一阶差分 $\\Delta a_n$。`
              : newDefType === "alt_sum_arith"
                ? `初始 $a_1 = ${formatMathNumber(a1v)}$，邻项和满足 $a_n + a_{n+1} = 2n ${fmtSigned(q_rec)}$。`
                : `初始 $a_1 = ${formatMathNumber(a1v)}$，分式迭代 $a_{n+1} = \\frac{1}{1-a_n}$。`,
          question:
            "如何从新定义式出发构造派生数列 $b_n$，证明其等比、奇偶分流等差或 3-周期有界结论？",
        };
      default:
        return {
          variant: "primary" as const,
          badge: "递推构造求通项",
          condition: common,
          question:
            "改变首项与递推系数，求通项 $a_n$ 关于 $n$ 的表达式，并判断数列的单调性。",
        };
    }
    // 依赖中保留二级选项变量：TipCard 教学提示须随二级选项切换同步特化（项目纪律 left/tipcard-secondary-sync）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    recurrenceModelType,
    linearViewMode,
    activePresetKey,
    params.a1,
    params.a2,
    params.N,
    params.p_rec,
    params.q_rec,
    params.r_rec,
    params.coefA,
    params.coefB,
    params.coefC,
    params.mixedP,
    params.mixedC,
    snMixedMode,
    newDefType,
    inductionClaim,
    stepParam,
  ]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="递推与新定义模型">
            <SelectGrid
              columns={2}
              items={[
                {
                  key: "linear-pan",
                  label: "待定系数一阶线性",
                  description: "平移构造等比",
                  fullWidth: true,
                },
                {
                  key: "sn-mixed",
                  label: "Sn 与 an 混合消元",
                  description: "作差与首项分段",
                },
                {
                  key: "new-definition",
                  label: "新高考新定义探索",
                  description: "差分与周期有界",
                },
                {
                  key: "non-homogeneous",
                  label: "指数非齐次构造",
                  description: "同除指数化归",
                },
                {
                  key: "accumulation",
                  label: "累加法求通项",
                  description: "纵向叠加相消",
                },
                {
                  key: "multiplication",
                  label: "累乘法求通项",
                  description: "连乘交叉约分",
                },
                {
                  key: "reciprocal",
                  label: "倒数分式构造",
                  description: "取倒化归线性",
                },
                {
                  key: "second-order",
                  label: "二阶递推构造",
                  description: "选学拓展",
                },
                {
                  key: "induction",
                  label: "数学归纳法",
                  description: "选学两步证明",
                },
              ]}
              value={recurrenceModelType}
              onChange={(val) => handleModelChange(val as RecurrenceModel)}
            />
          </LeftPanelSection>

          {/* 经典母题预设 */}
          {currentPresets.length > 0 && (
            <LeftPanelSection title="经典母题预设">
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

          {/* 一阶线性递推 / Sn混合 / 新定义专属：标准解答分步走 */}
          {(recurrenceModelType === "linear-pan" ||
            recurrenceModelType === "sn-mixed" ||
            recurrenceModelType === "new-definition") && (
            <LeftPanelSection title="高考标准解答分步走">
              <StepNavigator
                steps={
                  recurrenceModelType === "linear-pan"
                    ? LINEAR_RECURRENCE_ANSWER_STEPS
                    : recurrenceModelType === "sn-mixed"
                      ? SN_MIXED_ANSWER_STEPS
                      : NEW_DEFINITION_ANSWER_STEPS
                }
                active={
                  recurrenceModelType === "linear-pan"
                    ? activeStep
                    : Math.min(3, activeStep)
                }
                onChange={setActiveStep}
                hint="右屏与中屏已同步聚焦该采分步"
              />
            </LeftPanelSection>
          )}

          {/* Sn 混合消元模式切换 */}
          {recurrenceModelType === "sn-mixed" && (
            <LeftPanelSection title="混合关系型态">
              <TabSwitcher
                tabs={[
                  { key: "sn_linear_an", label: "Sn = p·an + c" },
                  { key: "an1_linear_sn", label: "aₙ₊₁ = p·Sn + c" },
                ]}
                value={snMixedMode}
                onChange={(val) => {
                  const mode = val as SnMixedMode;
                  setSnMixedMode(mode);
                  setActivePresetKey(
                    mode === "an1_linear_sn"
                      ? "an1-sn-split"
                      : "sn-linear-merged",
                  );
                }}
              />
            </LeftPanelSection>
          )}

          {/* 新定义探索类型切换 */}
          {recurrenceModelType === "new-definition" && (
            <LeftPanelSection title="新定义约束规则">
              <TabSwitcher
                tabs={[
                  { key: "diff_ratio", label: "差分等比" },
                  { key: "alt_sum_arith", label: "邻和线性" },
                  { key: "bounded_period", label: "3-周期分式" },
                ]}
                value={newDefType}
                onChange={(val) => {
                  const mode = val as NewDefinitionType;
                  setNewDefType(mode);
                  const presetMap: Record<NewDefinitionType, string> = {
                    diff_ratio: "diff-ratio",
                    alt_sum_arith: "alt-sum-arith",
                    bounded_period: "bounded-period",
                  };
                  setActivePresetKey(presetMap[mode]);
                }}
              />
            </LeftPanelSection>
          )}

          {/* 累加法函数类型切换 */}
          {recurrenceModelType === "accumulation" && (
            <LeftPanelSection title="增量函数类型">
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

          {/* 数学归纳法命题切换 */}
          {recurrenceModelType === "induction" && (
            <LeftPanelSection title="归纳命题选择">
              <SelectGrid
                items={[
                  {
                    key: "sum_odd",
                    label: "奇数求和",
                    description: "1+3+…+(2n−1) = n²",
                    fullWidth: true,
                  },
                  {
                    key: "geo_sum",
                    label: "等比求和",
                    description: "1+2+…+2^(n−1) = 2^n − 1",
                    fullWidth: true,
                  },
                  {
                    key: "linear_term",
                    label: "等差通项",
                    description: "a_(n+1)=a_n+d ⟹ a_n=a₁+(n−1)d",
                    fullWidth: true,
                  },
                ]}
                value={inductionClaim}
                onChange={(val) => setInductionClaim(val as InductionClaimId)}
              />
            </LeftPanelSection>
          )}

          {/* 累乘法函数类型切换 */}
          {recurrenceModelType === "multiplication" && (
            <LeftPanelSection title="比值函数类型">
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

          <LeftPanelSection title="参数调节">
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

          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard
              variant={tipConfig.variant}
              badge={tipConfig.badge}
              background={tipConfig.background}
              condition={tipConfig.condition}
              question={tipConfig.question}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 独立顶部核心递推与构造方程看板（流式布局，彻底杜绝遮挡 SVG 左上角分步围栏） */}
          <div className="shrink-0 px-4 pt-3 pb-2 bg-white border-b border-neutral-100 flex items-center gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <span className="text-[11px] font-semibold text-neutral-500 shrink-0">
              📐 核心递推与构造方程
            </span>
            <KatexFormula
              formula={headerFormulaLatex}
              mode="inline"
              className="!text-sm font-medium"
            />
          </div>

          <div className="flex-1 min-h-0 relative">
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
                snMixedMode={snMixedMode}
                newDefType={newDefType}
                highlightN={highlightN}
                onSelectN={setHighlightN}
                xStep={xStep}
                yStep={yStep}
                activeStep={activeStep}
                linearViewMode={linearViewMode}
                inductionClaim={inductionClaim}
                onToggleLinearViewMode={() =>
                  setLinearViewMode((v) => (v === "shift" ? "cobweb" : "shift"))
                }
              />
            </AnimationSvgCanvas>
          </div>
        </div>
      }
      right={
        <MathPanel
          {...mathData}
          title="递推与构造法看板"
          focusStep={
            recurrenceModelType === "linear-pan"
              ? activeStep
              : recurrenceModelType === "sn-mixed" ||
                  recurrenceModelType === "new-definition"
                ? Math.min(3, activeStep)
                : undefined
          }
          focusTarget="reasoning"
        />
      }
    />
  );
}
