import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { b as MATH_COLORS, w as withAlpha, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import { A as solveConstantSingleSepTrans, B as solveConstantSingleSep, C as solveConstantSingleDirectTrans, D as solveConstantSingleDirect, E as evalFTrans, F as evalGParamTrans, G as evalFTransC, H as evalFTransD, I as evalF, J as evalGParam, K as evalTransDerivative, b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import { d as defaultParams, p as paramMeta } from "./constant--oGylVwM.js";
import { C as CoordinateGrid } from "./CoordinateGrid-BmMyIyOq.js";
import { F as FunctionGraph } from "./FunctionGraph-DoU6C8dJ.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { I as InteractivePoint } from "./InteractivePoint-ZTf14j6W.js";
import { I as IntervalShadow } from "./IntervalShadow--pOvsarb.js";
import { T as TangentLine } from "./TangentLine-DSaW8mKI.js";
import { A as Asymptote } from "./Asymptote-CeJ5uPCO.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import "./useRadioGroup-jCNJTR-s.js";
const SingleVarScene = ({
  subMode,
  funModel,
  transModel = "ln_x_over_x",
  showDerivative = false,
  showTangent = false,
  params,
  scale,
  vp,
  fontScale = (v) => v,
  onParamChange
}) => {
  const a = params.a ?? 1.2;
  const a_axis = params.a_axis ?? 1;
  const m = params.m ?? 0.5;
  const n = params.n ?? 2.5;
  const isSep = subMode === "sep";
  const isTrans = funModel === "transcendent";
  const evalPrimaryFn = (x) => {
    if (isTrans) {
      if (x <= 0) return NaN;
      if (transModel === "ln_x_over_x")
        return isSep ? evalFTrans(x) : evalGParamTrans(x, a_axis);
      if (transModel === "exp_minus_ax")
        return isSep ? Math.exp(x) / x : Math.exp(x) - a_axis * x;
      if (transModel === "a_ln_x_minus_x")
        return evalFTransC(x, isSep ? a : a_axis);
      if (transModel === "exp_minus_a_x_plus_1")
        return evalFTransD(x, isSep ? a : a_axis);
      return evalFTrans(x);
    } else {
      return isSep ? evalF(x) : evalGParam(x, a_axis);
    }
  };
  const evalDerivativeFn = (x) => {
    if (isTrans) {
      return evalTransDerivative(x, isSep ? a : a_axis, transModel);
    } else {
      return isSep ? 2 * x - 2 : 2 * x - 2 * a_axis;
    }
  };
  const sepResult = reactExports.useMemo(() => {
    return isTrans ? solveConstantSingleSepTrans(a, m, n) : solveConstantSingleSep(a, m, n);
  }, [a, m, n, isTrans]);
  const directResult = reactExports.useMemo(() => {
    return isTrans ? solveConstantSingleDirectTrans(a_axis, m, n) : solveConstantSingleDirect(a_axis, m, n);
  }, [a_axis, m, n, isTrans]);
  const handleMDrag = (mathPt) => {
    onParamChange("m", Math.round(mathPt.x * 20) / 20);
  };
  const handleNDrag = (mathPt) => {
    onParamChange("n", Math.round(mathPt.x * 20) / 20);
  };
  const handleADrag = (mathPt) => {
    onParamChange("a", Math.round(mathPt.y * 20) / 20);
  };
  const handleAAxisDrag = (mathPt) => {
    onParamChange("a_axis", Math.round(mathPt.x * 20) / 20);
  };
  const ptM = mathToDesign(m, 0, scale);
  const ptN = mathToDesign(n, 0, scale);
  const isCollapsed = m >= n;
  const placedExtremumLabels = reactExports.useMemo(() => {
    if (isCollapsed) return [];
    const entries = [];
    if (isSep) {
      const ptMin = mathToDesign(sepResult.xFMin, sepResult.fMin, scale);
      const ptMax = mathToDesign(sepResult.xFMax, sepResult.fMax, scale);
      entries.push(
        {
          key: "min",
          text: `Min(${sepResult.fMin.toFixed(2)})`,
          x: ptMin.x,
          y: ptMin.y,
          anchor: "middle",
          dy: -8
        },
        {
          key: "max",
          text: `Max(${sepResult.fMax.toFixed(2)})`,
          x: ptMax.x,
          y: ptMax.y,
          anchor: "middle",
          dy: -8
        }
      );
    } else {
      const ptMin = mathToDesign(directResult.xFMin, directResult.fMin, scale);
      entries.push({
        key: "min",
        text: `Min(${directResult.fMin.toFixed(2)})`,
        x: ptMin.x,
        y: ptMin.y,
        anchor: "middle",
        dy: -8
      });
    }
    return avoidLabels(entries, { fontScale });
  }, [isSep, isCollapsed, sepResult, directResult, scale, fontScale]);
  const placedPointLabels = reactExports.useMemo(() => {
    const entries = [
      {
        key: "m",
        text: `m=${m.toFixed(2)}`,
        x: mathToDesign(m, 0, scale).x,
        y: mathToDesign(m, 0, scale).y,
        anchor: "middle",
        dy: -12
      },
      {
        key: "n",
        text: `n=${n.toFixed(2)}`,
        x: mathToDesign(n, 0, scale).x,
        y: mathToDesign(n, 0, scale).y,
        anchor: "middle",
        dy: -12
      }
    ];
    if (isSep && !isCollapsed) {
      entries.push({
        key: "a",
        text: `a=${a.toFixed(2)}`,
        x: mathToDesign((m + n) / 2, a, scale).x,
        y: mathToDesign((m + n) / 2, a, scale).y,
        anchor: "middle",
        dy: -12
      });
    }
    if (!isSep && !isCollapsed) {
      const aX = isTrans && a_axis > 0 ? Math.log(a_axis) : a_axis;
      entries.push({
        key: "a_axis",
        text: `a=${a_axis.toFixed(2)}`,
        x: mathToDesign(aX, 0, scale).x,
        y: mathToDesign(aX, 0, scale).y,
        anchor: "middle",
        dy: -12
      });
    }
    return avoidLabels(entries, { fontScale });
  }, [m, n, a, a_axis, isSep, isCollapsed, isTrans, scale, fontScale]);
  const sepHorizontalLine = reactExports.useMemo(() => {
    if (!isSep || isCollapsed) return null;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Asymptote,
      {
        type: "horizontal",
        value: a,
        scale,
        color: MATH_COLORS.paramPrimary,
        label: `y = a (${a.toFixed(2)})`,
        fontScale
      }
    );
  }, [isSep, a, scale, fontScale, isCollapsed]);
  const directAxisLine = reactExports.useMemo(() => {
    if (isSep || isCollapsed) return null;
    if (isTrans) {
      if (a_axis <= 0) return null;
      const lna = Math.log(a_axis);
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        Asymptote,
        {
          type: "vertical",
          value: lna,
          scale,
          color: MATH_COLORS.paramPrimary,
          label: `驻点/极小值点 x = ln a (${lna.toFixed(2)})`,
          fontScale
        }
      );
    } else {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        Asymptote,
        {
          type: "vertical",
          value: a_axis,
          scale,
          color: MATH_COLORS.paramPrimary,
          label: `对称轴 x = a (${a_axis.toFixed(2)})`,
          fontScale
        }
      );
    }
  }, [isSep, a_axis, scale, fontScale, isCollapsed, isTrans]);
  const violatedVisuals = reactExports.useMemo(() => {
    if (isCollapsed) return null;
    const violated = isSep ? sepResult.violatedInterval : directResult.violatedInterval;
    if (!violated) return null;
    const [vStart, vEnd] = violated;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        IntervalShadow,
        {
          fn: evalPrimaryFn,
          x1: vStart,
          x2: vEnd,
          scale,
          fillColor: withAlpha(MATH_COLORS.degeneracy, 0.12),
          strokeColor: MATH_COLORS.degeneracy,
          strokeWidth: 2
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: mathToDesign((vStart + vEnd) / 2, 0, scale).x,
          y: mathToDesign(0, scale.yMin + 0.3, scale).y,
          textAnchor: "middle",
          fill: MATH_COLORS.degeneracy,
          fontSize: fontScale(10),
          className: "font-bold select-none",
          children: [
            "违背区间 [",
            vStart.toFixed(2),
            ", ",
            vEnd.toFixed(2),
            "]"
          ]
        }
      )
    ] });
  }, [
    isSep,
    sepResult,
    directResult,
    scale,
    fontScale,
    isCollapsed,
    evalPrimaryFn
  ]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    !isCollapsed && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: ptM.x,
        y: mathToDesign(0, scale.yMax, scale).y,
        width: Math.max(0, ptN.x - ptM.x),
        height: Math.max(
          0,
          mathToDesign(0, scale.yMin, scale).y - mathToDesign(0, scale.yMax, scale).y
        ),
        fill: withAlpha(MATH_COLORS.function, 0.04),
        pointerEvents: "none"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => {
          if (isCollapsed) return NaN;
          return x < m || x > n ? evalPrimaryFn(x) : NaN;
        },
        scale,
        color: withAlpha(MATH_COLORS.function, 0.35),
        strokeWidth: 1.5,
        strokeDasharray: "3 3"
      }
    ),
    !isCollapsed && /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => x >= m && x <= n ? evalPrimaryFn(x) : NaN,
        scale,
        color: MATH_COLORS.function,
        strokeWidth: 2.8
      }
    ),
    showDerivative && !isCollapsed && /* @__PURE__ */ jsxRuntimeExports.jsx("g", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => x >= m && x <= n ? evalDerivativeFn(x) : NaN,
        scale,
        color: MATH_COLORS.derivative,
        strokeWidth: 1.8,
        strokeDasharray: "4 2"
      }
    ) }),
    showTangent && /* @__PURE__ */ jsxRuntimeExports.jsx("g", { children: isTrans && (transModel === "a_ln_x_minus_x" || transModel === "exp_minus_a_x_plus_1") && /* @__PURE__ */ jsxRuntimeExports.jsx(
      TangentLine,
      {
        fn: evalPrimaryFn,
        x0: transModel === "a_ln_x_minus_x" ? 1 : 0,
        scale,
        color: MATH_COLORS.tangentLine,
        strokeWidth: 1.5
      }
    ) }),
    sepHorizontalLine,
    directAxisLine,
    violatedVisuals,
    !isCollapsed && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: ptM.x,
          y1: mathToDesign(m, scale.yMax, scale).y,
          x2: ptM.x,
          y2: mathToDesign(m, scale.yMin, scale).y,
          stroke: MATH_COLORS.asymptote,
          strokeWidth: 1,
          strokeDasharray: "2 2"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: ptN.x,
          y1: mathToDesign(n, scale.yMax, scale).y,
          x2: ptN.x,
          y2: mathToDesign(n, scale.yMin, scale).y,
          stroke: MATH_COLORS.asymptote,
          strokeWidth: 1,
          strokeDasharray: "2 2"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: m,
        cy: 0,
        scale,
        vp,
        onDrag: handleMDrag,
        color: MATH_COLORS.asymptote,
        r: 5,
        label: `m=${m.toFixed(2)}`,
        labelKey: "m",
        placedLabels: placedPointLabels,
        fontScale
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: n,
        cy: 0,
        scale,
        vp,
        onDrag: handleNDrag,
        color: MATH_COLORS.asymptote,
        r: 5,
        label: `n=${n.toFixed(2)}`,
        labelKey: "n",
        placedLabels: placedPointLabels,
        fontScale
      }
    ),
    isSep && !isCollapsed && /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: (m + n) / 2,
        cy: a,
        scale,
        vp,
        onDrag: handleADrag,
        color: MATH_COLORS.paramPrimary,
        r: 6.5,
        label: `a=${a.toFixed(2)}`,
        labelKey: "a",
        placedLabels: placedPointLabels,
        fontScale
      }
    ),
    !isSep && !isCollapsed && /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: isTrans && a_axis > 0 ? Math.log(a_axis) : a_axis,
        cy: 0,
        scale,
        vp,
        onDrag: handleAAxisDrag,
        color: MATH_COLORS.paramPrimary,
        r: 6.5,
        label: isTrans ? `驻点 ln a (${(a_axis > 0 ? Math.log(a_axis) : 0).toFixed(2)})` : `轴 a=${a_axis.toFixed(2)}`,
        labelKey: "a_axis",
        placedLabels: placedPointLabels,
        fontScale
      }
    ),
    !isCollapsed && /* @__PURE__ */ jsxRuntimeExports.jsx("g", { children: isSep ? /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: mathToDesign(sepResult.xFMin, sepResult.fMin, scale).x,
          cy: mathToDesign(sepResult.xFMin, sepResult.fMin, scale).y,
          r: 4,
          fill: MATH_COLORS.function
        }
      ),
      (() => {
        const placed = placedExtremumLabels.find(
          (l) => l.key === "min"
        );
        return placed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: placed.x,
            y: placed.y,
            dy: placed.finalDy,
            textAnchor: placed.anchor,
            fill: MATH_COLORS.function,
            fontSize: fontScale(9),
            className: "font-bold font-mono select-none",
            children: [
              "Min(",
              sepResult.fMin.toFixed(2),
              ")"
            ]
          }
        ) : null;
      })(),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: mathToDesign(sepResult.xFMax, sepResult.fMax, scale).x,
          cy: mathToDesign(sepResult.xFMax, sepResult.fMax, scale).y,
          r: 4,
          fill: MATH_COLORS.derivative
        }
      ),
      (() => {
        const placed = placedExtremumLabels.find(
          (l) => l.key === "max"
        );
        return placed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: placed.x,
            y: placed.y,
            dy: placed.finalDy,
            textAnchor: placed.anchor,
            fill: MATH_COLORS.derivative,
            fontSize: fontScale(9),
            className: "font-bold font-mono select-none",
            children: [
              "Max(",
              sepResult.fMax.toFixed(2),
              ")"
            ]
          }
        ) : null;
      })()
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: mathToDesign(directResult.xFMin, directResult.fMin, scale).x,
          cy: mathToDesign(directResult.xFMin, directResult.fMin, scale).y,
          r: 4.5,
          fill: MATH_COLORS.function
        }
      ),
      (() => {
        const placed = placedExtremumLabels.find(
          (l) => l.key === "min"
        );
        return placed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: placed.x,
            y: placed.y,
            dy: placed.finalDy,
            textAnchor: placed.anchor,
            fill: MATH_COLORS.function,
            fontSize: fontScale(9),
            className: "font-bold font-mono select-none",
            children: [
              "Min(",
              directResult.fMin.toFixed(2),
              ")"
            ]
          }
        ) : null;
      })()
    ] }) })
  ] });
};
function SingleVarPage() {
  const [funModel, setFunModel] = reactExports.useState(
    "transcendent"
  );
  const [transModel, setTransModel] = reactExports.useState("ln_x_over_x");
  const [showDerivative, setShowDerivative] = reactExports.useState(false);
  const [showTangent, setShowTangent] = reactExports.useState(false);
  const [subMode, setSubMode] = reactExports.useState("sep");
  const [logic, setLogic] = reactExports.useState("always");
  const [params, setParams] = reactExports.useState(() => ({
    a: defaultParams.a,
    a_axis: defaultParams.a_axis,
    m: defaultParams.m,
    n: defaultParams.n
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({ vp, xRange: [-2, 6], yRange: [-1, 5.5] });
  const handleParamChange = (key, value) => {
    setParams((prev) => {
      if (funModel === "transcendent") {
        if (key === "m") {
          const clampedVal = Math.max(0.1, value);
          return {
            ...prev,
            m: clampedVal >= prev.n ? prev.n - 0.1 : clampedVal
          };
        }
        if (key === "n") {
          const clampedVal = Math.max(0.2, value);
          return {
            ...prev,
            n: clampedVal <= prev.m ? prev.m + 0.1 : clampedVal
          };
        }
      }
      if (key === "m" && value >= prev.n) {
        return { ...prev, m: prev.n - 0.1 };
      }
      if (key === "n" && value <= prev.m) {
        return { ...prev, n: prev.m + 0.1 };
      }
      return { ...prev, [key]: value };
    });
  };
  const handleReset = () => {
    setParams({
      a: defaultParams.a,
      a_axis: defaultParams.a_axis,
      m: funModel === "transcendent" ? 0.5 : defaultParams.m,
      n: funModel === "transcendent" ? 2.5 : defaultParams.n
    });
  };
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-constant-single", params, {
      subMode,
      logic,
      funModel,
      transModel
    });
  }, [params, subMode, logic, funModel, transModel]);
  const paramConfigs = reactExports.useMemo(() => {
    const keys = subMode === "sep" ? ["a", "m", "n"] : ["a_axis", "m", "n"];
    return keys.map((key) => {
      const meta = paramMeta[key];
      let min = meta.min;
      let max = meta.max;
      let step = meta.step ?? 0.05;
      let description = meta.description;
      let descriptionFormula = meta.descriptionFormula;
      let marks = meta.marks;
      if (funModel === "transcendent") {
        if (key === "m") {
          min = 0.1;
          max = 3;
          description = "超越函数定义域 x > 0，左边界需大等于 0.1";
          descriptionFormula = "超越函数定义域 $x > 0$，左边界需大等于 0.1";
        } else if (key === "n") {
          min = 0.5;
          max = 5;
          description = "超越函数研究区间的右端点";
        } else if (key === "a") {
          min = -0.5;
          max = 2;
          step = 0.02;
          description = "【主参数-红】目标水平直线 y = a 的位置";
          descriptionFormula = "【主参数-红】目标水平直线 $y = a$ 的位置";
        } else if (key === "a_axis") {
          min = 0.1;
          max = 5;
          description = "【主参数-红】超越函数讨论参数 a";
          descriptionFormula = "【主参数-红】超越函数讨论参数 $a$";
        }
      } else {
        if (key === "a") {
          description = "【主参数-红】代表水平直线 y = a";
        } else if (key === "a_axis") {
          description = "【主参数-红】抛物线对称轴 x = a";
        }
      }
      return {
        key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min,
        max,
        step,
        description,
        descriptionFormula,
        importance: meta.importance,
        marks
      };
    });
  }, [params, subMode, funModel]);
  const formulasLatex = reactExports.useMemo(() => {
    if (subMode === "sep") {
      if (funModel === "transcendent") {
        let polyStr = "";
        if (transModel === "ln_x_over_x") {
          polyStr = `f(x) = \\frac{\\ln x}{x}`;
        } else if (transModel === "exp_minus_ax") {
          polyStr = `f(x) = \\frac{e^x}{x}`;
        } else if (transModel === "a_ln_x_minus_x") {
          polyStr = `f(x) = \\ln x - x + 1`;
        } else if (transModel === "exp_minus_a_x_plus_1") {
          polyStr = `f(x) = \\frac{e^x}{x+1}`;
        }
        const rangeStr = `x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
        const lineStr = `y = \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2)}}`;
        return { line1: `${polyStr} \\quad ${rangeStr}`, line2: lineStr };
      } else {
        const polyStr = `f(x) = x^2 - 2x + 2 \\quad x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
        const lineStr = `y = \\color{${MATH_COLORS.paramPrimary}}{${params.a.toFixed(2)}}`;
        return { line1: polyStr, line2: lineStr };
      }
    } else {
      if (funModel === "transcendent") {
        let line1 = "";
        if (transModel === "ln_x_over_x" || transModel === "exp_minus_ax") {
          line1 = `f(x) = e^x - \\color{${MATH_COLORS.paramPrimary}}{${params.a_axis.toFixed(2)}}x`;
        } else if (transModel === "a_ln_x_minus_x") {
          line1 = `f(x) = \\color{${MATH_COLORS.paramPrimary}}{${params.a_axis.toFixed(2)}}\\ln x - x + 1`;
        } else if (transModel === "exp_minus_a_x_plus_1") {
          line1 = `f(x) = e^x - \\color{${MATH_COLORS.paramPrimary}}{${params.a_axis.toFixed(2)}}(x+1)`;
        }
        const line2 = `x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
        return { line1, line2 };
      } else {
        const line1 = `f(x) = x^2 - 2\\color{${MATH_COLORS.paramPrimary}}{(${params.a_axis.toFixed(2)})}x + 2`;
        const line2 = `x \\in [${params.m.toFixed(2)}, ${params.n.toFixed(2)}]`;
        return { line1, line2 };
      }
    }
  }, [subMode, funModel, transModel, params]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "选择函数模型",
            subtitle: "高考超越函数四大母题与二次函数",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectGrid,
                {
                  items: [
                    { key: "transcendent", label: "超越函数" },
                    { key: "quadratic", label: "二次函数" }
                  ],
                  value: funModel,
                  onChange: (k) => setFunModel(k),
                  variant: "filled",
                  columns: 2
                }
              ),
              funModel === "transcendent" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectGrid,
                {
                  items: [
                    {
                      key: "ln_x_over_x",
                      label: "ln x / x 型",
                      formula: "\\frac{\\ln x}{x} 型"
                    },
                    {
                      key: "exp_minus_ax",
                      label: "e^x - ax 型",
                      formula: "e^x - ax 型"
                    },
                    {
                      key: "a_ln_x_minus_x",
                      label: "a ln x - x + 1 型",
                      formula: "a\\ln x - x + 1 型"
                    },
                    {
                      key: "exp_minus_a_x_plus_1",
                      label: "e^x - a(x+1) 型",
                      formula: "e^x - a(x+1) 型"
                    }
                  ],
                  value: transModel,
                  onChange: (k) => setTransModel(k),
                  variant: "filled",
                  className: "pt-1"
                }
              )
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "研究方法与辅助工具",
            subtitle: "探究方法及导数/切线放缩辅助",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold text-neutral-400 block mb-1", children: "探索目标" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  SelectGrid,
                  {
                    items: [
                      { key: "always", label: "恒成立 (∀x)" },
                      { key: "exist", label: "存在性 (∃x)" }
                    ],
                    value: logic,
                    onChange: (k) => setLogic(k),
                    variant: "filled"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold text-neutral-400 block mb-1", children: "核心解题方法" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  SelectGrid,
                  {
                    items: [
                      { key: "sep", label: "参变分离法" },
                      { key: "direct", label: "直接最值讨论" }
                    ],
                    value: subMode,
                    onChange: (k) => setSubMode(k),
                    variant: "filled"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold text-neutral-400 block mb-1", children: "数形结合辅助图示" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => setShowDerivative(!showDerivative),
                      className: `flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${showDerivative ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white text-neutral-650 border-neutral-200 hover:bg-neutral-50"}`,
                      children: showDerivative ? "隐藏导数 f'(x)" : "显示导数 f'(x)"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => setShowTangent(!showTangent),
                      className: `flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${showTangent ? "bg-amber-600 text-white border-amber-600 shadow-sm" : "bg-white text-neutral-650 border-neutral-200 hover:bg-neutral-50"}`,
                      children: showTangent ? "隐藏切线放缩" : "显示切线放缩"
                    }
                  )
                ] })
              ] })
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: handleReset
          }
        )
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white select-none", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-250 rounded-xl px-4 py-2.5 shadow-md flex flex-col gap-1 font-mono", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-neutral-400 font-bold mb-0.5", children: "高考数学方程" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: formulasLatex.line1, mode: "inline" }) }),
          formulasLatex.line2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm border-t border-neutral-100 pt-1 mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: formulasLatex.line2, mode: "inline" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SingleVarScene,
              {
                subMode,
                logic,
                funModel,
                transModel,
                showDerivative,
                showTangent,
                params,
                scale,
                vp,
                fontScale: canvasSize.font,
                onParamChange: handleParamChange
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
          title: "单自变量看板"
        }
      )
    }
  );
}
export {
  SingleVarPage
};
