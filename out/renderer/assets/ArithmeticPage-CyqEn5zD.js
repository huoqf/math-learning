import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { T as ThreePanel, M as MathPanel, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { d as defaultParams, p as paramMeta, S as SequenceScene } from "./sequence-CjxScWvd.js";
import { b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import "./CoordinateGrid-fDHVDEJz.js";
import "./coordinate-9upJ5J84.js";
import "./FunctionGraph-DziQOq7W.js";
function ArithmeticPage() {
  const [highlightN, setHighlightN] = reactExports.useState(1);
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({ vp, xRange: [-1, 16.5], yRange: [-8, 25] });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-sequence", params, {
      activeMode: "arithmetic",
      subModel: "arith-geo"
    }),
    [params]
  );
  const paramConfigs = reactExports.useMemo(() => {
    return ["a1", "d", "N"].filter((key) => key in paramMeta).map((key) => {
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "等差数列",
            subtitle: "通项公式与前 n 项和的几何直观",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-neutral-600 p-3 bg-neutral-50 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "aₙ = a₁ + (n-1)d，Sₙ = na₁ + n(n-1)d/2" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "参数调节",
            subtitle: "拖动滑块实时观察几何变化",
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
      center: /* @__PURE__ */ jsxRuntimeExports.jsx(
        AnimationSvgCanvas,
        {
          containerRef,
          transform: vp.transform,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            SequenceScene,
            {
              params,
              scale,
              vp,
              fontScale: canvasSize.font,
              activeMode: "arithmetic",
              highlightN,
              onSelectN: setHighlightN
            }
          )
        }
      ),
      right: /* @__PURE__ */ jsxRuntimeExports.jsx(
        MathPanel,
        {
          quantities: mathData.quantities,
          theorems: mathData.theorems,
          gaokaoPoints: mathData.gaokaoPoints,
          warnings: mathData.warnings,
          mnemonic: mathData.mnemonic,
          title: "等差数列看板"
        }
      )
    }
  );
}
export {
  ArithmeticPage
};
