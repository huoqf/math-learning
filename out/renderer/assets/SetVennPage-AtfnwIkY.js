import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { b as MATH_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { d as defaultParams, p as paramMeta, S as SetScene } from "./set-9anrhz50.js";
import { b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import "./useRadioGroup-DJLu5uAU.js";
import "./CoordinateGrid-fDHVDEJz.js";
import "./coordinate-9upJ5J84.js";
import "./InteractivePoint-2lsgO1SM.js";
import "./labelAvoider-DY-BzTvY.js";
function SetVennPage() {
  const [params, setParams] = reactExports.useState(() => ({ ...defaultParams }));
  const [vennOp, setVennOp] = reactExports.useState("intersection");
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5]
  });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-set-venn", params, {}),
    [params, vennOp]
  );
  const formulaLatex = reactExports.useMemo(() => {
    switch (vennOp) {
      case "intersection":
        return `\\color{${MATH_COLORS.paramPrimary}}{A} \\cap \\color{${MATH_COLORS.paramSecondary}}{B} = \\{ x \\mid x \\in \\color{${MATH_COLORS.paramPrimary}}{A} \\land x \\in \\color{${MATH_COLORS.paramSecondary}}{B} \\}`;
      case "union":
        return `\\color{${MATH_COLORS.paramPrimary}}{A} \\cup \\color{${MATH_COLORS.paramSecondary}}{B} = \\{ x \\mid x \\in \\color{${MATH_COLORS.paramPrimary}}{A} \\lor x \\in \\color{${MATH_COLORS.paramSecondary}}{B} \\}`;
      case "complement_A":
        return `\\complement_U \\color{${MATH_COLORS.paramPrimary}}{A} = \\{ x \\mid x \\in U \\land x \\notin \\color{${MATH_COLORS.paramPrimary}}{A} \\}`;
      case "difference_A_B":
        return `\\color{${MATH_COLORS.paramPrimary}}{A} \\setminus \\color{${MATH_COLORS.paramSecondary}}{B} = \\{ x \\mid x \\in \\color{${MATH_COLORS.paramPrimary}}{A} \\land x \\notin \\color{${MATH_COLORS.paramSecondary}}{B} \\}`;
      default:
        return `\\color{${MATH_COLORS.paramPrimary}}{A} \\cap \\color{${MATH_COLORS.paramSecondary}}{B}`;
    }
  }, [vennOp]);
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "集合运算", subtitle: "选择 Venn 图运算类型", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "intersection", label: "A ∩ B", formula: "A \\cap B" },
              { key: "union", label: "A ∪ B", formula: "A \\cup B" },
              {
                key: "complement_A",
                label: "∁UA",
                formula: "\\complement_U A"
              },
              {
                key: "difference_A_B",
                label: "A \\ B",
                formula: "A \\setminus B"
              }
            ],
            value: vennOp,
            onChange: (k) => setVennOp(k),
            variant: "outline",
            className: "mb-4"
          }
        ) }),
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
                vennOp,
                showLogic: false
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
          title: "集合运算看板"
        }
      )
    }
  );
}
export {
  SetVennPage
};
