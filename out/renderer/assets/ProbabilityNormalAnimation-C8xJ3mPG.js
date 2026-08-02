import { a as requireReactDom, j as jsxRuntimeExports, r as reactExports } from "./index-DT9BKSox.js";
import { b as MATH_COLORS, w as withAlpha, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { C as CoordinateGrid } from "./CoordinateGrid-fDHVDEJz.js";
import { m as mathToDesign, d as designToMath } from "./coordinate-9upJ5J84.js";
import { I as InteractivePoint } from "./InteractivePoint-2lsgO1SM.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import { _ as generateHistogramBins, $ as estimateHistogramStats, a0 as normalPdf, b as buildMathQuantities, a1 as calcIntervalProbability } from "./mathQuantities-CPwsyb9V.js";
import "./useRadioGroup-DJLu5uAU.js";
var reactDomExports = requireReactDom();
const Toggle = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = ""
}) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "label",
    {
      className: [
        "flex items-center justify-between gap-2 cursor-pointer select-none",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className
      ].filter(Boolean).join(" "),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-medium text-neutral-600 truncate", children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            role: "switch",
            "aria-checked": checked,
            disabled,
            onClick: () => !disabled && onChange(!checked),
            className: [
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1",
              checked ? "bg-primary-500" : "bg-neutral-300",
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            ].join(" "),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: [
                  "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
                  checked ? "translate-x-4" : "translate-x-0.5"
                ].join(" ")
              }
            )
          }
        )
      ]
    }
  );
};
const HtmlTooltip = ({
  visible,
  x,
  y,
  items
}) => {
  if (!visible || items.length === 0) return null;
  const lineHeight = 20;
  const padding = 10;
  const labelWidth = 68;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const offsetX = 16;
  const estimatedHeight = items.length * lineHeight + padding * 2;
  const estimatedWidth = 200;
  let left = x + offsetX;
  let top = y - estimatedHeight - 12;
  if (left + estimatedWidth > viewportW - 8) {
    left = x - estimatedWidth - offsetX;
  }
  if (top < 8) {
    top = y + 16;
  }
  if (top + estimatedHeight > viewportH - 8) {
    top = viewportH - estimatedHeight - 8;
  }
  if (left < 8) {
    left = 8;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed z-[9999] pointer-events-none", style: { left, top }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "rounded-lg border border-neutral-200 bg-white shadow-lg",
      style: { padding: `${padding}px 12px`, minWidth: 180 },
      children: items.map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-baseline gap-3 whitespace-nowrap",
          style: { height: lineHeight, lineHeight: `${lineHeight}px` },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "shrink-0 text-[11px]",
                style: {
                  color: item.color ?? MATH_COLORS.labelTextLight,
                  fontFamily: "monospace",
                  width: labelWidth
                },
                children: item.label
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "text-[11px] font-bold",
                style: {
                  color: MATH_COLORS.labelText,
                  fontFamily: "monospace"
                },
                children: item.value
              }
            )
          ]
        },
        i
      ))
    }
  ) });
};
function ProbabilityNormalScene({
  params,
  scale,
  vp,
  fontScale,
  studyMode,
  showStatsLines = true,
  showFrequencyLine = false,
  showSigmaIntervals = false,
  onParamChange,
  onBinMouseEnter,
  onBinMouseMove,
  onBinMouseLeave
}) {
  const { mu, sigma, binCount, sampleSize, x1, x2 } = params;
  const safeSigma = Math.max(0.1, sigma);
  const bins = reactExports.useMemo(() => {
    return generateHistogramBins(mu, safeSigma, binCount, sampleSize);
  }, [mu, safeSigma, binCount, sampleSize]);
  const stats = reactExports.useMemo(() => {
    return estimateHistogramStats(bins);
  }, [bins]);
  const curvePathD = reactExports.useMemo(() => {
    const points = [];
    const step = 0.05;
    for (let x = -6; x <= 6; x += step) {
      const y = normalPdf(x, mu, safeSigma);
      const pt = mathToDesign(x, y, scale);
      points.push(
        `${x === -6 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
      );
    }
    return points.join(" ");
  }, [mu, safeSigma, scale]);
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const shadowPathD = reactExports.useMemo(() => {
    const points = [];
    const step = 0.02;
    const startPt = mathToDesign(minX, 0, scale);
    points.push(`M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)}`);
    for (let x = minX; x <= maxX; x += step) {
      const y = normalPdf(x, mu, safeSigma);
      const pt = mathToDesign(x, y, scale);
      points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
    }
    const endY = normalPdf(maxX, mu, safeSigma);
    const endPt1 = mathToDesign(maxX, endY, scale);
    const endPt2 = mathToDesign(maxX, 0, scale);
    points.push(`L ${endPt1.x.toFixed(1)} ${endPt1.y.toFixed(1)}`);
    points.push(`L ${endPt2.x.toFixed(1)} ${endPt2.y.toFixed(1)}`);
    points.push("Z");
    return points.join(" ");
  }, [minX, maxX, mu, safeSigma, scale]);
  const labelEntries = reactExports.useMemo(() => {
    if (!showStatsLines || studyMode === "sigmaRule") return [];
    const modeY = Math.max(0.05, normalPdf(stats.mode, mu, safeSigma));
    const medianY = Math.max(0.05, normalPdf(stats.median, mu, safeSigma));
    const meanY = Math.max(0.05, normalPdf(stats.mean, mu, safeSigma));
    const modePt = mathToDesign(stats.mode, modeY, scale);
    const medianPt = mathToDesign(stats.median, medianY, scale);
    const meanPt = mathToDesign(stats.mean, meanY, scale);
    return [
      {
        key: "mode",
        text: `众数 ${stats.mode.toFixed(2)}`,
        x: modePt.x,
        y: modePt.y,
        anchor: "middle",
        dy: -8,
        priority: 3
      },
      {
        key: "median",
        text: `中位数 ${stats.median.toFixed(2)}`,
        x: medianPt.x,
        y: medianPt.y,
        anchor: "middle",
        dy: -8,
        priority: 2
      },
      {
        key: "mean",
        text: `平均数 ${stats.mean.toFixed(2)}`,
        x: meanPt.x,
        y: meanPt.y,
        anchor: "middle",
        dy: -8,
        priority: 1
      }
    ];
  }, [stats, scale, showStatsLines, studyMode, mu, safeSigma]);
  const placedLabels = reactExports.useMemo(() => {
    return avoidLabels(labelEntries, { fontScale, stepY: 14 });
  }, [labelEntries, fontScale]);
  const handleDragX1 = (newPx) => {
    const mathPt = designToMath(newPx, 0, scale);
    const clampedX = Math.max(-5, Math.min(5, Math.round(mathPt.x * 10) / 10));
    onParamChange("x1", clampedX);
  };
  const handleDragX2 = (newPx) => {
    const mathPt = designToMath(newPx, 0, scale);
    const clampedX = Math.max(-5, Math.min(5, Math.round(mathPt.x * 10) / 10));
    onParamChange("x2", clampedX);
  };
  const x1Design = mathToDesign(x1, 0, scale);
  const x2Design = mathToDesign(x2, 0, scale);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CoordinateGrid,
      {
        scale,
        fontScale,
        xStep: 1,
        yStep: 0.1
      }
    ),
    (studyMode === "sigmaRule" || studyMode === "normalFit") && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "path",
      {
        d: shadowPathD,
        fill: withAlpha(MATH_COLORS.paramTertiary, 0.35),
        stroke: MATH_COLORS.paramTertiary,
        strokeWidth: 1.5,
        strokeDasharray: "4 2"
      }
    ),
    studyMode !== "sigmaRule" && bins.map((bin) => {
      const leftTop = mathToDesign(bin.xStart, bin.density, scale);
      const rightBottom = mathToDesign(bin.xEnd, 0, scale);
      const rectWidth = Math.max(1, rightBottom.x - leftTop.x);
      const rectHeight = Math.max(1, rightBottom.y - leftTop.y);
      return /* @__PURE__ */ jsxRuntimeExports.jsx("g", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: leftTop.x,
          y: leftTop.y,
          width: rectWidth,
          height: rectHeight,
          fill: withAlpha(MATH_COLORS.barFill, 0.45),
          stroke: MATH_COLORS.barBorder,
          strokeWidth: 1.5,
          className: "transition-colors duration-150 hover:opacity-80",
          style: { cursor: "pointer" },
          onMouseEnter: (e) => onBinMouseEnter?.(bin, e),
          onMouseMove: onBinMouseMove,
          onMouseLeave: onBinMouseLeave
        }
      ) }, bin.index);
    }),
    showFrequencyLine && studyMode !== "sigmaRule" && /* @__PURE__ */ jsxRuntimeExports.jsx("g", { children: (() => {
      const points = [];
      const startX = bins[0].xStart;
      const startPt = mathToDesign(startX, 0, scale);
      points.push(`M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)}`);
      for (const bin of bins) {
        const pt = mathToDesign(bin.mid, bin.density, scale);
        points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
      }
      const endX = bins[bins.length - 1].xEnd;
      const endPt = mathToDesign(endX, 0, scale);
      points.push(`L ${endPt.x.toFixed(1)} ${endPt.y.toFixed(1)}`);
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          d: points.join(" "),
          fill: "none",
          stroke: MATH_COLORS.frequencyLine,
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          className: "transition-all duration-300"
        }
      );
    })() }),
    showSigmaIntervals && studyMode === "sigmaRule" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      (() => {
        const x12 = mu - sigma;
        const x22 = mu + sigma;
        const y1 = 0;
        const y2 = normalPdf(mu, mu, safeSigma) * 0.8;
        const leftBottom = mathToDesign(x12, y1, scale);
        const points = [];
        points.push(
          `M ${leftBottom.x.toFixed(1)} ${leftBottom.y.toFixed(1)}`
        );
        for (let x = x12; x <= x22; x += 0.05) {
          const y = normalPdf(x, mu, safeSigma) * 0.8;
          const pt = mathToDesign(x, y, scale);
          points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
        }
        const endPt = mathToDesign(x22, 0, scale);
        points.push(`L ${endPt.x.toFixed(1)} ${endPt.y.toFixed(1)}`);
        points.push("Z");
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              d: points.join(" "),
              fill: MATH_COLORS.sigma1Fill,
              stroke: MATH_COLORS.densityCurve,
              strokeWidth: 1,
              strokeDasharray: "4 2"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: mathToDesign(mu, y2 + 0.02, scale).x,
              y: mathToDesign(mu, y2 + 0.02, scale).y,
              fontSize: fontScale(10),
              fill: MATH_COLORS.densityCurve,
              textAnchor: "middle",
              className: "font-bold select-none",
              children: "68.27%"
            }
          )
        ] });
      })(),
      (() => {
        const x12 = mu - 2 * sigma;
        const x22 = mu + 2 * sigma;
        const y1 = 0;
        const y2 = normalPdf(mu, mu, safeSigma) * 0.5;
        const leftBottom = mathToDesign(x12, y1, scale);
        const points = [];
        points.push(
          `M ${leftBottom.x.toFixed(1)} ${leftBottom.y.toFixed(1)}`
        );
        for (let x = x12; x <= x22; x += 0.05) {
          const y = normalPdf(x, mu, safeSigma) * 0.5;
          const pt = mathToDesign(x, y, scale);
          points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
        }
        const endPt = mathToDesign(x22, 0, scale);
        points.push(`L ${endPt.x.toFixed(1)} ${endPt.y.toFixed(1)}`);
        points.push("Z");
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              d: points.join(" "),
              fill: MATH_COLORS.sigma2Fill,
              stroke: MATH_COLORS.barFill,
              strokeWidth: 1,
              strokeDasharray: "4 2"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: mathToDesign(x12 - 0.1, y2, scale).x,
              y: mathToDesign(x12 - 0.1, y2, scale).y,
              fontSize: fontScale(9),
              fill: MATH_COLORS.barBorder,
              textAnchor: "end",
              className: "font-semibold select-none",
              children: "95.45%"
            }
          )
        ] });
      })(),
      (() => {
        const x12 = mu - 3 * sigma;
        const x22 = mu + 3 * sigma;
        const y1 = 0;
        const y2 = normalPdf(mu, mu, safeSigma) * 0.3;
        const leftBottom = mathToDesign(x12, y1, scale);
        const points = [];
        points.push(
          `M ${leftBottom.x.toFixed(1)} ${leftBottom.y.toFixed(1)}`
        );
        for (let x = x12; x <= x22; x += 0.05) {
          const y = normalPdf(x, mu, safeSigma) * 0.3;
          const pt = mathToDesign(x, y, scale);
          points.push(`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
        }
        const endPt = mathToDesign(x22, 0, scale);
        points.push(`L ${endPt.x.toFixed(1)} ${endPt.y.toFixed(1)}`);
        points.push("Z");
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              d: points.join(" "),
              fill: MATH_COLORS.sigma3Fill,
              stroke: MATH_COLORS.sequenceSecondary,
              strokeWidth: 1,
              strokeDasharray: "4 2"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: mathToDesign(x12 - 0.1, y2, scale).x,
              y: mathToDesign(x12 - 0.1, y2, scale).y,
              fontSize: fontScale(9),
              fill: MATH_COLORS.sequenceSecondary,
              textAnchor: "end",
              className: "font-semibold select-none",
              children: "99.73%"
            }
          )
        ] });
      })()
    ] }),
    showStatsLines && studyMode !== "sigmaRule" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      (() => {
        const modeY = Math.max(0.05, normalPdf(stats.mode, mu, safeSigma));
        const modePt = mathToDesign(stats.mode, modeY, scale);
        const basePt = mathToDesign(stats.mode, 0, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: modePt.x,
            y1: basePt.y,
            x2: modePt.x,
            y2: modePt.y,
            stroke: MATH_COLORS.paramPrimary,
            strokeWidth: 1.5,
            strokeDasharray: "4 3"
          }
        );
      })(),
      (() => {
        const medY = Math.max(0.05, normalPdf(stats.median, mu, safeSigma));
        const medPt = mathToDesign(stats.median, medY, scale);
        const basePt = mathToDesign(stats.median, 0, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: medPt.x,
            y1: basePt.y,
            x2: medPt.x,
            y2: medPt.y,
            stroke: MATH_COLORS.paramSecondary,
            strokeWidth: 1.5,
            strokeDasharray: "4 3"
          }
        );
      })(),
      (() => {
        const meanY = Math.max(0.05, normalPdf(stats.mean, mu, safeSigma));
        const meanPt = mathToDesign(stats.mean, meanY, scale);
        const basePt = mathToDesign(stats.mean, 0, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: meanPt.x,
            y1: basePt.y,
            x2: meanPt.x,
            y2: meanPt.y,
            stroke: MATH_COLORS.function,
            strokeWidth: 1.5,
            strokeDasharray: "4 3"
          }
        );
      })(),
      placedLabels.map((lbl) => {
        let labelColor = MATH_COLORS.function;
        if (lbl.key === "mode") labelColor = MATH_COLORS.paramPrimary;
        if (lbl.key === "median") labelColor = MATH_COLORS.paramSecondary;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: lbl.x,
            y: lbl.y,
            dy: lbl.finalDy,
            fontSize: fontScale(11),
            fill: labelColor,
            textAnchor: lbl.anchor,
            className: "font-bold select-none drop-shadow-sm",
            children: lbl.text
          },
          lbl.key
        );
      })
    ] }),
    studyMode !== "histogram" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "path",
      {
        d: curvePathD,
        fill: "none",
        stroke: MATH_COLORS.paramPrimary,
        strokeWidth: 2.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "transition-all duration-300"
      }
    ),
    studyMode !== "histogram" && /* @__PURE__ */ jsxRuntimeExports.jsx("g", { children: (() => {
      const peakY = normalPdf(mu, mu, safeSigma);
      const muPt = mathToDesign(mu, peakY, scale);
      const axisPt = mathToDesign(mu, 0, scale);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: muPt.x,
            y1: axisPt.y,
            x2: muPt.x,
            y2: muPt.y,
            stroke: MATH_COLORS.paramPrimary,
            strokeWidth: 1.5,
            strokeDasharray: "6 3"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: muPt.x,
            cy: muPt.y,
            r: 4,
            fill: MATH_COLORS.paramPrimary
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: muPt.x,
            y: muPt.y - 8,
            fontSize: fontScale(11),
            fill: MATH_COLORS.paramPrimary,
            textAnchor: "middle",
            className: "font-bold select-none",
            children: [
              "μ = ",
              mu.toFixed(1)
            ]
          }
        )
      ] });
    })() }),
    (studyMode === "sigmaRule" || studyMode === "normalFit") && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: x1Design.x,
          cy: x1Design.y,
          scale,
          vp,
          onDrag: (mathPt) => {
            handleDragX1(scale.originX + mathPt.x * scale.scaleX);
          },
          color: MATH_COLORS.paramTertiary,
          label: `x₁ = ${x1.toFixed(1)}`,
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: x2Design.x,
          cy: x2Design.y,
          scale,
          vp,
          onDrag: (mathPt) => {
            handleDragX2(scale.originX + mathPt.x * scale.scaleX);
          },
          color: MATH_COLORS.paramTertiary,
          label: `x₂ = ${x2.toFixed(1)}`,
          fontScale
        }
      )
    ] })
  ] });
}
const defaultParams = {
  mu: 0,
  sigma: 1,
  binCount: 10,
  sampleSize: 200,
  x1: -1,
  x2: 1
};
const paramMeta = {
  mu: {
    label: "均值 μ",
    labelFormula: "\\text{均值 } \\color{#EF4444}{\\mu}",
    defaultValue: 0,
    min: -3,
    max: 3,
    step: 0.1,
    description: "决定正态分布曲线的对称轴与中心位置",
    descriptionFormula: "x = \\color{#EF4444}{\\mu}",
    importance: "core",
    marks: [
      {
        value: 0,
        label: "μ = 0",
        labelFormula: "\\color{#EF4444}{\\mu} = 0",
        variant: "critical"
      }
    ]
  },
  sigma: {
    label: "标准差 σ",
    labelFormula: "\\text{标准差 } \\color{#D97706}{\\sigma}",
    defaultValue: 1,
    min: 0.3,
    max: 2.5,
    step: 0.1,
    description: "决定正态分布曲线的分散程度（σ越小越瘦陡，σ越大越矮胖）",
    descriptionFormula: "\\color{#D97706}{\\sigma} > 0",
    importance: "core",
    marks: [
      {
        value: 1,
        label: "σ = 1",
        labelFormula: "\\color{#D97706}{\\sigma} = 1",
        variant: "recommended"
      }
    ]
  },
  binCount: {
    label: "直方图组数 K",
    labelFormula: "\\text{组数 } K",
    defaultValue: 10,
    min: 5,
    max: 24,
    step: 1,
    description: "数据切分的分组个数（组距 Δx = 全程 / K）",
    descriptionFormula: "\\Delta x = \\frac{7\\sigma}{K}",
    importance: "display"
  },
  sampleSize: {
    label: "样本容量 N",
    labelFormula: "\\text{样本容量 } N",
    defaultValue: 200,
    min: 50,
    max: 1e3,
    step: 50,
    description: "抽样调查的总体数据样本个数",
    importance: "display"
  },
  x1: {
    label: "区间左端点 x₁",
    labelFormula: "\\text{左端点 } \\color{#059669}{x_1}",
    defaultValue: -1,
    min: -4,
    max: 4,
    step: 0.1,
    description: "目标计算概率区间的左侧边界",
    importance: "core"
  },
  x2: {
    label: "区间右端点 x₂",
    labelFormula: "\\text{右端点 } \\color{#059669}{x_2}",
    defaultValue: 1,
    min: -4,
    max: 4,
    step: 0.1,
    description: "目标计算概率区间的右侧边界",
    importance: "core"
  }
};
function ProbabilityNormalAnimation() {
  const [studyMode, setStudyMode] = reactExports.useState("histogram");
  const [showStatsLines, setShowStatsLines] = reactExports.useState(true);
  const [showFrequencyLine, setShowFrequencyLine] = reactExports.useState(false);
  const [showSigmaIntervals, setShowSigmaIntervals] = reactExports.useState(false);
  const [params, setParams] = reactExports.useState(() => ({
    mu: defaultParams.mu,
    sigma: defaultParams.sigma,
    binCount: defaultParams.binCount,
    sampleSize: defaultParams.sampleSize,
    x1: defaultParams.x1,
    x2: defaultParams.x2
  }));
  const [tooltip, setTooltip] = reactExports.useState({
    visible: false,
    x: 0,
    y: 0,
    items: []
  });
  const handleBinMouseEnter = reactExports.useCallback(
    (bin, e) => {
      const items = [
        {
          label: "区间",
          value: `[${bin.xStart.toFixed(2)}, ${bin.xEnd.toFixed(2)})`,
          color: MATH_COLORS.paramSecondary
        },
        { label: "组中值", value: bin.mid.toFixed(2) },
        { label: "组距", value: bin.width.toFixed(2) },
        { label: "频率/组距", value: bin.density.toFixed(4) },
        { label: "频率", value: bin.frequency.toFixed(4) },
        { label: "频数", value: String(bin.count) }
      ];
      setTooltip({ visible: true, x: e.clientX, y: e.clientY, items });
    },
    []
  );
  const handleBinMouseMove = reactExports.useCallback((e) => {
    setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
  }, []);
  const handleBinMouseLeave = reactExports.useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-5.5, 5.5],
    yRange: [-0.1, 0.8],
    keepAspectRatio: false
  });
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-probability-normal", params, {
      studyMode
    });
  }, [params, studyMode]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };
  const handleReset = () => {
    setParams({
      mu: defaultParams.mu,
      sigma: defaultParams.sigma,
      binCount: defaultParams.binCount,
      sampleSize: defaultParams.sampleSize,
      x1: defaultParams.x1,
      x2: defaultParams.x2
    });
  };
  const paramConfigs = reactExports.useMemo(() => {
    const keysByMode = {
      histogram: ["mu", "sigma", "binCount", "sampleSize"],
      normalFit: ["mu", "sigma", "binCount", "x1", "x2"],
      sigmaRule: ["mu", "sigma", "x1", "x2"]
    };
    const keys = keysByMode[studyMode] ?? Object.keys(paramMeta);
    return keys.filter((key) => key in paramMeta).map((key) => {
      const meta = paramMeta[key];
      return {
        key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks
      };
    });
  }, [params, studyMode]);
  const formulaLatex = reactExports.useMemo(() => {
    const muVal = params.mu ?? 0;
    const sigVal = params.sigma ?? 1;
    if (studyMode === "histogram") {
      return `\\text{直方图矩形面积 } S_i = \\frac{\\text{频率}_i}{\\Delta x} \\times \\Delta x = \\text{频率}_i`;
    }
    const minX = Math.min(params.x1, params.x2).toFixed(1);
    const maxX = Math.max(params.x1, params.x2).toFixed(1);
    const pVal = (calcIntervalProbability(muVal, sigVal, params.x1, params.x2) * 100).toFixed(2);
    return `f(x) = \\frac{1}{\\sqrt{2\\pi} \\cdot \\color{${MATH_COLORS.paramSecondary}}{${sigVal.toFixed(1)}}} e^{-\\frac{(x - \\color{${MATH_COLORS.paramPrimary}}{${muVal.toFixed(1)}})^2}{2 \\cdot \\color{${MATH_COLORS.paramSecondary}}{${sigVal.toFixed(1)}}^2}} \\quad P(${minX} \\le X \\le ${maxX}) = \\color{${MATH_COLORS.paramTertiary}}{${pVal}\\%}`;
  }, [params, studyMode]);
  const panelTitle = reactExports.useMemo(() => {
    if (studyMode === "histogram") return "频率分布直方图与数字特征";
    if (studyMode === "normalFit") return "直方图与正态曲线拟合看板";
    return "正态分布 3-σ 原则与区间概率看板";
  }, [studyMode]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ThreePanel,
      {
        left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            LeftPanelSection,
            {
              title: "探究模式",
              subtitle: "选择频率分布与正态分布学习视角",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectGrid,
                {
                  items: [
                    { key: "histogram", label: "直方图与数字特征" },
                    { key: "normalFit", label: "正态分布曲线拟合" },
                    { key: "sigmaRule", label: "3-σ 原则与区间概率" }
                  ],
                  value: studyMode,
                  onChange: (k) => setStudyMode(k),
                  variant: "filled",
                  columns: 1
                }
              )
            }
          ),
          studyMode !== "sigmaRule" && /* @__PURE__ */ jsxRuntimeExports.jsx(
            LeftPanelSection,
            {
              title: "辅助线与折线",
              subtitle: "控制图表辅助元素显示",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Toggle,
                  {
                    label: "显示众数/中位数/均值",
                    checked: showStatsLines,
                    onChange: setShowStatsLines
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Toggle,
                  {
                    label: "显示频率折线图",
                    checked: showFrequencyLine,
                    onChange: setShowFrequencyLine
                  }
                )
              ] })
            }
          ),
          studyMode === "sigmaRule" && /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "3-σ 原则", subtitle: "高亮显示区间概率", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Toggle,
            {
              label: "显示3-σ区间高亮",
              checked: showSigmaIntervals,
              onChange: setShowSigmaIntervals
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            LeftPanelSection,
            {
              title: "参数调节",
              subtitle: "拖动滑块改变分布状态或区间",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                ParamControl,
                {
                  params: paramConfigs,
                  onParamChange: handleParamChange,
                  onReset: handleReset
                }
              )
            }
          )
        ] }),
        center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: formulaLatex, mode: "inline" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            AnimationSvgCanvas,
            {
              containerRef,
              transform: vp.transform,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                ProbabilityNormalScene,
                {
                  params,
                  scale,
                  vp,
                  fontScale: canvasSize.font,
                  studyMode,
                  showStatsLines,
                  showFrequencyLine,
                  showSigmaIntervals,
                  onParamChange: handleParamChange,
                  onBinMouseEnter: handleBinMouseEnter,
                  onBinMouseMove: handleBinMouseMove,
                  onBinMouseLeave: handleBinMouseLeave
                }
              )
            }
          )
        ] }),
        right: /* @__PURE__ */ jsxRuntimeExports.jsx(
          MathPanel,
          {
            quantities: mathData.quantities,
            theorems: mathData.theorems,
            gaokaoPoints: mathData.gaokaoPoints,
            warnings: mathData.warnings,
            mnemonic: mathData.mnemonic,
            title: panelTitle
          }
        )
      }
    ),
    reactDomExports.createPortal(
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        HtmlTooltip,
        {
          visible: tooltip.visible,
          x: tooltip.x,
          y: tooltip.y,
          items: tooltip.items,
          fontScale: canvasSize.font
        }
      ),
      document.body
    )
  ] });
}
export {
  ProbabilityNormalAnimation
};
