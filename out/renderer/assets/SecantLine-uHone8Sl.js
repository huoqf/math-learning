import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { d as CALCULUS_COLORS } from "./probabilityBayes-DNLi5nE3.js";
const SecantLine = ({
  fn,
  x1,
  x2,
  scale,
  color = CALCULUS_COLORS.secantLine,
  strokeWidth = 2,
  showTriangle = true,
  extend = 300
}) => {
  const result = reactExports.useMemo(() => {
    const y1 = fn(x1);
    const y2 = fn(x2);
    if (!Number.isFinite(y1) || !Number.isFinite(y2)) return null;
    if (Math.abs(x2 - x1) < 1e-12) return null;
    const slope = (y2 - y1) / (x2 - x1);
    const dxMath = extend / scale.scaleX;
    const extX1 = x1 - dxMath;
    const extY1 = y1 + slope * (extX1 - x1);
    const extX2 = x2 + dxMath;
    const extY2 = y2 + slope * (extX2 - x2);
    const p1 = mathToDesign(extX1, extY1, scale);
    const p2 = mathToDesign(extX2, extY2, scale);
    const pA = mathToDesign(x1, y1, scale);
    const pB = mathToDesign(x2, y2, scale);
    const pC = mathToDesign(x2, y1, scale);
    return { p1, p2, pA, pB, pC, slope, dy: y2 - y1, dx: x2 - x1 };
  }, [fn, x1, x2, scale, extend]);
  if (!result) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: result.p1.x,
        y1: result.p1.y,
        x2: result.p2.x,
        y2: result.p2.y,
        stroke: color,
        strokeWidth,
        strokeDasharray: "4 4"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: result.pA.x, cy: result.pA.y, r: 3, fill: color }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: result.pB.x, cy: result.pB.y, r: 3, fill: color }),
    showTriangle && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { opacity: 0.5, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: result.pA.x,
          y1: result.pA.y,
          x2: result.pC.x,
          y2: result.pC.y,
          stroke: CALCULUS_COLORS.deltaHighlight,
          strokeWidth: 1.5,
          strokeDasharray: "3 3"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: result.pC.x,
          y1: result.pC.y,
          x2: result.pB.x,
          y2: result.pB.y,
          stroke: CALCULUS_COLORS.deltaHighlight,
          strokeWidth: 1.5,
          strokeDasharray: "3 3"
        }
      )
    ] })
  ] });
};
export {
  SecantLine as S
};
