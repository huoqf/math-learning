import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { m as mathToDesign, d as designToMath } from "./coordinate-9upJ5J84.js";
import { b as MATH_COLORS } from "./probabilityBayes-BWtGIkMp.js";
function clientToSvgPoint(clientX, clientY, svg) {
  if (!svg) return null;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  return pt.matrixTransform(ctm.inverse());
}
const InteractivePoint = ({
  cx,
  cy,
  scale,
  vp,
  onDrag,
  color = MATH_COLORS.focusPoint,
  r = 6,
  label,
  labelKey,
  placedLabels,
  disabled = false,
  fontScale = (v) => v
}) => {
  const handlePointerDown = reactExports.useCallback(
    (e) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      const circle = e.currentTarget;
      circle.setPointerCapture(e.pointerId);
      const svg = circle.ownerSVGElement;
      if (!svg) return;
      const handlePointerMove = (moveEvent) => {
        const svgPt = clientToSvgPoint(
          moveEvent.clientX,
          moveEvent.clientY,
          svg
        );
        if (!svgPt) return;
        const designX = (svgPt.x - vp.tx) / vp.scale;
        const designY = (svgPt.y - vp.ty) / vp.scale;
        const mathPt = designToMath(designX, designY, scale);
        onDrag(mathPt);
      };
      const handlePointerUp = () => {
        circle.releasePointerCapture(e.pointerId);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [disabled, vp.tx, vp.ty, vp.scale, scale, onDrag]
  );
  const pt = mathToDesign(cx, cy, scale);
  const placedLabel = placedLabels && labelKey ? placedLabels.find((p) => p.key === labelKey) : void 0;
  const labelDy = placedLabel ? placedLabel.finalDy : -(r + 6);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "circle",
      {
        cx: pt.x,
        cy: pt.y,
        r: r + 6,
        fill: "transparent",
        className: disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        onPointerDown: handlePointerDown
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "circle",
      {
        cx: pt.x,
        cy: pt.y,
        r,
        fill: color,
        stroke: MATH_COLORS.white,
        strokeWidth: 2,
        className: "pointer-events-none transition-transform duration-100",
        style: { filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }
      }
    ),
    label && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: pt.x,
        y: pt.y,
        dy: labelDy,
        textAnchor: placedLabel?.anchor ?? "middle",
        fill: MATH_COLORS.labelText,
        fontSize: fontScale(10),
        fontFamily: "monospace",
        fontWeight: "600",
        className: "select-none pointer-events-none",
        children: label
      }
    )
  ] });
};
export {
  InteractivePoint as I
};
