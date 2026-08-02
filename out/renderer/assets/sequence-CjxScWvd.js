import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { C as CoordinateGrid } from "./CoordinateGrid-fDHVDEJz.js";
import { F as FunctionGraph } from "./FunctionGraph-DziQOq7W.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { b as MATH_COLORS, w as withAlpha } from "./probabilityBayes-DNLi5nE3.js";
import { c as calcArithmeticSequence, a as calcGeometricSequence, d as calcLinearRecurrence, e as calcAccumulationRecurrence, f as calcMultiplicationRecurrence, g as calcReciprocalRecurrence, h as calcSecondOrderRecurrence, i as calcArithGeoSplit, j as calcTelescoping, k as calcCrossTelescoping, l as calcGroupedSequence, m as calcOddEvenSequence } from "./mathQuantities-CPwsyb9V.js";
function SequenceScene({
  params,
  scale,
  fontScale,
  activeMode,
  geometricViewType = "points",
  modelType = "arith-geo",
  recurrenceModelType = "linear-pan",
  highlightN = 1,
  onSelectN
}) {
  const a1 = params.a1 ?? 3;
  const d = params.d ?? -1;
  const q = params.q ?? 0.5;
  const N = Math.max(3, Math.min(15, Math.round(params.N ?? 8)));
  const p_rec = params.p_rec ?? 2;
  const q_rec = params.q_rec ?? 1;
  const a2 = params.a2 ?? 2;
  const coefA = params.coefA ?? 2;
  const coefB = params.coefB ?? 1;
  const coefC = params.coefC ?? 1;
  const arithData = reactExports.useMemo(() => calcArithmeticSequence(a1, d, N), [a1, d, N]);
  const geoData = reactExports.useMemo(() => calcGeometricSequence(a1, q, N), [a1, q, N]);
  const linearRecData = reactExports.useMemo(
    () => calcLinearRecurrence(a1, p_rec, q_rec, N),
    [a1, p_rec, q_rec, N]
  );
  const accumRecData = reactExports.useMemo(
    () => calcAccumulationRecurrence(a1, "linear", d, N),
    [a1, d, N]
  );
  const multRecData = reactExports.useMemo(
    () => calcMultiplicationRecurrence(a1, "n_over_n1", N),
    [a1, N]
  );
  const recipRecData = reactExports.useMemo(
    () => calcReciprocalRecurrence(a1, coefA, coefB, coefC, N),
    [a1, coefA, coefB, coefC, N]
  );
  const secondRecData = reactExports.useMemo(
    () => calcSecondOrderRecurrence(a1, a2, p_rec, q_rec, N),
    [a1, a2, p_rec, q_rec, N]
  );
  const arithGeoData = reactExports.useMemo(
    () => calcArithGeoSplit(a1, d, q, N),
    [a1, d, q, N]
  );
  const telescopingData = reactExports.useMemo(() => calcTelescoping(N), [N]);
  const crossTelescopingData = reactExports.useMemo(() => calcCrossTelescoping(N), [N]);
  const groupedData = reactExports.useMemo(
    () => calcGroupedSequence(a1, d, q, N),
    [a1, d, q, N]
  );
  const oddEvenData = reactExports.useMemo(() => calcOddEvenSequence(N), [N]);
  if (activeMode === "arithmetic") {
    const { terms, lineFn, parabolaFn, maxSnInfo } = arithData;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "sequence-scene-arithmetic", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: lineFn,
          scale,
          color: MATH_COLORS.sequence,
          strokeWidth: 1.5,
          strokeDasharray: "4,4"
        }
      ),
      Math.abs(d) > 1e-9 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: parabolaFn,
          scale,
          color: MATH_COLORS.sequenceSum,
          strokeWidth: 1.5,
          strokeDasharray: "3,3"
        }
      ),
      terms.map((t) => {
        const pt0 = mathToDesign(t.n - 0.25, 0, scale);
        const pt1 = mathToDesign(t.n + 0.25, t.an, scale);
        const x = Math.min(pt0.x, pt1.x);
        const y = Math.min(pt0.y, pt1.y);
        const width = Math.abs(pt1.x - pt0.x);
        const height = Math.abs(pt1.y - pt0.y);
        const isHighlighted = t.n === highlightN;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "g",
          {
            onClick: () => onSelectN?.(t.n),
            className: "cursor-pointer",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x,
                y,
                width,
                height,
                fill: withAlpha(
                  isHighlighted ? MATH_COLORS.sequenceHighlight : MATH_COLORS.sequence,
                  0.2
                ),
                stroke: isHighlighted ? MATH_COLORS.sequenceHighlight : MATH_COLORS.sequence,
                strokeWidth: isHighlighted ? 2 : 1,
                rx: 2
              }
            )
          },
          `bar-${t.n}`
        );
      }),
      terms.map((t) => {
        const posAn = mathToDesign(t.n, t.an, scale);
        const posSn = mathToDesign(t.n, t.Sn, scale);
        const isMaxSn = maxSnInfo && t.n === maxSnInfo.nMax;
        const isHighlighted = t.n === highlightN;
        const showFullLabel = isHighlighted || t.n === 1 || t.n === N || isMaxSn;
        const anLabelY = posAn.y - 8;
        const snTooClose = Math.abs(posAn.y - posSn.y) < 16;
        const snLabelY = snTooClose ? posSn.y + 16 : posSn.y - 8;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: posAn.x,
              y1: mathToDesign(t.n, 0, scale).y,
              x2: posAn.x,
              y2: posAn.y,
              stroke: MATH_COLORS.sequenceStem,
              strokeDasharray: "2,2",
              strokeWidth: 1
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: posAn.x,
              cy: posAn.y,
              r: 4,
              fill: MATH_COLORS.sequence,
              stroke: MATH_COLORS.white,
              strokeWidth: 1.5
            }
          ),
          showFullLabel && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: posAn.x,
              y: anLabelY,
              textAnchor: "middle",
              fontSize: fontScale(10),
              fill: MATH_COLORS.sequence,
              fontWeight: "500",
              children: [
                "a_",
                t.n,
                "=",
                t.an.toFixed(1)
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: posSn.x,
              cy: posSn.y,
              r: isMaxSn ? 6 : 4,
              fill: isMaxSn ? MATH_COLORS.sequenceHighlight : MATH_COLORS.sequenceSum,
              stroke: MATH_COLORS.white,
              strokeWidth: 1.5
            }
          ),
          showFullLabel && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: posSn.x,
              y: snLabelY,
              textAnchor: "middle",
              fontSize: fontScale(10),
              fill: isMaxSn ? MATH_COLORS.sequenceHighlight : MATH_COLORS.sequenceSum,
              fontWeight: isMaxSn ? "bold" : "normal",
              children: [
                "S_",
                t.n,
                "=",
                t.Sn.toFixed(1)
              ]
            }
          ),
          isMaxSn && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: posSn.x,
                cy: posSn.y,
                r: 10,
                fill: "none",
                stroke: MATH_COLORS.sequenceHighlight,
                strokeWidth: 1.5,
                strokeDasharray: "2,2"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: posSn.x,
                y1: posSn.y - 10,
                x2: posSn.x,
                y2: posSn.y - 25,
                stroke: MATH_COLORS.sequenceHighlight,
                strokeWidth: 1
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: posSn.x,
                y: posSn.y - 28,
                textAnchor: "middle",
                fontSize: fontScale(11),
                fill: MATH_COLORS.sequenceHighlight,
                fontWeight: "bold",
                children: [
                  "S_n极值项(n=",
                  t.n,
                  ")"
                ]
              }
            )
          ] })
        ] }, `pts-${t.n}`);
      })
    ] });
  }
  if (activeMode === "geometric") {
    const { terms, expFn, limitSum } = geoData;
    if (geometricViewType === "tessellation" && q > 0 && q < 1) {
      const centerPt = mathToDesign(0, 0, scale);
      const size = 280;
      const x0 = centerPt.x - size / 2;
      const y0 = centerPt.y - size / 2;
      const tessBlocks = [];
      let curX = x0;
      let curY = y0;
      let curW = size;
      let curH = size;
      const palette = [
        MATH_COLORS.sequence,
        MATH_COLORS.sequenceSecondary,
        MATH_COLORS.sequenceSum,
        MATH_COLORS.sequenceHighlight,
        MATH_COLORS.inequality
      ];
      let runningTerm = a1;
      for (let k = 1; k <= Math.min(N, 6); k++) {
        const color = palette[(k - 1) % palette.length];
        const valStr = runningTerm.toFixed(3);
        if (k % 2 === 1) {
          const w = curW * (1 - q);
          tessBlocks.push({
            x: curX,
            y: curY,
            w: Math.max(w, curW * 0.5),
            h: curH,
            label: `a_${k}=${valStr}`,
            val: runningTerm,
            color
          });
          curX += w;
          curW -= w;
        } else {
          const h = curH * (1 - q);
          tessBlocks.push({
            x: curX,
            y: curY,
            w: curW,
            h: Math.max(h, curH * 0.5),
            label: `a_${k}=${valStr}`,
            val: runningTerm,
            color
          });
          curY += h;
          curH -= h;
        }
        runningTerm *= q;
      }
      const limitText = limitSum !== null ? limitSum.toFixed(3) : "";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "sequence-scene-tessellation", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: x0,
            y: y0,
            width: size,
            height: size,
            fill: MATH_COLORS.white,
            stroke: MATH_COLORS.labelText,
            strokeWidth: 2
          }
        ),
        tessBlocks.map((b, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: b.x,
              y: b.y,
              width: b.w,
              height: b.h,
              fill: withAlpha(b.color, 0.25),
              stroke: b.color,
              strokeWidth: 1.5
            }
          ),
          b.w > 30 && b.h > 20 && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: b.x + b.w / 2,
              y: b.y + b.h / 2 + 4,
              textAnchor: "middle",
              fontSize: fontScale(10),
              fill: b.color,
              fontWeight: "bold",
              children: b.label
            }
          )
        ] }, `tess-${idx}`)),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: x0 + size / 2,
            y: y0 - 12,
            textAnchor: "middle",
            fontSize: fontScale(13),
            fill: MATH_COLORS.sequenceHighlight,
            fontWeight: "bold",
            children: [
              "正方形总面积 = S_∞ = a₁ / (1 - q) = ",
              limitText
            ]
          }
        )
      ] });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "sequence-scene-geometric", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
      expFn && /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: expFn,
          scale,
          color: MATH_COLORS.sequence,
          strokeWidth: 1.5,
          strokeDasharray: "4,4"
        }
      ),
      limitSum !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: mathToDesign(-1, limitSum, scale).x,
            y1: mathToDesign(0, limitSum, scale).y,
            x2: mathToDesign(N + 1, limitSum, scale).x,
            y2: mathToDesign(0, limitSum, scale).y,
            stroke: MATH_COLORS.sequenceHighlight,
            strokeWidth: 1.5,
            strokeDasharray: "5,3"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: mathToDesign(N + 0.5, limitSum, scale).x,
            y: mathToDesign(0, limitSum, scale).y - 6,
            textAnchor: "end",
            fontSize: fontScale(11),
            fill: MATH_COLORS.sequenceHighlight,
            fontWeight: "bold",
            children: [
              "极限 S_∞ = ",
              limitSum.toFixed(2)
            ]
          }
        )
      ] }),
      terms.map((t) => {
        const posAn = mathToDesign(t.n, t.an, scale);
        const posSn = mathToDesign(t.n, t.Sn, scale);
        const isHighlighted = t.n === highlightN;
        const showFullLabel = isHighlighted || t.n === 1 || t.n === N;
        const anLabelY = t.an >= 0 ? posAn.y - 8 : posAn.y + 14;
        const snTooClose = Math.abs(posAn.y - posSn.y) < 16;
        const snLabelY = snTooClose ? posSn.y + 16 : posSn.y - 8;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: posAn.x,
              y1: mathToDesign(t.n, 0, scale).y,
              x2: posAn.x,
              y2: posAn.y,
              stroke: MATH_COLORS.sequenceStem,
              strokeDasharray: "2,2"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: posAn.x,
              cy: posAn.y,
              r: 4.5,
              fill: MATH_COLORS.sequence,
              stroke: MATH_COLORS.white,
              strokeWidth: 1.5
            }
          ),
          showFullLabel && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: posAn.x,
              y: anLabelY,
              textAnchor: "middle",
              fontSize: fontScale(10),
              fill: MATH_COLORS.sequence,
              children: [
                "a_",
                t.n,
                "=",
                t.an.toFixed(2)
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: posSn.x,
              cy: posSn.y,
              r: 4.5,
              fill: MATH_COLORS.sequenceSum,
              stroke: MATH_COLORS.white,
              strokeWidth: 1.5
            }
          ),
          showFullLabel && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: posSn.x,
              y: snLabelY,
              textAnchor: "middle",
              fontSize: fontScale(10),
              fill: MATH_COLORS.sequenceSum,
              children: [
                "S_",
                t.n,
                "=",
                t.Sn.toFixed(2)
              ]
            }
          )
        ] }, `geopts-${t.n}`);
      })
    ] });
  }
  if (activeMode === "models") {
    if (modelType === "arith-geo") {
      const terms = arithGeoData.terms;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "sequence-scene-arith-geo", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
        terms.map((t) => {
          const ptTn = mathToDesign(t.n - 0.2, t.cn, scale);
          const ptZero = mathToDesign(t.n - 0.2, 0, scale);
          const w = 18;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: ptTn.x - w / 2,
                y: Math.min(ptTn.y, ptZero.y),
                width: w,
                height: Math.abs(ptTn.y - ptZero.y),
                fill: withAlpha(MATH_COLORS.sequence, 0.3),
                stroke: MATH_COLORS.sequence,
                strokeWidth: 1.5
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: ptTn.x,
                y: ptTn.y - 6,
                textAnchor: "middle",
                fontSize: fontScale(10),
                fill: MATH_COLORS.sequence,
                children: [
                  "c_",
                  t.n
                ]
              }
            ),
            t.n <= N - 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "line",
                {
                  x1: ptTn.x,
                  y1: ptTn.y,
                  x2: ptTn.x + 35,
                  y2: ptTn.y,
                  stroke: MATH_COLORS.sequenceHighlight,
                  strokeDasharray: "3,3",
                  strokeWidth: 1.5
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "circle",
                {
                  cx: ptTn.x + 35,
                  cy: ptTn.y,
                  r: 3,
                  fill: MATH_COLORS.sequenceHighlight
                }
              )
            ] })
          ] }, `ag-${t.n}`);
        })
      ] });
    }
    if (modelType === "telescoping") {
      const terms = telescopingData.terms;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "sequence-scene-telescoping", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
        terms.map((t) => {
          const posA = mathToDesign(t.n, t.partA, scale);
          const posB = mathToDesign(t.n + 0.35, -t.partB, scale);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: posA.x,
                cy: posA.y,
                r: 4,
                fill: MATH_COLORS.combHeader
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: posA.x,
                y: posA.y - 6,
                textAnchor: "middle",
                fontSize: fontScale(10),
                fill: MATH_COLORS.combHeader,
                fontWeight: "bold",
                children: [
                  "+",
                  t.partA.toFixed(2)
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: posB.x,
                cy: posB.y,
                r: 4,
                fill: MATH_COLORS.sequenceHighlight
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: posB.x,
                y: posB.y + 14,
                textAnchor: "middle",
                fontSize: fontScale(10),
                fill: MATH_COLORS.sequenceHighlight,
                fontWeight: "bold",
                children: [
                  "-",
                  t.partB.toFixed(2)
                ]
              }
            ),
            t.n < N && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "path",
              {
                d: `M ${posB.x} ${posB.y} Q ${(posB.x + posA.x + 40) / 2} ${(posB.y + posA.y) / 2 - 20} ${posA.x + 40} ${posA.y}`,
                fill: "none",
                stroke: MATH_COLORS.sequenceHighlight,
                strokeWidth: 1.5,
                strokeDasharray: "3,3"
              }
            )
          ] }, `tele-${t.n}`);
        })
      ] });
    }
    if (modelType === "cross-telescoping") {
      const terms = crossTelescopingData.terms;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "sequence-scene-cross-telescoping", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
        terms.map((t) => {
          const posA = mathToDesign(t.n, t.partA, scale);
          const posB = mathToDesign(t.n + 0.35, -t.partB, scale);
          const isRetainedA = t.n <= 2;
          const isRetainedB = t.n >= N - 1;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: posA.x,
                cy: posA.y,
                r: isRetainedA ? 6 : 4,
                fill: isRetainedA ? MATH_COLORS.sequenceHighlight : MATH_COLORS.combHeader
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: posA.x,
                y: posA.y - 6,
                textAnchor: "middle",
                fontSize: fontScale(10),
                fill: isRetainedA ? MATH_COLORS.sequenceHighlight : MATH_COLORS.combHeader,
                fontWeight: isRetainedA ? "bold" : "normal",
                children: [
                  "+",
                  t.partA.toFixed(2)
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: posB.x,
                cy: posB.y,
                r: isRetainedB ? 6 : 4,
                fill: isRetainedB ? MATH_COLORS.sequenceHighlight : MATH_COLORS.sequenceHighlight
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: posB.x,
                y: posB.y + 14,
                textAnchor: "middle",
                fontSize: fontScale(10),
                fill: MATH_COLORS.sequenceHighlight,
                fontWeight: isRetainedB ? "bold" : "normal",
                children: [
                  "-",
                  t.partB.toFixed(2)
                ]
              }
            ),
            t.n <= N - 2 && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "path",
              {
                d: `M ${posB.x} ${posB.y} Q ${(posB.x + posA.x + 80) / 2} ${(posB.y + posA.y) / 2 - 25} ${posA.x + 80} ${posA.y}`,
                fill: "none",
                stroke: MATH_COLORS.sequenceHighlight,
                strokeWidth: 1.5,
                strokeDasharray: "4,4"
              }
            )
          ] }, `c-tele-${t.n}`);
        })
      ] });
    }
    if (modelType === "grouped") {
      const terms = groupedData.terms;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "sequence-scene-grouped", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
        terms.map((t) => {
          const ptAn = mathToDesign(t.n - 0.25, t.an, scale);
          const ptCn = mathToDesign(t.n - 0.25, t.cn, scale);
          const ptZero = mathToDesign(t.n - 0.25, 0, scale);
          const w = 22;
          const hAn = Math.abs(ptAn.y - ptZero.y);
          const hBn = Math.abs(ptCn.y - ptAn.y);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: ptAn.x - w / 2,
                y: Math.min(ptAn.y, ptZero.y),
                width: w,
                height: hAn,
                fill: withAlpha(MATH_COLORS.sequence, 0.35),
                stroke: MATH_COLORS.sequence,
                strokeWidth: 1.5
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: ptCn.x - w / 2,
                y: Math.min(ptCn.y, ptAn.y),
                width: w,
                height: hBn,
                fill: withAlpha(MATH_COLORS.sequenceSecondary, 0.45),
                stroke: MATH_COLORS.sequenceSecondary,
                strokeWidth: 1.5
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: ptCn.x,
                y: ptCn.y - 6,
                textAnchor: "middle",
                fontSize: fontScale(10),
                fill: MATH_COLORS.sequenceSum,
                fontWeight: "bold",
                children: [
                  "c_",
                  t.n,
                  "=",
                  t.cn.toFixed(1)
                ]
              }
            )
          ] }, `grp-${t.n}`);
        })
      ] });
    }
    if (modelType === "odd-even") {
      const terms = oddEvenData.terms;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "sequence-scene-odd-even", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
        terms.map((t) => {
          const ptCn = mathToDesign(t.n, t.cn, scale);
          const ptZero = mathToDesign(t.n, 0, scale);
          const isEven = t.n % 2 === 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: ptCn.x,
                y1: ptZero.y,
                x2: ptCn.x,
                y2: ptCn.y,
                stroke: isEven ? MATH_COLORS.combHeader : MATH_COLORS.sequenceHighlight,
                strokeWidth: 2
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: ptCn.x,
                cy: ptCn.y,
                r: 5,
                fill: isEven ? MATH_COLORS.combHeader : MATH_COLORS.sequenceHighlight
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: ptCn.x,
                y: ptCn.y + (isEven ? -8 : 14),
                textAnchor: "middle",
                fontSize: fontScale(10),
                fill: isEven ? MATH_COLORS.combHeader : MATH_COLORS.sequenceHighlight,
                fontWeight: "bold",
                children: [
                  "c_",
                  t.n,
                  "=",
                  t.cn
                ]
              }
            ),
            isEven && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "rect",
                {
                  x: mathToDesign(t.n - 1, 0, scale).x - 14,
                  y: mathToDesign(0, t.n + 1, scale).y,
                  width: mathToDesign(t.n, 0, scale).x - mathToDesign(t.n - 1, 0, scale).x + 28,
                  height: Math.abs(
                    mathToDesign(0, -(t.n + 1), scale).y - mathToDesign(0, t.n + 1, scale).y
                  ),
                  fill: withAlpha(MATH_COLORS.sequenceSum, 0.1),
                  stroke: MATH_COLORS.sequenceSum,
                  strokeDasharray: "3,3",
                  rx: 6
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "text",
                {
                  x: (mathToDesign(t.n - 1, 0, scale).x + mathToDesign(t.n, 0, scale).x) / 2,
                  y: mathToDesign(0, -(t.n + 1), scale).y + 16,
                  textAnchor: "middle",
                  fontSize: fontScale(10),
                  fill: MATH_COLORS.sequenceSum,
                  fontWeight: "bold",
                  children: "和 = 1"
                }
              )
            ] })
          ] }, `oe-${t.n}`);
        })
      ] });
    }
  }
  if (activeMode === "recurrence") {
    if (recurrenceModelType === "linear-pan") {
      const { terms, fixedPoint, cobwebPoints } = linearRecData;
      const fnLine = (x) => p_rec * x + q_rec;
      const diagLine = (x) => x;
      let cobwebPathStr = "";
      cobwebPoints.forEach((pt, idx) => {
        const dPt = mathToDesign(pt.x, pt.y, scale);
        if (idx === 0) {
          cobwebPathStr += `M ${dPt.x} ${dPt.y}`;
        } else {
          cobwebPathStr += ` L ${dPt.x} ${dPt.y}`;
        }
      });
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "sequence-scene-linear-pan", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FunctionGraph,
          {
            fn: fnLine,
            scale,
            color: MATH_COLORS.sequence,
            strokeWidth: 1.5,
            strokeDasharray: "4,4"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FunctionGraph,
          {
            fn: diagLine,
            scale,
            color: MATH_COLORS.labelText,
            strokeWidth: 1,
            strokeDasharray: "3,3"
          }
        ),
        fixedPoint !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: mathToDesign(fixedPoint, fixedPoint, scale).x,
              cy: mathToDesign(fixedPoint, fixedPoint, scale).y,
              r: 6,
              fill: MATH_COLORS.sequenceHighlight,
              stroke: MATH_COLORS.white,
              strokeWidth: 2
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: mathToDesign(fixedPoint, fixedPoint, scale).x + 10,
              y: mathToDesign(fixedPoint, fixedPoint, scale).y - 10,
              fontSize: fontScale(11),
              fill: MATH_COLORS.sequenceHighlight,
              fontWeight: "bold",
              children: [
                "不动点 c=",
                fixedPoint.toFixed(2)
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            d: cobwebPathStr,
            fill: "none",
            stroke: MATH_COLORS.sequenceHighlight,
            strokeWidth: 1.5,
            strokeDasharray: "2,2"
          }
        ),
        terms.map((t) => {
          const posAn = mathToDesign(t.n, t.an, scale);
          const posBn = mathToDesign(t.n, t.bn, scale);
          const isHighlighted = t.n === highlightN;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: posAn.x,
                y1: mathToDesign(t.n, 0, scale).y,
                x2: posAn.x,
                y2: posAn.y,
                stroke: MATH_COLORS.sequenceStem,
                strokeDasharray: "2,2"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: posAn.x,
                cy: posAn.y,
                r: isHighlighted ? 6 : 4,
                fill: MATH_COLORS.sequence,
                stroke: MATH_COLORS.white,
                strokeWidth: 1.5
              }
            ),
            (t.n === 1 || t.n === N || isHighlighted) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: posAn.x,
                y: posAn.y - 8,
                textAnchor: "middle",
                fontSize: fontScale(10),
                fill: MATH_COLORS.sequence,
                fontWeight: "bold",
                children: [
                  "a_",
                  t.n,
                  "=",
                  t.an.toFixed(1)
                ]
              }
            ),
            fixedPoint !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "circle",
                {
                  cx: posBn.x,
                  cy: posBn.y,
                  r: 4,
                  fill: MATH_COLORS.paramSecondary,
                  stroke: MATH_COLORS.white,
                  strokeWidth: 1
                }
              ),
              (t.n === 1 || t.n === N || isHighlighted) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "text",
                {
                  x: posBn.x,
                  y: posBn.y + 14,
                  textAnchor: "middle",
                  fontSize: fontScale(10),
                  fill: MATH_COLORS.paramSecondary,
                  children: [
                    "b_",
                    t.n,
                    "=",
                    t.bn.toFixed(1)
                  ]
                }
              )
            ] })
          ] }, `lin-rec-${t.n}`);
        })
      ] });
    }
    if (recurrenceModelType === "accumulation") {
      const terms = accumRecData.terms;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "sequence-scene-accumulation", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
        terms.map((t) => {
          const posAn = mathToDesign(t.n, t.an, scale);
          const isHighlighted = t.n === highlightN;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: posAn.x,
                y1: mathToDesign(t.n, 0, scale).y,
                x2: posAn.x,
                y2: posAn.y,
                stroke: MATH_COLORS.sequenceStem,
                strokeDasharray: "2,2"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: posAn.x,
                cy: posAn.y,
                r: isHighlighted ? 6 : 4.5,
                fill: MATH_COLORS.sequence,
                stroke: MATH_COLORS.white,
                strokeWidth: 1.5
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: posAn.x,
                y: posAn.y - 8,
                textAnchor: "middle",
                fontSize: fontScale(10),
                fill: MATH_COLORS.sequence,
                fontWeight: "bold",
                children: [
                  "a_",
                  t.n,
                  "=",
                  t.an.toFixed(1)
                ]
              }
            )
          ] }, `accum-${t.n}`);
        })
      ] });
    }
    if (recurrenceModelType === "multiplication") {
      const terms = multRecData.terms;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "sequence-scene-multiplication", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
        terms.map((t) => {
          const posAn = mathToDesign(t.n, t.an, scale);
          const isHighlighted = t.n === highlightN;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: posAn.x,
                y1: mathToDesign(t.n, 0, scale).y,
                x2: posAn.x,
                y2: posAn.y,
                stroke: MATH_COLORS.sequenceStem,
                strokeDasharray: "2,2"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: posAn.x,
                cy: posAn.y,
                r: isHighlighted ? 6 : 4.5,
                fill: MATH_COLORS.sequence,
                stroke: MATH_COLORS.white,
                strokeWidth: 1.5
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: posAn.x,
                y: posAn.y - 8,
                textAnchor: "middle",
                fontSize: fontScale(10),
                fill: MATH_COLORS.sequence,
                fontWeight: "bold",
                children: [
                  "a_",
                  t.n,
                  "=",
                  t.an.toFixed(3)
                ]
              }
            )
          ] }, `mult-${t.n}`);
        })
      ] });
    }
    if (recurrenceModelType === "reciprocal") {
      const terms = recipRecData.terms;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "sequence-scene-reciprocal", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
        terms.map((t) => {
          const posAn = mathToDesign(t.n, t.an, scale);
          const posBn = Number.isNaN(t.bn) ? null : mathToDesign(t.n, t.bn, scale);
          const isHighlighted = t.n === highlightN;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
            !Number.isNaN(t.an) && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "circle",
                {
                  cx: posAn.x,
                  cy: posAn.y,
                  r: isHighlighted ? 6 : 4.5,
                  fill: MATH_COLORS.sequence,
                  stroke: MATH_COLORS.white,
                  strokeWidth: 1.5
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "text",
                {
                  x: posAn.x,
                  y: posAn.y - 8,
                  textAnchor: "middle",
                  fontSize: fontScale(10),
                  fill: MATH_COLORS.sequence,
                  fontWeight: "bold",
                  children: [
                    "a_",
                    t.n,
                    "=",
                    t.an.toFixed(2)
                  ]
                }
              )
            ] }),
            posBn && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "circle",
                {
                  cx: posBn.x,
                  cy: posBn.y,
                  r: 4.5,
                  fill: MATH_COLORS.paramSecondary,
                  stroke: MATH_COLORS.white,
                  strokeWidth: 1.5
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "text",
                {
                  x: posBn.x,
                  y: posBn.y + 14,
                  textAnchor: "middle",
                  fontSize: fontScale(10),
                  fill: MATH_COLORS.paramSecondary,
                  children: [
                    "b_",
                    t.n,
                    "=",
                    t.bn.toFixed(2)
                  ]
                }
              )
            ] })
          ] }, `recip-${t.n}`);
        })
      ] });
    }
    if (recurrenceModelType === "second-order") {
      const terms = secondRecData.terms;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "sequence-scene-second-order", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
        terms.map((t) => {
          const posAn = mathToDesign(t.n, t.an, scale);
          const isHighlighted = t.n === highlightN;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: posAn.x,
                y1: mathToDesign(t.n, 0, scale).y,
                x2: posAn.x,
                y2: posAn.y,
                stroke: MATH_COLORS.sequenceStem,
                strokeDasharray: "2,2"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: posAn.x,
                cy: posAn.y,
                r: isHighlighted ? 6 : 4.5,
                fill: MATH_COLORS.sequence,
                stroke: MATH_COLORS.white,
                strokeWidth: 1.5
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: posAn.x,
                y: posAn.y - 8,
                textAnchor: "middle",
                fontSize: fontScale(10),
                fill: MATH_COLORS.sequence,
                fontWeight: "bold",
                children: [
                  "a_",
                  t.n,
                  "=",
                  t.an.toFixed(1)
                ]
              }
            )
          ] }, `sec-order-${t.n}`);
        })
      ] });
    }
  }
  return null;
}
const defaultParams = {
  a1: 3,
  d: -1,
  q: 0.5,
  N: 8,
  p_rec: 2,
  q_rec: 1,
  a2: 2,
  coefA: 2,
  coefB: 1,
  coefC: 1
};
const paramMeta = {
  a1: {
    key: "a1",
    label: "首项 a₁",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a_1}`,
    defaultValue: 3,
    min: -5,
    max: 10,
    step: 0.5,
    description: "数列首项值",
    importance: "core",
    marks: [{ value: 0, label: "0", labelFormula: "0" }]
  },
  d: {
    key: "d",
    label: "公差 d",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{d}`,
    defaultValue: -1,
    min: -4,
    max: 4,
    step: 0.5,
    description: "等差数列公差 d（对应通项直线斜率与求和抛物线二次项系数）",
    importance: "core",
    marks: [
      {
        value: 0,
        label: "常数列 (d=0)",
        labelFormula: "\\color{#DC2626}{d=0}"
      }
    ]
  },
  q: {
    key: "q",
    label: "公比 q",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{q}`,
    defaultValue: 0.5,
    min: -2,
    max: 2,
    step: 0.1,
    description: "等比数列公比 q（决定指数增长、衰减或符号交替震荡）",
    importance: "core",
    marks: [
      { value: -1, label: "-1", labelFormula: "-1" },
      { value: 0, label: "0", labelFormula: "\\color{#DC2626}{q=0}" },
      { value: 0.5, label: "1/2", labelFormula: "1/2" },
      { value: 1, label: "1", labelFormula: "\\color{#DC2626}{q=1}" }
    ]
  },
  N: {
    key: "N",
    label: "展示项数 N",
    labelFormula: "N",
    defaultValue: 8,
    min: 3,
    max: 15,
    step: 1,
    description: "数列展现的前 N 项数量",
    descriptionFormula: "可视化前 N 项",
    importance: "advanced"
  },
  p_rec: {
    key: "p_rec",
    label: "递推系数 p",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{p}`,
    defaultValue: 2,
    min: -3,
    max: 3,
    step: 0.5,
    description: "递推关系式 a_{n+1} = p * a_n + q 中的系数 p",
    importance: "core",
    marks: [
      { value: 1, label: "等差 (p=1)", labelFormula: "\\color{#DC2626}{p=1}" },
      { value: -1, label: "-1", labelFormula: "-1" }
    ]
  },
  q_rec: {
    key: "q_rec",
    label: "递推常数 q",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{q}`,
    defaultValue: 1,
    min: -5,
    max: 5,
    step: 1,
    description: "递推关系式 a_{n+1} = p * a_n + q 中的常数项 q",
    importance: "core",
    marks: [{ value: 0, label: "纯等比 (q=0)", labelFormula: "q=0" }]
  },
  a2: {
    key: "a2",
    label: "第二项 a₂",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{a_2}`,
    defaultValue: 2,
    min: -5,
    max: 10,
    step: 1,
    description: "二阶递推数列第二项 a_2",
    importance: "core"
  },
  coefA: {
    key: "coefA",
    label: "分子系数 A",
    labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{A}`,
    defaultValue: 2,
    min: 0.5,
    max: 5,
    step: 0.5,
    description: "分式递推 a_{n+1} = A*a_n / (B*a_n + C) 的分子系数 A",
    importance: "core"
  },
  coefB: {
    key: "coefB",
    label: "分母二次项 B",
    labelFormula: `\\color{${MATH_COLORS.paramSecondary}}{B}`,
    defaultValue: 1,
    min: -3,
    max: 3,
    step: 0.5,
    description: "分式递推 a_{n+1} = A*a_n / (B*a_n + C) 的分母系数 B",
    importance: "core",
    marks: [{ value: 0, label: "纯比例 (B=0)", labelFormula: "B=0" }]
  },
  coefC: {
    key: "coefC",
    label: "分母常数 C",
    labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{C}`,
    defaultValue: 1,
    min: 0.5,
    max: 5,
    step: 0.5,
    description: "分式递推 a_{n+1} = A*a_n / (B*a_n + C) 的分母常数 C",
    importance: "core"
  }
};
export {
  SequenceScene as S,
  defaultParams as d,
  paramMeta as p
};
