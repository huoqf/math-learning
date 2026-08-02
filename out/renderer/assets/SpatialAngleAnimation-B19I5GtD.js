import { j as jsxRuntimeExports, u as useLocation, r as reactExports } from "./index-DT9BKSox.js";
import { b as MATH_COLORS, T as ThreePanel, M as MathPanel, L as LeftPanel, a as LeftPanelSection, P as ParamControl } from "./probabilityBayes-DNLi5nE3.js";
import { m as mathToThree, p as Billboard, q as Text, r as FONT_3D, P as PointLabel3D, u as use3DViewport, T as ThreeDCanvas, C as CameraRig, a as Scene3DGrid, b as Legend3D } from "./Legend3D-DaYU3ia-.js";
import { T as TabSwitcher } from "./TabSwitcher--Cq6ch7f.js";
import { V as Vector3DArrow, F as FormulaLabel3D } from "./Vector3DArrow-BCaSwJX9.js";
import { P as Point3D } from "./Point3D-5VODdWJ3.js";
import { A as AngleArc3D, P as Plane3D } from "./AngleArc3D-DzA01gX4.js";
import { C as Cuboid } from "./Cuboid-mtzNbfCJ.js";
import { b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import { a as spatialAngleMeta } from "./solidGeometry-Q14xCXek.js";
import "./useRadioGroup-DJLu5uAU.js";
const CompoundLabel3D = ({
  position,
  base,
  subscript,
  colorKey = "label",
  fontSize = 0.26,
  offset = [0.16, 0.16, 0]
}) => {
  const [x, y, z] = mathToThree(position);
  const color = MATH_COLORS[colorKey];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Billboard, { position: [x + offset[0], y + offset[1], z + offset[2]], follow: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Text,
      {
        font: FONT_3D.regular,
        fontSize,
        color,
        anchorX: "left",
        anchorY: "middle",
        "material-depthTest": false,
        renderOrder: 999,
        children: base
      }
    ),
    subscript && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Text,
      {
        font: FONT_3D.regular,
        fontSize: fontSize * 0.62,
        color,
        anchorX: "left",
        anchorY: "middle",
        position: [fontSize * base.length * 0.58, -fontSize * 0.28, 0],
        "material-depthTest": false,
        renderOrder: 999,
        children: subscript
      }
    )
  ] });
};
const LinePlaneAngle3D = ({
  lineStart,
  lineEnd,
  footPoint,
  planeNormal,
  arcRadius = 0.8,
  showNormal = true,
  showFootLabel = false,
  footLabelText = "P'"
}) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: lineStart, to: lineEnd, colorKey: "primary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: lineEnd, to: footPoint, colorKey: "paramTertiary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: lineStart, to: footPoint, colorKey: "secondary" }),
    showFootLabel && /* @__PURE__ */ jsxRuntimeExports.jsx(PointLabel3D, { position: footPoint, text: footLabelText }),
    showNormal && planeNormal && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Vector3DArrow,
        {
          from: footPoint,
          to: {
            x: footPoint.x + planeNormal.x,
            y: footPoint.y + planeNormal.y,
            z: footPoint.z + planeNormal.z
          },
          colorKey: "secondary"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FormulaLabel3D,
        {
          position: {
            x: footPoint.x + planeNormal.x + 0.2,
            y: footPoint.y + planeNormal.y + 0.2,
            z: footPoint.z + planeNormal.z + 0.2
          },
          tex: "\\vec{n}"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AngleArc3D,
      {
        vertex: lineStart,
        dirA: {
          x: footPoint.x - lineStart.x,
          y: footPoint.y - lineStart.y,
          z: footPoint.z - lineStart.z
        },
        dirB: {
          x: lineEnd.x - lineStart.x,
          y: lineEnd.y - lineStart.y,
          z: lineEnd.z - lineStart.z
        },
        radius: arcRadius,
        colorKey: "highlight"
      }
    )
  ] });
};
function SpatialAngleAnimation() {
  const location = useLocation();
  const defaultMode = location.pathname.includes("distance") ? "distance" : "skewLines";
  const [activeMode, setActiveMode] = reactExports.useState(defaultMode);
  const [params, setParams] = reactExports.useState({
    a: 3,
    b: 2,
    c: 2,
    ex: 1.2
  });
  const { preset, cameraPosition, setCameraPreset, controlsRef } = use3DViewport("iso");
  const { a, b, c, ex } = params;
  const A = { x: 0, y: 0, z: 0 };
  const B = { x: a, y: 0, z: 0 };
  const C = { x: a, y: b, z: 0 };
  const D = { x: 0, y: b, z: 0 };
  const A1 = { x: 0, y: 0, z: c };
  const B1 = { x: a, y: 0, z: c };
  const E = { x: 0, y: 0, z: ex };
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-solid-angle", params, {
      mode: activeMode
    }),
    [params, activeMode]
  );
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  const handleReset = () => {
    setParams({ a: 3, b: 2, c: 2, ex: 1.2 });
  };
  const paramConfigs = reactExports.useMemo(
    () => spatialAngleMeta.map((meta) => ({
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
  const n2X = b * ex;
  const n2Y = a * ex;
  const n2Z = a * b;
  const n2Len = Math.sqrt(n2X * n2X + n2Y * n2Y + n2Z * n2Z);
  const n2Normalized = {
    x: n2X / n2Len * 2,
    y: n2Y / n2Len * 2,
    z: n2Z / n2Len * 2
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "空间角与距离模式选择", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabSwitcher,
          {
            tabs: [
              { key: "skewLines", label: "异面直线角" },
              { key: "linePlane", label: "线面角" },
              { key: "dihedral", label: "二面角" },
              { key: "distance", label: "点到平面距离" }
            ],
            value: activeMode,
            onChange: (mode) => setActiveMode(mode)
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "建系与几何尺寸参数",
            subtitle: "调节长方体棱长与动点 E 高度",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              ParamControl,
              {
                params: paramConfigs,
                onParamChange: handleParamChange,
                onReset: handleReset
              }
            )
          }
        ),
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
              title: "图例",
              items: [
                { colorKey: "primary", swatch: "area", label: "长方体/截面" },
                { colorKey: "secondary", swatch: "line", label: "底面/辅助线" },
                { colorKey: "highlight", swatch: "line", label: "特征角/距离" }
              ]
            }
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CameraRig, { ref: controlsRef }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Scene3DGrid, { size: 5 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Cuboid, { a, b, c, opacity: 0.12, colorKey: "primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(PointLabel3D, { position: B, text: "B" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(PointLabel3D, { position: C, text: "C" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(PointLabel3D, { position: D, text: "D" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CompoundLabel3D, { position: A1, base: "A", subscript: "1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CompoundLabel3D, { position: B1, base: "B", subscript: "1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(PointLabel3D, { position: E, text: "E", offset: [0.1, 0.1, 0.1] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Point3D,
              {
                position: E,
                draggable: true,
                constrain: (raw) => ({
                  x: 0,
                  y: 0,
                  z: Math.min(c, Math.max(0.2, raw.z))
                }),
                onDrag: (next) => setParams((prev) => ({
                  ...prev,
                  ex: Number(next.z.toFixed(2))
                })),
                colorKey: "highlight"
              }
            ),
            activeMode === "skewLines" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: D, to: E, colorKey: "primary" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: A, to: B1, colorKey: "accent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: { x: 0, y: b / 2, z: ex / 2 },
                  tex: "\\vec{u}=\\vec{DE}"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: { x: a / 2, y: 0, z: c / 2 },
                  tex: "\\vec{v}=\\vec{AB_1}"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                AngleArc3D,
                {
                  vertex: A,
                  dirA: { x: B1.x - A.x, y: B1.y - A.y, z: B1.z - A.z },
                  dirB: { x: 0, y: D.y - A.y, z: E.z - A.z },
                  radius: 0.8,
                  colorKey: "highlight"
                }
              ),
              (() => {
                const den = a * a * b * b + b * b * c * c + a * a * ex * ex;
                const s0 = b * b * (a * a + c * c) / Math.max(1e-6, den);
                const t0 = b * b * c * ex / Math.max(1e-6, den);
                const P1 = { x: 0, y: b * (1 - s0), z: s0 * ex };
                const P2 = { x: t0 * a, y: 0, z: t0 * c };
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: P1, to: P2, colorKey: "paramPrimary" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    FormulaLabel3D,
                    {
                      position: {
                        x: (P1.x + P2.x) / 2 + 0.15,
                        y: (P1.y + P2.y) / 2 - 0.2,
                        z: (P1.z + P2.z) / 2
                      },
                      tex: "d_{\\text{异面}}"
                    }
                  )
                ] });
              })()
            ] }),
            activeMode === "linePlane" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Plane3D,
                {
                  origin: A,
                  uAxis: { x: 1, y: 0, z: 0 },
                  vAxis: { x: 0, y: 1, z: 0 },
                  width: a + 0.5,
                  height: b + 0.5,
                  colorKey: "secondary",
                  opacity: 0.18
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                LinePlaneAngle3D,
                {
                  lineStart: B,
                  lineEnd: E,
                  footPoint: A,
                  planeNormal: { x: 0, y: 0, z: 1 },
                  arcRadius: 0.8,
                  showFootLabel: false
                }
              )
            ] }),
            activeMode === "distance" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Plane3D,
                {
                  origin: A,
                  uAxis: { x: 1, y: 0, z: 0 },
                  vAxis: { x: 0, y: 1, z: 0 },
                  width: a + 0.5,
                  height: b + 0.5,
                  colorKey: "secondary",
                  opacity: 0.15
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Plane3D,
                {
                  origin: B,
                  uAxis: { x: D.x - B.x, y: D.y - B.y, z: 0 },
                  vAxis: { x: E.x - B.x, y: E.y - B.y, z: E.z - B.z },
                  width: Math.max(a, b) + 1,
                  height: c + 1,
                  colorKey: "paramTertiary",
                  opacity: 0.25
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: E, to: B, colorKey: "accent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: E, to: D, colorKey: "accent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: B, to: D, colorKey: "accent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: A, to: E, colorKey: "primary" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Vector3DArrow,
                {
                  from: A,
                  to: {
                    x: n2Normalized.x,
                    y: n2Normalized.y,
                    z: n2Normalized.z
                  },
                  colorKey: "primary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: {
                    x: n2Normalized.x + 0.2,
                    y: n2Normalized.y + 0.2,
                    z: n2Normalized.z + 0.2
                  },
                  tex: "\\vec{n}"
                }
              ),
              (() => {
                const t = a * b * ex / (n2Len * n2Len);
                const H = { x: t * n2X, y: t * n2Y, z: t * n2Z };
                const isMax = Math.abs(ex - c) < 0.05;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: A, to: H, colorKey: "highlight" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    PointLabel3D,
                    {
                      position: H,
                      text: "H",
                      offset: [0.1, 0.1, 0.1]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    FormulaLabel3D,
                    {
                      position: {
                        x: H.x / 2 - 0.2,
                        y: H.y / 2 - 0.2,
                        z: H.z / 2
                      },
                      tex: "d"
                    }
                  ),
                  isMax && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    FormulaLabel3D,
                    {
                      position: { x: 0, y: -0.3, z: c + 0.3 },
                      tex: "V_{\\max}"
                    }
                  )
                ] });
              })()
            ] }),
            activeMode === "dihedral" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Plane3D,
                {
                  origin: A,
                  uAxis: { x: 1, y: 0, z: 0 },
                  vAxis: { x: 0, y: 1, z: 0 },
                  width: a + 0.5,
                  height: b + 0.5,
                  colorKey: "secondary",
                  opacity: 0.15
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Plane3D,
                {
                  origin: B,
                  uAxis: { x: D.x - B.x, y: D.y - B.y, z: 0 },
                  vAxis: { x: E.x - B.x, y: E.y - B.y, z: E.z - B.z },
                  width: Math.max(a, b) + 1,
                  height: c + 1,
                  colorKey: "paramTertiary",
                  opacity: 0.25
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Vector3DArrow,
                {
                  from: { x: a / 3, y: b / 3, z: ex / 3 },
                  to: {
                    x: a / 3 + n2Normalized.x,
                    y: b / 3 + n2Normalized.y,
                    z: ex / 3 + n2Normalized.z
                  },
                  colorKey: "primary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: {
                    x: a / 3 + n2Normalized.x,
                    y: b / 3 + n2Normalized.y,
                    z: ex / 3 + n2Normalized.z + 0.3
                  },
                  tex: "\\vec{n_2}"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Vector3DArrow,
                {
                  from: { x: a / 3, y: b / 3, z: 0 },
                  to: { x: a / 3, y: b / 3, z: 1.8 },
                  colorKey: "secondary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: B, to: D, colorKey: "highlight" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                AngleArc3D,
                {
                  vertex: B,
                  dirA: { x: D.x - B.x, y: D.y - B.y, z: 0 },
                  dirB: { x: E.x - B.x, y: E.y - B.y, z: E.z - B.z },
                  radius: 0.9,
                  colorKey: "highlight"
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
          title: "空间角向量求解看板"
        }
      )
    }
  );
}
export {
  SpatialAngleAnimation as default
};
