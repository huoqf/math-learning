import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { T as ThreePanel, M as MathPanel, L as LeftPanel, a as LeftPanelSection, P as ParamControl } from "./probabilityBayes-DNLi5nE3.js";
import { u as use3DViewport, T as ThreeDCanvas, C as CameraRig, a as Scene3DGrid, P as PointLabel3D, b as Legend3D } from "./Legend3D-DaYU3ia-.js";
import { T as TabSwitcher } from "./TabSwitcher--Cq6ch7f.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { F as FormulaLabel3D, V as Vector3DArrow } from "./Vector3DArrow-BCaSwJX9.js";
import { P as Plane3D, A as AngleArc3D } from "./AngleArc3D-DzA01gX4.js";
import { b as buildMathQuantities, a6 as getLineDirection } from "./mathQuantities-CPwsyb9V.js";
import { l as linePlaneRelationMeta } from "./solidGeometry-Q14xCXek.js";
import "./useRadioGroup-DJLu5uAU.js";
function LinePlaneRelationAnimation() {
  const [activeMode, setActiveMode] = reactExports.useState("parallel");
  const [params, setParams] = reactExports.useState({
    zHeight: 2,
    thetaDeg: 0,
    phiDeg: 30,
    intersectType: 1
    // 1: 相交, 0: 平行(反例)
  });
  const { preset, cameraPosition, setCameraPreset, controlsRef } = use3DViewport("iso");
  const zHeight = params.zHeight ?? 2;
  const thetaDeg = params.thetaDeg ?? 0;
  const phiDeg = params.phiDeg ?? 30;
  const intersectType = params.intersectType ?? 1;
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-solid-position", params, {
      mode: activeMode
    }),
    [params, activeMode]
  );
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  const handleReset = () => {
    setParams({
      zHeight: 2,
      thetaDeg: activeMode === "perpendicular" ? 90 : 0,
      phiDeg: 30,
      intersectType: 1
    });
  };
  const paramConfigs = reactExports.useMemo(() => {
    return linePlaneRelationMeta.map((meta) => {
      let currentVal = params[meta.key] ?? meta.defaultValue ?? 0;
      return {
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: currentVal,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks
      };
    });
  }, [params]);
  const lineDir = getLineDirection(thetaDeg, phiDeg);
  const startPoint = {
    x: -lineDir.x * 2.5,
    y: -lineDir.y * 2.5,
    z: zHeight - lineDir.z * 2.5
  };
  const endPoint = {
    x: lineDir.x * 2.5,
    y: lineDir.y * 2.5,
    z: zHeight + lineDir.z * 2.5
  };
  const midPoint = { x: 0, y: 0, z: zHeight };
  const lineMStart = { x: -2.5, y: 0, z: 0 };
  const lineMEnd = { x: 2.5, y: 0, z: 0 };
  const lineAStart = { x: -2.5, y: 0, z: 0 };
  const lineAEnd = { x: 2.5, y: 0, z: 0 };
  const lineBStart = intersectType === 1 ? { x: 0, y: -2.5, z: 0 } : { x: -2.5, y: 1.5, z: 0 };
  const lineBEnd = intersectType === 1 ? { x: 0, y: 2.5, z: 0 } : { x: 2.5, y: 1.5, z: 0 };
  const normalOrigin = { x: 0, y: 0, z: 0 };
  const normalEnd = { x: 0, y: 0, z: 2.5 };
  const projPoint = { x: endPoint.x, y: endPoint.y };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "空间位置关系模式选择", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabSwitcher,
          {
            tabs: [
              { key: "parallel", label: "线面平行" },
              { key: "perpendicular", label: "线面垂直" },
              { key: "surfaceParallel", label: "面面平行" },
              { key: "surfacePerp", label: "面面垂直" },
              { key: "vector", label: "向量与线面角" }
            ],
            value: activeMode,
            onChange: (mode) => {
              setActiveMode(mode);
              if (mode === "perpendicular") {
                setParams((p) => ({ ...p, thetaDeg: 90, zHeight: 0 }));
              } else if (mode === "parallel") {
                setParams((p) => ({ ...p, thetaDeg: 0, zHeight: 2 }));
              }
            }
          }
        ) }),
        activeMode === "perpendicular" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "面内两条直线关系",
            subtitle: "演示线面垂直判定前提：两条相交直线",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectGrid,
              {
                items: [
                  {
                    key: "1",
                    label: "相交",
                    description: "a ∩ b = P (成立)"
                  },
                  {
                    key: "0",
                    label: "平行 (反例)",
                    description: "a ∥ b (反例失效)"
                  }
                ],
                value: String(intersectType),
                onChange: (val) => setParams((prev) => ({ ...prev, intersectType: Number(val) })),
                columns: 2
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "直线几何参数",
            subtitle: "调节直线高度 h、线面角 θ 与方位角 φ",
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
                { colorKey: "primary", swatch: "line", label: "空间直线 l" },
                { colorKey: "secondary", swatch: "area", label: "基准平面 α" },
                {
                  colorKey: "paramTertiary",
                  swatch: "line",
                  label: "辅助平面/投影"
                }
              ]
            }
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CameraRig, { ref: controlsRef }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Scene3DGrid, { size: 5 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Plane3D,
              {
                origin: { x: 0, y: 0, z: 0 },
                uAxis: { x: 1, y: 0, z: 0 },
                vAxis: { x: 0, y: 1, z: 0 },
                width: 6,
                height: 6,
                colorKey: "secondary",
                opacity: 0.2
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(FormulaLabel3D, { position: { x: 2.8, y: 2.8, z: 0.1 }, tex: "\\alpha" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: startPoint, to: endPoint, colorKey: "primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormulaLabel3D,
              {
                position: {
                  x: endPoint.x + 0.2,
                  y: endPoint.y + 0.2,
                  z: endPoint.z + 0.2
                },
                tex: "l"
              }
            ),
            activeMode === "parallel" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Vector3DArrow,
                {
                  from: lineMStart,
                  to: lineMEnd,
                  colorKey: "primary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(FormulaLabel3D, { position: { x: 2.6, y: 0.2, z: 0 }, tex: "m" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Plane3D,
                {
                  origin: { x: 0, y: 0, z: zHeight / 2 },
                  uAxis: { x: 1, y: 0, z: 0 },
                  vAxis: { x: 0, y: 0, z: 1 },
                  width: 6,
                  height: Math.max(1, zHeight * 1.5),
                  colorKey: "paramTertiary",
                  opacity: 0.15
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: { x: 2.5, y: 0.1, z: zHeight / 2 + 0.5 },
                  tex: "\\beta"
                }
              )
            ] }),
            activeMode === "surfaceParallel" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Plane3D,
                {
                  origin: { x: 0, y: 0, z: 2 },
                  uAxis: { x: 1, y: 0, z: 0 },
                  vAxis: { x: 0, y: 1, z: 0 },
                  width: 6,
                  height: 6,
                  colorKey: "paramTertiary",
                  opacity: 0.25
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: { x: 2.8, y: 2.8, z: 2.1 },
                  tex: "\\beta"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Vector3DArrow,
                {
                  from: { x: -1, y: -1, z: 0 },
                  to: { x: -1, y: -1, z: 1.5 },
                  colorKey: "primary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: { x: -0.8, y: -1, z: 1.6 },
                  tex: "\\vec{n_1}"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Vector3DArrow,
                {
                  from: { x: 1, y: 1, z: 2 },
                  to: { x: 1, y: 1, z: 3.5 },
                  colorKey: "secondary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: { x: 1.2, y: 1, z: 3.6 },
                  tex: "\\vec{n_2}"
                }
              )
            ] }),
            activeMode === "surfacePerp" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Plane3D,
                {
                  origin: { x: 0, y: 0, z: 0 },
                  uAxis: { x: 0, y: 1, z: 0 },
                  vAxis: { x: 0, y: 0, z: 1 },
                  width: 6,
                  height: 4,
                  colorKey: "paramTertiary",
                  opacity: 0.25
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: { x: 0.1, y: 2.8, z: 3.2 },
                  tex: "\\beta"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Vector3DArrow,
                {
                  from: { x: 0, y: -1, z: 0 },
                  to: { x: 0, y: -1, z: 1.8 },
                  colorKey: "primary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: { x: 0.2, y: -1, z: 1.9 },
                  tex: "\\vec{n_1}"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Vector3DArrow,
                {
                  from: { x: 0, y: 1, z: 1 },
                  to: { x: 1.8, y: 1, z: 1 },
                  colorKey: "secondary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: { x: 1.9, y: 1, z: 1.1 },
                  tex: "\\vec{n_2}"
                }
              )
            ] }),
            activeMode === "perpendicular" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Vector3DArrow,
                {
                  from: lineAStart,
                  to: lineAEnd,
                  colorKey: "primary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(FormulaLabel3D, { position: { x: 2.6, y: 0.2, z: 0 }, tex: "a" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Vector3DArrow,
                {
                  from: lineBStart,
                  to: lineBEnd,
                  colorKey: "primary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: {
                    x: lineBEnd.x + 0.2,
                    y: lineBEnd.y + 0.2,
                    z: 0
                  },
                  tex: "b"
                }
              ),
              intersectType === 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(PointLabel3D, { position: { x: 0, y: 0, z: 0 }, text: "P" })
            ] }),
            activeMode === "vector" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Vector3DArrow,
                {
                  from: normalOrigin,
                  to: normalEnd,
                  colorKey: "paramPrimary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: { x: 0.2, y: 0.2, z: 2.6 },
                  tex: "\\vec{n}"
                }
              ),
              thetaDeg > 0 && thetaDeg < 90 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                AngleArc3D,
                {
                  vertex: midPoint,
                  dirA: {
                    x: endPoint.x - midPoint.x,
                    y: endPoint.y - midPoint.y,
                    z: endPoint.z - midPoint.z
                  },
                  dirB: {
                    x: projPoint.x - midPoint.x,
                    y: projPoint.y - midPoint.y,
                    z: 0
                  },
                  radius: 0.8,
                  colorKey: "paramSecondary"
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
          title: "空间位置关系判定看板"
        }
      )
    }
  );
}
export {
  LinePlaneRelationAnimation as default
};
