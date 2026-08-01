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
  "linear-pan": [-10, 30],
  accumulation: [-5, 45],
  multiplication: [-1, 10],
  reciprocal: [-5, 15],
  "second-order": [-10, 50]
};
const KEYS_BY_MODEL = {
  "linear-pan": ["a1", "p_rec", "q_rec", "N"],
  accumulation: ["a1", "d", "N"],
  multiplication: ["a1", "N"],
  reciprocal: ["a1", "coefA", "coefB", "coefC", "N"],
  "second-order": ["a1", "a2", "p_rec", "q_rec", "N"]
};
function RecurrencePage() {
  const [recurrenceModelType, setRecurrenceModelType] = reactExports.useState("linear-pan");
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
    yRange: Y_RANGES[recurrenceModelType]
  });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-sequence", params, {
      activeMode: "recurrence",
      subModel: recurrenceModelType
    }),
    [params, recurrenceModelType]
  );
  const paramConfigs = reactExports.useMemo(() => {
    return KEYS_BY_MODEL[recurrenceModelType].filter((key) => key in paramMeta).map((key) => {
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
  }, [params, recurrenceModelType]);
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
            title: "递推构造 5 大核心模型",
            subtitle: "涵盖高考求通项待定系数与构造法",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: [
                  {
                    key: "linear-pan",
                    label: "待定系数/一阶线性",
                    formula: "a_{n+1}=pa_n+q",
                    fullWidth: true
                  },
                  {
                    key: "accumulation",
                    label: "累加法求通项",
                    formula: "a_{n+1}=a_n+f(n)",
                    fullWidth: true
                  },
                  {
                    key: "multiplication",
                    label: "累乘法求通项",
                    formula: "a_{n+1}=f(n)a_n",
                    fullWidth: true
                  },
                  {
                    key: "reciprocal",
                    label: "倒数构造法",
                    formula: "a_{n+1}=\\frac{Aa_n}{Ba_n+C}",
                    fullWidth: true
                  },
                  {
                    key: "second-order",
                    label: "二阶特征根法",
                    formula: "a_{n+2}=pa_{n+1}+qa_n",
                    fullWidth: true
                  }
                ],
                value: recurrenceModelType,
                onChange: (val) => setRecurrenceModelType(val)
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
              activeMode: "recurrence",
              recurrenceModelType,
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
          title: "递推与构造法看板"
        }
      )
    }
  );
}
export {
  RecurrencePage
};
