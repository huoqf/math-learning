import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { w as withAlpha, b as MATH_COLORS, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import { C as CoordinateGrid } from "./CoordinateGrid-BmMyIyOq.js";
import { F as FunctionGraph } from "./FunctionGraph-DoU6C8dJ.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { I as InteractivePoint } from "./InteractivePoint-ZTf14j6W.js";
import { A as Asymptote } from "./Asymptote-CeJ5uPCO.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import { b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import "./useRadioGroup-jCNJTR-s.js";
function TranscendentalScene({
  params,
  scale,
  vp,
  onParamChange,
  mode,
  subMode,
  fontScale = (v) => v
}) {
  const x0 = params.x0 ?? 0;
  const a = params.a ?? 1;
  const handleDragX0 = (mathPt) => {
    let newX0 = Math.round(mathPt.x * 10) / 10;
    if (mode === "log" && newX0 <= 0.05) {
      newX0 = 0.05;
    }
    onParamChange("x0", newX0);
  };
  const expY0 = Math.exp(x0);
  const expSlope = expY0;
  const expIntercept = expY0 * (1 - x0);
  const validLogX0 = Math.max(0.05, x0);
  const logY0 = Math.log(validLogX0);
  const logSlope = 1 / validLogX0;
  const logIntercept = logY0 - 1;
  const labelsPoints = reactExports.useMemo(() => {
    if (mode === "exp") {
      const p1 = mathToDesign(x0, expY0, scale);
      const pBase = mathToDesign(0, 1, scale);
      return [
        {
          key: "p1",
          x: p1.x,
          y: p1.y,
          text: `P(${x0.toFixed(1)}, ${expY0.toFixed(2)})`,
          anchor: "middle",
          dy: -14
        },
        {
          key: "pBase",
          x: pBase.x,
          y: pBase.y,
          text: "基准切点(0, 1)",
          anchor: "middle",
          dy: -14
        }
      ];
    } else if (mode === "log") {
      const p1 = mathToDesign(validLogX0, logY0, scale);
      const pBase = mathToDesign(1, 0, scale);
      return [
        {
          key: "p1",
          x: p1.x,
          y: p1.y,
          text: `P(${validLogX0.toFixed(1)}, ${logY0.toFixed(2)})`,
          anchor: "middle",
          dy: -14
        },
        {
          key: "pBase",
          x: pBase.x,
          y: pBase.y,
          text: "基准切点(1, 0)",
          anchor: "middle",
          dy: 16
        }
      ];
    }
    return [];
  }, [mode, x0, expY0, validLogX0, logY0, scale]);
  const labelOffsets = reactExports.useMemo(() => {
    return avoidLabels(labelsPoints);
  }, [labelsPoints]);
  const expDiffAreaD = reactExports.useMemo(() => {
    if (mode !== "exp") return "";
    const points = [];
    const xMin = -2.5;
    const xMax = 2.5;
    const steps = 40;
    const dx = (xMax - xMin) / steps;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = Math.exp(x);
      points.push(mathToDesign(x, y, scale));
    }
    for (let i = steps; i >= 0; i--) {
      const x = xMin + i * dx;
      const y = x + 1;
      points.push(mathToDesign(x, y, scale));
    }
    if (points.length === 0) return "";
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ") + " Z";
  }, [mode, scale]);
  const logDiffAreaD = reactExports.useMemo(() => {
    if (mode !== "log") return "";
    const points = [];
    const xMin = 0.15;
    const xMax = 3.5;
    const steps = 40;
    const dx = (xMax - xMin) / steps;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = x - 1;
      points.push(mathToDesign(x, y, scale));
    }
    for (let i = steps; i >= 0; i--) {
      const x = xMin + i * dx;
      const y = Math.log(x);
      points.push(mathToDesign(x, y, scale));
    }
    if (points.length === 0) return "";
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ") + " Z";
  }, [mode, scale]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    mode === "exp" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      expDiffAreaD && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          d: expDiffAreaD,
          fill: withAlpha(MATH_COLORS.paramPrimary, 0.12),
          stroke: "none"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => x + 1,
          scale,
          color: MATH_COLORS.paramSecondary,
          strokeWidth: 2,
          strokeDasharray: "4 4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => expSlope * x + expIntercept,
          scale,
          color: MATH_COLORS.tangentLine,
          strokeWidth: 2.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => Math.exp(x),
          scale,
          color: MATH_COLORS.function,
          strokeWidth: 3
        }
      ),
      (() => {
        const pBase = mathToDesign(0, 1, scale);
        const dy = labelOffsets[1]?.finalDy ?? -14;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: pBase.x,
              cy: pBase.y,
              r: 4,
              fill: MATH_COLORS.paramSecondary
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: pBase.x,
              y: pBase.y + dy,
              fill: MATH_COLORS.paramSecondary,
              fontSize: fontScale(11),
              fontWeight: "bold",
              textAnchor: "middle",
              children: "(0, 1)"
            }
          )
        ] });
      })(),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: x0,
          cy: expY0,
          scale,
          vp,
          onDrag: handleDragX0,
          color: MATH_COLORS.paramPrimary,
          label: `P(${x0.toFixed(1)}, ${expY0.toFixed(2)})`,
          fontScale
        }
      )
    ] }),
    mode === "log" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      logDiffAreaD && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          d: logDiffAreaD,
          fill: withAlpha(MATH_COLORS.paramPrimary, 0.12),
          stroke: "none"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Asymptote,
        {
          type: "vertical",
          value: 0,
          scale,
          color: MATH_COLORS.asymptote,
          label: "x=0",
          fontScale
        }
      ),
      subMode === "quadratic_bound" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => 0.5 * (x * x - 1),
          scale,
          color: MATH_COLORS.functionTransformed,
          strokeWidth: 2,
          strokeDasharray: "5 3"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => x - 1,
          scale,
          color: MATH_COLORS.paramSecondary,
          strokeWidth: 2,
          strokeDasharray: "4 4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => logSlope * x + logIntercept,
          scale,
          color: MATH_COLORS.tangentLine,
          strokeWidth: 2.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => x > 0 ? Math.log(x) : NaN,
          scale,
          color: MATH_COLORS.function,
          strokeWidth: 3
        }
      ),
      (() => {
        const pBase = mathToDesign(1, 0, scale);
        const dy = labelOffsets[1]?.finalDy ?? 16;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: pBase.x,
              cy: pBase.y,
              r: 4,
              fill: MATH_COLORS.paramSecondary
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: pBase.x,
              y: pBase.y + dy,
              fill: MATH_COLORS.paramSecondary,
              fontSize: fontScale(11),
              fontWeight: "bold",
              textAnchor: "middle",
              children: "(1, 0)"
            }
          )
        ] });
      })(),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InteractivePoint,
        {
          cx: validLogX0,
          cy: logY0,
          scale,
          vp,
          onDrag: handleDragX0,
          color: MATH_COLORS.paramPrimary,
          label: `P(${validLogX0.toFixed(1)}, ${logY0.toFixed(2)})`,
          fontScale
        }
      )
    ] }),
    mode === "chain" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => x,
          scale,
          color: MATH_COLORS.paramSecondary,
          strokeWidth: 2.5,
          strokeDasharray: "6 4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => Math.exp(x - 1),
          scale,
          color: MATH_COLORS.function,
          strokeWidth: 3
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => x > 0 ? Math.log(x) + 1 : NaN,
          scale,
          color: MATH_COLORS.functionTransformed,
          strokeWidth: 3
        }
      ),
      (() => {
        const p1 = mathToDesign(1, 1, scale);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: p1.x,
              cy: p1.y,
              r: 5,
              fill: MATH_COLORS.paramPrimary
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: p1.x,
              y: p1.y - 12,
              fill: MATH_COLORS.paramPrimary,
              fontSize: fontScale(12),
              fontWeight: "bold",
              textAnchor: "middle",
              children: "公共切点 (1, 1)"
            }
          )
        ] });
      })()
    ] }),
    mode === "param" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => Math.exp(x),
          scale,
          color: MATH_COLORS.function,
          strokeWidth: 3
        }
      ),
      subMode === "exp_ax" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => a * x,
          scale,
          color: MATH_COLORS.paramPrimary,
          strokeWidth: 2.5
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        FunctionGraph,
        {
          fn: (x) => a * x + 1,
          scale,
          color: MATH_COLORS.paramPrimary,
          strokeWidth: 2.5
        }
      ),
      subMode === "exp_ax_1" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: mathToDesign(0, 1, scale).x,
            cy: mathToDesign(0, 1, scale).y,
            r: 6,
            fill: a === 1 ? MATH_COLORS.tangentLine : MATH_COLORS.paramSecondary
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: mathToDesign(0, 1, scale).x + 12,
            y: mathToDesign(0, 1, scale).y + 4,
            fill: a === 1 ? MATH_COLORS.tangentLine : MATH_COLORS.labelText,
            fontSize: fontScale(11),
            fontWeight: "bold",
            children: a === 1 ? "相切临界点 (0, 1) [a = 1]" : "定点 (0, 1)"
          }
        )
      ] }),
      subMode === "exp_ax" && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: mathToDesign(1, Math.E, scale).x,
            cy: mathToDesign(1, Math.E, scale).y,
            r: 6,
            fill: Math.abs(a - Math.E) < 0.1 ? MATH_COLORS.tangentLine : MATH_COLORS.paramSecondary
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: mathToDesign(1, Math.E, scale).x + 12,
            y: mathToDesign(1, Math.E, scale).y + 4,
            fill: Math.abs(a - Math.E) < 0.1 ? MATH_COLORS.tangentLine : MATH_COLORS.labelText,
            fontSize: fontScale(11),
            fontWeight: "bold",
            children: Math.abs(a - Math.E) < 0.1 ? "相切临界点 (1, e) [a = e]" : "切点参照 (1, e)"
          }
        )
      ] })
    ] })
  ] });
}
const defaultParams = {
  x0: 0,
  // 指数/对数切点横坐标
  a: 1
  // 高考恒成立参数 a
};
const paramMeta = {
  x0: {
    key: "x0",
    label: "切点横坐标 x₀",
    labelFormula: "x_0",
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 0,
    importance: "core",
    description: "控制超越函数切线的切点位置 (e^x 基准 x₀=0，ln x 基准 x₀=1)",
    descriptionFormula: "控制超越函数切线的切点位置 ($e^x$ 基准 $x_0=0$，$\\ln x$ 基准 $x_0=1$)",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "e^x 基准",
        labelFormula: "x_0=0"
      },
      {
        value: 1,
        variant: "critical",
        label: "ln x 基准",
        labelFormula: "x_0=1"
      }
    ]
  },
  a: {
    key: "a",
    label: "放缩/放缩斜率 a",
    labelFormula: "a",
    min: -1,
    max: 4,
    step: 0.1,
    defaultValue: 1,
    importance: "core",
    description: "控制直线 y = ax + 1 或 y = ax 的斜率，观察相切临界与恒成立范围",
    descriptionFormula: "控制直线 $y = ax + 1$ 或 $y = ax$ 的斜率，观察相切临界与恒成立范围",
    marks: [
      { value: 0, variant: "critical", label: "水平线", labelFormula: "a = 0" },
      {
        value: 1,
        variant: "critical",
        label: "基准切线临界",
        labelFormula: "a = 1"
      },
      {
        value: 2.7,
        variant: "critical",
        label: "过原点切线",
        labelFormula: "a = e"
      }
    ]
  }
};
function TranscendentalAnimation() {
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const [mode, setMode] = reactExports.useState("exp");
  const [subMode, setSubMode] = reactExports.useState("tangent_0");
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-4, 4],
    yRange: [-3, 5]
  });
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-derivative-transcendental", params, {
      mode,
      subMode
    }),
    [params, mode, subMode]
  );
  const paramConfigs = reactExports.useMemo(() => {
    const keysByMode = {
      exp: ["x0"],
      log: ["x0"],
      chain: [],
      param: ["a"]
    };
    const keys = keysByMode[mode] ?? Object.keys(paramMeta);
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
  }, [params, mode]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  const equationLatex = reactExports.useMemo(() => {
    const pColor = MATH_COLORS.paramPrimary;
    if (mode === "exp") {
      const x0Val = params.x0.toFixed(1);
      return `f(x) = e^x \\ge \\color{${pColor}}{e^{${x0Val}}}(x - \\color{${pColor}}{${x0Val}}) + e^{${x0Val}} \\ge x + 1`;
    } else if (mode === "log") {
      const x0Val = params.x0 > 0 ? params.x0.toFixed(1) : "1.0";
      return `g(x) = \\ln x \\le \\frac{1}{\\color{${pColor}}{${x0Val}}}(x - \\color{${pColor}}{${x0Val}}) + \\ln \\color{${pColor}}{${x0Val}} \\le x - 1`;
    } else if (mode === "chain") {
      return `\\ln x + 1 \\le x \\le e^{x-1} \\quad (x > 0)`;
    } else {
      const aVal = params.a.toFixed(1);
      if (subMode === "exp_ax") {
        return `e^x \\ge \\color{${pColor}}{${aVal}} x \\quad (a_{\\text{临界}} = e)`;
      }
      return `e^x \\ge \\color{${pColor}}{${aVal}} x + 1 \\quad (a_{\\text{临界}} = 1)`;
    }
  }, [mode, subMode, params.x0, params.a]);
  const handleModeChange = (newMode) => {
    const m = newMode;
    setMode(m);
    if (m === "exp") {
      setSubMode("tangent_0");
      setParams((prev) => ({ ...prev, x0: 0 }));
    } else if (m === "log") {
      setSubMode("tangent_1");
      setParams((prev) => ({ ...prev, x0: 1 }));
    } else if (m === "chain") {
      setSubMode("default");
    } else if (m === "param") {
      setSubMode("exp_ax_1");
      setParams((prev) => ({ ...prev, a: 1 }));
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "模式选择",
            subtitle: "高考压轴切线放缩四大核心模型",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: [
                  { key: "exp", label: "指数放缩", formula: "e^x \\ge x+1" },
                  { key: "log", label: "对数放缩", formula: "\\ln x \\le x-1" },
                  {
                    key: "chain",
                    label: "双基准对偶",
                    formula: "\\ln x+1 \\le x \\le e^{x-1}"
                  },
                  {
                    key: "param",
                    label: "切线临界求参",
                    formula: "e^x \\ge ax+1"
                  }
                ],
                value: mode,
                onChange: handleModeChange,
                columns: 1
              }
            )
          }
        ),
        mode === "exp" && /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "不等式变体", subtitle: "切换常见放缩切点", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              {
                key: "tangent_0",
                label: "基准切点 x₀=0",
                formula: "e^x \\ge x+1"
              },
              {
                key: "tangent_1",
                label: "切点 x₀=1",
                formula: "e^x \\ge ex"
              },
              {
                key: "shift_1",
                label: "平移变体",
                formula: "e^{x-1} \\ge x",
                fullWidth: true
              }
            ],
            value: subMode,
            onChange: (k) => {
              setSubMode(k);
              if (k === "tangent_0") handleParamChange("x0", 0);
              if (k === "tangent_1") handleParamChange("x0", 1);
              if (k === "shift_1") handleParamChange("x0", 1);
            }
          }
        ) }),
        mode === "log" && /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "不等式变体", subtitle: "切换常见对数放缩", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              {
                key: "tangent_1",
                label: "基准切点 x₀=1",
                formula: "\\ln x \\le x-1"
              },
              {
                key: "tangent_e",
                label: "切点 x₀=e",
                formula: "\\ln x \\le \\frac{x}{e}"
              },
              {
                key: "quadratic_bound",
                label: "二次放缩",
                formula: "\\ln x \\le \\frac{1}{2}(x^2-1)",
                fullWidth: true,
                description: "利用 upper bound 进一步二次放缩"
              }
            ],
            value: subMode,
            onChange: (k) => {
              setSubMode(k);
              if (k === "tangent_1") handleParamChange("x0", 1);
              if (k === "tangent_e") handleParamChange("x0", 2.7);
            }
          }
        ) }),
        mode === "param" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "恒成立模型",
            subtitle: "选择常考切线临界大题题型",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: [
                  {
                    key: "exp_ax_1",
                    label: "定点 (0, 1)",
                    formula: "e^x \\ge ax+1"
                  },
                  {
                    key: "exp_ax",
                    label: "过原点 (0, 0)",
                    formula: "e^x \\ge ax"
                  }
                ],
                value: subMode,
                onChange: (k) => {
                  setSubMode(k);
                  if (k === "exp_ax_1") handleParamChange("a", 1);
                  if (k === "exp_ax") handleParamChange("a", 2.7);
                }
              }
            )
          }
        ),
        paramConfigs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "参数调节", subtitle: "拖动滑块或拖拽切点", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: () => setParams({ ...defaultParams })
          }
        ) })
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full relative flex flex-col bg-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: equationLatex, mode: "inline" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              TranscendentalScene,
              {
                params,
                scale,
                vp,
                onParamChange: handleParamChange,
                mode,
                subMode,
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
          title: "切线放缩模型看板"
        }
      )
    }
  );
}
export {
  TranscendentalAnimation
};
