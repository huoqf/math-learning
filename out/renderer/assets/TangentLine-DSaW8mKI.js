import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { d as CALCULUS_COLORS } from "./probabilityBayes-BWtGIkMp.js";
const TangentLine = ({
  fn,
  x0,
  scale,
  color = CALCULUS_COLORS.tangentLine,
  strokeWidth = 2,
  extend = 300,
  h = 1e-7
}) => {
  const line = reactExports.useMemo(() => {
    const y0 = fn(x0);
    if (!Number.isFinite(y0)) return null;
    const dydx = (fn(x0 + h) - fn(x0 - h)) / (2 * h);
    if (!Number.isFinite(dydx)) return null;
    const dxDesign = extend;
    const dxMath = dxDesign / scale.scaleX;
    const x1 = x0 - dxMath;
    const y1 = y0 + dydx * (x1 - x0);
    const x2 = x0 + dxMath;
    const y2 = y0 + dydx * (x2 - x0);
    const p1 = mathToDesign(x1, y1, scale);
    const p2 = mathToDesign(x2, y2, scale);
    return { p1, p2, slope: dydx };
  }, [fn, x0, scale, extend, h]);
  if (!line) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "line",
    {
      x1: line.p1.x,
      y1: line.p1.y,
      x2: line.p2.x,
      y2: line.p2.y,
      stroke: color,
      strokeWidth,
      strokeDasharray: "6 3"
    }
  );
};
export {
  TangentLine as T
};
