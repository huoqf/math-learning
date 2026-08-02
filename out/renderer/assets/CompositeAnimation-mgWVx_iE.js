import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { b as MATH_COLORS, c as CANVAS_COLORS, w as withAlpha, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { C as CoordinateGrid } from "./CoordinateGrid-fDHVDEJz.js";
import { F as FunctionGraph } from "./FunctionGraph-DziQOq7W.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { I as InteractivePoint } from "./InteractivePoint-2lsgO1SM.js";
import { A as Asymptote } from "./Asymptote-DqWNp8bH.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import { w as calculatePiecewise, x as calculateComposite, b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import "./useRadioGroup-DJLu5uAU.js";
function CompositeScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  subMode,
  outerType
}) {
  const x0 = params.x0 ?? 1;
  const xSample = params.xSample ?? 1.5;
  const placedLabels = reactExports.useMemo(() => {
    const entries = [];
    if (subMode === "piecewise") {
      const pt = mathToDesign(x0, 0, scale);
      entries.push({
        key: "x0",
        text: `x₀ = ${x0.toFixed(1)}`,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: -12
      });
    } else {
      const pt = mathToDesign(xSample, 0, scale);
      entries.push({
        key: "xSample",
        text: `x = ${xSample.toFixed(1)}`,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: -12
      });
    }
    return avoidLabels(entries, { fontScale });
  }, [subMode, x0, xSample, scale, fontScale]);
  if (subMode === "piecewise") {
    const leftSlope = params.leftSlope ?? 1;
    const leftConst = params.leftConst ?? 0;
    const rightSlope = params.rightSlope ?? -0.5;
    const rightConst = params.rightConst ?? 1.5;
    const res = calculatePiecewise({
      x0,
      leftSlope,
      leftConst,
      rightSlope,
      rightConst
    });
    const handleDragX0 = (mathPt) => {
      onParamChange("x0", Math.round(mathPt.x * 2) / 2);
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Asymptote,
        {
          type: "vertical",
          value: x0,
          scale,
          color: MATH_COLORS.asymptote,
          label: `x₀ = ${x0.toFixed(1)}`,
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => x <= x0 ? leftSlope * x + leftConst : NaN,
          scale,
          color: MATH_COLORS.function,
          strokeWidth: 2.8
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => x > x0 ? rightSlope * x + rightConst : NaN,
          scale,
          color: MATH_COLORS.paramPrimary,
          strokeWidth: 2.8
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: scale.originX + x0 * scale.scaleX,
          cy: scale.originY - res.leftValAtX0 * scale.scaleY,
          r: 5,
          fill: MATH_COLORS.function
        }
      ),
      !res.isContinuous && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: scale.originX + x0 * scale.scaleX,
          cy: scale.originY - res.rightValAtX0 * scale.scaleY,
          r: 5,
          fill: CANVAS_COLORS.white,
          stroke: MATH_COLORS.paramPrimary,
          strokeWidth: 2
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: x0,
          cy: 0,
          scale,
          vp,
          onDrag: handleDragX0,
          label: `x₀ = ${x0.toFixed(1)}`,
          labelKey: "x0",
          placedLabels,
          color: MATH_COLORS.paramPrimary,
          fontScale
        }
      )
    ] });
  } else {
    const innerB = params.innerB ?? -2;
    const innerC = params.innerC ?? 2;
    const res = calculateComposite({ xSample, innerB, innerC, outerType });
    const gFn = (x) => x * x + innerB * x + innerC;
    const handleDragXSample = (mathPt) => {
      onParamChange("xSample", Math.round(mathPt.x * 10) / 10);
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: gFn,
          scale,
          color: MATH_COLORS.function,
          strokeWidth: 2.5
        }
      ),
      res.isValid && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: scale.originX + xSample * scale.scaleX,
          y1: scale.originY,
          x2: scale.originX + xSample * scale.scaleX,
          y2: scale.originY - res.u * scale.scaleY,
          stroke: withAlpha(MATH_COLORS.paramSecondary, 0.7),
          strokeWidth: 1.5,
          strokeDasharray: "3 3"
        }
      ),
      res.isValid && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: scale.originX + xSample * scale.scaleX,
          cy: scale.originY - res.u * scale.scaleY,
          r: 5,
          fill: MATH_COLORS.paramSecondary
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: xSample,
          cy: 0,
          scale,
          vp,
          onDrag: handleDragXSample,
          label: `x = ${xSample.toFixed(1)}`,
          labelKey: "xSample",
          placedLabels,
          color: MATH_COLORS.paramPrimary,
          fontScale
        }
      )
    ] });
  }
}
const defaultParams = {
  x0: 1,
  leftSlope: 1,
  leftConst: 0,
  rightSlope: -0.5,
  rightConst: 1.5,
  xSample: 1.5,
  innerB: -2,
  innerC: 2
};
const paramMeta = {
  x0: {
    key: "x0",
    label: "分界点 x0",
    labelFormula: "x_0",
    min: -3,
    max: 3,
    step: 0.5,
    defaultValue: 1,
    importance: "core",
    description: "分段函数的临界接缝位置，决定左右段定义域分割"
  },
  leftSlope: {
    key: "leftSlope",
    label: "左段斜率 k1",
    labelFormula: "k_1",
    min: -3,
    max: 3,
    step: 0.5,
    defaultValue: 1,
    importance: "core",
    description: "x ≤ x0 时左段直线 f1(x) 的斜率",
    descriptionFormula: "x \\le x_0 \\text{ 时左段直线 } f_1(x) \\text{ 的斜率}"
  },
  leftConst: {
    key: "leftConst",
    label: "左段截距 b1",
    labelFormula: "b_1",
    min: -3,
    max: 3,
    step: 0.5,
    defaultValue: 0,
    importance: "core",
    description: "x ≤ x0 时左段直线 f1(x) 的常数项",
    descriptionFormula: "x \\le x_0 \\text{ 时左段直线 } f_1(x) \\text{ 的常数项}"
  },
  rightSlope: {
    key: "rightSlope",
    label: "右段斜率 k2",
    labelFormula: "k_2",
    min: -3,
    max: 3,
    step: 0.5,
    defaultValue: -0.5,
    importance: "core",
    description: "x > x0 时右段直线 f2(x) 的斜率",
    descriptionFormula: "$x > x_0$ 时右段直线 $f_2(x)$ 的斜率"
  },
  rightConst: {
    key: "rightConst",
    label: "右段截距 b2",
    labelFormula: "b_2",
    min: -3,
    max: 3,
    step: 0.5,
    defaultValue: 1.5,
    importance: "core",
    description: "x > x0 时右段直线 f2(x) 的常数项",
    descriptionFormula: "$x > x_0$ 时右段直线 $f_2(x)$ 的常数项"
  },
  xSample: {
    key: "xSample",
    label: "自变量采样点 x",
    labelFormula: "x",
    min: -3,
    max: 3,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
    description: "复合函数 f(g(x)) 研究传导路径与单调性的自变量采样点",
    descriptionFormula: "\\text{复合函数 } f(g(x)) \\text{ 研究传导路径与单调性的自变量采样点}"
  },
  innerB: {
    key: "innerB",
    label: "内层 b 参数",
    labelFormula: "b",
    min: -4,
    max: 4,
    step: 0.5,
    defaultValue: -2,
    importance: "advanced",
    description: "内层二次函数 g(x) = x² + bx + c 的一次项系数，决定对称轴位置",
    descriptionFormula: "\\text{内层二次函数 } g(x) = x^2 + bx + c \\text{ 的一次项系数，决定对称轴位置}"
  },
  innerC: {
    key: "innerC",
    label: "内层 c 参数",
    labelFormula: "c",
    min: -2,
    max: 4,
    step: 0.5,
    defaultValue: 2,
    importance: "core",
    description: "内层二次函数 g(x) 的常数项",
    descriptionFormula: "内层二次函数 $g(x)$ 的常数项"
  }
};
function CompositeAnimation() {
  const [params, setParams] = reactExports.useState(() => ({ ...defaultParams }));
  const [subMode, setSubMode] = reactExports.useState(
    "piecewise"
  );
  const [outerType, setOuterType] = reactExports.useState(
    "exp"
  );
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5]
  });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-func-composite", params, {
      subMode,
      outerType
    }),
    [params, subMode, outerType]
  );
  const formulaLatex = reactExports.useMemo(() => {
    if (subMode === "piecewise") {
      const x0Val = (params.x0 ?? 1).toFixed(1);
      const k1 = (params.leftSlope ?? 1).toFixed(1);
      const b1 = (params.leftConst ?? 0).toFixed(1);
      const k2 = (params.rightSlope ?? -0.5).toFixed(1);
      const b2 = (params.rightConst ?? 1.5).toFixed(1);
      return `f(x) = \\begin{cases} ${k1}x + ${b1}, & x \\le \\color{#EF4444}{${x0Val}} \\\\ ${k2}x + ${b2}, & x > \\color{#EF4444}{${x0Val}} \\end{cases}`;
    } else {
      const bVal = (params.innerB ?? -2).toFixed(1);
      const cVal = (params.innerC ?? 2).toFixed(1);
      const innerStr = `g(x) = x^2 + (\\color{#EF4444}{${bVal}})x + \\color{#D97706}{${cVal}}`;
      if (outerType === "exp") {
        return `y = f(g(x)) = 2^{${innerStr}}`;
      } else if (outerType === "log") {
        return `y = f(g(x)) = \\log_2(${innerStr})`;
      } else {
        return `y = f(g(x)) = -(${innerStr} - 2)^2 + 4`;
      }
    }
  }, [
    subMode,
    outerType,
    params.x0,
    params.leftSlope,
    params.leftConst,
    params.rightSlope,
    params.rightConst,
    params.innerB,
    params.innerC
  ]);
  const paramConfigs = reactExports.useMemo(() => {
    const keysByMode = {
      piecewise: ["x0", "leftSlope", "leftConst", "rightSlope", "rightConst"],
      composite: ["xSample", "innerB", "innerC"]
    };
    const keys = keysByMode[subMode] ?? [];
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
  }, [params, subMode]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          LeftPanelSection,
          {
            title: "研究模式",
            subtitle: "选择分段函数或复合函数单调性",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectGrid,
                {
                  items: [
                    { key: "piecewise", label: "分段函数连续性" },
                    { key: "composite", label: "复合函数同增异减" }
                  ],
                  value: subMode,
                  onChange: (k) => setSubMode(k),
                  columns: 1,
                  className: "mb-3"
                }
              ),
              subMode === "composite" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectGrid,
                {
                  items: [
                    { key: "exp", label: "y = 2^u", formula: "y = 2^u" },
                    { key: "log", label: "y = log₂ u", formula: "y = \\log_2 u" },
                    {
                      key: "quadratic",
                      label: "y = -(u-2)²+4",
                      formula: "y = -(u-2)^2+4",
                      fullWidth: true
                    }
                  ],
                  value: outerType,
                  onChange: (k) => setOuterType(k),
                  variant: "outline",
                  columns: 2,
                  className: "mb-4"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "参数调节", subtitle: "调节临界点与各段参数", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: () => setParams({ ...defaultParams })
          }
        ) })
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: formulaLatex, mode: "inline" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              CompositeScene,
              {
                params,
                scale,
                vp,
                onParamChange: handleParamChange,
                fontScale: canvasSize.font,
                subMode,
                outerType
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
          title: subMode === "piecewise" ? "分段函数看板" : "复合函数看板"
        }
      )
    }
  );
}
export {
  CompositeAnimation
};
