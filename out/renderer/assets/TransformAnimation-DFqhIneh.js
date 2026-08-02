import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { w as withAlpha, b as MATH_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { T as TabSwitcher } from "./TabSwitcher--Cq6ch7f.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { C as CoordinateGrid } from "./CoordinateGrid-fDHVDEJz.js";
import { F as FunctionGraph } from "./FunctionGraph-DziQOq7W.js";
import { V as VectorArrow } from "./VectorArrow-DV8pzlQL.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { I as InteractivePoint } from "./InteractivePoint-2lsgO1SM.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import { t as calculateTransform, u as evalBaseFunction, v as evalTransformedFunction, b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import "./useRadioGroup-DJLu5uAU.js";
function TransformScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  fnType,
  foldMode
}) {
  const h = params.h ?? 1;
  const k = params.k ?? 0.5;
  const A = params.A ?? 1.5;
  const omega = params.omega ?? 1;
  const transformParams = { h, k, A, omega, foldMode };
  const res = calculateTransform(fnType, transformParams);
  const handleDragPoint = (mathPt) => {
    const roundH = Math.round(mathPt.x * 2) / 2;
    const roundK = Math.round(mathPt.y * 2) / 2;
    onParamChange("h", roundH);
    onParamChange("k", roundK);
  };
  const placedLabels = reactExports.useMemo(() => {
    const pt = mathToDesign(h, k, scale);
    const entries = [
      {
        key: "P",
        text: `P(h=${h.toFixed(1)}, k=${k.toFixed(1)})`,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: -12
      }
    ];
    return avoidLabels(entries, { fontScale });
  }, [h, k, scale, fontScale]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => evalBaseFunction(fnType, x),
        scale,
        color: withAlpha(MATH_COLORS.function, 0.4),
        strokeWidth: 1.8,
        strokeDasharray: "4 4"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: (x) => evalTransformedFunction(fnType, transformParams, x),
        scale,
        color: MATH_COLORS.paramPrimary,
        strokeWidth: 2.8
      }
    ),
    res.keyPoints.map((pt, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        VectorArrow,
        {
          from: [pt.original.x, pt.original.y],
          to: [pt.transformed.x, pt.transformed.y],
          scale,
          color: withAlpha(MATH_COLORS.paramSecondary, 0.7),
          strokeWidth: 1.5,
          strokeDasharray: "2 2",
          fontScale
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: scale.originX + pt.original.x * scale.scaleX,
          cy: scale.originY - pt.original.y * scale.scaleY,
          r: 4,
          fill: withAlpha(MATH_COLORS.function, 0.5)
        }
      )
    ] }, idx)),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: h,
        cy: k,
        scale,
        vp,
        onDrag: handleDragPoint,
        label: `P(h=${h.toFixed(1)}, k=${k.toFixed(1)})`,
        labelKey: "P",
        placedLabels,
        color: MATH_COLORS.paramPrimary,
        fontScale
      }
    )
  ] });
}
const defaultParams = {
  h: 1,
  k: 0.5,
  A: 1.5,
  omega: 1
};
const paramMeta = {
  h: {
    key: "h",
    label: "左右平移量 h",
    labelFormula: "h",
    min: -3,
    max: 3,
    step: 0.5,
    defaultValue: 1,
    importance: "core",
    description: "控制图像沿 x 轴左右平移：h > 0 向右，h < 0 向左",
    descriptionFormula: "y = f(x - \\color{#EF4444}{h})",
    marks: [{ value: 0, label: "无平移", labelFormula: "h = 0" }]
  },
  k: {
    key: "k",
    label: "上下平移量 k",
    labelFormula: "k",
    min: -3,
    max: 3,
    step: 0.5,
    defaultValue: 0.5,
    importance: "core",
    description: "控制图像沿 y 轴上下平移：k > 0 向上，k < 0 向下",
    descriptionFormula: "y = f(x) + \\color{#D97706}{k}",
    marks: [{ value: 0, label: "无平移", labelFormula: "k = 0" }]
  },
  A: {
    key: "A",
    label: "纵向伸缩 A",
    labelFormula: "A",
    min: -2.5,
    max: 2.5,
    step: 0.5,
    defaultValue: 1.5,
    importance: "core",
    description: "控制图像纵向拉伸与 y 轴翻转：|A| > 1 拉伸，A < 0 沿 x 轴翻转",
    descriptionFormula: "y = \\color{#EF4444}{A} f(x)",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "退化 (A=0)",
        labelFormula: "A = 0"
      },
      { value: 1, label: "标准", labelFormula: "A = 1" }
    ]
  },
  omega: {
    key: "omega",
    label: "横向伸缩 ω",
    labelFormula: "\\omega",
    min: 0.2,
    max: 3,
    step: 0.2,
    defaultValue: 1,
    importance: "advanced",
    description: "控制图像横向压缩与拉伸：ω > 1 压缩，0 < ω < 1 拉伸",
    descriptionFormula: "y = f(\\color{#D97706}{\\omega} x)",
    marks: [{ value: 1, label: "标准", labelFormula: "\\omega = 1" }]
  }
};
function TransformAnimation() {
  const [params, setParams] = reactExports.useState(() => ({ ...defaultParams }));
  const [fnType, setFnType] = reactExports.useState("quadratic");
  const [foldMode, setFoldMode] = reactExports.useState("none");
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5]
  });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-func-transform", params, { fnType, foldMode }),
    [params, fnType, foldMode]
  );
  const formulaLatex = reactExports.useMemo(() => {
    const hVal = (params.h ?? 1).toFixed(1);
    const kVal = (params.k ?? 0.5).toFixed(1);
    const aVal = (params.A ?? 1.5).toFixed(1);
    const wVal = (params.omega ?? 1).toFixed(1);
    let baseStr = "";
    switch (fnType) {
      case "quadratic":
        baseStr = `(${wVal}(x - \\color{${MATH_COLORS.paramPrimary}}{${hVal}}))^2`;
        break;
      case "sine":
        baseStr = `\\sin(${wVal}(x - \\color{${MATH_COLORS.paramPrimary}}{${hVal}}))`;
        break;
      case "cubic":
        baseStr = `(${wVal}(x - \\color{${MATH_COLORS.paramPrimary}}{${hVal}}))^3`;
        break;
      case "exp":
        baseStr = `2^{${wVal}(x - \\color{${MATH_COLORS.paramPrimary}}{${hVal}})}`;
        break;
    }
    let coreLatex = `\\color{${MATH_COLORS.paramPrimary}}{${aVal}} \\cdot ${baseStr} + \\color{${MATH_COLORS.paramSecondary}}{${kVal}}`;
    if (foldMode === "global") {
      return `y = \\left| ${coreLatex} \\right|`;
    } else if (foldMode === "input") {
      return `y = f(|x|) = T\\left[ f(|x|) \\right]`;
    }
    return `y = ${coreLatex}`;
  }, [fnType, foldMode, params.h, params.k, params.A, params.omega]);
  const paramConfigs = reactExports.useMemo(() => {
    return Object.keys(paramMeta).map((key) => {
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
  }, [params]);
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
            title: "基准函数与变换法则",
            subtitle: "选择基准函数与绝对值翻折模式",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectGrid,
                {
                  items: [
                    { key: "quadratic", label: "y = x²", formula: "y = x^2" },
                    { key: "sine", label: "y = sin x", formula: "y = \\sin x" },
                    { key: "cubic", label: "y = x³", formula: "y = x^3" },
                    { key: "exp", label: "y = 2^x", formula: "y = 2^x" }
                  ],
                  value: fnType,
                  onChange: (k) => setFnType(k),
                  variant: "outline",
                  className: "mb-3"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-semibold text-neutral-500 mb-1", children: "绝对值翻折模式：" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TabSwitcher,
                {
                  tabs: [
                    { key: "none", label: "无翻折", formula: "\\text{无翻折}" },
                    {
                      key: "global",
                      label: "|f(x)| 整体",
                      formula: "|f(x)| \\text{ 整体}"
                    },
                    {
                      key: "input",
                      label: "f(|x|) 自变量",
                      formula: "f(|x|) \\text{ 自变量}"
                    }
                  ],
                  value: foldMode,
                  onChange: (k) => setFoldMode(k),
                  className: "mb-4"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "平移与伸缩参数",
            subtitle: "拖动滑块或拖拽中屏控制点",
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: formulaLatex, mode: "inline" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              TransformScene,
              {
                params,
                scale,
                vp,
                onParamChange: handleParamChange,
                fontScale: canvasSize.font,
                fnType,
                foldMode
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
          title: "图象变换看板"
        }
      )
    }
  );
}
export {
  TransformAnimation
};
