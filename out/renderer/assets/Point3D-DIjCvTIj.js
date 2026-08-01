import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { i as MATH3D_COLORS, b as MATH_COLORS } from "./probabilityBayes-BWtGIkMp.js";
import { c as useThree, o as Plane, V as Vector3, m as mathToThree, t as threeToMath } from "./Legend3D-B8bVBbK0.js";
const Point3D = ({
  position,
  colorKey = "highlight",
  radius = 0.12,
  draggable = false,
  constrain,
  onDrag
}) => {
  const [hovered, setHovered] = reactExports.useState(false);
  const [dragging, setDragging] = reactExports.useState(false);
  const { camera, gl, invalidate } = useThree();
  const planeRef = reactExports.useRef(new Plane());
  const hit = reactExports.useRef(new Vector3());
  const stopDragging = (pointerId) => {
    setDragging(false);
    if (pointerId !== void 0) {
      try {
        gl.domElement.releasePointerCapture(pointerId);
      } catch {
      }
    }
  };
  const onPointerDown = (e) => {
    if (!draggable) return;
    e.stopPropagation();
    setDragging(true);
    try {
      gl.domElement.setPointerCapture(e.pointerId);
    } catch {
    }
    const camDir = new Vector3();
    camera.getWorldDirection(camDir);
    planeRef.current.setFromNormalAndCoplanarPoint(
      camDir,
      new Vector3(...mathToThree(position))
    );
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    e.stopPropagation();
    if (e.ray.intersectPlane(planeRef.current, hit.current)) {
      let next = threeToMath(hit.current.x, hit.current.y, hit.current.z);
      if (constrain) next = constrain(next);
      onDrag?.(next);
      invalidate();
    }
  };
  const onPointerUp = (e) => {
    e.stopPropagation();
    stopDragging(e.pointerId);
  };
  const colorVal = MATH3D_COLORS[colorKey] ?? MATH_COLORS[colorKey] ?? "#DC2626";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "mesh",
    {
      position: mathToThree(position),
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerOver: () => draggable && setHovered(true),
      onPointerOut: () => {
        setHovered(false);
      },
      renderOrder: 500,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "sphereGeometry",
          {
            args: [hovered || dragging ? radius * 1.5 : radius, 24, 24]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "meshStandardMaterial",
          {
            color: colorVal,
            depthTest: false,
            roughness: 0.2
          }
        )
      ]
    }
  );
};
export {
  Point3D as P
};
