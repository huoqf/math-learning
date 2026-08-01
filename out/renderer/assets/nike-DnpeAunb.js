import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { C as CoordinateGrid } from "./CoordinateGrid-BmMyIyOq.js";
import { F as FunctionGraph } from "./FunctionGraph-DoU6C8dJ.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { b as MATH_COLORS, w as withAlpha, c as CANVAS_COLORS } from "./probabilityBayes-BWtGIkMp.js";
import { I as InteractivePoint } from "./InteractivePoint-ZTf14j6W.js";
import { T as TangentLine } from "./TangentLine-DSaW8mKI.js";
import { A as Asymptote } from "./Asymptote-CeJ5uPCO.js";
import { M as solveNike, N as evalNikeAt } from "./mathQuantities-CSLRzday.js";
import { b as avoidLabelOffsets } from "./labelAvoider-DY-BzTvY.js";
function NikeScene({
  params,
  scale,
  vp,
  activeMode,
  onParamChange,
  fontScale = (v) => v
}) {
  const a = params.a ?? 1;
  const b = params.b ?? 4;
  const x0 = params.x0 ?? 3;
  const h = activeMode === "shifted" ? params.h ?? 0 : 0;
  const c = activeMode === "shifted" ? params.c ?? 0 : 0;
  const res = solveNike(a, b, h, c);
  const evalPt = evalNikeAt(a, b, h, c, x0);
  const handleDragProbe = (mathPt) => {
    let newX = Math.round(mathPt.x * 10) / 10;
    if (Math.abs(newX - h) < 0.2) {
      newX = newX >= h ? h + 0.2 : h - 0.2;
    }
    onParamChange("x0", newX);
  };
  const handleDragCenter = (mathPt) => {
    onParamChange("h", Math.round(mathPt.x * 2) / 2);
    onParamChange("c", Math.round(mathPt.y * 2) / 2);
  };
  const nikeFn = (x) => {
    const dx = x - h;
    if (Math.abs(dx) < 1e-4) return NaN;
    return a * dx + c + b / dx;
  };
  const fnLine = (x) => a * (x - h) + c;
  const centerDesign = mathToDesign(h, c, scale);
  const probeDesign = evalPt.isValid ? mathToDesign(x0, evalPt.y, scale) : null;
  const amgmY1 = a * (x0 - h);
  const amgmY2 = b / (x0 - h);
  const amgmPt1Design = mathToDesign(x0, amgmY1, scale);
  const amgmPt2Design = mathToDesign(x0, amgmY2, scale);
  const amgmBaseDesign = mathToDesign(x0, 0, scale);
  const labelEntries = reactExports.useMemo(() => {
    const rawList = [];
    res.criticalPoints.forEach((cp, idx) => {
      const pt = mathToDesign(cp.x, cp.y, scale);
      rawList.push({
        key: `cp-${idx}`,
        text: cp.label,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: -14
      });
    });
    if (probeDesign) {
      rawList.push({
        key: "probe",
        text: `P(${x0.toFixed(1)}, ${evalPt.y.toFixed(1)})`,
        x: probeDesign.x,
        y: probeDesign.y,
        anchor: "middle",
        dy: -14
      });
    }
    if (activeMode === "shifted") {
      rawList.push({
        key: "center",
        text: `中心 C(${h.toFixed(1)}, ${c.toFixed(1)})`,
        x: centerDesign.x,
        y: centerDesign.y,
        anchor: "middle",
        dy: 14
      });
    }
    return rawList;
  }, [
    res.criticalPoints,
    probeDesign,
    centerDesign,
    scale,
    activeMode,
    x0,
    evalPt.y,
    h,
    c
  ]);
  const labelOffsets = reactExports.useMemo(() => {
    return avoidLabelOffsets(labelEntries);
  }, [labelEntries]);
  const labelOffsetMap = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    labelEntries.forEach((entry, idx) => {
      const offset = labelOffsets[idx] || { dx: 0, dy: 0 };
      map.set(entry.key, offset);
    });
    return map;
  }, [labelEntries, labelOffsets]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Asymptote,
      {
        type: "vertical",
        value: h,
        scale,
        label: h === 0 ? "x = 0 (y轴渐近线)" : `x = ${h.toFixed(1)}`,
        fontScale,
        color: MATH_COLORS.asymptote
      }
    ),
    Math.abs(a) >= 1e-4 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: fnLine,
        scale,
        color: withAlpha(MATH_COLORS.asymptote, 0.6),
        strokeWidth: 1.5,
        strokeDasharray: "5,5"
      }
    ),
    activeMode === "amgm" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => a * x,
          scale,
          color: withAlpha(MATH_COLORS.paramPrimary, 0.4),
          strokeWidth: 1.5,
          strokeDasharray: "4,4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => Math.abs(x) < 1e-4 ? NaN : b / x,
          scale,
          color: withAlpha(MATH_COLORS.paramSecondary, 0.4),
          strokeWidth: 1.5,
          strokeDasharray: "4,4"
        }
      ),
      probeDesign && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "amgm-decomposition", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: amgmBaseDesign.x,
            y1: amgmBaseDesign.y,
            x2: probeDesign.x,
            y2: probeDesign.y,
            stroke: MATH_COLORS.paramTertiary,
            strokeWidth: 1.5,
            strokeDasharray: "3,3"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: amgmPt1Design.x,
            cy: amgmPt1Design.y,
            r: 4,
            fill: MATH_COLORS.paramPrimary
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: amgmPt2Design.x,
            cy: amgmPt2Design.y,
            r: 4,
            fill: MATH_COLORS.paramSecondary
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: amgmPt1Design.x,
            y1: amgmPt1Design.y,
            x2: probeDesign.x,
            y2: probeDesign.y,
            stroke: MATH_COLORS.paramSecondary,
            strokeWidth: 2
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: nikeFn,
        scale,
        color: res.curveType === "nike" ? MATH_COLORS.function : res.curveType === "streamer" ? MATH_COLORS.functionTransformed : MATH_COLORS.degeneracy,
        strokeWidth: 2.5
      }
    ),
    res.criticalPoints.map((cp, idx) => {
      const pt = mathToDesign(cp.x, cp.y, scale);
      const offset = labelOffsetMap.get(`cp-${idx}`) || { dx: 0, dy: -12 };
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: pt.x - 25,
            y1: pt.y,
            x2: pt.x + 25,
            y2: pt.y,
            stroke: MATH_COLORS.tangentLine,
            strokeWidth: 1.5,
            strokeDasharray: "4,2"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: pt.x,
            cy: pt.y,
            r: 5,
            fill: MATH_COLORS.vertexPoint,
            stroke: CANVAS_COLORS.white,
            strokeWidth: 1.5
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: pt.x + offset.dx,
            y: pt.y - 12 + offset.dy,
            fill: MATH_COLORS.vertexPoint,
            fontSize: fontScale(11),
            fontWeight: "bold",
            textAnchor: "middle",
            children: [
              cp.type === "min" ? "极小值" : "极大值",
              " (",
              cp.x.toFixed(1),
              ",",
              " ",
              cp.y.toFixed(1),
              ")"
            ]
          }
        )
      ] }, `crit-${idx}`);
    }),
    activeMode === "shifted" && /* @__PURE__ */ jsxRuntimeExports.jsx("g", { className: "symmetry-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: h,
        cy: c,
        scale,
        vp,
        onDrag: handleDragCenter,
        label: `中心 C(${h.toFixed(1)}, ${c.toFixed(1)})`,
        color: MATH_COLORS.focusPoint,
        fontScale
      }
    ) }),
    evalPt.isValid && probeDesign && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "probe-point", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TangentLine,
        {
          fn: nikeFn,
          x0,
          scale,
          color: MATH_COLORS.tangentLine,
          strokeWidth: 1.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: x0,
          cy: evalPt.y,
          scale,
          vp,
          onDrag: handleDragProbe,
          label: `P(${x0.toFixed(1)}, ${evalPt.y.toFixed(1)})`,
          color: MATH_COLORS.interactiveActive,
          fontScale
        }
      )
    ] })
  ] });
}
const defaultParams = {
  a: 1,
  b: 4,
  x0: 3,
  h: 0,
  c: 0
};
const paramMeta = {
  a: {
    key: "a",
    label: "斜率 / 系数 a",
    labelFormula: "a",
    min: -3,
    max: 3,
    step: 0.1,
    defaultValue: 1,
    importance: "core",
    description: "斜渐近线 y = ax 的斜率及展开幅度",
    descriptionFormula: "控制斜渐近线 $y = ax$ 的斜率",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "退化为反比例",
        labelFormula: "a = 0"
      },
      { value: 1, variant: "recommended", label: "标准1" }
    ]
  },
  b: {
    key: "b",
    label: "分子系数 b",
    labelFormula: "b",
    min: -9,
    max: 9,
    step: 0.5,
    defaultValue: 4,
    importance: "core",
    description: "控制曲率及对勾/飘带形态切换",
    descriptionFormula: "$b > 0$ 为对勾型，$b < 0$ 为飘带型",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "退化为一次线",
        labelFormula: "b = 0"
      },
      { value: 4, variant: "recommended", label: "标准4" }
    ]
  },
  x0: {
    key: "x0",
    label: "动点 x 坐标",
    labelFormula: "x_0",
    min: -6,
    max: 6,
    step: 0.1,
    defaultValue: 3,
    importance: "advanced",
    description: "曲线上可拖动的探针动点 P(x_0, y_0)",
    descriptionFormula: "曲线上可拖动的探针动点 $P(x_0, y_0)$"
  },
  h: {
    key: "h",
    label: "水平平移 h",
    labelFormula: "h",
    min: -4,
    max: 4,
    step: 0.5,
    defaultValue: 0,
    importance: "advanced",
    description: "垂直渐近线 x = h 的平移位置",
    descriptionFormula: "垂直渐近线 $x = h$ 的平移位置"
  },
  c: {
    key: "c",
    label: "垂直平移 c",
    labelFormula: "c",
    min: -4,
    max: 4,
    step: 0.5,
    defaultValue: 0,
    importance: "advanced",
    description: "渐近线中心点 y 轴平移量",
    descriptionFormula: "渐近线中心点 $(h, c)$ 的 $y$ 轴偏移"
  }
};
export {
  NikeScene as N,
  defaultParams as d,
  paramMeta as p
};
