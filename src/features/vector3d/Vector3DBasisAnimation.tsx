import { useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
  SelectGrid,
  Toggle,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Vector3DArrow,
  Segment3D,
  Point3D,
  PointLabel3D,
  FormulaLabel3D,
  Legend3D,
  CameraRig,
  ModeSwitchOverlay3D,
  type InteractionMode3D,
} from "@/components/Math3D";
import { use3DViewport, type CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { vector3dBasisMeta } from "@/data/registries/vector3d";
import type { Vec3 } from "@/math3d/vector3";
import { mathToThree } from "@/math3d/coordinateConvention";
import {
  calculateParallelepipedVertices,
  checkCoplanarCondition,
  projectPointOnPlaneABC,
  solveBasisCoefficients,
} from "@/math3d/basis";
import { MATH_COLORS } from "@/theme";

type TeachingMode = "parallelepiped" | "coplanar";

/** 3D 三角形填充面，用于四点共面模式展示 △ABC 截面或四面体面 */
function TriangleMesh({
  A,
  B,
  C,
  color,
  opacity = 0.3,
  renderOrder = 0,
  polygonOffset = false,
  polygonOffsetFactor = 0,
  depthWrite = true,
}: {
  A: Vec3;
  B: Vec3;
  C: Vec3;
  color: string;
  opacity?: number;
  renderOrder?: number;
  polygonOffset?: boolean;
  polygonOffsetFactor?: number;
  depthWrite?: boolean;
}) {
  const geometry = useMemo(() => {
    const pA = mathToThree(A);
    const pB = mathToThree(B);
    const pC = mathToThree(C);
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      ...pA,
      ...pB,
      ...pC,
      ...pA,
      ...pC,
      ...pB, // 正反双面
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }, [A, B, C]);

  return (
    <mesh geometry={geometry} renderOrder={renderOrder}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={depthWrite}
        polygonOffset={polygonOffset}
        polygonOffsetFactor={polygonOffsetFactor}
        polygonOffsetUnits={polygonOffsetFactor}
      />
    </mesh>
  );
}

export default function Vector3DBasisAnimation() {
  const [activeMode, setActiveMode] = useState<TeachingMode>("parallelepiped");
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode3D>("drag");
  const [activePreset, setActivePreset] = useState<string>("free");

  // 基础参数状态：存储分解系数 x, y, z 以及基底高度 cz
  const [params, setParams] = useState<Record<string, number>>({
    x: 1.0,
    y: 1.0,
    z: 1.0,
    cz: 2.0,
  });

  // 图层与标注显示控制状态
  const [showBasisVectors, setShowBasisVectors] = useState(true);
  const [showDecompPath, setShowDecompPath] = useState(true);
  const [showBoxSkeleton, setShowBoxSkeleton] = useState(true);
  const [showResultVector, setShowResultVector] = useState(true);
  const [showTriangleABC, setShowTriangleABC] = useState(true);
  const [showPlaneExt, setShowPlaneExt] = useState(true);
  const [showPerpDistance, setShowPerpDistance] = useState(true);
  const [showCentroid, setShowCentroid] = useState(true);

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const { x, y, z, cz = 2.0 } = params;

  // 定制基底向量 a, b, c (一般斜六面体基底，支持 cz 高度调节)
  const O: Vec3 = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);
  const vecA: Vec3 = useMemo(() => ({ x: 2, y: 0, z: 0 }), []);
  const vecB: Vec3 = useMemo(() => ({ x: 0.6, y: 2, z: 0 }), []);
  const vecC: Vec3 = useMemo(() => ({ x: 0, y: 0.5, z: cz }), [cz]);

  // 基底端点 A, B, C
  const pointA = vecA;
  const pointB = vecB;
  const pointC = vecC;

  // 计算平行六面体的 8 个顶点 (动态由 x, y, z 生成)
  const box = useMemo(
    () => calculateParallelepipedVertices(vecA, vecB, vecC, x, y, z),
    [vecA, vecB, vecC, x, y, z],
  );

  const P = box.P;

  // 四点共面情况判定
  const coplanarInfo = useMemo(
    () => checkCoplanarCondition(x, y, z),
    [x, y, z],
  );

  // 计算点 P 到平面 ABC 的投影与距离
  const projABC = useMemo(
    () => projectPointOnPlaneABC(P, pointA, pointB, pointC),
    [P, pointA, pointB, pointC],
  );

  // 拖拽动点 P 时的空间约束 (自由空间 3D 动点)
  const constrainP = useCallback((raw: Vec3): Vec3 => raw, []);

  // 右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-vector3d-basis", params, {
        mode: activeMode,
        vecA,
        vecB,
        vecC,
      }),
    [params, activeMode, vecA, vecB, vecC],
  );

  // 1. 基底系数 (x, y, z, cz) 自由滑块调节回调
  const handleCoeffParamChange = (key: string, value: number) => {
    setActivePreset("free");
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // 2. 3D 鼠标直接拖拽空间动点 P 回调：顺向求出空间点 P，克拉默法则自动解出 (x, y, z)
  const handlePointPDrag = useCallback(
    (nextP: Vec3) => {
      setActivePreset("free");
      const res = solveBasisCoefficients(vecA, vecB, vecC, nextP);
      if (res.isValid) {
        setParams((prev) => ({
          ...prev,
          x: Number(res.x.toFixed(2)),
          y: Number(res.y.toFixed(2)),
          z: Number(res.z.toFixed(2)),
        }));
      }
    },
    [vecA, vecB, vecC],
  );

  // 重置参数
  const handleReset = () => {
    setActivePreset("free");
    if (activeMode === "parallelepiped") {
      setParams({
        x: 1.0,
        y: 1.0,
        z: 1.0,
        cz: 2.0,
      });
    } else {
      setParams({
        x: 0.33,
        y: 0.33,
        z: 0.34,
        cz: 2.0,
      });
    }
  };

  // 快捷预设设置（高考经典典型算例，首项必须为 free 自由探究）
  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    switch (presetKey) {
      case "free":
        break;

      // 模式一：空间向量基本定理（平行六面体分解）
      case "para_diag":
        setParams((p) => ({ ...p, x: 1.0, y: 1.0, z: 1.0, cz: 2.0 }));
        break;
      case "para_center":
        setParams((p) => ({ ...p, x: 0.5, y: 0.5, z: 0.5, cz: 2.0 }));
        break;
      case "para_degen":
        setParams((p) => ({ ...p, cz: 0.0 }));
        break;

      // 模式二：共面向量定理与四点共面
      case "cop_centroid":
        setParams((p) => ({ ...p, x: 0.33, y: 0.33, z: 0.34, cz: 2.0 }));
        break;
      case "cop_inside":
        setParams((p) => ({ ...p, x: 0.5, y: 0.3, z: 0.2, cz: 2.0 }));
        break;
      case "cop_tetra_inside":
        setParams((p) => ({ ...p, x: 0.2, y: 0.3, z: 0.2, cz: 2.0 }));
        break;
    }
  };

  // 当前模式专属的 2×2 对称预设项列表（4 项：首项自由探究 + 3 项典型预设）
  const currentModePresets = useMemo(() => {
    switch (activeMode) {
      case "parallelepiped":
        return [
          {
            key: "free",
            label: "自由探究",
            description: "全参数开放",
          },
          {
            key: "para_diag",
            label: "体对角线顶点",
            description: "x=y=z=1",
          },
          {
            key: "para_center",
            label: "六面体体心",
            description: "x=y=z=0.5",
          },
          {
            key: "para_degen",
            label: "基底共面退化",
            description: "cz=0 失效",
          },
        ];
      case "coplanar":
        return [
          {
            key: "free",
            label: "自由探究",
            description: "全参数开放",
          },
          {
            key: "cop_centroid",
            label: "△ABC 重心 G",
            description: "各系数 1/3",
          },
          {
            key: "cop_inside",
            label: "截面三角形内",
            description: "x+y+z=1 内部",
          },
          {
            key: "cop_tetra_inside",
            label: "四面体实体内",
            description: "和<1 内部",
          },
        ];
    }
  }, [activeMode]);

  // 声明式参数配置按模式及预设动态裁剪
  const currentParamConfigs = useMemo<ParamConfig[]>(() => {
    let allowedKeys: string[] = ["x", "y", "z", "cz"];
    if (activeMode === "coplanar") {
      allowedKeys = ["x", "y", "z"];
    }

    // 针对特定固定特征预设进行动态裁剪展示
    if (activePreset === "para_diag") {
      allowedKeys = ["cz"];
    } else if (activePreset === "para_center") {
      allowedKeys = ["cz"];
    } else if (activePreset === "para_degen") {
      allowedKeys = ["x", "y", "z", "cz"];
    } else if (activePreset === "cop_centroid") {
      allowedKeys = ["x", "y", "z"];
    }

    return vector3dBasisMeta
      .filter((meta) => allowedKeys.includes(meta.key))
      .map((meta) => ({
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
        marks: meta.marks,
      }));
  }, [activeMode, activePreset, params]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Step 1: 探究模式 (高中数学两大核心主题) */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              items={[
                {
                  key: "parallelepiped",
                  label: "空间向量基本定理",
                  formula: "\\vec{p}=x\\vec{a}+y\\vec{b}+z\\vec{c}",
                },
                {
                  key: "coplanar",
                  label: "共面向量与四点共面",
                  formula: "x + y + z = 1",
                },
              ]}
              value={activeMode}
              onChange={(m) => {
                const mode = m as TeachingMode;
                setActiveMode(mode);
                setActivePreset("free");
                if (mode === "parallelepiped") {
                  setParams((p) => ({ ...p, x: 1.0, y: 1.0, z: 1.0, cz: 2.0 }));
                } else {
                  setParams((p) => ({
                    ...p,
                    x: 0.33,
                    y: 0.33,
                    z: 0.34,
                    cz: 2.0,
                  }));
                }
              }}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 2: 典型模型预设 (2×2 黄金网格，首项自由探究) */}
          <LeftPanelSection title="典型模型预设">
            <SelectGrid
              items={currentModePresets}
              value={activePreset}
              onChange={handlePresetSelect}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 3: 参数调节 (根据模式与预设动态裁剪) */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={currentParamConfigs}
              onParamChange={handleCoeffParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* Step 4: 图层与标注显示控制 (单列全宽 Toggle 开关) */}
          <LeftPanelSection title="图层与标注显示控制" compact>
            <div className="space-y-2.5">
              {activeMode === "parallelepiped" ? (
                <>
                  <Toggle
                    label="基底三向量 (a, b, c)"
                    checked={showBasisVectors}
                    onChange={setShowBasisVectors}
                  />
                  <Toggle
                    label="三步分量折线 (xa, yb, zc)"
                    checked={showDecompPath}
                    onChange={setShowDecompPath}
                  />
                  <Toggle
                    label="平行六面体透视包络框"
                    checked={showBoxSkeleton}
                    onChange={setShowBoxSkeleton}
                  />
                  <Toggle
                    label="合成向量 OP 与动点 P"
                    checked={showResultVector}
                    onChange={setShowResultVector}
                  />
                </>
              ) : (
                <>
                  <Toggle
                    label="基底端点与向量 (OA, OB, OC)"
                    checked={showBasisVectors}
                    onChange={setShowBasisVectors}
                  />
                  <Toggle
                    label="△ABC 核心截面"
                    checked={showTriangleABC}
                    onChange={setShowTriangleABC}
                  />
                  <Toggle
                    label="平面 (ABC) 延展网格"
                    checked={showPlaneExt}
                    onChange={setShowPlaneExt}
                  />
                  <Toggle
                    label="空间垂线段 PH 与垂足 H"
                    checked={showPerpDistance}
                    onChange={setShowPerpDistance}
                  />
                  <Toggle
                    label="重心 G 特征标记"
                    checked={showCentroid}
                    onChange={setShowCentroid}
                  />
                </>
              )}
            </div>
          </LeftPanelSection>

          {/* Step 5: 3D 空间视角预设 */}
          <LeftPanelSection title="3D 空间视角预设">
            <TabSwitcher
              layout="horizontal"
              tabs={[
                { key: "iso", label: "轴测直观" },
                { key: "front", label: "主视正投" },
                { key: "top", label: "俯视底面" },
                { key: "side", label: "左视侧面" },
              ]}
              value={preset}
              onChange={(p) => setCameraPreset(p as CameraPreset)}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          overlay={
            <ModeSwitchOverlay3D
              mode={interactionMode}
              onModeChange={setInteractionMode}
              pointCount={1}
            />
          }
          legend={
            <Legend3D
              title="空间向量图例"
              items={[
                {
                  colorKey: "paramPrimary",
                  swatch: "line",
                  label: "基向量 a",
                },
                {
                  colorKey: "paramSecondary",
                  swatch: "line",
                  label: "基向量 b",
                },
                {
                  colorKey: "paramTertiary",
                  swatch: "line",
                  label: "基向量 c",
                },
                {
                  colorKey: "highlight",
                  swatch: "line",
                  label: "合成向量 OP",
                },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} enabled={interactionMode === "orbit"} />

          {/* 原点 O */}
          <Point3D position={O} colorKey="primary" />
          <PointLabel3D position={O} text="O" offset={[-0.15, -0.15, 0]} />

          {/* ========================================================
              模式一：空间向量基本定理（平行六面体分解）
              严格遵循人教 A 版《空间向量基本定理》标准图解：
              标注基向量 a, b, c、三步分量折线 xa, yb, zc 与终点 P、合成向量 OP
             ======================================================== */}
          {activeMode === "parallelepiped" && (
            <>
              {/* 基向量 a, b, c */}
              {showBasisVectors && (
                <>
                  <Vector3DArrow from={O} to={vecA} colorKey="paramPrimary" />
                  <FormulaLabel3D
                    position={{ x: vecA.x * 0.5, y: -0.28, z: 0 }}
                    tex="\\vec{a}"
                  />

                  <Vector3DArrow from={O} to={vecB} colorKey="paramSecondary" />
                  <FormulaLabel3D
                    position={{
                      x: vecB.x * 0.5 - 0.28,
                      y: vecB.y * 0.5 + 0.15,
                      z: 0,
                    }}
                    tex="\\vec{b}"
                  />

                  <Vector3DArrow from={O} to={vecC} colorKey="paramTertiary" />
                  <FormulaLabel3D
                    position={{
                      x: -0.28,
                      y: pointC.y * 0.5,
                      z: pointC.z * 0.5 + 0.18,
                    }}
                    tex="\\vec{c}"
                  />
                </>
              )}

              {/* 1. 分步加法路径链（当分量绝对值 >= 0.05 且开关开启时渲染） */}
              {showDecompPath && (
                <>
                  {Math.abs(x) >= 0.05 && (
                    <>
                      <Vector3DArrow
                        from={O}
                        to={box.xa}
                        colorKey="paramPrimary"
                      />
                      <FormulaLabel3D
                        position={{
                          x: box.xa.x * 0.5,
                          y: box.xa.y * 0.5 + 0.25,
                          z: 0,
                        }}
                        tex={`\\color{${MATH_COLORS.paramPrimary}}{${x.toFixed(1)}\\vec{a}}`}
                      />
                    </>
                  )}

                  {Math.abs(y) >= 0.05 && (
                    <>
                      <Vector3DArrow
                        from={box.xa}
                        to={box.xy}
                        colorKey="paramSecondary"
                      />
                      <FormulaLabel3D
                        position={{
                          x: (box.xa.x + box.xy.x) * 0.5 + 0.25,
                          y: (box.xa.y + box.xy.y) * 0.5,
                          z: 0,
                        }}
                        tex={`\\color{${MATH_COLORS.paramSecondary}}{${y.toFixed(1)}\\vec{b}}`}
                      />
                    </>
                  )}

                  {Math.abs(z) >= 0.05 && (
                    <>
                      <Vector3DArrow
                        from={box.xy}
                        to={box.P}
                        colorKey="paramTertiary"
                      />
                      <FormulaLabel3D
                        position={{
                          x: (box.xy.x + box.P.x) * 0.5 + 0.25,
                          y: (box.xy.y + box.P.y) * 0.5,
                          z: (box.xy.z + box.P.z) * 0.5,
                        }}
                        tex={`\\color{${MATH_COLORS.paramTertiary}}{${z.toFixed(1)}\\vec{c}}`}
                      />
                    </>
                  )}
                </>
              )}

              {/* 平行六面体透视骨架与半透明底面 */}
              {showBoxSkeleton && (
                <>
                  <TriangleMesh
                    A={O}
                    B={box.xa}
                    C={box.xy}
                    color={
                      cz < 0.1 ? MATH_COLORS.degeneracy : MATH_COLORS.primary
                    }
                    opacity={0.06}
                  />
                  <TriangleMesh
                    A={O}
                    B={box.xy}
                    C={box.yb}
                    color={
                      cz < 0.1 ? MATH_COLORS.degeneracy : MATH_COLORS.primary
                    }
                    opacity={0.06}
                  />

                  {/* 复用公共 Segment3D 组件 */}
                  <Segment3D
                    from={O}
                    to={box.yb}
                    colorKey="asymptote"
                    dashed
                    opacity={0.6}
                  />
                  <Segment3D
                    from={box.yb}
                    to={box.xy}
                    colorKey="asymptote"
                    dashed
                    opacity={0.6}
                  />
                  <Segment3D
                    from={O}
                    to={box.zc}
                    colorKey="asymptote"
                    dashed
                    opacity={0.6}
                  />
                  <Segment3D
                    from={box.xa}
                    to={box.xz}
                    colorKey="asymptote"
                    dashed
                    opacity={0.6}
                  />
                  <Segment3D
                    from={box.yb}
                    to={box.yz}
                    colorKey="asymptote"
                    dashed
                    opacity={0.6}
                  />
                  <Segment3D
                    from={box.zc}
                    to={box.xz}
                    colorKey="asymptote"
                    dashed
                    opacity={0.6}
                  />
                  <Segment3D
                    from={box.zc}
                    to={box.yz}
                    colorKey="asymptote"
                    dashed
                    opacity={0.6}
                  />
                  <Segment3D
                    from={box.xz}
                    to={box.P}
                    colorKey="asymptote"
                    dashed
                    opacity={0.6}
                  />
                  <Segment3D
                    from={box.yz}
                    to={box.P}
                    colorKey="asymptote"
                    dashed
                    opacity={0.6}
                  />
                </>
              )}
            </>
          )}

          {/* ========================================================
              模式二：共面向量定理与四点共面模式 (coplanar)
              核心呈现：基向量 OA, OB, OC，截面 △ABC 及其延展平面，垂足 H（不共面时）与重心 G
             ======================================================== */}
          {activeMode === "coplanar" && (
            <>
              {/* 基底三向量 OA, OB, OC */}
              {showBasisVectors && (
                <>
                  <Vector3DArrow from={O} to={vecA} colorKey="paramPrimary" />
                  <FormulaLabel3D
                    position={{ x: vecA.x * 0.5, y: -0.28, z: 0 }}
                    tex="\\vec{a}"
                  />
                  <Point3D position={pointA} colorKey="paramPrimary" />
                  <PointLabel3D
                    position={pointA}
                    text="A"
                    offset={[0.15, -0.15, 0]}
                  />

                  <Vector3DArrow from={O} to={vecB} colorKey="paramSecondary" />
                  <FormulaLabel3D
                    position={{
                      x: vecB.x * 0.5 - 0.28,
                      y: vecB.y * 0.5 + 0.15,
                      z: 0,
                    }}
                    tex="\\vec{b}"
                  />
                  <Point3D position={pointB} colorKey="paramSecondary" />
                  <PointLabel3D
                    position={pointB}
                    text="B"
                    offset={[-0.15, 0.15, 0]}
                  />

                  <Vector3DArrow from={O} to={vecC} colorKey="paramTertiary" />
                  <FormulaLabel3D
                    position={{
                      x: -0.28,
                      y: pointC.y * 0.5,
                      z: pointC.z * 0.5 + 0.18,
                    }}
                    tex="\\vec{c}"
                  />
                  <Point3D position={pointC} colorKey="paramTertiary" />
                  <PointLabel3D
                    position={pointC}
                    text="C"
                    offset={[0, 0.08, 0.18]}
                  />
                </>
              )}

              {/* 1. 平面 ABC 动态自适应延展参考面 */}
              {showPlaneExt &&
                (() => {
                  const H = projABC.projectedPoint;
                  const AB = {
                    x: pointB.x - pointA.x,
                    y: pointB.y - pointA.y,
                    z: pointB.z - pointA.z,
                  };
                  const AC = {
                    x: pointC.x - pointA.x,
                    y: pointC.y - pointA.y,
                    z: pointC.z - pointA.z,
                  };
                  const w = {
                    x: H.x - pointA.x,
                    y: H.y - pointA.y,
                    z: H.z - pointA.z,
                  };

                  // 投影解算仿射坐标 u, v
                  const d1 = AB.x * AB.x + AB.y * AB.y + AB.z * AB.z;
                  const d2 = AC.x * AC.x + AC.y * AC.y + AC.z * AC.z;
                  const d12 = AB.x * AC.x + AB.y * AC.y + AB.z * AC.z;
                  const det = d1 * d2 - d12 * d12;
                  let uH = 0.33;
                  let vH = 0.33;
                  if (det > 1e-6) {
                    const w1 = w.x * AB.x + w.y * AB.y + w.z * AB.z;
                    const w2 = w.x * AC.x + w.y * AC.y + w.z * AC.z;
                    uH = (w1 * d2 - w2 * d12) / det;
                    vH = (w2 * d1 - w1 * d12) / det;
                  }

                  const uMin = Math.min(-0.35, uH - 0.35);
                  const uMax = Math.max(1.35, uH + 0.35);
                  const vMin = Math.min(-0.35, vH - 0.35);
                  const vMax = Math.max(1.35, vH + 0.35);

                  const q00 = {
                    x: pointA.x + uMin * AB.x + vMin * AC.x,
                    y: pointA.y + uMin * AB.y + vMin * AC.y,
                    z: pointA.z + uMin * AB.z + vMin * AC.z,
                  };
                  const q10 = {
                    x: pointA.x + uMax * AB.x + vMin * AC.x,
                    y: pointA.y + uMax * AB.y + vMin * AC.y,
                    z: pointA.z + uMin * AB.z + vMin * AC.z,
                  };
                  const q11 = {
                    x: pointA.x + uMax * AB.x + vMax * AC.x,
                    y: pointA.y + uMax * AB.y + vMax * AC.y,
                    z: pointA.z + uMax * AB.z + vMax * AC.z,
                  };
                  const q01 = {
                    x: pointA.x + uMin * AB.x + vMax * AC.x,
                    y: pointA.y + uMin * AB.y + vMax * AC.y,
                    z: pointA.z + uMin * AB.z + vMax * AC.z,
                  };

                  return (
                    <>
                      <TriangleMesh
                        A={q00}
                        B={q10}
                        C={q11}
                        color={MATH_COLORS.secondary}
                        opacity={0.06}
                        renderOrder={1}
                        depthWrite={false}
                      />
                      <TriangleMesh
                        A={q00}
                        B={q11}
                        C={q01}
                        color={MATH_COLORS.secondary}
                        opacity={0.06}
                        renderOrder={1}
                        depthWrite={false}
                      />
                      <Segment3D
                        from={q00}
                        to={q10}
                        colorKey="asymptote"
                        dashed
                        opacity={0.4}
                        lineWidth={1.2}
                      />
                      <Segment3D
                        from={q10}
                        to={q11}
                        colorKey="asymptote"
                        dashed
                        opacity={0.4}
                        lineWidth={1.2}
                      />
                      <Segment3D
                        from={q11}
                        to={q01}
                        colorKey="asymptote"
                        dashed
                        opacity={0.4}
                        lineWidth={1.2}
                      />
                      <Segment3D
                        from={q01}
                        to={q00}
                        colorKey="asymptote"
                        dashed
                        opacity={0.4}
                        lineWidth={1.2}
                      />
                    </>
                  );
                })()}

              {/* 2. △ABC 截面核心三角形 */}
              {showTriangleABC && (
                <>
                  <TriangleMesh
                    A={pointA}
                    B={pointB}
                    C={pointC}
                    color={
                      coplanarInfo.isCoplanar
                        ? MATH_COLORS.paramTertiary
                        : MATH_COLORS.primary
                    }
                    opacity={coplanarInfo.isCoplanar ? 0.35 : 0.18}
                    renderOrder={2}
                    polygonOffset={true}
                    polygonOffsetFactor={-2}
                  />

                  {/* △ABC 截面三条边界实线 */}
                  <Segment3D
                    from={pointA}
                    to={pointB}
                    dashed={false}
                    colorKey={
                      coplanarInfo.isCoplanar
                        ? "paramTertiary"
                        : "vectorProjection"
                    }
                    lineWidth={2.4}
                  />
                  <Segment3D
                    from={pointB}
                    to={pointC}
                    dashed={false}
                    colorKey={
                      coplanarInfo.isCoplanar
                        ? "paramTertiary"
                        : "vectorProjection"
                    }
                    lineWidth={2.4}
                  />
                  <Segment3D
                    from={pointC}
                    to={pointA}
                    dashed={false}
                    colorKey={
                      coplanarInfo.isCoplanar
                        ? "paramTertiary"
                        : "vectorProjection"
                    }
                    lineWidth={2.4}
                  />
                </>
              )}

              {/* 3. 当不共面时，展示从点 P 到平面 ABC 的垂线段与垂足 H */}
              {showPerpDistance &&
                !coplanarInfo.isCoplanar &&
                projABC.distance > 0.05 && (
                  <>
                    <Segment3D
                      from={P}
                      to={projABC.projectedPoint}
                      colorKey="degeneracy"
                      dashed
                      lineWidth={2}
                      opacity={0.9}
                    />
                    <Point3D
                      position={projABC.projectedPoint}
                      colorKey="secondary"
                    />
                    <PointLabel3D
                      position={projABC.projectedPoint}
                      text="H"
                      offset={[0.12, 0.12, 0.06]}
                    />
                  </>
                )}

              {/* 4. 重心 G (当点 P 重合在重心或开启展示时) */}
              {showCentroid && coplanarInfo.isCentroid && (
                <>
                  <Point3D
                    position={{
                      x: (pointA.x + pointB.x + pointC.x) / 3,
                      y: (pointA.y + pointB.y + pointC.y) / 3,
                      z: (pointA.z + pointB.z + pointC.z) / 3,
                    }}
                    colorKey="highlight"
                  />
                  <PointLabel3D
                    position={{
                      x: (pointA.x + pointB.x + pointC.x) / 3,
                      y: (pointA.y + pointB.y + pointC.y) / 3,
                      z: (pointA.z + pointB.z + pointC.z) / 3,
                    }}
                    text="G"
                    offset={[0.12, 0.12, 0.12]}
                  />
                </>
              )}

              {/* 5. 四面体实体内部展示：轻量侧面半透明线框 */}
              {coplanarInfo.isInsideTetrahedron && (
                <>
                  <TriangleMesh
                    A={O}
                    B={pointA}
                    C={pointB}
                    color={MATH_COLORS.primary}
                    opacity={0.05}
                  />
                  <TriangleMesh
                    A={O}
                    B={pointB}
                    C={pointC}
                    color={MATH_COLORS.primary}
                    opacity={0.05}
                  />
                  <TriangleMesh
                    A={O}
                    B={pointC}
                    C={pointA}
                    color={MATH_COLORS.primary}
                    opacity={0.05}
                  />
                </>
              )}

              {/* 6. 当四点共面时，在平面 ABC 内高亮向量 AP */}
              {coplanarInfo.isCoplanar && (
                <>
                  <Vector3DArrow from={pointA} to={P} colorKey="secondary" />
                  <FormulaLabel3D
                    position={{
                      x: (pointA.x + P.x) * 0.5 + 0.15,
                      y: (pointA.y + P.y) * 0.5,
                      z: (pointA.z + P.z) * 0.5 + 0.15,
                    }}
                    tex="\\overrightarrow{AP}"
                  />
                </>
              )}
            </>
          )}

          {/* 通用合成向量 OP 与动点 P */}
          {showResultVector && (
            <>
              <Vector3DArrow from={O} to={P} colorKey="highlight" />
              <Point3D
                position={P}
                colorKey="highlight"
                draggable={interactionMode === "drag"}
                constrain={constrainP}
                onDrag={handlePointPDrag}
              />
              <PointLabel3D position={P} text="P" offset={[0, 0, 0.18]} />
              <FormulaLabel3D
                position={{ x: P.x * 0.5, y: P.y * 0.5, z: P.z * 0.5 + 0.22 }}
                tex="\\overrightarrow{OP}"
              />
            </>
          )}
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title="空间向量分解与共面看板"
        />
      }
    />
  );
}
