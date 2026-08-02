import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { T as ThreePanel, M as MathPanel, b as MATH_COLORS, L as LeftPanel, a as LeftPanelSection, P as ParamControl } from "./probabilityBayes-DNLi5nE3.js";
import { u as use3DViewport, T as ThreeDCanvas, C as CameraRig, a as Scene3DGrid, P as PointLabel3D, b as Legend3D, m as mathToThree, L as Line, B as BufferGeometry, n as BufferAttribute, D as DoubleSide } from "./Legend3D-DaYU3ia-.js";
import { T as TabSwitcher } from "./TabSwitcher--Cq6ch7f.js";
import { S as SelectGrid } from "./SelectGrid-Ce2XNEmL.js";
import { V as Vector3DArrow, F as FormulaLabel3D } from "./Vector3DArrow-BCaSwJX9.js";
import { P as Point3D } from "./Point3D-5VODdWJ3.js";
import { ae as calculateParallelepipedVertices, af as checkCoplanarCondition, b as buildMathQuantities } from "./mathQuantities-CPwsyb9V.js";
import "./useRadioGroup-DJLu5uAU.js";
const vector3dBasisMeta = [
  {
    key: "x",
    label: "基底 a 的系数 x",
    labelFormula: "\\color{#EF4444}{x}",
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
    description: "向量 OP 在基底 a 上的分解系数 x",
    descriptionFormula: "\\text{向量 } \\vec{OP} = \\color{#EF4444}{x}\\vec{a} + \\color{#D97706}{y}\\vec{b} + \\color{#059669}{z}\\vec{c} \\text{ 中的系数 } \\color{#EF4444}{x}"
  },
  {
    key: "y",
    label: "基底 b 的系数 y",
    labelFormula: "\\color{#D97706}{y}",
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.2,
    importance: "core",
    description: "向量 OP 在基底 b 上的分解系数 y",
    descriptionFormula: "\\text{向量 } \\vec{OP} = \\color{#EF4444}{x}\\vec{a} + \\color{#D97706}{y}\\vec{b} + \\color{#059669}{z}\\vec{c} \\text{ 中的系数 } \\color{#D97706}{y}"
  },
  {
    key: "z",
    label: "基底 c 的系数 z",
    labelFormula: "\\color{#059669}{z}",
    min: -2,
    max: 3,
    step: 0.1,
    defaultValue: 1.8,
    importance: "core",
    description: "向量 OP 在基底 c 上的分解系数 z",
    descriptionFormula: "\\text{向量 } \\vec{OP} = \\color{#EF4444}{x}\\vec{a} + \\color{#D97706}{y}\\vec{b} + \\color{#059669}{z}\\vec{c} \\text{ 中的系数 } \\color{#059669}{z}",
    marks: [{ value: 0, label: "z=0 (与a,b共面)", labelFormula: "z=0" }]
  },
  {
    key: "cz",
    label: "基底 c 的竖直高度",
    labelFormula: "c_z",
    min: 0,
    max: 3,
    step: 0.1,
    defaultValue: 2,
    importance: "advanced",
    description: "基向量 c 的竖直高度分量（调节至 0 时基底退化共面）",
    descriptionFormula: "\\text{基向量 } \\vec{c} \\text{ 偏离 } (ab) \\text{ 平面的垂直高度}",
    marks: [{ value: 0, label: "c_z=0 (基底失效!)", labelFormula: "c_z=0" }]
  }
];
function Segment3D({
  from,
  to,
  color = MATH_COLORS.axis,
  dashed = true,
  lineWidth = 1.5,
  opacity = 0.6
}) {
  const p1 = mathToThree(from);
  const p2 = mathToThree(to);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Line,
    {
      points: [p1, p2],
      color,
      dashed,
      dashScale: 8,
      dashSize: 0.15,
      gapSize: 0.1,
      lineWidth,
      transparent: true,
      opacity
    }
  );
}
function TriangleMesh({
  A,
  B,
  C,
  color,
  opacity = 0.35
}) {
  const geometry = reactExports.useMemo(() => {
    const pA = mathToThree(A);
    const pB = mathToThree(B);
    const pC = mathToThree(C);
    const geom = new BufferGeometry();
    const vertices = new Float32Array([
      ...pA,
      ...pB,
      ...pC,
      ...pA,
      ...pC,
      ...pB
      // 正反双面
    ]);
    geom.setAttribute("position", new BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }, [A, B, C]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { geometry, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    "meshBasicMaterial",
    {
      color,
      transparent: true,
      opacity,
      side: DoubleSide
    }
  ) });
}
function Vector3DBasisAnimation() {
  const [activeMode, setActiveMode] = reactExports.useState("parallelepiped");
  const [params, setParams] = reactExports.useState({
    x: 1.5,
    y: 1.2,
    z: 1.8,
    cz: 2
  });
  const { preset, cameraPosition, setCameraPreset, controlsRef } = use3DViewport("iso");
  const { x, y, z, cz = 2 } = params;
  const O = { x: 0, y: 0, z: 0 };
  const vecA = { x: 2, y: 0, z: 0 };
  const vecB = { x: 0.5, y: 2, z: 0 };
  const vecC = { x: 0, y: 0.5, z: cz };
  const pointA = vecA;
  const pointB = vecB;
  const pointC = vecC;
  const box = reactExports.useMemo(
    () => calculateParallelepipedVertices(vecA, vecB, vecC, x, y, z),
    [vecA, vecB, vecC, x, y, z]
  );
  const P = box.P;
  const coplanarInfo = reactExports.useMemo(
    () => checkCoplanarCondition(x, y, z),
    [x, y, z]
  );
  const mathData = reactExports.useMemo(
    () => buildMathQuantities("anim-vector3d-basis", params, {
      mode: activeMode,
      vecA,
      vecB,
      vecC
    }),
    [params, activeMode, vecA, vecB, vecC]
  );
  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };
  const handleReset = () => {
    setParams({ x: 1.5, y: 1.2, z: 1.8, cz: 2 });
  };
  const paramConfigs = reactExports.useMemo(() => {
    const keysByMode = {
      parallelepiped: ["x", "y", "z"],
      coplanar: ["x", "y", "z"],
      degeneration: ["x", "y", "z", "cz"]
    };
    const allowedKeys = keysByMode[activeMode] ?? ["x", "y", "z"];
    return vector3dBasisMeta.filter((meta) => allowedKeys.includes(meta.key)).map((meta) => ({
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
    }));
  }, [params, activeMode]);
  const handlePresetSelect = (presetKey) => {
    switch (presetKey) {
      case "std":
        setParams({ x: 1.5, y: 1.2, z: 1.8, cz: 2 });
        setActiveMode("parallelepiped");
        break;
      case "centroid":
        setParams({ x: 0.33, y: 0.33, z: 0.34, cz: 2 });
        setActiveMode("coplanar");
        break;
      case "inside":
        setParams({ x: 0.5, y: 0.3, z: 0.2, cz: 2 });
        setActiveMode("coplanar");
        break;
      case "plane2d":
        setParams({ x: 1.5, y: 1.2, z: 0, cz: 2 });
        setActiveMode("parallelepiped");
        break;
      case "degen":
        setParams({ x: 1.5, y: 1.2, z: 1.8, cz: 0 });
        setActiveMode("degeneration");
        break;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    ThreePanel,
    {
      left: /* @__PURE__ */ jsxRuntimeExports.jsxs(LeftPanel, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "教学模式选择", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabSwitcher,
          {
            tabs: [
              { key: "parallelepiped", label: "六面体分解" },
              { key: "coplanar", label: "四点共面 (x+y+z=1)" },
              { key: "degeneration", label: "基底共面检验" }
            ],
            value: activeMode,
            onChange: (m) => setActiveMode(m)
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "经典高考场景预设", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SelectGrid,
          {
            items: [
              {
                key: "std",
                label: "标准分解",
                description: "P(1.5, 1.2, 1.8)"
              },
              {
                key: "centroid",
                label: "△ABC 重心",
                description: "x=y=z=1/3 共面",
                fullWidth: false
              },
              {
                key: "inside",
                label: "截面内部点",
                description: "x+y+z=1 共面"
              },
              {
                key: "plane2d",
                label: "z=0 二维退化",
                description: "P 在 (ab) 面上"
              },
              {
                key: "degen",
                label: "基底共面失效",
                description: "cz=0 向量c共面",
                fullWidth: true
              }
            ],
            value: "",
            onChange: handlePresetSelect,
            columns: 2
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LeftPanelSection,
          {
            title: "基底分解系数控制",
            subtitle: "拖动滑块调节 x, y, z 及基向量垂直高度",
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(LeftPanelSection, { title: "3D 视角控制", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
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
              title: "图例与标注",
              items: [
                {
                  colorKey: "paramPrimary",
                  swatch: "line",
                  label: "基底向量 a (红)"
                },
                {
                  colorKey: "paramSecondary",
                  swatch: "line",
                  label: "基底向量 b (橙)"
                },
                {
                  colorKey: "paramTertiary",
                  swatch: "line",
                  label: "基底向量 c (绿)"
                },
                {
                  colorKey: "highlight",
                  swatch: "line",
                  label: "结果向量 OP (紫)"
                }
              ]
            }
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CameraRig, { ref: controlsRef }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Scene3DGrid, { size: 5 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(PointLabel3D, { position: O, text: "O" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: O, to: vecA, colorKey: "paramPrimary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormulaLabel3D,
              {
                position: { x: vecA.x + 0.2, y: 0, z: 0 },
                tex: "\\vec{a}"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(PointLabel3D, { position: pointA, text: "A" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: O, to: vecB, colorKey: "paramSecondary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormulaLabel3D,
              {
                position: { x: vecB.x + 0.2, y: vecB.y + 0.2, z: 0 },
                tex: "\\vec{b}"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(PointLabel3D, { position: pointB, text: "B" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: O, to: vecC, colorKey: "paramTertiary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormulaLabel3D,
              {
                position: { x: 0, y: vecC.y + 0.2, z: vecC.z + 0.2 },
                tex: "\\vec{c}"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(PointLabel3D, { position: pointC, text: "C" }),
            activeMode === "parallelepiped" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: O, to: box.xa, colorKey: "paramPrimary" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Vector3DArrow,
                {
                  from: box.xa,
                  to: box.xy,
                  colorKey: "paramSecondary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Vector3DArrow,
                {
                  from: box.xy,
                  to: box.P,
                  colorKey: "paramTertiary"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Segment3D,
                {
                  from: box.xa,
                  to: box.xy,
                  color: MATH_COLORS.paramPrimary
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Segment3D,
                {
                  from: box.yb,
                  to: box.xy,
                  color: MATH_COLORS.paramSecondary
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Segment3D,
                {
                  from: box.xa,
                  to: box.xz,
                  color: MATH_COLORS.paramPrimary
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Segment3D,
                {
                  from: box.zc,
                  to: box.xz,
                  color: MATH_COLORS.paramTertiary
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Segment3D,
                {
                  from: box.yb,
                  to: box.yz,
                  color: MATH_COLORS.paramSecondary
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Segment3D,
                {
                  from: box.zc,
                  to: box.yz,
                  color: MATH_COLORS.paramTertiary
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Segment3D,
                {
                  from: box.xy,
                  to: box.P,
                  color: MATH_COLORS.symmetryAxis
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Segment3D,
                {
                  from: box.xz,
                  to: box.P,
                  color: MATH_COLORS.symmetryAxis
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Segment3D,
                {
                  from: box.yz,
                  to: box.P,
                  color: MATH_COLORS.symmetryAxis
                }
              )
            ] }),
            (activeMode === "coplanar" || coplanarInfo.isCoplanar) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleMesh,
                {
                  A: pointA,
                  B: pointB,
                  C: pointC,
                  color: MATH_COLORS.highlight,
                  opacity: 0.35
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Segment3D,
                {
                  from: pointA,
                  to: pointB,
                  dashed: false,
                  color: MATH_COLORS.vectorProjection,
                  lineWidth: 2
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Segment3D,
                {
                  from: pointB,
                  to: pointC,
                  dashed: false,
                  color: MATH_COLORS.vectorProjection,
                  lineWidth: 2
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Segment3D,
                {
                  from: pointC,
                  to: pointA,
                  dashed: false,
                  color: MATH_COLORS.vectorProjection,
                  lineWidth: 2
                }
              ),
              coplanarInfo.isCentroid && /* @__PURE__ */ jsxRuntimeExports.jsx(
                FormulaLabel3D,
                {
                  position: {
                    x: (pointA.x + pointB.x + pointC.x) / 3,
                    y: (pointA.y + pointB.y + pointC.y) / 3 + 0.2,
                    z: (pointA.z + pointB.z + pointC.z) / 3
                  },
                  tex: "\\text{重心 } G"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Vector3DArrow, { from: O, to: P, colorKey: "highlight" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(PointLabel3D, { position: P, text: "P", offset: [0.1, 0.1, 0.1] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FormulaLabel3D,
              {
                position: { x: P.x / 2 + 0.2, y: P.y / 2, z: P.z / 2 + 0.2 },
                tex: "\\vec{OP}"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Point3D, { position: P, colorKey: "highlight" }),
            activeMode === "degeneration" && Math.abs(cz) < 0.1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
              TriangleMesh,
              {
                A: O,
                B: vecA,
                C: vecB,
                color: MATH_COLORS.secondary,
                opacity: 0.4
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
          title: "空间向量分解与共面看板"
        }
      )
    }
  );
}
export {
  Vector3DBasisAnimation as default
};
