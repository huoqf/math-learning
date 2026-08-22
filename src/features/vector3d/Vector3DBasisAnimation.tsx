import { useState, useMemo, useCallback } from "react";
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
import {
  calculateParallelepipedVertices,
  checkCoplanarCondition,
  projectPointOnPlaneABC,
  solveBasisCoefficients,
} from "@/math3d/basis";
import { ParallelepipedModeScene } from "./modes/ParallelepipedModeScene";
import { CoplanarModeScene } from "./modes/CoplanarModeScene";

type TeachingMode = "parallelepiped" | "coplanar";

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

  // 基底端点 A, B, C
  const pointA = vecA;
  const pointB = vecB;
  const pointC = vecC;

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
