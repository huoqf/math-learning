import { R as React, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { C as CoordinateGrid } from "./CoordinateGrid-fDHVDEJz.js";
import { F as FunctionGraph } from "./FunctionGraph-DziQOq7W.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { b as MATH_COLORS, c as CANVAS_COLORS } from "./probabilityBayes-DNLi5nE3.js";
import { I as InteractivePoint } from "./InteractivePoint-2lsgO1SM.js";
import { A as Asymptote } from "./Asymptote-DqWNp8bH.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import { q as calculatePowerFunction, r as calculateExpLog } from "./mathQuantities-CPwsyb9V.js";
function ExpLogScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  funcType,
  showInverse = false
}) {
  const x0 = params.x0 ?? 1.5;
  const a = params.baseA ?? 2;
  const powerAlpha = params.powerAlpha ?? 2;
  const handleDragX0 = (mathPt) => {
    onParamChange("x0", Math.round(mathPt.x * 10) / 10);
  };
  const powerRes = React.useMemo(
    () => calculatePowerFunction(powerAlpha, x0),
    [powerAlpha, x0]
  );
  const placedLabels = React.useMemo(() => {
    const entries = [];
    const isValidBase2 = a > 0 && Math.abs(a - 1) > 1e-4;
    if (funcType === "exponential" && isValidBase2) {
      const expLogRes = calculateExpLog(a, x0);
      if (Number.isFinite(expLogRes.expVal)) {
        const pt = mathToDesign(x0, expLogRes.expVal, scale);
        entries.push({
          key: "P",
          text: `P(${x0.toFixed(1)}, ${expLogRes.expVal.toFixed(1)})`,
          x: pt.x,
          y: pt.y,
          anchor: "middle",
          dy: -12
        });
        if (showInverse) {
          const invPt = mathToDesign(expLogRes.expVal, x0, scale);
          entries.push({
            key: "P_inv",
            text: `P'(${expLogRes.expVal.toFixed(1)}, ${x0.toFixed(1)})`,
            x: invPt.x,
            y: invPt.y,
            anchor: "start",
            dy: -8
          });
        }
      }
    } else if (funcType === "logarithmic" && isValidBase2) {
      if (x0 > 0) {
        const logVal = Math.log(x0) / Math.log(a);
        if (Number.isFinite(logVal)) {
          const pt = mathToDesign(x0, logVal, scale);
          entries.push({
            key: "P",
            text: `P(${x0.toFixed(1)}, ${logVal.toFixed(1)})`,
            x: pt.x,
            y: pt.y,
            anchor: "middle",
            dy: -12
          });
          if (showInverse) {
            const invPt = mathToDesign(logVal, x0, scale);
            entries.push({
              key: "P_inv",
              text: `P'(${logVal.toFixed(1)}, ${x0.toFixed(1)})`,
              x: invPt.x,
              y: invPt.y,
              anchor: "start",
              dy: -8
            });
          }
        }
      }
    } else if (funcType === "power") {
      if (powerRes.isValidPoint) {
        const pt = mathToDesign(x0, powerRes.yVal, scale);
        entries.push({
          key: "P",
          text: `P(${x0.toFixed(1)}, ${powerRes.yVal.toFixed(1)})`,
          x: pt.x,
          y: pt.y,
          anchor: "middle",
          dy: -12
        });
      }
    }
    return avoidLabels(entries, { fontScale });
  }, [funcType, x0, a, powerAlpha, powerRes, showInverse, scale, fontScale]);
  if (funcType === "power") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
      powerAlpha < 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Asymptote,
          {
            type: "vertical",
            value: 0,
            scale,
            label: "x = 0",
            fontScale
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Asymptote,
          {
            type: "horizontal",
            value: 0,
            scale,
            label: "y = 0",
            fontScale
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => {
            if (powerAlpha === 0) return Math.abs(x) < 1e-4 ? NaN : 1;
            if (powerAlpha < 0) {
              if (Math.abs(x) < 1e-3) return NaN;
              if (x < 0 && !Number.isInteger(powerAlpha)) return NaN;
              return Math.pow(x, powerAlpha);
            }
            if (x < 0 && !Number.isInteger(powerAlpha)) return NaN;
            return Math.pow(x, powerAlpha);
          },
          scale,
          color: MATH_COLORS.function,
          strokeWidth: 2.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: scale.originX + 1 * scale.scaleX,
          cy: scale.originY - 1 * scale.scaleY,
          r: 5,
          fill: MATH_COLORS.paramPrimary
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: scale.originX + 1 * scale.scaleX + 8,
          y: scale.originY - 1 * scale.scaleY - 6,
          fill: MATH_COLORS.paramPrimary,
          fontSize: fontScale(11),
          fontWeight: "bold",
          children: "(1, 1)"
        }
      ),
      powerAlpha > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: scale.originX,
          cy: scale.originY,
          r: 4,
          fill: MATH_COLORS.function
        }
      ),
      powerRes.isValidPoint && /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: x0,
          cy: powerRes.yVal,
          scale,
          vp,
          onDrag: handleDragX0,
          color: MATH_COLORS.function,
          label: `P(${x0.toFixed(1)}, ${powerRes.yVal.toFixed(1)})`,
          labelKey: "P",
          placedLabels,
          fontScale
        }
      )
    ] });
  }
  const isValidBase = a > 0 && Math.abs(a - 1) > 1e-4;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    funcType === "exponential" && isValidBase && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Asymptote,
      {
        type: "horizontal",
        value: 0,
        scale,
        label: "y = 0",
        fontScale
      }
    ),
    funcType === "logarithmic" && isValidBase && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Asymptote,
      {
        type: "vertical",
        value: 0,
        scale,
        label: "x = 0",
        fontScale
      }
    ),
    showInverse && /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => x,
        scale,
        color: MATH_COLORS.labelText,
        strokeWidth: 1.5,
        strokeDasharray: "6 4"
      }
    ),
    funcType === "exponential" && isValidBase && /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => Math.pow(a, x),
        scale,
        color: MATH_COLORS.function,
        strokeWidth: 2.5
      }
    ),
    funcType === "logarithmic" && isValidBase && /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => x > 0 ? Math.log(x) / Math.log(a) : NaN,
        scale,
        color: MATH_COLORS.function,
        strokeWidth: 2.5
      }
    ),
    showInverse && isValidBase && funcType === "exponential" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => x > 0 ? Math.log(x) / Math.log(a) : NaN,
        scale,
        color: MATH_COLORS.functionTransformed,
        strokeWidth: 2.5,
        strokeDasharray: "4 4"
      }
    ),
    showInverse && isValidBase && funcType === "logarithmic" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => Math.pow(a, x),
        scale,
        color: MATH_COLORS.functionTransformed,
        strokeWidth: 2.5,
        strokeDasharray: "4 4"
      }
    ),
    isValidBase && funcType === "exponential" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: scale.originX,
          cy: scale.originY - 1 * scale.scaleY,
          r: 4.5,
          fill: MATH_COLORS.function
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: scale.originX + 8,
          y: scale.originY - 1 * scale.scaleY,
          fill: MATH_COLORS.function,
          fontSize: fontScale(11),
          fontWeight: "bold",
          children: "(0, 1)"
        }
      )
    ] }),
    isValidBase && funcType === "logarithmic" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: scale.originX + 1 * scale.scaleX,
          cy: scale.originY,
          r: 4.5,
          fill: MATH_COLORS.function
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: scale.originX + 1 * scale.scaleX,
          y: scale.originY - 12,
          fill: MATH_COLORS.function,
          fontSize: fontScale(11),
          fontWeight: "bold",
          children: "(1, 0)"
        }
      )
    ] }),
    isValidBase && funcType === "exponential" && (() => {
      const expLogRes = calculateExpLog(a, x0);
      if (!Number.isFinite(expLogRes.expVal)) return null;
      const invPt = mathToDesign(expLogRes.expVal, x0, scale);
      const pInvLabelObj = placedLabels.find((l) => l.key === "P_inv");
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          InteractivePoint,
          {
            cx: x0,
            cy: expLogRes.expVal,
            scale,
            vp,
            onDrag: handleDragX0,
            color: MATH_COLORS.function,
            label: `P(${x0.toFixed(1)}, ${expLogRes.expVal.toFixed(1)})`,
            labelKey: "P",
            placedLabels,
            fontScale
          }
        ),
        showInverse && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: invPt.x,
              cy: invPt.y,
              r: 6,
              fill: MATH_COLORS.functionTransformed,
              stroke: CANVAS_COLORS.white,
              strokeWidth: 2
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: pInvLabelObj ? pInvLabelObj.x : invPt.x + 8,
              y: pInvLabelObj ? pInvLabelObj.y : invPt.y - 8,
              fill: MATH_COLORS.functionTransformed,
              fontSize: fontScale(11),
              fontWeight: "bold",
              children: `P'(${expLogRes.expVal.toFixed(1)}, ${x0.toFixed(1)})`
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: scale.originX + x0 * scale.scaleX,
              y1: scale.originY - expLogRes.expVal * scale.scaleY,
              x2: invPt.x,
              y2: invPt.y,
              stroke: MATH_COLORS.labelText,
              strokeDasharray: "3 3",
              strokeWidth: 1,
              opacity: 0.5
            }
          )
        ] })
      ] });
    })(),
    isValidBase && funcType === "logarithmic" && x0 > 0 && (() => {
      const logVal = Math.log(x0) / Math.log(a);
      if (!Number.isFinite(logVal)) return null;
      const invPt = mathToDesign(logVal, x0, scale);
      const pInvLabelObj = placedLabels.find((l) => l.key === "P_inv");
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          InteractivePoint,
          {
            cx: x0,
            cy: logVal,
            scale,
            vp,
            onDrag: handleDragX0,
            color: MATH_COLORS.function,
            label: `P(${x0.toFixed(1)}, ${logVal.toFixed(1)})`,
            labelKey: "P",
            placedLabels,
            fontScale
          }
        ),
        showInverse && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: invPt.x,
              cy: invPt.y,
              r: 6,
              fill: MATH_COLORS.functionTransformed,
              stroke: CANVAS_COLORS.white,
              strokeWidth: 2
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: pInvLabelObj ? pInvLabelObj.x : invPt.x + 8,
              y: pInvLabelObj ? pInvLabelObj.y : invPt.y - 8,
              fill: MATH_COLORS.functionTransformed,
              fontSize: fontScale(11),
              fontWeight: "bold",
              children: `P'(${logVal.toFixed(1)}, ${x0.toFixed(1)})`
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: scale.originX + x0 * scale.scaleX,
              y1: scale.originY - logVal * scale.scaleY,
              x2: invPt.x,
              y2: invPt.y,
              stroke: MATH_COLORS.labelText,
              strokeDasharray: "3 3",
              strokeWidth: 1,
              opacity: 0.5
            }
          )
        ] })
      ] });
    })()
  ] });
}
const defaultParams = {
  x0: 1.5,
  baseA: 2,
  powerAlpha: 2
};
const paramMeta = {
  x0: {
    key: "x0",
    label: "采样点 x0",
    labelFormula: "x_0",
    min: -4,
    max: 4,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
    description: "控制研究函数奇偶对称性、反函数对应点的自变量位置 x0"
  },
  baseA: {
    key: "baseA",
    label: "指对数底数 a",
    labelFormula: "a",
    min: 0.1,
    max: 4,
    step: 0.1,
    defaultValue: 2,
    importance: "core",
    description: "控制指数函数 y = a^x 与对数函数 y = log_a(x) 的底数，a = 1 时退化",
    descriptionFormula: "控制指数函数 $y = a^x$ 与对数函数 $y = \\log_a(x)$ 的底数，$a = 1$ 时退化",
    marks: [
      {
        value: 1,
        variant: "critical",
        label: "退化 (a=1)",
        labelFormula: "a = 1"
      }
    ]
  },
  powerAlpha: {
    key: "powerAlpha",
    label: "幂函数指数 α",
    labelFormula: "\\alpha",
    min: -2,
    max: 3,
    step: 0.5,
    defaultValue: 2,
    importance: "core",
    description: "控制幂函数 y = x^α 的指数形状 (如 -1, 0.5, 1, 2, 3)",
    descriptionFormula: "控制幂函数 $y = x^{\\alpha}$ 的指数形状"
  }
};
export {
  ExpLogScene as E,
  defaultParams as d,
  paramMeta as p
};
