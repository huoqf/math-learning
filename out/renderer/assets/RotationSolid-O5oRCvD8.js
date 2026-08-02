import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { b as MATH_COLORS } from "./probabilityBayes-DNLi5nE3.js";
import { c as useThree, d as useFrame, B as BufferGeometry, e as Line, f as LineDashedMaterial, g as LineBasicMaterial, V as Vector3, h as Vector2, i as LatheGeometry, D as DoubleSide } from "./Legend3D-DaYU3ia-.js";
function cylinderProfile(radius, height) {
  return [
    { r: 0, z: 0 },
    { r: radius, z: 0 },
    { r: radius, z: height },
    { r: 0, z: height }
  ];
}
function coneProfile(radius, height) {
  return [
    { r: 0, z: 0 },
    { r: radius, z: 0 },
    { r: 0, z: height }
  ];
}
function frustumProfile(rBottom, rTop, height) {
  return [
    { r: 0, z: 0 },
    { r: rBottom, z: 0 },
    { r: rTop, z: height },
    { r: 0, z: height }
  ];
}
function sphereProfile(radius, segments = 32) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments * Math.PI;
    pts.push({
      r: radius * Math.sin(t),
      z: radius - radius * Math.cos(t)
    });
  }
  return pts;
}
function rimRadiusAtZ(profile, z, eps = 1e-3) {
  return profile.filter((p) => Math.abs(p.z - z) < eps).reduce((max, p) => Math.max(max, p.r), 0);
}
const EPS = 1e-9;
const SAMPLE_COUNT = 96;
function buildHermiteNodes(profile) {
  const sorted = [...profile].sort((a, b) => a.z - b.z || b.r - a.r);
  const pts = [];
  for (const p of sorted) {
    if (pts.length === 0 || Math.abs(p.z - pts[pts.length - 1].z) > EPS) {
      pts.push(p);
    }
  }
  const n = pts.length;
  const secant = (i, j) => (pts[j].r - pts[i].r) / (pts[j].z - pts[i].z);
  return pts.map((p, i) => {
    let m;
    if (i === 0) m = secant(0, 1);
    else if (i === n - 1) m = secant(n - 2, n - 1);
    else m = (secant(i - 1, i) + secant(i, i + 1)) / 2;
    return { z: p.z, r: p.r, m };
  });
}
function sampleHermite(nodes, z) {
  let i = 0;
  while (i < nodes.length - 2 && z > nodes[i + 1].z) i++;
  const a = nodes[i];
  const b = nodes[i + 1] ?? nodes[i];
  if (a === b) return { r: a.r, slope: a.m };
  const h = b.z - a.z;
  if (h < EPS) return { r: a.r, slope: a.m };
  const t = Math.max(0, Math.min(1, (z - a.z) / h));
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  const r = h00 * a.r + h10 * h * a.m + h01 * b.r + h11 * h * b.m;
  const dh00 = 6 * t2 - 6 * t;
  const dh10 = 3 * t2 - 4 * t + 1;
  const dh01 = -6 * t2 + 6 * t;
  const dh11 = 3 * t2 - 2 * t;
  const slope = (dh00 * a.r + dh10 * h * a.m + dh01 * b.r + dh11 * h * b.m) / h;
  return { r, slope };
}
function computeSilhouette(profile, thetaCam, beta) {
  const nodes = buildHermiteNodes(profile);
  if (nodes.length < 2) return { left: [], right: [], zRange: null };
  const zBottom = nodes[0].z;
  const zTop = nodes[nodes.length - 1].z;
  const tanBeta = Math.tan(beta);
  const rhsAt = (z) => sampleHermite(nodes, z).slope * tanBeta;
  if (Math.abs(tanBeta) < EPS) {
    const zRange2 = [zBottom, zTop];
    return {
      ...buildCurves(nodes, thetaCam, tanBeta, zRange2),
      zRange: zRange2
    };
  }
  const zMid = (zBottom + zTop) / 2;
  if (Math.abs(rhsAt(zMid)) > 1) {
    return { left: [], right: [], zRange: null };
  }
  const findBoundary = (zValid, zInvalid) => {
    let lo = zValid;
    let hi = zInvalid;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      if (Math.abs(rhsAt(mid)) <= 1) lo = mid;
      else hi = mid;
    }
    return lo;
  };
  const zHi = Math.abs(rhsAt(zTop)) <= 1 ? zTop : findBoundary(zMid, zTop);
  const zLo = Math.abs(rhsAt(zBottom)) <= 1 ? zBottom : findBoundary(zMid, zBottom);
  const zRange = [zLo, zHi];
  return {
    ...buildCurves(nodes, thetaCam, tanBeta, zRange),
    zRange
  };
}
function buildCurves(nodes, thetaCam, tanBeta, [zLo, zHi]) {
  const left = [];
  const right = [];
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const z = zLo + (zHi - zLo) * i / SAMPLE_COUNT;
    const { r, slope } = sampleHermite(nodes, z);
    const rhs = Math.max(-1, Math.min(1, slope * tanBeta));
    const phi = Math.acos(rhs);
    left.push({ r, z, theta: thetaCam - phi });
    right.push({ r, z, theta: thetaCam + phi });
  }
  return { left, right };
}
const RADIAL_EPS = 4e-3;
function getCameraFrame(camera) {
  const cx = camera.position.x;
  const cy = camera.position.y;
  const cz = camera.position.z;
  const horiz = Math.hypot(cx, cz);
  return {
    thetaCam: Math.atan2(cz, cx),
    beta: Math.atan2(cy, horiz)
  };
}
function sampleArc(r, z, thetaStart, thetaEnd, segments) {
  const rr = r + RADIAL_EPS;
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = thetaStart + (thetaEnd - thetaStart) * i / segments;
    pts.push([rr * Math.cos(t), z, rr * Math.sin(t)]);
  }
  return pts;
}
function setLinePoints(line, pts) {
  line.geometry.setFromPoints(
    pts.map(([x, y, z]) => new Vector3(x, y, z))
  );
}
function makeLineObject(color, dashed) {
  const geom = new BufferGeometry();
  if (dashed) {
    return new Line(
      geom,
      new LineDashedMaterial({
        color,
        transparent: true,
        opacity: 0.75,
        dashSize: 0.08,
        gapSize: 0.06,
        depthTest: false
      })
    );
  }
  return new Line(
    geom,
    new LineBasicMaterial({
      color,
      depthTest: true,
      depthWrite: false
    })
  );
}
function RotationOutline({
  profile,
  color = MATH_COLORS.line,
  segments = 48,
  hasTopCap = true,
  hasBottomCap = true,
  ringRadiusEps = 1e-3
}) {
  const { camera } = useThree();
  const zMin = profile[0].z;
  const zMax = profile[profile.length - 1].z;
  const rTop = reactExports.useMemo(() => rimRadiusAtZ(profile, zMax), [profile, zMax]);
  const rBottom = reactExports.useMemo(() => rimRadiusAtZ(profile, zMin), [profile, zMin]);
  const hasTopRing = hasTopCap && rTop > ringRadiusEps;
  const hasBottomRing = hasBottomCap && rBottom > ringRadiusEps;
  const leftLine = reactExports.useMemo(() => makeLineObject(color, false), [color]);
  const rightLine = reactExports.useMemo(() => makeLineObject(color, false), [color]);
  const topSolid = reactExports.useMemo(() => makeLineObject(color, false), [color]);
  const topDashed = reactExports.useMemo(() => makeLineObject(color, true), [color]);
  const bottomSolid = reactExports.useMemo(() => makeLineObject(color, false), [color]);
  const bottomDashed = reactExports.useMemo(() => makeLineObject(color, true), [color]);
  useFrame(() => {
    const { thetaCam, beta } = getCameraFrame(camera);
    const { left, right, zRange } = computeSilhouette(profile, thetaCam, beta);
    if (!zRange || left.length === 0) {
      [
        leftLine,
        rightLine,
        topSolid,
        topDashed,
        bottomSolid,
        bottomDashed
      ].forEach((obj) => {
        obj.visible = false;
      });
      return;
    }
    setLinePoints(
      leftLine,
      left.map((p) => {
        const r = p.r + RADIAL_EPS;
        return [r * Math.cos(p.theta), p.z, r * Math.sin(p.theta)];
      })
    );
    setLinePoints(
      rightLine,
      right.map((p) => {
        const r = p.r + RADIAL_EPS;
        return [r * Math.cos(p.theta), p.z, r * Math.sin(p.theta)];
      })
    );
    leftLine.visible = true;
    rightLine.visible = true;
    const bottomBoundary = left[0];
    const topBoundary = left[left.length - 1];
    const applyRing = (solid, dashed, fullyVisible, r, z, thetaL, thetaR) => {
      if (fullyVisible) {
        setLinePoints(solid, sampleArc(r, z, 0, Math.PI * 2, segments * 2));
        solid.visible = true;
        dashed.visible = false;
        return;
      }
      setLinePoints(solid, sampleArc(r, z, thetaL, thetaR, segments));
      setLinePoints(
        dashed,
        sampleArc(r, z, thetaR, thetaL + Math.PI * 2, segments)
      );
      dashed.computeLineDistances();
      solid.visible = true;
      dashed.visible = true;
    };
    const topFullyVisible = beta > 0;
    const bottomFullyVisible = beta < 0;
    if (hasTopRing) {
      const phi = Math.abs(topBoundary.theta - thetaCam);
      applyRing(
        topSolid,
        topDashed,
        topFullyVisible,
        rTop,
        zMax,
        thetaCam - phi,
        thetaCam + phi
      );
    } else {
      topSolid.visible = false;
      topDashed.visible = false;
    }
    if (hasBottomRing) {
      const phi = Math.abs(bottomBoundary.theta - thetaCam);
      applyRing(
        bottomSolid,
        bottomDashed,
        bottomFullyVisible,
        rBottom,
        zMin,
        thetaCam - phi,
        thetaCam + phi
      );
    } else {
      bottomSolid.visible = false;
      bottomDashed.visible = false;
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: leftLine, renderOrder: 10 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: rightLine, renderOrder: 10 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: topSolid, renderOrder: 10 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: topDashed, renderOrder: 12 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: bottomSolid, renderOrder: 10 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: bottomDashed, renderOrder: 12 })
  ] });
}
function DepthPrepassMesh({ geometry }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { geometry, renderOrder: 0, children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { colorWrite: false, depthWrite: true, depthTest: true }) });
}
const RotationSolid = ({
  profile,
  colorKey = "primary",
  opacity = 0.28,
  segments = 48,
  thetaStart = 0,
  thetaLength = Math.PI * 2,
  showOutline = true,
  hasTopCap = true,
  hasBottomCap = true
}) => {
  const geometry = reactExports.useMemo(() => {
    const pts = profile.map((p) => new Vector2(p.r, p.z));
    return new LatheGeometry(pts, segments, thetaStart, thetaLength);
  }, [profile, segments, thetaStart, thetaLength]);
  const color = MATH_COLORS[colorKey];
  const fullSweep = thetaLength >= Math.PI * 2 - 1e-3;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { renderOrder: 5, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DepthPrepassMesh, { geometry }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { geometry, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color,
        transparent: true,
        opacity,
        roughness: 0.55,
        metalness: 0,
        side: DoubleSide,
        depthWrite: false
      }
    ) }),
    showOutline && fullSweep && /* @__PURE__ */ jsxRuntimeExports.jsx(
      RotationOutline,
      {
        profile,
        color: MATH_COLORS.line,
        segments,
        hasTopCap,
        hasBottomCap
      }
    )
  ] });
};
export {
  RotationSolid as R,
  cylinderProfile as a,
  coneProfile as c,
  frustumProfile as f,
  sphereProfile as s
};
