import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { e as calculateConditionalProb, b as MATH_COLORS, w as withAlpha, f as calculateTotalProb, g as calculateBayesDiagnostic, h as buildProbabilityBayesPanel, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { T as TabSwitcher } from "./TabSwitcher-BlfhUjmU.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import "./useRadioGroup-jCNJTR-s.js";
const defaultParams = {
  // 模式 1: 条件概率
  pA: 0.5,
  pB: 0.4,
  pAB: 0.2,
  // 模式 2: 全概率划分
  pA1: 0.4,
  pA2: 0.35,
  pB_A1: 0.6,
  pB_A2: 0.3,
  pB_A3: 0.8,
  // 模式 3: 贝叶斯诊断
  pPriorD: 0.02,
  pSensitivity: 0.95,
  pFalsePositive: 0.05
};
const paramMeta = {
  // ---------------- 条件概率 ----------------
  pA: {
    key: "pA",
    label: "事件 A 概率 P(A)",
    labelFormula: "P(A)",
    min: 0,
    max: 0.9,
    step: 0.05,
    defaultValue: 0.5,
    importance: "core",
    description: "已知发生的条件事件概率，决定压缩后的样本空间大小",
    descriptionFormula: "条件事件 $A$ 的概率，已知 $A$ 发生时样本空间压缩为 $A$",
    marks: [
      { value: 0, variant: "critical", label: "退化", labelFormula: "P(A)=0" },
      { value: 0.5, label: "0.5" }
    ]
  },
  pB: {
    key: "pB",
    label: "事件 B 概率 P(B)",
    labelFormula: "P(B)",
    min: 0.1,
    max: 0.9,
    step: 0.05,
    defaultValue: 0.4,
    importance: "core",
    description: "目标事件 B 在全样本空间 Ω 中的边缘概率",
    descriptionFormula: "目标事件 $B$ 在全样本空间 $\\Omega$ 中的先验概率"
  },
  pAB: {
    key: "pAB",
    label: "交集概率 P(AB)",
    labelFormula: "P(AB)",
    min: 0,
    max: 0.5,
    step: 0.05,
    defaultValue: 0.2,
    importance: "core",
    description: "事件 A 与事件 B 同时发生的交集概率 P(A ∩ B)",
    descriptionFormula: "同时发生的联合概率 $P(A \\cap B)$，在 A 发生后成为新的有效区域"
  },
  // ---------------- 全概率划分 ----------------
  pA1: {
    key: "pA1",
    label: "划分 A1 概率 P(A1)",
    labelFormula: "P(A_1)",
    min: 0.1,
    max: 0.7,
    step: 0.05,
    defaultValue: 0.4,
    importance: "core",
    description: "完备事件组的第一块划分先验概率",
    descriptionFormula: "划分块 $A_1$ 的先验概率，满足 $\\sum P(A_i) = 1$"
  },
  pA2: {
    key: "pA2",
    label: "划分 A2 概率 P(A2)",
    labelFormula: "P(A_2)",
    min: 0.1,
    max: 0.7,
    step: 0.05,
    defaultValue: 0.35,
    importance: "core",
    description: "完备事件组的第二块划分先验概率（剩余为 A3）",
    descriptionFormula: "划分块 $A_2$ 的先验概率，$P(A_3) = 1 - P(A_1) - P(A_2)$"
  },
  pB_A1: {
    key: "pB_A1",
    label: "条件概率 P(B|A1)",
    labelFormula: "P(B|A_1)",
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.6,
    importance: "advanced",
    description: "在划分 A1 发生的条件下事件 B 的概率",
    descriptionFormula: "分支条件概率 $P(B|A_1)$"
  },
  pB_A2: {
    key: "pB_A2",
    label: "条件概率 P(B|A2)",
    labelFormula: "P(B|A_2)",
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.3,
    importance: "advanced",
    description: "在划分 A2 发生的条件下事件 B 的概率",
    descriptionFormula: "分支条件概率 $P(B|A_2)$"
  },
  pB_A3: {
    key: "pB_A3",
    label: "条件概率 P(B|A3)",
    labelFormula: "P(B|A_3)",
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.8,
    importance: "advanced",
    description: "在划分 A3 发生的条件下事件 B 的概率",
    descriptionFormula: "分支条件概率 $P(B|A_3)$"
  },
  // ---------------- 贝叶斯诊断 ----------------
  pPriorD: {
    key: "pPriorD",
    label: "患病先验概率 P(D)",
    labelFormula: "P(D)",
    min: 5e-3,
    max: 0.2,
    step: 5e-3,
    defaultValue: 0.02,
    importance: "core",
    description: "总体人群中患病的自然先验概率",
    descriptionFormula: "人群患病先验概率 $P(D)$（如 2%）",
    marks: [
      { value: 0.01, label: "1%" },
      { value: 0.05, label: "5%" },
      { value: 0.1, label: "10%" }
    ]
  },
  pSensitivity: {
    key: "pSensitivity",
    label: "真阳性率 P(+|D)",
    labelFormula: "P(+|D)",
    min: 0.7,
    max: 0.999,
    step: 0.01,
    defaultValue: 0.95,
    importance: "advanced",
    description: "试剂在确定患病者中检测出阳性的灵敏度",
    descriptionFormula: "试剂灵敏度 / 真阳性率 $P(+|D)$"
  },
  pFalsePositive: {
    key: "pFalsePositive",
    label: "假阳性率 P(+|~D)",
    labelFormula: "P(+|\\bar{D})",
    min: 5e-3,
    max: 0.2,
    step: 5e-3,
    defaultValue: 0.05,
    importance: "advanced",
    description: "试剂在健康人群中的误报率（假阳性）",
    descriptionFormula: "试剂误报率 / 假阳性率 $P(+|\\bar{D})$"
  }
};
function ConditionalScene({
  params,
  isZoomedToA,
  fontScale
}) {
  const conditionalData = reactExports.useMemo(() => {
    const pA = params.pA ?? 0.5;
    const pB = params.pB ?? 0.4;
    const pAB = Math.min(params.pAB ?? 0.2, Math.min(pA, pB));
    return calculateConditionalProb(pA, pB, pAB);
  }, [params.pA, params.pB, params.pAB]);
  const rectOmega = { x: 70, y: 80, width: 700, height: 460 };
  const totalArea = rectOmega.width * rectOmega.height;
  const rawRA = Math.sqrt(totalArea * conditionalData.pA / Math.PI);
  const rawRB = Math.sqrt(totalArea * conditionalData.pB / Math.PI);
  const centerAX = isZoomedToA ? 420 : 360;
  const centerAY = 310;
  const maxOverlapDist = Math.abs(rawRA - rawRB);
  const minOverlapDist = rawRA + rawRB;
  const tOverlap = 1 - (conditionalData.pA > 0 && conditionalData.pB > 0 ? conditionalData.pAB / Math.min(conditionalData.pA, conditionalData.pB) : 0);
  const distAB = maxOverlapDist + (minOverlapDist - maxOverlapDist) * Math.max(0, Math.min(1, tOverlap));
  const rawCenterBX = centerAX + distAB;
  const centerBY = centerAY;
  const omegaRight = rectOmega.x + rectOmega.width;
  const omegaBottom = rectOmega.y + rectOmega.height;
  const maxRA = Math.min(
    centerAX - rectOmega.x,
    omegaRight - centerAX,
    centerAY - rectOmega.y,
    omegaBottom - centerAY
  );
  const rA = Math.min(rawRA, maxRA);
  const maxCenterBX = omegaRight - rawRB - 4;
  const minCenterBX = centerAX + Math.abs(rawRA - rawRB) + 4;
  const centerBX = Math.max(minCenterBX, Math.min(maxCenterBX, rawCenterBX));
  const maxRB = Math.min(
    centerBX - rectOmega.x,
    omegaRight - centerBX,
    centerBY - rectOmega.y,
    omegaBottom - centerBY
  );
  const rB = Math.min(rawRB, maxRB);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: rectOmega.x,
        y: rectOmega.y,
        width: rectOmega.width,
        height: rectOmega.height,
        rx: 16,
        fill: isZoomedToA ? MATH_COLORS.gridSubtle : MATH_COLORS.white,
        stroke: isZoomedToA ? MATH_COLORS.axis : MATH_COLORS.textMuted,
        strokeWidth: 2,
        strokeDasharray: isZoomedToA ? "6 6" : void 0,
        className: "transition-all duration-500"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "text",
      {
        x: rectOmega.x + 20,
        y: rectOmega.y + 36,
        fontSize: fontScale(18),
        fontWeight: "bold",
        fill: isZoomedToA ? MATH_COLORS.textMuted : MATH_COLORS.labelTextLight,
        children: [
          "全样本空间 Ω ",
          isZoomedToA ? "(已被虚化)" : "(Area = 1.0)"
        ]
      }
    ),
    isZoomedToA && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: centerAX - rA - 30,
          y: centerAY - rA - 30,
          width: (rA + 30) * 2,
          height: (rA + 30) * 2,
          rx: 20,
          fill: withAlpha(MATH_COLORS.paramPrimary, 0.08),
          stroke: MATH_COLORS.paramPrimary,
          strokeWidth: 3,
          strokeDasharray: "8 4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: centerAX - rA - 20,
          y: centerAY - rA - 42,
          fontSize: fontScale(16),
          fontWeight: "bold",
          fill: MATH_COLORS.paramPrimary,
          children: "★ 样本空间已压缩为已知事件 A (新全集)"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("clipPath", { id: "clip-circle-a", children: /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: centerAX, cy: centerAY, r: rA }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "circle",
      {
        cx: centerAX,
        cy: centerAY,
        r: rA,
        fill: withAlpha(MATH_COLORS.paramPrimary, 0.22),
        stroke: MATH_COLORS.paramPrimary,
        strokeWidth: 3,
        className: "transition-all duration-300"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "circle",
      {
        cx: centerBX,
        cy: centerBY,
        r: rB,
        fill: withAlpha(MATH_COLORS.paramSecondary, isZoomedToA ? 0.1 : 0.2),
        stroke: MATH_COLORS.paramSecondary,
        strokeWidth: 2.5,
        strokeDasharray: isZoomedToA ? "4 4" : void 0,
        className: "transition-all duration-300"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("g", { clipPath: "url(#clip-circle-a)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "circle",
      {
        cx: centerBX,
        cy: centerBY,
        r: rB,
        fill: withAlpha(MATH_COLORS.functionTransformed, 0.65),
        stroke: MATH_COLORS.paramTertiary,
        strokeWidth: 3
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "text",
      {
        x: centerAX - (distAB > 20 ? rA * 0.4 : 0),
        y: centerAY - rA - 12,
        fontSize: fontScale(16),
        fontWeight: "bold",
        fill: MATH_COLORS.paramPrimary,
        textAnchor: "middle",
        children: [
          "事件 A [P(A) = ",
          conditionalData.pA.toFixed(2),
          "]"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "text",
      {
        x: centerBX + (distAB > 20 ? rB * 0.4 : 0),
        y: centerBY + rB + 24,
        fontSize: fontScale(15),
        fontWeight: "bold",
        fill: MATH_COLORS.paramSecondary,
        textAnchor: "middle",
        children: [
          "事件 B [P(B) = ",
          conditionalData.pB.toFixed(2),
          "]"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: centerAX + distAB / 2,
        y: centerAY + 6,
        fontSize: fontScale(14),
        fontWeight: "bold",
        fill: MATH_COLORS.white,
        textAnchor: "middle",
        className: "drop-shadow-md",
        children: "A ∩ B"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(100, 560)", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: 0,
          y: 0,
          width: 640,
          height: 60,
          rx: 12,
          fill: MATH_COLORS.white,
          stroke: MATH_COLORS.grid,
          strokeWidth: 1.5,
          className: "shadow-sm"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: 24,
          y: 36,
          fontSize: fontScale(15),
          fill: MATH_COLORS.labelTextLight,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("tspan", { fontWeight: "bold", children: "几何比值证明：" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tspan", { fill: MATH_COLORS.paramPrimary, fontWeight: "bold", children: [
              " ",
              "P(B|A)",
              " "
            ] }),
            "= Area(AB) / Area(A) = ",
            conditionalData.pAB.toFixed(2),
            " /",
            " ",
            conditionalData.pA.toFixed(2),
            " =",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tspan", { fill: MATH_COLORS.function, fontWeight: "bold", children: [
              " ",
              conditionalData.isDegenerate ? "无意义" : conditionalData.pB_given_A.toFixed(4)
            ] })
          ]
        }
      )
    ] })
  ] });
}
function TotalProbScene({ params, fontScale }) {
  const totalProbData = reactExports.useMemo(() => {
    const pA1 = params.pA1 ?? 0.4;
    const pA2 = params.pA2 ?? 0.35;
    const pA3 = Math.max(0, 1 - pA1 - pA2);
    const inputs = [
      {
        key: "A1",
        name: "划分 A₁",
        pAi: pA1,
        pB_given_Ai: params.pB_A1 ?? 0.6
      },
      {
        key: "A2",
        name: "划分 A₂",
        pAi: pA2,
        pB_given_Ai: params.pB_A2 ?? 0.3
      },
      {
        key: "A3",
        name: "划分 A₃",
        pAi: pA3,
        pB_given_Ai: params.pB_A3 ?? 0.8
      }
    ];
    return calculateTotalProb(inputs);
  }, [params.pA1, params.pA2, params.pB_A1, params.pB_A2, params.pB_A3]);
  const leftWidth = 380;
  const startX = 60;
  const startY = 70;
  const treemapHeight = 440;
  const w1 = leftWidth * totalProbData.partitions[0].pAi;
  const w2 = leftWidth * totalProbData.partitions[1].pAi;
  const w3 = leftWidth * totalProbData.partitions[2].pAi;
  const h1B = treemapHeight * totalProbData.partitions[0].pB_given_Ai;
  const h2B = treemapHeight * totalProbData.partitions[1].pB_given_Ai;
  const h3B = treemapHeight * totalProbData.partitions[2].pB_given_Ai;
  const treeStartX = 510;
  const rootPt = { x: treeStartX, y: 290 };
  const nodesA = [
    {
      x: treeStartX + 120,
      y: 130,
      item: totalProbData.partitions[0],
      color: MATH_COLORS.paramPrimary
    },
    {
      x: treeStartX + 120,
      y: 290,
      item: totalProbData.partitions[1],
      color: MATH_COLORS.paramSecondary
    },
    {
      x: treeStartX + 120,
      y: 450,
      item: totalProbData.partitions[2],
      color: MATH_COLORS.paramTertiary
    }
  ];
  const nodeB = { x: treeStartX + 260, y: 290 };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: startX,
        y: startY - 16,
        fontSize: fontScale(17),
        fontWeight: "bold",
        fill: MATH_COLORS.labelText,
        children: "1. 完备划分与加权面积图 (Treemap)"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: startX,
        y: startY,
        width: leftWidth,
        height: treemapHeight,
        rx: 8,
        fill: MATH_COLORS.white,
        stroke: MATH_COLORS.axis,
        strokeWidth: 2
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: startX,
        y: startY,
        width: w1,
        height: treemapHeight,
        fill: withAlpha(MATH_COLORS.paramPrimary, 0.08),
        stroke: MATH_COLORS.paramPrimary,
        strokeWidth: 1.5
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: startX,
        y: startY + (treemapHeight - h1B),
        width: w1,
        height: h1B,
        fill: withAlpha(MATH_COLORS.paramPrimary, 0.45),
        stroke: MATH_COLORS.paramPrimary,
        strokeWidth: 2
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: startX + w1,
        y: startY,
        width: w2,
        height: treemapHeight,
        fill: withAlpha(MATH_COLORS.paramSecondary, 0.08),
        stroke: MATH_COLORS.paramSecondary,
        strokeWidth: 1.5
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: startX + w1,
        y: startY + (treemapHeight - h2B),
        width: w2,
        height: h2B,
        fill: withAlpha(MATH_COLORS.paramSecondary, 0.45),
        stroke: MATH_COLORS.paramSecondary,
        strokeWidth: 2
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: startX + w1 + w2,
        y: startY,
        width: w3,
        height: treemapHeight,
        fill: withAlpha(MATH_COLORS.paramTertiary, 0.08),
        stroke: MATH_COLORS.paramTertiary,
        strokeWidth: 1.5
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: startX + w1 + w2,
        y: startY + (treemapHeight - h3B),
        width: w3,
        height: h3B,
        fill: withAlpha(MATH_COLORS.paramTertiary, 0.45),
        stroke: MATH_COLORS.paramTertiary,
        strokeWidth: 2
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "text",
      {
        x: startX + w1 / 2,
        y: startY + 24,
        fontSize: fontScale(14),
        fontWeight: "bold",
        fill: MATH_COLORS.paramPrimary,
        textAnchor: "middle",
        children: [
          "A₁ (",
          totalProbData.partitions[0].pAi.toFixed(2),
          ")"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "text",
      {
        x: startX + w1 + w2 / 2,
        y: startY + 24,
        fontSize: fontScale(14),
        fontWeight: "bold",
        fill: MATH_COLORS.paramSecondary,
        textAnchor: "middle",
        children: [
          "A₂ (",
          totalProbData.partitions[1].pAi.toFixed(2),
          ")"
        ]
      }
    ),
    w3 > 15 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "text",
      {
        x: startX + w1 + w2 + w3 / 2,
        y: startY + 24,
        fontSize: fontScale(14),
        fontWeight: "bold",
        fill: MATH_COLORS.paramTertiary,
        textAnchor: "middle",
        children: [
          "A₃ (",
          totalProbData.partitions[2].pAi.toFixed(2),
          ")"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "text",
      {
        x: startX + leftWidth / 2,
        y: startY + treemapHeight - 20,
        fontSize: fontScale(16),
        fontWeight: "bold",
        fill: MATH_COLORS.labelText,
        textAnchor: "middle",
        children: [
          "★ 结果 B 区域 (总阴影面积 P(B) = ",
          totalProbData.pB.toFixed(3),
          ")"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: treeStartX - 10,
        y: startY - 16,
        fontSize: fontScale(17),
        fontWeight: "bold",
        fill: MATH_COLORS.labelText,
        children: "2. 分枝树状图与管道汇流"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "circle",
      {
        cx: rootPt.x,
        cy: rootPt.y,
        r: 16,
        fill: MATH_COLORS.labelTextLight
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: rootPt.x,
        y: rootPt.y + 5,
        fontSize: fontScale(13),
        fill: MATH_COLORS.white,
        textAnchor: "middle",
        fontWeight: "bold",
        children: "Ω"
      }
    ),
    nodesA.map((nA, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: rootPt.x,
          y1: rootPt.y,
          x2: nA.x,
          y2: nA.y,
          stroke: nA.color,
          strokeWidth: Math.max(1.5, nA.item.pAi * 8)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: (rootPt.x + nA.x) / 2 - 24,
          y: (rootPt.y + nA.y) / 2 - 12,
          width: 48,
          height: 20,
          rx: 4,
          fill: MATH_COLORS.white,
          stroke: nA.color
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: (rootPt.x + nA.x) / 2,
          y: (rootPt.y + nA.y) / 2 + 3,
          fontSize: fontScale(11),
          fontWeight: "bold",
          fill: nA.color,
          textAnchor: "middle",
          children: nA.item.pAi.toFixed(2)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: nA.x, cy: nA.y, r: 22, fill: nA.color }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: nA.x,
          y: nA.y + 5,
          fontSize: fontScale(13),
          fill: MATH_COLORS.white,
          textAnchor: "middle",
          fontWeight: "bold",
          children: nA.item.name.replace("划分 ", "")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: nA.x,
          y1: nA.y,
          x2: nodeB.x,
          y2: nodeB.y,
          stroke: nA.color,
          strokeWidth: Math.max(1, nA.item.pJoint * 12),
          strokeDasharray: "6 3"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: (nA.x + nodeB.x) / 2 + 6,
          y: (nA.y + nodeB.y) / 2 + (i === 0 ? -6 : i === 2 ? 14 : 0),
          fontSize: fontScale(12),
          fontWeight: "bold",
          fill: nA.color,
          children: [
            "P(B|",
            nA.item.name.replace("划分 ", ""),
            ")=",
            nA.item.pB_given_Ai.toFixed(2)
          ]
        }
      )
    ] }, i)),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: nodeB.x, cy: nodeB.y, r: 26, fill: MATH_COLORS.function }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: nodeB.x,
        y: nodeB.y + 6,
        fontSize: fontScale(16),
        fill: MATH_COLORS.white,
        textAnchor: "middle",
        fontWeight: "bold",
        children: "B"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(60, 535)", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: 0,
          y: 0,
          width: 720,
          height: 55,
          rx: 10,
          fill: MATH_COLORS.white,
          stroke: MATH_COLORS.grid,
          strokeWidth: 1.5,
          className: "shadow-sm"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: 20,
          y: 33,
          fontSize: fontScale(14),
          fill: MATH_COLORS.labelTextLight,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("tspan", { fontWeight: "bold", children: "全概率路径汇加：" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tspan", { fill: MATH_COLORS.function, fontWeight: "bold", children: [
              " ",
              "P(B)",
              " "
            ] }),
            "= ",
            totalProbData.partitions[0].pAi.toFixed(2),
            "×",
            totalProbData.partitions[0].pB_given_Ai.toFixed(2),
            " +",
            " ",
            totalProbData.partitions[1].pAi.toFixed(2),
            "×",
            totalProbData.partitions[1].pB_given_Ai.toFixed(2),
            " +",
            " ",
            totalProbData.partitions[2].pAi.toFixed(2),
            "×",
            totalProbData.partitions[2].pB_given_Ai.toFixed(2),
            " =",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "tspan",
              {
                fill: MATH_COLORS.function,
                fontWeight: "bold",
                fontSize: fontScale(16),
                children: totalProbData.pB.toFixed(4)
              }
            )
          ]
        }
      )
    ] })
  ] });
}
function BayesScreeningScene({
  params,
  bayesPreset = "screening",
  fontScale
}) {
  const bayesData = reactExports.useMemo(() => {
    const pPriorD = params.pPriorD ?? 0.02;
    const pSensitivity = params.pSensitivity ?? 0.95;
    const pFalsePositive = params.pFalsePositive ?? 0.05;
    return calculateBayesDiagnostic(pPriorD, pSensitivity, pFalsePositive);
  }, [params.pPriorD, params.pSensitivity, params.pFalsePositive]);
  const isFactory = bayesPreset === "factory";
  const group1Title = isFactory ? "次品组 (Def)" : "患病组 (D)";
  const group2Title = isFactory ? "合格组 (~Def)" : "健康组 (~D)";
  const truePosLabel = isFactory ? "次品检出 (+)" : "真阳性 (+)";
  const falsePosLabel = isFactory ? "合格误判 (+)" : "假阳性/误报 (+)";
  const targetSymbol = isFactory ? "Def" : "D";
  const sickCount = Math.round(1e3 * bayesData.pPriorD);
  const healthyCount = 1e3 - sickCount;
  const truePosCount = Math.round(sickCount * bayesData.pSensitivity);
  const falsePosCount = Math.round(healthyCount * bayesData.pFalsePositive);
  const leftCols = 5;
  const leftCellSize = 11;
  const leftGap = 4;
  const leftStartX = 65;
  const leftStartY = 110;
  const leftCells = Array.from({ length: sickCount }).map((_, idx) => {
    const isPositive = idx < truePosCount;
    const col = idx % leftCols;
    const row = Math.floor(idx / leftCols);
    return {
      x: leftStartX + col * (leftCellSize + leftGap),
      y: leftStartY + row * (leftCellSize + leftGap),
      fill: isPositive ? MATH_COLORS.paramPrimary : MATH_COLORS.degeneracy,
      isPositive
    };
  });
  const rightCols = 35;
  const rightCellSize = 10;
  const rightGap = 3.5;
  const rightStartX = 240;
  const rightStartY = 110;
  const rightCells = Array.from({ length: healthyCount }).map((_, idx) => {
    const isPositive = idx < falsePosCount;
    const col = idx % rightCols;
    const row = Math.floor(idx / rightCols);
    return {
      x: rightStartX + col * (rightCellSize + rightGap),
      y: rightStartY + row * (rightCellSize + rightGap),
      fill: isPositive ? MATH_COLORS.paramSecondary : withAlpha(MATH_COLORS.axis, 0.4),
      isPositive
    };
  });
  const totalPositives = truePosCount + falsePosCount;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "text",
      {
        x: 60,
        y: 50,
        fontSize: fontScale(18),
        fontWeight: "bold",
        fill: MATH_COLORS.labelText,
        children: [
          "1000 ",
          isFactory ? "件产品次品检测" : "人群体样本诊断",
          "模拟 (先验",
          isFactory ? "次品率" : "患病率",
          " P(",
          targetSymbol,
          ") =",
          " ",
          (bayesData.pPriorD * 100).toFixed(1),
          "%)"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: 50,
          y: 75,
          width: 160,
          height: 330,
          rx: 12,
          fill: withAlpha(MATH_COLORS.paramPrimary, 0.04),
          stroke: MATH_COLORS.paramPrimary,
          strokeWidth: 1.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: 65,
          y: 98,
          fontSize: fontScale(14),
          fontWeight: "bold",
          fill: MATH_COLORS.paramPrimary,
          children: [
            group1Title,
            ": ",
            sickCount,
            " 人"
          ]
        }
      ),
      leftCells.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: c.x,
          y: c.y,
          width: leftCellSize,
          height: leftCellSize,
          rx: 2.5,
          fill: c.fill
        },
        `left-${i}`
      )),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(62, 335)", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            rx: 2,
            fill: MATH_COLORS.paramPrimary
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: 16,
            y: 9,
            fontSize: fontScale(12),
            fontWeight: "bold",
            fill: MATH_COLORS.paramPrimary,
            children: [
              truePosLabel,
              ": ",
              truePosCount
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: 0,
            y: 20,
            width: 10,
            height: 10,
            rx: 2,
            fill: MATH_COLORS.degeneracy
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: 16,
            y: 29,
            fontSize: fontScale(12),
            fill: MATH_COLORS.labelTextLight,
            children: [
              isFactory ? "次品漏检" : "患病漏诊",
              ": ",
              sickCount - truePosCount
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: 225,
          y: 75,
          width: 545,
          height: 330,
          rx: 12,
          fill: withAlpha(MATH_COLORS.axis, 0.05),
          stroke: MATH_COLORS.axis,
          strokeWidth: 1.5
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: 240,
          y: 98,
          fontSize: fontScale(14),
          fontWeight: "bold",
          fill: MATH_COLORS.labelText,
          children: [
            group2Title,
            ": ",
            healthyCount,
            " 人"
          ]
        }
      ),
      rightCells.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: c.x,
          y: c.y,
          width: rightCellSize,
          height: rightCellSize,
          rx: 2,
          fill: c.fill
        },
        `right-${i}`
      )),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(240, 335)", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            rx: 2,
            fill: MATH_COLORS.paramSecondary
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: 16,
            y: 9,
            fontSize: fontScale(12),
            fontWeight: "bold",
            fill: MATH_COLORS.paramSecondary,
            children: [
              falsePosLabel,
              ": ",
              falsePosCount,
              " 人 (误报)"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: 180,
            y: 0,
            width: 10,
            height: 10,
            rx: 2,
            fill: withAlpha(MATH_COLORS.axis, 0.5)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: 196,
            y: 9,
            fontSize: fontScale(12),
            fill: MATH_COLORS.labelTextLight,
            children: [
              isFactory ? "合格正常 (+)" : "健康阴性 (-)",
              ":",
              " ",
              healthyCount - falsePosCount,
              " 人"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(50, 420)", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: 0,
          y: 0,
          width: 720,
          height: 180,
          rx: 14,
          fill: MATH_COLORS.white,
          stroke: MATH_COLORS.functionTransformed,
          strokeWidth: 2,
          className: "shadow-sm"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: 24,
          y: 32,
          fontSize: fontScale(16),
          fontWeight: "bold",
          fill: MATH_COLORS.functionTransformed,
          children: [
            "★ 逆向后验分析：在所有检测为阳性 (+) 的人群中，实际",
            isFactory ? "为次品" : "患病",
            "的概率"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(24, 48)", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: 0,
            y: 0,
            width: 672,
            height: 36,
            rx: 8,
            fill: withAlpha(MATH_COLORS.axis, 0.1)
          }
        ),
        totalPositives > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: 0,
            y: 0,
            width: Math.max(12, 672 * truePosCount / totalPositives),
            height: 36,
            rx: 8,
            fill: MATH_COLORS.paramPrimary
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: 16,
            y: 23,
            fontSize: fontScale(13),
            fontWeight: "bold",
            fill: MATH_COLORS.white,
            children: [
              truePosLabel,
              ": ",
              truePosCount,
              " 人 (",
              (bayesData.pPosteriorD * 100).toFixed(1),
              "%)"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: Math.max(200, 672 * truePosCount / totalPositives + 16),
            y: 23,
            fontSize: fontScale(13),
            fontWeight: "bold",
            fill: MATH_COLORS.paramSecondary,
            children: [
              falsePosLabel,
              ": ",
              falsePosCount,
              " 人 (",
              ((1 - bayesData.pPosteriorD) * 100).toFixed(1),
              "%)"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(24, 110)", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: 0,
            y: 20,
            fontSize: fontScale(15),
            fill: MATH_COLORS.labelText,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("tspan", { fontWeight: "bold", children: [
                "后验概率计算 P(",
                targetSymbol,
                "|+) = "
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("tspan", { fill: MATH_COLORS.paramPrimary, fontWeight: "bold", children: [
                " ",
                truePosLabel,
                " (",
                truePosCount,
                "人)",
                " "
              ] }),
              "/ [",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("tspan", { fill: MATH_COLORS.paramPrimary, fontWeight: "bold", children: [
                " ",
                truePosCount,
                "人",
                " "
              ] }),
              "+",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("tspan", { fill: MATH_COLORS.paramSecondary, fontWeight: "bold", children: [
                " ",
                falsePosLabel,
                " (",
                falsePosCount,
                "人)",
                " "
              ] }),
              "]"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: 0,
            y: 48,
            fontSize: fontScale(18),
            fontWeight: "bold",
            fill: MATH_COLORS.derivative,
            children: [
              "= ",
              truePosCount,
              " / ",
              totalPositives,
              " =",
              " ",
              (bayesData.pPosteriorD * 100).toFixed(2),
              "%"
            ]
          }
        )
      ] })
    ] })
  ] });
}
function ProbabilityBayesScene({
  params,
  activeMode,
  isZoomedToA = false,
  bayesPreset = "screening",
  fontScale = (v) => v
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    activeMode === "conditional" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConditionalScene,
      {
        params,
        isZoomedToA,
        fontScale
      }
    ),
    activeMode === "total_prob" && /* @__PURE__ */ jsxRuntimeExports.jsx(TotalProbScene, { params, fontScale }),
    activeMode === "bayes" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      BayesScreeningScene,
      {
        params,
        bayesPreset,
        fontScale
      }
    )
  ] });
}
function ProbabilityBayesAnimation() {
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const [activeMode, setActiveMode] = reactExports.useState("conditional");
  const [isZoomedToA, setIsZoomedToA] = reactExports.useState(false);
  const [bayesPreset, setBayesPreset] = reactExports.useState("screening");
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5]
  });
  const mathData = reactExports.useMemo(() => {
    return buildProbabilityBayesPanel(params, { activeMode, bayesPreset });
  }, [params, activeMode, bayesPreset]);
  const currentFormulaLatex = reactExports.useMemo(() => {
    if (activeMode === "conditional") {
      const pABVal = Math.min(
        params.pAB,
        Math.min(params.pA, params.pB)
      ).toFixed(2);
      const pAVal = params.pA.toFixed(2);
      const pBGivenA = params.pA > 0 ? (params.pAB / params.pA).toFixed(3) : "\\text{无意义}";
      return `\\color{${MATH_COLORS.function}}{P(B|A)} = \\frac{\\color{${MATH_COLORS.paramTertiary}}{P(AB)}}{\\color{${MATH_COLORS.paramPrimary}}{P(A)}} = \\frac{${pABVal}}{${pAVal}} = ${pBGivenA}`;
    }
    if (activeMode === "total_prob") {
      const pA1 = (params.pA1 ?? 0.4).toFixed(2);
      const pA2 = (params.pA2 ?? 0.35).toFixed(2);
      const pA3 = Math.max(0, 1 - params.pA1 - params.pA2).toFixed(2);
      return `\\color{${MATH_COLORS.function}}{P(B)} = \\sum_{i=1}^3 P(A_i)P(B|A_i) = ${pA1}\\cdot P(B|A_1) + ${pA2}\\cdot P(B|A_2) + ${pA3}\\cdot P(B|A_3)`;
    }
    const pD = params.pPriorD ?? 0.02;
    const pNotD = 1 - pD;
    const pSens = params.pSensitivity ?? 0.95;
    const pFalse = params.pFalsePositive ?? 0.05;
    const pTrueJoint = pD * pSens;
    const pFalseJoint = pNotD * pFalse;
    const pTotalPos = pTrueJoint + pFalseJoint;
    const pPosterior = pTotalPos > 0 ? pTrueJoint / pTotalPos * 100 : 0;
    const isFactory = bayesPreset === "factory";
    const targetSymbol = isFactory ? "\\text{Def}" : "D";
    return `\\color{${MATH_COLORS.derivative}}{P(${targetSymbol}|+)} = \\frac{${pD.toFixed(3)} \\times ${pSens.toFixed(2)}}{${pD.toFixed(3)} \\times ${pSens.toFixed(2)} + ${pNotD.toFixed(3)} \\times ${pFalse.toFixed(2)}} = ${pPosterior.toFixed(2)}\\%`;
  }, [activeMode, params, bayesPreset]);
  const paramConfigs = reactExports.useMemo(() => {
    const keysByMode = {
      conditional: ["pA", "pB", "pAB"],
      total_prob: ["pA1", "pA2", "pB_A1", "pB_A2", "pB_A3"],
      bayes: ["pPriorD", "pSensitivity", "pFalsePositive"]
    };
    const isFactory = bayesPreset === "factory";
    const keys = keysByMode[activeMode] ?? Object.keys(paramMeta);
    return keys.filter((key) => key in paramMeta).map((key) => {
      const meta = paramMeta[key];
      let label = meta.label;
      let labelFormula = meta.labelFormula;
      let description = meta.description;
      if (activeMode === "bayes" && isFactory) {
        if (key === "pPriorD") {
          label = "次品先验概率 P(Def)";
          labelFormula = "P(\\text{Def})";
          description = "流水线生产零配件的自然次品率";
        } else if (key === "pSensitivity") {
          label = "次品检出率 P(+|Def)";
          labelFormula = "P(+|\\text{Def})";
          description = "质检仪器在次品中准确检测出阳性的概率";
        } else if (key === "pFalsePositive") {
          label = "合格误判率 P(+|~Def)";
          labelFormula = "P(+|\\bar{\\text{Def}})";
          description = "质检仪器将合格品误判为次品的概率";
        }
      }
      return {
        key,
        label,
        labelFormula,
        value: params[key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.01,
        description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks
      };
    });
  }, [params, activeMode, bayesPreset]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    if (activeMode === "bayes") {
      setBayesPreset("custom");
    }
  };
  const handleReset = () => {
    setParams({ ...defaultParams });
    setBayesPreset("screening");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "模式选择", subtitle: "从样本空间到逆向诊断", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabSwitcher,
          {
            tabs: [
              { key: "conditional", label: "条件概率", formula: "P(B|A)" },
              {
                key: "total_prob",
                label: "全概率公式",
                formula: "P(B)=\\sum P_i P(B|A_i)"
              },
              { key: "bayes", label: "贝叶斯公式", formula: "P(A_k|B)" }
            ],
            value: activeMode,
            onChange: (k) => setActiveMode(k)
          }
        ) }),
        activeMode === "conditional" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "视角与样本空间",
            subtitle: "观察已知 A 发生下的样本空间压缩",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                columns: 1,
                items: [
                  {
                    key: "full",
                    label: "全样本空间 Ω",
                    description: "Area = 1.0"
                  },
                  {
                    key: "compressed",
                    label: "压缩样本空间 A",
                    description: "已知 A 发生"
                  }
                ],
                value: isZoomedToA ? "compressed" : "full",
                onChange: (k) => setIsZoomedToA(k === "compressed")
              }
            )
          }
        ),
        activeMode === "bayes" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "高考经典场景预设",
            subtitle: "一键加载常考应用模型",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                columns: 1,
                items: [
                  {
                    key: "screening",
                    label: "罕见病筛查",
                    description: "患病率 P(D) = 2%, 灵敏度 95%"
                  },
                  {
                    key: "factory",
                    label: "工厂次品检验",
                    description: "次品率 P(Def) = 8%, 检出率 98%"
                  }
                ],
                value: bayesPreset === "custom" ? "" : bayesPreset,
                onChange: (k) => {
                  if (k === "screening") {
                    setParams((prev) => ({
                      ...prev,
                      pPriorD: 0.02,
                      pSensitivity: 0.95,
                      pFalsePositive: 0.05
                    }));
                    setBayesPreset("screening");
                  } else {
                    setParams((prev) => ({
                      ...prev,
                      pPriorD: 0.08,
                      pSensitivity: 0.98,
                      pFalsePositive: 0.02
                    }));
                    setBayesPreset("factory");
                  }
                }
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "动态参数调节",
            subtitle: "拖动滑块观察图象与公式联动",
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-3 right-3 z-10 bg-white/95 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm max-w-[65%] overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          KatexFormula,
          {
            formula: currentFormulaLatex,
            mode: "inline",
            className: "!text-[13px]"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AnimationSvgCanvas,
          {
            containerRef,
            transform: vp.transform,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              ProbabilityBayesScene,
              {
                params,
                scale,
                vp,
                activeMode,
                isZoomedToA,
                bayesPreset: bayesPreset || "",
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
          title: "条件概率与贝叶斯看板"
        }
      )
    }
  );
}
export {
  ProbabilityBayesAnimation
};
