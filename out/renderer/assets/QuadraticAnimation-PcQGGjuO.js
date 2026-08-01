import { R as React, j as jsxRuntimeExports, r as reactExports } from "./index-Bz0Bjl36.js";
import { w as withAlpha, b as MATH_COLORS, A as ALGEBRA_COLORS, d as CALCULUS_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import { C as CoordinateGrid } from "./CoordinateGrid-BmMyIyOq.js";
import { F as FunctionGraph } from "./FunctionGraph-DoU6C8dJ.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { I as InteractivePoint } from "./InteractivePoint-ZTf14j6W.js";
import { I as IntervalShadow } from "./IntervalShadow--pOvsarb.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import { y as solveQuadratic, b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import "./useRadioGroup-jCNJTR-s.js";
function fmtCoeff(val, opts) {
  const abs = Math.abs(val);
  const formatted = abs === Math.floor(abs) ? abs.toString() : abs.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return val >= 0 ? formatted : `-${formatted}`;
}
function colored(text, color) {
  if (!color) return text;
  return `\\color{${color}}{${text}}`;
}
function buildPolyLatex(terms) {
  const nonzero = terms.filter((t) => Math.abs(t.coeff) > 1e-9);
  if (nonzero.length === 0) return "0";
  const sorted = [...nonzero].sort((a, b) => b.power - a.power);
  let latex = "";
  for (let i = 0; i < sorted.length; i++) {
    const { coeff, power, color } = sorted[i];
    const isFirst = i === 0;
    const isNeg = coeff < 0;
    if (!isFirst) {
      latex += isNeg ? " - " : " + ";
    } else if (isNeg) {
      latex += "-";
    }
    const absCoeff = Math.abs(coeff);
    if (power === 0) {
      latex += colored(fmtCoeff(absCoeff), color);
    } else {
      if (Math.abs(absCoeff - 1) > 1e-9) {
        latex += colored(fmtCoeff(absCoeff), color);
      }
      if (power === 1) {
        latex += colored("x", color);
      } else {
        latex += colored(`x^{${power}}`, color);
      }
    }
  }
  return latex;
}
function getSolutionIntervals(a, b, c, ineqType, xMin, xMax, roots) {
  const intervals = [];
  if (Math.abs(a) > 1e-9) {
    if (roots.length === 2) {
      const r1 = roots[0];
      const r2 = roots[1];
      if (ineqType === ">") {
        if (a > 0) {
          intervals.push({ x1: xMin - 1, x2: r1, isLeftInfinity: true });
          intervals.push({ x1: r2, x2: xMax + 1, isRightInfinity: true });
        } else {
          intervals.push({ x1: r1, x2: r2 });
        }
      } else {
        if (a > 0) {
          intervals.push({ x1: r1, x2: r2 });
        } else {
          intervals.push({ x1: xMin - 1, x2: r1, isLeftInfinity: true });
          intervals.push({ x1: r2, x2: xMax + 1, isRightInfinity: true });
        }
      }
    } else if (roots.length === 1) {
      const r0 = roots[0];
      if (ineqType === ">") {
        if (a > 0) {
          intervals.push({ x1: xMin - 1, x2: r0, isLeftInfinity: true });
          intervals.push({ x1: r0, x2: xMax + 1, isRightInfinity: true });
        }
      } else {
        if (a < 0) {
          intervals.push({ x1: xMin - 1, x2: r0, isLeftInfinity: true });
          intervals.push({ x1: r0, x2: xMax + 1, isRightInfinity: true });
        }
      }
    } else {
      if (ineqType === ">") {
        if (a > 0) {
          intervals.push({
            x1: xMin - 1,
            x2: xMax + 1,
            isLeftInfinity: true,
            isRightInfinity: true
          });
        }
      } else {
        if (a < 0) {
          intervals.push({
            x1: xMin - 1,
            x2: xMax + 1,
            isLeftInfinity: true,
            isRightInfinity: true
          });
        }
      }
    }
  } else {
    if (Math.abs(b) > 1e-9) {
      const r0 = -c / b;
      if (ineqType === ">") {
        if (b > 0) {
          intervals.push({ x1: r0, x2: xMax + 1, isRightInfinity: true });
        } else {
          intervals.push({ x1: xMin - 1, x2: r0, isLeftInfinity: true });
        }
      } else {
        if (b > 0) {
          intervals.push({ x1: xMin - 1, x2: r0, isLeftInfinity: true });
        } else {
          intervals.push({ x1: r0, x2: xMax + 1, isRightInfinity: true });
        }
      }
    } else {
      if (ineqType === ">") {
        if (c > 0) {
          intervals.push({
            x1: xMin - 1,
            x2: xMax + 1,
            isLeftInfinity: true,
            isRightInfinity: true
          });
        }
      } else {
        if (c < 0) {
          intervals.push({
            x1: xMin - 1,
            x2: xMax + 1,
            isLeftInfinity: true,
            isRightInfinity: true
          });
        }
      }
    }
  }
  return intervals;
}
function useQuadraticScene({
  params,
  scale,
  onParamChange,
  studyMode,
  ineqType
}) {
  const { a, b, c } = params;
  const res = solveQuadratic(a, b, c);
  const handleVertexDrag = React.useCallback(
    (mathPt) => {
      if (Math.abs(a) < 1e-9) return;
      const newB = -2 * a * mathPt.x;
      const newC = mathPt.y + a * mathPt.x * mathPt.x;
      onParamChange("b", Math.round(newB * 100) / 100);
      onParamChange("c", Math.round(newC * 100) / 100);
    },
    [a, onParamChange]
  );
  const handleYInterceptDrag = React.useCallback(
    (mathPt) => {
      onParamChange("c", Math.round(mathPt.y * 100) / 100);
    },
    [onParamChange]
  );
  const axisLine = React.useMemo(() => {
    if (res.axisX === null) return null;
    const topPt = mathToDesign(res.axisX, scale.yMax, scale);
    const bottomPt = mathToDesign(res.axisX, scale.yMin, scale);
    return { x1: topPt.x, y1: topPt.y, x2: bottomPt.x, y2: bottomPt.y };
  }, [res.axisX, scale]);
  const solutionIntervals = React.useMemo(() => {
    return getSolutionIntervals(
      a,
      b,
      c,
      ineqType,
      scale.xMin,
      scale.xMax,
      res.roots
    );
  }, [a, b, c, ineqType, scale.xMin, scale.xMax, res.roots]);
  const labels = React.useMemo(() => {
    const entries = [];
    const isDeg = Math.abs(a) < 1e-9;
    if (res.vertexX !== null && res.vertexY !== null && !isDeg) {
      const pt = mathToDesign(res.vertexX, res.vertexY, scale);
      entries.push({
        key: "vertex",
        text: `P(${res.vertexX.toFixed(1)}, ${res.vertexY.toFixed(1)})`,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: a > 0 ? 18 : -12
      });
    }
    {
      const pt = mathToDesign(0, c, scale);
      entries.push({
        key: "yInt",
        text: `(0, ${c.toFixed(1)})`,
        x: pt.x,
        y: pt.y,
        anchor: "start",
        dy: 3
      });
    }
    if (studyMode !== "inequality") {
      res.roots.filter((r) => Number.isFinite(r)).forEach((rootVal, i) => {
        const pt = mathToDesign(rootVal, 0, scale);
        entries.push({
          key: `root${i}`,
          text: `x${i + 1}=${rootVal.toFixed(1)}`,
          x: pt.x,
          y: pt.y,
          anchor: "middle",
          dy: -10
        });
      });
    } else {
      solutionIntervals.forEach((interval, index) => {
        if (!interval.isLeftInfinity && interval.x1 >= scale.xMin && interval.x1 <= scale.xMax) {
          const pt = mathToDesign(interval.x1, 0, scale);
          entries.push({
            key: `ineq-left-${index}`,
            text: interval.x1.toFixed(1),
            x: pt.x,
            y: pt.y,
            anchor: "middle",
            dy: -10
          });
        }
        if (!interval.isRightInfinity && interval.x2 >= scale.xMin && interval.x2 <= scale.xMax) {
          const pt = mathToDesign(interval.x2, 0, scale);
          entries.push({
            key: `ineq-right-${index}`,
            text: interval.x2.toFixed(1),
            x: pt.x,
            y: pt.y,
            anchor: "middle",
            dy: -10
          });
        }
      });
    }
    return avoidLabels(entries);
  }, [
    res.vertexX,
    res.vertexY,
    res.roots,
    a,
    c,
    scale,
    studyMode,
    solutionIntervals
  ]);
  const isDegenerate = Math.abs(a) < 1e-9;
  return {
    axisLine,
    labels,
    solutionIntervals,
    handleVertexDrag,
    handleYInterceptDrag,
    isDegenerate,
    vertexX: res.vertexX,
    vertexY: res.vertexY,
    roots: res.roots,
    delta: res.delta
  };
}
const QuadraticScene = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "function",
  ineqType = ">"
}) => {
  const { a, b, c } = params;
  const {
    axisLine,
    labels,
    solutionIntervals,
    handleVertexDrag,
    handleYInterceptDrag,
    isDegenerate,
    vertexX,
    vertexY,
    roots,
    delta
  } = useQuadraticScene({ params, scale, onParamChange, studyMode, ineqType });
  const fn = React.useCallback((x) => a * x * x + b * x + c, [a, b, c]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    studyMode === "inequality" && solutionIntervals.map((interval, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      IntervalShadow,
      {
        fn,
        x1: interval.x1,
        x2: interval.x2,
        scale,
        fillColor: withAlpha(MATH_COLORS.inequality, 0.15),
        strokeColor: "transparent"
      },
      `shadow-${index}`
    )),
    axisLine && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: axisLine.x1,
        y1: axisLine.y1,
        x2: axisLine.x2,
        y2: axisLine.y2,
        stroke: MATH_COLORS.asymptote,
        strokeWidth: 1.5,
        strokeDasharray: "4 4"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn,
        scale,
        color: MATH_COLORS.function,
        strokeWidth: 2.5
      }
    ),
    studyMode === "inequality" && solutionIntervals.map((interval, index) => {
      const startPt = mathToDesign(
        Math.max(interval.x1, scale.xMin),
        0,
        scale
      );
      const endPt = mathToDesign(
        Math.min(interval.x2, scale.xMax),
        0,
        scale
      );
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: startPt.x,
            y1: startPt.y,
            x2: endPt.x,
            y2: endPt.y,
            stroke: MATH_COLORS.inequality,
            strokeWidth: 5,
            strokeOpacity: 0.5,
            strokeLinecap: "round"
          }
        ),
        !interval.isLeftInfinity && interval.x1 >= scale.xMin && interval.x1 <= scale.xMax && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: mathToDesign(interval.x1, 0, scale).x,
            cy: mathToDesign(interval.x1, 0, scale).y,
            r: 4.5,
            fill: MATH_COLORS.white,
            stroke: MATH_COLORS.inequality,
            strokeWidth: 2
          }
        ),
        !interval.isRightInfinity && interval.x2 >= scale.xMin && interval.x2 <= scale.xMax && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: mathToDesign(interval.x2, 0, scale).x,
            cy: mathToDesign(interval.x2, 0, scale).y,
            r: 4.5,
            fill: MATH_COLORS.white,
            stroke: MATH_COLORS.inequality,
            strokeWidth: 2
          }
        )
      ] }, `projection-group-${index}`);
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: 0,
        cy: c,
        scale,
        vp,
        onDrag: handleYInterceptDrag,
        color: MATH_COLORS.vectorSecondary,
        r: 5,
        disabled: false,
        fontScale
      }
    ),
    vertexX !== null && vertexY !== null && /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: vertexX,
        cy: vertexY,
        scale,
        vp,
        onDrag: handleVertexDrag,
        color: MATH_COLORS.focusPoint,
        r: 6,
        disabled: isDegenerate,
        fontScale
      }
    ),
    studyMode !== "inequality" && roots.filter((r) => Number.isFinite(r)).map((rootVal, i) => {
      const pt = mathToDesign(rootVal, 0, scale);
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: pt.x,
          cy: pt.y,
          r: 4.5,
          fill: MATH_COLORS.vectorResult,
          stroke: MATH_COLORS.white,
          strokeWidth: 1.5
        },
        `root-${i}`
      );
    }),
    studyMode === "equation" && a !== 0 && delta < 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: mathToDesign(0, 1.8, scale).x - 90,
          y: mathToDesign(0, 1.8, scale).y - 18,
          width: 180,
          height: 32,
          rx: 6,
          fill: withAlpha(MATH_COLORS.vectorResult, 0.08),
          stroke: withAlpha(MATH_COLORS.vectorResult, 0.3),
          strokeWidth: 1
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: mathToDesign(0, 1.8, scale).x,
          y: mathToDesign(0, 1.8, scale).y + 2,
          textAnchor: "middle",
          fill: MATH_COLORS.vectorResult,
          fontSize: fontScale(11),
          fontWeight: "bold",
          className: "select-none pointer-events-none",
          children: [
            "Δ = ",
            delta.toFixed(2),
            " < 0 (无实数根)"
          ]
        }
      )
    ] }),
    labels.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: l.x,
        y: l.y + l.finalDy,
        textAnchor: l.anchor,
        fill: MATH_COLORS.labelText,
        fontSize: fontScale(10),
        fontFamily: "monospace",
        fontWeight: "600",
        className: "select-none pointer-events-none",
        children: l.text
      },
      l.key
    ))
  ] });
};
const defaultParams = {
  a: 1,
  b: 0,
  c: 0
};
const paramMeta = {
  a: {
    key: "a",
    label: "二次项系数 a",
    labelFormula: "a",
    min: -2,
    max: 2,
    step: 0.1,
    defaultValue: 1,
    importance: "core",
    description: "控制抛物线开口方向与胖瘦，为 0 时退化为直线",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "退化为直线",
        labelFormula: "a = 0"
      }
    ]
  },
  b: {
    key: "b",
    label: "一次项系数 b",
    labelFormula: "b",
    min: -4,
    max: 4,
    step: 0.1,
    defaultValue: 0,
    importance: "core",
    description: "与 a 共同决定对称轴位置 x = -b/(2a)",
    descriptionFormula: "与 $a$ 共同决定对称轴位置 $x = -\\frac{b}{2a}$"
  },
  c: {
    key: "c",
    label: "常数项 c",
    labelFormula: "c",
    min: -3,
    max: 3,
    step: 0.1,
    defaultValue: 0,
    importance: "core",
    description: "代表抛物线与 y 轴交点坐标 (0, c)"
  }
};
function QuadraticAnimation() {
  const [studyMode, setStudyMode] = reactExports.useState("function");
  const [ineqType, setIneqType] = reactExports.useState(">");
  const [params, setParams] = reactExports.useState(() => ({
    a: defaultParams.a,
    b: defaultParams.b,
    c: defaultParams.c
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5]
  });
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-quadratic", params, {
      studyMode,
      ineqType
    });
  }, [params, studyMode, ineqType]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };
  const handleReset = () => {
    setParams({
      a: defaultParams.a,
      b: defaultParams.b,
      c: defaultParams.c
    });
  };
  const paramConfigs = reactExports.useMemo(() => {
    return Object.entries(paramMeta).map(([key, meta]) => ({
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
    }));
  }, [params]);
  const polyLatex = reactExports.useMemo(() => {
    const terms = [];
    if (Math.abs(params.a) > 1e-9) {
      terms.push({ coeff: params.a, power: 2, color: ALGEBRA_COLORS.sequence });
    }
    if (Math.abs(params.b) > 1e-9) {
      terms.push({
        coeff: params.b,
        power: 1,
        color: ALGEBRA_COLORS.inequality
      });
    }
    if (Math.abs(params.c) > 1e-9 || Math.abs(params.a) < 1e-9 && Math.abs(params.b) < 1e-9) {
      terms.push({
        coeff: params.c,
        power: 0,
        color: CALCULUS_COLORS.derivative
      });
    }
    return buildPolyLatex(terms);
  }, [params]);
  const equationLatex = reactExports.useMemo(() => {
    if (studyMode === "function") {
      return `f(x) = ${polyLatex}`;
    } else if (studyMode === "equation") {
      return `${polyLatex} = 0`;
    } else {
      return `${polyLatex} ${ineqType} 0`;
    }
  }, [polyLatex, studyMode, ineqType]);
  const panelTitle = reactExports.useMemo(() => {
    if (studyMode === "function") return "二次函数指标看板";
    if (studyMode === "equation") return "一元二次方程指标看板";
    return "一元二次不等式指标看板";
  }, [studyMode]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "研究模式", subtitle: "选择三位一体探讨对象", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "function", label: "二次函数性质" },
              { key: "equation", label: "一元二次方程" },
              { key: "inequality", label: "一元二次不等式", fullWidth: true }
            ],
            value: studyMode,
            onChange: (k) => setStudyMode(k),
            variant: "filled"
          }
        ) }),
        studyMode === "inequality" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "不等号方向",
            subtitle: "选择解集的大于/小于关系",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: [
                  { key: ">", label: "f(x) > 0", formula: "f(x) > 0" },
                  { key: "<", label: "f(x) < 0", formula: "f(x) < 0" }
                ],
                value: ineqType,
                onChange: (k) => setIneqType(k),
                variant: "filled",
                color: "success"
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "参数调节", subtitle: "拖动滑块改变抛物线系数", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: handleReset
          }
        ) })
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: equationLatex, mode: "inline" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              QuadraticScene,
              {
                params,
                scale,
                vp,
                onParamChange: handleParamChange,
                fontScale: canvasSize.font,
                studyMode,
                ineqType
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
  QuadraticAnimation
};
