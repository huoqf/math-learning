import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { b as MATH_COLORS, w as withAlpha, T as ThreePanel, M as MathPanel, L as LeftPanel, a as LeftPanelSection, K as KatexFormula, P as ParamControl, C as CANVAS_PRESETS } from "./probabilityBayes-BWtGIkMp.js";
import { u as useAnimationViewport, a as useSceneScale, A as AnimationSvgCanvas } from "./useSceneScale-B-cSokTr.js";
import { T as TabSwitcher } from "./TabSwitcher-BlfhUjmU.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import { C as CoordinateGrid } from "./CoordinateGrid-BmMyIyOq.js";
import { m as mathToDesign } from "./coordinate-9upJ5J84.js";
import { I as InteractivePoint } from "./InteractivePoint-ZTf14j6W.js";
import { a as avoidLabels } from "./labelAvoider-DY-BzTvY.js";
import { b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import "./useRadioGroup-jCNJTR-s.js";
function getFirstDefData(conicType, a, c, p, theta) {
  if (conicType === "ellipse") {
    if (a <= c) {
      return {
        points: [
          { x: -c, y: 0 },
          { x: c, y: 0 }
        ],
        foci: { f1: { x: -c, y: 0 }, f2: { x: c, y: 0 } },
        pPoint: { x: a * Math.cos(theta), y: 0 },
        d1: c + a * Math.cos(theta),
        d2: c - a * Math.cos(theta),
        isDegenerate: true,
        degenerateReason: a === c ? "2a = 2c 退化为线段 F₁F₂" : "2a < 2c 无轨迹"
      };
    }
    const b = Math.sqrt(a * a - c * c);
    const numSamples2 = 120;
    const points2 = [];
    for (let i = 0; i <= numSamples2; i++) {
      const t = i / numSamples2 * 2 * Math.PI;
      points2.push({ x: a * Math.cos(t), y: b * Math.sin(t) });
    }
    const px2 = a * Math.cos(theta);
    const py2 = b * Math.sin(theta);
    const f1 = { x: -c, y: 0 };
    const f2 = { x: c, y: 0 };
    const d12 = Math.hypot(px2 - f1.x, py2 - f1.y);
    const d2 = Math.hypot(px2 - f2.x, py2 - f2.y);
    return {
      points: points2,
      foci: { f1, f2 },
      pPoint: { x: px2, y: py2 },
      d1: d12,
      d2,
      isDegenerate: false,
      stringPolygon: [f1, { x: px2, y: py2 }, f2]
    };
  }
  if (conicType === "hyperbola") {
    if (a >= c) {
      return {
        points: [],
        foci: { f1: { x: -c, y: 0 }, f2: { x: c, y: 0 } },
        pPoint: { x: c, y: 0 },
        d1: 2 * c,
        d2: 0,
        isDegenerate: true,
        degenerateReason: a === c ? "2a = 2c 退化为两条射线" : "2a > 2c 无轨迹"
      };
    }
    const b = Math.sqrt(c * c - a * a);
    const numSamples2 = 80;
    const rightBranch = [];
    const leftBranch = [];
    const maxT = 1.3;
    for (let i = -numSamples2; i <= numSamples2; i++) {
      const t = i / numSamples2 * maxT;
      const secT = 1 / Math.cos(t);
      const tanT = Math.tan(t);
      rightBranch.push({ x: a * secT, y: b * tanT });
      leftBranch.push({ x: -a * secT, y: b * tanT });
    }
    const clampedTheta = Math.max(
      -1.2,
      Math.min(1.2, theta % (Math.PI * 2) - Math.PI / 2)
    );
    const px2 = a * (1 / Math.cos(clampedTheta));
    const py2 = b * Math.tan(clampedTheta);
    const f1 = { x: -c, y: 0 };
    const f2 = { x: c, y: 0 };
    const d12 = Math.hypot(px2 - f1.x, py2 - f1.y);
    const d2 = Math.hypot(px2 - f2.x, py2 - f2.y);
    return {
      points: rightBranch,
      branches: [leftBranch, rightBranch],
      foci: { f1, f2 },
      pPoint: { x: px2, y: py2 },
      d1: d12,
      d2,
      isDegenerate: false
    };
  }
  const numSamples = 100;
  const points = [];
  const maxY = 5;
  for (let i = -numSamples; i <= numSamples; i++) {
    const y = i / numSamples * maxY;
    const x = y * y / (2 * p);
    points.push({ x, y });
  }
  const py = (theta % Math.PI - Math.PI / 2) * 2.5;
  const px = py * py / (2 * p);
  const f = { x: p / 2, y: 0 };
  const d1 = Math.hypot(px - f.x, py);
  const dl = px + p / 2;
  return {
    points,
    foci: { f1: f },
    directrix: { x: -p / 2 },
    pPoint: { x: px, y: py },
    d1,
    dl,
    isDegenerate: false
  };
}
function getUnifiedDefData(e, theta) {
  const fx = 2;
  const lx = -1;
  const f = { x: fx, y: 0 };
  const d0 = fx - lx;
  const points = [];
  if (e < 1) {
    const numSamples = 120;
    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples * 2 * Math.PI;
      const r = e * d0 / (1 - e * Math.cos(t));
      const x = fx - r * Math.cos(t);
      const y = r * Math.sin(t);
      points.push({ x, y });
    }
  } else if (Math.abs(e - 1) < 1e-4) {
    const numSamples = 100;
    for (let i = -numSamples; i <= numSamples; i++) {
      const y = i / numSamples * 5;
      const x = y * y / (2 * d0) + (fx - d0 / 2);
      points.push({ x, y });
    }
  } else {
    const numSamples = 80;
    for (let i = -numSamples; i <= numSamples; i++) {
      const t = i / numSamples * 1.1;
      const r = e * d0 / (1 - e * Math.cos(t));
      const x = fx - r * Math.cos(t);
      const y = r * Math.sin(t);
      points.push({ x, y });
    }
  }
  const tP = theta % (2 * Math.PI);
  const rP = Math.abs(e * d0 / (1 - e * Math.cos(tP)));
  const px = fx - rP * Math.cos(tP);
  const py = rP * Math.sin(tP);
  const df = Math.hypot(px - fx, py);
  const dl = Math.abs(px - lx);
  return {
    points,
    foci: { f1: f },
    directrix: { x: lx },
    pPoint: { x: px, y: py },
    d1: df,
    dl,
    isDegenerate: false
  };
}
function getLocusGenData(conicType, a, c, theta) {
  const f1 = { x: -c, y: 0 };
  const f2 = { x: c, y: 0 };
  const R = 2 * a;
  const auxiliaryCircles = [
    { center: f1, r: R }
  ];
  const qx = f1.x + R * Math.cos(theta);
  const qy = f1.y + R * Math.sin(theta);
  const Q = { x: qx, y: qy };
  const b = conicType === "ellipse" ? Math.sqrt(Math.max(0.1, a * a - c * c)) : Math.sqrt(Math.max(0.1, c * c - a * a));
  let mx = 0;
  let my = 0;
  if (conicType === "ellipse") {
    mx = a * Math.cos(theta);
    my = b * Math.sin(theta);
  } else {
    const secT = 1 / Math.cos(theta * 0.4);
    mx = a * secT;
    my = b * Math.tan(theta * 0.4);
  }
  const d1 = Math.hypot(mx - f1.x, my - f1.y);
  const d2 = Math.hypot(mx - f2.x, my - f2.y);
  auxiliaryCircles.push({ center: { x: mx, y: my }, r: d2 });
  return {
    points: [],
    // 由动画组件直接画
    foci: { f1, f2 },
    pPoint: { x: mx, y: my },
    d1,
    d2,
    isDegenerate: false,
    auxiliaryCircles,
    stringPolygon: [f1, { x: mx, y: my }, Q, f2]
  };
}
function useConicDefinitionScene({
  params,
  scale,
  studyMode,
  conicType,
  onParamChange
}) {
  const { a, c, e, p, theta } = params;
  const sceneData = reactExports.useMemo(() => {
    if (studyMode === "firstDef") {
      return getFirstDefData(conicType, a, c, p, theta);
    } else if (studyMode === "unifiedDef") {
      return getUnifiedDefData(e, theta);
    } else {
      return getLocusGenData(
        conicType === "hyperbola" ? "hyperbola" : "ellipse",
        a,
        c,
        theta
      );
    }
  }, [studyMode, conicType, a, c, e, p, theta]);
  const pathD = reactExports.useMemo(() => {
    if (sceneData.branches && sceneData.branches.length > 0) {
      return sceneData.branches.map((branch) => {
        if (branch.length === 0) return "";
        const first2 = mathToDesign(branch[0].x, branch[0].y, scale);
        let d2 = `M ${first2.x} ${first2.y}`;
        for (let i = 1; i < branch.length; i++) {
          const pt = mathToDesign(branch[i].x, branch[i].y, scale);
          d2 += ` L ${pt.x} ${pt.y}`;
        }
        return d2;
      }).join(" ");
    }
    if (!sceneData.points || sceneData.points.length === 0) return "";
    const first = mathToDesign(
      sceneData.points[0].x,
      sceneData.points[0].y,
      scale
    );
    let d = `M ${first.x} ${first.y}`;
    for (let i = 1; i < sceneData.points.length; i++) {
      const pt = mathToDesign(
        sceneData.points[i].x,
        sceneData.points[i].y,
        scale
      );
      d += ` L ${pt.x} ${pt.y}`;
    }
    return d;
  }, [sceneData, scale]);
  const f1Design = mathToDesign(
    sceneData.foci.f1.x,
    sceneData.foci.f1.y,
    scale
  );
  const f2Design = sceneData.foci.f2 ? mathToDesign(sceneData.foci.f2.x, sceneData.foci.f2.y, scale) : null;
  const pDesign = mathToDesign(sceneData.pPoint.x, sceneData.pPoint.y, scale);
  const directrixLine = reactExports.useMemo(() => {
    if (!sceneData.directrix) return null;
    if ("x" in sceneData.directrix) {
      const topPt = mathToDesign(sceneData.directrix.x, scale.yMax, scale);
      const bottomPt = mathToDesign(sceneData.directrix.x, scale.yMin, scale);
      return { x1: topPt.x, y1: topPt.y, x2: bottomPt.x, y2: bottomPt.y };
    }
    return null;
  }, [sceneData.directrix, scale]);
  const perpLineToDirectrix = reactExports.useMemo(() => {
    if (!sceneData.directrix || !("x" in sceneData.directrix)) return null;
    const footPt = mathToDesign(
      sceneData.directrix.x,
      sceneData.pPoint.y,
      scale
    );
    return { x1: pDesign.x, y1: pDesign.y, x2: footPt.x, y2: footPt.y };
  }, [sceneData.directrix, sceneData.pPoint, pDesign, scale]);
  const rawLabels = reactExports.useMemo(() => {
    const list = [
      {
        key: "P",
        text: "P",
        x: pDesign.x,
        y: pDesign.y,
        anchor: "middle",
        dy: -14,
        priority: 2
      },
      {
        key: "F1",
        text: "F₁",
        x: f1Design.x,
        y: f1Design.y,
        anchor: "middle",
        dy: 18,
        priority: 1
      }
    ];
    if (f2Design) {
      list.push({
        key: "F2",
        text: "F₂",
        x: f2Design.x,
        y: f2Design.y,
        anchor: "middle",
        dy: 18,
        priority: 1
      });
    }
    return list;
  }, [pDesign, f1Design, f2Design]);
  const labelPositions = reactExports.useMemo(() => {
    return avoidLabels(rawLabels);
  }, [rawLabels]);
  const handlePDrag = (newMathPt) => {
    let newTheta = Math.atan2(newMathPt.y, newMathPt.x);
    if (newTheta < 0) newTheta += 2 * Math.PI;
    onParamChange("theta", Number(newTheta.toFixed(2)));
  };
  return {
    sceneData,
    pathD,
    f1Design,
    f2Design,
    pDesign,
    directrixLine,
    perpLineToDirectrix,
    labelPositions,
    handlePDrag
  };
}
const ConicDefinitionScene = ({
  params,
  scale,
  vp,
  fontScale = (v) => v,
  studyMode,
  conicType,
  onParamChange
}) => {
  const {
    sceneData,
    pathD,
    f1Design,
    f2Design,
    pDesign,
    directrixLine,
    perpLineToDirectrix,
    labelPositions,
    handlePDrag
  } = useConicDefinitionScene({
    params,
    scale,
    studyMode,
    conicType,
    onParamChange
  });
  const cPrimary = MATH_COLORS.paramPrimary;
  const cSecondary = MATH_COLORS.paramSecondary;
  const cTertiary = MATH_COLORS.paramTertiary;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CoordinateGrid, { scale, fontScale }),
    directrixLine && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: directrixLine.x1,
          y1: directrixLine.y1,
          x2: directrixLine.x2,
          y2: directrixLine.y2,
          stroke: MATH_COLORS.asymptote,
          strokeWidth: 2,
          strokeDasharray: "6 4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: directrixLine.x1 + 6,
          y: directrixLine.y1 + 20,
          fill: MATH_COLORS.asymptote,
          fontSize: fontScale(12),
          fontWeight: "bold",
          children: "准线 L"
        }
      )
    ] }),
    pathD && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "path",
      {
        d: pathD,
        fill: "none",
        stroke: conicType === "ellipse" ? cPrimary : conicType === "hyperbola" ? cSecondary : cTertiary,
        strokeWidth: 2.5
      }
    ),
    sceneData.auxiliaryCircles && sceneData.auxiliaryCircles.map((circle, idx) => {
      const cDesign = mathToDesign(circle.center.x, circle.center.y, scale);
      const rPixel = circle.r * scale.scaleX;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: cDesign.x,
          cy: cDesign.y,
          r: Math.abs(rPixel),
          fill: "none",
          stroke: idx === 0 ? withAlpha(cPrimary, 0.4) : withAlpha(cSecondary, 0.4),
          strokeWidth: 1.5,
          strokeDasharray: idx === 0 ? "none" : "4 4"
        },
        `aux-circle-${idx}`
      );
    }),
    f1Design && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: pDesign.x,
        y1: pDesign.y,
        x2: f1Design.x,
        y2: f1Design.y,
        stroke: cPrimary,
        strokeWidth: 2
      }
    ),
    f2Design && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "line",
      {
        x1: pDesign.x,
        y1: pDesign.y,
        x2: f2Design.x,
        y2: f2Design.y,
        stroke: cSecondary,
        strokeWidth: 2
      }
    ),
    perpLineToDirectrix && /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "line",
        {
          x1: perpLineToDirectrix.x1,
          y1: perpLineToDirectrix.y1,
          x2: perpLineToDirectrix.x2,
          y2: perpLineToDirectrix.y2,
          stroke: cTertiary,
          strokeWidth: 2,
          strokeDasharray: "4 4"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: perpLineToDirectrix.x2,
          cy: perpLineToDirectrix.y2,
          r: 3,
          fill: cTertiary
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "text",
        {
          x: perpLineToDirectrix.x2 - 16,
          y: perpLineToDirectrix.y2 + 4,
          fill: cTertiary,
          fontSize: fontScale(11),
          children: "H"
        }
      )
    ] }),
    f1Design && /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: f1Design.x, cy: f1Design.y, r: 4, fill: cSecondary }),
    f2Design && /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: f2Design.x, cy: f2Design.y, r: 4, fill: cSecondary }),
    labelPositions.map((lbl) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "text",
      {
        x: lbl.x,
        y: lbl.y + lbl.dy,
        fill: lbl.key === "P" ? cPrimary : cSecondary,
        fontSize: fontScale(13),
        fontWeight: "bold",
        textAnchor: "middle",
        children: lbl.text
      },
      lbl.key
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      InteractivePoint,
      {
        cx: pDesign.x,
        cy: pDesign.y,
        scale,
        vp,
        color: cPrimary,
        fontScale,
        onDrag: handlePDrag
      }
    )
  ] });
};
const defaultParams = {
  a: 3,
  c: 2,
  e: 0.66,
  p: 2,
  theta: 0.8
};
const paramMeta = {
  a: {
    key: "a",
    label: "长半轴 / 实半轴 a",
    labelFormula: "a",
    min: 1,
    max: 5,
    step: 0.1,
    defaultValue: 3,
    importance: "core",
    description: "决定椭圆长半轴或双曲线实半轴长度",
    marks: [
      {
        value: 2,
        variant: "critical",
        label: "与 c 相等 (a=c)",
        labelFormula: "a = c"
      }
    ]
  },
  c: {
    key: "c",
    label: "半焦距 c",
    labelFormula: "c",
    min: 0.5,
    max: 4.5,
    step: 0.1,
    defaultValue: 2,
    importance: "core",
    description: "焦点坐标为 (±c, 0)，焦距为 2c",
    marks: [
      {
        value: 3,
        variant: "critical",
        label: "与 a 相等 (c=a)",
        labelFormula: "c = a"
      }
    ]
  },
  e: {
    key: "e",
    label: "离心率 e (d_F / d_l)",
    labelFormula: "e",
    min: 0.1,
    max: 2.5,
    step: 0.05,
    defaultValue: 0.66,
    importance: "core",
    description: "离心率 e < 1 为椭圆，e = 1 为抛物线，e > 1 为双曲线",
    marks: [
      {
        value: 1,
        variant: "critical",
        label: "抛物线 (e=1)",
        labelFormula: "e = 1"
      }
    ]
  },
  p: {
    key: "p",
    label: "焦准距 p",
    labelFormula: "p",
    min: 0.5,
    max: 4,
    step: 0.1,
    defaultValue: 2,
    importance: "core",
    description: "焦点到准线的距离 (p > 0)，焦点 (p/2, 0)，准线 x = -p/2"
  },
  theta: {
    key: "theta",
    label: "动点参数 θ / t",
    labelFormula: "\\theta",
    min: 0,
    max: 6.28,
    step: 0.02,
    defaultValue: 0.8,
    importance: "core",
    description: "控制动点 P 沿着圆锥曲线轨迹连续滑动"
  }
};
function ConicDefinitionAnimation() {
  const [studyMode, setStudyMode] = reactExports.useState("firstDef");
  const [conicType, setConicType] = reactExports.useState("ellipse");
  const [params, setParams] = reactExports.useState({
    a: defaultParams.a,
    c: defaultParams.c,
    e: defaultParams.e,
    p: defaultParams.p,
    theta: defaultParams.theta
  });
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full
  });
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5]
  });
  const mathData = reactExports.useMemo(() => {
    return buildMathQuantities("anim-conic-definition", params, {
      studyMode,
      conicType
    });
  }, [params, studyMode, conicType]);
  const handleParamChange = (key, value) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };
  const handleReset = () => {
    setParams({
      a: defaultParams.a,
      c: defaultParams.c,
      e: defaultParams.e,
      p: defaultParams.p,
      theta: defaultParams.theta
    });
  };
  const paramConfigs = reactExports.useMemo(() => {
    const keysByMode = {
      firstDef: conicType === "parabola" ? ["p", "theta"] : ["a", "c", "theta"],
      unifiedDef: ["e", "p", "theta"],
      locusGen: ["a", "c", "theta"]
    };
    const activeKeys = keysByMode[studyMode] ?? Object.keys(paramMeta);
    return activeKeys.filter((key) => key in paramMeta).map((key) => {
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
  }, [params, studyMode, conicType]);
  const latexFormula = reactExports.useMemo(() => {
    const c1 = MATH_COLORS.paramPrimary;
    const c2 = MATH_COLORS.paramSecondary;
    if (studyMode === "firstDef") {
      if (conicType === "ellipse") {
        return `|PF_1| + |PF_2| = 2\\color{${c1}}{a} = ${(2 * params.a).toFixed(1)}`;
      } else if (conicType === "hyperbola") {
        return `||PF_1| - |PF_2|| = 2\\color{${c1}}{a} = ${(2 * params.a).toFixed(1)}`;
      } else {
        return `|PF| = d_l \\quad (\\color{${c2}}{p} = ${params.p.toFixed(1)})`;
      }
    } else if (studyMode === "unifiedDef") {
      return `\\frac{d_F}{d_l} = \\color{${c1}}{e} = ${params.e.toFixed(2)}`;
    } else {
      return `|MF_1| \\pm |MF_2| = 2\\color{${c1}}{a}`;
    }
  }, [studyMode, conicType, params]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          LeftPanelSection,
          {
            title: "定义与研究模式",
            subtitle: "选择圆锥曲线与定义视角",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TabSwitcher,
                {
                  tabs: [
                    { key: "firstDef", label: "第一定义" },
                    { key: "unifiedDef", label: "统一定义(e)" },
                    { key: "locusGen", label: "动圆生成法" }
                  ],
                  value: studyMode,
                  onChange: (key) => setStudyMode(key)
                }
              ),
              studyMode !== "unifiedDef" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectGrid,
                {
                  items: [
                    { key: "ellipse", label: "椭圆", formula: "PF_1+PF_2=2a" },
                    {
                      key: "hyperbola",
                      label: "双曲线",
                      formula: "|PF_1-PF_2|=2a"
                    },
                    ...studyMode === "firstDef" ? [
                      {
                        key: "parabola",
                        label: "抛物线",
                        formula: "PF=d_l"
                      }
                    ] : []
                  ],
                  value: conicType,
                  onChange: (key) => setConicType(key),
                  columns: 2
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 p-2 bg-neutral-50 rounded border border-neutral-200 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KatexFormula, { formula: latexFormula, className: "text-sm" }) })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "参数调节", subtitle: "拖动滑块联动图形变化", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: handleReset
          }
        ) })
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsx(
        AnimationSvgCanvas,
        {
          containerRef,
          transform: vp.transform,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            ConicDefinitionScene,
            {
              params,
              scale,
              vp,
              fontScale: canvasSize.font,
              studyMode,
              conicType,
              onParamChange: handleParamChange
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
          title: "圆锥曲线定义与轨迹看板"
        }
      )
    }
  );
}
export {
  ConicDefinitionAnimation
};
