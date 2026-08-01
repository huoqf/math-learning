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
const Y_RANGES = {
  "arith-geo": [-5, 15],
  telescoping: [-0.5, 1.5],
  "cross-telescoping": [-0.2, 1],
  grouped: [-8, 25],
  "odd-even": [-17, 17]
};
function ModelsPage() {
  const [modelType, setModelType] = reactExports.useState("arith-geo");
  const [highlightN, setHighlightN] = reactExports.useState(1);
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-1, 16.5],
    yRange: Y_RANGES[modelType]
  });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-sequence", params, {
      activeMode: "models",
      subModel: modelType
    }),
    [params, modelType]
  );
  const paramConfigs = reactExports.useMemo(() => {
    const keys = modelType === "arith-geo" || modelType === "grouped" ? ["a1", "d", "q", "N"] : ["N"];
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
  }, [params, modelType]);
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
            title: "高考 5 大核心求和模型",
            subtitle: "完整覆盖高考解答题与压轴考种",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: [
                  { key: "arith-geo", label: "错位相减法" },
                  { key: "telescoping", label: "标准裂项相消" },
                  { key: "cross-telescoping", label: "跨项裂项相消" },
                  { key: "grouped", label: "分组求和法" },
                  { key: "odd-even", label: "奇偶并项求和" }
                ],
                value: modelType,
                onChange: (val) => setModelType(val)
              }
            )
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
              activeMode: "models",
              modelType,
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
          title: "高考求和模型看板"
        }
      )
    }
  );
}
export {
  ModelsPage
};
