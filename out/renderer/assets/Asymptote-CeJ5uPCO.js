import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { G as GEOMETRY_COLORS, b as MATH_COLORS } from "./probabilityBayes-BWtGIkMp.js";
const Asymptote = ({
  type,
  value,
  intercept = 0,
  scale,
  color = GEOMETRY_COLORS.asymptote,
  label,
  fontScale = (v) => v
}) => {
  const line = reactExports.useMemo(() => {
    if (type === "vertical") {
      const topPt = mathToDesign(value, scale.yMax, scale);
      const bottomPt = mathToDesign(value, scale.yMin, scale);
      return {
        x1: topPt.x,
        y1: topPt.y,
        x2: bottomPt.x,
        y2: bottomPt.y,
        labelText: label ?? `x = ${value}`,
        labelX: topPt.x + 6,
        labelY: topPt.y + 14
      };
    }
    if (type === "horizontal") {
      const leftPt = mathToDesign(scale.xMin, value, scale);
      const rightPt = mathToDesign(scale.xMax, value, scale);
      return {
        x1: leftPt.x,
        y1: leftPt.y,
        x2: rightPt.x,
        y2: rightPt.y,
        labelText: label ?? `y = ${value}`,
        labelX: rightPt.x - 6,
        labelY: rightPt.y - 6
      };
    }
    const x1 = scale.xMin;
    const y1 = value * x1 + intercept;
    const x2 = scale.xMax;
    const y2 = value * x2 + intercept;
    const p1 = mathToDesign(x1, y1, scale);
    const p2 = mathToDesign(x2, y2, scale);
    return {
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      labelText: label ?? `y = ${value}x + ${intercept}`,
      labelX: p2.x - 6,
      labelY: p2.y - 6
    };
  }, [type, value, intercept, scale, label]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: line.x1,
        y1: line.y1,
        x2: line.x2,
        y2: line.y2,
        stroke: color,
        strokeWidth: 1.5,
        strokeDasharray: "6 4"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: line.labelX,
        y: line.labelY,
        textAnchor: "end",
        fill: MATH_COLORS.textMuted,
        fontSize: fontScale(9),
        fontFamily: "monospace",
        className: "select-none pointer-events-none",
        children: line.labelText
      }
    )
  ] });
};
export {
  Asymptote as A
};
