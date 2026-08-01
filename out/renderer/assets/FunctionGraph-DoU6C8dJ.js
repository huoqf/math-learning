import { R as React, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
const FunctionGraph = ({
  fn,
  scale,
  color,
  strokeWidth = 2,
  strokeDasharray,
  samples = 300
}) => {
  const { xMin, xMax, yMin, yMax } = scale;
  const pathD = React.useMemo(() => {
    const step = (xMax - xMin) / samples;
    let d = "";
    let isDrawing = false;
    for (let i = 0; i <= samples; i++) {
      const x = xMin + i * step;
      let y = NaN;
      try {
        y = fn(x);
      } catch {
        y = NaN;
      }
      const isValid = Number.isFinite(y) && !Number.isNaN(y) && y >= yMin - (yMax - yMin) * 2 && y <= yMax + (yMax - yMin) * 2;
      if (isValid) {
        const pt = mathToDesign(x, y, scale);
        if (!isDrawing) {
          d += `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
          isDrawing = true;
        } else {
          d += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
        }
      } else {
        isDrawing = false;
      }
    }
    return d;
  }, [fn, scale, xMin, xMax, yMin, yMax, samples]);
  if (!pathD) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "path",
    {
      d: pathD,
      fill: "none",
      stroke: color,
      strokeWidth,
      strokeDasharray,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  );
};
export {
  FunctionGraph as F
};
