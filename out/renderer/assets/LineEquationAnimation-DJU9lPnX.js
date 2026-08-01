import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { b as MATH_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { T as TabSwitcher } from "./TabSwitcher-BlfhUjmU.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import { C as CoordinateGrid } from "./CoordinateGrid-BmMyIyOq.js";
import { I as InteractivePoint } from "./InteractivePoint-ZTf14j6W.js";
import { m as mathToDesign, d as designToMath } from "./coordinate-9upJ5J84.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import { ao as convertFormToGeneral, ap as getLineSegmentInBounds, aq as getLineProperties, ar as calcPointToLineDistance, as as calcTwoLinesRelation, b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import "./useRadioGroup-jCNJTR-s.js";
function useLineEquationScene({
  params,
  scale,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "forms",
  form = "general"
}) {
  const { A, B, C } = reactExports.useMemo(() => {
    if (studyMode === "forms" && form !== "general") {
      return convertFormToGeneral(form, params);
    }
    return {
      A: params.A ?? 1,
      B: params.B ?? -1,
      C: params.C ?? -1
    };
  }, [params, studyMode, form]);
  const bounds = reactExports.useMemo(
    () => ({
      xMin: scale.xMin,
      xMax: scale.xMax,
      yMin: scale.yMin,
      yMax: scale.yMax
    }),
    [scale]
  );
  const mainLineMath = reactExports.useMemo(
    () => getLineSegmentInBounds(A, B, C, bounds),
    [A, B, C, bounds]
  );
  const mainLineDesign = reactExports.useMemo(() => {
    if (!mainLineMath) return null;
    const p1 = mathToDesign(mainLineMath.p1.x, mainLineMath.p1.y, scale);
    const p2 = mathToDesign(mainLineMath.p2.x, mainLineMath.p2.y, scale);
    return { p1, p2 };
  }, [mainLineMath, scale]);
  const lineProps = reactExports.useMemo(() => getLineProperties(A, B, C), [A, B, C]);
  const x0 = params.x0 ?? 2;
  const y0 = params.y0 ?? 3;
  const pointPDesign = reactExports.useMemo(
    () => mathToDesign(x0, y0, scale),
    [x0, y0, scale]
  );
  const distanceResult = reactExports.useMemo(
    () => calcPointToLineDistance(x0, y0, A, B, C),
    [x0, y0, A, B, C]
  );
  const footDesign = reactExports.useMemo(
    () => mathToDesign(distanceResult.foot.x, distanceResult.foot.y, scale),
    [distanceResult.foot, scale]
  );
  const rightAnglePath = reactExports.useMemo(() => {
    if (!distanceResult.isValid || distanceResult.distance < 1e-4) return null;
    const Q = footDesign;
    const P = pointPDesign;
    const vLen = Math.hypot(P.x - Q.x, P.y - Q.y);
    if (vLen < 1e-4) return null;
    const vx = (P.x - Q.x) / vLen;
    const vy = (P.y - Q.y) / vLen;
    if (!mainLineDesign) return null;
    const dx = mainLineDesign.p2.x - mainLineDesign.p1.x;
    const dy = mainLineDesign.p2.y - mainLineDesign.p1.y;
    const uLen = Math.hypot(dx, dy);
    if (uLen < 1e-4) return null;
    let ux = dx / uLen;
    let uy = dy / uLen;
    const size = 12 * fontScale(1);
    const pt1 = { x: Q.x + size * ux, y: Q.y + size * uy };
    const pt2 = { x: Q.x + size * ux + size * vx, y: Q.y + size * uy + size * vy };
    const pt3 = { x: Q.x + size * vx, y: Q.y + size * vy };
    return `${pt1.x},${pt1.y} ${pt2.x},${pt2.y} ${pt3.x},${pt3.y}`;
  }, [footDesign, pointPDesign, mainLineDesign, distanceResult, fontScale]);
  const A2 = params.A2 ?? 1;
  const B2 = params.B2 ?? 1;
  const C2 = params.C2 ?? -2;
  const line2Math = reactExports.useMemo(
    () => getLineSegmentInBounds(A2, B2, C2, bounds),
    [A2, B2, C2, bounds]
  );
  const line2Design = reactExports.useMemo(() => {
    if (!line2Math) return null;
    const p1 = mathToDesign(line2Math.p1.x, line2Math.p1.y, scale);
    const p2 = mathToDesign(line2Math.p2.x, line2Math.p2.y, scale);
    return { p1, p2 };
  }, [line2Math, scale]);
  const twoLinesRelation = reactExports.useMemo(
    () => calcTwoLinesRelation(A, B, C, A2, B2, C2),
    [A, B, C, A2, B2, C2]
  );
  const intersectionDesign = reactExports.useMemo(() => {
    if (!twoLinesRelation.intersection) return null;
    return mathToDesign(
      twoLinesRelation.intersection.x,
      twoLinesRelation.intersection.y,
      scale
    );
  }, [twoLinesRelation.intersection, scale]);
  const lambda = params.lambda ?? 1;
  const familyLineCoeffs = reactExports.useMemo(() => {
    return {
      A: A + lambda * A2,
      B: B + lambda * B2,
      C: C + lambda * C2
    };
  }, [A, B, C, A2, B2, C2, lambda]);
  const familyLineMath = reactExports.useMemo(
    () => getLineSegmentInBounds(
      familyLineCoeffs.A,
      familyLineCoeffs.B,
      familyLineCoeffs.C,
      bounds
    ),
    [familyLineCoeffs, bounds]
  );
  const familyLineDesign = reactExports.useMemo(() => {
    if (!familyLineMath) return null;
    const p1 = mathToDesign(familyLineMath.p1.x, familyLineMath.p1.y, scale);
    const p2 = mathToDesign(familyLineMath.p2.x, familyLineMath.p2.y, scale);
    return { p1, p2 };
  }, [familyLineMath, scale]);
  const handlePointPDrag = reactExports.useCallback(
    (designPt) => {
      const mathPt = designToMath(designPt.x, designPt.y, scale);
      onParamChange("x0", Number(mathPt.x.toFixed(1)));
      onParamChange("y0", Number(mathPt.y.toFixed(1)));
    },
    [scale, onParamChange]
  );
  const labels = reactExports.useMemo(() => {
    const rawEntries = [];
    if (studyMode === "distance") {
      rawEntries.push({
        key: "P",
        text: `P(${x0.toFixed(1)}, ${y0.toFixed(1)})`,
        x: pointPDesign.x,
        y: pointPDesign.y,
        anchor: "start",
        dy: -14,
        priority: 3
      });
      if (distanceResult.isValid) {
        rawEntries.push({
          key: "Q",
          text: `Q(${distanceResult.foot.x.toFixed(1)}, ${distanceResult.foot.y.toFixed(1)})`,
          x: footDesign.x,
          y: footDesign.y,
          anchor: "start",
          dy: 16,
          priority: 2
        });
        const midX = (pointPDesign.x + footDesign.x) / 2;
        const midY = (pointPDesign.y + footDesign.y) / 2;
        rawEntries.push({
          key: "d",
          text: `d = ${distanceResult.distance.toFixed(2)}`,
          x: midX,
          y: midY,
          anchor: "middle",
          dy: -10,
          priority: 1
        });
      }
    } else if (studyMode === "forms") {
      if (lineProps.xIntercept !== null) {
        const pt = mathToDesign(lineProps.xIntercept, 0, scale);
        rawEntries.push({
          key: "xInt",
          text: `(${lineProps.xIntercept.toFixed(1)}, 0)`,
          x: pt.x,
          y: pt.y,
          anchor: "middle",
          dy: 16,
          priority: 2
        });
      }
      if (lineProps.yIntercept !== null) {
        const pt = mathToDesign(0, lineProps.yIntercept, scale);
        rawEntries.push({
          key: "yInt",
          text: `(0, ${lineProps.yIntercept.toFixed(1)})`,
          x: pt.x,
          y: pt.y,
          anchor: "start",
          dy: -10,
          priority: 2
        });
      }
    } else if (studyMode === "relation") {
      if (intersectionDesign) {
        rawEntries.push({
          key: "intersection",
          text: `交点 (${twoLinesRelation.intersection.x.toFixed(1)}, ${twoLinesRelation.intersection.y.toFixed(1)})`,
          x: intersectionDesign.x,
          y: intersectionDesign.y,
          anchor: "start",
          dy: -16,
          priority: 3
        });
      }
    }
    return avoidLabels(rawEntries, {
      fontScale,
      bounds: { width: 840, height: 650 }
    });
  }, [
    studyMode,
    x0,
    y0,
    pointPDesign,
    distanceResult,
    footDesign,
    lineProps,
    intersectionDesign,
    twoLinesRelation,
    scale,
    fontScale
  ]);
  return {
    A,
    B,
    C,
    mainLineDesign,
    pointPDesign,
    distanceResult,
    footDesign,
    rightAnglePath,
    line2Design,
    twoLinesRelation,
    intersectionDesign,
    familyLineDesign,
    handlePointPDrag,
    labels,
    lineProps
  };
}
const LineEquationScene = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "forms",
  form = "general"
}) => {
  const {
    mainLineDesign,
    pointPDesign,
    distanceResult,
    footDesign,
    rightAnglePath,
    line2Design,
    twoLinesRelation,
    intersectionDesign,
    familyLineDesign,
    handlePointPDrag,
    labels
  } = useLineEquationScene({
    params,
    scale,
    onParamChange,
    fontScale,
    studyMode,
    form
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    mainLineDesign && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: mainLineDesign.p1.x,
        y1: mainLineDesign.p1.y,
        x2: mainLineDesign.p2.x,
        y2: mainLineDesign.p2.y,
        stroke: MATH_COLORS.paramPrimary,
        strokeWidth: 3,
        strokeLinecap: "round"
      }
    ),
    (studyMode === "relation" || studyMode === "family") && line2Design && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: line2Design.p1.x,
        y1: line2Design.p1.y,
        x2: line2Design.p2.x,
        y2: line2Design.p2.y,
        stroke: MATH_COLORS.paramSecondary,
        strokeWidth: 2.5,
        strokeDasharray: studyMode === "family" ? "6 4" : void 0,
        strokeLinecap: "round"
      }
    ),
    studyMode === "family" && familyLineDesign && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: familyLineDesign.p1.x,
        y1: familyLineDesign.p1.y,
        x2: familyLineDesign.p2.x,
        y2: familyLineDesign.p2.y,
        stroke: MATH_COLORS.paramTertiary,
        strokeWidth: 3,
        strokeLinecap: "round"
      }
    ),
    studyMode === "distance" && distanceResult.isValid && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: pointPDesign.x,
          y1: pointPDesign.y,
          x2: footDesign.x,
          y2: footDesign.y,
          stroke: MATH_COLORS.focusPoint,
          strokeWidth: 2,
          strokeDasharray: "4 3"
        }
      ),
      rightAnglePath && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "polyline",
        {
          points: rightAnglePath,
          fill: "none",
          stroke: MATH_COLORS.focusPoint,
          strokeWidth: 1.8,
          strokeLinecap: "square"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: footDesign.x,
          cy: footDesign.y,
          r: 5,
          fill: MATH_COLORS.white,
          stroke: MATH_COLORS.focusPoint,
          strokeWidth: 2
        }
      )
    ] }),
    studyMode === "relation" && twoLinesRelation.type === "intersect" && intersectionDesign && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "circle",
      {
        cx: intersectionDesign.x,
        cy: intersectionDesign.y,
        r: 6,
        fill: MATH_COLORS.vectorResult,
        stroke: MATH_COLORS.white,
        strokeWidth: 2
      }
    ),
    studyMode === "distance" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: params.x0 ?? 2,
        cy: params.y0 ?? 3,
        scale,
        vp,
        onDrag: handlePointPDrag,
        color: MATH_COLORS.paramPrimary,
        r: 6,
        fontScale
      }
    ),
    labels.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx("g", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: l.x,
        y: l.y + l.finalDy,
        textAnchor: l.anchor,
        fill: MATH_COLORS.labelText,
        fontSize: fontScale(11),
        fontFamily: "monospace",
        fontWeight: "600",
        className: "select-none pointer-events-none",
        children: l.text
      }
    ) }, l.key))
  ] });
};
const defaultParams = {
  // 一般式参数 Ax + By + C = 0
  A: 1,
  B: -1,
  C: -1,
  // 点斜式 k, x0, y0
  k: 1,
  x0: 2,
  y0: 3,
  // 斜截式 k, b
  b: 1,
  // 两点式 (x1, y1), (x2, y2)
  x1: -2,
  y1: -1,
  x2: 2,
  y2: 3,
  // 截距式 a, b
  a: 3,
  // 第二条直线 L2: A2 x + B2 y + C2 = 0 (用于两线位置关系模式)
  A2: 1,
  B2: 1,
  C2: -2,
  // 直线系参数 lambda
  lambda: 1
};
const paramMeta = {
  A: {
    label: "A (x系数)",
    labelFormula: "A",
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "直线一般式方程中 x 的系数",
    descriptionFormula: "\\text{一般式 } Ax + By + C = 0 \\text{ 中 } x \\text{ 的系数}",
    importance: "primary",
    marks: [
      { value: 0, label: "A=0 (水平线)", labelFormula: "A=0", variant: "critical" }
    ]
  },
  B: {
    label: "B (y系数)",
    labelFormula: "B",
    defaultValue: -1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "直线一般式方程中 y 的系数",
    descriptionFormula: "\\text{一般式 } Ax + By + C = 0 \\text{ 中 } y \\text{ 的系数}",
    importance: "primary",
    marks: [
      { value: 0, label: "B=0 (铅垂线)", labelFormula: "B=0", variant: "critical" }
    ]
  },
  C: {
    label: "C (常数项)",
    labelFormula: "C",
    defaultValue: -1,
    min: -6,
    max: 6,
    step: 0.5,
    description: "直线一般式方程的常数项",
    descriptionFormula: "\\text{常数项，控制直线的平移}",
    importance: "secondary",
    marks: [
      { value: 0, label: "C=0 (过原点)", labelFormula: "C=0", variant: "zero" }
    ]
  },
  k: {
    label: "k (斜率)",
    labelFormula: "k",
    defaultValue: 1,
    min: -4,
    max: 4,
    step: 0.1,
    description: "直线的斜率 (k = tan α)",
    descriptionFormula: "k = \\tan \\alpha",
    importance: "primary",
    marks: [
      { value: 0, label: "k=0 (水平)", labelFormula: "k=0", variant: "zero" }
    ]
  },
  x0: {
    label: "x₀ (点P/定点x)",
    labelFormula: "x_0",
    defaultValue: 2,
    min: -5,
    max: 5,
    step: 0.2,
    description: "动点 P 或已知定点的 x 坐标",
    descriptionFormula: "\\text{点 } P(x_0, y_0) \\text{ 的 } x \\text{ 坐标}",
    importance: "primary"
  },
  y0: {
    label: "y₀ (点P/定点y)",
    labelFormula: "y_0",
    defaultValue: 3,
    min: -4,
    max: 4,
    step: 0.2,
    description: "动点 P 或已知定点的 y 坐标",
    descriptionFormula: "\\text{点 } P(x_0, y_0) \\text{ 的 } y \\text{ 坐标}",
    importance: "secondary"
  },
  b: {
    label: "b (y截距)",
    labelFormula: "b",
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "直线在 y 轴上的截距",
    descriptionFormula: "y \\text{ 轴截距 } (0, b)",
    importance: "secondary"
  },
  a: {
    label: "a (x截距)",
    labelFormula: "a",
    defaultValue: 3,
    min: -5,
    max: 5,
    step: 0.5,
    description: "直线在 x 轴上的截距（不可为0）",
    descriptionFormula: "x \\text{ 轴截距 } (a, 0) \\quad a \\neq 0",
    importance: "primary",
    marks: [
      { value: 0, label: "a=0 (无效)", labelFormula: "a=0", variant: "critical" }
    ]
  },
  A2: {
    label: "A₂ (L₂系数)",
    labelFormula: "A_2",
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "第二条直线 L₂ 的 x 系数",
    descriptionFormula: "L_2 \\text{ 的 } x \\text{ 系数 } A_2",
    importance: "secondary"
  },
  B2: {
    label: "B₂ (L₂系数)",
    labelFormula: "B_2",
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.5,
    description: "第二条直线 L₂ 的 y 系数",
    descriptionFormula: "L_2 \\text{ 的 } y \\text{ 系数 } B_2",
    importance: "secondary"
  },
  C2: {
    label: "C₂ (L₂常数)",
    labelFormula: "C_2",
    defaultValue: -2,
    min: -6,
    max: 6,
    step: 0.5,
    description: "第二条直线 L₂ 的常数项",
    descriptionFormula: "L_2 \\text{ 的常数项 } C_2",
    importance: "secondary"
  },
  lambda: {
    label: "λ (直线系参数)",
    labelFormula: "\\lambda",
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 0.2,
    description: "直线系组合参数 L₁ + λ L₂ = 0",
    descriptionFormula: "L_1 + \\lambda L_2 = 0",
    importance: "advanced"
  }
};
function LineEquationAnimation() {
  const [studyMode, setStudyMode] = reactExports.useState("forms");
  const [form, setForm] = reactExports.useState("general");
  const [params, setParams] = reactExports.useState(() => ({
    A: defaultParams.A,
    B: defaultParams.B,
    C: defaultParams.C,
    k: defaultParams.k,
    x0: defaultParams.x0,
    y0: defaultParams.y0,
    b: defaultParams.b,
    x1: defaultParams.x1,
    y1: defaultParams.y1,
    x2: defaultParams.x2,
    y2: defaultParams.y2,
    a: defaultParams.a,
    A2: defaultParams.A2,
    B2: defaultParams.B2,
    C2: defaultParams.C2,
    lambda: defaultParams.lambda
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5]
  });
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-line-equation", params, {
      studyMode,
      form
    });
  }, [params, studyMode, form]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };
  const handleReset = () => {
    setParams({
      A: defaultParams.A,
      B: defaultParams.B,
      C: defaultParams.C,
      k: defaultParams.k,
      x0: defaultParams.x0,
      y0: defaultParams.y0,
      b: defaultParams.b,
      x1: defaultParams.x1,
      y1: defaultParams.y1,
      x2: defaultParams.x2,
      y2: defaultParams.y2,
      a: defaultParams.a,
      A2: defaultParams.A2,
      B2: defaultParams.B2,
      C2: defaultParams.C2,
      lambda: defaultParams.lambda
    });
  };
  const paramConfigs = reactExports.useMemo(() => {
    let keys = [];
    if (studyMode === "forms") {
      switch (form) {
        case "pointSlope":
          keys = ["k", "x0", "y0"];
          break;
        case "slopeIntercept":
          keys = ["k", "b"];
          break;
        case "twoPoint":
          keys = ["x1", "y1", "x2", "y2"];
          break;
        case "intercept":
          keys = ["a", "b"];
          break;
        case "general":
        default:
          keys = ["A", "B", "C"];
          break;
      }
    } else if (studyMode === "distance") {
      keys = ["A", "B", "C", "x0", "y0"];
    } else if (studyMode === "relation") {
      keys = ["A", "B", "C", "A2", "B2", "C2"];
    } else if (studyMode === "family") {
      keys = ["A", "B", "C", "A2", "B2", "C2", "lambda"];
    }
    return keys.filter((key) => key in paramMeta).map((key) => {
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
        marks: meta.marks
      };
    });
  }, [params, studyMode, form]);
  const formulaLatex = reactExports.useMemo(() => {
    const c1 = MATH_COLORS.paramPrimary;
    const c2 = MATH_COLORS.paramSecondary;
    const c3 = MATH_COLORS.paramTertiary;
    if (studyMode === "forms") {
      switch (form) {
        case "pointSlope":
          return `y - \\color{${c2}}{${(params.y0 ?? 0).toFixed(1)}} = \\color{${c1}}{${(params.k ?? 1).toFixed(1)}}(x - \\color{${c1}}{${(params.x0 ?? 0).toFixed(1)}})`;
        case "slopeIntercept":
          return `y = \\color{${c1}}{${(params.k ?? 1).toFixed(1)}}x + \\color{${c2}}{${(params.b ?? 0).toFixed(1)}}`;
        case "intercept":
          return `\\frac{x}{\\color{${c1}}{${(params.a ?? 3).toFixed(1)}}} + \\frac{y}{\\color{${c2}}{${(params.b ?? 2).toFixed(1)}}} = 1`;
        case "twoPoint":
          return `\\frac{y - ${(params.y1 ?? -1).toFixed(1)}}{${(params.y2 ?? 3).toFixed(1)} - ${(params.y1 ?? -1).toFixed(1)}} = \\frac{x - ${(params.x1 ?? -2).toFixed(1)}}{${(params.x2 ?? 2).toFixed(1)} - ${(params.x1 ?? -2).toFixed(1)}}`;
        case "general":
        default:
          return `\\color{${c1}}{${(params.A ?? 1).toFixed(1)}}x + \\color{${c2}}{${(params.B ?? -1).toFixed(1)}}y + \\color{${c3}}{${(params.C ?? -1).toFixed(1)}} = 0`;
      }
    } else if (studyMode === "distance") {
      const A = params.A ?? 1;
      const B = params.B ?? -1;
      const C = params.C ?? -1;
      const x0 = params.x0 ?? 2;
      const y0 = params.y0 ?? 3;
      const d = Math.abs(A * x0 + B * y0 + C) / Math.hypot(A, B);
      return `d = \\frac{|\\color{${c1}}{${A.toFixed(1)}} \\cdot \\color{${c3}}{${x0.toFixed(1)}} + \\color{${c2}}{${B.toFixed(1)}} \\cdot \\color{${c3}}{${y0.toFixed(1)}} + (${C.toFixed(1)})|}{\\sqrt{\\color{${c1}}{${A.toFixed(1)}}^2 + (\\color{${c2}}{${B.toFixed(1)}})^2}} = \\mathbf{${d.toFixed(2)}}`;
    } else if (studyMode === "relation") {
      return `L_1: ${(params.A ?? 1).toFixed(1)}x + ${(params.B ?? -1).toFixed(1)}y + ${(params.C ?? -1).toFixed(1)} = 0 \\quad \\text{与} \\quad L_2: ${(params.A2 ?? 1).toFixed(1)}x + ${(params.B2 ?? 1).toFixed(1)}y + ${(params.C2 ?? -2).toFixed(1)} = 0`;
    } else {
      const lam = params.lambda ?? 1;
      return `L(\\lambda): L_1 + \\color{${c3}}{${lam.toFixed(1)}} L_2 = 0`;
    }
  }, [params, studyMode, form]);
  const panelTitleMap = {
    forms: "直线方程形式看板",
    distance: "点到直线距离看板",
    relation: "两条直线位置关系看板",
    family: "直线系方程看板"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "研究模式", subtitle: "选择解析几何探究主题", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabSwitcher,
          {
            tabs: [
              { key: "forms", label: "方程形式" },
              { key: "distance", label: "点到距离" },
              { key: "relation", label: "两线关系" },
              { key: "family", label: "直线系" }
            ],
            value: studyMode,
            onChange: (key) => setStudyMode(key)
          }
        ) }),
        studyMode === "forms" && /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "方程表达形式", subtitle: "选择五种经典表达形式", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "general", label: "一般式", formula: "Ax+By+C=0" },
              { key: "slopeIntercept", label: "斜截式", formula: "y=kx+b" },
              { key: "pointSlope", label: "点斜式", formula: "y-y_0=k(x-x_0)" },
              { key: "intercept", label: "截距式", formula: "\\frac{x}{a}+\\frac{y}{b}=1" },
              { key: "twoPoint", label: "两点式", fullWidth: true }
            ],
            value: form,
            onChange: (k) => setForm(k),
            variant: "filled"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "参数调节", subtitle: "拖动滑块改变参数数值", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: handleReset
          }
        ) })
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: formulaLatex, mode: "inline" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              LineEquationScene,
              {
                params,
                scale,
                vp,
                onParamChange: handleParamChange,
                fontScale: canvasSize.font,
                studyMode,
                form
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
          title: panelTitleMap[studyMode]
        }
      )
    }
  );
}
export {
  LineEquationAnimation
};
