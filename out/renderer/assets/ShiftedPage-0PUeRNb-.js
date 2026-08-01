import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { b as MATH_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { d as defaultParams, p as paramMeta, N as NikeScene } from "./nike-DnpeAunb.js";
import { b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import "./CoordinateGrid-BmMyIyOq.js";
import "./coordinate-9upJ5J84.js";
import "./FunctionGraph-DoU6C8dJ.js";
import "./InteractivePoint-ZTf14j6W.js";
import "./TangentLine-DSaW8mKI.js";
import "./Asymptote-CeJ5uPCO.js";
import "./labelAvoider-DY-BzTvY.js";
function ShiftedPage() {
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-nike", params, { activeMode: "shifted" }),
    [params]
  );
  const equationLatex = reactExports.useMemo(() => {
    const aVal = params.a.toFixed(1);
    const bVal = params.b.toFixed(1);
    const hVal = params.h.toFixed(1);
    const cVal = params.c.toFixed(1);
    return `y = \\color{${MATH_COLORS.paramPrimary}}{${aVal}}(x - \\color{${MATH_COLORS.paramTertiary}}{${hVal}}) + \\color{${MATH_COLORS.paramTertiary}}{${cVal}} + \\frac{\\color{${MATH_COLORS.paramSecondary}}{${bVal}}}{x - \\color{${MATH_COLORS.paramTertiary}}{${hVal}}}`;
  }, [params.a, params.b, params.h, params.c]);
  const paramConfigs = reactExports.useMemo(() => {
    const keys = ["a", "b", "h", "c", "x0"];
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "平移双曲线", subtitle: "对勾函数的平移变换", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-neutral-600 p-3 bg-neutral-50 rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1", children: "渐近线：x = h, y = a(x-h) + c" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-neutral-400 text-xs", children: "拖动 h, c 控制渐近线交点位置" })
        ] }) }),
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
                activeMode: "shifted",
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
          title: "平移双曲线看板"
        }
      )
    }
  );
}
export {
  ShiftedPage
};
