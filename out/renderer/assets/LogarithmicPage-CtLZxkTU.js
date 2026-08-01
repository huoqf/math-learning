import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { b as MATH_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { d as defaultParams, p as paramMeta, E as ExpLogScene } from "./funcExpLog-y5U3zwXn.js";
import { b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import "./CoordinateGrid-BmMyIyOq.js";
import "./coordinate-9upJ5J84.js";
import "./FunctionGraph-DoU6C8dJ.js";
import "./InteractivePoint-ZTf14j6W.js";
import "./Asymptote-CeJ5uPCO.js";
import "./labelAvoider-DY-BzTvY.js";
function LogarithmicPage() {
  const [params, setParams] = reactExports.useState(() => ({ ...defaultParams }));
  const [showInverse, setShowInverse] = reactExports.useState(false);
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-func-explog", params, {
      subExpLog: "logarithmic"
    }),
    [params]
  );
  const formulaLatex = reactExports.useMemo(() => {
    const aVal = (params.baseA ?? 2).toFixed(1);
    return showInverse ? `y = \\log_{\\color{${MATH_COLORS.paramPrimary}}{${aVal}}} x \\iff x = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}^y` : `y = \\log_{\\color{${MATH_COLORS.paramPrimary}}{${aVal}}} x`;
  }, [showInverse, params.baseA]);
  const paramConfigs = reactExports.useMemo(() => {
    const keys = ["x0", "baseA"];
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "对数函数", subtitle: "y = logₐx 的图像与性质", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs text-neutral-600 cursor-pointer select-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: showInverse,
              onChange: (e) => setShowInverse(e.target.checked),
              className: "rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            }
          ),
          "显示反函数对称 (y = x)"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "参数调节",
            subtitle: "调节参数观察曲线与几何演变",
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
              ExpLogScene,
              {
                params,
                scale,
                vp,
                onParamChange: handleParamChange,
                fontScale: canvasSize.font,
                funcType: "logarithmic",
                showInverse
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
          title: "对数函数看板"
        }
      )
    }
  );
}
export {
  LogarithmicPage
};
