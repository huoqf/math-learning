import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { V as Vector3, B as BufferGeometry, F as Float32BufferAttribute, D as DoubleSide, L as Line, m as mathToThree, u as use3DViewport, T as ThreeDCanvas, C as CameraRig, a as Scene3DGrid, P as PointLabel3D, b as Legend3D } from "./Legend3D-B8bVBbK0.js";
import { i as MATH3D_COLORS, b as MATH_COLORS, T as ThreePanel, M as MathPanel, L as LeftPanel, a as LeftPanelSection, P as ParamControl } from "./probabilityBayes-BWtGIkMp.js";
import { a7 as scale, a8 as add, a9 as normalize, aa as cross, ab as sub, b as buildMathQuantities } from "./mathQuantities-CSLRzday.js";
import { a as buildRegularPyramidPolyhedron, c as buildRegularPrismPolyhedron, d as buildCuboidPolyhedron, i as intersectConvexPolyhedronPlane, b as buildSolidViews, T as ThreeViewsPanel } from "./buildSolidViews-DXD0Gsfk.js";
import { E as Edges, C as Cuboid } from "./Cuboid-Blj9lB5b.js";
import { R as RegularPyramid } from "./RegularPyramid-BKVWu5TY.js";
import { T as TabSwitcher } from "./TabSwitcher-BlfhUjmU.js";
import { S as SelectGrid } from "./SelectGrid-D0g0GfRf.js";
import { s as sectionMeta } from "./solidGeometry-Q14xCXek.js";
import "./useRadioGroup-jCNJTR-s.js";
function buildPlaneBasis(normal) {
  const n = normalize(normal);
  const helper = Math.abs(n.z) < 0.9 ? { x: 0, y: 0, z: 1 } : { x: 1, y: 0, z: 0 };
  const u = normalize(cross(helper, n));
  const v = normalize(cross(n, u));
  return { u, v };
}
function vec3ToThree(v) {
  const [x, y, z] = mathToThree(v);
  return new Vector3(x, y, z);
}
function SectionPlane3D({
  sectionPoints,
  plane,
  planeExtent = 3,
  color = MATH3D_COLORS.sectionFill,
  showPlaneQuad = true,
  constructionLines = [],
  constructionPoints = []
}) {
  const threePoints = reactExports.useMemo(
    () => sectionPoints.map(vec3ToThree),
    [sectionPoints]
  );
  const fillGeometry = reactExports.useMemo(() => {
    if (threePoints.length < 3) return null;
    const centroid = threePoints.reduce((acc, p) => acc.add(p.clone()), new Vector3()).multiplyScalar(1 / threePoints.length);
    const positions = [];
    for (let i = 0; i < threePoints.length; i++) {
      const a = threePoints[i];
      const b = threePoints[(i + 1) % threePoints.length];
      positions.push(
        centroid.x,
        centroid.y,
        centroid.z,
        a.x,
        a.y,
        a.z,
        b.x,
        b.y,
        b.z
      );
    }
    const geo = new BufferGeometry();
    geo.setAttribute(
      "position",
      new Float32BufferAttribute(positions, 3)
    );
    geo.computeVertexNormals();
    return geo;
  }, [threePoints]);
  const outlinePoints = reactExports.useMemo(
    () => threePoints.length > 0 ? [...threePoints, threePoints[0]] : [],
    [threePoints]
  );
  const quadData = reactExports.useMemo(() => {
    if (!showPlaneQuad) return { geo: null, outline: [] };
    const { u, v } = buildPlaneBasis(plane.normal);
    const c = sectionPoints.length >= 3 ? scale(
      sectionPoints.reduce((acc, p) => add(acc, p), { x: 0, y: 0, z: 0 }),
      1 / sectionPoints.length
    ) : plane.point;
    const corners = [
      add(add(c, scale(u, -planeExtent)), scale(v, -planeExtent)),
      add(add(c, scale(u, planeExtent)), scale(v, -planeExtent)),
      add(add(c, scale(u, planeExtent)), scale(v, planeExtent)),
      add(add(c, scale(u, -planeExtent)), scale(v, planeExtent))
    ].map(vec3ToThree);
    const [a, b, c2, d] = corners;
    const geo = new BufferGeometry();
    geo.setAttribute(
      "position",
      new Float32BufferAttribute(
        [
          a.x,
          a.y,
          a.z,
          b.x,
          b.y,
          b.z,
          c2.x,
          c2.y,
          c2.z,
          a.x,
          a.y,
          a.z,
          c2.x,
          c2.y,
          c2.z,
          d.x,
          d.y,
          d.z
        ],
        3
      )
    );
    const outline = [a, b, c2, d, a];
    return { geo, outline };
  }, [plane, planeExtent, showPlaneQuad, sectionPoints]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    quadData.geo && /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { geometry: quadData.geo, renderOrder: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshBasicMaterial",
      {
        color: MATH3D_COLORS.sectionPlane,
        transparent: true,
        opacity: 0.22,
        side: DoubleSide,
        depthWrite: false
      }
    ) }),
    quadData.outline.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Line,
      {
        points: quadData.outline,
        color: "#818CF8",
        lineWidth: 1.5,
        dashed: true,
        dashSize: 0.2,
        gapSize: 0.1,
        renderOrder: 5
      }
    ),
    fillGeometry && /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { geometry: fillGeometry, renderOrder: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshBasicMaterial",
      {
        color,
        transparent: true,
        opacity: 0.55,
        side: DoubleSide,
        depthWrite: false
      }
    ) }),
    outlinePoints.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Line,
      {
        points: outlinePoints,
        color: MATH3D_COLORS.sectionOutline,
        lineWidth: 3,
        depthTest: false,
        renderOrder: 100
      }
    ),
    constructionLines.map((line, idx) => {
      const pts = [vec3ToThree(line.from), vec3ToThree(line.to)];
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        Line,
        {
          points: pts,
          color: line.color ?? MATH_COLORS.highlight,
          lineWidth: 1.5,
          dashed: line.dashed,
          dashSize: 0.2,
          gapSize: 0.1,
          renderOrder: 8
        },
        `const-line-${idx}`
      );
    }),
    constructionPoints.map((pt, idx) => {
      const threePos = vec3ToThree(pt.position);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: threePos, renderOrder: 9, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.08, 16, 16] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: pt.color ?? MATH_COLORS.highlight })
      ] }, `const-pt-${idx}`);
    })
  ] });
}
const RegularPrism = ({
  sides = 3,
  baseRadius,
  height,
  colorKey = "primary",
  opacity = 0.25
}) => {
  const geometry = reactExports.useMemo(() => {
    const bottomPts = [];
    const topPts = [];
    for (let i = 0; i < sides; i++) {
      const t = i / sides * Math.PI * 2;
      const x = baseRadius * Math.cos(t);
      const y = baseRadius * Math.sin(t);
      const bPt = mathToThree({ x, y, z: 0 });
      const tPt = mathToThree({ x, y, z: height });
      bottomPts.push(new Vector3(...bPt));
      topPts.push(new Vector3(...tPt));
    }
    const positions = [];
    const push = (a, b, c) => {
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    };
    for (let i = 1; i < sides - 1; i++) {
      push(bottomPts[0], bottomPts[i + 1], bottomPts[i]);
    }
    for (let i = 1; i < sides - 1; i++) {
      push(topPts[0], topPts[i], topPts[i + 1]);
    }
    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      const b1 = bottomPts[i];
      const b2 = bottomPts[next];
      const t1 = topPts[i];
      const t2 = topPts[next];
      push(b1, b2, t2);
      push(b1, t2, t1);
    }
    const geo = new BufferGeometry();
    geo.setAttribute(
      "position",
      new Float32BufferAttribute(positions, 3)
    );
    geo.computeVertexNormals();
    return geo;
  }, [sides, baseRadius, height]);
  const color = MATH_COLORS[colorKey];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { geometry, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color,
        transparent: true,
        opacity,
        side: DoubleSide,
        depthWrite: false
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Edges, { color: MATH_COLORS.line, threshold: 15 })
  ] });
};
function computeSectionArea3D(points) {
  if (points.length < 3) return 0;
  const p0 = points[0];
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const v1 = sub(points[i], p0);
    const v2 = sub(points[i + 1], p0);
    const c = cross(v1, v2);
    sumX += c.x;
    sumY += c.y;
    sumZ += c.z;
  }
  return 0.5 * Math.sqrt(sumX * sumX + sumY * sumY + sumZ * sumZ);
}
function computeProjectionArea2D(points) {
  if (points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const current = points[i];
    const next = points[(i + 1) % n];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) * 0.5;
}
function computeSectionProjectionDetails(points, planeNormal) {
  const area3D = computeSectionArea3D(points);
  const areaProj = computeProjectionArea2D(points);
  const n = normalize(planeNormal);
  const cosTheta = Math.abs(n.z);
  const thetaRad = Math.acos(Math.min(1, Math.max(0, cosTheta)));
  const thetaDeg = thetaRad * 180 / Math.PI;
  const isProjectionValid = cosTheta > 1e-4 && points.length >= 3;
  return {
    area3D,
    areaProj,
    cosTheta,
    thetaDeg,
    isProjectionValid
  };
}
const planeFromPoints = (p1, p2, p3) => ({
  point: scale(add(add(p1, p2), p3), 1 / 3),
  normal: normalize(cross(sub(p2, p1), sub(p3, p1)))
});
function getEdgePoint(kind, edgeIdx, t, width, depth, height) {
  const clampT = Math.max(0.05, Math.min(0.95, t));
  if (kind === "pyramid") {
    const r = 2.2;
    const angles = [0, Math.PI / 2, Math.PI];
    const angle = angles[edgeIdx % 3];
    const bx = r * Math.cos(angle);
    const by = r * Math.sin(angle);
    return {
      x: (1 - clampT) * bx,
      y: (1 - clampT) * by,
      z: clampT * height
    };
  } else if (kind === "prism") {
    const r = 2;
    const angles = [0, 2 * Math.PI / 3, 4 * Math.PI / 3];
    const angle = angles[edgeIdx % 3];
    return {
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
      z: clampT * height
    };
  } else {
    const basePts = [
      { x: width, y: 0 },
      { x: width, y: depth },
      { x: 0, y: depth }
    ];
    const pt = basePts[edgeIdx % 3];
    return {
      x: pt.x,
      y: pt.y,
      z: clampT * height
    };
  }
}
function SectionCuboidDemo() {
  const [mode, setMode] = reactExports.useState("continuous");
  const [solidKind, setSolidKind] = reactExports.useState("cuboid");
  const [viewMode, setViewMode] = reactExports.useState("3d");
  const [cutHeight, setCutHeight] = reactExports.useState(2);
  const [tiltDeg, setTiltDeg] = reactExports.useState(0);
  const [azimuthDeg, setAzimuthDeg] = reactExports.useState(0);
  const [posP, setPosP] = reactExports.useState(0.4);
  const [posQ, setPosQ] = reactExports.useState(0.7);
  const [posR, setPosR] = reactExports.useState(0.5);
  const { cameraPosition, controlsRef } = use3DViewport("iso");
  const width = 3;
  const depth = 3;
  const height = 4;
  const currentPolyhedron = reactExports.useMemo(() => {
    if (solidKind === "pyramid") {
      return buildRegularPyramidPolyhedron(4, 2.2, height);
    }
    if (solidKind === "prism") {
      return buildRegularPrismPolyhedron(3, 2, height);
    }
    return buildCuboidPolyhedron(width, depth, height);
  }, [solidKind, width, depth, height]);
  const pointPPos = reactExports.useMemo(
    () => getEdgePoint(solidKind, 0, posP, width, depth, height),
    [solidKind, posP, width, depth, height]
  );
  const pointQPos = reactExports.useMemo(
    () => getEdgePoint(solidKind, 1, posQ, width, depth, height),
    [solidKind, posQ, width, depth, height]
  );
  const pointRPos = reactExports.useMemo(
    () => getEdgePoint(solidKind, 2, posR, width, depth, height),
    [solidKind, posR, width, depth, height]
  );
  const plane = reactExports.useMemo(() => {
    if (mode === "threePoints") {
      return planeFromPoints(pointPPos, pointQPos, pointRPos);
    } else {
      const tilt = tiltDeg * Math.PI / 180;
      const azim = azimuthDeg * Math.PI / 180;
      const nx = Math.sin(tilt) * Math.cos(azim);
      const ny = Math.sin(tilt) * Math.sin(azim);
      const nz = Math.cos(tilt);
      const px = solidKind === "cuboid" ? width / 2 : 0;
      const py = solidKind === "cuboid" ? depth / 2 : 0;
      return {
        point: { x: px, y: py, z: cutHeight },
        normal: { x: nx, y: ny, z: nz }
      };
    }
  }, [
    mode,
    solidKind,
    width,
    depth,
    pointPPos,
    pointQPos,
    pointRPos,
    cutHeight,
    tiltDeg,
    azimuthDeg
  ]);
  const sectionPoints = reactExports.useMemo(() => {
    return intersectConvexPolyhedronPlane(currentPolyhedron, plane);
  }, [currentPolyhedron, plane]);
  const projDetails = reactExports.useMemo(() => {
    return computeSectionProjectionDetails(sectionPoints, plane.normal);
  }, [sectionPoints, plane]);
  const constructionLines = reactExports.useMemo(() => {
    if (mode !== "threePoints" || sectionPoints.length < 3) return [];
    return [
      { from: pointPPos, to: pointQPos, color: MATH_COLORS.highlight },
      { from: pointQPos, to: pointRPos, color: MATH_COLORS.highlight },
      {
        from: pointRPos,
        to: pointPPos,
        color: MATH_COLORS.highlight,
        dashed: true
      }
    ];
  }, [mode, sectionPoints, pointPPos, pointQPos, pointRPos]);
  const mathData = reactExports.useMemo(() => {
    const paramsMap = {
      cutHeight,
      tiltDeg
    };
    const normalStr = `(${plane.normal.x.toFixed(2)}, ${plane.normal.y.toFixed(2)}, ${plane.normal.z.toFixed(2)})`;
    return buildMathQuantities("anim-solid-section", paramsMap, {
      vertexCount: sectionPoints.length,
      area3D: projDetails.area3D,
      areaProj: projDetails.areaProj,
      cosTheta: projDetails.cosTheta,
      thetaDeg: projDetails.thetaDeg,
      normalStr
    });
  }, [
    cutHeight,
    tiltDeg,
    azimuthDeg,
    posP,
    posQ,
    posR,
    plane,
    sectionPoints,
    projDetails
  ]);
  const paramConfigs = reactExports.useMemo(() => {
    const currentKeys = mode === "continuous" ? ["cutHeight", "tiltDeg", "azimuthDeg"] : ["posP", "posQ", "posR"];
    return sectionMeta.filter((meta) => currentKeys.includes(meta.key)).map((meta) => {
      let val = 0;
      if (meta.key === "cutHeight") val = cutHeight;
      else if (meta.key === "tiltDeg") val = tiltDeg;
      else if (meta.key === "azimuthDeg") val = azimuthDeg;
      else if (meta.key === "posP") val = posP;
      else if (meta.key === "posQ") val = posQ;
      else if (meta.key === "posR") val = posR;
      return {
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        value: val,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks
      };
    });
  }, [mode, cutHeight, tiltDeg, azimuthDeg, posP, posQ, posR]);
  const handleParamChange = (key, value) => {
    if (key === "cutHeight") setCutHeight(value);
    else if (key === "tiltDeg") setTiltDeg(value);
    else if (key === "azimuthDeg") setAzimuthDeg(value);
    else if (key === "posP") setPosP(value);
    else if (key === "posQ") setPosQ(value);
    else if (key === "posR") setPosR(value);
  };
  const handleReset = () => {
    setCutHeight(2);
    setTiltDeg(0);
    setAzimuthDeg(0);
    setPosP(0.4);
    setPosQ(0.7);
    setPosR(0.5);
  };
  const viewsData = reactExports.useMemo(() => {
    let solidType = "cuboid";
    if (solidKind === "pyramid") solidType = "pyramid";
    return buildSolidViews(solidType, {
      width,
      depth,
      height,
      sides: 4,
      baseRadius: 2
    });
  }, [solidKind, width, depth, height]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "教学模式", subtitle: "选择截面生成与作图机制", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabSwitcher,
          {
            layout: "horizontal",
            tabs: [
              { key: "continuous", label: "连续切面" },
              { key: "threePoints", label: "三点作图" }
            ],
            value: mode,
            onChange: (m) => setMode(m)
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "几何体选择", subtitle: "切换高考经典多面体", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "cuboid", label: "正方体/长方体" },
              { key: "pyramid", label: "正四棱锥" },
              { key: "prism", label: "正三棱柱" }
            ],
            value: solidKind,
            onChange: (k) => setSolidKind(k),
            columns: 2
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "显示模式", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabSwitcher,
          {
            layout: "horizontal",
            tabs: [
              { key: "3d", label: "3D 直观图" },
              { key: "views", label: "2D 三视图" }
            ],
            value: viewMode,
            onChange: (v) => setViewMode(v)
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "参数调节",
            subtitle: mode === "continuous" ? "滑动调节切割平面的位置与倾角" : "拖动棱上控制点或滑动比例",
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
      center: viewMode === "views" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ThreeViewsPanel, { views: viewsData.views, extent: viewsData.extent }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
        ThreeDCanvas,
        {
          cameraPosition,
          legend: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Legend3D,
            {
              title: "图例",
              items: [
                { colorKey: "primary", swatch: "area", label: "多面体" },
                { colorKey: "accent", swatch: "area", label: "截面多边形" },
                { colorKey: "highlight", swatch: "line", label: "作图连线" }
              ]
            }
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CameraRig, { ref: controlsRef }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Scene3DGrid, { size: 5 }),
            solidKind === "cuboid" && /* @__PURE__ */ jsxRuntimeExports.jsx(Cuboid, { a: width, b: depth, c: height, opacity: 0.15 }),
            solidKind === "pyramid" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              RegularPyramid,
              {
                sides: 4,
                baseRadius: 2.2,
                height,
                opacity: 0.15
              }
            ),
            solidKind === "prism" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              RegularPrism,
              {
                sides: 3,
                baseRadius: 2,
                height,
                opacity: 0.15
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              SectionPlane3D,
              {
                sectionPoints,
                plane,
                planeExtent: Math.max(width, depth, height) * 0.75,
                constructionLines
              }
            ),
            mode === "threePoints" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: mathToThree(pointPPos), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.08, 16, 16] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: MATH_COLORS.highlight })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                PointLabel3D,
                {
                  position: pointPPos,
                  text: "P",
                  offset: [0, 0, 0.2]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: mathToThree(pointQPos), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.08, 16, 16] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: MATH_COLORS.highlight })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                PointLabel3D,
                {
                  position: pointQPos,
                  text: "Q",
                  offset: [0, 0, 0.2]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: mathToThree(pointRPos), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.08, 16, 16] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: MATH_COLORS.highlight })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                PointLabel3D,
                {
                  position: pointRPos,
                  text: "R",
                  offset: [0, 0, 0.2]
                }
              )
            ] })
          ]
        }
      ),
      right: /* @__PURE__ */ jsxRuntimeExports.jsx(
        MathPanel,
        {
          quantities: mathData.quantities,
          theorems: mathData.theorems,
          gaokaoPoints: mathData.gaokaoPoints,
          warnings: mathData.warnings,
          title: "截面几何看板"
        }
      )
    }
  );
}
export {
  SectionCuboidDemo as default
};
