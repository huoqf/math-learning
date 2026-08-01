import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { C as CoordinateGrid } from "./CoordinateGrid-BmMyIyOq.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { b as MATH_COLORS, w as withAlpha, c as CANVAS_COLORS } from "./probabilityBayes-BWtGIkMp.js";
import { I as InteractivePoint } from "./InteractivePoint-ZTf14j6W.js";
import { a3 as calculateLinearRegression, a5 as calculateIndependenceTest } from "./mathQuantities-CSLRzday.js";
const PairedDataScene = ({
  studyMode,
  points,
  onPointsChange,
  freqA,
  freqB,
  freqC,
  freqD,
  presetXName,
  presetYName,
  scale,
  vp,
  fontScale,
  xStep = 1,
  yStep = 1
}) => {
  const regResult = reactExports.useMemo(() => {
    return calculateLinearRegression(points);
  }, [points]);
  const indResult = reactExports.useMemo(() => {
    return calculateIndependenceTest(freqA, freqB, freqC, freqD);
  }, [freqA, freqB, freqC, freqD]);
  const handlePointDrag = (id, newMathPos) => {
    const updated = points.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          x: Number(newMathPos.x.toFixed(2)),
          y: Number(newMathPos.y.toFixed(2))
        };
      }
      return p;
    });
    onPointsChange(updated);
  };
  if (studyMode === "regression") {
    const xMin = -10;
    const xMax = 40;
    const lineStart = mathToDesign(
      xMin,
      regResult.b * xMin + regResult.a,
      scale
    );
    const lineEnd = mathToDesign(xMax, regResult.b * xMax + regResult.a, scale);
    const centerPos = mathToDesign(regResult.meanX, regResult.meanY, scale);
    const centerAxisX = mathToDesign(regResult.meanX, 0, scale);
    const centerAxisY = mathToDesign(0, regResult.meanY, scale);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "paired-data-scene-regression", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        CoordinateGrid,
        {
          scale,
          fontScale,
          xStep,
          yStep
        }
      ),
      regResult.isValid && points.map((p) => {
        const yHat = regResult.b * p.x + regResult.a;
        const ptDesign = mathToDesign(p.x, p.y, scale);
        const hatDesign = mathToDesign(p.x, yHat, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsx("g", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: ptDesign.x,
            y1: ptDesign.y,
            x2: hatDesign.x,
            y2: hatDesign.y,
            stroke: MATH_COLORS.tangentLine,
            strokeDasharray: "3 3",
            strokeWidth: 1.5,
            opacity: 0.7
          }
        ) }, `res-${p.id}`);
      }),
      regResult.isValid && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: lineStart.x,
          y1: lineStart.y,
          x2: lineEnd.x,
          y2: lineEnd.y,
          stroke: MATH_COLORS.function,
          strokeWidth: 2.5
        }
      ),
      regResult.isValid && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { className: "center-point-group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: centerPos.x,
            y1: centerPos.y,
            x2: centerAxisX.x,
            y2: centerAxisX.y,
            stroke: MATH_COLORS.paramPrimary,
            strokeDasharray: "4 4",
            strokeWidth: 1.2
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: centerPos.x,
            y1: centerPos.y,
            x2: centerAxisY.x,
            y2: centerAxisY.y,
            stroke: MATH_COLORS.paramPrimary,
            strokeDasharray: "4 4",
            strokeWidth: 1.2
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: centerPos.x,
            cy: centerPos.y,
            r: 9,
            fill: withAlpha(MATH_COLORS.paramPrimary, 0.2),
            stroke: MATH_COLORS.paramPrimary,
            strokeWidth: 1.5
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: centerPos.x,
            cy: centerPos.y,
            r: 4,
            fill: MATH_COLORS.paramPrimary
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: centerPos.x + 12,
            y: centerPos.y - 12,
            fill: MATH_COLORS.paramPrimary,
            fontSize: fontScale(13),
            fontWeight: "bold",
            children: [
              "样本中心点 (",
              regResult.meanX.toFixed(1),
              ",",
              " ",
              regResult.meanY.toFixed(1),
              ")"
            ]
          }
        )
      ] }),
      points.map((p, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: p.x,
          cy: p.y,
          scale,
          vp,
          color: MATH_COLORS.paramSecondary,
          r: 7,
          label: `P${idx + 1}(${p.x}, ${p.y})`,
          fontScale,
          onDrag: (newPos) => handlePointDrag(p.id, newPos)
        },
        p.id
      )),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(40, 40)", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: 0,
            y: 0,
            width: 260,
            height: 56,
            rx: 6,
            fill: CANVAS_COLORS.white,
            fillOpacity: 0.9,
            stroke: CANVAS_COLORS.axis,
            strokeWidth: 1
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: 15,
            y1: 20,
            x2: 45,
            y2: 20,
            stroke: MATH_COLORS.function,
            strokeWidth: 2.5
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: 55,
            y: 24,
            fill: MATH_COLORS.function,
            fontSize: fontScale(12),
            fontWeight: "bold",
            children: [
              "回归: ŷ=",
              regResult.b.toFixed(2),
              "x",
              regResult.a >= 0 ? "+" : "",
              regResult.a.toFixed(2)
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: 15,
            y1: 38,
            x2: 45,
            y2: 38,
            stroke: MATH_COLORS.tangentLine,
            strokeDasharray: "3 3",
            strokeWidth: 1.5
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: 55,
            y: 42,
            fill: MATH_COLORS.tangentLine,
            fontSize: fontScale(11),
            children: "残差垂线 (可拖拽散点观察变化)"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: 780,
          y: 630,
          fontSize: fontScale(12),
          fill: CANVAS_COLORS.labelText,
          fontWeight: "bold",
          children: presetXName
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: 30,
          y: 30,
          fontSize: fontScale(12),
          fill: CANVAS_COLORS.labelText,
          fontWeight: "bold",
          children: presetYName
        }
      )
    ] });
  }
  const row1Total = freqA + freqB;
  const row2Total = freqC + freqD;
  const ratioA_B = row1Total > 0 ? freqA / row1Total : 0;
  const ratioA_NotB = row1Total > 0 ? freqB / row1Total : 0;
  const ratioNotA_B = row2Total > 0 ? freqC / row2Total : 0;
  const ratioNotA_NotB = row2Total > 0 ? freqD / row2Total : 0;
  const axisY = 480;
  const axisStartX = 100;
  const axisEndX = 740;
  const axisWidth = axisEndX - axisStartX;
  const maxChi = 15;
  const getChiX = (val) => {
    const clamped = Math.min(maxChi, Math.max(0, val));
    return axisStartX + clamped / maxChi * axisWidth;
  };
  const currChiX = getChiX(indResult.chiSquare);
  const offsetDown = 50;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "g",
    {
      className: "paired-data-scene-independence",
      transform: `translate(0, ${offsetDown})`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: 20,
            y: 20,
            width: 800,
            height: 580,
            rx: 12,
            fill: CANVAS_COLORS.gridSubtle,
            stroke: CANVAS_COLORS.grid,
            strokeWidth: 1
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: 400,
            y: 50,
            textAnchor: "middle",
            fontSize: fontScale(18),
            fontWeight: "bold",
            fill: CANVAS_COLORS.labelText,
            children: "2 × 2 列联表条件频率分布与卡方检验"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(140, 90)", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: 0,
              y: -10,
              fontSize: fontScale(14),
              fontWeight: "bold",
              fill: MATH_COLORS.paramPrimary,
              children: "【分类条件频率对比】"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(60, 20)", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: 60,
                y: -10,
                textAnchor: "middle",
                fontSize: fontScale(13),
                fontWeight: "bold",
                fill: CANVAS_COLORS.labelTextLight,
                children: [
                  "类 A 样本 (共 ",
                  row1Total,
                  " 人)"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: 0,
                y: 0,
                width: 120,
                height: 200 * ratioA_B,
                fill: MATH_COLORS.paramPrimary,
                rx: 4,
                opacity: 0.85
              }
            ),
            ratioA_B > 0.08 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: 60,
                y: 100 * ratioA_B + 5,
                textAnchor: "middle",
                fill: CANVAS_COLORS.white,
                fontSize: fontScale(12),
                fontWeight: "bold",
                children: [
                  "B (",
                  freqA,
                  "人, ",
                  (ratioA_B * 100).toFixed(1),
                  "%)"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: 0,
                y: 200 * ratioA_B,
                width: 120,
                height: 200 * ratioA_NotB,
                fill: withAlpha(MATH_COLORS.paramPrimary, 0.4),
                rx: 4
              }
            ),
            ratioA_NotB > 0.08 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: 60,
                y: 200 * ratioA_B + 100 * ratioA_NotB + 5,
                textAnchor: "middle",
                fill: CANVAS_COLORS.labelText,
                fontSize: fontScale(12),
                fontWeight: "bold",
                children: [
                  "非B (",
                  freqB,
                  "人, ",
                  (ratioA_NotB * 100).toFixed(1),
                  "%)"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(320, 20)", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: 60,
                y: -10,
                textAnchor: "middle",
                fontSize: fontScale(13),
                fontWeight: "bold",
                fill: CANVAS_COLORS.labelTextLight,
                children: [
                  "类 非A 样本 (共 ",
                  row2Total,
                  " 人)"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: 0,
                y: 0,
                width: 120,
                height: 200 * ratioNotA_B,
                fill: MATH_COLORS.paramSecondary,
                rx: 4,
                opacity: 0.85
              }
            ),
            ratioNotA_B > 0.08 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: 60,
                y: 100 * ratioNotA_B + 5,
                textAnchor: "middle",
                fill: CANVAS_COLORS.white,
                fontSize: fontScale(12),
                fontWeight: "bold",
                children: [
                  "B (",
                  freqC,
                  "人, ",
                  (ratioNotA_B * 100).toFixed(1),
                  "%)"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: 0,
                y: 200 * ratioNotA_B,
                width: 120,
                height: 200 * ratioNotA_NotB,
                fill: withAlpha(MATH_COLORS.paramSecondary, 0.4),
                rx: 4
              }
            ),
            ratioNotA_NotB > 0.08 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: 60,
                y: 200 * ratioNotA_B + 100 * ratioNotA_NotB + 5,
                textAnchor: "middle",
                fill: CANVAS_COLORS.labelText,
                fontSize: fontScale(12),
                fontWeight: "bold",
                children: [
                  "非B (",
                  freqD,
                  "人, ",
                  (ratioNotA_NotB * 100).toFixed(1),
                  "%)"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(0, 0)", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: axisStartX,
              y: axisY - 45,
              fontSize: fontScale(14),
              fontWeight: "bold",
              fill: CANVAS_COLORS.labelText,
              children: "【χ² 卡方检验统计量数轴与高考临界值标尺】"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: getChiX(3.841),
              y: axisY - 20,
              width: axisEndX - getChiX(3.841),
              height: 40,
              fill: withAlpha(MATH_COLORS.paramTertiary, 0.15),
              rx: 4
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: axisEndX - 10,
              y: axisY - 25,
              textAnchor: "end",
              fill: MATH_COLORS.paramTertiary,
              fontSize: fontScale(11),
              fontWeight: "bold",
              children: "拒绝 H₀ 区域 (95% 把握以上关联)"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: axisStartX,
              y1: axisY,
              x2: axisEndX,
              y2: axisY,
              stroke: CANVAS_COLORS.labelTextLight,
              strokeWidth: 3
            }
          ),
          [
            { val: 0, label: "0" },
            { val: 2.706, label: "2.706 (90%)" },
            { val: 3.841, label: "3.841 (95%)" },
            { val: 6.635, label: "6.635 (99%)" },
            { val: 10.828, label: "10.828 (99.9%)" }
          ].map((tick) => {
            const tx = getChiX(tick.val);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "line",
                {
                  x1: tx,
                  y1: axisY - 8,
                  x2: tx,
                  y2: axisY + 8,
                  stroke: CANVAS_COLORS.labelText,
                  strokeWidth: 2
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "text",
                {
                  x: tx,
                  y: axisY + 24,
                  textAnchor: "middle",
                  fontSize: fontScale(11),
                  fontWeight: tick.val === 3.841 || tick.val === 6.635 ? "bold" : "normal",
                  fill: tick.val === 3.841 || tick.val === 6.635 ? MATH_COLORS.paramPrimary : CANVAS_COLORS.labelTextLight,
                  children: tick.label
                }
              )
            ] }, `tick-${tick.val}`);
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: `translate(${currChiX}, ${axisY})`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "polygon",
              {
                points: "0,-12 -8,-24 8,-24",
                fill: MATH_COLORS.paramPrimary
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: 0,
                y1: -24,
                x2: 0,
                y2: -45,
                stroke: MATH_COLORS.paramPrimary,
                strokeWidth: 2,
                strokeDasharray: "2 2"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: -60,
                y: -70,
                width: 120,
                height: 24,
                rx: 12,
                fill: MATH_COLORS.paramPrimary
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: 0,
                y: -54,
                textAnchor: "middle",
                fill: CANVAS_COLORS.white,
                fontSize: fontScale(12),
                fontWeight: "bold",
                children: [
                  "χ² = ",
                  indResult.chiSquare.toFixed(3)
                ]
              }
            )
          ] })
        ] })
      ]
    }
  );
};
const defaultParams = {
  // 回归预设索引
  presetIndex: 0,
  // 噪声强度
  noise: 0,
  // 独立性检验 2x2 频数
  freqA: 85,
  // a: A 且 B
  freqB: 15,
  // b: A 且 非B
  freqC: 40,
  // c: 非A 且 B
  freqD: 60
  // d: 非A 且 非B
};
const paramMeta = {
  noise: {
    key: "noise",
    label: "噪声强度",
    labelFormula: "\\sigma",
    defaultValue: 0,
    min: 0,
    max: 3,
    step: 0.2,
    description: "对回归散点加入正态随机波动",
    descriptionFormula: "y_i \\to y_i + \\epsilon_i",
    importance: "core"
  },
  freqA: {
    key: "freqA",
    label: "a (A且B)",
    labelFormula: "a",
    defaultValue: 85,
    min: 0,
    max: 200,
    step: 5,
    description: "满足 A 且满足 B 的样本频数",
    descriptionFormula: "n_{11} = a",
    importance: "core",
    marks: [{ value: 0, label: "0", labelFormula: "0" }]
  },
  freqB: {
    key: "freqB",
    label: "b (A且非B)",
    labelFormula: "b",
    defaultValue: 15,
    min: 0,
    max: 200,
    step: 5,
    description: "满足 A 但不满足 B 的样本频数",
    descriptionFormula: "n_{12} = b",
    importance: "core",
    marks: [{ value: 0, label: "0", labelFormula: "0" }]
  },
  freqC: {
    key: "freqC",
    label: "c (非A且B)",
    labelFormula: "c",
    defaultValue: 40,
    min: 0,
    max: 200,
    step: 5,
    description: "不满足 A 但满足 B 的样本频数",
    descriptionFormula: "n_{21} = c",
    importance: "core",
    marks: [{ value: 0, label: "0", labelFormula: "0" }]
  },
  freqD: {
    key: "freqD",
    label: "d (非A且非B)",
    labelFormula: "d",
    defaultValue: 60,
    min: 0,
    max: 200,
    step: 5,
    description: "既不满足 A 也不满足 B 的样本频数",
    descriptionFormula: "n_{22} = d",
    importance: "core",
    marks: [{ value: 0, label: "0", labelFormula: "0" }]
  }
};
export {
  PairedDataScene as P,
  defaultParams as d,
  paramMeta as p
};
