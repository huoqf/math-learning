import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import { d as defaultParams, p as paramMeta, P as PairedDataScene } from "./pairedData-Do5AAhjb.js";
import { b as buildMathQuantities, a4 as INDEPENDENCE_PRESETS, a5 as calculateIndependenceTest } from "./mathQuantities-CSLRzday.js";
import "./useRadioGroup-jCNJTR-s.js";
import "./CoordinateGrid-BmMyIyOq.js";
import "./coordinate-9upJ5J84.js";
import "./InteractivePoint-ZTf14j6W.js";
function IndependencePage() {
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const [indPresetIndex, setIndPresetIndex] = reactExports.useState(0);
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({ vp, xRange: [-6, 35], yRange: [-4, 30] });
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  const handleIndPresetSelect = (index) => {
    setIndPresetIndex(index);
    const p = INDEPENDENCE_PRESETS[index];
    setParams((prev) => ({
      ...prev,
      presetIndex: index,
      freqA: p.a,
      freqB: p.b,
      freqC: p.c,
      freqD: p.d
    }));
  };
  const handleReset = () => {
    setParams({ ...defaultParams });
    setIndPresetIndex(0);
  };
  const paramConfigs = reactExports.useMemo(() => {
    const keys = ["freqA", "freqB", "freqC", "freqD"];
    return keys.filter((k) => k in paramMeta).map((key) => {
      const meta = paramMeta[key];
      return {
        key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks
      };
    });
  }, [params]);
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-paired-data", params, {
      studyMode: "independence",
      points: []
    });
  }, [params]);
  const headerFormulaLatex = reactExports.useMemo(() => {
    const a = params.freqA ?? 85;
    const b = params.freqB ?? 15;
    const c = params.freqC ?? 40;
    const d = params.freqD ?? 60;
    const res = calculateIndependenceTest(a, b, c, d);
    return `\\chi^2 = \\frac{${res.n} \\times (${a} \\times ${d} - ${b} \\times ${c})^2}{${a + b} \\times ${c + d} \\times ${a + c} \\times ${b + d}} = ${res.chiSquare.toFixed(3)}`;
  }, [params]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "列联表测试情境预设",
            subtitle: "选择高考分类变量应用",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: INDEPENDENCE_PRESETS.map((p, idx) => ({
                  key: String(idx),
                  label: p.name,
                  fullWidth: true
                })),
                value: String(indPresetIndex),
                onChange: (k) => handleIndPresetSelect(Number(k)),
                variant: "filled",
                columns: 1
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "列联表频数调节 (a,b,c,d)",
            subtitle: "拖动滑块改变频数",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              ParamControl,
              {
                params: paramConfigs,
                onParamChange: handleParamChange,
                onReset: handleReset
              }
            )
          }
        )
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm max-w-[90%] overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: headerFormulaLatex, mode: "inline" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              PairedDataScene,
              {
                studyMode: "independence",
                points: [],
                onPointsChange: () => {
                },
                freqA: params.freqA ?? 85,
                freqB: params.freqB ?? 15,
                freqC: params.freqC ?? 40,
                freqD: params.freqD ?? 60,
                presetXName: "x",
                presetYName: "y",
                scale,
                vp,
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
          title: "2×2 列联表独立性检验看板"
        }
      )
    }
  );
}
export {
  IndependencePage
};
