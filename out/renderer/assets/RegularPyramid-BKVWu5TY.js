import { j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { m as mathToThree } from "./Legend3D-B8bVBbK0.js";
import { b as MATH_COLORS } from "./probabilityBayes-BWtGIkMp.js";
import { E as Edges } from "./Cuboid-Blj9lB5b.js";
const RegularPyramid = ({
  sides,
  baseRadius,
  height,
  colorKey = "primary",
  opacity = 0.3
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: mathToThree({ x: 0, y: 0, z: height / 2 }), children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [baseRadius, height, sides] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "meshStandardMaterial",
    {
      color: MATH_COLORS[colorKey],
      transparent: true,
      opacity,
      side: 2,
      depthWrite: false
    }
  ),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Edges, { color: MATH_COLORS.line })
] });
export {
  RegularPyramid as R
};
