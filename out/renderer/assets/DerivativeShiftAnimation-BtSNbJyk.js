import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { b as MATH_COLORS, w as withAlpha, c as CANVAS_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { T as TabSwitcher } from "./TabSwitcher-BlfhUjmU.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import { C as CoordinateGrid } from "./CoordinateGrid-BmMyIyOq.js";
import { F as FunctionGraph } from "./FunctionGraph-DoU6C8dJ.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { I as InteractivePoint } from "./InteractivePoint-ZTf14j6W.js";
import { I as IntervalShadow } from "./IntervalShadow--pOvsarb.js";
import { A as Asymptote } from "./Asymptote-CeJ5uPCO.js";
import { O as solveImplicitZero, Q as solveExtremumShift, R as solveLogMean, b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import "./useRadioGroup-jCNJTR-s.js";
function DerivativeShiftScene({
  params,
  scale,
  vp,
  activeMode,
  subModel,
  onParamChange,
  fontScale = (v) => v
}) {
  const a = params.a ?? 1.5;
  const k = params.k ?? 0.25;
  const x1Param = params.x1 ?? 0.3;
  const x2Param = params.x2 ?? 3.5;
  const izResult = reactExports.useMemo(
    () => solveImplicitZero(a, subModel),
    [a, subModel]
  );
  const shiftResult = reactExports.useMemo(
    () => solveExtremumShift(k, subModel),
    [k, subModel]
  );
  const logMeanResult = reactExports.useMemo(
    () => solveLogMean(x1Param, x2Param),
    [x1Param, x2Param]
  );
  const zeroPt = reactExports.useMemo(
    () => mathToDesign(izResult.x0, izResult.y0, scale),
    [izResult, scale]
  );
  const zeroFootPt = reactExports.useMemo(
    () => mathToDesign(izResult.x0, 0, scale),
    [izResult, scale]
  );
  const tracePt = reactExports.useMemo(
    () => mathToDesign(izResult.x0, izResult.traceY, scale),
    [izResult, scale]
  );
  const x1Pt = reactExports.useMemo(
    () => mathToDesign(shiftResult.x1, shiftResult.k, scale),
    [shiftResult, scale]
  );
  const x2Pt = reactExports.useMemo(
    () => mathToDesign(shiftResult.x2, shiftResult.k, scale),
    [shiftResult, scale]
  );
  const midPt = reactExports.useMemo(
    () => mathToDesign(shiftResult.midX, shiftResult.k, scale),
    [shiftResult, scale]
  );
  const mirrorPtAtX1 = reactExports.useMemo(
    () => mathToDesign(
      2 * shiftResult.x0 - shiftResult.x1,
      shiftResult.fn(2 * shiftResult.x0 - shiftResult.x1),
      scale
    ),
    [shiftResult, scale]
  );
  const handleDragX0 = (mathPt) => {
    const newX0 = Math.max(0.1, mathPt.x);
    if (subModel === "x_ln_x") {
      const newA = Math.log(newX0) + 1;
      onParamChange("a", Math.round(newA * 20) / 20);
    } else {
      const newA = Math.exp(newX0);
      onParamChange("a", Math.round(newA * 20) / 20);
    }
  };
  const handleDragSecant = (mathPt) => {
    const newK = Math.min(Math.max(0.02, mathPt.y), shiftResult.y0 - 5e-3);
    onParamChange("k", Math.round(newK * 100) / 100);
  };
  const handleDragLogMeanX1 = (mathPt) => {
    const newX1 = Math.min(Math.max(0.1, mathPt.x), x2Param - 0.2);
    onParamChange("x1", Math.round(newX1 * 20) / 20);
  };
  const handleDragLogMeanX2 = (mathPt) => {
    const newX2 = Math.max(x1Param + 0.2, mathPt.x);
    onParamChange("x2", Math.round(newX2 * 10) / 10);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    activeMode === "implicit_zero" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: izResult.fn,
          scale,
          color: MATH_COLORS.function,
          strokeWidth: 2.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: izResult.dfn,
          scale,
          color: MATH_COLORS.derivative,
          strokeWidth: 1.8,
          strokeDasharray: "4 3"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: izResult.traceFn,
          scale,
          color: MATH_COLORS.trace,
          strokeWidth: 2,
          strokeDasharray: "6 4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Asymptote,
        {
          type: "vertical",
          value: izResult.x0,
          scale,
          color: withAlpha(MATH_COLORS.paramPrimary, 0.6),
          label: `x₀ = ${izResult.x0.toFixed(2)}`,
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: zeroFootPt.x,
          y1: zeroFootPt.y,
          x2: zeroPt.x,
          y2: zeroPt.y,
          stroke: MATH_COLORS.paramPrimary,
          strokeWidth: 1.5,
          strokeDasharray: "3 3"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: izResult.x0,
          cy: izResult.y0,
          scale,
          vp,
          onDrag: handleDragX0,
          color: MATH_COLORS.paramPrimary,
          r: 6,
          label: `极值 P(${izResult.x0.toFixed(2)}, ${izResult.y0.toFixed(2)})`,
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: tracePt.x,
          cy: tracePt.y,
          r: 5,
          fill: MATH_COLORS.paramSecondary,
          stroke: CANVAS_COLORS.white,
          strokeWidth: 1.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: tracePt.x + 10,
          y: tracePt.y + 4,
          fill: MATH_COLORS.paramSecondary,
          fontSize: fontScale(11),
          fontWeight: "bold",
          children: [
            "轨迹 h(x₀) = ",
            izResult.traceY.toFixed(2)
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "g",
        {
          transform: `translate(${scale.originX - 180}, ${scale.originY - 140})`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: 0,
                y: 0,
                width: 160,
                height: 64,
                rx: 6,
                fill: CANVAS_COLORS.white,
                fillOpacity: 0.85,
                stroke: CANVAS_COLORS.grid,
                strokeWidth: 1
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: 10,
                y1: 16,
                x2: 30,
                y2: 16,
                stroke: MATH_COLORS.function,
                strokeWidth: 2.5
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "text",
              {
                x: 36,
                y: 19,
                fontSize: fontScale(10),
                fill: CANVAS_COLORS.labelTextLight,
                children: "原函数 f(x)"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: 10,
                y1: 34,
                x2: 30,
                y2: 34,
                stroke: MATH_COLORS.derivative,
                strokeWidth: 1.8,
                strokeDasharray: "4 3"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "text",
              {
                x: 36,
                y: 37,
                fontSize: fontScale(10),
                fill: CANVAS_COLORS.labelTextLight,
                children: "导函数 f'(x)"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: 10,
                y1: 50,
                x2: 30,
                y2: 50,
                stroke: MATH_COLORS.trace,
                strokeWidth: 2,
                strokeDasharray: "6 4"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "text",
              {
                x: 36,
                y: 53,
                fontSize: fontScale(10),
                fill: CANVAS_COLORS.labelTextLight,
                children: "消元轨迹 h(x₀)"
              }
            )
          ]
        }
      )
    ] }),
    activeMode === "shift_symmetric" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: shiftResult.fn,
          scale,
          color: MATH_COLORS.function,
          strokeWidth: 2.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: shiftResult.mirrorFn,
          scale,
          color: withAlpha(MATH_COLORS.functionTransformed, 0.75),
          strokeWidth: 2,
          strokeDasharray: "5 4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Asymptote,
        {
          type: "vertical",
          value: shiftResult.x0,
          scale,
          color: MATH_COLORS.paramPrimary,
          label: `对称轴 x₀ = ${shiftResult.x0.toFixed(2)}`,
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Asymptote,
        {
          type: "horizontal",
          value: shiftResult.k,
          scale,
          color: MATH_COLORS.secantLine,
          label: `y = k = ${shiftResult.k.toFixed(2)}`,
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        IntervalShadow,
        {
          fn: shiftResult.fn,
          x1: shiftResult.x0,
          x2: shiftResult.midX,
          scale,
          fillColor: withAlpha(MATH_COLORS.paramTertiary, 0.2)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: shiftResult.x0,
          cy: shiftResult.k,
          scale,
          vp,
          onDrag: handleDragSecant,
          color: MATH_COLORS.secantLine,
          r: 6,
          label: `拖动割线 y = ${shiftResult.k.toFixed(2)}`,
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: x1Pt.x,
          cy: x1Pt.y,
          r: 5,
          fill: MATH_COLORS.function,
          stroke: CANVAS_COLORS.white,
          strokeWidth: 1.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: x1Pt.x - 12,
          y: x1Pt.y - 10,
          fill: MATH_COLORS.function,
          fontSize: fontScale(11),
          fontWeight: "bold",
          children: [
            "x₁(",
            shiftResult.x1.toFixed(2),
            ")"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: x2Pt.x,
          cy: x2Pt.y,
          r: 5,
          fill: MATH_COLORS.functionSecondary,
          stroke: CANVAS_COLORS.white,
          strokeWidth: 1.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: x2Pt.x + 10,
          y: x2Pt.y - 10,
          fill: MATH_COLORS.functionSecondary,
          fontSize: fontScale(11),
          fontWeight: "bold",
          children: [
            "x₂(",
            shiftResult.x2.toFixed(2),
            ")"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: midPt.x,
          cy: midPt.y,
          r: 5,
          fill: MATH_COLORS.paramSecondary,
          stroke: CANVAS_COLORS.white,
          strokeWidth: 1.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: midPt.x,
          y1: midPt.y,
          x2: midPt.x,
          y2: scale.originY,
          stroke: MATH_COLORS.paramSecondary,
          strokeWidth: 1.5,
          strokeDasharray: "3 3"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: midPt.x - 20,
          y: scale.originY - 10,
          fill: MATH_COLORS.paramSecondary,
          fontSize: fontScale(10),
          fontWeight: "bold",
          children: [
            "中点 ",
            shiftResult.midX.toFixed(2)
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: mirrorPtAtX1.x,
          cy: mirrorPtAtX1.y,
          r: 4,
          fill: MATH_COLORS.functionTransformed,
          stroke: CANVAS_COLORS.white,
          strokeWidth: 1
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: x2Pt.x,
          y1: x2Pt.y,
          x2: mirrorPtAtX1.x,
          y2: mirrorPtAtX1.y,
          stroke: MATH_COLORS.paramTertiary,
          strokeWidth: 1.5,
          strokeDasharray: "4 2"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: mirrorPtAtX1.x + 8,
          y: mirrorPtAtX1.y + 12,
          fill: MATH_COLORS.functionTransformed,
          fontSize: fontScale(10),
          children: "镜像点 f(2x₀ - x₁)"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "g",
        {
          transform: `translate(${scale.originX + 120}, ${scale.originY - 140})`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: 0,
                y: 0,
                width: 170,
                height: 50,
                rx: 6,
                fill: CANVAS_COLORS.white,
                fillOpacity: 0.9,
                stroke: MATH_COLORS.paramTertiary,
                strokeWidth: 1.5
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: 12,
                y: 22,
                fill: MATH_COLORS.paramTertiary,
                fontSize: fontScale(11),
                fontWeight: "bold",
                children: [
                  "偏移结论:",
                  " ",
                  shiftResult.shiftType === "right" ? "右偏 (x₁ + x₂ > 2x₀)" : "左偏"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: 12,
                y: 38,
                fill: CANVAS_COLORS.labelTextLight,
                fontSize: fontScale(10),
                children: [
                  "中点偏离量 Δ = ",
                  shiftResult.delta.toFixed(3)
                ]
              }
            )
          ]
        }
      )
    ] }),
    activeMode === "log_mean" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => x > 0 ? Math.log(x) : NaN,
          scale,
          color: MATH_COLORS.function,
          strokeWidth: 2.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: logMeanResult.x1,
          cy: Math.log(logMeanResult.x1),
          scale,
          vp,
          onDrag: handleDragLogMeanX1,
          color: MATH_COLORS.function,
          r: 6,
          label: `x₁ = ${logMeanResult.x1.toFixed(2)}`,
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: logMeanResult.x2,
          cy: Math.log(logMeanResult.x2),
          scale,
          vp,
          onDrag: handleDragLogMeanX2,
          color: MATH_COLORS.functionSecondary,
          r: 6,
          label: `x₂ = ${logMeanResult.x2.toFixed(2)}`,
          fontScale
        }
      ),
      (() => {
        const geoPt = mathToDesign(logMeanResult.geoMean, 0, scale);
        const logPt = mathToDesign(logMeanResult.logMean, 0, scale);
        const ariPt = mathToDesign(logMeanResult.ariMean, 0, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: geoPt.x,
              cy: geoPt.y,
              r: 4,
              fill: MATH_COLORS.function
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: geoPt.x,
              y1: geoPt.y,
              x2: geoPt.x,
              y2: geoPt.y + 35,
              stroke: MATH_COLORS.function,
              strokeWidth: 1.5
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: geoPt.x - 20,
              y: geoPt.y + 48,
              fill: MATH_COLORS.function,
              fontSize: fontScale(10),
              fontWeight: "bold",
              children: [
                "√(x₁x₂)=",
                logMeanResult.geoMean.toFixed(2)
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: logPt.x,
              cy: logPt.y,
              r: 5,
              fill: MATH_COLORS.paramPrimary
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: logPt.x,
              y1: logPt.y,
              x2: logPt.x,
              y2: logPt.y + 15,
              stroke: MATH_COLORS.paramPrimary,
              strokeWidth: 2
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: logPt.x - 18,
              y: logPt.y + 26,
              fill: MATH_COLORS.paramPrimary,
              fontSize: fontScale(11),
              fontWeight: "bold",
              children: [
                "L(x₁,x₂)=",
                logMeanResult.logMean.toFixed(2)
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: ariPt.x,
              cy: ariPt.y,
              r: 4,
              fill: MATH_COLORS.paramSecondary
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: ariPt.x,
              y1: ariPt.y,
              x2: ariPt.x,
              y2: ariPt.y + 35,
              stroke: MATH_COLORS.paramSecondary,
              strokeWidth: 1.5
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: ariPt.x - 20,
              y: ariPt.y + 48,
              fill: MATH_COLORS.paramSecondary,
              fontSize: fontScale(10),
              fontWeight: "bold",
              children: [
                "(x₁+x₂)/2=",
                logMeanResult.ariMean.toFixed(2)
              ]
            }
          )
        ] });
      })(),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "g",
        {
          transform: `translate(${scale.originX - 180}, ${scale.originY - 140})`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: 0,
                y: 0,
                width: 340,
                height: 44,
                rx: 6,
                fill: CANVAS_COLORS.white,
                fillOpacity: 0.9,
                stroke: MATH_COLORS.paramPrimary,
                strokeWidth: 1.5
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "text",
              {
                x: 14,
                y: 27,
                fill: CANVAS_COLORS.labelText,
                fontSize: fontScale(11),
                fontWeight: "bold",
                children: "对数均值不等式链： √(x₁x₂) < L(x₁, x₂) < (x₁ + x₂)/2"
              }
            )
          ]
        }
      )
    ] })
  ] });
}
const defaultParams = {
  a: 1.5,
  // 隐零点参数 a
  k: 0.25,
  // 割线高度 y = k
  x1: 0.3,
  // 对数均值不等式 x1
  x2: 2.5
  // 对数均值不等式 x2
};
const paramMeta = {
  a: {
    key: "a",
    label: "函数参数 a",
    labelFormula: "a",
    min: 0.1,
    max: 3.5,
    step: 0.05,
    defaultValue: 1.5,
    importance: "core",
    description: "控制导函数零点位置及原函数极值高度",
    descriptionFormula: "控制导函数零点 $x_0$ 及原函数极值 $f(x_0)$",
    marks: [
      {
        value: 1,
        variant: "critical",
        label: "标准界",
        labelFormula: "a = 1.0"
      }
    ]
  },
  k: {
    key: "k",
    label: "割线高度 k",
    labelFormula: "k",
    min: 0.05,
    max: 0.35,
    step: 0.01,
    defaultValue: 0.25,
    importance: "core",
    description: "割线 y = k 截原函数的两根 x1 与 x2",
    descriptionFormula: "割线 $y = k$ 截原函数的两根 $x_1, x_2$",
    marks: [
      {
        value: 0.368,
        variant: "critical",
        label: "极值临界",
        labelFormula: "k_{max} = 1/e"
      }
    ]
  },
  x1: {
    key: "x1",
    label: "端点 x1",
    labelFormula: "x_1",
    min: 0.1,
    max: 2,
    step: 0.05,
    defaultValue: 0.3,
    importance: "display",
    description: "对数均值不等式左端点",
    descriptionFormula: "对数均值不等式左端点 $x_1 > 0$"
  },
  x2: {
    key: "x2",
    label: "端点 x2",
    labelFormula: "x_2",
    min: 2.1,
    max: 6,
    step: 0.1,
    defaultValue: 3.5,
    importance: "display",
    description: "对数均值不等式右端点",
    descriptionFormula: "对数均值不等式右端点 $x_2 > x_1$"
  }
};
function DerivativeShiftAnimation() {
  const [params, setParams] = reactExports.useState(() => ({ ...defaultParams }));
  const [activeMode, setActiveMode] = reactExports.useState("implicit_zero");
  const [subModel, setSubModel] = reactExports.useState("x_ln_x");
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-1.5, 6.5],
    yRange: [-2.5, 3.5]
  });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-derivative-shift", params, {
      activeMode,
      subModel
    }),
    [params, activeMode, subModel]
  );
  const paramConfigs = reactExports.useMemo(() => {
    const keysByMode = {
      implicit_zero: ["a"],
      shift_symmetric: ["k"],
      log_mean: ["x1", "x2"]
    };
    const keys = keysByMode[activeMode] ?? Object.keys(paramMeta);
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
  }, [params, activeMode]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  const topFormulaLatex = reactExports.useMemo(() => {
    if (activeMode === "implicit_zero") {
      if (subModel === "x_ln_x") {
        return `f(x) = x \\ln x - \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2)}} x + 1`;
      }
      return `f(x) = e^x - \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2)}} x`;
    } else if (activeMode === "shift_symmetric") {
      if (subModel === "xe_neg_x") {
        return `f(x) = x e^{-x} = \\color{${MATH_COLORS.secantLine}}{${params.k.toFixed(2)}}`;
      }
      return `f(x) = \\frac{\\ln x}{x} = \\color{${MATH_COLORS.secantLine}}{${params.k.toFixed(2)}}`;
    }
    return `\\sqrt{x_1 x_2} < L(x_1, x_2) < \\frac{x_1 + x_2}{2}`;
  }, [activeMode, subModel, params.a, params.k]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "模式选择",
            subtitle: "切换高考导数压轴三大核心模型",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              TabSwitcher,
              {
                tabs: [
                  { key: "implicit_zero", label: "隐零点与消元" },
                  { key: "shift_symmetric", label: "极值点偏移" },
                  { key: "log_mean", label: "对数均值" }
                ],
                value: activeMode,
                onChange: (k) => {
                  setActiveMode(k);
                  if (k === "implicit_zero") setSubModel("x_ln_x");
                  else if (k === "shift_symmetric") setSubModel("xe_neg_x");
                }
              }
            )
          }
        ),
        activeMode !== "log_mean" && /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "函数模型", subtitle: "选择经典高考函数", children: activeMode === "implicit_zero" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              {
                key: "x_ln_x",
                label: "x ln x - ax + 1",
                formula: "x \\ln x - ax + 1"
              },
              {
                key: "exp_minus_ax",
                label: "e^x - ax",
                formula: "e^x - ax"
              }
            ],
            value: subModel,
            onChange: (key) => setSubModel(key),
            columns: 1
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "xe_neg_x", label: "x e^{-x}", formula: "x e^{-x}" },
              {
                key: "lnx_div_x",
                label: "\\ln x / x",
                formula: "\\frac{\\ln x}{x}"
              }
            ],
            value: subModel,
            onChange: (key) => setSubModel(key),
            columns: 1
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "参数调节",
            subtitle: "拖动滑块动态观察图形联动",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              ParamControl,
              {
                params: paramConfigs,
                onParamChange: handleParamChange,
                onReset: () => setParams({ ...defaultParams })
              }
            )
          }
        )
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: topFormulaLatex, mode: "inline" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              DerivativeShiftScene,
              {
                params,
                scale,
                vp,
                activeMode,
                subModel,
                onParamChange: handleParamChange,
                fontScale: canvasSize.font
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
          title: "隐零点与极值点偏移看板"
        }
      )
    }
  );
}
export {
  DerivativeShiftAnimation
};
