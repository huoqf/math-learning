import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { T as ThreePanel, M as MathPanel, K as KatexFormula, b as MATH_COLORS, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { d as defaultParams, p as paramMeta, S as SetScene } from "./set-Cuf2Swey.js";
import { b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import "./CoordinateGrid-BmMyIyOq.js";
import "./coordinate-9upJ5J84.js";
import "./InteractivePoint-ZTf14j6W.js";
import "./labelAvoider-DY-BzTvY.js";
function SetLogicPage() {
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
    () => buildMathQuantities("anim-logic-conditions", params, {}),
    [params]
  );
  const formulaLatex = `p: x \\in \\color{${MATH_COLORS.paramPrimary}}{A}, \\quad q: x \\in \\color{${MATH_COLORS.paramSecondary}}{B} \\quad (p \\implies q \\iff \\color{${MATH_COLORS.paramPrimary}}{A} \\subseteq \\color{${MATH_COLORS.paramSecondary}}{B})`;
  const paramConfigs = reactExports.useMemo(() => {
    const keys = ["xA", "yA", "rA", "xB", "yB", "rB", "xP", "yP"];
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
            title: "充分必要条件",
            subtitle: "探索集合包含与逻辑蕴含",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-neutral-600 mb-3 p-3 bg-neutral-50 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "p ⇒ q" }),
                "（p 是 q 的充分条件）"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "q ⇒ p" }),
                "（p 是 q 的必要条件）"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "A ⊆ B" }),
                " ⟺ x∈A ⇒ x∈B"
              ] })
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "参数调节与位置控制",
            subtitle: "可拖动图形点或调节参数",
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
              SetScene,
              {
                params,
                scale,
                vp,
                onParamChange: handleParamChange,
                fontScale: canvasSize.font,
                vennOp: "intersection",
                showLogic: true
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
          title: "逻辑条件看板"
        }
      )
    }
  );
}
export {
  SetLogicPage
};
