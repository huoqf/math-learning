import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { w as withAlpha, b as MATH_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { C as CoordinateGrid } from "./CoordinateGrid-fDHVDEJz.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { V as VectorArrow } from "./VectorArrow-DV8pzlQL.js";
import { I as InteractivePoint } from "./InteractivePoint-2lsgO1SM.js";
import { av as calculateTrigIdentity, aw as calculateInduction, ax as pointToAngleDeg, b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import "./useRadioGroup-DJLu5uAU.js";
const TrigIdentityScene = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "identity",
  formulaType = "pi_plus"
}) => {
  const { alphaDeg, homoA = 1, homoB = 1 } = params;
  const trig = reactExports.useMemo(
    () => calculateTrigIdentity(alphaDeg, homoA, homoB),
    [alphaDeg, homoA, homoB]
  );
  const ind = reactExports.useMemo(
    () => calculateInduction(alphaDeg, formulaType),
    [alphaDeg, formulaType]
  );
  const centerPt = mathToDesign(0, 0, scale);
  const pDesign = mathToDesign(trig.pointP.x, trig.pointP.y, scale);
  const mDesign = mathToDesign(trig.pointM.x, trig.pointM.y, scale);
  const aDesign = mathToDesign(trig.pointA.x, trig.pointA.y, scale);
  const tDesign = trig.pointT ? mathToDesign(trig.pointT.x, trig.pointT.y, scale) : null;
  const pPrimeDesign = mathToDesign(
    ind.pointPPrime.x,
    ind.pointPPrime.y,
    scale
  );
  const mPrimeDesign = mathToDesign(
    ind.pointMPrime.x,
    ind.pointMPrime.y,
    scale
  );
  const handlePDrag = (rawMath) => {
    const newDeg = pointToAngleDeg(rawMath.x, rawMath.y, alphaDeg);
    onParamChange("alphaDeg", newDeg);
  };
  const handleQDrag = (rawMath) => {
    const newB = Math.round(rawMath.x * 2) / 2;
    const newA = Math.round(rawMath.y * 2) / 2;
    const clampedB = Math.max(-3, Math.min(3, newB));
    const clampedA = Math.max(-3, Math.min(3, newA));
    onParamChange("homoB", clampedB);
    onParamChange("homoA", clampedA);
  };
  const unitRadiusPx = scale.scaleX;
  const alphaArcPath = reactExports.useMemo(() => {
    const r = Math.min(unitRadiusPx * 0.25, 32);
    const rad = trig.alphaRad;
    const endX = centerPt.x + r * Math.cos(rad);
    const endY = centerPt.y - r * Math.sin(rad);
    const largeArc = Math.abs(alphaDeg) > 180 ? 1 : 0;
    const sweep = alphaDeg >= 0 ? 0 : 1;
    return `M ${centerPt.x + r} ${centerPt.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${endX} ${endY}`;
  }, [alphaDeg, trig.alphaRad, centerPt, unitRadiusPx]);
  const betaArcPath = reactExports.useMemo(() => {
    const r = Math.min(unitRadiusPx * 0.38, 48);
    const rad = ind.betaRad;
    const endX = centerPt.x + r * Math.cos(rad);
    const endY = centerPt.y - r * Math.sin(rad);
    const largeArc = Math.abs(ind.betaDeg) > 180 ? 1 : 0;
    const sweep = ind.betaDeg >= 0 ? 0 : 1;
    return `M ${centerPt.x + r} ${centerPt.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${endX} ${endY}`;
  }, [ind.betaDeg, ind.betaRad, centerPt, unitRadiusPx]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "circle",
      {
        cx: centerPt.x,
        cy: centerPt.y,
        r: unitRadiusPx,
        fill: "none",
        stroke: withAlpha(MATH_COLORS.primary, 0.4),
        strokeWidth: 1.5,
        strokeDasharray: "4 4"
      }
    ),
    studyMode === "identity" ? (
      /* ================= 同角关系 Mode ================= */
      /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "polygon",
          {
            points: `${centerPt.x},${centerPt.y} ${mDesign.x},${mDesign.y} ${pDesign.x},${pDesign.y}`,
            fill: withAlpha(MATH_COLORS.paramPrimary, 0.15),
            stroke: "none"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: centerPt.x,
            y1: centerPt.y,
            x2: mDesign.x,
            y2: mDesign.y,
            stroke: MATH_COLORS.paramSecondary,
            strokeWidth: 2.5
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: mDesign.x,
            y1: mDesign.y,
            x2: pDesign.x,
            y2: pDesign.y,
            stroke: MATH_COLORS.paramPrimary,
            strokeWidth: 2.5
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          VectorArrow,
          {
            from: [0, 0],
            to: [trig.pointP.x, trig.pointP.y],
            scale,
            color: MATH_COLORS.paramPrimary,
            strokeWidth: 2
          }
        ),
        trig.isTanDefined && tDesign && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: centerPt.x,
              y1: centerPt.y,
              x2: tDesign.x,
              y2: tDesign.y,
              stroke: withAlpha(MATH_COLORS.paramTertiary, 0.5),
              strokeWidth: 1.5,
              strokeDasharray: "3 3"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: aDesign.x,
              y1: aDesign.y,
              x2: tDesign.x,
              y2: tDesign.y,
              stroke: MATH_COLORS.paramTertiary,
              strokeWidth: 3
            }
          ),
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
              x: tDesign.x + 8,
              y: tDesign.y + 4,
              fontSize: fontScale(12),
              fill: MATH_COLORS.paramTertiary,
              fontWeight: "bold",
              children: `T(1, tan α)`
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: aDesign.x, cy: aDesign.y, r: 3, fill: "#4B5563" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: aDesign.x + 6,
            y: aDesign.y + 14,
            fontSize: fontScale(11),
            fill: "#4B5563",
            children: "A(1,0)"
          }
        ),
        Math.abs(alphaDeg) > 0.5 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            d: alphaArcPath,
            fill: "none",
            stroke: MATH_COLORS.paramPrimary,
            strokeWidth: 1.5
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: centerPt.x + 28 * Math.cos(trig.alphaRad / 2),
            y: centerPt.y - 28 * Math.sin(trig.alphaRad / 2),
            fontSize: fontScale(12),
            fill: MATH_COLORS.paramPrimary,
            fontWeight: "bold",
            children: "α"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: (centerPt.x + mDesign.x) / 2,
            y: centerPt.y + (trig.sinVal >= 0 ? 14 : -6),
            fontSize: fontScale(11),
            fill: MATH_COLORS.paramSecondary,
            textAnchor: "middle",
            children: `cos α = ${trig.cosVal.toFixed(2)}`
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: mDesign.x + (trig.cosVal >= 0 ? 8 : -8),
            y: (mDesign.y + pDesign.y) / 2,
            fontSize: fontScale(11),
            fill: MATH_COLORS.paramPrimary,
            textAnchor: trig.cosVal >= 0 ? "start" : "end",
            children: `sin α = ${trig.sinVal.toFixed(2)}`
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          InteractivePoint,
          {
            cx: trig.pointP.x,
            cy: trig.pointP.y,
            scale,
            vp,
            onDrag: handlePDrag,
            fontScale,
            color: MATH_COLORS.paramPrimary,
            label: `P(${trig.cosVal.toFixed(2)}, ${trig.sinVal.toFixed(2)})`
          }
        ),
        (Math.abs(homoA) > 0.01 || Math.abs(homoB) > 0.01) && /* @__PURE__ */ jsxRuntimeExports.jsx(
          VectorArrow,
          {
            from: [0, 0],
            to: [homoB, homoA],
            scale,
            color: "#8B5CF6",
            strokeWidth: 2,
            strokeDasharray: "4 4"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          InteractivePoint,
          {
            cx: homoB,
            cy: homoA,
            scale,
            vp,
            onDrag: handleQDrag,
            fontScale,
            color: "#8B5CF6",
            label: `Q(B=${homoB.toFixed(1)}, A=${homoA.toFixed(1)})`
          }
        )
      ] })
    ) : (
      /* ================= 诱导公式 Mode ================= */
      /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        ind.symmetryType === "origin" && /* 中心对称：贯穿线 P'OP */
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: pDesign.x,
            y1: pDesign.y,
            x2: pPrimeDesign.x,
            y2: pPrimeDesign.y,
            stroke: withAlpha("#6366F1", 0.6),
            strokeWidth: 1.5,
            strokeDasharray: "4 4"
          }
        ),
        ind.symmetryType === "xaxis" && /* x 轴对称：PP' 垂直线 */
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: pDesign.x,
            y1: pDesign.y,
            x2: pPrimeDesign.x,
            y2: pPrimeDesign.y,
            stroke: withAlpha("#6366F1", 0.6),
            strokeWidth: 1.5,
            strokeDasharray: "4 4"
          }
        ),
        ind.symmetryType === "yaxis" && /* y 轴对称：PP' 水平线 */
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: pDesign.x,
            y1: pDesign.y,
            x2: pPrimeDesign.x,
            y2: pPrimeDesign.y,
            stroke: withAlpha("#6366F1", 0.6),
            strokeWidth: 1.5,
            strokeDasharray: "4 4"
          }
        ),
        ind.symmetryType === "diag_pos" && /* y = x 对称 */
        /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: mathToDesign(-1.5, -1.5, scale).x,
              y1: mathToDesign(-1.5, -1.5, scale).y,
              x2: mathToDesign(1.5, 1.5, scale).x,
              y2: mathToDesign(1.5, 1.5, scale).y,
              stroke: "#8B5CF6",
              strokeWidth: 1.5,
              strokeDasharray: "4 4"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: pDesign.x,
              y1: pDesign.y,
              x2: pPrimeDesign.x,
              y2: pPrimeDesign.y,
              stroke: withAlpha("#6366F1", 0.6),
              strokeWidth: 1.5,
              strokeDasharray: "3 3"
            }
          )
        ] }),
        ind.symmetryType === "diag_neg" && /* y = -x 对称 */
        /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: mathToDesign(-1.5, 1.5, scale).x,
              y1: mathToDesign(-1.5, 1.5, scale).y,
              x2: mathToDesign(1.5, -1.5, scale).x,
              y2: mathToDesign(1.5, -1.5, scale).y,
              stroke: "#8B5CF6",
              strokeWidth: 1.5,
              strokeDasharray: "4 4"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: pDesign.x,
              y1: pDesign.y,
              x2: pPrimeDesign.x,
              y2: pPrimeDesign.y,
              stroke: withAlpha("#6366F1", 0.6),
              strokeWidth: 1.5,
              strokeDasharray: "3 3"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "polygon",
          {
            points: `${centerPt.x},${centerPt.y} ${mDesign.x},${mDesign.y} ${pDesign.x},${pDesign.y}`,
            fill: withAlpha(MATH_COLORS.paramPrimary, 0.12),
            stroke: withAlpha(MATH_COLORS.paramPrimary, 0.5),
            strokeWidth: 1
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "polygon",
          {
            points: `${centerPt.x},${centerPt.y} ${mPrimeDesign.x},${mPrimeDesign.y} ${pPrimeDesign.x},${pPrimeDesign.y}`,
            fill: withAlpha(MATH_COLORS.paramSecondary, 0.15),
            stroke: withAlpha(MATH_COLORS.paramSecondary, 0.5),
            strokeWidth: 1
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          VectorArrow,
          {
            from: [0, 0],
            to: [trig.pointP.x, trig.pointP.y],
            scale,
            color: MATH_COLORS.paramPrimary,
            strokeWidth: 2.5
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          VectorArrow,
          {
            from: [0, 0],
            to: [ind.pointPPrime.x, ind.pointPPrime.y],
            scale,
            color: MATH_COLORS.paramSecondary,
            strokeWidth: 2.5
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            d: alphaArcPath,
            fill: "none",
            stroke: MATH_COLORS.paramPrimary,
            strokeWidth: 1.5
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            d: betaArcPath,
            fill: "none",
            stroke: MATH_COLORS.paramSecondary,
            strokeWidth: 1.5,
            strokeDasharray: "3 3"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          InteractivePoint,
          {
            cx: trig.pointP.x,
            cy: trig.pointP.y,
            scale,
            vp,
            onDrag: handlePDrag,
            fontScale,
            color: MATH_COLORS.paramPrimary,
            label: "P(α)"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: pPrimeDesign.x,
            cy: pPrimeDesign.y,
            r: 5,
            fill: MATH_COLORS.paramSecondary
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: pPrimeDesign.x + (ind.pointPPrime.x >= 0 ? 8 : -24),
            y: pPrimeDesign.y + (ind.pointPPrime.y >= 0 ? -8 : 16),
            fontSize: fontScale(11),
            fill: MATH_COLORS.paramSecondary,
            fontWeight: "bold",
            children: "P'(β)"
          }
        )
      ] })
    )
  ] });
};
const defaultParams = {
  alphaDeg: 30,
  homoA: 1,
  homoB: 1
};
const paramMeta = {
  alphaDeg: {
    key: "alphaDeg",
    label: "任意角 α (°)",
    labelFormula: "\\alpha",
    min: -360,
    max: 360,
    step: 1,
    defaultValue: 30,
    importance: "core",
    description: "单位圆上的动角 α，决定点 P(cos α, sin α) 的位置",
    descriptionFormula: "单位圆上的动角 $\\alpha$，决定点 $P(\\cos\\alpha, \\sin\\alpha)$ 的位置",
    marks: [
      {
        value: -180,
        variant: "zero",
        label: "-180°",
        labelFormula: "-180^\\circ"
      },
      {
        value: 0,
        variant: "zero",
        label: "0°",
        labelFormula: "0^\\circ"
      },
      {
        value: 180,
        variant: "zero",
        label: "180°",
        labelFormula: "180^\\circ"
      }
    ]
  },
  homoA: {
    key: "homoA",
    label: "系数 A",
    labelFormula: "A",
    min: -3,
    max: 3,
    step: 0.5,
    defaultValue: 1,
    importance: "advanced",
    description: "高考齐次式化切或知一求二中的组合系数 A",
    descriptionFormula: "高考齐次式 $\\frac{A\\sin\\alpha + B\\cos\\alpha}{\\sin\\alpha - \\cos\\alpha}$ 中的系数 $A$"
  },
  homoB: {
    key: "homoB",
    label: "系数 B",
    labelFormula: "B",
    min: -3,
    max: 3,
    step: 0.5,
    defaultValue: 1,
    importance: "advanced",
    description: "高考齐次式化切或知一求二中的组合系数 B",
    descriptionFormula: "高考齐次式 $\\frac{A\\sin\\alpha + B\\cos\\alpha}{\\sin\\alpha - \\cos\\alpha}$ 中的系数 $B$"
  }
};
function TrigIdentityAnimation() {
  const [studyMode, setStudyMode] = reactExports.useState(
    "identity"
  );
  const [formulaType, setFormulaType] = reactExports.useState("pi_plus");
  const [params, setParams] = reactExports.useState(() => ({
    alphaDeg: defaultParams.alphaDeg,
    homoA: defaultParams.homoA,
    homoB: defaultParams.homoB
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-2, 2],
    yRange: [-1.5, 1.5]
  });
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-trig-identity", params, {
      studyMode,
      formulaType
    });
  }, [params, studyMode, formulaType]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };
  const handleReset = () => {
    setParams({
      alphaDeg: defaultParams.alphaDeg,
      homoA: defaultParams.homoA,
      homoB: defaultParams.homoB
    });
  };
  const paramConfigs = reactExports.useMemo(() => {
    const keysByMode = {
      identity: ["alphaDeg", "homoA", "homoB"],
      induction: ["alphaDeg"]
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
    if (studyMode === "identity") {
      const aVal = params.homoA ?? 1;
      const bVal = params.homoB ?? 1;
      const trigRes = calculateTrigIdentity(params.alphaDeg ?? 30, aVal, bVal);
      const valText = trigRes.isHomoDefined && trigRes.homoVal !== void 0 ? trigRes.homoVal.toFixed(2) : "\\text{无意义}";
      return `\\sin^2\\alpha + \\cos^2\\alpha = 1 \\quad \\vert \\quad \\frac{\\color{#EF4444}{${aVal}}\\sin\\alpha + \\color{#D97706}{${bVal}}\\cos\\alpha}{\\sin\\alpha + \\cos\\alpha} = \\frac{\\color{#EF4444}{${aVal}}\\tan\\alpha + \\color{#D97706}{${bVal}}}{\\tan\\alpha + 1} = ${valText}`;
    } else {
      const ind = calculateInduction(params.alphaDeg ?? 30, formulaType);
      return `${ind.formulaTitle}: \\quad ${ind.sinFormulaTex} \\quad \\vert \\quad ${ind.cosFormulaTex}`;
    }
  }, [studyMode, formulaType, params.alphaDeg, params.homoA, params.homoB]);
  const panelTitle = reactExports.useMemo(() => {
    return studyMode === "identity" ? "同角三角函数关系看板" : "诱导公式动态对称看板";
  }, [studyMode]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "研究模式", subtitle: "选择探索的专题内容", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "identity", label: "同角基本关系" },
              { key: "induction", label: "诱导公式对称" }
            ],
            value: studyMode,
            onChange: (k) => setStudyMode(k),
            variant: "filled"
          }
        ) }),
        studyMode === "induction" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "诱导公式类型",
            subtitle: "选择6大组高考诱导公式",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: [
                  { key: "pi_plus", label: "π + α", formula: "\\pi + \\alpha" },
                  { key: "neg", label: "-α", formula: "-\\alpha" },
                  {
                    key: "pi_minus",
                    label: "π - α",
                    formula: "\\pi - \\alpha"
                  },
                  {
                    key: "half_pi_minus",
                    label: "π/2 - α",
                    formula: "\\frac{\\pi}{2} - \\alpha"
                  },
                  {
                    key: "half_pi_plus",
                    label: "π/2 + α",
                    formula: "\\frac{\\pi}{2} + \\alpha"
                  },
                  {
                    key: "period",
                    label: "α + 2kπ",
                    formula: "\\alpha + 2\\pi"
                  }
                ],
                value: formulaType,
                onChange: (k) => setFormulaType(k),
                variant: "filled",
                color: "primary",
                columns: 2
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "参数调节",
            subtitle: "拖动滑块改变角 α 或齐次式系数",
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
              TrigIdentityScene,
              {
                params,
                scale,
                vp,
                onParamChange: handleParamChange,
                fontScale: canvasSize.font,
                studyMode,
                formulaType
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
  TrigIdentityAnimation
};
