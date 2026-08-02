import { R as React, j as jsxRuntimeExports, r as reactExports } from "./index-DT9BKSox.js";
import { b as MATH_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { P as PRESET_FUNCTIONS, z as solveDerivative, b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import { C as CoordinateGrid } from "./CoordinateGrid-fDHVDEJz.js";
import { F as FunctionGraph } from "./FunctionGraph-DziQOq7W.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { I as InteractivePoint } from "./InteractivePoint-2lsgO1SM.js";
import { T as TangentLine } from "./TangentLine-CcHC8eLW.js";
import { S as SecantLine } from "./SecantLine-uHone8Sl.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import "./useRadioGroup-DJLu5uAU.js";
const DerivativeScene = ({
  fnKey,
  x0,
  dx,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v
}) => {
  const preset = PRESET_FUNCTIONS[fnKey] || PRESET_FUNCTIONS.cubic;
  const fn = preset.fn;
  const res = solveDerivative(fn, x0);
  const x2 = x0 + dx;
  const handleDrag = React.useCallback(
    (mathPt) => {
      onParamChange("x0", Math.round(mathPt.x * 100) / 100);
    },
    [onParamChange]
  );
  const placedLabels = React.useMemo(() => {
    if (!res.isValid) return [];
    const pt = mathToDesign(x0, res.fx, scale);
    const entries = [
      {
        key: "tangent",
        text: `(${x0.toFixed(2)}, ${res.fx.toFixed(2)})`,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: -14,
        priority: 1
      },
      {
        key: "slope",
        text: `k_切 = ${res.slope.toFixed(2)}`,
        x: pt.x,
        y: pt.y,
        anchor: "middle",
        dy: 22
      }
    ];
    return avoidLabels(entries, { fontScale });
  }, [x0, res.fx, res.slope, res.isValid, scale, fontScale]);
  const slopeLabel = React.useMemo(() => {
    if (!res.isValid) return null;
    const pt = mathToDesign(x0, res.fx, scale);
    const placed = placedLabels.find((p) => p.key === "slope");
    const dy = placed ? placed.finalDy : 22;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: pt.x,
        y: pt.y + dy,
        textAnchor: "middle",
        fill: MATH_COLORS.derivative,
        fontSize: fontScale(10),
        fontFamily: "monospace",
        fontWeight: "600",
        className: "select-none pointer-events-none",
        children: `k_切 = ${res.slope.toFixed(2)}`
      }
    );
  }, [x0, res.fx, res.slope, res.isValid, scale, fontScale, placedLabels]);
  const deltaLabels = React.useMemo(() => {
    if (!res.isValid || Math.abs(dx) < 0.3) return null;
    let y2 = NaN;
    try {
      y2 = fn(x2);
    } catch {
      return null;
    }
    if (!Number.isFinite(y2)) return null;
    const midX = x0 + dx / 2;
    const midY = res.fx;
    const midYVert = res.fx + (y2 - res.fx) / 2;
    const midXVert = x0 + dx;
    const pX = mathToDesign(midX, midY, scale);
    const pY = mathToDesign(midXVert, midYVert, scale);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { opacity: 0.9, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: pX.x,
          y: pX.y + (dx >= 0 ? 12 : -6),
          textAnchor: "middle",
          fill: MATH_COLORS.paramSecondary,
          fontSize: fontScale(9.5),
          fontWeight: "600",
          className: "select-none pointer-events-none font-mono",
          children: `Δx = ${dx.toFixed(2)}`
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: pY.x + (dx >= 0 ? 8 : -8),
          y: pY.y + 4,
          textAnchor: dx >= 0 ? "start" : "end",
          fill: MATH_COLORS.paramSecondary,
          fontSize: fontScale(9.5),
          fontWeight: "600",
          className: "select-none pointer-events-none font-mono",
          children: `Δy = ${(y2 - res.fx).toFixed(2)}`
        }
      )
    ] });
  }, [x0, dx, x2, res.fx, res.isValid, scale, fn, fontScale]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn,
        scale,
        color: MATH_COLORS.function,
        strokeWidth: 2.5
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SecantLine,
      {
        fn,
        x1: x0,
        x2,
        scale,
        color: MATH_COLORS.paramSecondary,
        strokeWidth: 1.8,
        showTriangle: true
      }
    ),
    res.isValid && /* @__PURE__ */ jsxRuntimeExports.jsx(
      TangentLine,
      {
        fn,
        x0,
        scale,
        color: MATH_COLORS.tangentLine,
        strokeWidth: 2
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: x0,
        cy: res.isValid ? res.fx : 0,
        scale,
        vp,
        onDrag: handleDrag,
        color: MATH_COLORS.paramPrimary,
        r: 6,
        disabled: !res.isValid,
        label: res.isValid ? `(${x0.toFixed(2)}, ${res.fx.toFixed(2)})` : void 0,
        labelKey: "tangent",
        placedLabels,
        fontScale
      }
    ),
    slopeLabel,
    deltaLabels
  ] });
};
const paramMeta = {
  x0: {
    key: "x0",
    label: "切点 x₀",
    labelFormula: "x_0",
    min: -4,
    max: 4,
    step: 0.1,
    defaultValue: 1,
    description: "切点的横坐标【绑定主色-红】，决定切线所在位置。可直接在图上拖拽该点。",
    importance: "core",
    marks: [{ value: 0, label: "0", variant: "zero" }]
  },
  dx: {
    key: "dx",
    label: "步长 Δx",
    labelFormula: "\\Delta x",
    min: 0.01,
    max: 2,
    step: 0.01,
    defaultValue: 1,
    description: "割线第二点与切点横坐标之差【绑定次色-橙】。调节该值趋近于0以观察割线逼近切线。",
    importance: "advanced",
    marks: [
      { value: 0.01, label: "0.01 (极小)", variant: "zero" },
      { value: 1, label: "1.0" },
      { value: 2, label: "2.0" }
    ]
  }
};
const defaultParams = {
  dx: 1
};
function DerivativeAnimation() {
  const [fnKey, setFnKey] = reactExports.useState("cubic");
  const [params, setParams] = reactExports.useState(() => ({
    x0: PRESET_FUNCTIONS.cubic.defaultX0,
    dx: defaultParams.dx
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-5, 5],
    yRange: [-4, 4]
  });
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-derivative-tangent", params, { fnKey });
  }, [params, fnKey]);
  const handleParamChange = (key, value) => {
    let clampedValue = value;
    const preset2 = PRESET_FUNCTIONS[fnKey];
    if (key === "x0") {
      clampedValue = Math.max(
        preset2.x0Range[0],
        Math.min(preset2.x0Range[1], value)
      );
    } else if (key === "dx") {
      clampedValue = Math.max(0.01, Math.min(2, value));
    }
    setParams((prev) => ({ ...prev, [key]: clampedValue }));
  };
  const handleFnKeyChange = (key) => {
    setFnKey(key);
    const preset2 = PRESET_FUNCTIONS[key];
    setParams({
      x0: preset2.defaultX0,
      dx: defaultParams.dx
    });
  };
  const handleReset = () => {
    const preset2 = PRESET_FUNCTIONS[fnKey];
    setParams({
      x0: preset2.defaultX0,
      dx: defaultParams.dx
    });
  };
  const preset = PRESET_FUNCTIONS[fnKey];
  const paramConfigs = reactExports.useMemo(() => {
    return Object.entries(paramMeta).map(([key, meta]) => {
      let min = meta.min;
      let max = meta.max;
      let marks = meta.marks;
      if (key === "x0") {
        min = preset.x0Range[0];
        max = preset.x0Range[1];
        if (fnKey === "rational" || fnKey === "sqrt") {
          marks = [
            { value: preset.x0Range[0], label: preset.x0Range[0].toString() },
            { value: 0, label: "0 (不可导)", variant: "critical" },
            { value: preset.x0Range[1], label: preset.x0Range[1].toString() }
          ];
        } else if (fnKey === "xlnx" || fnKey === "lnx_x") {
          marks = [
            { value: 0.1, label: "0.1 (边界)", variant: "critical" },
            { value: preset.x0Range[1], label: preset.x0Range[1].toString() }
          ];
        } else {
          marks = [
            { value: preset.x0Range[0], label: preset.x0Range[0].toString() },
            { value: 0, label: "0", variant: "zero" },
            { value: preset.x0Range[1], label: preset.x0Range[1].toString() }
          ];
        }
      }
      return {
        key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min,
        max,
        step: meta.step ?? 0.1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks
      };
    });
  }, [params, fnKey, preset]);
  const equationLatex = reactExports.useMemo(() => {
    const fnName = preset.latex.replace("f(x) = ", "");
    return `f(x) = ${fnName}`;
  }, [preset]);
  const x0ColorHex = MATH_COLORS.paramPrimary;
  const dxColorHex = MATH_COLORS.paramSecondary;
  const secantLatex = `k_{\\text{割}} = \\frac{f(\\color{${x0ColorHex}}{x_0} + \\color{${dxColorHex}}{\\Delta x}) - f(\\color{${x0ColorHex}}{x_0})}{\\color{${dxColorHex}}{\\Delta x}}`;
  const limitLatex = `f'(\\color{${x0ColorHex}}{x_0}) = \\lim_{\\color{${dxColorHex}}{\\Delta x} \\to 0} k_{\\text{割}}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "函数模型", subtitle: "选择教学函数", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: Object.entries(PRESET_FUNCTIONS).map(([key, p]) => ({
              key,
              label: p.label,
              formula: p.latex
            })),
            value: fnKey,
            onChange: (k) => handleFnKeyChange(k),
            variant: "filled"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "参数调节", subtitle: "改变切点与割线步长", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: handleReset
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "教学提示", subtitle: "数形结合理解导数", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-xs text-neutral-600 leading-relaxed", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 bg-neutral-50 rounded-lg border border-neutral-100", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-neutral-700 mb-1", children: "虚线几何含义：" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "list-disc list-inside space-y-1 text-neutral-600", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-[#DC2626]", children: "红色虚线 (切线)" }),
                "： 曲线在切点",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[#EF4444]", children: "x₀" }),
                " ",
                "处的切线，斜率等同于该点的导数值",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[#EF4444]", children: "f'(x₀)" }),
                "。"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-[#D97706]", children: "橙色虚线 (割线)" }),
                "： 连接切点与邻近动点",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[#EF4444]", children: "x₀" }),
                " +",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[#D97706]", children: "Δx" }),
                " ",
                "的割线，斜率代表区间平均变化率。"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2.5 bg-primary-50/40 rounded-lg border border-primary-100/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-primary-900 mb-1", children: "极限逼近互动：" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-2", children: [
              "尝试将",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-[#D97706]", children: "步长 Δx" }),
              " ",
              "调小，观察橙色割线如何旋转并最终重合至红色切线："
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-1.5 p-1 bg-white rounded border border-neutral-100 text-center shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              KatexFormula,
              {
                formula: `\\lim_{\\color{${MATH_COLORS.paramSecondary}}{\\Delta x} \\to 0} k_{\\text{割}} = k_{\\text{切}}`,
                mode: "inline"
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "这就是极限定义，即割线斜率的极限就是切线斜率。" })
          ] })
        ] }) })
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-4 left-4 z-10 flex flex-col gap-1.5 bg-white/95 backdrop-blur border border-neutral-200 rounded-lg p-3 shadow-md select-none max-w-[280px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold text-neutral-500 border-b border-neutral-100 pb-1", children: "函数公式与几何定义" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 py-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: equationLatex, mode: "inline" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: secantLatex, mode: "inline" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: limitLatex, mode: "inline" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              DerivativeScene,
              {
                fnKey,
                x0: params.x0,
                dx: params.dx,
                scale,
                vp,
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
          title: "导数几何意义看板"
        }
      )
    }
  );
}
export {
  DerivativeAnimation
};
