import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { w as withAlpha, b as MATH_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { L as solveConstantDouble, b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import { d as defaultParams, p as paramMeta } from "./constant--oGylVwM.js";
import { C as CoordinateGrid } from "./CoordinateGrid-fDHVDEJz.js";
import { F as FunctionGraph } from "./FunctionGraph-DziQOq7W.js";
import { V as VectorArrow } from "./VectorArrow-DV8pzlQL.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { I as InteractivePoint } from "./InteractivePoint-2lsgO1SM.js";
import { I as IntervalShadow } from "./IntervalShadow-Dr5gFM2D.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import "./useRadioGroup-DJLu5uAU.js";
const DoubleVarScene = ({
  selectedLogic,
  params,
  scale,
  vp,
  fontScale = (v) => v,
  onParamChange
}) => {
  const yf = params.yf ?? 2.5;
  const xf = params.xf ?? 1.25;
  const yg = params.yg ?? 1.5;
  const xg = params.xg ?? 2.25;
  const mf = 0.5, nf = 2;
  const mg = 1.5, ng = 3;
  const res = reactExports.useMemo(() => {
    return solveConstantDouble(yf, xf, mf, nf, yg, xg, mg, ng, selectedLogic);
  }, [yf, xf, yg, xg, selectedLogic]);
  const handleFVertexDrag = (mathPt) => {
    onParamChange(
      "xf",
      Math.max(0.5, Math.min(2, Math.round(mathPt.x * 20) / 20))
    );
    onParamChange(
      "yf",
      Math.max(1, Math.min(4, Math.round(mathPt.y * 20) / 20))
    );
  };
  const handleGVertexDrag = (mathPt) => {
    onParamChange(
      "xg",
      Math.max(1.5, Math.min(3, Math.round(mathPt.x * 20) / 20))
    );
    onParamChange(
      "yg",
      Math.max(0, Math.min(3, Math.round(mathPt.y * 20) / 20))
    );
  };
  const evalFDouble = (x) => (x - xf) * (x - xf) + yf;
  const evalGDouble = (x) => -(x - xg) * (x - xg) + yg;
  const ptFMin = mathToDesign(res.xFMin, res.fMin, scale);
  const ptGMax = mathToDesign(res.xGMax, res.gMax, scale);
  const arrowLabel = reactExports.useMemo(() => {
    const symbolStr = res.isCurrentLogicTrue ? "≥" : "<";
    return `${res.battlePointF.y.toFixed(2)} ${symbolStr} ${res.battlePointG.y.toFixed(2)}`;
  }, [res]);
  const sameVarViolatedInterval = reactExports.useMemo(() => {
    if (selectedLogic !== "same_var") return null;
    const A = 2;
    const B = -2 * (xf + xg);
    const C = xf * xf + yf + xg * xg - yg;
    const delta = B * B - 4 * A * C;
    if (delta <= 0) return null;
    const sqrtDelta = Math.sqrt(delta);
    const r1 = (-B - sqrtDelta) / (2 * A);
    const r2 = (-B + sqrtDelta) / (2 * A);
    const vStart = Math.max(1.5, r1);
    const vEnd = Math.min(2, r2);
    return vStart < vEnd ? [vStart, vEnd] : null;
  }, [xf, yf, xg, yg, selectedLogic]);
  const { battleLabelOffsetYF, battleLabelOffsetYG } = reactExports.useMemo(() => {
    const ptF = mathToDesign(res.battlePointF.x, res.battlePointF.y, scale);
    const ptG = mathToDesign(res.battlePointG.x, res.battlePointG.y, scale);
    const dx = Math.abs(ptF.x - ptG.x);
    const dy = Math.abs(ptF.y - ptG.y);
    if (dx < 60 && dy < 18) {
      const fIsLower = ptF.y > ptG.y;
      return {
        battleLabelOffsetYF: fIsLower ? 12 : -10,
        battleLabelOffsetYG: fIsLower ? -10 : 12
      };
    }
    return {
      battleLabelOffsetYF: -4,
      battleLabelOffsetYG: -4
    };
  }, [res.battlePointF, res.battlePointG, scale]);
  const battleLabels = reactExports.useMemo(() => {
    let fText = "";
    let gText = "";
    switch (selectedLogic) {
      case "all_all":
        fText = "f_min";
        gText = "g_max";
        break;
      case "all_exist":
        fText = "f_min";
        gText = "g_min";
        break;
      case "exist_all":
        fText = "f_max";
        gText = "g_max";
        break;
      case "exist_exist":
        fText = "f_max";
        gText = "g_min";
        break;
      case "same_var":
        fText = "f";
        gText = "g";
        break;
    }
    return { fText, gText };
  }, [selectedLogic]);
  const placedLabels = reactExports.useMemo(() => {
    const ptFV = mathToDesign(xf, yf, scale);
    const ptGV = mathToDesign(xg, yg, scale);
    const entries = [
      {
        key: "f_vertex",
        text: `f(x)顶点(${xf.toFixed(2)}, ${yf.toFixed(2)})`,
        x: ptFV.x,
        y: ptFV.y,
        anchor: "middle",
        dy: -12,
        priority: 1
      },
      {
        key: "g_vertex",
        text: `g(x)顶点(${xg.toFixed(2)}, ${yg.toFixed(2)})`,
        x: ptGV.x,
        y: ptGV.y,
        anchor: "middle",
        dy: -12
      }
    ];
    return avoidLabels(entries, { fontScale });
  }, [xf, yf, xg, yg, scale, fontScale]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: mathToDesign(mf, 0, scale).x,
        y: mathToDesign(0, scale.yMax, scale).y,
        width: mathToDesign(nf, 0, scale).x - mathToDesign(mf, 0, scale).x,
        height: mathToDesign(0, scale.yMin, scale).y - mathToDesign(0, scale.yMax, scale).y,
        fill: withAlpha(MATH_COLORS.function, 0.03),
        pointerEvents: "none"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: mathToDesign(mf, 0, scale).x,
        y1: mathToDesign(0, scale.yMax, scale).y,
        x2: mathToDesign(mf, 0, scale).x,
        y2: mathToDesign(0, scale.yMin, scale).y,
        stroke: MATH_COLORS.asymptote,
        strokeWidth: 1,
        strokeDasharray: "2 2"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: mathToDesign(nf, 0, scale).x,
        y1: mathToDesign(0, scale.yMax, scale).y,
        x2: mathToDesign(nf, 0, scale).x,
        y2: mathToDesign(0, scale.yMin, scale).y,
        stroke: MATH_COLORS.asymptote,
        strokeWidth: 1,
        strokeDasharray: "2 2"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: mathToDesign(mf + 0.1, 0, scale).x,
        y: mathToDesign(0, scale.yMin - 0.2, scale).y,
        fill: MATH_COLORS.function,
        fontSize: fontScale(9),
        className: "font-bold select-none",
        children: "I₁ = [0.5, 2.0]"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: mathToDesign(mg, 0, scale).x,
        y: mathToDesign(0, scale.yMax, scale).y,
        width: mathToDesign(ng, 0, scale).x - mathToDesign(mg, 0, scale).x,
        height: mathToDesign(0, scale.yMin, scale).y - mathToDesign(0, scale.yMax, scale).y,
        fill: withAlpha(MATH_COLORS.functionSecondary, 0.03),
        pointerEvents: "none"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: mathToDesign(mg, 0, scale).x,
        y1: mathToDesign(0, scale.yMax, scale).y,
        x2: mathToDesign(mg, 0, scale).x,
        y2: mathToDesign(0, scale.yMin, scale).y,
        stroke: MATH_COLORS.asymptote,
        strokeWidth: 1,
        strokeDasharray: "2 2"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: mathToDesign(ng, 0, scale).x,
        y1: mathToDesign(0, scale.yMax, scale).y,
        x2: mathToDesign(ng, 0, scale).x,
        y2: mathToDesign(0, scale.yMin, scale).y,
        stroke: MATH_COLORS.asymptote,
        strokeWidth: 1,
        strokeDasharray: "2 2"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: mathToDesign(ng - 0.9, 0, scale).x,
        y: mathToDesign(0, scale.yMin - 0.2, scale).y,
        fill: MATH_COLORS.functionSecondary,
        fontSize: fontScale(9),
        className: "font-bold select-none",
        children: "I₂ = [1.5, 3.0]"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => x < mf || x > nf ? evalFDouble(x) : NaN,
        scale,
        color: withAlpha(MATH_COLORS.function, 0.35),
        strokeWidth: 1.2,
        strokeDasharray: "3 3"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => x >= mf && x <= nf ? evalFDouble(x) : NaN,
        scale,
        color: MATH_COLORS.function,
        strokeWidth: 2.8
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => x < mg || x > ng ? evalGDouble(x) : NaN,
        scale,
        color: withAlpha(MATH_COLORS.functionSecondary, 0.35),
        strokeWidth: 1.2,
        strokeDasharray: "3 3"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => x >= mg && x <= ng ? evalGDouble(x) : NaN,
        scale,
        color: MATH_COLORS.functionSecondary,
        strokeWidth: 2.8
      }
    ),
    selectedLogic === "same_var" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: mathToDesign(1.5, 0, scale).x,
        y: mathToDesign(0, scale.yMax, scale).y,
        width: mathToDesign(2, 0, scale).x - mathToDesign(1.5, 0, scale).x,
        height: mathToDesign(0, scale.yMin, scale).y - mathToDesign(0, scale.yMax, scale).y,
        fill: withAlpha(MATH_COLORS.inequality, 0.05),
        stroke: MATH_COLORS.inequality,
        strokeWidth: 1.5,
        strokeDasharray: "4 4",
        pointerEvents: "none"
      }
    ),
    selectedLogic === "same_var" && sameVarViolatedInterval && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        IntervalShadow,
        {
          fn: evalFDouble,
          x1: sameVarViolatedInterval[0],
          x2: sameVarViolatedInterval[1],
          scale,
          fillColor: withAlpha(MATH_COLORS.degeneracy, 0.12),
          strokeColor: MATH_COLORS.degeneracy,
          strokeWidth: 1.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        IntervalShadow,
        {
          fn: evalGDouble,
          x1: sameVarViolatedInterval[0],
          x2: sameVarViolatedInterval[1],
          scale,
          fillColor: withAlpha(MATH_COLORS.degeneracy, 0.05),
          strokeColor: MATH_COLORS.degeneracy,
          strokeWidth: 1.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: mathToDesign(
            (sameVarViolatedInterval[0] + sameVarViolatedInterval[1]) / 2,
            0,
            scale
          ).x,
          y: mathToDesign(0, scale.yMin + 0.3, scale).y,
          textAnchor: "middle",
          fill: MATH_COLORS.degeneracy,
          fontSize: fontScale(10),
          className: "font-bold select-none",
          children: [
            "违背区间 [",
            sameVarViolatedInterval[0].toFixed(2),
            ",",
            " ",
            sameVarViolatedInterval[1].toFixed(2),
            "]"
          ]
        }
      )
    ] }),
    selectedLogic !== "same_var" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: mathToDesign(scale.xMin, res.fMin, scale).x,
          y1: ptFMin.y,
          x2: mathToDesign(scale.xMax, res.fMin, scale).x,
          y2: ptFMin.y,
          stroke: withAlpha(MATH_COLORS.function, 0.35),
          strokeWidth: 1,
          strokeDasharray: "3 3"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: mathToDesign(scale.xMin, res.gMax, scale).x,
          y1: ptGMax.y,
          x2: mathToDesign(scale.xMax, res.gMax, scale).x,
          y2: ptGMax.y,
          stroke: withAlpha(MATH_COLORS.functionSecondary, 0.35),
          strokeWidth: 1,
          strokeDasharray: "3 3"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      VectorArrow,
      {
        from: [res.battlePointF.x, res.battlePointF.y],
        to: [res.battlePointG.x, res.battlePointG.y],
        scale,
        color: res.isCurrentLogicTrue ? MATH_COLORS.inequality : MATH_COLORS.degeneracy,
        strokeWidth: 2.5,
        label: arrowLabel,
        labelSize: 10,
        fontScale,
        labelOffset: [0, -10]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "text",
      {
        x: mathToDesign(res.battlePointF.x, res.battlePointF.y, scale).x - 6,
        y: mathToDesign(res.battlePointF.x, res.battlePointF.y, scale).y + battleLabelOffsetYF,
        textAnchor: "end",
        fill: MATH_COLORS.function,
        fontSize: fontScale(9),
        className: "font-bold font-mono select-none",
        children: [
          battleLabels.fText,
          "(",
          res.battlePointF.y.toFixed(2),
          ")"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "text",
      {
        x: mathToDesign(res.battlePointG.x, res.battlePointG.y, scale).x + 6,
        y: mathToDesign(res.battlePointG.x, res.battlePointG.y, scale).y + battleLabelOffsetYG,
        textAnchor: "start",
        fill: MATH_COLORS.functionSecondary,
        fontSize: fontScale(9),
        className: "font-bold font-mono select-none",
        children: [
          battleLabels.gText,
          "(",
          res.battlePointG.y.toFixed(2),
          ")"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: xf,
        cy: yf,
        scale,
        vp,
        onDrag: handleFVertexDrag,
        color: MATH_COLORS.paramPrimary,
        r: 6,
        label: `f(x)顶点(${xf.toFixed(2)}, ${yf.toFixed(2)})`,
        labelKey: "f_vertex",
        placedLabels,
        fontScale
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: xg,
        cy: yg,
        scale,
        vp,
        onDrag: handleGVertexDrag,
        color: MATH_COLORS.paramSecondary,
        r: 6,
        label: `g(x)顶点(${xg.toFixed(2)}, ${yg.toFixed(2)})`,
        labelKey: "g_vertex",
        placedLabels,
        fontScale
      }
    )
  ] });
};
function DoubleVarPage() {
  const [selectedLogic, setSelectedLogic] = reactExports.useState("all_all");
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-0.5, 4],
    yRange: [-3, 7]
  });
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-constant-double", params, {
      selectedLogic
    });
  }, [params, selectedLogic]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  const handleReset = () => {
    setParams({ ...defaultParams });
  };
  const paramConfigs = reactExports.useMemo(() => {
    const keys = ["xf", "yf", "xg", "yg"];
    return keys.map((key) => {
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
  }, [params]);
  const formulasLatex = reactExports.useMemo(() => {
    if (selectedLogic === "same_var") {
      const fStr = `f(x) = (x - ${params.xf.toFixed(2)})^2 + \\color{${MATH_COLORS.paramPrimary}}{${params.yf.toFixed(2)}}, \\; g(x) = -(x - ${params.xg.toFixed(2)})^2 + \\color{${MATH_COLORS.paramSecondary}}{${params.yg.toFixed(2)}}`;
      const goalStr = `\\text{目标：对 } \\forall x \\in I_1 \\cap I_2 = [1.50, 2.00], \\; f(x) \\ge g(x)`;
      return { line1: fStr, line2: goalStr };
    } else {
      const fStr = `f(x) = (x - ${params.xf.toFixed(2)})^2 + \\color{${MATH_COLORS.paramPrimary}}{${params.yf.toFixed(2)}} \\quad x \\in [0.5, 2.0]`;
      const gStr = `g(x) = -(x - ${params.xg.toFixed(2)})^2 + \\color{${MATH_COLORS.paramSecondary}}{${params.yg.toFixed(2)}} \\quad x \\in [1.5, 3.0]`;
      return { line1: fStr, line2: gStr };
    }
  }, [selectedLogic, params]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "高考双变量博弈",
            subtitle: "双动点对决与同变量差函数博弈",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: [
                  {
                    key: "all_all",
                    label: "∀x₁, ∀x₂",
                    formula: "\\forall x_1, \\forall x_2",
                    description: "任意对任意-极值隔离",
                    fullWidth: true
                  },
                  {
                    key: "all_exist",
                    label: "∀x₁, ∃x₂",
                    formula: "\\forall x_1, \\exists x_2",
                    description: "任意对存在",
                    fullWidth: true
                  },
                  {
                    key: "exist_all",
                    label: "∃x₁, ∀x₂",
                    formula: "\\exists x_1, \\forall x_2",
                    description: "存在对任意",
                    fullWidth: true
                  },
                  {
                    key: "exist_exist",
                    label: "∃x₁, ∃x₂",
                    formula: "\\exists x_1, \\exists x_2",
                    description: "存在对存在",
                    fullWidth: true
                  },
                  {
                    key: "same_var",
                    label: "∀x ∈ I₁ ∩ I₂",
                    formula: "\\forall x \\in I_1 \\cap I_2",
                    description: "同变量对垒-差函数",
                    fullWidth: true
                  }
                ],
                value: selectedLogic,
                onChange: (k) => setSelectedLogic(k),
                variant: "filled",
                columns: 2
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: handleReset
          }
        )
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white select-none", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-250 rounded-xl px-4 py-2.5 shadow-md flex flex-col gap-1 font-mono", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-neutral-400 font-bold mb-0.5", children: "高考数学方程" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: formulasLatex.line1, mode: "inline" }) }),
          formulasLatex.line2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm border-t border-neutral-100 pt-1 mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: formulasLatex.line2, mode: "inline" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              DoubleVarScene,
              {
                selectedLogic,
                params,
                scale,
                vp,
                fontScale: canvasSize.font,
                onParamChange: handleParamChange
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
          title: "双动点博弈看板"
        }
      )
    }
  );
}
export {
  DoubleVarPage
};
