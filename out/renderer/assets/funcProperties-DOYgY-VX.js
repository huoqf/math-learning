import { j as jsxRuntimeExports, R as React } from "./index-Bz0Bjl36.js";
import { C as CoordinateGrid } from "./CoordinateGrid-BmMyIyOq.js";
import { F as FunctionGraph } from "./FunctionGraph-DoU6C8dJ.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { w as withAlpha, b as MATH_COLORS, c as CANVAS_COLORS } from "./probabilityBayes-BWtGIkMp.js";
import { I as InteractivePoint } from "./InteractivePoint-ZTf14j6W.js";
import { I as IntervalShadow } from "./IntervalShadow--pOvsarb.js";
import { S as SecantLine } from "./SecantLine-CEmLCvrC.js";
import { A as Asymptote } from "./Asymptote-CeJ5uPCO.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import { n as evalSecantSlope, o as evalSymmetryPeriod, p as evalFunctionParity } from "./mathQuantities-CSLRzday.js";
const variantStyles = {
  primary: "bg-primary-50/50 border-primary-100 text-primary-700",
  info: "bg-neutral-50 border-neutral-200 text-neutral-600",
  warning: "bg-amber-50/50 border-amber-200 text-amber-700"
};
const TipCard = ({
  children,
  variant = "primary",
  className = ""
}) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: [
        "p-3 rounded-lg border text-ui-md leading-relaxed",
        variantStyles[variant],
        className
      ].join(" "),
      children
    }
  );
};
function PropertiesScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  fnType,
  mode
}) {
  const x0 = params.x0 ?? 1.5;
  const x1 = params.x1 ?? -1;
  const x2 = params.x2 ?? 2;
  const axisA = params.axisA ?? 0;
  const axisB = params.axisB ?? 2;
  const getFn = React.useCallback(
    (x) => {
      switch (fnType) {
        case "cubic":
          return x * x * x;
        case "quadratic":
          return x * x;
        case "abs":
          return Math.abs(x);
        case "reciprocal":
          return Math.abs(x) > 1e-4 ? 1 / x : NaN;
        case "sin":
          return Math.sin(x);
        default:
          return x;
      }
    },
    [fnType]
  );
  const fx0 = getFn(x0);
  const fx1 = getFn(x1);
  const fx2 = getFn(x2);
  const handleDragX0 = (mathPt) => {
    onParamChange("x0", Math.round(mathPt.x * 10) / 10);
  };
  const handleDragX1 = (mathPt) => {
    onParamChange("x1", Math.round(mathPt.x * 10) / 10);
  };
  const handleDragX2 = (mathPt) => {
    onParamChange("x2", Math.round(mathPt.x * 10) / 10);
  };
  const placedLabels = React.useMemo(() => {
    const entries = [];
    if (Number.isFinite(fx0)) {
      const pt = mathToDesign(x0, fx0, scale);
      entries.push({
        key: "P0",
        text: `P₀(${x0.toFixed(1)}, ${fx0.toFixed(1)})`,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: -12
      });
    }
    if (mode === "parity") {
      if (Number.isFinite(fx1)) {
        const pt1 = mathToDesign(x1, fx1, scale);
        entries.push({
          key: "P1",
          text: `P₁(${x1.toFixed(1)}, ${fx1.toFixed(1)})`,
          x: pt1.x,
          y: pt1.y,
          anchor: "middle",
          dy: -12
        });
      }
      if (Number.isFinite(fx2)) {
        const pt2 = mathToDesign(x2, fx2, scale);
        entries.push({
          key: "P2",
          text: `P₂(${x2.toFixed(1)}, ${fx2.toFixed(1)})`,
          x: pt2.x,
          y: pt2.y,
          anchor: "middle",
          dy: -12
        });
      }
    }
    return avoidLabels(entries, { fontScale });
  }, [x0, fx0, x1, fx1, x2, fx2, mode, scale, fontScale]);
  const parityRes = evalFunctionParity(fnType === "sin" ? "cubic" : fnType, x0);
  const secantRes = evalSecantSlope(getFn, x1, x2);
  const symRes = evalSymmetryPeriod(axisA, axisB);
  const ptAxisA1 = mathToDesign(axisA, scale.yMin, scale);
  const ptAxisA2 = mathToDesign(axisA, scale.yMax, scale);
  const ptAxisB1 = mathToDesign(axisB, scale.yMin, scale);
  const ptAxisB2 = mathToDesign(axisB, scale.yMax, scale);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    mode === "domain" && /* @__PURE__ */ jsxRuntimeExports.jsx("g", { children: fnType === "reciprocal" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        IntervalShadow,
        {
          fn: getFn,
          scale,
          x1: scale.xMin,
          x2: -0.05,
          fillColor: withAlpha(MATH_COLORS.functionTransformed, 0.15)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        IntervalShadow,
        {
          fn: getFn,
          scale,
          x1: 0.05,
          x2: scale.xMax,
          fillColor: withAlpha(MATH_COLORS.functionTransformed, 0.15)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Asymptote,
        {
          type: "vertical",
          value: 0,
          scale,
          label: "x = 0 (无定义断点)",
          fontScale,
          color: MATH_COLORS.degeneracy
        }
      )
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      IntervalShadow,
      {
        fn: getFn,
        scale,
        x1: scale.xMin,
        x2: scale.xMax,
        fillColor: withAlpha(MATH_COLORS.functionTransformed, 0.12)
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: getFn,
        scale,
        color: MATH_COLORS.function,
        strokeWidth: 2.5
      }
    ),
    mode === "domain" && Number.isFinite(fx0) && /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: x0,
        cy: fx0,
        scale,
        vp,
        onDrag: handleDragX0,
        color: MATH_COLORS.paramPrimary,
        label: `P₀(${x0.toFixed(1)}, ${fx0.toFixed(1)})`,
        labelKey: "P0",
        placedLabels,
        fontScale
      }
    ),
    mode === "parity" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      Number.isFinite(parityRes.fNegX) && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: scale.originX + -x0 * scale.scaleX,
            cy: scale.originY - parityRes.fNegX * scale.scaleY,
            r: 6,
            fill: MATH_COLORS.functionTransformed,
            stroke: CANVAS_COLORS.white,
            strokeWidth: 2
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: scale.originX + -x0 * scale.scaleX + 10,
            y: scale.originY - parityRes.fNegX * scale.scaleY - 10,
            fill: MATH_COLORS.functionTransformed,
            fontSize: fontScale(12),
            fontWeight: "bold",
            children: `P'(${(-x0).toFixed(1)}, ${parityRes.fNegX.toFixed(1)})`
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: scale.originX + x0 * scale.scaleX,
            y1: scale.originY - parityRes.fx * scale.scaleY,
            x2: scale.originX + -x0 * scale.scaleX,
            y2: scale.originY - parityRes.fNegX * scale.scaleY,
            stroke: MATH_COLORS.labelText,
            strokeDasharray: "4 4",
            strokeWidth: 1,
            opacity: 0.5
          }
        )
      ] }),
      Number.isFinite(fx0) && /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: x0,
          cy: fx0,
          scale,
          vp,
          onDrag: handleDragX0,
          color: MATH_COLORS.paramPrimary,
          label: `P₀(${x0.toFixed(1)}, ${fx0.toFixed(1)})`,
          labelKey: "P0",
          placedLabels,
          fontScale
        }
      ),
      Number.isFinite(fx1) && Number.isFinite(fx2) && Math.abs(x1 - x2) > 1e-4 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        SecantLine,
        {
          fn: getFn,
          scale,
          x1,
          x2,
          color: MATH_COLORS.secantLine,
          strokeWidth: 2
        }
      ),
      Number.isFinite(fx1) && /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: x1,
          cy: fx1,
          scale,
          vp,
          onDrag: handleDragX1,
          color: MATH_COLORS.paramSecondary,
          label: `P₁(${x1.toFixed(1)}, ${fx1.toFixed(1)})`,
          labelKey: "P1",
          placedLabels,
          fontScale
        }
      ),
      Number.isFinite(fx2) && /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: x2,
          cy: fx2,
          scale,
          vp,
          onDrag: handleDragX2,
          color: MATH_COLORS.paramTertiary,
          label: `P₂(${x2.toFixed(1)}, ${fx2.toFixed(1)})`,
          labelKey: "P2",
          placedLabels,
          fontScale
        }
      ),
      Number.isFinite(secantRes.slope) && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: scale.originX + (x1 + x2) / 2 * scale.scaleX,
          y: scale.originY - (fx1 + fx2) / 2 * scale.scaleY - 16,
          fill: MATH_COLORS.secantLine,
          fontSize: fontScale(13),
          fontWeight: "bold",
          textAnchor: "middle",
          className: "bg-white",
          children: `割线斜率 k = ${secantRes.slope.toFixed(2)} (${secantRes.slope > 0 ? "增" : "减"})`
        }
      )
    ] }),
    mode === "symmetry" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: ptAxisA1.x,
          y1: ptAxisA1.y,
          x2: ptAxisA2.x,
          y2: ptAxisA2.y,
          stroke: MATH_COLORS.paramPrimary,
          strokeDasharray: "6 4",
          strokeWidth: 2
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: ptAxisA1.x + 8,
          y: scale.originY - 3.8 * scale.scaleY,
          fill: MATH_COLORS.paramPrimary,
          fontSize: fontScale(12),
          fontWeight: "bold",
          children: `x = a (${axisA.toFixed(1)})`
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: ptAxisB1.x,
          y1: ptAxisB1.y,
          x2: ptAxisB2.x,
          y2: ptAxisB2.y,
          stroke: MATH_COLORS.paramSecondary,
          strokeDasharray: "6 4",
          strokeWidth: 2
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: ptAxisB1.x + 8,
          y: scale.originY - 3.2 * scale.scaleY,
          fill: MATH_COLORS.paramSecondary,
          fontSize: fontScale(12),
          fontWeight: "bold",
          children: `x = b (${axisB.toFixed(1)})`
        }
      ),
      symRes.dist > 1e-4 && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: ptAxisA1.x,
            y1: scale.originY - 2.8 * scale.scaleY,
            x2: ptAxisB1.x,
            y2: scale.originY - 2.8 * scale.scaleY,
            stroke: MATH_COLORS.labelText,
            strokeWidth: 1.5,
            strokeDasharray: "3 3"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: (ptAxisA1.x + ptAxisB1.x) / 2,
            y: scale.originY - 3 * scale.scaleY,
            fill: MATH_COLORS.labelText,
            fontSize: fontScale(12),
            fontWeight: "bold",
            textAnchor: "middle",
            children: `轴距 |a - b| = ${symRes.dist.toFixed(1)} ⇒ 最小正周期 T = 2|a - b| = ${symRes.period.toFixed(1)}`
          }
        )
      ] })
    ] })
  ] });
}
const defaultParams = {
  x0: 1.5,
  x1: -1,
  x2: 2,
  axisA: 0,
  axisB: 2
};
const paramMeta = {
  x0: {
    key: "x0",
    label: "主测试点 x0",
    labelFormula: "x_0",
    min: -4,
    max: 4,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
    description: "拖动观察点 $P_0(x_0, f(x_0))$ 及其奇偶对称点 $P'(-x_0, f(-x_0))$ 的坐标对应关系",
    descriptionFormula: "拖动观察点 $P_0(x_0, f(x_0))$ 及其奇偶对称点 $P'(-x_0, f(-x_0))$ 的坐标对应关系",
    marks: [
      { value: 0, variant: "critical", label: "原点", labelFormula: "x_0 = 0" }
    ]
  },
  x1: {
    key: "x1",
    label: "割线端点 x1",
    labelFormula: "x_1",
    min: -4,
    max: 4,
    step: 0.1,
    defaultValue: -1,
    importance: "core",
    description: "单调性测试：割线 $P_1P_2$ 的左侧自变量端点 $x_1$",
    descriptionFormula: "单调性测试：割线 $P_1P_2$ 的左侧自变量端点 $x_1$",
    marks: [
      { value: 0, variant: "critical", label: "原点", labelFormula: "x_1 = 0" }
    ]
  },
  x2: {
    key: "x2",
    label: "割线端点 x2",
    labelFormula: "x_2",
    min: -4,
    max: 4,
    step: 0.1,
    defaultValue: 2,
    importance: "core",
    description: "单调性测试：割线 $P_1P_2$ 的右侧自变量端点 $x_2$，用于计算割线斜率 $k = \\frac{\\Delta y}{\\Delta x}$",
    descriptionFormula: "单调性测试：割线 $P_1P_2$ 的右侧自变量端点 $x_2$，用于计算割线斜率 $k = \\frac{\\Delta y}{\\Delta x}$",
    marks: [
      { value: 0, variant: "critical", label: "原点", labelFormula: "x_2 = 0" }
    ]
  },
  axisA: {
    key: "axisA",
    label: "对称轴 a",
    labelFormula: "a",
    min: -3,
    max: 3,
    step: 0.1,
    defaultValue: 0,
    importance: "core",
    description: "移动第一条对称轴 $x = a$ 的位置（红虚线）",
    descriptionFormula: "移动第一条对称轴 $x = a$ 的位置（红虚线）",
    marks: [
      { value: 0, variant: "critical", label: "y轴", labelFormula: "a = 0" }
    ]
  },
  axisB: {
    key: "axisB",
    label: "对称轴 b",
    labelFormula: "b",
    min: -3,
    max: 3,
    step: 0.1,
    defaultValue: 2,
    importance: "core",
    description: "移动第二条对称轴 $x = b$ 的位置（橙虚线），观察两轴导出周期 $T = 2|a - b|$",
    descriptionFormula: "移动第二条对称轴 $x = b$ 的位置（橙虚线），观察两轴导出周期 $T = 2|a - b|$",
    marks: [
      {
        value: 2,
        variant: "recommended",
        label: "默认",
        labelFormula: "b = 2"
      },
      { value: 0, variant: "critical", label: "y轴", labelFormula: "b = 0" }
    ]
  }
};
export {
  PropertiesScene as P,
  TipCard as T,
  defaultParams as d,
  paramMeta as p
};
