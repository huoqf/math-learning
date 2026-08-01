import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { b as MATH_COLORS, w as withAlpha, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import { C as CoordinateGrid } from "./CoordinateGrid-BmMyIyOq.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { V as VectorArrow } from "./VectorArrow-y_gKfE6C.js";
import { I as InteractivePoint } from "./InteractivePoint-ZTf14j6W.js";
import { at as calculateTrigLines, au as pointToAngleDeg, b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import "./useRadioGroup-jCNJTR-s.js";
const TrigLinesScene = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "lines"
}) => {
  const { alphaDeg } = params;
  const showSine = params.showSine ?? 1;
  const showCosine = params.showCosine ?? 1;
  const showTangent = params.showTangent ?? 1;
  const showArc = params.showArc ?? 1;
  const showAuxTriangle = params.showAuxTriangle ?? 1;
  const trig = reactExports.useMemo(() => calculateTrigLines(alphaDeg), [alphaDeg]);
  const {
    pointP,
    pointM,
    pointA,
    pointT,
    isTanDefined,
    alphaRad,
    normalizeDeg,
    sinVal,
    cosVal,
    tanVal
  } = trig;
  const centerPt = mathToDesign(0, 0, scale);
  const unitRadiusPx = scale.scaleX;
  const pDesign = mathToDesign(pointP.x, pointP.y, scale);
  const mDesign = mathToDesign(pointM.x, pointM.y, scale);
  const aDesign = mathToDesign(pointA.x, pointA.y, scale);
  const tDesign = pointT ? mathToDesign(pointT.x, pointT.y, scale) : null;
  const handlePDrag = (rawMath) => {
    const newDeg = pointToAngleDeg(rawMath.x, rawMath.y, alphaDeg);
    onParamChange("alphaDeg", newDeg);
  };
  const arcData = reactExports.useMemo(() => {
    const baseRadius = Math.min(scale.scaleX * 0.28, 36);
    const radiusStepPerCircle = 9;
    if (Math.abs(alphaDeg) < 0.1) {
      return {
        path: "",
        arrowPoints: null,
        labelPos: {
          x: centerPt.x + baseRadius + 14,
          y: centerPt.y - 12
        }
      };
    }
    const isPositive = alphaDeg > 0;
    const totalAngleAbs = Math.abs(alphaDeg);
    const steps = Math.max(16, Math.ceil(totalAngleAbs / 4));
    const pathPoints = [];
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const currentRad = alphaRad * progress;
      const currentDegAbs = totalAngleAbs * progress;
      const r = baseRadius + currentDegAbs / 360 * radiusStepPerCircle;
      const x = centerPt.x + r * Math.cos(currentRad);
      const y = centerPt.y - r * Math.sin(currentRad);
      pathPoints.push({ x, y });
    }
    const path = pathPoints.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}` : `${acc} L ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    }, "");
    const lastPt = pathPoints[pathPoints.length - 1];
    const prevPt = pathPoints[pathPoints.length - 2];
    const dx = lastPt.x - prevPt.x;
    const dy = lastPt.y - prevPt.y;
    const tangentRad = Math.atan2(dy, dx);
    const arrowLength = 7;
    const arrowWidth = 5;
    const backX = lastPt.x - arrowLength * Math.cos(tangentRad);
    const backY = lastPt.y - arrowLength * Math.sin(tangentRad);
    const perpX = -Math.sin(tangentRad) * (arrowWidth / 2);
    const perpY = Math.cos(tangentRad) * (arrowWidth / 2);
    const arrowPoints = [
      `${lastPt.x.toFixed(2)},${lastPt.y.toFixed(2)}`,
      `${(backX + perpX).toFixed(2)},${(backY + perpY).toFixed(2)}`,
      `${(backX - perpX).toFixed(2)},${(backY - perpY).toFixed(2)}`
    ].join(" ");
    let labelRad;
    if (totalAngleAbs <= 360) {
      labelRad = alphaRad / 2;
    } else {
      labelRad = alphaRad - (isPositive ? Math.PI : -Math.PI);
    }
    const labelDegAbs = Math.abs(labelRad) * 180 / Math.PI;
    const labelR = baseRadius + labelDegAbs / 360 * radiusStepPerCircle + 14;
    const labelPos = {
      x: centerPt.x + labelR * Math.cos(labelRad),
      y: centerPt.y - labelR * Math.sin(labelRad)
    };
    return {
      path,
      arrowPoints,
      labelPos
    };
  }, [centerPt, scale.scaleX, alphaRad, alphaDeg]);
  const compSectorPath = reactExports.useMemo(() => {
    if (studyMode !== "comparison") return null;
    const endX = centerPt.x + unitRadiusPx * Math.cos(alphaRad);
    const endY = centerPt.y - unitRadiusPx * Math.sin(alphaRad);
    const isLarge = normalizeDeg > 180 ? 1 : 0;
    return `M ${centerPt.x} ${centerPt.y} L ${aDesign.x} ${aDesign.y} A ${unitRadiusPx} ${unitRadiusPx} 0 ${isLarge} 0 ${endX} ${endY} Z`;
  }, [studyMode, centerPt, unitRadiusPx, alphaRad, normalizeDeg, aDesign]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "circle",
      {
        cx: centerPt.x,
        cy: centerPt.y,
        r: unitRadiusPx,
        fill: "none",
        stroke: MATH_COLORS.function,
        strokeWidth: 2,
        opacity: 0.85
      }
    ),
    studyMode === "comparison" && compSectorPath && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          d: compSectorPath,
          fill: withAlpha(MATH_COLORS.function, 0.12),
          stroke: "none"
        }
      ),
      tDesign && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "polygon",
        {
          points: `${centerPt.x},${centerPt.y} ${aDesign.x},${aDesign.y} ${tDesign.x},${tDesign.y}`,
          fill: withAlpha(MATH_COLORS.paramTertiary, 0.08),
          stroke: withAlpha(MATH_COLORS.paramTertiary, 0.4),
          strokeWidth: 1,
          strokeDasharray: "3 3"
        }
      )
    ] }),
    studyMode === "quadrant" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { opacity: 0.65, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: mathToDesign(0.7, 0.6, scale).x,
          y: mathToDesign(0.7, 0.6, scale).y,
          fill: MATH_COLORS.function,
          fontSize: fontScale(11),
          fontWeight: "bold",
          textAnchor: "middle",
          className: "select-none pointer-events-none",
          children: "Ⅰ 全正(+)"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: mathToDesign(-0.7, 0.6, scale).x,
          y: mathToDesign(-0.7, 0.6, scale).y,
          fill: MATH_COLORS.paramPrimary,
          fontSize: fontScale(11),
          fontWeight: "bold",
          textAnchor: "middle",
          className: "select-none pointer-events-none",
          children: "Ⅱ sin+"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: mathToDesign(-0.7, -0.6, scale).x,
          y: mathToDesign(-0.7, -0.6, scale).y,
          fill: MATH_COLORS.paramTertiary,
          fontSize: fontScale(11),
          fontWeight: "bold",
          textAnchor: "middle",
          className: "select-none pointer-events-none",
          children: "Ⅲ tan+"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: mathToDesign(0.7, -0.6, scale).x,
          y: mathToDesign(0.7, -0.6, scale).y,
          fill: MATH_COLORS.paramSecondary,
          fontSize: fontScale(11),
          fontWeight: "bold",
          textAnchor: "middle",
          className: "select-none pointer-events-none",
          children: "Ⅳ cos+"
        }
      )
    ] }),
    showArc === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      arcData.path && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          d: arcData.path,
          fill: "none",
          stroke: MATH_COLORS.function,
          strokeWidth: 2
        }
      ),
      arcData.arrowPoints && /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: arcData.arrowPoints, fill: MATH_COLORS.function }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "g",
        {
          transform: `translate(${arcData.labelPos.x.toFixed(2)}, ${arcData.labelPos.y.toFixed(2)})`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: -28,
                y: -10,
                width: 56,
                height: 20,
                rx: 4,
                fill: withAlpha(MATH_COLORS.white, 0.88),
                stroke: withAlpha(MATH_COLORS.function, 0.4),
                strokeWidth: 1
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: 0,
                y: 4,
                fill: MATH_COLORS.function,
                fontSize: fontScale(11),
                fontWeight: "bold",
                textAnchor: "middle",
                className: "select-none pointer-events-none",
                children: [
                  "α=",
                  alphaDeg,
                  "°"
                ]
              }
            )
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: aDesign.x,
        y1: mathToDesign(1, -1.5, scale).y,
        x2: aDesign.x,
        y2: mathToDesign(1, 1.5, scale).y,
        stroke: MATH_COLORS.grid,
        strokeWidth: 1.5,
        strokeDasharray: "4 4"
      }
    ),
    tDesign && showTangent === 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: centerPt.x,
        y1: centerPt.y,
        x2: tDesign.x,
        y2: tDesign.y,
        stroke: withAlpha(MATH_COLORS.paramTertiary, 0.6),
        strokeWidth: 1.5,
        strokeDasharray: "3 3"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: centerPt.x,
        y1: centerPt.y,
        x2: pDesign.x,
        y2: pDesign.y,
        stroke: MATH_COLORS.function,
        strokeWidth: 2.5
      }
    ),
    showAuxTriangle === 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: pDesign.x,
        y1: pDesign.y,
        x2: mDesign.x,
        y2: mDesign.y,
        stroke: MATH_COLORS.axis,
        strokeWidth: 1,
        strokeDasharray: "3 3",
        opacity: 0.5
      }
    ),
    showCosine === 1 && Math.abs(cosVal) > 1e-4 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      VectorArrow,
      {
        from: [0, 0],
        to: [pointM.x, 0],
        scale,
        color: MATH_COLORS.paramSecondary,
        strokeWidth: 3.5,
        headLength: 9,
        headWidth: 6,
        fontScale,
        label: "OM",
        labelOffset: [0, sinVal >= 0 ? 14 : -14],
        labelSize: 10
      }
    ),
    showSine === 1 && Math.abs(sinVal) > 1e-4 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      VectorArrow,
      {
        from: [pointM.x, 0],
        to: [pointM.x, pointP.y],
        scale,
        color: MATH_COLORS.paramPrimary,
        strokeWidth: 3.5,
        headLength: 9,
        headWidth: 6,
        fontScale,
        label: "MP",
        labelOffset: [cosVal >= 0 ? 16 : -16, 0],
        labelSize: 10
      }
    ),
    showTangent === 1 && isTanDefined && pointT && Math.abs(tanVal ?? 0) > 1e-4 && Math.abs(tanVal ?? 0) < 3.5 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      VectorArrow,
      {
        from: [1, 0],
        to: [1, pointT.y],
        scale,
        color: MATH_COLORS.paramTertiary,
        strokeWidth: 3.5,
        headLength: 9,
        headWidth: 6,
        fontScale,
        label: "AT",
        labelOffset: [18, 0],
        labelSize: 10
      }
    ),
    showTangent === 1 && !isTanDefined && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: aDesign.x,
          y1: mathToDesign(1, -1.4, scale).y,
          x2: aDesign.x,
          y2: mathToDesign(1, 1.4, scale).y,
          stroke: MATH_COLORS.vectorResult,
          strokeWidth: 2.5,
          strokeDasharray: "6 4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: aDesign.x + 8,
          y: centerPt.y - 14,
          width: 136,
          height: 28,
          rx: 4,
          fill: withAlpha(MATH_COLORS.vectorResult, 0.9)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: aDesign.x + 15,
          y: centerPt.y + 4,
          fill: MATH_COLORS.white,
          fontSize: fontScale(10),
          fontWeight: "bold",
          className: "select-none pointer-events-none",
          children: "正切线不存在 (平行)"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: centerPt.x - 12,
        y: centerPt.y + 16,
        fill: MATH_COLORS.labelText,
        fontSize: fontScale(11),
        fontWeight: "600",
        className: "select-none pointer-events-none",
        children: "O"
      }
    ),
    Math.abs(cosVal) > 1e-4 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: mDesign.x,
        y: mDesign.y + (sinVal >= 0 ? 16 : -8),
        fill: MATH_COLORS.paramSecondary,
        fontSize: fontScale(11),
        fontWeight: "bold",
        textAnchor: "middle",
        className: "select-none pointer-events-none",
        children: "M"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "circle",
      {
        cx: aDesign.x,
        cy: aDesign.y,
        r: 3.5,
        fill: MATH_COLORS.paramTertiary
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: aDesign.x + 8,
        y: aDesign.y + 14,
        fill: MATH_COLORS.paramTertiary,
        fontSize: fontScale(11),
        fontWeight: "bold",
        className: "select-none pointer-events-none",
        children: "A(1,0)"
      }
    ),
    tDesign && isTanDefined && Math.abs(tanVal ?? 0) > 1e-4 && Math.abs(tanVal ?? 0) < 3.5 && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: tDesign.x,
          cy: tDesign.y,
          r: 4,
          fill: MATH_COLORS.paramTertiary
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: tDesign.x + 10,
          y: tDesign.y + ((tanVal ?? 0) >= 0 ? -6 : 14),
          fill: MATH_COLORS.paramTertiary,
          fontSize: fontScale(11),
          fontWeight: "bold",
          className: "select-none pointer-events-none",
          children: "T(1, tanα)"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: pointP.x,
        cy: pointP.y,
        scale,
        vp,
        onDrag: handlePDrag,
        color: MATH_COLORS.paramPrimary,
        r: 6.5,
        disabled: false,
        fontScale
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "text",
      {
        x: pDesign.x + (cosVal >= 0 ? 10 : -10),
        y: pDesign.y + (sinVal >= 0 ? -10 : 16),
        fill: MATH_COLORS.paramPrimary,
        fontSize: fontScale(11),
        fontWeight: "bold",
        textAnchor: cosVal >= 0 ? "start" : "end",
        className: "select-none pointer-events-none",
        children: [
          "P(",
          cosVal.toFixed(2),
          ", ",
          sinVal.toFixed(2),
          ")"
        ]
      }
    ),
    Math.abs(cosVal) < 1e-4 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: centerPt.x - 38,
        y: centerPt.y - 14,
        fill: MATH_COLORS.axis,
        fontSize: fontScale(9),
        className: "select-none pointer-events-none",
        children: "M=O (cosα=0)"
      }
    )
  ] });
};
const defaultParams = {
  alphaDeg: 45,
  showSine: 1,
  showCosine: 1,
  showTangent: 1,
  showArc: 1,
  showAuxTriangle: 1
};
const paramMeta = {
  alphaDeg: {
    key: "alphaDeg",
    label: "动角 α (度)",
    labelFormula: "\\alpha",
    min: -360,
    max: 720,
    step: 1,
    defaultValue: 45,
    importance: "core",
    description: "角 α 的终边与单位圆交于 P(cos α, sin α)",
    descriptionFormula: "角 $\\alpha$ 的终边与单位圆交于 $P(\\cos\\alpha, \\sin\\alpha)$",
    marks: [
      { value: 0, label: "0°", labelFormula: "0^\\circ" },
      { value: 30, label: "30°", labelFormula: "30^\\circ" },
      { value: 45, label: "45°", labelFormula: "45^\\circ" },
      { value: 60, label: "60°", labelFormula: "60^\\circ" },
      { value: 90, variant: "critical", label: "90° (切线平行)", labelFormula: "90^\\circ" },
      { value: 135, label: "135°", labelFormula: "135^\\circ" },
      { value: 180, label: "180°", labelFormula: "180^\\circ" },
      { value: 270, variant: "critical", label: "270° (切线平行)", labelFormula: "270^\\circ" },
      { value: 360, label: "360°", labelFormula: "360^\\circ" }
    ]
  }
};
function TrigLinesAnimation() {
  const [studyMode, setStudyMode] = reactExports.useState("lines");
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.square
  });
  const scale = useSceneScale({
    vp,
    xRange: [-1.6, 1.6],
    yRange: [-1.6, 1.6]
  });
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-trig-lines", params, { studyMode });
  }, [params, studyMode]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };
  const handleReset = () => {
    setParams({ ...defaultParams });
  };
  const paramConfigs = reactExports.useMemo(() => {
    return Object.entries(paramMeta).map(([key, meta]) => ({
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
    }));
  }, [params]);
  const equationLatex = reactExports.useMemo(() => {
    const alpha = params.alphaDeg ?? 45;
    const rad = alpha * Math.PI / 180;
    const sinV = Math.sin(rad).toFixed(3);
    const cosV = Math.cos(rad).toFixed(3);
    const isTanDef = Math.abs(Math.cos(rad)) > 1e-7;
    const tanV = isTanDef ? Math.tan(rad).toFixed(3) : "\\text{无意义}";
    return `\\sin\\alpha = \\color{#EF4444}{${sinV}}, \\quad \\cos\\alpha = \\color{#D97706}{${cosV}}, \\quad \\tan\\alpha = \\color{#059669}{${tanV}}`;
  }, [params.alphaDeg]);
  const panelTitle = reactExports.useMemo(() => {
    if (studyMode === "lines") return "三角函数线定义看板";
    if (studyMode === "comparison") return "大小比较与不等式看板";
    return "象限符号与全正法则看板";
  }, [studyMode]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "研究模式", subtitle: "选择三角函数线研讨视角", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "lines", label: "三角函数线定义" },
              { key: "comparison", label: "几何大小比较" },
              { key: "quadrant", label: "象限符号法则" }
            ],
            value: studyMode,
            onChange: (k) => setStudyMode(k),
            variant: "filled",
            columns: 1
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "快捷特殊角", subtitle: "一键设定高考常考特殊角度", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "0", label: "0°" },
              { key: "30", label: "30°" },
              { key: "45", label: "45°" },
              { key: "60", label: "60°" },
              { key: "90", label: "90°" },
              { key: "120", label: "120°" },
              { key: "135", label: "135°" },
              { key: "150", label: "150°" },
              { key: "180", label: "180°" },
              { key: "270", label: "270°" },
              { key: "315", label: "315°" },
              { key: "360", label: "360°" }
            ],
            value: String(params.alphaDeg),
            onChange: (k) => handleParamChange("alphaDeg", Number(k)),
            variant: "filled",
            columns: 3
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "函数线显隐", subtitle: "勾选控制展示的三大有向线段", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "sin", label: "正弦线 MP", formula: "\\overrightarrow{MP}" },
              { key: "cos", label: "余弦线 OM", formula: "\\overrightarrow{OM}" },
              { key: "tan", label: "正切线 AT", formula: "\\overrightarrow{AT}", fullWidth: true }
            ],
            value: params.showSine && params.showCosine && params.showTangent ? "all" : params.showSine ? "sin" : params.showCosine ? "cos" : "tan",
            onChange: (k) => {
              if (k === "sin") {
                handleParamChange("showSine", 1);
                handleParamChange("showCosine", 0);
                handleParamChange("showTangent", 0);
              } else if (k === "cos") {
                handleParamChange("showSine", 0);
                handleParamChange("showCosine", 1);
                handleParamChange("showTangent", 0);
              } else if (k === "tan") {
                handleParamChange("showSine", 0);
                handleParamChange("showCosine", 0);
                handleParamChange("showTangent", 1);
              } else {
                handleParamChange("showSine", 1);
                handleParamChange("showCosine", 1);
                handleParamChange("showTangent", 1);
              }
            },
            variant: "filled",
            color: "primary"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "连续动角调节", subtitle: "拖动滑块连续改变动角 α", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: handleReset
          }
        ) })
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: equationLatex, mode: "inline" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              TrigLinesScene,
              {
                params,
                scale,
                vp,
                onParamChange: handleParamChange,
                fontScale: canvasSize.font,
                studyMode
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
  TrigLinesAnimation
};
