import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { T as ThreePanel, M as MathPanel, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import { d as defaultParams, p as paramMeta, S as SequenceScene } from "./sequence-C5SVmGlP.js";
import { b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import "./useRadioGroup-jCNJTR-s.js";
import "./CoordinateGrid-BmMyIyOq.js";
import "./coordinate-9upJ5J84.js";
import "./FunctionGraph-DoU6C8dJ.js";
function GeometricPage() {
  const [geometricViewType, setGeometricViewType] = reactExports.useState("points");
  const [highlightN, setHighlightN] = reactExports.useState(1);
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const yRange = params.q > 1 ? [-2, 50] : [-1, 8];
  const scale = useSceneScale({ vp, xRange: [-1, 16.5], yRange });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-sequence", params, {
      activeMode: "geometric",
      subModel: "arith-geo"
    }),
    [params, geometricViewType]
  );
  const paramConfigs = reactExports.useMemo(() => {
    return ["a1", "q", "N"].filter((key) => key in paramMeta).map((key) => {
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "视口表达形式", subtitle: "离散曲线或几何剖分", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "points", label: "离散点与指数" },
              { key: "tessellation", label: "正方形无限剖分" }
            ],
            value: geometricViewType,
            onChange: (val) => setGeometricViewType(val)
          }
        ) }),
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
              activeMode: "geometric",
              geometricViewType,
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
          title: "等比数列看板"
        }
      )
    }
  );
}
export {
  GeometricPage
};
