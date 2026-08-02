import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { b as MATH_COLORS, T as ThreePanel, M as MathPanel, L as LeftPanel, a as LeftPanelSection, P as ParamControl } from "./probabilityBayes-DNLi5nE3.js";
import { m as mathToThree, V as Vector3, B as BufferGeometry, F as Float32BufferAttribute, D as DoubleSide, L as Line, u as use3DViewport, T as ThreeDCanvas, C as CameraRig, a as Scene3DGrid, P as PointLabel3D, b as Legend3D } from "./Legend3D-DaYU3ia-.js";
import { T as TabSwitcher } from "./TabSwitcher--Cq6ch7f.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { V as Vector3DArrow, F as FormulaLabel3D } from "./Vector3DArrow-BCaSwJX9.js";
import { P as Point3D } from "./Point3D-5VODdWJ3.js";
import { E as Edges, C as Cuboid } from "./Cuboid-mtzNbfCJ.js";
import { R as RegularPyramid } from "./RegularPyramid-_Fo5-49i.js";
import { R as RotationSolid, c as coneProfile, a as cylinderProfile } from "./RotationSolid-O5oRCvD8.js";
import { b as buildMathQuantities, ag as cuboidCircumRadius, ah as regularPyramidCircumRadius, ai as coneCircumRadius } from "./mathQuantities-CPwsyb9V.js";
import { c as circumInSphereMeta } from "./solidGeometry-Q14xCXek.js";
import "./useRadioGroup-DJLu5uAU.js";
const TriangularPrism = ({
  legA,
  legB,
  height,
  colorKey = "primary",
  opacity = 0.25
}) => {
  const geometry = reactExports.useMemo(() => {
    const bottomC = new Vector3(0, 0, 0);
    const bottomA = new Vector3(legA, 0, 0);
    const bottomB = new Vector3(0, legB, 0);
    const topC = new Vector3(0, 0, height);
    const topA = new Vector3(legA, 0, height);
    const topB = new Vector3(0, legB, height);
    const bC = mathToThree(bottomC);
    const bA = mathToThree(bottomA);
    const bB = mathToThree(bottomB);
    const tC = mathToThree(topC);
    const tA = mathToThree(topA);
    const tB = mathToThree(topB);
    const positions = [];
    const push = (p0, p1, p2) => {
      positions.push(...p0, ...p1, ...p2);
    };
    push(bC, bB, bA);
    push(tC, tA, tB);
    const bottom = [bC, bA, bB];
    const top = [tC, tA, tB];
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3;
      push(bottom[i], bottom[j], top[j]);
      push(bottom[i], top[j], top[i]);
    }
    const geo = new BufferGeometry();
    geo.setAttribute(
      "position",
      new Float32BufferAttribute(positions, 3)
    );
    geo.computeVertexNormals();
    return geo;
  }, [legA, legB, height]);
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
const Cone = ({
  radius,
  height,
  colorKey = "primary",
  opacity = 0.28
}) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  RotationSolid,
  {
    profile: coneProfile(radius, height),
    colorKey,
    opacity
  }
);
const Cylinder = ({
  radius,
  height,
  colorKey = "primary",
  opacity = 0.28
}) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  RotationSolid,
  {
    profile: cylinderProfile(radius, height),
    colorKey,
    opacity
  }
);
function sampleCircle(center, radius, plane, segments = 64) {
  const [cx, cy, cz] = center;
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments * Math.PI * 2;
    const c = radius * Math.cos(t);
    const s = radius * Math.sin(t);
    if (plane === "xy") pts.push([cx + c, cy + s, cz]);
    if (plane === "xz") pts.push([cx + c, cy, cz + s]);
    if (plane === "yz") pts.push([cx, cy + c, cz + s]);
  }
  return pts;
}
const SphereShell = ({
  center,
  radius,
  colorKey,
  opacity = 0.16,
  showGreatCircles = true,
  depthTest = true
}) => {
  const pos = mathToThree(center);
  const color = MATH_COLORS[colorKey];
  const [px, py, pz] = pos;
  const circles = reactExports.useMemo(
    () => showGreatCircles ? ["xy", "xz", "yz"].map((p) => sampleCircle(pos, radius, p)) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [px, py, pz, radius, showGreatCircles]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { renderOrder: 10, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: pos, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [radius, 48, 32] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color,
          transparent: true,
          opacity,
          roughness: 0.4,
          metalness: 0,
          side: DoubleSide,
          depthWrite: false,
          depthTest
        }
      )
    ] }),
    circles.map((pts, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Line,
      {
        points: pts,
        color,
        lineWidth: 1.2,
        transparent: true,
        opacity: 0.55,
        depthTest
      },
      i
    ))
  ] });
};
const CircumSphere = ({
  center,
  radius,
  colorKey = "sphereShell",
  showGreatCircles = true,
  opacity = 0.16
}) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SphereShell,
  {
    center,
    radius,
    colorKey,
    opacity,
    showGreatCircles
  }
);
const InSphere = ({ center, radius }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SphereShell,
  {
    center,
    radius,
    colorKey: "inSphereShell",
    opacity: 0.22,
    showGreatCircles: true,
    depthTest: false
  }
);
function SphereBySphereType({
  sphereType,
  center,
  radius
}) {
  if (!Number.isFinite(radius) || radius <= 0) {
    return null;
  }
  return sphereType === "circum" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircumSphere, { center, radius }) : /* @__PURE__ */ jsxRuntimeExports.jsx(InSphere, { center, radius });
}
function CircumInSphereAnimation() {
  const [sphereType, setSphereType] = reactExports.useState("circum");
  const [shape, setShape] = reactExports.useState("cuboid");
  const [params, setParams] = reactExports.useState({
    a: 3,
    b: 2,
    c: 2
  });
  const { preset, cameraPosition, setCameraPreset, controlsRef } = use3DViewport("iso");
  const { a, b, c } = params;
  const { radius, center } = reactExports.useMemo(() => {
    if (sphereType === "circum") {
      if (shape === "cuboid") {
        const r = cuboidCircumRadius(a, b, c);
        return { radius: r, center: { x: a / 2, y: b / 2, z: c / 2 } };
      } else if (shape === "regularPyramid") {
        const rBase = a / Math.sqrt(2);
        const r = regularPyramidCircumRadius(rBase, c);
        return { radius: r, center: { x: 0, y: 0, z: c - r } };
      } else if (shape === "triangularPrism") {
        const rBase = Math.sqrt(a * a + b * b) / 2;
        const r = Math.sqrt(rBase * rBase + (c / 2) ** 2);
        return { radius: r, center: { x: a / 2, y: b / 2, z: c / 2 } };
      } else if (shape === "cone") {
        const r = coneCircumRadius(a, c);
        return { radius: r, center: { x: 0, y: 0, z: c - r } };
      } else {
        const r = Math.sqrt(a * a + (c / 2) ** 2);
        return { radius: r, center: { x: 0, y: 0, z: c / 2 } };
      }
    } else {
      if (shape === "cuboid") {
        const r = Math.min(a, b, c) / 2;
        return { radius: r, center: { x: a / 2, y: b / 2, z: c / 2 } };
      } else if (shape === "regularPyramid") {
        const hs = Math.sqrt(c * c + (a / 2) ** 2);
        const vSolid = 1 / 3 * a * a * c;
        const sTotal = a * a + 2 * a * hs;
        const r = 3 * vSolid / sTotal;
        return { radius: r, center: { x: 0, y: 0, z: r } };
      } else if (shape === "triangularPrism") {
        const rBaseIn = (a + b - Math.sqrt(a * a + b * b)) / 2;
        const r = Math.min(rBaseIn, c / 2);
        return {
          radius: r,
          center: { x: rBaseIn, y: rBaseIn, z: c / 2 }
        };
      } else if (shape === "cone") {
        const l = Math.sqrt(a * a + c * c);
        const r = a * c / (a + l);
        return { radius: r, center: { x: 0, y: 0, z: r } };
      } else {
        const r = Math.min(a, c / 2);
        return { radius: r, center: { x: 0, y: 0, z: c / 2 } };
      }
    }
  }, [sphereType, shape, a, b, c]);
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-solid-ball", params, {
      sphereType,
      shape
    }),
    [params, sphereType, shape]
  );
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  const handleReset = () => {
    setParams({ a: 3, b: 2, c: 2 });
  };
  const paramConfigs = reactExports.useMemo(
    () => circumInSphereMeta.map((meta) => ({
      key: meta.key,
      label: meta.label,
      labelFormula: meta.labelFormula,
      value: params[meta.key] ?? meta.defaultValue ?? 0,
      min: meta.min,
      max: meta.max,
      step: meta.step ?? 0.1,
      description: meta.description,
      descriptionFormula: meta.descriptionFormula,
      importance: meta.importance,
      marks: meta.marks
    })),
    [params]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "球切接类型", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabSwitcher,
          {
            tabs: [
              { key: "circum", label: "外接球 (Circum)" },
              { key: "inscribed", label: "内切球 (Inscribed)" }
            ],
            value: sphereType,
            onChange: (t) => setSphereType(t)
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "几何体模型选择", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              { key: "cuboid", label: "长方体/正方体" },
              { key: "regularPyramid", label: "正四棱锥" },
              { key: "triangularPrism", label: "直三棱柱" },
              { key: "cone", label: "圆锥" },
              { key: "cylinder", label: "圆柱" }
            ],
            value: shape,
            onChange: (k) => setShape(k),
            variant: "filled",
            columns: 2
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "几何参数调节", subtitle: "调节底面尺寸与高度", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ParamControl,
          {
            params: paramConfigs,
            onParamChange: handleParamChange,
            onReset: handleReset
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "3D 视角选择", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabSwitcher,
          {
            tabs: [
              { key: "iso", label: "轴测" },
              { key: "front", label: "主视" },
              { key: "top", label: "俯视" },
              { key: "side", label: "左视" }
            ],
            value: preset,
            onChange: (p) => setCameraPreset(p)
          }
        ) })
      ] }),
      center: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        ThreeDCanvas,
        {
          cameraPosition,
          legend: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Legend3D,
            {
              title: "切接球图例",
              items: [
                { colorKey: "primary", swatch: "area", label: "几何体主体" },
                {
                  colorKey: sphereType === "circum" ? "sphereShell" : "inSphereShell",
                  swatch: "sphere",
                  label: sphereType === "circum" ? "外接球" : "内切球"
                },
                { colorKey: "highlight", swatch: "point", label: "O：球心" }
              ]
            }
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CameraRig, { ref: controlsRef }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Scene3DGrid, { size: 5 }),
            shape === "cuboid" && /* @__PURE__ */ jsxRuntimeExports.jsx(Cuboid, { a, b, c, colorKey: "primary", opacity: 0.2 }),
            shape === "regularPyramid" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              RegularPyramid,
              {
                sides: 4,
                baseRadius: a / Math.sqrt(2),
                height: c,
                colorKey: "primary"
              }
            ),
            shape === "cone" && /* @__PURE__ */ jsxRuntimeExports.jsx(Cone, { radius: a, height: c, colorKey: "primary" }),
            shape === "triangularPrism" && /* @__PURE__ */ jsxRuntimeExports.jsx(TriangularPrism, { legA: a, legB: b, height: c, colorKey: "primary" }),
            shape === "cylinder" && /* @__PURE__ */ jsxRuntimeExports.jsx(Cylinder, { radius: a, height: c, colorKey: "primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              SphereBySphereType,
              {
                sphereType,
                center,
                radius
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Point3D, { position: center, colorKey: "highlight" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(PointLabel3D, { position: center, text: "O" }),
            sphereType === "circum" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Vector3DArrow,
              {
                from: center,
                to: shape === "regularPyramid" || shape === "cone" ? { x: 0, y: 0, z: c } : shape === "cylinder" ? { x: a, y: 0, z: c } : shape === "triangularPrism" ? { x: 0, y: 0, z: c } : { x: a, y: b, z: c },
                colorKey: "highlight"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              Vector3DArrow,
              {
                from: center,
                to: { x: center.x, y: center.y, z: 0 },
                colorKey: "highlight"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormulaLabel3D,
              {
                position: { x: center.x + 0.3, y: center.y, z: center.z + 0.3 },
                tex: `${sphereType === "circum" ? "R" : "r_{in}"}=${radius.toFixed(2)}`
              }
            )
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
          title: `${shape === "cuboid" ? "长方体" : shape === "regularPyramid" ? "正四棱锥" : shape === "triangularPrism" ? "直三棱柱" : shape === "cone" ? "圆锥" : "圆柱"}${sphereType === "circum" ? "外接球" : "内切球"}高考指标`
        }
      )
    }
  );
}
export {
  CircumInSphereAnimation as default
};
