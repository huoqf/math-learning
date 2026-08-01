import { R as React, j as jsxRuntimeExports, r as reactExports } from "./index-Bz0Bjl36.js";
import { w as withAlpha, b as MATH_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { I as InteractivePoint } from "./InteractivePoint-ZTf14j6W.js";
import { ak as generateHistogramBins, al as calculateHistogramStats, am as calculatePercentileShadeBins, an as calculateStratifiedSampling, b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import "./useRadioGroup-jCNJTR-s.js";
const StatPercentileScene = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "histogram"
}) => {
  const {
    percentileP,
    shift,
    sampleN,
    N1,
    N2,
    N3,
    mean1,
    mean2,
    mean3,
    var1,
    var2,
    var3
  } = params;
  const bins = React.useMemo(() => generateHistogramBins(shift), [shift]);
  const stats = React.useMemo(
    () => calculateHistogramStats(bins, percentileP),
    [bins, percentileP]
  );
  const shadeBins = React.useMemo(
    () => calculatePercentileShadeBins(bins, stats.percentileVal),
    [bins, stats.percentileVal]
  );
  const strat = React.useMemo(
    () => calculateStratifiedSampling(
      sampleN,
      N1,
      N2,
      N3,
      mean1,
      mean2,
      mean3,
      var1,
      var2,
      var3
    ),
    [sampleN, N1, N2, N3, mean1, mean2, mean3, var1, var2, var3]
  );
  const handlePercentileDrag = React.useCallback(
    (newMathPos) => {
      const targetX = Math.min(100, Math.max(50, newMathPos.x));
      let cum = 0;
      for (let i = 0; i < bins.length; i++) {
        const bin = bins[i];
        if (targetX <= bin.xMax || i === bins.length - 1) {
          const ratioInBin = Math.max(
            0,
            Math.min(1, (targetX - bin.xMin) / bin.width)
          );
          const pEst = Math.round((cum + ratioInBin * bin.frequency) * 100);
          onParamChange("percentileP", Math.max(5, Math.min(95, pEst)));
          break;
        }
        cum += bin.frequency;
      }
    },
    [bins, onParamChange]
  );
  const xAxisStart = mathToDesign(46, 0, scale);
  const xAxisEnd = mathToDesign(105, 0, scale);
  const yAxisStart = mathToDesign(50, 0, scale);
  const yAxisEnd = mathToDesign(
    50,
    studyMode === "cumulative" ? 1.08 : 0.051,
    scale
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    studyMode !== "stratified" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      studyMode === "histogram" && [0.01, 0.02, 0.03, 0.04, 0.05].map((hVal) => {
        const pLeft = mathToDesign(50, hVal, scale);
        const pRight = mathToDesign(100, hVal, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: pLeft.x,
              y1: pLeft.y,
              x2: pRight.x,
              y2: pRight.y,
              stroke: withAlpha(MATH_COLORS.axis, 0.12),
              strokeDasharray: "3 3"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: pLeft.x - 5,
              y1: pLeft.y,
              x2: pLeft.x,
              y2: pLeft.y,
              stroke: MATH_COLORS.axis,
              strokeWidth: 1.5
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: pLeft.x - 8,
              y: pLeft.y + 4,
              textAnchor: "end",
              fill: MATH_COLORS.labelText,
              fontSize: fontScale(10),
              fontFamily: "monospace",
              children: hVal.toFixed(2)
            }
          )
        ] }, `y-grid-hist-${hVal}`);
      }),
      studyMode === "cumulative" && [0.2, 0.4, 0.6, 0.8, 1].map((cumRatio) => {
        const pLeft = mathToDesign(50, cumRatio, scale);
        const pRight = mathToDesign(100, cumRatio, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: pLeft.x,
              y1: pLeft.y,
              x2: pRight.x,
              y2: pRight.y,
              stroke: withAlpha(MATH_COLORS.axis, 0.12),
              strokeDasharray: "3 3"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: pLeft.x - 5,
              y1: pLeft.y,
              x2: pLeft.x,
              y2: pLeft.y,
              stroke: MATH_COLORS.axis,
              strokeWidth: 1.5
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: pLeft.x - 8,
              y: pLeft.y + 4,
              textAnchor: "end",
              fill: MATH_COLORS.labelText,
              fontSize: fontScale(10),
              fontFamily: "monospace",
              children: [
                Math.round(cumRatio * 100),
                "%"
              ]
            }
          )
        ] }, `y-grid-cum-${cumRatio}`);
      }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: xAxisStart.x,
          y1: xAxisStart.y,
          x2: xAxisEnd.x,
          y2: xAxisEnd.y,
          stroke: MATH_COLORS.axis,
          strokeWidth: 2
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
          strokeWidth: 2
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
        "polygon",
        {
          points: `${yAxisEnd.x},${yAxisEnd.y} ${yAxisEnd.x - 4},${yAxisEnd.y + 8} ${yAxisEnd.x + 4},${yAxisEnd.y + 8}`,
          fill: MATH_COLORS.axis
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: xAxisEnd.x - 5,
          y: xAxisEnd.y + 22,
          fill: MATH_COLORS.labelText,
          fontSize: fontScale(11),
          fontWeight: "bold",
          children: "样本数值 x"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: yAxisEnd.x - 15,
          y: yAxisEnd.y - 10,
          fill: MATH_COLORS.labelText,
          fontSize: fontScale(11),
          fontWeight: "bold",
          children: studyMode === "cumulative" ? "累积频率 F(x)" : "频率 / 组距 (h = f / d)"
        }
      ),
      [50, 60, 70, 80, 90, 100].map((xTick) => {
        const pt = mathToDesign(xTick, 0, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: pt.x,
              y1: pt.y,
              x2: pt.x,
              y2: pt.y + 5,
              stroke: MATH_COLORS.axis,
              strokeWidth: 1.5
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: pt.x,
              y: pt.y + 18,
              textAnchor: "middle",
              fill: MATH_COLORS.labelText,
              fontSize: fontScale(11),
              fontWeight: "600",
              fontFamily: "monospace",
              children: xTick
            }
          )
        ] }, `x-tick-${xTick}`);
      })
    ] }, "coordinate-system-base"),
    studyMode === "histogram" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      bins.map((bin, i) => {
        const pTL = mathToDesign(bin.xMin, bin.height, scale);
        const pBR = mathToDesign(bin.xMax, 0, scale);
        const widthPx = Math.abs(pBR.x - pTL.x);
        const heightPx = Math.abs(pBR.y - pTL.y);
        const isTargetBin = i === stats.percentileBinIndex;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: pTL.x,
              y: pTL.y,
              width: widthPx,
              height: heightPx,
              fill: isTargetBin ? withAlpha(MATH_COLORS.function, 0.16) : withAlpha(MATH_COLORS.function, 0.1),
              stroke: MATH_COLORS.function,
              strokeWidth: 1.5,
              rx: 2
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: pTL.x + widthPx / 2,
              y: pTL.y - 6,
              textAnchor: "middle",
              fill: isTargetBin ? MATH_COLORS.paramPrimary : MATH_COLORS.labelText,
              fontSize: fontScale(10),
              fontWeight: "bold",
              children: [
                "h=",
                bin.height.toFixed(3),
                " (f=",
                (bin.frequency * 100).toFixed(0),
                "%)"
              ]
            }
          )
        ] }, `histogram-bin-${i}`);
      }),
      shadeBins.map((sBin, i) => {
        if (sBin.fraction <= 0) return null;
        const pTL = mathToDesign(sBin.xMin, sBin.height, scale);
        const pBR = mathToDesign(sBin.xMax, 0, scale);
        const widthPx = Math.abs(pBR.x - pTL.x);
        const heightPx = Math.abs(pBR.y - pTL.y);
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: pTL.x,
            y: pTL.y,
            width: widthPx,
            height: heightPx,
            fill: withAlpha(MATH_COLORS.paramPrimary, 0.35),
            stroke: MATH_COLORS.paramPrimary,
            strokeWidth: 1,
            rx: 1
          },
          `shade-bin-${i}`
        );
      }),
      (() => {
        const pVal = stats.percentileVal;
        const ptBase = mathToDesign(pVal, 0, scale);
        const currentBinIndex = stats.percentileBinIndex;
        const binH = bins[currentBinIndex]?.height ?? 0.02;
        const ptTop = mathToDesign(pVal, binH, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: ptBase.x,
              y1: ptTop.y - 20,
              x2: ptBase.x,
              y2: ptBase.y,
              stroke: MATH_COLORS.paramPrimary,
              strokeWidth: 2.5,
              strokeDasharray: "4 2"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: ptBase.x - 44,
              y: ptTop.y - 42,
              width: 88,
              height: 22,
              rx: 4,
              fill: MATH_COLORS.paramPrimary
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: ptBase.x,
              y: ptTop.y - 27,
              textAnchor: "middle",
              fill: MATH_COLORS.white,
              fontSize: fontScale(10.5),
              fontWeight: "bold",
              children: [
                "P_",
                percentileP,
                " = ",
                pVal.toFixed(1)
              ]
            }
          )
        ] }, "percentile-indicator");
      })(),
      (() => {
        const ptMean = mathToDesign(stats.mean, 0, scale);
        const yTopPx = mathToDesign(stats.mean, 0.048, scale).y;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: ptMean.x,
              y1: yTopPx,
              x2: ptMean.x,
              y2: ptMean.y,
              stroke: MATH_COLORS.function,
              strokeWidth: 1.5,
              strokeDasharray: "4 3"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: ptMean.x - 36,
              y: yTopPx - 20,
              width: 72,
              height: 18,
              rx: 3,
              fill: withAlpha(MATH_COLORS.function, 0.9)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: ptMean.x,
              y: yTopPx - 7,
              textAnchor: "middle",
              fill: MATH_COLORS.white,
              fontSize: fontScale(9.5),
              fontWeight: "bold",
              children: [
                "均值 x̄=",
                stats.mean.toFixed(1)
              ]
            }
          )
        ] }, "mean-indicator");
      })(),
      percentileP !== 50 && (() => {
        const ptMed = mathToDesign(stats.median, 0, scale);
        const yTopPx = mathToDesign(stats.median, 0.044, scale).y;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: ptMed.x,
              y1: yTopPx,
              x2: ptMed.x,
              y2: ptMed.y,
              stroke: MATH_COLORS.paramSecondary,
              strokeWidth: 1.5,
              strokeDasharray: "3 3"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: ptMed.x - 32,
              y: yTopPx - 18,
              width: 64,
              height: 16,
              rx: 3,
              fill: withAlpha(MATH_COLORS.paramSecondary, 0.9)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: ptMed.x,
              y: yTopPx - 6,
              textAnchor: "middle",
              fill: MATH_COLORS.white,
              fontSize: fontScale(9),
              fontWeight: "bold",
              children: [
                "Me=",
                stats.median.toFixed(1)
              ]
            }
          )
        ] }, "median-indicator");
      })(),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: stats.percentileVal,
          cy: 0,
          scale,
          vp,
          onDrag: handlePercentileDrag,
          color: MATH_COLORS.paramPrimary,
          r: 7,
          fontScale
        }
      )
    ] }, "mode-histogram"),
    studyMode === "cumulative" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      bins.map((bin, i) => {
        const pTL = mathToDesign(bin.xMin, bin.cumFrequency, scale);
        const pBR = mathToDesign(bin.xMax, 0, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: pTL.x,
            y: pTL.y,
            width: Math.abs(pBR.x - pTL.x),
            height: Math.abs(pBR.y - pTL.y),
            fill: withAlpha(MATH_COLORS.function, 0.04),
            stroke: withAlpha(MATH_COLORS.function, 0.15),
            strokeDasharray: "2 2"
          },
          `cum-bg-${i}`
        );
      }),
      (() => {
        const points = [{ x: 50, y: 0 }];
        bins.forEach((b) => points.push({ x: b.xMax, y: b.cumFrequency }));
        const pathStr = points.map((p, idx) => {
          const pt = mathToDesign(p.x, p.y, scale);
          return `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`;
        }).join(" ");
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              d: pathStr,
              fill: "none",
              stroke: MATH_COLORS.paramSecondary,
              strokeWidth: 3
            }
          ),
          points.map((p, idx) => {
            const pt = mathToDesign(p.x, p.y, scale);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "circle",
                {
                  cx: pt.x,
                  cy: pt.y,
                  r: 4,
                  fill: MATH_COLORS.white,
                  stroke: MATH_COLORS.paramSecondary,
                  strokeWidth: 2
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "text",
                {
                  x: pt.x,
                  y: pt.y - 8,
                  textAnchor: "middle",
                  fill: MATH_COLORS.labelText,
                  fontSize: fontScale(9.5),
                  fontWeight: "600",
                  fontFamily: "monospace",
                  children: [
                    "(",
                    p.x,
                    ", ",
                    Math.round(p.y * 100),
                    "%)"
                  ]
                }
              )
            ] }, `cum-node-${idx}`);
          })
        ] }, "cumulative-polyline");
      })(),
      (() => {
        const ratio = percentileP / 100;
        const pVal = stats.percentileVal;
        const ptIntersect = mathToDesign(pVal, ratio, scale);
        const ptY = mathToDesign(50, ratio, scale);
        const ptX = mathToDesign(pVal, 0, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: ptY.x,
              y1: ptY.y,
              x2: ptIntersect.x,
              y2: ptIntersect.y,
              stroke: MATH_COLORS.paramPrimary,
              strokeWidth: 2,
              strokeDasharray: "4 3"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: ptIntersect.x,
              y1: ptIntersect.y,
              x2: ptX.x,
              y2: ptX.y,
              stroke: MATH_COLORS.paramPrimary,
              strokeWidth: 2,
              strokeDasharray: "4 3"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: ptY.x - 48,
              y: ptY.y - 10,
              width: 42,
              height: 20,
              rx: 3,
              fill: MATH_COLORS.paramPrimary
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: ptY.x - 27,
              y: ptY.y + 4,
              textAnchor: "middle",
              fill: MATH_COLORS.white,
              fontSize: fontScale(10),
              fontWeight: "bold",
              children: [
                percentileP,
                "%"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: ptX.x - 34,
              y: ptX.y + 6,
              width: 68,
              height: 22,
              rx: 4,
              fill: MATH_COLORS.paramPrimary
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: ptX.x,
              y: ptX.y + 21,
              textAnchor: "middle",
              fill: MATH_COLORS.white,
              fontSize: fontScale(10.5),
              fontWeight: "bold",
              fontFamily: "monospace",
              children: pVal.toFixed(2)
            }
          )
        ] }, "percentile-interpolation-projection");
      })(),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: stats.percentileVal,
          cy: percentileP / 100,
          scale,
          vp,
          onDrag: handlePercentileDrag,
          color: MATH_COLORS.paramPrimary,
          r: 7,
          fontScale
        }
      )
    ] }, "mode-cumulative"),
    studyMode === "stratified" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      (() => {
        const pStart = mathToDesign(46, 0.08, scale);
        const pEnd = mathToDesign(105, 0.08, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: pStart.x,
              y1: pStart.y,
              x2: pEnd.x,
              y2: pEnd.y,
              stroke: MATH_COLORS.axis,
              strokeWidth: 2
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "polygon",
            {
              points: `${pEnd.x},${pEnd.y} ${pEnd.x - 8},${pEnd.y - 4} ${pEnd.x - 8},${pEnd.y + 4}`,
              fill: MATH_COLORS.axis
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: pEnd.x - 5,
              y: pEnd.y + 20,
              fill: MATH_COLORS.labelText,
              fontSize: fontScale(11),
              fontWeight: "bold",
              children: "样本数值 x"
            }
          ),
          [50, 60, 70, 80, 90, 100].map((xTick) => {
            const pt = mathToDesign(xTick, 0.08, scale);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "line",
                {
                  x1: pt.x,
                  y1: pt.y,
                  x2: pt.x,
                  y2: pt.y + 5,
                  stroke: MATH_COLORS.axis,
                  strokeWidth: 1.5
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "text",
                {
                  x: pt.x,
                  y: pt.y + 18,
                  textAnchor: "middle",
                  fill: MATH_COLORS.labelText,
                  fontSize: fontScale(11),
                  fontWeight: "600",
                  fontFamily: "monospace",
                  children: xTick
                }
              )
            ] }, `strat-tick-${xTick}`);
          })
        ] }, "stratified-axis");
      })(),
      (() => {
        const ptMeanTop = mathToDesign(strat.totalMean, 0.88, scale);
        const ptMeanBot = mathToDesign(strat.totalMean, 0.08, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: ptMeanTop.x,
              y1: ptMeanTop.y,
              x2: ptMeanBot.x,
              y2: ptMeanBot.y,
              stroke: MATH_COLORS.function,
              strokeWidth: 2,
              strokeDasharray: "5 3"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: ptMeanTop.x - 55,
              y: ptMeanTop.y - 22,
              width: 110,
              height: 22,
              rx: 4,
              fill: MATH_COLORS.function
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: ptMeanTop.x,
              y: ptMeanTop.y - 7,
              textAnchor: "middle",
              fill: MATH_COLORS.white,
              fontSize: fontScale(10.5),
              fontWeight: "bold",
              children: [
                "总体均值 x̄ = ",
                strat.totalMean.toFixed(2)
              ]
            }
          )
        ] }, "total-mean-line");
      })(),
      (() => {
        const strataInfo = [
          {
            name: "层 A (高一)",
            N: strat.strataN[0],
            n: strat.strataSampleN[0],
            weight: strat.strataWeights[0],
            mean: strat.strataMeans[0],
            var: strat.strataVars[0],
            yBase: 0.24,
            color: MATH_COLORS.paramPrimary
          },
          {
            name: "层 B (高二)",
            N: strat.strataN[1],
            n: strat.strataSampleN[1],
            weight: strat.strataWeights[1],
            mean: strat.strataMeans[1],
            var: strat.strataVars[1],
            yBase: 0.44,
            color: MATH_COLORS.paramSecondary
          },
          {
            name: "层 C (高三)",
            N: strat.strataN[2],
            n: strat.strataSampleN[2],
            weight: strat.strataWeights[2],
            mean: strat.strataMeans[2],
            var: strat.strataVars[2],
            yBase: 0.64,
            color: MATH_COLORS.paramTertiary
          }
        ];
        return /* @__PURE__ */ jsxRuntimeExports.jsx("g", { children: strataInfo.map((st, i) => {
          const stdDev = Math.max(1, Math.sqrt(st.var));
          const steps = 60;
          const points = [];
          const xMin = 50;
          const xMax = 100;
          for (let s = 0; s <= steps; s++) {
            const xVal = xMin + s / steps * (xMax - xMin);
            const z = (xVal - st.mean) / stdDev;
            const gaussianY = st.yBase + 0.12 * Math.exp(-0.5 * z * z);
            const pt = mathToDesign(xVal, gaussianY, scale);
            if (Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
              points.push(`${s === 0 ? "M" : "L"} ${pt.x} ${pt.y}`);
            }
          }
          const ptRightBase = mathToDesign(xMax, st.yBase, scale);
          const ptLeftBase = mathToDesign(xMin, st.yBase, scale);
          if (Number.isFinite(ptRightBase.x) && Number.isFinite(ptRightBase.y) && Number.isFinite(ptLeftBase.x) && Number.isFinite(ptLeftBase.y)) {
            points.push(`L ${ptRightBase.x} ${ptRightBase.y}`);
            points.push(`L ${ptLeftBase.x} ${ptLeftBase.y} Z`);
          }
          const pathD = points.join(" ");
          const ptMeanCenter = mathToDesign(st.mean, st.yBase, scale);
          const ptMeanTop = mathToDesign(
            st.mean,
            st.yBase + 0.13,
            scale
          );
          const ptTotalMeanAtLayer = mathToDesign(
            strat.totalMean,
            st.yBase,
            scale
          );
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "path",
              {
                d: pathD,
                fill: withAlpha(st.color, 0.2),
                stroke: st.color,
                strokeWidth: 2
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: ptLeftBase.x,
                y1: ptLeftBase.y,
                x2: ptRightBase.x,
                y2: ptRightBase.y,
                stroke: withAlpha(st.color, 0.35),
                strokeWidth: 1.5
              }
            ),
            Number.isFinite(ptMeanCenter.x) && Number.isFinite(ptMeanTop.y) && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: ptMeanCenter.x,
                y1: ptMeanTop.y,
                x2: ptMeanCenter.x,
                y2: ptMeanCenter.y,
                stroke: st.color,
                strokeWidth: 2,
                strokeDasharray: "4 2"
              }
            ),
            (() => {
              const ptBadge = mathToDesign(
                48,
                st.yBase + 0.11,
                scale
              );
              if (!Number.isFinite(ptBadge.x) || !Number.isFinite(ptBadge.y))
                return null;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "rect",
                  {
                    x: ptBadge.x,
                    y: ptBadge.y - 12,
                    width: 245,
                    height: 22,
                    rx: 4,
                    fill: withAlpha(st.color, 0.15),
                    stroke: st.color
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "text",
                  {
                    x: ptBadge.x + 8,
                    y: ptBadge.y + 3,
                    fill: st.color,
                    fontSize: fontScale(10),
                    fontWeight: "bold",
                    children: [
                      st.name,
                      ": N_",
                      i + 1,
                      "=",
                      st.N,
                      "人(抽",
                      st.n,
                      "人) 均值x̄_",
                      i + 1,
                      "=",
                      st.mean,
                      " 方差s_",
                      i + 1,
                      "²=",
                      st.var
                    ]
                  }
                )
              ] });
            })(),
            Math.abs(st.mean - strat.totalMean) > 0.5 && Number.isFinite(ptMeanCenter.x) && Number.isFinite(ptTotalMeanAtLayer.x) && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "line",
                {
                  x1: ptMeanCenter.x,
                  y1: ptMeanCenter.y - 10,
                  x2: ptTotalMeanAtLayer.x,
                  y2: ptTotalMeanAtLayer.y - 10,
                  stroke: st.color,
                  strokeWidth: 1.5,
                  strokeDasharray: "2 2"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "text",
                {
                  x: (ptMeanCenter.x + ptTotalMeanAtLayer.x) / 2,
                  y: ptMeanCenter.y - 13,
                  textAnchor: "middle",
                  fill: st.color,
                  fontSize: fontScale(9),
                  fontWeight: "bold",
                  children: [
                    "|x̄_",
                    i + 1,
                    "-x̄|=",
                    (st.mean - strat.totalMean).toFixed(1)
                  ]
                }
              )
            ] }, `diff-line-${i}`)
          ] }, `strata-vis-${i}`);
        }) }, "strata-distribution-curves");
      })(),
      (() => {
        const intraVar = strat.strataWeights[0] * strat.strataVars[0] + strat.strataWeights[1] * strat.strataVars[1] + strat.strataWeights[2] * strat.strataVars[2];
        const interMeanVar = Math.max(0, strat.totalVar - intraVar);
        const ptBarStart = mathToDesign(50, -0.04, scale);
        const totalWidthPx = 480;
        const barHeight = 24;
        const intraRatio = strat.totalVar > 0 ? intraVar / strat.totalVar : 0.5;
        const intraWidthPx = intraRatio * totalWidthPx;
        const interWidthPx = totalWidthPx - intraWidthPx;
        if (!Number.isFinite(ptBarStart.x) || !Number.isFinite(ptBarStart.y))
          return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: ptBarStart.x - 10,
              y: ptBarStart.y - 28,
              width: totalWidthPx + 160,
              height: 54,
              rx: 8,
              fill: withAlpha(MATH_COLORS.function, 0.06),
              stroke: withAlpha(MATH_COLORS.function, 0.25)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: ptBarStart.x,
              y: ptBarStart.y - 10,
              fill: MATH_COLORS.labelText,
              fontSize: fontScale(11.5),
              fontWeight: "bold",
              children: [
                "高考必考总体方差分解合成：s² = ",
                strat.totalVar.toFixed(2)
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: ptBarStart.x,
              y: ptBarStart.y,
              width: intraWidthPx,
              height: barHeight,
              rx: 4,
              fill: withAlpha(MATH_COLORS.function, 0.8)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: ptBarStart.x + intraWidthPx / 2,
              y: ptBarStart.y + 16,
              textAnchor: "middle",
              fill: MATH_COLORS.white,
              fontSize: fontScale(10),
              fontWeight: "bold",
              children: [
                "组内散度贡献: ",
                intraVar.toFixed(2),
                " (",
                (intraVar / Math.max(1, strat.totalVar) * 100).toFixed(0),
                "%)"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: ptBarStart.x + intraWidthPx,
              y: ptBarStart.y,
              width: interWidthPx,
              height: barHeight,
              rx: 4,
              fill: withAlpha(MATH_COLORS.paramSecondary, 0.85)
            }
          ),
          interWidthPx > 40 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: ptBarStart.x + intraWidthPx + interWidthPx / 2,
              y: ptBarStart.y + 16,
              textAnchor: "middle",
              fill: MATH_COLORS.white,
              fontSize: fontScale(10),
              fontWeight: "bold",
              children: [
                "组间重心离差: ",
                interMeanVar.toFixed(2),
                " (",
                (interMeanVar / Math.max(1, strat.totalVar) * 100).toFixed(0),
                "%)"
              ]
            }
          )
        ] }, "total-variance-stack-bar");
      })()
    ] }, "mode-stratified-vis")
  ] });
};
const defaultParams = {
  percentileP: 50,
  shift: 0,
  sampleN: 100,
  N1: 300,
  N2: 500,
  N3: 200,
  mean1: 72,
  mean2: 78,
  mean3: 85,
  var1: 36,
  var2: 49,
  var3: 25
};
const paramMeta = {
  percentileP: {
    key: "percentileP",
    label: "百分位数 p%",
    labelFormula: "p\\%",
    min: 5,
    max: 95,
    step: 1,
    defaultValue: 50,
    importance: "core",
    description: "控制第 p 百分位数位置（如 25%下四分位数，50%中位数，75%上四分位数）",
    descriptionFormula: "控制第 $p$ 百分位数位置（如 $25\\%$下四分位数，$50\\%$中位数，$75\\%$上四分位数）",
    marks: [
      {
        value: 25,
        variant: "recommended",
        label: "Q₁",
        labelFormula: "Q_1"
      },
      {
        value: 50,
        variant: "critical",
        label: "Me",
        labelFormula: "M_e"
      },
      {
        value: 75,
        variant: "recommended",
        label: "Q₃",
        labelFormula: "Q_3"
      }
    ]
  },
  shift: {
    key: "shift",
    label: "分布偏斜度 shift",
    labelFormula: "\\text{shift}",
    min: -1,
    max: 1,
    step: 0.1,
    defaultValue: 0,
    importance: "core",
    description: "调节直方图频率分布在各组间的右偏或左偏趋势"
  },
  sampleN: {
    key: "sampleN",
    label: "抽样总数 n",
    labelFormula: "n",
    min: 20,
    max: 300,
    step: 10,
    defaultValue: 100,
    importance: "core",
    description: "分层抽样拟抽取的数据样本总量"
  },
  N1: {
    key: "N1",
    label: "层 A 总体人数 N₁",
    labelFormula: "N_1",
    min: 100,
    max: 1e3,
    step: 50,
    defaultValue: 300,
    importance: "advanced",
    description: "分层抽样第 1 层的总体规模"
  },
  N2: {
    key: "N2",
    label: "层 B 总体人数 N₂",
    labelFormula: "N_2",
    min: 100,
    max: 1e3,
    step: 50,
    defaultValue: 500,
    importance: "advanced",
    description: "分层抽样第 2 层的总体规模"
  },
  N3: {
    key: "N3",
    label: "层 C 总体人数 N₃",
    labelFormula: "N_3",
    min: 100,
    max: 1e3,
    step: 50,
    defaultValue: 200,
    importance: "advanced",
    description: "分层抽样第 3 层的总体规模"
  },
  mean1: {
    key: "mean1",
    label: "层 A 平均数 x̄₁",
    labelFormula: "\\bar{x}_1",
    min: 50,
    max: 100,
    step: 1,
    defaultValue: 72,
    importance: "advanced",
    description: "第 1 层的样本均值"
  },
  mean2: {
    key: "mean2",
    label: "层 B 平均数 x̄₂",
    labelFormula: "\\bar{x}_2",
    min: 50,
    max: 100,
    step: 1,
    defaultValue: 78,
    importance: "advanced",
    description: "第 2 层的样本均值"
  },
  mean3: {
    key: "mean3",
    label: "层 C 平均数 x̄₃",
    labelFormula: "\\bar{x}_3",
    min: 50,
    max: 100,
    step: 1,
    defaultValue: 85,
    importance: "advanced",
    description: "第 3 层的样本均值"
  }
};
function StatPercentileAnimation() {
  const [studyMode, setStudyMode] = reactExports.useState("histogram");
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [42, 108],
    yRange: studyMode === "stratified" ? [-0.15, 1.15] : studyMode === "cumulative" ? [-0.12, 1.15] : [-7e-3, 0.054],
    keepAspectRatio: false
  });
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-stat-percentile", params, { studyMode });
  }, [params, studyMode]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };
  const handleReset = () => {
    setParams({ ...defaultParams });
  };
  const paramConfigs = reactExports.useMemo(() => {
    const keysByMode = {
      histogram: ["percentileP", "shift"],
      cumulative: ["percentileP", "shift"],
      stratified: [
        "sampleN",
        "N1",
        "N2",
        "N3",
        "mean1",
        "mean2",
        "mean3",
        "var1",
        "var2",
        "var3"
      ]
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
        step: meta.step ?? 1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks
      };
    });
  }, [params, studyMode]);
  const panelTitle = reactExports.useMemo(() => {
    if (studyMode === "histogram") return "直方图与数字特征看板";
    if (studyMode === "cumulative") return "百分位数与累积频率看板";
    return "分层抽样与总体方差看板";
  }, [studyMode]);
  const topFormulaLatex = reactExports.useMemo(() => {
    if (studyMode === "histogram") {
      return "\\text{矩形面积 } f_i = h_i \\cdot d, \\quad \\bar{x} = \\sum x_{\\text{mid}, i} \\cdot f_i";
    }
    if (studyMode === "cumulative") {
      return `y_p = a + \\frac{\\color{${MATH_COLORS.paramPrimary}}{${params.percentileP}\\% - F_{\\text{prev}}}}{h}`;
    }
    return "s^2 = \\sum w_i \\left[ s_i^2 + (\\bar{x}_i - \\bar{x})^2 \\right]";
  }, [studyMode, params.percentileP]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "研究模式", subtitle: "选择统计分析探究专题", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "histogram", label: "直方图与数字特征" },
              { key: "cumulative", label: "百分位数线性插值" },
              {
                key: "stratified",
                label: "分层抽样与总方差",
                fullWidth: true
              }
            ],
            value: studyMode,
            onChange: (k) => setStudyMode(k),
            variant: "filled"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "参数调节", subtitle: "拖动滑块改变统计参数", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: handleReset
          }
        ) })
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-3 left-16 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: topFormulaLatex, mode: "inline" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              StatPercentileScene,
              {
                params,
                scale,
                vp,
                onParamChange: handleParamChange,
                fontScale: canvasSize.font,
                studyMode
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
  );
}
export {
  StatPercentileAnimation,
  StatPercentileAnimation as default
};
