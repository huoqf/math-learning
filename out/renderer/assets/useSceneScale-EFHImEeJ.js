import { r as reactExports, R as React, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}
function useCanvasSize(initial, options) {
  const containerRef = reactExports.useRef(null);
  const [raw, setRaw] = reactExports.useState({ width: initial.width, height: initial.height });
  reactExports.useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setRaw({ width: rect.width, height: rect.height });
    }
  }, []);
  reactExports.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setRaw({ width, height });
      }
    });
    resizeObserver.observe(element);
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setRaw({ width: rect.width, height: rect.height });
    }
    return () => {
      resizeObserver.unobserve(element);
      resizeObserver.disconnect();
    };
  }, []);
  const size = reactExports.useMemo(() => {
    const rawScale = Math.min(raw.width / initial.width, raw.height / initial.height);
    const compensation = options?.presetCompensation ?? 1;
    const scale = rawScale * compensation;
    return {
      width: raw.width,
      height: raw.height,
      scale,
      rawScale,
      px: (v) => v * scale,
      font: (v) => clamp(v * scale, 7, 16)
    };
  }, [raw.width, raw.height, initial.width, initial.height, options?.presetCompensation]);
  return [containerRef, size];
}
function useViewport(canvas, options) {
  const {
    designWidth,
    designHeight,
    overlayLeft = 0,
    overlayRight = 0,
    overlayTop = 0,
    overlayBottom = 0
  } = options;
  const compensation = options.presetCompensation ?? (canvas.rawScale > 0 ? canvas.scale / canvas.rawScale : 1);
  return reactExports.useMemo(() => {
    const visibleX = overlayLeft;
    const visibleY = overlayTop;
    const visibleW = Math.max(0, canvas.width - overlayLeft - overlayRight);
    const visibleH = Math.max(0, canvas.height - overlayTop - overlayBottom);
    const rawScale = Math.min(
      visibleW / designWidth,
      visibleH / designHeight
    );
    const scale = rawScale * compensation;
    const centerX = visibleX + visibleW / 2;
    const centerY = visibleY + visibleH / 2;
    const tx = visibleX + (visibleW - designWidth * scale) / 2;
    const ty = visibleY + (visibleH - designHeight * scale) / 2;
    const transform = `translate(${tx} ${ty}) scale(${scale})`;
    return {
      visibleX,
      visibleY,
      visibleW,
      visibleH,
      centerX,
      centerY,
      scale,
      tx,
      ty,
      transform,
      designVisibleW: visibleW / scale,
      designVisibleH: visibleH / scale,
      designLeft: -tx / scale,
      designTop: -ty / scale
    };
  }, [
    canvas.width,
    canvas.height,
    designWidth,
    designHeight,
    overlayLeft,
    overlayRight,
    overlayTop,
    overlayBottom,
    compensation
  ]);
}
const AnimationSvgCanvas = React.memo(
  function AnimationSvgCanvas2({
    containerRef,
    transform,
    children,
    svgRef,
    canvasRef,
    className = "",
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onMouseDown,
    onClick,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onPointerMove,
    onPointerUp
  }) {
    const hasCanvas = !!canvasRef;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        ref: containerRef,
        className: `w-full h-full overflow-hidden${hasCanvas ? " relative" : ""}${className ? ` ${className}` : ""}`,
        children: [
          hasCanvas && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "canvas",
            {
              ref: canvasRef,
              className: "absolute inset-0 w-full h-full pointer-events-none",
              "aria-hidden": true
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "svg",
            {
              ref: svgRef,
              className: `block select-none w-full h-full${hasCanvas ? " absolute inset-0 pointer-events-none" : ""}`,
              onMouseMove,
              onMouseUp,
              onMouseLeave,
              onMouseDown,
              onClick,
              onTouchStart,
              onTouchMove,
              onTouchEnd,
              onPointerMove,
              onPointerUp,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("g", { transform, children })
            }
          )
        ]
      }
    );
  }
);
function useAnimationViewport({
  preset,
  overlayRight = 0,
  overlayLeft = 0,
  overlayTop = 0,
  overlayBottom = 0,
  presetCompensation
}) {
  const sizeOptions = presetCompensation !== void 0 ? { presetCompensation } : void 0;
  const [containerRef, canvasSize] = useCanvasSize(preset, sizeOptions);
  const vp = useViewport(canvasSize, {
    designWidth: preset.width,
    designHeight: preset.height,
    overlayRight,
    overlayLeft,
    overlayTop,
    overlayBottom
  });
  return { containerRef, canvasSize, vp, preset };
}
function useSceneScale({
  vp,
  xRange,
  yRange,
  keepAspectRatio = true
}) {
  return reactExports.useMemo(() => {
    const [xMinInput, xMaxInput] = xRange;
    const [yMinInput, yMaxInput] = yRange;
    const designW = vp.designVisibleW;
    const designH = vp.designVisibleH;
    const left = vp.designLeft;
    const top = vp.designTop;
    const rawScaleX = designW / (xMaxInput - xMinInput);
    const rawScaleY = designH / (yMaxInput - yMinInput);
    const minScale = Math.min(rawScaleX, rawScaleY);
    const scaleX = keepAspectRatio ? minScale : rawScaleX;
    const scaleY = keepAspectRatio ? minScale : rawScaleY;
    const designCenterX = left + designW / 2;
    const designCenterY = top + designH / 2;
    const mathCenterX = (xMinInput + xMaxInput) / 2;
    const mathCenterY = (yMinInput + yMaxInput) / 2;
    const originX = designCenterX - mathCenterX * scaleX;
    const originY = designCenterY + mathCenterY * scaleY;
    const xMin = (left - originX) / scaleX;
    const xMax = (left + designW - originX) / scaleX;
    const yMin = (originY - (top + designH)) / scaleY;
    const yMax = (originY - top) / scaleY;
    return {
      scaleX,
      scaleY,
      scale: minScale,
      originX,
      originY,
      xMin,
      xMax,
      yMin,
      yMax
    };
  }, [
    vp.designVisibleW,
    vp.designVisibleH,
    vp.designLeft,
    vp.designTop,
    xRange,
    yRange,
    keepAspectRatio
  ]);
}
export {
  AnimationSvgCanvas as A,
  useSceneScale as a,
  useAnimationViewport as u
};
