import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { b as MATH_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { d as defaultParams, p as paramMeta, N as NikeScene } from "./nike-BlC8LEpU.js";
import { b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import "./CoordinateGrid-fDHVDEJz.js";
import "./coordinate-9upJ5J84.js";
import "./FunctionGraph-DziQOq7W.js";
import "./InteractivePoint-2lsgO1SM.js";
import "./TangentLine-CcHC8eLW.js";
import "./Asymptote-DqWNp8bH.js";
import "./labelAvoider-DY-BzTvY.js";
function AmgmPage() {
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-nike", params, { activeMode: "amgm" }),
    [params]
  );
  const equationLatex = reactExports.useMemo(() => {
    const aVal = params.a.toFixed(1);
    const bVal = params.b.toFixed(1);
    return `f(x) = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}x + \\frac{\\color{${MATH_COLORS.paramSecondary}}{${bVal}}}{x} \\ge 2\\sqrt{\\color{${MATH_COLORS.paramPrimary}}{${aVal}} \\cdot \\color{${MATH_COLORS.paramSecondary}}{${bVal}}}`;
  }, [params.a, params.b]);
  const paramConfigs = reactExports.useMemo(() => {
    const keys = ["a", "b", "x0"];
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
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "均值不等式",
            subtitle: "AM-GM 不等式的几何直观",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-neutral-600 p-3 bg-neutral-50 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                  "a, b ",
                  ">",
                  " 0"
                ] }),
                " 时："
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-xs", children: "ax + b/x ≥ 2√(ab)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-400 text-xs mt-1", children: "等号成立条件：ax = b/x → x = √(b/a)" })
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "动态参数调节",
            subtitle: "拖动滑块或中屏控制点探索",
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
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: equationLatex, mode: "inline" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              NikeScene,
              {
                params,
                scale,
                vp,
                activeMode: "amgm",
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
          title: "均值不等式看板"
        }
      )
    }
  );
}
export {
  AmgmPage
};
