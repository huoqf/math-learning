import { j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { b as MATH_COLORS } from "./probabilityBayes-BWtGIkMp.js";
const VectorArrow = ({
  from,
  to,
  scale,
  color = MATH_COLORS.vectorPrimary,
  strokeWidth = 2,
  headLength = 10,
  headWidth = 6,
  label,
  labelOffset = [0, -8],
  labelSize = 11,
  fontScale = (v) => v,
  strokeDasharray
}) => {
  const startPt = mathToDesign(from[0], from[1], scale);
  const endPt = mathToDesign(to[0], to[1], scale);
  const dx = endPt.x - startPt.x;
  const dy = endPt.y - startPt.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;
  const ux = dx / len;
  const uy = dy / len;
  const tipX = endPt.x;
  const tipY = endPt.y;
  const baseX = tipX - ux * headLength;
  const baseY = tipY - uy * headLength;
  const wing1X = baseX - uy * (headWidth / 2);
  const wing1Y = baseY + ux * (headWidth / 2);
  const wing2X = baseX + uy * (headWidth / 2);
  const wing2Y = baseY - ux * (headWidth / 2);
  const midX = (startPt.x + endPt.x) / 2 + labelOffset[0];
  const midY = (startPt.y + endPt.y) / 2 + labelOffset[1];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: startPt.x,
        y1: startPt.y,
        x2: tipX,
        y2: tipY,
        stroke: color,
        strokeWidth,
        strokeDasharray,
        strokeLinecap: "round"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "polygon",
      {
        points: `${tipX},${tipY} ${wing1X},${wing1Y} ${wing2X},${wing2Y}`,
        fill: color
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: startPt.x, cy: startPt.y, r: 3, fill: color }),
    label && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: midX,
        y: midY,
        textAnchor: "middle",
        dominantBaseline: "central",
        fill: color,
        fontSize: fontScale(labelSize),
        fontWeight: 600,
        fontFamily: "monospace",
        className: "select-none",
        children: label
      }
    )
  ] });
};
export {
  VectorArrow as V
};
