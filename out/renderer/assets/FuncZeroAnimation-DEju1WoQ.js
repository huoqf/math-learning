import { R as React, j as jsxRuntimeExports, r as reactExports } from "./index-DT9BKSox.js";
import { b as MATH_COLORS, w as withAlpha, c as CANVAS_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { C as CoordinateGrid } from "./CoordinateGrid-fDHVDEJz.js";
import { F as FunctionGraph } from "./FunctionGraph-DziQOq7W.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { I as InteractivePoint } from "./InteractivePoint-2lsgO1SM.js";
import { I as IntervalShadow } from "./IntervalShadow-Dr5gFM2D.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import { s as solveBisection, b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
function ZeroScene({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v
}) {
  const m = params.intervalM ?? -1;
  const n = params.intervalN ?? 2.5;
  const steps = Math.max(1, Math.round(params.bisectionSteps ?? 3));
  const handleDragM = (mathPt) => {
    onParamChange("intervalM", Math.round(mathPt.x * 10) / 10);
  };
  const handleDragN = (mathPt) => {
    onParamChange("intervalN", Math.round(mathPt.x * 10) / 10);
  };
  const placedLabels = React.useMemo(() => {
    const entries = [];
    const ptM = mathToDesign(m, 0, scale);
    const ptN = mathToDesign(n, 0, scale);
    entries.push(
      {
        key: "m",
        text: `m=${m.toFixed(1)}`,
        x: ptM.x,
        y: ptM.y,
        anchor: "middle",
        dy: -12
      },
      {
        key: "n",
        text: `n=${n.toFixed(1)}`,
        x: ptN.x,
        y: ptN.y,
        anchor: "middle",
        dy: -12
      }
    );
    return avoidLabels(entries, { fontScale });
  }, [m, n, scale, fontScale]);
  const targetFn = (x) => x * x * x - x - 2;
  const bisectionRes = solveBisection(targetFn, m, n, steps);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FunctionGraph,
      {
        fn: targetFn,
        scale,
        color: MATH_COLORS.function,
        strokeWidth: 2.5
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      IntervalShadow,
      {
        fn: targetFn,
        x1: m,
        x2: n,
        scale,
        fillColor: withAlpha(MATH_COLORS.function, 0.15)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: scale.originX + m * scale.scaleX,
        y1: scale.originY - 4.5 * scale.scaleY,
        x2: scale.originX + m * scale.scaleX,
        y2: scale.originY + 4.5 * scale.scaleY,
        stroke: MATH_COLORS.paramPrimary,
        strokeWidth: 1.5,
        strokeDasharray: "4 4"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: m,
        cy: 0,
        scale,
        vp,
        onDrag: handleDragM,
        color: MATH_COLORS.paramPrimary,
        label: `m=${m.toFixed(1)}`,
        labelKey: "m",
        placedLabels,
        fontScale
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: scale.originX + n * scale.scaleX,
        y1: scale.originY - 4.5 * scale.scaleY,
        x2: scale.originX + n * scale.scaleX,
        y2: scale.originY + 4.5 * scale.scaleY,
        stroke: MATH_COLORS.paramSecondary,
        strokeWidth: 1.5,
        strokeDasharray: "4 4"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: n,
        cy: 0,
        scale,
        vp,
        onDrag: handleDragN,
        color: MATH_COLORS.paramSecondary,
        label: `n=${n.toFixed(1)}`,
        labelKey: "n",
        placedLabels,
        fontScale
      }
    ),
    bisectionRes.currentStep && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: scale.originX + bisectionRes.currentStep.mid * scale.scaleX,
          y1: scale.originY - 4.5 * scale.scaleY,
          x2: scale.originX + bisectionRes.currentStep.mid * scale.scaleX,
          y2: scale.originY + 4.5 * scale.scaleY,
          stroke: MATH_COLORS.tangentLine,
          strokeWidth: 2
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: scale.originX + bisectionRes.currentStep.mid * scale.scaleX,
          cy: scale.originY - targetFn(bisectionRes.currentStep.mid) * scale.scaleY,
          r: 6,
          fill: MATH_COLORS.tangentLine,
          stroke: CANVAS_COLORS.white,
          strokeWidth: 2
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: scale.originX + bisectionRes.currentStep.mid * scale.scaleX + 8,
          y: scale.originY - targetFn(bisectionRes.currentStep.mid) * scale.scaleY - 8,
          fill: MATH_COLORS.tangentLine,
          fontSize: fontScale(12),
          fontWeight: "extrabold",
          children: `mid Step${steps}: ${bisectionRes.currentStep.mid.toFixed(3)}`
        }
      )
    ] })
  ] });
}
const defaultParams = {
  intervalM: -1,
  intervalN: 2.5,
  bisectionSteps: 3
};
const paramMeta = {
  intervalM: {
    key: "intervalM",
    label: "零点区间左端点 m",
    labelFormula: "m",
    min: -3,
    max: 3,
    step: 0.1,
    defaultValue: -1,
    importance: "advanced",
    description: "零点存在性定理与二分逼近法研究区间的左边界"
  },
  intervalN: {
    key: "intervalN",
    label: "零点区间右端点 n",
    labelFormula: "n",
    min: -2,
    max: 4,
    step: 0.1,
    defaultValue: 2.5,
    importance: "advanced",
    description: "零点存在性定理与二分逼近法研究区间的右边界"
  },
  bisectionSteps: {
    key: "bisectionSteps",
    label: "二分逼近步数 Step",
    labelFormula: "\\text{Step}",
    min: 1,
    max: 8,
    step: 1,
    defaultValue: 3,
    importance: "core",
    description: "二分逼近法迭代切分次数，次数越多误差越小"
  }
};
function FuncZeroAnimation() {
  const [params, setParams] = reactExports.useState(() => ({ ...defaultParams }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5]
  });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-func-zero", params),
    [params]
  );
  const formulaLatex = "f(x) = x^3 - x - 2 = 0 \\quad (f(a) \\cdot f(b) < 0)";
  const paramConfigs = reactExports.useMemo(() => {
    const keys = ["intervalM", "intervalN", "bisectionSteps"];
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
  }, [params]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanel, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        LeftPanelSection,
        {
          title: "零点逼近参数",
          subtitle: "调节区间与步数观察二分逼近",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            ParamControl,
            {
              params: paramConfigs,
              onParamChange: handleParamChange,
              onReset: () => setParams({ ...defaultParams })
            }
          )
        }
      ) }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: formulaLatex, mode: "inline" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              ZeroScene,
              {
                params,
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
          title: "零点逼近看板"
        }
      )
    }
  );
}
export {
  FuncZeroAnimation
};
