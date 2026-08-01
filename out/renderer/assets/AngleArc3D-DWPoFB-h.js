import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { V as Vector3, m as mathToThree, l as Matrix4, Q as Quaternion, D as DoubleSide, L as Line } from "./Legend3D-B8bVBbK0.js";
import { b as MATH_COLORS } from "./probabilityBayes-BWtGIkMp.js";
const Plane3D = ({
  origin,
  uAxis,
  vAxis,
  width = 4,
  height = 4,
  colorKey = "secondary",
  opacity = 0.35
}) => {
  const { position, quaternion } = reactExports.useMemo(() => {
    const o = new Vector3(...mathToThree(origin));
    const u = new Vector3(...mathToThree(uAxis)).normalize();
    const v = new Vector3(...mathToThree(vAxis)).normalize();
    const n = new Vector3().crossVectors(u, v).normalize();
    const basis = new Matrix4().makeBasis(u, v, n);
    return {
      position: o,
      quaternion: new Quaternion().setFromRotationMatrix(basis)
    };
  }, [origin, uAxis, vAxis]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position, quaternion, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [width, height] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: MATH_COLORS[colorKey],
        transparent: true,
        opacity,
        side: DoubleSide,
        depthWrite: false
      }
    )
  ] });
};
const AngleArc3D = ({
  vertex,
  dirA,
  dirB,
  radius = 0.6,
  colorKey = "highlight"
}) => {
  const points = reactExports.useMemo(() => {
    const o = new Vector3(...mathToThree(vertex));
    const a = new Vector3(...mathToThree(dirA)).normalize();
    const b = new Vector3(...mathToThree(dirB)).normalize();
    const axis = new Vector3().crossVectors(a, b).normalize();
    const angle = a.angleTo(b);
    const segments = 24;
    return Array.from({ length: segments + 1 }, (_, i) => {
      const q = new Quaternion().setFromAxisAngle(
        axis,
        i / segments * angle
      );
      return a.clone().applyQuaternion(q).multiplyScalar(radius).add(o);
    });
  }, [vertex, dirA, dirB, radius]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { points, color: MATH_COLORS[colorKey], lineWidth: 2 });
};
export {
  AngleArc3D as A,
  Plane3D as P
};
