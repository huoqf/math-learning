import { useState, useMemo, useCallback } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  SelectGrid,
  Toggle,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Vector3DArrow,
  Point3D,
  PointLabel3D,
  FormulaLabel3D,
  Legend3D,
  CameraRig,
  ModeSwitchOverlay3D,
  type InteractionMode3D,
  type LegendItem,
} from "@/components/Math3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import type { Vec3 } from "@/math3d/vector3";
import {
  calculateParallelepipedVertices,
  checkCoplanarCondition,
  projectPointOnPlaneABC,
  solveBasisCoefficients,
} from "@/math3d/basis";
import { ParallelepipedModeScene } from "./modes/ParallelepipedModeScene";
import { CoplanarModeScene } from "./modes/CoplanarModeScene";
import { CoordDotProductModeScene } from "./modes/CoordDotProductModeScene";
import {
  vector3dBasisMeta,
  vector3dOperationsMeta,
} from "@/data/registries/vector3d";
import { calculateVectorOperations } from "@/math3d/vectorOperations";

type TeachingMode = "parallelepiped" | "coplanar" | "coordDotProduct";

export default function Vector3DBasisAnimation() {
  const [activeMode, setActiveMode] = useState<TeachingMode>("parallelepiped");
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode3D>("drag");
  const [activePreset, setActivePreset] = useState<string>("free");

  // 基础参数状态：存储分解系数 x, y, z 以及基底高度 cz，以及向量 a, b 的空间坐标
  const [params, setParams] = useState<Record<string, number>>({
    x: 1.0,
    y: 1.0,
    z: 1.0,
    cz: 2.0,
    ax: 2.0,
    ay: 1.0,
    az: 0.0,
    bx: 1.0,
    by: 2.0,
    bz: 2.0,
  });

  // 图层与标注显示控制状态
  const [showBasisVectors, setShowBasisVectors] = useState(true);
  const [showDecompPath, setShowDecompPath] = useState(true);
  const [showBoxSkeleton] = useState(true);
  const [showResultVector] = useState(true);
  const [showTriangleABC, setShowTriangleABC] = useState(true);
  const [showPlaneExt] = useState(true);
  const [showPerpDistance] = useState(true);
  const [showCentroid, setShowCentroid] = useState(true);

  // 坐标运算模式专属图层开关
  const [showSum] = useState(true);
  const [showDiff] = useState(true);
  const [showProjection, setShowProjection] = useState(true);
  const [showAngle] = useState(true);
  const [showAxes, setShowAxes] = useState(true);

  const { cameraPosition, controlsRef } = use3DViewport("iso");

  const {
    x,
    y,
    z,
    cz = 2.0,
    ax = 2.0,
    ay = 1.0,
    az = 0.0,
    bx = 1.0,
    by = 2.0,
    bz = 2.0,
  } = params;

  // 定制基底向量 a, b, c
  const O: Vec3 = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);
  const vecA: Vec3 = useMemo(() => ({ x: 2, y: 0, z: 0 }), []);
  const vecB: Vec3 = useMemo(() => ({ x: 0.6, y: 2, z: 0 }), []);
  const vecC: Vec3 = useMemo(() => ({ x: 0, y: 0.5, z: cz }), [cz]);

  // 坐标运算模式的动向量 a 与 b
  const coordVecA: Vec3 = useMemo(
    () => ({ x: ax, y: ay, z: az }),
    [ax, ay, az],
  );
  const coordVecB: Vec3 = useMemo(
    () => ({ x: bx, y: by, z: bz }),
    [bx, by, bz],
  );
  const operationsResult = useMemo(
    () => calculateVectorOperations(coordVecA, coordVecB),
    [coordVecA, coordVecB],
  );

  const box = useMemo(
    () => calculateParallelepipedVertices(vecA, vecB, vecC, x, y, z),
    [vecA, vecB, vecC, x, y, z],
  );

  const P = box.P;

  const coplanarInfo = useMemo(
    () => checkCoplanarCondition(x, y, z),
    [x, y, z],
  );

  const projABC = useMemo(
    () => projectPointOnPlaneABC(P, vecA, vecB, vecC),
    [P, vecA, vecB, vecC],
  );

  const constrainP = useCallback((raw: Vec3): Vec3 => raw, []);

  const handleDragA = useCallback((next: Vec3) => {
    setActivePreset("free");
    setParams((p) => ({
      ...p,
      ax: Number(next.x.toFixed(1)),
      ay: Number(next.y.toFixed(1)),
      az: Number(next.z.toFixed(1)),
    }));
  }, []);

  const handleDragB = useCallback((next: Vec3) => {
    setActivePreset("free");
    setParams((p) => ({
      ...p,
      bx: Number(next.x.toFixed(1)),
      by: Number(next.y.toFixed(1)),
      bz: Number(next.z.toFixed(1)),
    }));
  }, []);

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-vector3d-basis", params, {
        mode: activeMode,
        vecA: activeMode === "coordDotProduct" ? coordVecA : vecA,
        vecB: activeMode === "coordDotProduct" ? coordVecB : vecB,
        vecC,
      }),
    [params, activeMode, vecA, vecB, vecC, coordVecA, coordVecB],
  );

  const handleCoeffParamChange = useCallback((key: string, val: number) => {
    setActivePreset("free");
    setParams((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handlePPointDrag = useCallback(
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

  const handleReset = () => {
    setActivePreset("free");
    if (activeMode === "parallelepiped") {
      setParams((p) => ({ ...p, x: 1.0, y: 1.0, z: 1.0, cz: 2.0 }));
    } else if (activeMode === "coplanar") {
      setParams((p) => ({ ...p, x: 0.33, y: 0.33, z: 0.34, cz: 2.0 }));
    } else {
      setParams((p) => ({
        ...p,
        ax: 2.0,
        ay: 1.0,
        az: 0.0,
        bx: 1.0,
        by: 2.0,
        bz: 2.0,
      }));
    }
  };

  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    const configs: Record<string, any> = {
      para_diag: { x: 1.0, y: 1.0, z: 1.0, cz: 2.0 },
      para_center: { x: 0.5, y: 0.5, z: 0.5, cz: 2.0 },
      para_degen: { cz: 0.0 },
      cop_centroid: { x: 0.33, y: 0.33, z: 0.34, cz: 2.0 },
      dot_perp: { ax: 2.0, ay: 1.0, az: 0.0, bx: 1.0, by: -2.0, bz: 2.0 },
    };
    if (configs[presetKey]) setParams((p) => ({ ...p, ...configs[presetKey] }));
  };

  const currentModePresets = useMemo(() => {
    if (activeMode === "parallelepiped")
      return [
        { key: "free", label: "自由探索" },
        { key: "para_diag", label: "体对角线" },
        { key: "para_center", label: "六面体中心" },
        { key: "para_degen", label: "基底共面" },
      ];
    if (activeMode === "coplanar")
      return [
        { key: "free", label: "自由探索" },
        { key: "cop_centroid", label: "截面重心" },
      ];
    return [
      { key: "free", label: "自由探索" },
      { key: "dot_perp", label: "垂直正交" },
    ];
  }, [activeMode]);

  const currentParamConfigs = useMemo<ParamConfig[]>(() => {
    if (activeMode === "coordDotProduct") {
      if (activePreset !== "free") return [];
      return vector3dOperationsMeta.map((meta) => ({
        ...meta,
        value: params[meta.key] ?? meta.defaultValue ?? 0,
      }));
    }
    if (activePreset !== "free" && activePreset !== "para_degen") return [];
    const allowed =
      activePreset === "para_degen" ? ["cz"] : ["x", "y", "z", "cz"];
    return vector3dBasisMeta
      .filter((m) => allowed.includes(m.key))
      .map((m) => ({ ...m, value: params[m.key] ?? m.defaultValue ?? 0 }));
  }, [activeMode, activePreset, params]);

  const tipConfig = useMemo(() => {
    if (activeMode === "parallelepiped")
      return {
        variant: "primary" as const,
        badge: "选择性必修一 · 空间向量基本定理",
        condition: "不共面的基底 {a⃗, b⃗, c⃗}，p⃗ = x a⃗ + y b⃗ + z c⃗。",
        question: "探究存在唯一实数组 (x, y, z) 实现平行六面体分解。",
      };
    if (activeMode === "coplanar")
      return {
        variant: "success" as const,
        badge: "选择性必修一 · 共面向量定理",
        condition: "P 满足 OP⃗ = x OA⃗ + y OB⃗ + z OC⃗。",
        question: "证明共面充要条件 x + y + z = 1。",
      };
    return {
      variant: "info" as const,
      badge: "选择性必修一 · 坐标与数量积",
      condition: "空间直角坐标系已知向量 a⃗ 与 b⃗。",
      question: "探究数量积 a⃗·b⃗ = x₁x₂ + y₁y₂ + z₁z₂。",
    };
  }, [activeMode]);

  const legendItems: LegendItem[] = useMemo(() => {
    if (activeMode === "coordDotProduct")
      return [
        {
          colorKey: "paramPrimary" as const,
          swatch: "line" as const,
          label: "向量 a⃗",
        },
        {
          colorKey: "paramSecondary" as const,
          swatch: "line" as const,
          label: "向量 b⃗",
        },
        {
          colorKey: "highlight" as const,
          swatch: "line" as const,
          label: "和向量",
        },
      ];
    return [
      {
        colorKey: "paramPrimary" as const,
        swatch: "line" as const,
        label: "基向量 a",
      },
      {
        colorKey: "paramSecondary" as const,
        swatch: "line" as const,
        label: "基向量 b",
      },
      {
        colorKey: "paramTertiary" as const,
        swatch: "line" as const,
        label: "基向量 c",
      },
      {
        colorKey: "highlight" as const,
        swatch: "line" as const,
        label: "合成向量",
      },
    ];
  }, [activeMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="探究模式">
            <SelectGrid
              items={[
                { key: "parallelepiped", label: "基本定理", formula: "x,y,z" },
                { key: "coplanar", label: "四点共面", formula: "x+y+z=1" },
                { key: "coordDotProduct", label: "坐标运算", formula: "a·b" },
              ]}
              value={activeMode}
              onChange={(m) => {
                setActiveMode(m as TeachingMode);
                setActivePreset("free");
              }}
              columns={3}
            />
          </LeftPanelSection>
          <LeftPanelSection title="典型模型预设">
            <SelectGrid
              items={currentModePresets}
              value={activePreset}
              onChange={handlePresetSelect}
              columns={2}
            />
          </LeftPanelSection>
          <LeftPanelSection title="参数调节">
            {currentParamConfigs.length > 0 ? (
              <ParamControl
                params={currentParamConfigs}
                onParamChange={handleCoeffParamChange}
                onReset={handleReset}
              />
            ) : (
              <div className="text-xs p-3 text-neutral-600">题设锁定中</div>
            )}
          </LeftPanelSection>
          <LeftPanelSection title="图层与标注显示控制" compact>
            <div className="space-y-2.5">
              {activeMode === "parallelepiped" && (
                <>
                  <Toggle
                    label="基底"
                    checked={showBasisVectors}
                    onChange={setShowBasisVectors}
                  />
                  <Toggle
                    label="折线"
                    checked={showDecompPath}
                    onChange={setShowDecompPath}
                  />
                </>
              )}
              {activeMode === "coplanar" && (
                <>
                  <Toggle
                    label="△ABC"
                    checked={showTriangleABC}
                    onChange={setShowTriangleABC}
                  />
                  <Toggle
                    label="重心"
                    checked={showCentroid}
                    onChange={setShowCentroid}
                  />
                </>
              )}
              {activeMode === "coordDotProduct" && (
                <>
                  <Toggle
                    label="坐标系"
                    checked={showAxes}
                    onChange={setShowAxes}
                  />
                  <Toggle
                    label="投影"
                    checked={showProjection}
                    onChange={setShowProjection}
                  />
                </>
              )}
            </div>
          </LeftPanelSection>
          <LeftPanelSection title="教学导引" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="text-[11px]">{tipConfig.question}</div>
            </TipCard>
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
              pointCount={activeMode === "coordDotProduct" ? 2 : 1}
            />
          }
          legend={<Legend3D title="空间向量图例" items={legendItems} />}
        >
          <CameraRig ref={controlsRef} enabled={interactionMode === "orbit"} />

          {/* 原点 O */}
          <Point3D position={O} colorKey="primary" />
          <PointLabel3D position={O} text="O" offset={[-0.15, -0.15, 0]} />

          {/* ========================================================
              模式一：空间向量基本定理（平行六面体分解）
             ======================================================== */}
          {activeMode === "parallelepiped" && (
            <ParallelepipedModeScene
              O={O}
              vecA={vecA}
              vecB={vecB}
              vecC={vecC}
              box={box}
              x={x}
              y={y}
              z={z}
              cz={cz}
              showBasisVectors={showBasisVectors}
              showDecompPath={showDecompPath}
              showBoxSkeleton={showBoxSkeleton}
            />
          )}

          {/* ========================================================
              模式二：共面向量定理与四点共面模式 (coplanar)
             ======================================================== */}
          {activeMode === "coplanar" && (
            <CoplanarModeScene
              O={O}
              vecA={vecA}
              vecB={vecB}
              vecC={vecC}
              P={P}
              projABC={projABC}
              coplanarInfo={coplanarInfo}
              showBasisVectors={showBasisVectors}
              showPlaneExt={showPlaneExt}
              showTriangleABC={showTriangleABC}
              showPerpDistance={showPerpDistance}
              showCentroid={showCentroid}
            />
          )}

          {/* ========================================================
              模式三：空间向量坐标运算、数量积与正交投影 (coordDotProduct)
             ======================================================== */}
          {activeMode === "coordDotProduct" && (
            <CoordDotProductModeScene
              vecA={coordVecA}
              vecB={coordVecB}
              res={operationsResult}
              showSum={showSum}
              showDiff={showDiff}
              showProjection={showProjection}
              showAngle={showAngle}
              showAxes={showAxes}
              interactionMode={interactionMode}
              onDragA={handleDragA}
              onDragB={handleDragB}
            />
          )}

          {/* 通用合成向量 OP 与动点 P (模式一与模式二) */}
          {showResultVector && activeMode !== "coordDotProduct" && (
            <>
              <Vector3DArrow from={O} to={P} colorKey="highlight" />
              <Point3D
                position={P}
                colorKey="highlight"
                draggable={interactionMode === "drag"}
                constrain={constrainP}
                onDrag={handlePPointDrag}
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
