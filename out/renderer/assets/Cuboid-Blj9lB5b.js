import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { E as EdgesGeometry, L as Line, _ as _extends, m as mathToThree } from "./Legend3D-B8bVBbK0.js";
import { b as MATH_COLORS } from "./probabilityBayes-BWtGIkMp.js";
const Edges = /* @__PURE__ */ reactExports.forwardRef(({
  threshold = 15,
  geometry: explicitGeometry,
  ...props
}, fref) => {
  const ref = reactExports.useRef(null);
  reactExports.useImperativeHandle(fref, () => ref.current, []);
  const tmpPoints = reactExports.useMemo(() => [0, 0, 0, 1, 0, 0], []);
  const memoizedGeometry = reactExports.useRef(null);
  const memoizedThreshold = reactExports.useRef(null);
  reactExports.useLayoutEffect(() => {
    const parent = ref.current.parent;
    const geometry = explicitGeometry !== null && explicitGeometry !== void 0 ? explicitGeometry : parent == null ? void 0 : parent.geometry;
    if (!geometry) return;
    const cached = memoizedGeometry.current === geometry && memoizedThreshold.current === threshold;
    if (cached) return;
    memoizedGeometry.current = geometry;
    memoizedThreshold.current = threshold;
    const points = new EdgesGeometry(geometry, threshold).attributes.position.array;
    ref.current.geometry.setPositions(points);
    ref.current.geometry.attributes.instanceStart.needsUpdate = true;
    ref.current.geometry.attributes.instanceEnd.needsUpdate = true;
    ref.current.computeLineDistances();
  });
  return /* @__PURE__ */ reactExports.createElement(Line, _extends({
    segments: true,
    points: tmpPoints,
    ref,
    raycast: () => null
  }, props));
});
const Cuboid = ({
  a,
  b,
  c,
  colorKey = "primary",
  opacity = 0.25
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: mathToThree({ x: a / 2, y: b / 2, z: c / 2 }), children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [a, c, b] }),
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
  Cuboid as C,
  Edges as E
};
