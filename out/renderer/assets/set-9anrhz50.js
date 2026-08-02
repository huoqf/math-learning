import { R as React, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { C as CoordinateGrid } from "./CoordinateGrid-fDHVDEJz.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { b as MATH_COLORS, w as withAlpha, c as CANVAS_COLORS } from "./probabilityBayes-DNLi5nE3.js";
import { I as InteractivePoint } from "./InteractivePoint-2lsgO1SM.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import { aj as isPointInCircle } from "./mathQuantities-CPwsyb9V.js";
function SetScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  vennOp = "intersection",
  showLogic = false
}) {
  const xA = params.xA ?? -1.2;
  const yA = params.yA ?? 0;
  const rA = Math.max(0, params.rA ?? 2.2);
  const xB = params.xB ?? 1.2;
  const yB = params.yB ?? 0;
  const rB = Math.max(0, params.rB ?? 2.2);
  const xP = params.xP ?? 0;
  const yP = params.yP ?? 0;
  const posA = mathToDesign(xA, yA, scale);
  const posB = mathToDesign(xB, yB, scale);
  const radiusAInPx = rA * scale.scaleX;
  const radiusBInPx = rB * scale.scaleX;
  const inA = isPointInCircle({ x: xP, y: yP }, { x: xA, y: yA, r: rA });
  const inB = isPointInCircle({ x: xP, y: yP }, { x: xB, y: yB, r: rB });
  const handleDragA = (mathPt) => {
    onParamChange("xA", Math.round(mathPt.x * 10) / 10);
    onParamChange("yA", Math.round(mathPt.y * 10) / 10);
  };
  const handleDragB = (mathPt) => {
    onParamChange("xB", Math.round(mathPt.x * 10) / 10);
    onParamChange("yB", Math.round(mathPt.y * 10) / 10);
  };
  const handleDragP = (mathPt) => {
    onParamChange("xP", Math.round(mathPt.x * 10) / 10);
    onParamChange("yP", Math.round(mathPt.y * 10) / 10);
  };
  const placedLabels = React.useMemo(() => {
    const entries = [
      {
        key: "O_A",
        text: "O_A",
        x: posA.x,
        y: posA.y,
        anchor: "middle",
        dy: -12
      },
      {
        key: "O_B",
        text: "O_B",
        x: posB.x,
        y: posB.y,
        anchor: "middle",
        dy: -12
      },
      {
        key: "P",
        text: `P(${xP.toFixed(1)}, ${yP.toFixed(1)})`,
        x: mathToDesign(xP, yP, scale).x,
        y: mathToDesign(xP, yP, scale).y,
        anchor: "middle",
        dy: -12
      }
    ];
    return avoidLabels(entries, { fontScale });
  }, [xA, yA, xB, yB, xP, yP, scale, fontScale]);
  const clipIdA = "clip-venn-circle-a";
  const clipIdB = "clip-venn-circle-b";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("defs", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("clipPath", { id: clipIdA, children: /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: posA.x, cy: posA.y, r: radiusAInPx }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("clipPath", { id: clipIdB, children: /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: posB.x, cy: posB.y, r: radiusBInPx }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: scale.originX - 5.5 * scale.scaleX,
        y: scale.originY - 3.8 * scale.scaleY,
        width: 11 * scale.scaleX,
        height: 7.6 * scale.scaleY,
        fill: "none",
        stroke: MATH_COLORS.labelText,
        strokeDasharray: "6 4",
        strokeWidth: 1.5,
        rx: 12,
        opacity: 0.35
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: scale.originX - 5.3 * scale.scaleX,
        y: scale.originY - 3.3 * scale.scaleY,
        fill: MATH_COLORS.labelText,
        fontSize: fontScale(14),
        fontWeight: "bold",
        children: "全集 U"
      }
    ),
    vennOp === "intersection" && /* @__PURE__ */ jsxRuntimeExports.jsx("g", { clipPath: `url(#${clipIdA})`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "circle",
      {
        cx: posB.x,
        cy: posB.y,
        r: radiusBInPx,
        fill: withAlpha(MATH_COLORS.setIntersection, 0.4),
        stroke: "none"
      }
    ) }),
    vennOp === "union" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      rA > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: posA.x,
          cy: posA.y,
          r: radiusAInPx,
          fill: withAlpha(MATH_COLORS.setUnion, 0.3)
        }
      ),
      rB > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: posB.x,
          cy: posB.y,
          r: radiusBInPx,
          fill: withAlpha(MATH_COLORS.setUnion, 0.3)
        }
      )
    ] }),
    vennOp === "complement_A" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: scale.originX - 5.5 * scale.scaleX,
          y: scale.originY - 3.8 * scale.scaleY,
          width: 11 * scale.scaleX,
          height: 7.6 * scale.scaleY,
          fill: withAlpha(MATH_COLORS.setComplement, 0.25),
          rx: 12
        }
      ),
      rA > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: posA.x,
          cy: posA.y,
          r: radiusAInPx,
          fill: CANVAS_COLORS.white
        }
      )
    ] }),
    vennOp === "difference_A_B" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      rA > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: posA.x,
          cy: posA.y,
          r: radiusAInPx,
          fill: withAlpha(MATH_COLORS.setA, 0.35)
        }
      ),
      rB > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: posB.x,
          cy: posB.y,
          r: radiusBInPx,
          fill: CANVAS_COLORS.white
        }
      )
    ] }),
    rA > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: posA.x,
          cy: posA.y,
          r: radiusAInPx,
          fill: vennOp === "intersection" || vennOp === "union" ? "none" : withAlpha(MATH_COLORS.setA, 0.05),
          stroke: MATH_COLORS.setA,
          strokeWidth: 2.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: posA.x - radiusAInPx * 0.6,
          y: posA.y - radiusAInPx * 0.6,
          fill: MATH_COLORS.setA,
          fontSize: fontScale(16),
          fontWeight: "extrabold",
          children: "A"
        }
      )
    ] }),
    rB > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: posB.x,
          cy: posB.y,
          r: radiusBInPx,
          fill: vennOp === "intersection" || vennOp === "union" ? "none" : withAlpha(MATH_COLORS.setB, 0.05),
          stroke: MATH_COLORS.setB,
          strokeWidth: 2.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: posB.x + radiusBInPx * 0.6,
          y: posB.y - radiusBInPx * 0.6,
          fill: MATH_COLORS.setB,
          fontSize: fontScale(16),
          fontWeight: "extrabold",
          children: "B"
        }
      )
    ] }),
    rA > 0 && rB > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: posA.x,
        y1: posA.y,
        x2: posB.x,
        y2: posB.y,
        stroke: MATH_COLORS.labelText,
        strokeDasharray: "4 4",
        strokeWidth: 1,
        opacity: 0.6
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: xA,
        cy: yA,
        scale,
        vp,
        onDrag: handleDragA,
        color: MATH_COLORS.paramPrimary,
        label: "O_A",
        labelKey: "O_A",
        placedLabels,
        fontScale
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: xB,
        cy: yB,
        scale,
        vp,
        onDrag: handleDragB,
        color: MATH_COLORS.paramSecondary,
        label: "O_B",
        labelKey: "O_B",
        placedLabels,
        fontScale
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: xP,
        cy: yP,
        scale,
        vp,
        onDrag: handleDragP,
        color: inA && inB ? MATH_COLORS.function : inA ? MATH_COLORS.paramPrimary : inB ? MATH_COLORS.paramSecondary : MATH_COLORS.labelText,
        label: `P(${xP.toFixed(1)}, ${yP.toFixed(1)})`,
        labelKey: "P",
        placedLabels,
        fontScale
      }
    ),
    showLogic && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "g",
      {
        transform: `translate(${scale.originX}, ${scale.originY + 3.8 * scale.scaleY})`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: -180,
              y: -20,
              width: 360,
              height: 32,
              fill: CANVAS_COLORS.white,
              stroke: MATH_COLORS.function,
              strokeWidth: 1.5,
              rx: 16
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: 0,
              y: 2,
              textAnchor: "middle",
              fill: MATH_COLORS.function,
              fontSize: fontScale(12),
              fontWeight: "bold",
              children: `元素 P: ${inA ? "P∈A" : "P∉A"}  且  ${inB ? "P∈B" : "P∉B"}`
            }
          )
        ]
      }
    )
  ] });
}
const defaultParams = {
  xA: -1.2,
  yA: 0,
  rA: 2.2,
  xB: 1.2,
  yB: 0,
  rB: 2.2,
  xP: 0,
  yP: 0
};
const paramMeta = {
  xA: {
    key: "xA",
    label: "圆 A 圆心 X (xA)",
    labelFormula: "x_A",
    min: -4,
    max: 4,
    step: 0.1,
    defaultValue: -1.2,
    importance: "core",
    description: "控制集合 A 在平面视口中的水平中心位置"
  },
  yA: {
    key: "yA",
    label: "圆 A 圆心 Y (yA)",
    labelFormula: "y_A",
    min: -3,
    max: 3,
    step: 0.1,
    defaultValue: 0,
    importance: "core",
    description: "控制集合 A 在平面视口中的垂直中心位置"
  },
  rA: {
    key: "rA",
    label: "集合 A 半径 (rA)",
    labelFormula: "r_A",
    min: 0,
    max: 4,
    step: 0.1,
    defaultValue: 2.2,
    importance: "core",
    description: "控制集合 A 的作用域大小。当 rA = 0 时退化为空集",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "空集 ∅",
        labelFormula: "\\emptyset"
      }
    ]
  },
  xB: {
    key: "xB",
    label: "圆 B 圆心 X (xB)",
    labelFormula: "x_B",
    min: -4,
    max: 4,
    step: 0.1,
    defaultValue: 1.2,
    importance: "core",
    description: "控制集合 B 在平面视口中的水平中心位置"
  },
  yB: {
    key: "yB",
    label: "圆 B 圆心 Y (yB)",
    labelFormula: "y_B",
    min: -3,
    max: 3,
    step: 0.1,
    defaultValue: 0,
    importance: "core",
    description: "控制集合 B 在平面视口中的垂直中心位置"
  },
  rB: {
    key: "rB",
    label: "集合 B 半径 (rB)",
    labelFormula: "r_B",
    min: 0,
    max: 4,
    step: 0.1,
    defaultValue: 2.2,
    importance: "core",
    description: "控制集合 B 的作用域大小。当 rB = 0 时退化为空集",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "空集 ∅",
        labelFormula: "\\emptyset"
      }
    ]
  },
  xP: {
    key: "xP",
    label: "测试元素 P(x)",
    labelFormula: "P(x)",
    min: -5,
    max: 5,
    step: 0.1,
    defaultValue: 0,
    importance: "advanced",
    description: "测试点 P 的 X 坐标，用于检验元素归属与命题真值"
  },
  yP: {
    key: "yP",
    label: "测试元素 P(y)",
    labelFormula: "P(y)",
    min: -4,
    max: 4,
    step: 0.1,
    defaultValue: 0,
    importance: "advanced",
    description: "测试点 P 的 Y 坐标，用于检验元素归属与命题真值"
  }
};
export {
  SetScene as S,
  defaultParams as d,
  paramMeta as p
};
