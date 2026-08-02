import { j as jsxRuntimeExports, r as reactExports } from "./index-DT9BKSox.js";
import { c as CANVAS_COLORS, b as MATH_COLORS, w as withAlpha, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { C as CoordinateGrid } from "./CoordinateGrid-fDHVDEJz.js";
import { F as FunctionGraph } from "./FunctionGraph-DziQOq7W.js";
import { V as VectorArrow } from "./VectorArrow-DV8pzlQL.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { I as InteractivePoint } from "./InteractivePoint-2lsgO1SM.js";
import { ay as calculateSumDiff, az as calculateDoubleAngle, aA as calculateAuxiliary, b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import "./useRadioGroup-DJLu5uAU.js";
const TrigFormulasScene = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale,
  studyMode,
  sumDiffKey,
  doubleAngleKey
}) => {
  const { alphaDeg, betaDeg, coeffA, coeffB } = params;
  const origin = mathToDesign(0, 0, scale);
  if (studyMode === "sum_diff") {
    const sumDiffData = calculateSumDiff(alphaDeg, betaDeg, sumDiffKey);
    const { alphaRad, cosAlpha, sinAlpha, cosBeta, sinBeta } = sumDiffData;
    const pointA = mathToDesign(cosAlpha, sinAlpha, scale);
    const pointB = mathToDesign(cosBeta, sinBeta, scale);
    const handleDragA = (pt) => {
      const angleRad = Math.atan2(pt.y, pt.x);
      let angleDeg = Math.round(angleRad * 180 / Math.PI);
      if (angleDeg < -180) angleDeg += 360;
      onParamChange("alphaDeg", angleDeg);
    };
    const handleDragB = (pt) => {
      const angleRad = Math.atan2(pt.y, pt.x);
      let angleDeg = Math.round(angleRad * 180 / Math.PI);
      if (angleDeg < -180) angleDeg += 360;
      onParamChange("betaDeg", angleDeg);
    };
    const projAx = mathToDesign(cosAlpha, 0, scale);
    const projAy = mathToDesign(0, sinAlpha, scale);
    const projBx = mathToDesign(cosBeta, 0, scale);
    const projBy = mathToDesign(0, sinBeta, scale);
    const pt1 = mathToDesign(1, 0, scale);
    const circleRadius = Math.abs(pt1.x - origin.x);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: origin.x,
          cy: origin.y,
          r: circleRadius,
          fill: "none",
          stroke: CANVAS_COLORS.axis,
          strokeWidth: 1.5,
          strokeDasharray: "4 4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: origin.x,
          y1: origin.y,
          x2: origin.x + circleRadius * 0.35 * Math.cos(alphaRad),
          y2: origin.y - circleRadius * 0.35 * Math.sin(alphaRad),
          stroke: MATH_COLORS.paramPrimary,
          strokeWidth: 1.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: pointA.x,
          y1: pointA.y,
          x2: projAx.x,
          y2: projAx.y,
          stroke: withAlpha(MATH_COLORS.paramPrimary, 0.4),
          strokeDasharray: "3 3"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: pointA.x,
          y1: pointA.y,
          x2: projAy.x,
          y2: projAy.y,
          stroke: withAlpha(MATH_COLORS.paramPrimary, 0.4),
          strokeDasharray: "3 3"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: pointB.x,
          y1: pointB.y,
          x2: projBx.x,
          y2: projBx.y,
          stroke: withAlpha(MATH_COLORS.paramSecondary, 0.4),
          strokeDasharray: "3 3"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: pointB.x,
          y1: pointB.y,
          x2: projBy.x,
          y2: projBy.y,
          stroke: withAlpha(MATH_COLORS.paramSecondary, 0.4),
          strokeDasharray: "3 3"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: pointA.x,
          y1: pointA.y,
          x2: pointB.x,
          y2: pointB.y,
          stroke: MATH_COLORS.primary,
          strokeWidth: 2,
          strokeDasharray: "5 5"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        VectorArrow,
        {
          from: [0, 0],
          to: [cosAlpha, sinAlpha],
          scale,
          color: MATH_COLORS.paramPrimary,
          strokeWidth: 2.5,
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        VectorArrow,
        {
          from: [0, 0],
          to: [cosBeta, sinBeta],
          scale,
          color: MATH_COLORS.paramSecondary,
          strokeWidth: 2.5,
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: cosAlpha,
          cy: sinAlpha,
          scale,
          vp,
          onDrag: handleDragA,
          color: MATH_COLORS.paramPrimary,
          label: "A(cos α, sin α)",
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: cosBeta,
          cy: sinBeta,
          scale,
          vp,
          onDrag: handleDragB,
          color: MATH_COLORS.paramSecondary,
          label: "B(cos β, sin β)",
          fontScale
        }
      )
    ] });
  }
  if (studyMode === "double_angle") {
    const doubleData = calculateDoubleAngle(alphaDeg, doubleAngleKey);
    const { sinAlpha, cosAlpha, sin2Alpha, cos2Alpha } = doubleData;
    const pointA = mathToDesign(cosAlpha, sinAlpha, scale);
    const pointDouble = mathToDesign(cos2Alpha, sin2Alpha, scale);
    const handleDragA = (pt) => {
      const angleRad = Math.atan2(pt.y, pt.x);
      let angleDeg = Math.round(angleRad * 180 / Math.PI);
      if (angleDeg < -180) angleDeg += 360;
      onParamChange("alphaDeg", angleDeg);
    };
    const pt1 = mathToDesign(1, 0, scale);
    const circleRadius = Math.abs(pt1.x - origin.x);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: origin.x,
          cy: origin.y,
          r: circleRadius,
          fill: "none",
          stroke: CANVAS_COLORS.axis,
          strokeWidth: 1.5,
          strokeDasharray: "4 4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        VectorArrow,
        {
          from: [0, 0],
          to: [cosAlpha, sinAlpha],
          scale,
          color: MATH_COLORS.paramPrimary,
          strokeWidth: 2.5,
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        VectorArrow,
        {
          from: [0, 0],
          to: [cos2Alpha, sin2Alpha],
          scale,
          color: MATH_COLORS.primary,
          strokeWidth: 2.5,
          fontScale
        }
      ),
      doubleAngleKey === "sin_2a" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: Math.min(origin.x, pointA.x),
          y: Math.min(origin.y, pointA.y),
          width: Math.abs(pointA.x - origin.x),
          height: Math.abs(pointA.y - origin.y),
          fill: withAlpha(MATH_COLORS.paramPrimary, 0.15),
          stroke: MATH_COLORS.paramPrimary,
          strokeDasharray: "3 3"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: cosAlpha,
          cy: sinAlpha,
          scale,
          vp,
          onDrag: handleDragA,
          color: MATH_COLORS.paramPrimary,
          label: "P(α)",
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: pointDouble.x,
          cy: pointDouble.y,
          r: 6,
          fill: MATH_COLORS.primary
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: pointDouble.x + 10,
          y: pointDouble.y - 10,
          fill: MATH_COLORS.primary,
          fontSize: fontScale(12),
          fontWeight: "bold",
          children: "P(2α)"
        }
      )
    ] });
  }
  const auxData = calculateAuxiliary(coeffA, coeffB);
  const { amplitude, isDegenerate } = auxData;
  const handleDragPointP = (pt) => {
    const clampedA = Math.max(-5, Math.min(5, Math.round(pt.x * 10) / 10));
    const clampedB = Math.max(-5, Math.min(5, Math.round(pt.y * 10) / 10));
    onParamChange("coeffA", clampedA);
    onParamChange("coeffB", clampedB);
  };
  const pointP = mathToDesign(coeffA, coeffB, scale);
  const fnSum = (x) => coeffA * Math.sin(x) + coeffB * Math.cos(x);
  const fnSinPart = (x) => coeffA * Math.sin(x);
  const fnCosPart = (x) => coeffB * Math.cos(x);
  const ampLineLeft = mathToDesign(-6, amplitude, scale);
  const ampLineRight = mathToDesign(6, amplitude, scale);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: fnSinPart,
        scale,
        color: withAlpha(MATH_COLORS.paramPrimary, 0.4),
        strokeWidth: 1.5
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: fnCosPart,
        scale,
        color: withAlpha(MATH_COLORS.paramSecondary, 0.4),
        strokeWidth: 1.5
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: fnSum,
        scale,
        color: MATH_COLORS.primary,
        strokeWidth: 3
      }
    ),
    !isDegenerate && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: origin.x,
          y1: origin.y,
          x2: pointP.x,
          y2: pointP.y,
          stroke: MATH_COLORS.primary,
          strokeWidth: 2
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: origin.x,
          y1: origin.y,
          x2: pointP.x,
          y2: origin.y,
          stroke: MATH_COLORS.paramPrimary,
          strokeWidth: 2,
          strokeDasharray: "4 4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: pointP.x,
          y1: origin.y,
          x2: pointP.x,
          y2: pointP.y,
          stroke: MATH_COLORS.paramSecondary,
          strokeWidth: 2,
          strokeDasharray: "4 4"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: coeffA,
        cy: coeffB,
        scale,
        vp,
        onDrag: handleDragPointP,
        color: MATH_COLORS.primary,
        label: `P(a=${coeffA}, b=${coeffB})`,
        fontScale
      }
    ),
    !isDegenerate && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: ampLineLeft.x,
        y1: ampLineLeft.y,
        x2: ampLineRight.x,
        y2: ampLineRight.y,
        stroke: withAlpha(MATH_COLORS.primary, 0.5),
        strokeDasharray: "3 3"
      }
    )
  ] });
};
const defaultParams = {
  alphaDeg: 45,
  betaDeg: 30,
  coeffA: 1,
  coeffB: 1.73
};
const paramMeta = {
  alphaDeg: {
    key: "alphaDeg",
    label: "角 α (°)",
    labelFormula: "\\color{#EF4444}{\\alpha}",
    min: -360,
    max: 360,
    step: 1,
    defaultValue: 45,
    importance: "core",
    description: "主控动角 α，决定向量 A(cos α, sin α) 或单角 x 的终边位置",
    descriptionFormula: "主控动角 $\\color{#EF4444}{\\alpha}$，决定向量 $A(\\cos\\alpha, \\sin\\alpha)$ 的终边",
    marks: [
      {
        value: 0,
        variant: "zero",
        label: "0°",
        labelFormula: "0^\\circ"
      },
      {
        value: 90,
        variant: "critical",
        label: "90°",
        labelFormula: "90^\\circ"
      },
      {
        value: 180,
        variant: "zero",
        label: "180°",
        labelFormula: "180^\\circ"
      }
    ]
  },
  betaDeg: {
    key: "betaDeg",
    label: "角 β (°)",
    labelFormula: "\\color{#D97706}{\\beta}",
    min: -360,
    max: 360,
    step: 1,
    defaultValue: 30,
    importance: "core",
    description: "次要动角 β，决定向量 B(cos β, sin β) 的终边位置",
    descriptionFormula: "次要动角 $\\color{#D97706}{\\beta}$，决定向量 $B(\\cos\\beta, \\sin\\beta)$ 的终边",
    marks: [
      {
        value: 0,
        variant: "zero",
        label: "0°",
        labelFormula: "0^\\circ"
      },
      {
        value: 90,
        variant: "critical",
        label: "90°",
        labelFormula: "90^\\circ"
      }
    ]
  },
  coeffA: {
    key: "coeffA",
    label: "系数 a",
    labelFormula: "\\color{#EF4444}{a}",
    min: -5,
    max: 5,
    step: 0.1,
    defaultValue: 1,
    importance: "core",
    description: "辅助角公式 a sin x + b cos x 中的正弦前系数 a",
    descriptionFormula: "辅助角化简 $\\color{#EF4444}{a}\\sin x + \\color{#D97706}{b}\\cos x$ 中正弦系数 $a$",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "0",
        labelFormula: "0"
      },
      {
        value: 1,
        label: "1",
        labelFormula: "1"
      }
    ]
  },
  coeffB: {
    key: "coeffB",
    label: "系数 b",
    labelFormula: "\\color{#D97706}{b}",
    min: -5,
    max: 5,
    step: 0.1,
    defaultValue: 1.73,
    importance: "core",
    description: "辅助角公式 a sin x + b cos x 中的余弦前系数 b",
    descriptionFormula: "辅助角化简 $\\color{#EF4444}{a}\\sin x + \\color{#D97706}{b}\\cos x$ 中余弦系数 $b$",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "0",
        labelFormula: "0"
      },
      {
        value: 1.73,
        label: "√3",
        labelFormula: "\\sqrt{3}"
      }
    ]
  }
};
function TrigFormulasAnimation() {
  const [studyMode, setStudyMode] = reactExports.useState("sum_diff");
  const [sumDiffKey, setSumDiffKey] = reactExports.useState("cos_minus");
  const [doubleAngleKey, setDoubleAngleKey] = reactExports.useState("sin_2a");
  const [params, setParams] = reactExports.useState(() => ({
    alphaDeg: defaultParams.alphaDeg,
    betaDeg: defaultParams.betaDeg,
    coeffA: defaultParams.coeffA,
    coeffB: defaultParams.coeffB
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scaleRanges = reactExports.useMemo(() => {
    if (studyMode === "auxiliary") {
      return { xRange: [-6, 6], yRange: [-5.5, 5.5] };
    }
    return { xRange: [-2, 2], yRange: [-1.5, 1.5] };
  }, [studyMode]);
  const scale = useSceneScale({
    vp,
    xRange: scaleRanges.xRange,
    yRange: scaleRanges.yRange
  });
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-trig-formulas", params, {
      studyMode,
      sumDiffKey,
      doubleAngleKey
    });
  }, [params, studyMode, sumDiffKey, doubleAngleKey]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };
  const handleReset = () => {
    setParams({
      alphaDeg: defaultParams.alphaDeg,
      betaDeg: defaultParams.betaDeg,
      coeffA: defaultParams.coeffA,
      coeffB: defaultParams.coeffB
    });
  };
  const paramConfigs = reactExports.useMemo(() => {
    const keysByMode = {
      sum_diff: ["alphaDeg", "betaDeg"],
      double_angle: ["alphaDeg"],
      auxiliary: ["coeffA", "coeffB"]
    };
    const activeKeys = keysByMode[studyMode] ?? ["alphaDeg"];
    return activeKeys.filter((key) => key in paramMeta).map((key) => {
      const meta = paramMeta[key];
      return {
        key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks
      };
    });
  }, [params, studyMode]);
  const headerFormulaLatex = reactExports.useMemo(() => {
    if (studyMode === "sum_diff") {
      const res = calculateSumDiff(params.alphaDeg ?? 45, params.betaDeg ?? 30, sumDiffKey);
      const valStr = res.isTanDefined ? res.resultVal.toFixed(3) : "\\text{无意义}";
      return `${res.formulaLatex} = ${valStr}`;
    } else if (studyMode === "double_angle") {
      const res = calculateDoubleAngle(params.alphaDeg ?? 45, doubleAngleKey);
      let valStr = "";
      if (doubleAngleKey === "sin_2a") valStr = res.sin2Alpha.toFixed(3);
      else if (doubleAngleKey === "cos_2a") valStr = res.cos2Alpha.toFixed(3);
      else if (doubleAngleKey === "tan_2a") valStr = res.isTanDefined && res.tan2Alpha !== void 0 ? res.tan2Alpha.toFixed(3) : "\\text{无意义}";
      else if (doubleAngleKey === "sin2_a") valStr = res.sinSqAlpha.toFixed(3);
      else if (doubleAngleKey === "cos2_a") valStr = res.cosSqAlpha.toFixed(3);
      return `${res.formulaLatex} = ${valStr}`;
    } else {
      const res = calculateAuxiliary(params.coeffA ?? 1, params.coeffB ?? 1.73);
      return res.formulaLatex;
    }
  }, [studyMode, sumDiffKey, doubleAngleKey, params.alphaDeg, params.betaDeg, params.coeffA, params.coeffB]);
  const panelTitle = reactExports.useMemo(() => {
    switch (studyMode) {
      case "sum_diff":
        return "两角和差公式看板";
      case "double_angle":
        return "倍角与升降幂公式看板";
      case "auxiliary":
        return "辅助角化简看板";
    }
  }, [studyMode]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "研究模式", subtitle: "选择三角恒等变换专题", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "sum_diff", label: "两角和差公式" },
              { key: "double_angle", label: "倍角与升降幂" },
              { key: "auxiliary", label: "辅助角化简" }
            ],
            value: studyMode,
            onChange: (k) => setStudyMode(k),
            variant: "filled"
          }
        ) }),
        studyMode === "sum_diff" && /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "和差公式分类", subtitle: "选择高考和差公式", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "cos_minus", label: "cos(α-β)", formula: "\\cos(\\alpha-\\beta)" },
              { key: "cos_plus", label: "cos(α+β)", formula: "\\cos(\\alpha+\\beta)" },
              { key: "sin_plus", label: "sin(α+β)", formula: "\\sin(\\alpha+\\beta)" },
              { key: "sin_minus", label: "sin(α-β)", formula: "\\sin(\\alpha-\\beta)" },
              { key: "tan_plus", label: "tan(α+β)", formula: "\\tan(\\alpha+\\beta)" },
              { key: "tan_minus", label: "tan(α-β)", formula: "\\tan(\\alpha-\\beta)" }
            ],
            value: sumDiffKey,
            onChange: (k) => setSumDiffKey(k),
            variant: "filled",
            color: "primary",
            columns: 2
          }
        ) }),
        studyMode === "double_angle" && /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "倍角与降幂公式", subtitle: "选择二倍角或降幂变形", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "sin_2a", label: "sin 2α", formula: "\\sin 2\\alpha" },
              { key: "cos_2a", label: "cos 2α", formula: "\\cos 2\\alpha" },
              { key: "tan_2a", label: "tan 2α", formula: "\\tan 2\\alpha" },
              { key: "sin2_a", label: "sin²α", formula: "\\sin^2\\alpha" },
              { key: "cos2_a", label: "cos²α", formula: "\\cos^2\\alpha" }
            ],
            value: doubleAngleKey,
            onChange: (k) => setDoubleAngleKey(k),
            variant: "filled",
            color: "primary",
            columns: 2
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "参数调节",
            subtitle: studyMode === "auxiliary" ? "拖动滑块改变系数 a, b 或在中屏直接拖拽 P 点" : "拖动滑块改变角 α, β 或在中屏拖拽 A, B 点",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              ParamControl,
              {
                params: paramConfigs,
                onParamChange: handleParamChange,
                onReset: handleReset
              }
            )
          }
        )
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: headerFormulaLatex, mode: "inline" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              TrigFormulasScene,
              {
                params,
                scale,
                vp,
                onParamChange: handleParamChange,
                fontScale: canvasSize.font,
                studyMode,
                sumDiffKey,
                doubleAngleKey
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
          title: panelTitle
        }
      )
    }
  );
}
export {
  TrigFormulasAnimation,
  TrigFormulasAnimation as default
};
