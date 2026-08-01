import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import { d as defaultParams, p as paramMeta, P as PairedDataScene } from "./pairedData-Do5AAhjb.js";
import { a2 as REGRESSION_PRESETS, b as buildMathQuantities, a3 as calculateLinearRegression } from "./mathQuantities-CSLRzday.js";
import "./useRadioGroup-jCNJTR-s.js";
import "./CoordinateGrid-BmMyIyOq.js";
import "./coordinate-9upJ5J84.js";
import "./InteractivePoint-ZTf14j6W.js";
function RegressionPage() {
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const [regPresetIndex, setRegPresetIndex] = reactExports.useState(0);
  const [points, setPoints] = reactExports.useState(
    () => REGRESSION_PRESETS[0].points
  );
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const currentPreset = REGRESSION_PRESETS[regPresetIndex];
  const xRange = currentPreset.xRange;
  const yRange = currentPreset.yRange;
  const calcStep = (range) => {
    if (range <= 8) return 1;
    if (range <= 16) return 2;
    if (range <= 30) return 5;
    return 10;
  };
  const xStep = calcStep(xRange[1] - xRange[0]);
  const yStep = calcStep(yRange[1] - yRange[0]);
  const scale = useSceneScale({ vp, xRange, yRange });
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  const handleRegPresetSelect = (index) => {
    setRegPresetIndex(index);
    setPoints(REGRESSION_PRESETS[index].points);
    handleParamChange("presetIndex", index);
  };
  const handleReset = () => {
    setParams({ ...defaultParams });
    setRegPresetIndex(0);
    setPoints(REGRESSION_PRESETS[0].points);
  };
  const paramConfigs = reactExports.useMemo(() => {
    const keys = ["noise"];
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
      studyMode: "regression",
      points
    });
  }, [params, points]);
  const headerFormulaLatex = reactExports.useMemo(() => {
    const res = calculateLinearRegression(points);
    if (!res.isValid) return "\\text{数据无法求解线性回归方程}";
    const bStr = res.b.toFixed(3);
    const aSign = res.a >= 0 ? "+" : "-";
    const aStr = Math.abs(res.a).toFixed(3);
    return `\\hat{y} = ${bStr}x ${aSign} ${aStr} \\quad (r = ${res.r.toFixed(3)}, R^2 = ${res.rSquare.toFixed(3)})`;
  }, [points]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "高考典型例题预设",
            subtitle: "选择真实考题背景数据",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: REGRESSION_PRESETS.map((p, idx) => ({
                  key: String(idx),
                  label: p.name,
                  fullWidth: true
                })),
                value: String(regPresetIndex),
                onChange: (k) => handleRegPresetSelect(Number(k)),
                variant: "filled",
                columns: 1
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "散点控制", subtitle: "拖动散点或微调", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: handleReset
          }
        ) })
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
                studyMode: "regression",
                points,
                onPointsChange: setPoints,
                freqA: 85,
                freqB: 15,
                freqC: 40,
                freqD: 60,
                presetXName: currentPreset.xName,
                presetYName: currentPreset.yName,
                scale,
                vp,
                fontScale: canvasSize.font,
                xStep,
                yStep
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
          title: "一元线性回归分析看板"
        }
      )
    }
  );
}
export {
  RegressionPage
};
