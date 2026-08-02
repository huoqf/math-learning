import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { b as MATH_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { d as defaultParams, p as paramMeta, N as NikeScene } from "./nike-BlC8LEpU.js";
import { b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import "./useRadioGroup-DJLu5uAU.js";
import "./CoordinateGrid-fDHVDEJz.js";
import "./coordinate-9upJ5J84.js";
import "./FunctionGraph-DziQOq7W.js";
import "./InteractivePoint-2lsgO1SM.js";
import "./TangentLine-CcHC8eLW.js";
import "./Asymptote-DqWNp8bH.js";
import "./labelAvoider-DY-BzTvY.js";
function StandardPage() {
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-nike", params, { activeMode: "standard" }),
    [params]
  );
  const equationLatex = reactExports.useMemo(() => {
    const aVal = params.a.toFixed(1);
    const bVal = params.b.toFixed(1);
    return `y = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}x + \\frac{\\color{${MATH_COLORS.paramSecondary}}{${bVal}}}{x}`;
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
            title: "典型形态预设",
            subtitle: "快速加载高考典型函数曲线",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: [
                  {
                    key: "nike_std",
                    label: "经典对勾型",
                    formula: "y = x + \\frac{4}{x}"
                  },
                  {
                    key: "streamer_std",
                    label: "双曲飘带型",
                    formula: "y = x - \\frac{4}{x}"
                  },
                  {
                    key: "inverse_std",
                    label: "反比例退化",
                    formula: "y = \\frac{4}{x}, \\; a = 0",
                    fullWidth: true
                  }
                ],
                value: params.a === 1 && params.b === 4 ? "nike_std" : params.a === 1 && params.b === -4 ? "streamer_std" : params.a === 0 ? "inverse_std" : "",
                onChange: (key) => {
                  if (key === "nike_std")
                    setParams((p) => ({ ...p, a: 1, b: 4, h: 0, c: 0 }));
                  else if (key === "streamer_std")
                    setParams((p) => ({ ...p, a: 1, b: -4, h: 0, c: 0 }));
                  else if (key === "inverse_std")
                    setParams((p) => ({ ...p, a: 0, b: 4, h: 0, c: 0 }));
                },
                columns: 2
              }
            )
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
                activeMode: "standard",
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
          title: "对勾与双曲型看板"
        }
      )
    }
  );
}
export {
  StandardPage
};
