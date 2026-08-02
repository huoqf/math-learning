import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { d as defaultParams, p as paramMeta, P as PropertiesScene, T as TipCard } from "./funcProperties-B_TusbY6.js";
import { b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import "./useRadioGroup-DJLu5uAU.js";
import "./CoordinateGrid-fDHVDEJz.js";
import "./coordinate-9upJ5J84.js";
import "./FunctionGraph-DziQOq7W.js";
import "./InteractivePoint-2lsgO1SM.js";
import "./IntervalShadow-Dr5gFM2D.js";
import "./SecantLine-uHone8Sl.js";
import "./Asymptote-DqWNp8bH.js";
import "./labelAvoider-DY-BzTvY.js";
const FORMULA_MAP = {
  cubic: "f(x) = x^3 \\quad (D = \\mathbb{R}, \\ R = \\mathbb{R})",
  quadratic: "f(x) = x^2 \\quad (D = \\mathbb{R}, \\ R = [0, +\\infty))",
  abs: "f(x) = |x| \\quad (D = \\mathbb{R}, \\ R = [0, +\\infty))",
  reciprocal: "f(x) = \\frac{1}{x} \\quad (D = (-\\infty, 0) \\cup (0, +\\infty))",
  sin: "f(x) = \\sin x \\quad (D = \\mathbb{R}, \\ R = [-1, 1])"
};
function DomainPage() {
  const [params, setParams] = reactExports.useState(() => ({ ...defaultParams }));
  const [fnType, setFnType] = reactExports.useState("cubic");
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-func-properties", params, {
      mode: "domain",
      fnType
    }),
    [params, fnType]
  );
  const paramConfigs = reactExports.useMemo(() => {
    return ["x0"].filter((key) => key in paramMeta).map((key) => {
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
            title: "基准函数选择",
            subtitle: "切换观察不同函数的定义域与值域",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: [
                  { key: "cubic", label: "y = x³", formula: "y=x^3" },
                  { key: "quadratic", label: "y = x²", formula: "y=x^2" },
                  { key: "abs", label: "y = |x|", formula: "y=|x|" },
                  {
                    key: "reciprocal",
                    label: "y = 1/x",
                    formula: "y=\\frac{1}{x}"
                  },
                  { key: "sin", label: "y = sin x", formula: "y=\\sin x" }
                ],
                value: fnType,
                onChange: (k) => setFnType(k),
                variant: "outline",
                className: "mb-4"
              }
            )
          }
        ),
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
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "观察与操作指引",
            subtitle: "定义域与值域探索要点",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TipCard, { variant: "info", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold mb-1", children: "概念与定义域观察要点：" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                "1. ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "定义域 D" }),
                "：允许取值的自变量集合（X 轴淡阴影区）。"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                "2. ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "值域 R" }),
                "：所有函数值 f(x) 的集合（Y 轴淡阴影区）。"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                "3. ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "拖动验证" }),
                "：拖动滑块 x₀。切换到 y = 1/x 试着拖动到 x₀ = 0，观察无定义点警示。"
              ] })
            ] })
          }
        )
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: FORMULA_MAP[fnType], mode: "inline" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              PropertiesScene,
              {
                params,
                scale,
                vp,
                onParamChange: handleParamChange,
                fontScale: canvasSize.font,
                fnType,
                mode: "domain"
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
          title: "定义域与值域看板"
        }
      )
    }
  );
}
export {
  DomainPage
};
