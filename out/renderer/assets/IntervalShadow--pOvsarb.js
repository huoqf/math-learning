import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { b as MATH_COLORS, d as CALCULUS_COLORS } from "./probabilityBayes-BWtGIkMp.js";
const IntervalShadow = ({
  fn,
  x1,
  x2,
  scale,
  fillColor = CALCULUS_COLORS.areaFill,
  strokeColor = MATH_COLORS.function,
  strokeWidth = 1,
  samples = 100,
  fillToAxis = true,
  baselineY = 0
}) => {
  const pathD = reactExports.useMemo(() => {
    const clampedX1 = Math.max(x1, scale.xMin);
    const clampedX2 = Math.min(x2, scale.xMax);
    if (clampedX2 <= clampedX1) return "";
    const step = (clampedX2 - clampedX1) / samples;
    const axisY = fillToAxis ? 0 : baselineY;
    const topPoints = [];
    const bottomPoints = [];
    for (let i = 0; i <= samples; i++) {
      const mx = clampedX1 + i * step;
      const my = fn(mx);
      if (!Number.isFinite(my)) continue;
      const pt = mathToDesign(mx, my, scale);
      const axisPt = mathToDesign(mx, axisY, scale);
      topPoints.push(
        `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`
      );
      bottomPoints.unshift(`${axisPt.x.toFixed(2)} ${axisPt.y.toFixed(2)}`);
    }
    if (topPoints.length < 2) return "";
    const d = [
      topPoints.join(" "),
      `L ${bottomPoints[0]} ${bottomPoints.slice(1).map((p) => `L ${p}`).join(" ")}`,
      "Z"
    ].join(" ");
    return d;
  }, [fn, x1, x2, scale, samples, fillToAxis, baselineY]);
  if (!pathD) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "path",
    {
      d: pathD,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
      strokeLinejoin: "round",
      opacity: 0.6
    }
  );
};
export {
  IntervalShadow as I
};
