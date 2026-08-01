import { R as React, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { b as MATH_COLORS } from "./probabilityBayes-BWtGIkMp.js";
const CoordinateGrid = ({
  scale,
  showGrid = true,
  showLabels = true,
  xStep = 1,
  yStep = 1,
  fontScale = (v) => v
}) => {
  const { xMin, xMax, yMin, yMax } = scale;
  const gridLines = React.useMemo(() => {
    const lines = [];
    if (!showGrid) return lines;
    const xStart = Math.ceil(xMin / xStep) * xStep;
    const xEnd = Math.floor(xMax / xStep) * xStep;
    for (let x = xStart; x <= xEnd; x += xStep) {
      if (Math.abs(x) < 1e-9) continue;
      const startPt = mathToDesign(x, yMin, scale);
      const endPt = mathToDesign(x, yMax, scale);
      lines.push(
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: startPt.x,
            y1: startPt.y,
            x2: endPt.x,
            y2: endPt.y,
            stroke: MATH_COLORS.grid,
            strokeWidth: 1,
            strokeDasharray: "4 4"
          },
          `grid-v-${x}`
        )
      );
    }
    const yStart = Math.ceil(yMin / yStep) * yStep;
    const yEnd = Math.floor(yMax / yStep) * yStep;
    for (let y = yStart; y <= yEnd; y += yStep) {
      if (Math.abs(y) < 1e-9) continue;
      const startPt = mathToDesign(xMin, y, scale);
      const endPt = mathToDesign(xMax, y, scale);
      lines.push(
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: startPt.x,
            y1: startPt.y,
            x2: endPt.x,
            y2: endPt.y,
            stroke: MATH_COLORS.grid,
            strokeWidth: 1,
            strokeDasharray: "4 4"
          },
          `grid-h-${y}`
        )
      );
    }
    return lines;
  }, [scale, showGrid, xStep, yStep, xMin, xMax, yMin, yMax]);
  const ticksAndLabels = React.useMemo(() => {
    const elements = [];
    const tickSize = 4;
    const xStart = Math.ceil(xMin / xStep) * xStep;
    const xEnd = Math.floor(xMax / xStep) * xStep;
    for (let x = xStart; x <= xEnd; x += xStep) {
      if (Math.abs(x) < 1e-9) continue;
      const pt = mathToDesign(x, 0, scale);
      elements.push(
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: pt.x,
            y1: pt.y - tickSize,
            x2: pt.x,
            y2: pt.y + tickSize,
            stroke: MATH_COLORS.axis,
            strokeWidth: 1.5
          },
          `tick-x-${x}`
        )
      );
      if (showLabels) {
        elements.push(
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: pt.x,
              y: pt.y + 16,
              textAnchor: "middle",
              fill: MATH_COLORS.labelTextLight,
              fontSize: fontScale(10),
              fontFamily: "monospace",
              className: "select-none",
              children: x
            },
            `label-x-${x}`
          )
        );
      }
    }
    const yStart = Math.ceil(yMin / yStep) * yStep;
    const yEnd = Math.floor(yMax / yStep) * yStep;
    for (let y = yStart; y <= yEnd; y += yStep) {
      if (Math.abs(y) < 1e-9) continue;
      const pt = mathToDesign(0, y, scale);
      elements.push(
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: pt.x - tickSize,
            y1: pt.y,
            x2: pt.x + tickSize,
            y2: pt.y,
            stroke: MATH_COLORS.axis,
            strokeWidth: 1.5
          },
          `tick-y-${y}`
        )
      );
      if (showLabels) {
        elements.push(
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: pt.x - 8,
              y: pt.y + 3,
              textAnchor: "end",
              fill: MATH_COLORS.labelTextLight,
              fontSize: fontScale(10),
              fontFamily: "monospace",
              className: "select-none",
              children: y.toFixed(1)
            },
            `label-y-${y}`
          )
        );
      }
    }
    if (showLabels) {
      const ptZero = mathToDesign(0, 0, scale);
      elements.push(
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: ptZero.x - 8,
            y: ptZero.y + 14,
            textAnchor: "end",
            fill: MATH_COLORS.labelTextLight,
            fontSize: fontScale(10),
            fontFamily: "monospace",
            className: "select-none",
            children: "0"
          },
          "label-zero"
        )
      );
    }
    return elements;
  }, [scale, showLabels, xStep, yStep, xMin, xMax, yMin, yMax]);
  const xAxisStart = mathToDesign(xMin, 0, scale);
  const xAxisEnd = mathToDesign(xMax, 0, scale);
  const yAxisStart = mathToDesign(0, yMin, scale);
  const yAxisEnd = mathToDesign(0, yMax, scale);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    gridLines,
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: xAxisStart.x,
        y1: xAxisStart.y,
        x2: xAxisEnd.x,
        y2: xAxisEnd.y,
        stroke: MATH_COLORS.axis,
        strokeWidth: 1.5
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: yAxisStart.x,
        y1: yAxisStart.y,
        x2: yAxisEnd.x,
        y2: yAxisEnd.y,
        stroke: MATH_COLORS.axis,
        strokeWidth: 1.5
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "polygon",
      {
        points: `${xAxisEnd.x},${xAxisEnd.y} ${xAxisEnd.x - 8},${xAxisEnd.y - 4} ${xAxisEnd.x - 8},${xAxisEnd.y + 4}`,
        fill: MATH_COLORS.axis
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: xAxisEnd.x - 4,
        y: xAxisEnd.y - 10,
        textAnchor: "middle",
        fill: MATH_COLORS.labelText,
        fontSize: fontScale(12),
        fontFamily: "monospace",
        fontWeight: "600",
        className: "select-none",
        children: "x"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "polygon",
      {
        points: `${yAxisEnd.x},${yAxisEnd.y} ${yAxisEnd.x - 4},${yAxisEnd.y + 8} ${yAxisEnd.x + 4},${yAxisEnd.y + 8}`,
        fill: MATH_COLORS.axis
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: yAxisEnd.x + 10,
        y: yAxisEnd.y + 8,
        textAnchor: "middle",
        fill: MATH_COLORS.labelText,
        fontSize: fontScale(12),
        fontFamily: "monospace",
        fontWeight: "600",
        className: "select-none",
        children: "y"
      }
    ),
    ticksAndLabels
  ] });
};
export {
  CoordinateGrid as C
};
