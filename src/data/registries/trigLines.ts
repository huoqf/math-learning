import type { ParamMeta } from "../types";

export const defaultParams = {
  alphaDeg: 45,
  showSine: 1,
  showCosine: 1,
  showTangent: 1,
  showArc: 1,
  showAuxTriangle: 1,
} as const;

export const paramMeta: Record<string, ParamMeta> = {
  alphaDeg: {
    key: "alphaDeg",
    label: "动角 α (度)",
    labelFormula: "\\alpha",
    min: -360,
    max: 720,
    step: 1,
    defaultValue: 45,
    importance: "core",
    description: "角 α 的终边与单位圆交于 P(cos α, sin α)",
    descriptionFormula: "角 $\\alpha$ 的终边与单位圆交于 $P(\\cos\\alpha, \\sin\\alpha)$",
    marks: [
      { value: 0, label: "0°", labelFormula: "0^\\circ" },
      { value: 30, label: "30°", labelFormula: "30^\\circ" },
      { value: 45, label: "45°", labelFormula: "45^\\circ" },
      { value: 60, label: "60°", labelFormula: "60^\\circ" },
      { value: 90, variant: "critical", label: "90° (切线平行)", labelFormula: "90^\\circ" },
      { value: 135, label: "135°", labelFormula: "135^\\circ" },
      { value: 180, label: "180°", labelFormula: "180^\\circ" },
      { value: 270, variant: "critical", label: "270° (切线平行)", labelFormula: "270^\\circ" },
      { value: 360, label: "360°", labelFormula: "360^\\circ" },
    ],
  },
};
