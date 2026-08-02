import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { b as MATH_COLORS, w as withAlpha, T as ThreePanel, M as MathPanel, K as KatexFormula, L as LeftPanel, a as LeftPanelSection, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-DNLi5nE3.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-EFHImEeJ.js";
import { T as TabSwitcher } from "./TabSwitcher--Cq6ch7f.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { S as getPascalTriangle, T as getAllBinomialTerms, U as perm, V as comb, W as buildMultiplicationTree, X as buildAdditionTree, b as buildMathQuantities, Y as getBinomialTerm, Z as factorial } from "./mathQuantities-CPwsyb9V.js";
import "./useRadioGroup-DJLu5uAU.js";
function BinomialScene({
  params,
  onParamChange,
  fontScale = (v) => v
}) {
  const n = Math.floor(params.n ?? 5);
  const k = Math.min(Math.floor(params.k ?? 2), n);
  const a = params.a ?? 1;
  const b = params.b ?? 1;
  const W = 840;
  const pascalTriangle = reactExports.useMemo(() => {
    return getPascalTriangle(Math.min(n, 8));
  }, [n]);
  const binomialTerms = reactExports.useMemo(() => {
    return getAllBinomialTerms(n, a, b);
  }, [n, a, b]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(0, 10)", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: 40,
        y1: 422,
        x2: W - 40,
        y2: 422,
        stroke: MATH_COLORS.grid,
        strokeDasharray: "4 4",
        strokeWidth: 1
      }
    ),
    pascalTriangle.map((row, r) => {
      const count = row.length;
      const startY = 45;
      const rowGap = 42;
      const nodeRadius = 18;
      const y = startY + r * rowGap;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: 65,
            y: y + 5,
            fill: r === n ? MATH_COLORS.paramPrimary : MATH_COLORS.textMuted,
            fontSize: fontScale(12),
            fontWeight: r === n ? "bold" : "normal",
            children: [
              "n = ",
              r
            ]
          }
        ),
        row.map((val, c) => {
          const totalWidth = (count - 1) * 54;
          const x = W / 2 - totalWidth / 2 + c * 54;
          const isCurrentRow = r === n;
          const isSelectedNode = isCurrentRow && c === k;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "g",
            {
              onClick: () => {
                onParamChange("n", r);
                onParamChange("k", c);
              },
              className: "cursor-pointer transition-all duration-300",
              children: [
                r > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
                  c > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "line",
                    {
                      x1: x,
                      y1: y,
                      x2: W / 2 - (r - 1) * 54 / 2 + (c - 1) * 54,
                      y2: y - rowGap,
                      stroke: isSelectedNode ? MATH_COLORS.paramPrimary : MATH_COLORS.pascalLinkLine,
                      strokeWidth: isSelectedNode ? 2.5 : 1,
                      strokeOpacity: isSelectedNode ? 1 : 0.4
                    }
                  ),
                  c < r && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "line",
                    {
                      x1: x,
                      y1: y,
                      x2: W / 2 - (r - 1) * 54 / 2 + c * 54,
                      y2: y - rowGap,
                      stroke: isSelectedNode ? MATH_COLORS.paramPrimary : MATH_COLORS.pascalLinkLine,
                      strokeWidth: isSelectedNode ? 2.5 : 1,
                      strokeOpacity: isSelectedNode ? 1 : 0.4
                    }
                  )
                ] }),
                isSelectedNode && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "circle",
                  {
                    cx: x,
                    cy: y,
                    r: nodeRadius + 6,
                    fill: MATH_COLORS.pascalSelectedGlow,
                    stroke: MATH_COLORS.paramPrimary,
                    strokeWidth: 2,
                    className: "animate-pulse"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "circle",
                  {
                    cx: x,
                    cy: y,
                    r: nodeRadius,
                    fill: isSelectedNode ? MATH_COLORS.paramPrimary : isCurrentRow ? withAlpha(MATH_COLORS.paramSecondary, 0.15) : MATH_COLORS.pascalNodeBg,
                    stroke: isSelectedNode ? MATH_COLORS.paramPrimary : isCurrentRow ? MATH_COLORS.paramSecondary : MATH_COLORS.pascalNodeBorder,
                    strokeWidth: isSelectedNode || isCurrentRow ? 2 : 1
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "text",
                  {
                    x,
                    y: y + 4,
                    textAnchor: "middle",
                    fill: isSelectedNode ? MATH_COLORS.white : MATH_COLORS.labelText,
                    fontSize: fontScale(val > 99 ? 10 : 12),
                    fontWeight: isSelectedNode ? "bold" : "normal",
                    children: val
                  }
                )
              ]
            },
            `node-${r}-${c}`
          );
        })
      ] }, `row-${r}`);
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("g", { transform: "translate(60, 455)", children: binomialTerms.map((term, index) => {
      const numTerms = binomialTerms.length;
      const barGroupWidth = Math.min(680 / numTerms, 70);
      const x = index * barGroupWidth + 20;
      const isSelected = index === k;
      const maxCoeff = Math.max(
        ...binomialTerms.map((t) => Math.abs(t.termCoeff)),
        ...binomialTerms.map((t) => t.binomialCoeff),
        1
      );
      const binomHeight = term.binomialCoeff / maxCoeff * 105;
      const termAbsHeight = Math.abs(term.termCoeff) / maxCoeff * 105;
      const isNegative = term.termCoeff < 0;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "g",
        {
          onClick: () => onParamChange("k", index),
          className: "cursor-pointer",
          children: [
            isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: x - 4,
                y: -10,
                width: barGroupWidth - 8,
                height: 150,
                fill: withAlpha(MATH_COLORS.paramPrimary, 0.08),
                stroke: MATH_COLORS.paramPrimary,
                strokeDasharray: "3 3",
                rx: 6
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x,
                y: 115 - binomHeight,
                width: barGroupWidth / 2 - 4,
                height: Math.max(binomHeight, 3),
                fill: isSelected ? MATH_COLORS.barFill : withAlpha(MATH_COLORS.barFill, 0.45),
                rx: 3
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "rect",
              {
                x: x + barGroupWidth / 2 - 2,
                y: 115 - termAbsHeight,
                width: barGroupWidth / 2 - 4,
                height: Math.max(termAbsHeight, 3),
                fill: isNegative ? MATH_COLORS.tangentLine : isSelected ? MATH_COLORS.functionTransformed : withAlpha(MATH_COLORS.functionTransformed, 0.5),
                rx: 3
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "text",
              {
                x: x + barGroupWidth / 2 - 3,
                y: 132,
                textAnchor: "middle",
                fill: isSelected ? MATH_COLORS.paramPrimary : MATH_COLORS.labelTextLight,
                fontSize: fontScale(11),
                fontWeight: isSelected ? "bold" : "normal",
                children: [
                  "T",
                  index + 1
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "text",
              {
                x: x + barGroupWidth / 2 - 3,
                y: 115 - Math.max(binomHeight, termAbsHeight) - 5,
                textAnchor: "middle",
                fill: isNegative ? MATH_COLORS.tangentLine : MATH_COLORS.labelText,
                fontSize: fontScale(9),
                fontWeight: "bold",
                children: term.termCoeff
              }
            )
          ]
        },
        `bar-${index}`
      );
    }) })
  ] });
}
const BALL_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
  "#F97316",
  "#84CC16"
];
function PermCombScene({
  params,
  fontScale = (v) => v
}) {
  const n = Math.floor(params.n ?? 5);
  const k = Math.min(Math.floor(params.k ?? 2), n);
  const P = perm(n, k);
  const C = comb(n, k);
  const balls = Array.from({ length: n }, (_, i) => ({
    id: i,
    label: String.fromCharCode(65 + i)
  }));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(40, 20)", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(20, 15)", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: 0,
          y: 0,
          width: 720,
          height: 95,
          fill: MATH_COLORS.poolBg,
          stroke: MATH_COLORS.poolBorder,
          strokeWidth: 1,
          rx: 12
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: 18,
          y: 28,
          fill: MATH_COLORS.labelText,
          fontSize: fontScale(13),
          fontWeight: "bold",
          children: [
            "原始元素池 (共 n = ",
            n,
            " 个不同元素):"
          ]
        }
      ),
      balls.map((ball, idx) => {
        const bx = 160 + idx * 54;
        const by = 54;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: bx,
              cy: by,
              r: 18,
              fill: BALL_COLORS[idx % BALL_COLORS.length],
              stroke: MATH_COLORS.white,
              strokeWidth: 2.5
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: bx,
              y: by + 5,
              textAnchor: "middle",
              fill: MATH_COLORS.white,
              fontSize: fontScale(13),
              fontWeight: "bold",
              children: ball.label
            }
          )
        ] }, `ball-${idx}`);
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(20, 130)", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: 0,
          y: 0,
          width: 345,
          height: 285,
          fill: MATH_COLORS.combCardBg,
          stroke: MATH_COLORS.combCardBorder,
          strokeWidth: 1.5,
          rx: 14
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(20, 75)", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: 0,
            y: 0,
            width: 305,
            height: 80,
            fill: MATH_COLORS.white,
            stroke: MATH_COLORS.combCardBorder,
            strokeDasharray: "4 4",
            rx: 8
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: 12,
            y: 22,
            fill: MATH_COLORS.combHeader,
            fontSize: fontScale(11),
            children: [
              "示例选出子集 {",
              " ",
              balls.slice(0, k).map((b) => b.label).join(", "),
              " ",
              "}"
            ]
          }
        ),
        balls.slice(0, k).map((_, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: 32 + idx * 45,
            cy: 48,
            r: 15,
            fill: BALL_COLORS[idx]
          },
          `c-sel-${idx}`
        ))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(20, 175)", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "rect",
          {
            x: 0,
            y: 0,
            width: 305,
            height: 80,
            fill: MATH_COLORS.white,
            stroke: MATH_COLORS.axis,
            rx: 8
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "text",
          {
            x: 12,
            y: 22,
            fill: MATH_COLORS.textMuted,
            fontSize: fontScale(11),
            children: [
              "余下补集 (共 n-k = ",
              n - k,
              " 个) 自动成组："
            ]
          }
        ),
        balls.slice(k).map((_, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: 32 + idx * 45,
            cy: 48,
            r: 15,
            fill: BALL_COLORS[k + idx],
            opacity: 0.65
          },
          `c-rem-${idx}`
        ))
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(395, 130)", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: 0,
          y: 0,
          width: 345,
          height: 285,
          fill: MATH_COLORS.permCardBg,
          stroke: MATH_COLORS.permCardBorder,
          strokeWidth: 1.5,
          rx: 14
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("g", { transform: "translate(18, 75)", children: Array.from({ length: Math.min(k, 5) }, (_, sIdx) => {
        const choicesLeft = n - sIdx;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: `translate(${sIdx * 62}, 0)`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "rect",
            {
              x: 0,
              y: 0,
              width: 56,
              height: 88,
              fill: MATH_COLORS.white,
              stroke: MATH_COLORS.permHeader,
              strokeWidth: 1.5,
              rx: 8
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: 28,
              y: 18,
              textAnchor: "middle",
              fill: MATH_COLORS.labelTextLight,
              fontSize: fontScale(10),
              children: [
                "槽位 ",
                sIdx + 1
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: 28,
              cy: 42,
              r: 13,
              fill: BALL_COLORS[sIdx % BALL_COLORS.length]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "text",
            {
              x: 28,
              y: 76,
              textAnchor: "middle",
              fill: MATH_COLORS.permHeader,
              fontSize: fontScale(10),
              fontWeight: "bold",
              children: [
                choicesLeft,
                " 种可能"
              ]
            }
          )
        ] }, `slot-${sIdx}`);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("g", { transform: "translate(20, 202)", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: 0,
          y: 12,
          fill: MATH_COLORS.permHeader,
          fontSize: fontScale(12),
          fontWeight: "bold",
          children: [
            "乘法分步连乘：",
            Array.from({ length: k }, (_, i) => n - i).join(" × "),
            " = ",
            P
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(20, 432)", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "rect",
        {
          x: 0,
          y: 0,
          width: 720,
          height: 58,
          fill: MATH_COLORS.tipBg,
          stroke: MATH_COLORS.tipBorder,
          strokeWidth: 1,
          rx: 10
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "text",
        {
          x: 20,
          y: 34,
          fill: MATH_COLORS.tipText,
          fontSize: fontScale(13),
          fontWeight: "bold",
          children: [
            "💡 核心区别直觉：排列 = 组合 × 内部全排列 (k!)。消去 ",
            k,
            "! 种内部顺序即得组合数 ",
            C,
            "。"
          ]
        }
      )
    ] })
  ] });
}
function PrinciplesScene({
  params,
  subMode = 0,
  fontScale = (v) => v
}) {
  const m1 = Math.floor(params.m1 ?? 3);
  const m2 = Math.floor(params.m2 ?? 2);
  const m3 = Math.floor(params.m3 ?? 2);
  const isMultiplication = subMode === 0;
  const multTree = reactExports.useMemo(() => {
    return buildMultiplicationTree(m1, m2, m3);
  }, [m1, m2, m3]);
  const addTree = reactExports.useMemo(() => {
    return buildAdditionTree(m1, m2);
  }, [m1, m2]);
  const tree = isMultiplication ? multTree : addTree;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("g", { transform: "translate(40, 25)", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: "translate(20, 20)", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rect",
      {
        x: 0,
        y: 0,
        width: 720,
        height: 470,
        fill: MATH_COLORS.poolBg,
        stroke: MATH_COLORS.poolBorder,
        strokeWidth: 1,
        rx: 14
      }
    ),
    tree.edges.map((edge) => {
      const fromNode = tree.nodes.find((n) => n.id === edge.from);
      const toNode = tree.nodes.find((n) => n.id === edge.to);
      if (!fromNode || !toNode) return null;
      const fx = 65 + fromNode.depth * 200;
      const fy = 60 + fromNode.y * 36;
      const tx = 65 + toNode.depth * 200;
      const ty = 60 + toNode.y * 36;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "line",
          {
            x1: fx,
            y1: fy,
            x2: tx,
            y2: ty,
            stroke: isMultiplication ? MATH_COLORS.paramPrimary : MATH_COLORS.paramSecondary,
            strokeWidth: 2,
            strokeOpacity: 0.7
          }
        ),
        edge.label && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: (fx + tx) / 2,
            y: (fy + ty) / 2 - 4,
            textAnchor: "middle",
            fill: MATH_COLORS.textMuted,
            fontSize: fontScale(9),
            children: edge.label
          }
        )
      ] }, edge.id);
    }),
    tree.nodes.map((node) => {
      const nx = 65 + node.depth * 200;
      const ny = 60 + node.y * 36;
      const isRoot = node.depth === 0;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: `translate(${nx}, ${ny})`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: 0,
            cy: 0,
            r: isRoot ? 16 : 12,
            fill: isRoot ? MATH_COLORS.paramPrimary : node.depth === 1 ? MATH_COLORS.paramSecondary : MATH_COLORS.paramTertiary,
            stroke: MATH_COLORS.white,
            strokeWidth: 2.5
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: 18,
            y: 4,
            fill: MATH_COLORS.labelText,
            fontSize: fontScale(isRoot ? 12 : 10),
            fontWeight: isRoot ? "bold" : "normal",
            children: node.label
          }
        )
      ] }, node.id);
    })
  ] }) });
}
function ProbabilityCountingScene({
  params,
  scale,
  vp,
  activeMode,
  subMode = 0,
  onParamChange,
  fontScale = (v) => v
}) {
  const commonProps = {
    params,
    scale,
    vp,
    activeMode,
    subMode,
    onParamChange,
    fontScale
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pattern",
      {
        id: "subtle-dot-grid",
        width: "20",
        height: "20",
        patternUnits: "userSpaceOnUse",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "2", cy: "2", r: "1", fill: MATH_COLORS.axis, opacity: "0.2" })
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { width: "100%", height: "100%", fill: "url(#subtle-dot-grid)" }),
    activeMode === "binomial" && /* @__PURE__ */ jsxRuntimeExports.jsx(BinomialScene, { ...commonProps }),
    activeMode === "perm_comb" && /* @__PURE__ */ jsxRuntimeExports.jsx(PermCombScene, { ...commonProps }),
    activeMode === "principles" && /* @__PURE__ */ jsxRuntimeExports.jsx(PrinciplesScene, { ...commonProps })
  ] });
}
const defaultParams = {
  n: 5,
  k: 2,
  a: 1,
  b: 1,
  m1: 3,
  m2: 2,
  m3: 2,
  subMode: 0
};
const paramMeta = {
  n: {
    key: "n",
    label: "总数/二项式指数 n",
    labelFormula: "n",
    min: 0,
    max: 10,
    step: 1,
    defaultValue: 5,
    importance: "core",
    description: "控制二项式 (ax+b)^n 的指数 n 或总元素个数 n",
    descriptionFormula: "控制 $(ax+b)^n$ 的指数 $n$",
    marks: [
      { value: 0, variant: "critical", label: "退化项", labelFormula: "n = 0" },
      {
        value: 5,
        variant: "recommended",
        label: "高频考点",
        labelFormula: "n = 5"
      },
      {
        value: 10,
        variant: "recommended",
        label: "上限",
        labelFormula: "n = 10"
      }
    ]
  },
  k: {
    key: "k",
    label: "选取数/展开项 k",
    labelFormula: "k",
    min: 0,
    max: 10,
    step: 1,
    defaultValue: 2,
    importance: "core",
    description: "二项展开式第 k+1 项 (T_{k+1}) 或组合数 C_n^k 中的 k",
    descriptionFormula: "通项 $T_{k+1}$ 或组合数 $C_n^k$ 中的 $k$",
    marks: [
      { value: 0, variant: "zero", label: "首项", labelFormula: "k = 0" }
    ]
  },
  a: {
    key: "a",
    label: "x 前系数 a",
    labelFormula: "a",
    min: -3,
    max: 3,
    step: 1,
    defaultValue: 1,
    importance: "advanced",
    description: "二项式 (ax+b)^n 中 x 的系数 a",
    descriptionFormula: "二项式 $(ax+b)^n$ 中 $x$ 的系数 $a$",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "无 x 项",
        labelFormula: "a = 0"
      },
      {
        value: 1,
        variant: "recommended",
        label: "标准",
        labelFormula: "a = 1"
      }
    ]
  },
  b: {
    key: "b",
    label: "常数项 b",
    labelFormula: "b",
    min: -3,
    max: 3,
    step: 1,
    defaultValue: 1,
    importance: "advanced",
    description: "二项式 (ax+b)^n 中的常数项 b",
    descriptionFormula: "二项式 $(ax+b)^n$ 中的常数项 $b$",
    marks: [
      {
        value: -1,
        variant: "recommended",
        label: "正负交替",
        labelFormula: "b = -1"
      },
      { value: 0, variant: "critical", label: "单项式", labelFormula: "b = 0" }
    ]
  },
  m1: {
    key: "m1",
    label: "步骤1 / 类别1 选择数",
    labelFormula: "m_1",
    min: 1,
    max: 5,
    step: 1,
    defaultValue: 3,
    importance: "advanced",
    description: "分步乘法第一步的分支数或分类加法第一类的方法数",
    descriptionFormula: "步骤 $1$ 或类别 $1$ 的分支数 $m_1$"
  },
  m2: {
    key: "m2",
    label: "步骤2 / 类别2 选择数",
    labelFormula: "m_2",
    min: 1,
    max: 4,
    step: 1,
    defaultValue: 2,
    importance: "advanced",
    description: "分步乘法第二步的分支数或分类加法第二类的方法数",
    descriptionFormula: "步骤 $2$ 或类别 $2$ 的分支数 $m_2$"
  },
  m3: {
    key: "m3",
    label: "步骤3 选择数",
    labelFormula: "m_3",
    min: 0,
    max: 3,
    step: 1,
    defaultValue: 2,
    importance: "advanced",
    description: "分步乘法第三步的分支数（为0时代表只有两步）",
    descriptionFormula: "步骤 $3$ 分支数 $m_3$"
  }
};
function ProbabilityCountingAnimation() {
  const [params, setParams] = reactExports.useState(() => ({
    ...defaultParams
  }));
  const [activeMode, setActiveMode] = reactExports.useState("binomial");
  const [subMode, setSubMode] = reactExports.useState(0);
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-10, 10],
    yRange: [-8, 8]
  });
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-probability-counting", params, {
      activeMode,
      subMode
    });
  }, [params, activeMode, subMode]);
  const equationLatex = reactExports.useMemo(() => {
    const n = Math.floor(params.n ?? 5);
    const k = Math.min(Math.floor(params.k ?? 2), n);
    const a = params.a ?? 1;
    const b = params.b ?? 1;
    if (activeMode === "binomial") {
      const info = getBinomialTerm(n, k, a, b);
      const aColorStr = `\\color{${MATH_COLORS.paramPrimary}}{${a}}`;
      const bColorStr = `\\color{${MATH_COLORS.paramSecondary}}{${b}}`;
      const nColorStr = `\\color{${MATH_COLORS.paramPrimary}}{${n}}`;
      const kColorStr = `\\color{${MATH_COLORS.paramSecondary}}{${k}}`;
      return `(${aColorStr}x + ${bColorStr})^{${nColorStr}} \\implies T_{${kColorStr}+1} = \\binom{${nColorStr}}{${kColorStr}} (${aColorStr}x)^{${n - k}} (${bColorStr})^{${kColorStr}} = ${Number.isInteger(info.termCoeff) ? info.termCoeff : info.termCoeff.toFixed(2)}x^{${info.powerA}}`;
    }
    if (activeMode === "perm_comb") {
      return `A_{\\color{${MATH_COLORS.paramPrimary}}{${n}}}^{\\color{${MATH_COLORS.paramSecondary}}{${k}}} = \\frac{${n}!}{\\left(${n}-${k}\\right)!}, \\quad C_{\\color{${MATH_COLORS.paramPrimary}}{${n}}}^{\\color{${MATH_COLORS.paramSecondary}}{${k}}} = \\frac{${n}!}{\\color{${MATH_COLORS.paramSecondary}}{${k}}!\\left(${n}-${k}\\right)!}`;
    }
    const m1 = Math.floor(params.m1 ?? 3);
    const m2 = Math.floor(params.m2 ?? 2);
    const m3 = Math.floor(params.m3 ?? 2);
    if (subMode === 0) {
      return `N_{\\text{乘}} = \\color{${MATH_COLORS.paramPrimary}}{${m1}} \\times \\color{${MATH_COLORS.paramSecondary}}{${m2}} ${m3 > 0 ? `\\times \\color{${MATH_COLORS.paramTertiary}}{${m3}}` : ""} = ${m1 * m2 * (m3 > 0 ? m3 : 1)}`;
    }
    return `N_{\\text{加}} = \\color{${MATH_COLORS.paramPrimary}}{${m1}} + \\color{${MATH_COLORS.paramSecondary}}{${m2}} = ${m1 + m2}`;
  }, [params, activeMode, subMode]);
  const paramConfigs = reactExports.useMemo(() => {
    const keysByMode = {
      binomial: ["n", "k", "a", "b"],
      perm_comb: ["n", "k"],
      principles: ["m1", "m2", "m3"]
    };
    const keys = keysByMode[activeMode] ?? Object.keys(paramMeta);
    return keys.filter((key) => key in paramMeta).map((key) => {
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
  }, [params, activeMode]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  const handleReset = () => {
    setParams({ ...defaultParams });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "模式选择", subtitle: "切换计数与定理探索主题", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabSwitcher,
          {
            tabs: [
              { key: "binomial", label: "二项式定理", formula: "(a+b)^n" },
              {
                key: "perm_comb",
                label: "排列与组合",
                formula: "A_n^k / C_n^k"
              },
              {
                key: "principles",
                label: "计数原理",
                formula: "N_\\text{乘} / N_\\text{加}"
              }
            ],
            value: activeMode,
            onChange: (k) => {
              setActiveMode(k);
              setSubMode(0);
            }
          }
        ) }),
        activeMode === "principles" && /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "原理类型", subtitle: "对比分步与分类机制", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              {
                key: "0",
                label: "分步乘法原理",
                formula: "N = m_1 \\times m_2"
              },
              { key: "1", label: "分类加法原理", formula: "N = m_1 + m_2" }
            ],
            value: String(subMode),
            onChange: (k) => setSubMode(Number(k)),
            columns: 1
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "参数调节", subtitle: "拖动滑块探索数形响应", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: handleReset
          }
        ) })
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full flex flex-col bg-white overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-12 shrink-0 border-b border-neutral-200 bg-neutral-50/80 px-4 flex items-center justify-between gap-4 shadow-2xs z-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 overflow-x-auto py-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded shadow-2xs", children: activeMode === "binomial" ? "二项展开通项" : activeMode === "perm_comb" ? "排列与组合公式" : "计数原理表达式" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white border border-neutral-200 rounded px-2.5 py-0.5 shadow-2xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: equationLatex, mode: "inline" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-400 font-medium shrink-0 hidden sm:inline", children: "点击/拖动参数可实时数形联动" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 relative overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "absolute inset-0 pointer-events-none z-10",
              style: {
                transform: `translate(${vp.tx}px, ${vp.ty}px) scale(${vp.scale})`,
                transformOrigin: "0 0"
              },
              children: [
                activeMode === "binomial" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "absolute whitespace-nowrap",
                      style: {
                        left: 40,
                        top: 25,
                        fontSize: 12,
                        fontWeight: "bold",
                        color: MATH_COLORS.labelTextLight
                      },
                      children: [
                        "金字塔递推节点 (高亮当前项",
                        " ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          KatexFormula,
                          {
                            formula: "T_{k+1}",
                            mode: "inline",
                            className: "!text-xs !my-0"
                          }
                        ),
                        " ",
                        ")"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "absolute whitespace-nowrap",
                      style: {
                        left: 40,
                        top: 442,
                        fontSize: 12,
                        fontWeight: "bold",
                        color: MATH_COLORS.labelTextLight
                      },
                      children: [
                        "展开项系数分布 (",
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          KatexFormula,
                          {
                            formula: "C_n^k",
                            mode: "inline",
                            className: "!text-xs !my-0"
                          }
                        ),
                        " ",
                        "湖蓝 vs 实际系数",
                        " ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          KatexFormula,
                          {
                            formula: "A_k",
                            mode: "inline",
                            className: "!text-xs !my-0"
                          }
                        ),
                        " ",
                        "粉红/红)"
                      ]
                    }
                  )
                ] }),
                activeMode === "perm_comb" && (() => {
                  const n = Math.floor(params.n ?? 5);
                  const k = Math.min(Math.floor(params.k ?? 2), n);
                  const C = comb(n, k);
                  const P = perm(n, k);
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "absolute whitespace-nowrap",
                        style: {
                          left: 115,
                          top: 182,
                          fontSize: 15,
                          fontWeight: "bold",
                          color: MATH_COLORS.combHeader
                        },
                        children: [
                          "组合",
                          " ",
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            KatexFormula,
                            {
                              formula: "C_n^k",
                              mode: "inline",
                              className: "!text-base !my-0"
                            }
                          ),
                          " ",
                          "= ",
                          C,
                          " (无序分组)"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "absolute whitespace-nowrap",
                        style: {
                          left: 490,
                          top: 182,
                          fontSize: 15,
                          fontWeight: "bold",
                          color: MATH_COLORS.permHeader
                        },
                        children: [
                          "排列",
                          " ",
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            KatexFormula,
                            {
                              formula: "A_n^k",
                              mode: "inline",
                              className: "!text-base !my-0"
                            }
                          ),
                          " ",
                          "= ",
                          P,
                          " (有序槽位)"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "absolute whitespace-nowrap",
                        style: {
                          left: 125,
                          top: 267,
                          fontSize: 11,
                          color: MATH_COLORS.labelTextLight
                        },
                        children: [
                          "与组合关系：",
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            KatexFormula,
                            {
                              formula: "A_n^k",
                              mode: "inline",
                              className: "!text-xs !my-0"
                            }
                          ),
                          " ",
                          "=",
                          " ",
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            KatexFormula,
                            {
                              formula: "C_n^k",
                              mode: "inline",
                              className: "!text-xs !my-0"
                            }
                          ),
                          " ",
                          "× k! = ",
                          C,
                          " × ",
                          factorial(k)
                        ]
                      }
                    )
                  ] });
                })()
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            AnimationSvgCanvas,
            {
              containerRef,
              transform: vp.transform,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                ProbabilityCountingScene,
                {
                  params,
                  scale,
                  vp,
                  activeMode,
                  subMode,
                  onParamChange: handleParamChange,
                  fontScale: canvasSize.font
                }
              )
            }
          )
        ] })
      ] }),
      right: /* @__PURE__ */ jsxRuntimeExports.jsx(
        MathPanel,
        {
          quantities: mathData.quantities,
          theorems: mathData.theorems,
          gaokaoPoints: mathData.gaokaoPoints,
          warnings: mathData.warnings,
          mnemonic: mathData.mnemonic,
          title: "计数原理与二项式定理看板"
        }
      )
    }
  );
}
export {
  ProbabilityCountingAnimation
};
