import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import { d as defaultParams, p as paramMeta, P as PropertiesScene, T as TipCard } from "./funcProperties-DOYgY-VX.js";
import { b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import "./useRadioGroup-jCNJTR-s.js";
import "./CoordinateGrid-BmMyIyOq.js";
import "./coordinate-9upJ5J84.js";
import "./FunctionGraph-DoU6C8dJ.js";
import "./InteractivePoint-ZTf14j6W.js";
import "./IntervalShadow--pOvsarb.js";
import "./SecantLine-CEmLCvrC.js";
import "./Asymptote-CeJ5uPCO.js";
import "./labelAvoider-DY-BzTvY.js";
function SymmetryPage() {
  const [params, setParams] = reactExports.useState(() => ({ ...defaultParams }));
  const [fnType, setFnType] = reactExports.useState("cubic");
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({ vp, xRange: [-6, 6], yRange: [-4.5, 4.5] });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-func-properties", params, {
      mode: "symmetry",
      fnType
    }),
    [params, fnType]
  );
  const formulaLatex = reactExports.useMemo(() => {
    const axisA = (params.axisA ?? 0).toFixed(1);
    const axisB = (params.axisB ?? 2).toFixed(1);
    const dist = Math.abs((params.axisB ?? 2) - (params.axisA ?? 0));
    const period = (2 * dist).toFixed(1);
    return `x = ${axisA}, \\ x = ${axisB} \\text{ 对称 } \\Rightarrow T = 2|a - b| = ${period}`;
  }, [params]);
  const paramConfigs = reactExports.useMemo(() => {
    return ["axisA", "axisB"].filter((key) => key in paramMeta).map((key) => {
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
            subtitle: "切换观察不同函数的对称性",
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
            subtitle: "对称与周期性探索要点",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TipCard, { variant: "primary", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold mb-1", children: "对称与周期性观察要点：" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                "1. ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "双对称轴" }),
                "：拖动 a, b 控制红/橙两条虚线对称轴 x = a 与 x = b。"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                "2. ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "导出周期" }),
                "：当图象关于两条直线均对称时，两次折叠形成周期循环，周期长度正好等于",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "两倍轴距 T = 2|a - b|" }),
                "。"
              ] })
            ] })
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
              PropertiesScene,
              {
                params,
                scale,
                vp,
                onParamChange: handleParamChange,
                fontScale: canvasSize.font,
                fnType,
                mode: "symmetry"
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
          title: "对称与周期看板"
        }
      )
    }
  );
}
export {
  SymmetryPage
};
