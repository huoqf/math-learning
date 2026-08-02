import { j as jsxRuntimeExports, r as reactExports } from "./index-DT9BKSox.js";
import { c as CANVAS_COLORS, w as withAlpha, b as MATH_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import "./useRadioGroup-DJLu5uAU.js";
const defaultParams = {
  // 二项分布参数 X ~ B(n, p)
  n: 5,
  p: 0.4,
  // 超几何分布参数 X ~ H(N, M, sampleN)
  N: 10,
  M: 4,
  sampleN: 3,
  // 线性变换 Y = aX + b
  linearA: 2,
  linearB: 1,
  // 一般分布概率分配权重
  p1: 0.2,
  p2: 0.4,
  p3: 0.3,
  p4: 0.1
};
const paramMeta = {
  n: {
    key: "n",
    label: "试验次数 n",
    labelFormula: "n",
    defaultValue: 5,
    min: 1,
    max: 15,
    step: 1,
    description: "独立重复试验的总次数 n",
    descriptionFormula: "X \\sim B(\\color{#EF4444}{n}, p)",
    importance: "core"
  },
  p: {
    key: "p",
    label: "成功概率 p",
    labelFormula: "p",
    defaultValue: 0.4,
    min: 0.05,
    max: 0.95,
    step: 0.05,
    description: "单次试验成功的概率 p",
    descriptionFormula: "P(A) = \\color{#D97706}{p}",
    importance: "core"
  },
  N: {
    key: "N",
    label: "总体容量 N",
    labelFormula: "N",
    defaultValue: 10,
    min: 5,
    max: 30,
    step: 1,
    description: "不放回抽样的总体元素总数 N",
    descriptionFormula: "N \\text{ 为总体总数}",
    importance: "core"
  },
  M: {
    key: "M",
    label: "特征数 M",
    labelFormula: "M",
    defaultValue: 4,
    min: 1,
    max: 30,
    step: 1,
    description: "总体中目标特征元素的数量 M",
    descriptionFormula: "M \\le N",
    importance: "core"
  },
  sampleN: {
    key: "sampleN",
    label: "抽取样本数 n",
    labelFormula: "n_{抽}",
    defaultValue: 3,
    min: 1,
    max: 30,
    step: 1,
    description: "不放回抽取的样本个数 n",
    descriptionFormula: "n \\le N \\text{ 且 } k \\le \\min(n, M)",
    importance: "core"
  },
  linearA: {
    key: "linearA",
    label: "缩放因子 a",
    labelFormula: "a",
    defaultValue: 2,
    min: -3,
    max: 4,
    step: 0.5,
    description: "随机变量的倍数缩放系数 a",
    descriptionFormula: "E(aX+b) = \\color{#EF4444}{a} E(X) + b",
    importance: "core",
    marks: [
      { value: 0, label: "a=0", labelFormula: "a=0" },
      { value: 1, label: "a=1", labelFormula: "a=1" }
    ]
  },
  linearB: {
    key: "linearB",
    label: "平移量 b",
    labelFormula: "b",
    defaultValue: 1,
    min: -4,
    max: 5,
    step: 0.5,
    description: "随机变量的加性平移常数 b",
    descriptionFormula: "D(aX+b) = a^2 D(X)",
    importance: "core"
  },
  p1: {
    key: "p1",
    label: "P(X=0)",
    labelFormula: "P(X=0)",
    defaultValue: 0.2,
    min: 0,
    max: 0.8,
    step: 0.05,
    description: "随机变量取 0 的概率",
    descriptionFormula: "p_0",
    importance: "display"
  },
  p2: {
    key: "p2",
    label: "P(X=1)",
    labelFormula: "P(X=1)",
    defaultValue: 0.4,
    min: 0,
    max: 0.8,
    step: 0.05,
    description: "随机变量取 1 的概率",
    descriptionFormula: "p_1",
    importance: "display"
  },
  p3: {
    key: "p3",
    label: "P(X=2)",
    labelFormula: "P(X=2)",
    defaultValue: 0.3,
    min: 0,
    max: 0.8,
    step: 0.05,
    description: "随机变量取 2 的概率",
    descriptionFormula: "p_2",
    importance: "display"
  },
  p4: {
    key: "p4",
    label: "P(X=3)",
    labelFormula: "P(X=3)",
    defaultValue: 0.1,
    min: 0,
    max: 0.8,
    step: 0.05,
    description: "随机变量取 3 的概率",
    descriptionFormula: "p_3",
    importance: "display"
  }
};
function combinations(n, k) {
  if (k < 0 || k > n || n < 0) return 0;
  if (k === 0 || k === n) return 1;
  let res = 1;
  const m = Math.min(k, n - k);
  for (let i = 1; i <= m; i++) {
    res = res * (n - i + 1) / i;
  }
  return res;
}
function computeBinomialDistribution(n, p) {
  if (n < 1 || n > 50 || p < 0 || p > 1) {
    return {
      outcomes: [],
      mean: 0,
      variance: 0,
      stdDev: 0,
      sumP: 0,
      modeX: [],
      maxP: 0,
      isValid: false,
      invalidReason: "参数不合法：需满足 1 <= n <= 50, 0 <= p <= 1"
    };
  }
  const outcomes = [];
  let sumP = 0;
  let maxP = -1;
  for (let k = 0; k <= n; k++) {
    const pk = combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    outcomes.push({ x: k, p: pk, label: `${k}` });
    sumP += pk;
    if (pk > maxP) maxP = pk;
  }
  const mean = n * p;
  const variance = n * p * (1 - p);
  const stdDev = Math.sqrt(Math.max(0, variance));
  const modeX = outcomes.filter((o) => Math.abs(o.p - maxP) < 1e-7).map((o) => o.x);
  return {
    outcomes,
    mean,
    variance,
    stdDev,
    sumP,
    modeX,
    maxP,
    isValid: true
  };
}
function computeHypergeometricDistribution(N, M, n) {
  if (N < 1 || M < 0 || M > N || n < 1 || n > N) {
    return {
      outcomes: [],
      mean: 0,
      variance: 0,
      stdDev: 0,
      sumP: 0,
      modeX: [],
      maxP: 0,
      isValid: false,
      invalidReason: "退化警示：需满足 1 <= N, 0 <= M <= N, 1 <= n <= N"
    };
  }
  const minK = Math.max(0, n - (N - M));
  const maxK = Math.min(n, M);
  const outcomes = [];
  let sumP = 0;
  let maxP = -1;
  const totalWays = combinations(N, n);
  for (let k = 0; k <= n; k++) {
    let pk = 0;
    if (k >= minK && k <= maxK && totalWays > 0) {
      pk = combinations(M, k) * combinations(N - M, n - k) / totalWays;
    }
    outcomes.push({ x: k, p: pk, label: `${k}` });
    sumP += pk;
    if (pk > maxP) maxP = pk;
  }
  const mean = n * M / N;
  let variance = 0;
  if (N > 1) {
    variance = n * (M / N) * (1 - M / N) * ((N - n) / (N - 1));
  }
  const stdDev = Math.sqrt(Math.max(0, variance));
  const modeX = outcomes.filter((o) => Math.abs(o.p - maxP) < 1e-7).map((o) => o.x);
  return {
    outcomes,
    mean,
    variance,
    stdDev,
    sumP,
    modeX,
    maxP,
    isValid: true
  };
}
function computeGeneralDiscreteDistribution(outcomesInput) {
  if (!outcomesInput || outcomesInput.length === 0) {
    return {
      outcomes: [],
      mean: 0,
      variance: 0,
      stdDev: 0,
      sumP: 0,
      modeX: [],
      maxP: 0,
      isValid: false,
      invalidReason: "离散分布列为空"
    };
  }
  let totalWeight = outcomesInput.reduce((acc, o) => acc + Math.max(0, o.p), 0);
  if (totalWeight < 1e-9) totalWeight = 1;
  const normalizedOutcomes = outcomesInput.map((o) => ({
    x: o.x,
    p: Math.max(0, o.p) / totalWeight,
    label: o.label || `${o.x}`
  }));
  let sumP = 0;
  let mean = 0;
  let maxP = -1;
  normalizedOutcomes.forEach((o) => {
    sumP += o.p;
    mean += o.x * o.p;
    if (o.p > maxP) maxP = o.p;
  });
  let variance = 0;
  normalizedOutcomes.forEach((o) => {
    variance += Math.pow(o.x - mean, 2) * o.p;
  });
  const stdDev = Math.sqrt(Math.max(0, variance));
  const modeX = normalizedOutcomes.filter((o) => Math.abs(o.p - maxP) < 1e-7).map((o) => o.x);
  return {
    outcomes: normalizedOutcomes,
    mean,
    variance,
    stdDev,
    sumP: 1,
    modeX,
    maxP,
    isValid: true
  };
}
function computeLinearTransformedDistribution(baseResult, a, b) {
  const newOutcomes = baseResult.outcomes.map((o) => {
    const newX = a * o.x + b;
    return {
      x: Number(newX.toFixed(2)),
      p: o.p,
      label: `y=${newX.toFixed(1)}`
    };
  });
  const mean = a * baseResult.mean + b;
  const variance = a * a * baseResult.variance;
  const stdDev = Math.abs(a) * baseResult.stdDev;
  return {
    transformed: {
      outcomes: newOutcomes,
      mean,
      variance,
      stdDev,
      sumP: baseResult.sumP,
      modeX: baseResult.modeX.map((x) => a * x + b),
      maxP: baseResult.maxP,
      isValid: baseResult.isValid,
      invalidReason: baseResult.invalidReason
    },
    a,
    b
  };
}
function ProbabilityDistributionScene({
  distResult,
  transformedDist,
  studyMode,
  scale,
  fontScale,
  linearA = 2,
  linearB = 1
}) {
  const { outcomes, mean, stdDev, maxP } = distResult;
  const yTicks = [0.2, 0.4, 0.6, 0.8, 1];
  const yAxisZero = mathToDesign(0, 0, scale);
  const yAxisMax = mathToDesign(0, 1, scale);
  const xAxisMin = mathToDesign(-0.6, 0, scale);
  const xAxisMax = mathToDesign(15.6, 0, scale);
  const meanDesign = mathToDesign(mean, 0, scale);
  const sigmaMin = Math.max(-0.6, mean - stdDev);
  const sigmaMax = Math.min(15.6, mean + stdDev);
  const sigmaMinDesign = mathToDesign(sigmaMin, 0, scale);
  const sigmaMaxDesign = mathToDesign(sigmaMax, 0, scale);
  const halfBarWidthPx = 0.4 * scale.scaleX / 2;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "select-none", children: [
    yTicks.map((pVal) => {
      const linePos = mathToDesign(0, pVal, scale);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: xAxisMin.x - 12,
            y1: linePos.y,
            x2: xAxisMax.x + 24,
            y2: linePos.y,
            stroke: CANVAS_COLORS.grid,
            strokeDasharray: "4 4",
            strokeWidth: 1
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: xAxisMin.x - 18,
            y: linePos.y + fontScale(4),
            fill: CANVAS_COLORS.labelText,
            fontSize: fontScale(11),
            textAnchor: "end",
            fontWeight: "600",
            className: "font-mono",
            children: pVal.toFixed(1)
          }
        )
      ] }, `grid-y-${pVal}`);
    }),
    stdDev > 1e-3 && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "transition-all duration-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: sigmaMinDesign.x,
          y: yAxisMax.y - 12,
          width: Math.max(4, sigmaMaxDesign.x - sigmaMinDesign.x),
          height: Math.abs(yAxisZero.y - (yAxisMax.y - 12)),
          fill: withAlpha(MATH_COLORS.asymptote, 0.07),
          stroke: withAlpha(MATH_COLORS.asymptote, 0.35),
          strokeDasharray: "4 3",
          rx: 6
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: (sigmaMinDesign.x + sigmaMaxDesign.x) / 2,
          y: yAxisMax.y - 18,
          fill: MATH_COLORS.asymptote,
          fontSize: fontScale(10),
          textAnchor: "middle",
          fontWeight: "bold",
          children: [
            "σ 波动区间 [",
            (mean - stdDev).toFixed(2),
            ",",
            " ",
            (mean + stdDev).toFixed(2),
            "]"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: xAxisMin.x - 20,
        y1: yAxisZero.y,
        x2: xAxisMax.x + 35,
        y2: yAxisZero.y,
        stroke: CANVAS_COLORS.axis,
        strokeWidth: 2
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "polygon",
      {
        points: `${xAxisMax.x + 42},${yAxisZero.y} ${xAxisMax.x + 32},${yAxisZero.y - 4} ${xAxisMax.x + 32},${yAxisZero.y + 4}`,
        fill: CANVAS_COLORS.axis
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: xAxisMax.x + 48,
        y: yAxisZero.y + fontScale(4),
        fill: CANVAS_COLORS.labelText,
        fontSize: fontScale(12),
        fontWeight: "bold",
        children: "x"
      }
    ),
    outcomes.map((item, idx) => {
      const topPos = mathToDesign(item.x, item.p, scale);
      const bottomPos = mathToDesign(item.x, 0, scale);
      const barHeight = Math.abs(bottomPos.y - topPos.y);
      const isMax = Math.abs(item.p - maxP) < 1e-6 && item.p > 0;
      let barColor = MATH_COLORS.barFill;
      if (studyMode === "hypergeometric")
        barColor = MATH_COLORS.paramSecondary;
      if (isMax) barColor = MATH_COLORS.paramPrimary;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "group cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: topPos.x - halfBarWidthPx,
            y: topPos.y,
            width: halfBarWidthPx * 2,
            height: Math.max(barHeight, 2),
            fill: withAlpha(barColor, isMax ? 0.9 : 0.72),
            stroke: barColor,
            strokeWidth: isMax ? 2.2 : 1.5,
            rx: 4,
            className: "transition-all duration-300 group-hover:opacity-100"
          }
        ),
        item.p > 5e-4 && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: `translate(${topPos.x}, ${topPos.y - 8})`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: -19,
              y: -10,
              width: 38,
              height: 13,
              fill: CANVAS_COLORS.white,
              fillOpacity: 0.92,
              rx: 3
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: 0,
              y: 0,
              fill: isMax ? MATH_COLORS.paramPrimary : CANVAS_COLORS.labelText,
              fontSize: fontScale(10),
              textAnchor: "middle",
              fontWeight: isMax ? "bold" : "600",
              className: "font-mono",
              children: item.p.toFixed(3)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: bottomPos.x,
            y: bottomPos.y + fontScale(16),
            fill: CANVAS_COLORS.labelText,
            fontSize: fontScale(11),
            textAnchor: "middle",
            fontWeight: "600",
            children: item.x
          }
        )
      ] }, `bar-${item.x}-${idx}`);
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "transition-all duration-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: meanDesign.x,
          y1: yAxisMax.y - 4,
          x2: meanDesign.x,
          y2: yAxisZero.y,
          stroke: MATH_COLORS.tangentLine,
          strokeWidth: 2,
          strokeDasharray: "5 4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "polygon",
        {
          points: `${meanDesign.x},${yAxisZero.y + 2} ${meanDesign.x - 8},${yAxisZero.y + 14} ${meanDesign.x + 8},${yAxisZero.y + 14}`,
          fill: MATH_COLORS.tangentLine,
          stroke: CANVAS_COLORS.white,
          strokeWidth: 1.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: `translate(${meanDesign.x}, ${yAxisZero.y + 30})`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: -42,
            y: -12,
            width: 84,
            height: 22,
            fill: MATH_COLORS.tangentLine,
            rx: 4
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: 0,
            y: 3,
            fill: CANVAS_COLORS.white,
            fontSize: fontScale(11),
            textAnchor: "middle",
            fontWeight: "bold",
            children: [
              "E(X) = ",
              mean.toFixed(2)
            ]
          }
        )
      ] })
    ] }),
    studyMode === "linear" && transformedDist && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "transition-all duration-300", children: [
      distResult.outcomes.map((o, idx) => {
        const xPos = mathToDesign(o.x, 0, scale);
        const yMathVal = linearA * o.x + linearB;
        const yPos = mathToDesign(yMathVal, 0, scale);
        const topYPos = mathToDesign(yMathVal, o.p, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: xPos.x,
              y1: yAxisZero.y + 12,
              x2: yPos.x,
              y2: yAxisZero.y + 38,
              stroke: MATH_COLORS.paramSecondary,
              strokeWidth: 1.5,
              strokeDasharray: "3 3",
              className: "opacity-70 transition-all duration-300"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: yPos.x - halfBarWidthPx * 0.75,
              y: topYPos.y + 40,
              width: halfBarWidthPx * 1.5,
              height: Math.max(Math.abs(yAxisZero.y - topYPos.y), 2),
              fill: withAlpha(MATH_COLORS.paramSecondary, 0.2),
              stroke: MATH_COLORS.paramSecondary,
              strokeDasharray: "3 3",
              strokeWidth: 1.2,
              rx: 3,
              className: "transition-all duration-300"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: `translate(${yPos.x}, ${yAxisZero.y + 42})`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: -22,
                y: -8,
                width: 44,
                height: 15,
                fill: MATH_COLORS.paramSecondary,
                rx: 3
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: 0,
                y: 3,
                fill: CANVAS_COLORS.white,
                fontSize: fontScale(9),
                textAnchor: "middle",
                fontWeight: "bold",
                className: "font-mono",
                children: [
                  "y=",
                  yMathVal.toFixed(1)
                ]
              }
            )
          ] })
        ] }, `linear-map-${idx}`);
      }),
      (() => {
        const meanYVal = transformedDist.mean;
        const meanYPos = mathToDesign(meanYVal, 0, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "transition-all duration-300", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: meanYPos.x,
              y1: yAxisZero.y + 40,
              x2: meanYPos.x,
              y2: yAxisZero.y + 62,
              stroke: MATH_COLORS.paramPrimary,
              strokeWidth: 1.8,
              strokeDasharray: "4 3"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "polygon",
            {
              points: `${meanYPos.x},${yAxisZero.y + 62} ${meanYPos.x - 6},${yAxisZero.y + 70} ${meanYPos.x + 6},${yAxisZero.y + 70}`,
              fill: MATH_COLORS.paramPrimary
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: `translate(${meanYPos.x}, ${yAxisZero.y + 80})`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: -52,
                y: -9,
                width: 104,
                height: 18,
                fill: MATH_COLORS.paramPrimary,
                rx: 3
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: 0,
                y: 3,
                fill: CANVAS_COLORS.white,
                fontSize: fontScale(9.5),
                textAnchor: "middle",
                fontWeight: "bold",
                children: [
                  "E(Y) = ",
                  meanYVal.toFixed(2)
                ]
              }
            )
          ] })
        ] });
      })()
    ] })
  ] });
}
function ProbabilityDistributionAnimation() {
  const [studyMode, setStudyMode] = reactExports.useState("binomial");
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const handleParamChange = (key, value) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "N") {
        next.M = Math.min(next.M, value);
        next.sampleN = Math.min(next.sampleN, value);
      }
      return next;
    });
  };
  const handleReset = () => {
    setParams({ ...defaultParams });
  };
  const distResult = reactExports.useMemo(() => {
    if (studyMode === "binomial") {
      return computeBinomialDistribution(params.n, params.p);
    }
    if (studyMode === "hypergeometric") {
      return computeHypergeometricDistribution(
        params.N,
        params.M,
        params.sampleN
      );
    }
    if (studyMode === "linear") {
      return computeBinomialDistribution(params.n, params.p);
    }
    const sum3 = params.p1 + params.p2 + params.p3;
    const p0 = params.p1;
    const p1 = params.p2;
    const p2 = params.p3;
    const p3 = Math.max(0, Number((1 - sum3).toFixed(2)));
    return computeGeneralDiscreteDistribution([
      { x: 0, p: p0 },
      { x: 1, p: p1 },
      { x: 2, p: p2 },
      { x: 3, p: p3 }
    ]);
  }, [studyMode, params]);
  const transformedDist = reactExports.useMemo(() => {
    if (studyMode === "linear") {
      return computeLinearTransformedDistribution(
        distResult,
        params.linearA,
        params.linearB
      ).transformed;
    }
    return void 0;
  }, [studyMode, distResult, params.linearA, params.linearB]);
  const scale = useSceneScale({
    vp,
    xRange: [-1.2, 16.8],
    yRange: studyMode === "linear" ? [-0.92, 1.48] : [-0.35, 1.35],
    keepAspectRatio: false
  });
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-probability-distribution", params, {
      studyMode,
      distResult,
      transformedDist
    });
  }, [params, studyMode, distResult, transformedDist]);
  const paramConfigs = reactExports.useMemo(() => {
    const keysByMode = {
      binomial: ["n", "p"],
      hypergeometric: ["N", "M", "sampleN"],
      general: ["p1", "p2", "p3"],
      // 精简为前3项独立调节，第四项由公理自动闭合
      linear: ["n", "p", "linearA", "linearB"]
      // 线性变换模式: n∈[2,8] 支持 3~9 个节点演示
    };
    const keys = keysByMode[studyMode] || ["n", "p"];
    return keys.filter((key) => key in paramMeta).map((key) => {
      const meta = paramMeta[key];
      let maxVal = meta.max;
      let minVal = meta.min;
      if (studyMode === "linear" && key === "n") {
        minVal = 2;
        maxVal = 8;
      }
      if (studyMode === "hypergeometric" && (key === "M" || key === "sampleN")) {
        maxVal = Math.min(meta.max, params.N);
      }
      return {
        key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min: minVal,
        max: maxVal,
        step: meta.step ?? 0.1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks
      };
    });
  }, [params, studyMode]);
  const topFormulaLatex = reactExports.useMemo(() => {
    if (studyMode === "binomial") {
      return `X \\sim B(${params.n}, ${params.p}) \\quad P(X=k) = C_{${params.n}}^k (${params.p})^k (${(1 - params.p).toFixed(2)})^{${params.n}-k}`;
    }
    if (studyMode === "hypergeometric") {
      return `X \\sim H(${params.N}, ${params.M}, ${params.sampleN}) \\quad P(X=k) = \\frac{C_{${params.M}}^k C_{${params.N - params.M}}^{${params.sampleN}-k}}{C_{${params.N}}^{${params.sampleN}}}`;
    }
    if (studyMode === "linear") {
      const aStr = params.linearA === 1 ? "" : `${params.linearA}`;
      const bVal = params.linearB;
      const bStr = bVal > 0 ? ` + ${bVal}` : bVal < 0 ? ` - ${Math.abs(bVal)}` : "";
      const exprY = `Y = ${aStr}X${bStr}`;
      return `${exprY} \\implies E(Y) = ${params.linearA} E(X) ${bStr}, \\; D(Y) = ${params.linearA}^2 D(X)`;
    }
    return `\\sum_{i=0}^3 p_i = 1 \\quad E(X) = \\sum x_i p_i = ${distResult.mean.toFixed(
      2
    )}`;
  }, [studyMode, params, distResult]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "概率模型与性质",
            subtitle: "选择高中高考核心随机变量模型",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: [
                  { key: "binomial", label: "二项分布 B(n,p)" },
                  { key: "hypergeometric", label: "超几何分布 H(N,M,n)" },
                  { key: "general", label: "一般分布列" },
                  { key: "linear", label: "线性变换 Y=aX+b" }
                ],
                value: studyMode,
                onChange: (k) => setStudyMode(k),
                variant: "filled"
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "模型参数", subtitle: "拖动滑块调节分布参数", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: handleReset
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          LeftPanelSection,
          {
            title: "参数使用指南",
            subtitle: "模型参数含义与调节说明",
            children: [
              studyMode === "binomial" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50/80 border border-blue-200/90 rounded-xl p-3 text-xs text-blue-900 flex flex-col gap-1.5 shadow-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold flex items-center gap-1.5 text-blue-800", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⚙️" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "二项分布参数调节说明" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "leading-relaxed text-blue-800/90 list-disc list-inside space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                      "试验次数 ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "n", mode: "inline" })
                    ] }),
                    "：独立重复试验总次数，控制取值点个数",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "k \\in [0, n]", mode: "inline" }),
                    "。"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                      "成功概率 ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "p", mode: "inline" })
                    ] }),
                    "：调节 ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "p=0.5", mode: "inline" }),
                    " ",
                    "呈对称分布，",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "p<0.5", mode: "inline" }),
                    " ",
                    "概率集中在左侧，",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "p>0.5", mode: "inline" }),
                    " 集中在右侧。"
                  ] })
                ] })
              ] }),
              studyMode === "hypergeometric" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-indigo-50/80 border border-indigo-200/90 rounded-xl p-3 text-xs text-indigo-900 flex flex-col gap-1.5 shadow-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold flex items-center gap-1.5 text-indigo-800", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⚙️" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "超几何分布参数调节说明" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "leading-relaxed text-indigo-800/90 list-disc list-inside space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                      "总体数 ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "N", mode: "inline" }),
                      " & 特征数",
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "M", mode: "inline" })
                    ] }),
                    "：总体中目标元素的比例决定了概率集中区。"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                      "样本数",
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "n_{\\text{抽}}", mode: "inline" })
                    ] }),
                    "：控制抽取数量。滑块已开启联动防越界（自动限制",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "M, n \\le N", mode: "inline" }),
                    "）。"
                  ] })
                ] })
              ] }),
              studyMode === "general" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3 text-xs text-emerald-900 flex flex-col gap-1.5 shadow-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold flex items-center gap-1.5 text-emerald-800", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⚙️" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "一般分布列参数调节说明" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "leading-relaxed text-emerald-800/90 list-disc list-inside space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "前 3 项概率自由分配" }),
                    "：拖动",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "P_0, P_1, P_2", mode: "inline" }),
                    " ",
                    "滑块自定义分布形态。"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "自动闭合归一化" }),
                    "：第四项",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      KatexFormula,
                      {
                        formula: "P(X=3) = 1 - (P_0+P_1+P_2)",
                        mode: "inline"
                      }
                    ),
                    " ",
                    "自动算齐补余，恒满足概率和为 1。"
                  ] })
                ] })
              ] }),
              studyMode === "linear" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-purple-50/80 border border-purple-200/90 rounded-xl p-3 text-xs text-purple-900 flex flex-col gap-1.5 shadow-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold flex items-center gap-1.5 text-purple-800", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⚙️" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "线性变换参数调节说明" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "leading-relaxed text-purple-800/90 list-disc list-inside space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                      "基准参数 ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "n, p", mode: "inline" })
                    ] }),
                    "：控制原变量 ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "X", mode: "inline" }),
                    " ",
                    "的节点数与形态。"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                      "缩放 ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "a", mode: "inline" }),
                      " & 平移",
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "b", mode: "inline" })
                    ] }),
                    "：观察下轨道 ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: "Y=aX+b", mode: "inline" }),
                    " ",
                    "节点的伸缩拉伸与整体平移。"
                  ] })
                ] })
              ] })
            ]
          }
        )
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative bg-white overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-3 pointer-events-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-xl px-3.5 py-2 shadow-sm pointer-events-auto max-w-[62%]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: topFormulaLatex, mode: "inline" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-xl px-3 py-1.5 shadow-sm pointer-events-auto flex items-center gap-2 text-xs font-mono", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-neutral-500 font-bold", children: "高考公理校验:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-primary-700 font-bold", children: [
              "∑P = ",
              distResult.sumP.toFixed(3)
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-3 left-4 right-4 z-10 bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-xl p-2.5 shadow-md flex flex-col gap-1 max-h-[140px] transition-all", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] font-bold text-neutral-700 flex items-center justify-between px-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-primary-800 font-semibold flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-primary-600" }),
              studyMode === "linear" ? "高考规范矩阵表 (X → Y 线性变换对照表)" : "高考分布列规范矩阵表"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-neutral-400 font-normal", children: studyMode === "linear" ? "新变量 Y=aX+b 保持对应事件概率不变" : "X 与 P(X=x) 规范对应表" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto max-w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full text-center border-collapse bg-neutral-50/90 rounded border border-neutral-200 text-xs font-mono", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-2.5 py-0.5 border-r border-neutral-200 text-primary-700 font-bold", children: "x_i" }),
              distResult.outcomes.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "th",
                {
                  className: "px-2 py-0.5 border-r border-neutral-200 min-w-[32px]",
                  children: o.x
                },
                `th-x-${o.x}`
              ))
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
              studyMode === "linear" && /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-amber-50/70 text-amber-900 font-bold border-b border-neutral-200", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-2.5 py-0.5 font-bold text-amber-800 border-r border-neutral-200 bg-amber-100/60", children: "y_i" }),
                distResult.outcomes.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "td",
                  {
                    className: "px-2 py-0.5 border-r border-neutral-200 text-amber-900 font-bold",
                    children: (params.linearA * o.x + params.linearB).toFixed(1)
                  },
                  `td-y-${o.x}`
                ))
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-2.5 py-0.5 font-bold text-primary-700 border-r border-neutral-200 bg-neutral-100/50", children: "P_i" }),
                distResult.outcomes.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "td",
                  {
                    className: "px-2 py-0.5 border-r border-neutral-200 text-neutral-600 font-medium",
                    children: o.p.toFixed(3)
                  },
                  `td-p-${o.x}`
                ))
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              ProbabilityDistributionScene,
              {
                distResult,
                transformedDist,
                studyMode,
                scale,
                vp,
                fontScale: canvasSize.font,
                linearA: params.linearA,
                linearB: params.linearB
              }
            )
          }
        )
      ] }),
      right: /* @__PURE__ */ jsxRuntimeExports.jsx(
        MathPanel,
        {
          quantities: mathData.quantities,
          theorems: mathData.theorems,
          gaokaoPoints: mathData.gaokaoPoints,
          warnings: mathData.warnings,
          mnemonic: mathData.mnemonic,
          title: studyMode === "binomial" ? "二项分布 B(n,p) 指标看板" : studyMode === "hypergeometric" ? "超几何分布 H(N,M,n) 指标看板" : studyMode === "linear" ? "线性变换 Y=aX+b 指标看板" : "一般离散分布列指标看板"
        }
      )
    }
  );
}
export {
  ProbabilityDistributionAnimation
};
