import { j as jsxRuntimeExports, r as reactExports } from "./index-DT9BKSox.js";
import { b as MATH_COLORS } from "./probabilityBayes-DNLi5nE3.js";
import { a9 as normalize, aa as cross, ab as sub, ac as dot, ad as lerp, a8 as add, a7 as scale } from "./mathQuantities-CPwsyb9V.js";
const VIEW_LABELS = {
  front: "正视图",
  side: "侧视图",
  top: "俯视图"
};
function computeBBoxCenter(drawing) {
  const points = [
    ...drawing.solid,
    ...drawing.dashed,
    ...drawing.centerline
  ].flat();
  if (points.length === 0) return { cx: 0, cy: 0 };
  const us = points.map((p) => p.u);
  const vs = points.map((p) => p.v);
  return {
    cx: (Math.max(...us) + Math.min(...us)) / 2,
    cy: (Math.max(...vs) + Math.min(...vs)) / 2
  };
}
function ViewBox({
  drawing,
  label,
  extent
}) {
  const pad = extent * 0.25;
  const size = extent + pad * 2;
  const { cx, cy } = reactExports.useMemo(() => computeBBoxCenter(drawing), [drawing]);
  const toSvg = (p) => ({
    x: p.u - cx + size / 2,
    y: size / 2 - (p.v - cy)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "svg",
    {
      viewBox: `0 0 ${size} ${size}`,
      className: "h-full w-full",
      role: "img",
      "aria-label": label,
      children: [
        drawing.centerline.map(([a, b], i) => {
          const pa = toSvg(a);
          const pb = toSvg(b);
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: pa.x,
              y1: pa.y,
              x2: pb.x,
              y2: pb.y,
              stroke: MATH_COLORS.gridSubtle,
              strokeWidth: size * 3e-3,
              strokeDasharray: `${size * 0.03},${size * 0.01},${size * 5e-3},${size * 0.01}`
            },
            `c-${i}`
          );
        }),
        drawing.dashed.map(([a, b], i) => {
          const pa = toSvg(a);
          const pb = toSvg(b);
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: pa.x,
              y1: pa.y,
              x2: pb.x,
              y2: pb.y,
              stroke: MATH_COLORS.line,
              strokeWidth: size * 4e-3,
              strokeDasharray: `${size * 0.015},${size * 0.01}`
            },
            `d-${i}`
          );
        }),
        drawing.solid.map(([a, b], i) => {
          const pa = toSvg(a);
          const pb = toSvg(b);
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: pa.x,
              y1: pa.y,
              x2: pb.x,
              y2: pb.y,
              stroke: MATH_COLORS.line,
              strokeWidth: size * 6e-3
            },
            `s-${i}`
          );
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "text",
          {
            x: size * 0.04,
            y: size * 0.08,
            fontSize: size * 0.05,
            fill: MATH_COLORS.label,
            children: label
          }
        )
      ]
    }
  );
}
function ThreeViewsPanel({ views, extent }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid h-full w-full grid-cols-2 grid-rows-2 gap-2 p-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-start-1 row-start-1 rounded border border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      ViewBox,
      {
        drawing: views.front,
        label: VIEW_LABELS.front,
        extent
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-start-2 row-start-1 rounded border border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      ViewBox,
      {
        drawing: views.side,
        label: VIEW_LABELS.side,
        extent
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "col-start-1 row-start-2 rounded border border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ViewBox, { drawing: views.top, label: VIEW_LABELS.top, extent }) })
  ] });
}
const VIEW_AXES = {
  front: {
    viewDir: { x: 0, y: -1, z: 0 },
    project: (p) => ({ u: p.x, v: p.z })
  },
  side: {
    viewDir: { x: 1, y: 0, z: 0 },
    project: (p) => ({ u: -p.y, v: p.z })
  },
  top: { viewDir: { x: 0, y: 0, z: 1 }, project: (p) => ({ u: p.x, v: -p.y }) }
};
function faceCentroid(vertices, face) {
  const sum = face.reduce(
    (acc, i) => ({
      x: acc.x + vertices[i].x,
      y: acc.y + vertices[i].y,
      z: acc.z + vertices[i].z
    }),
    { x: 0, y: 0, z: 0 }
  );
  return {
    x: sum.x / face.length,
    y: sum.y / face.length,
    z: sum.z / face.length
  };
}
function solidCentroid(vertices) {
  const sum = vertices.reduce(
    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y, z: acc.z + v.z }),
    { x: 0, y: 0, z: 0 }
  );
  return {
    x: sum.x / vertices.length,
    y: sum.y / vertices.length,
    z: sum.z / vertices.length
  };
}
function computeOutwardNormals(polyhedron) {
  const center = solidCentroid(polyhedron.vertices);
  return polyhedron.faces.map((face) => {
    const [i0, i1, i2] = face;
    const v0 = polyhedron.vertices[i0];
    const v1 = polyhedron.vertices[i1];
    const v2 = polyhedron.vertices[i2];
    let n = normalize(cross(sub(v1, v0), sub(v2, v0)));
    const toFace = sub(faceCentroid(polyhedron.vertices, face), center);
    if (dot(n, toFace) < 0) n = { x: -n.x, y: -n.y, z: -n.z };
    return n;
  });
}
function isEdgeHidden(normalsAtEdge, viewDir) {
  if (normalsAtEdge.length === 0) return false;
  return normalsAtEdge.every((n) => dot(n, viewDir) < -1e-6);
}
function pointsClose(a, b, eps = 1e-4) {
  return Math.abs(a.u - b.u) < eps && Math.abs(a.v - b.v) < eps;
}
function segmentsMatch(s1, s2) {
  return pointsClose(s1[0], s2[0]) && pointsClose(s1[1], s2[1]) || pointsClose(s1[0], s2[1]) && pointsClose(s1[1], s2[0]);
}
function projectPolyhedron(polyhedron, viewName) {
  const { viewDir, project } = VIEW_AXES[viewName];
  const normals = computeOutwardNormals(polyhedron);
  const edgeFaceNormals = polyhedron.edges.map(({ a, b }) => {
    const adjacent = [];
    polyhedron.faces.forEach((face, fi) => {
      const ia = face.indexOf(a);
      const ib = face.indexOf(b);
      if (ia === -1 || ib === -1) return;
      const isAdjacentInLoop = Math.abs(ia - ib) === 1 || Math.abs(ia - ib) === face.length - 1;
      if (isAdjacentInLoop) adjacent.push(normals[fi]);
    });
    return adjacent;
  });
  const rawSolid = [];
  const rawDashed = [];
  polyhedron.edges.forEach(({ a, b }, i) => {
    const p1 = project(polyhedron.vertices[a]);
    const p2 = project(polyhedron.vertices[b]);
    if (pointsClose(p1, p2)) return;
    const hidden = isEdgeHidden(edgeFaceNormals[i], viewDir);
    (hidden ? rawDashed : rawSolid).push([p1, p2]);
  });
  const dashed = rawDashed.filter(
    (d) => !rawSolid.some((s) => segmentsMatch(s, d))
  );
  const solid = [];
  for (const seg2 of rawSolid) {
    if (!solid.some((s) => segmentsMatch(s, seg2))) solid.push(seg2);
  }
  return { solid, dashed, centerline: [] };
}
const EPS = 1e-7;
function buildPlaneBasis(normal) {
  const n = normalize(normal);
  const helper = Math.abs(n.z) < 0.9 ? { x: 0, y: 0, z: 1 } : { x: 1, y: 0, z: 0 };
  const u = normalize(cross(helper, n));
  const v = normalize(cross(n, u));
  return { u, v };
}
function dedupe(points, eps = 1e-5) {
  const out = [];
  for (const p of points) {
    if (!out.some((q) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) < eps))
      out.push(p);
  }
  return out;
}
function orderByAngleAroundCentroid(points, plane) {
  if (points.length < 3) return points;
  const centroid = points.reduce((acc, p) => add(acc, p), {
    x: 0,
    y: 0,
    z: 0
  });
  const c = scale(centroid, 1 / points.length);
  const { u, v } = buildPlaneBasis(plane.normal);
  return [...points].sort((p1, p2) => {
    const d1 = sub(p1, c);
    const d2 = sub(p2, c);
    return Math.atan2(dot(d1, v), dot(d1, u)) - Math.atan2(dot(d2, v), dot(d2, u));
  });
}
function intersectConvexPolyhedronPlane(polyhedron, plane) {
  const dists = polyhedron.vertices.map(
    (v) => dot(sub(v, plane.point), plane.normal)
  );
  const points = [];
  for (const { a, b } of polyhedron.edges) {
    const da = dists[a];
    const db = dists[b];
    if (Math.abs(da) < EPS && Math.abs(db) < EPS) continue;
    if (Math.abs(da) < EPS) {
      points.push(polyhedron.vertices[a]);
    } else if (da * db < 0) {
      const t = da / (da - db);
      points.push(lerp(polyhedron.vertices[a], polyhedron.vertices[b], t));
    }
  }
  const unique = dedupe(points);
  if (unique.length < 3) return [];
  return orderByAngleAroundCentroid(unique, plane);
}
function buildCuboidPolyhedron(a, b, c) {
  const vertices = [
    { x: 0, y: 0, z: 0 },
    { x: a, y: 0, z: 0 },
    { x: a, y: b, z: 0 },
    { x: 0, y: b, z: 0 },
    { x: 0, y: 0, z: c },
    { x: a, y: 0, z: c },
    { x: a, y: b, z: c },
    { x: 0, y: b, z: c }
  ];
  const edges = [
    { a: 0, b: 1 },
    { a: 1, b: 2 },
    { a: 2, b: 3 },
    { a: 3, b: 0 },
    { a: 4, b: 5 },
    { a: 5, b: 6 },
    { a: 6, b: 7 },
    { a: 7, b: 4 },
    { a: 0, b: 4 },
    { a: 1, b: 5 },
    { a: 2, b: 6 },
    { a: 3, b: 7 }
  ];
  const faces = [
    [0, 1, 2, 3],
    // 底面
    [4, 5, 6, 7],
    // 顶面
    [0, 1, 5, 4],
    // 前面
    [1, 2, 6, 5],
    // 右面
    [2, 3, 7, 6],
    // 后面
    [3, 0, 4, 7]
    // 左面
  ];
  return { vertices, edges, faces };
}
function buildRegularPyramidPolyhedron(sides, baseRadius, height) {
  const base = Array.from({ length: sides }, (_, i) => {
    const t = i / sides * Math.PI * 2;
    return {
      x: baseRadius * Math.cos(t),
      y: baseRadius * Math.sin(t),
      z: 0
    };
  });
  const apex = { x: 0, y: 0, z: height };
  const vertices = [...base, apex];
  const apexIdx = sides;
  const edges = [];
  for (let i = 0; i < sides; i++) {
    edges.push({ a: i, b: (i + 1) % sides });
    edges.push({ a: i, b: apexIdx });
  }
  const faces = [
    Array.from({ length: sides }, (_, i) => i),
    // 底面
    ...Array.from({ length: sides }, (_, i) => [i, (i + 1) % sides, apexIdx])
    // 侧面三角形
  ];
  return { vertices, edges, faces };
}
function buildRegularPrismPolyhedron(sides, baseRadius, height) {
  const bottom = Array.from({ length: sides }, (_, i) => {
    const t = i / sides * Math.PI * 2;
    return {
      x: baseRadius * Math.cos(t),
      y: baseRadius * Math.sin(t),
      z: 0
    };
  });
  const top = bottom.map((v) => ({ ...v, z: height }));
  const vertices = [...bottom, ...top];
  const edges = [];
  for (let i = 0; i < sides; i++) {
    const next = (i + 1) % sides;
    edges.push({ a: i, b: next });
    edges.push({ a: i + sides, b: next + sides });
    edges.push({ a: i, b: i + sides });
  }
  const faces = [
    Array.from({ length: sides }, (_, i) => i),
    // 下底面
    Array.from({ length: sides }, (_, i) => sides - 1 - i + sides),
    // 上底面
    ...Array.from({ length: sides }, (_, i) => {
      const next = (i + 1) % sides;
      return [i, next, next + sides, i + sides];
    })
    // 侧面
  ];
  return { vertices, edges, faces };
}
function seg(a, b) {
  return [a, b];
}
function circleView(radius, segments = 72) {
  const pts = Array.from({ length: segments + 1 }, (_, i) => {
    const t = i / segments * Math.PI * 2;
    return { u: radius * Math.cos(t), v: radius * Math.sin(t) };
  });
  const solid = [];
  for (let i = 0; i < segments; i++) solid.push(seg(pts[i], pts[i + 1]));
  const ext = radius * 1.12;
  return {
    solid,
    dashed: [],
    // 国标：圆的俯视图必须画十字中心线（点划线），标记回转轴位置
    centerline: [
      seg({ u: -ext, v: 0 }, { u: ext, v: 0 }),
      seg({ u: 0, v: -ext }, { u: 0, v: ext })
    ]
  };
}
function cylinderViews(radius, height) {
  const rect = () => ({
    solid: [
      seg({ u: -radius, v: 0 }, { u: radius, v: 0 }),
      seg({ u: radius, v: 0 }, { u: radius, v: height }),
      seg({ u: radius, v: height }, { u: -radius, v: height }),
      seg({ u: -radius, v: height }, { u: -radius, v: 0 })
    ],
    dashed: [],
    centerline: [seg({ u: 0, v: -height * 0.06 }, { u: 0, v: height * 1.06 })]
  });
  return { front: rect(), side: rect(), top: circleView(radius) };
}
function coneViews(radius, height) {
  const triangle = () => ({
    solid: [
      seg({ u: -radius, v: 0 }, { u: radius, v: 0 }),
      seg({ u: radius, v: 0 }, { u: 0, v: height }),
      seg({ u: 0, v: height }, { u: -radius, v: 0 })
    ],
    dashed: [],
    centerline: [seg({ u: 0, v: -height * 0.06 }, { u: 0, v: height * 1.06 })]
  });
  return { front: triangle(), side: triangle(), top: circleView(radius) };
}
function frustumViews(bottomRadius, topRadius, height) {
  const trapezoid = () => ({
    solid: [
      seg({ u: -bottomRadius, v: 0 }, { u: bottomRadius, v: 0 }),
      seg({ u: bottomRadius, v: 0 }, { u: topRadius, v: height }),
      seg({ u: topRadius, v: height }, { u: -topRadius, v: height }),
      seg({ u: -topRadius, v: height }, { u: -bottomRadius, v: 0 })
    ],
    dashed: [],
    centerline: [seg({ u: 0, v: -height * 0.06 }, { u: 0, v: height * 1.06 })]
  });
  const outer = circleView(bottomRadius);
  const inner = circleView(topRadius);
  const top = {
    solid: [...outer.solid, ...inner.solid],
    dashed: [],
    centerline: outer.centerline
  };
  return { front: trapezoid(), side: trapezoid(), top };
}
function sphereViews(radius) {
  const circle = circleView(radius);
  return { front: circle, side: circle, top: circle };
}
function buildSolidViews(kind, p) {
  switch (kind) {
    case "cuboid": {
      const poly = buildCuboidPolyhedron(p.width, p.depth, p.height);
      return {
        views: {
          front: projectPolyhedron(poly, "front"),
          side: projectPolyhedron(poly, "side"),
          top: projectPolyhedron(poly, "top")
        },
        extent: Math.max(p.width, p.depth, p.height)
      };
    }
    case "pyramid": {
      const poly = buildRegularPyramidPolyhedron(
        p.sides,
        p.baseRadius,
        p.height
      );
      return {
        views: {
          front: projectPolyhedron(poly, "front"),
          side: projectPolyhedron(poly, "side"),
          top: projectPolyhedron(poly, "top")
        },
        extent: Math.max(p.baseRadius * 2, p.height)
      };
    }
    case "cylinder":
      return {
        views: cylinderViews(p.radius, p.height),
        extent: Math.max(p.radius * 2, p.height)
      };
    case "cone":
      return {
        views: coneViews(p.radius, p.height),
        extent: Math.max(p.radius * 2, p.height)
      };
    case "frustum":
      return {
        views: frustumViews(p.bottomRadius, p.topRadius, p.height),
        extent: Math.max(p.bottomRadius * 2, p.height)
      };
    case "sphere":
      return { views: sphereViews(p.radius), extent: p.radius * 2 };
  }
}
export {
  ThreeViewsPanel as T,
  buildRegularPyramidPolyhedron as a,
  buildSolidViews as b,
  buildRegularPrismPolyhedron as c,
  buildCuboidPolyhedron as d,
  intersectConvexPolyhedronPlane as i
};
