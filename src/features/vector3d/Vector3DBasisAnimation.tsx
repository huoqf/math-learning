import { useState, useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  Vector3DArrow,
  Point3D,
  PointLabel3D,
  FormulaLabel3D,
  Legend3D,
  CameraRig,
} from "@/components/Math3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { vector3dBasisMeta } from "@/data/registries/vector3d";
import type { Vec3 } from "@/math3d/vector3";
import { mathToThree } from "@/math3d/coordinateConvention";
import {
  calculateParallelepipedVertices,
  checkCoplanarCondition,
} from "@/math3d/basis";
import { MATH_COLORS } from "@/theme";

type TeachingMode = "parallelepiped" | "coplanar" | "degeneration";

interface Segment3DProps {
  from: Vec3;
  to: Vec3;
  color?: string;
  dashed?: boolean;
  lineWidth?: number;
  opacity?: number;
}

/** 3D 线段组件，用于绘制平行六面体包络框 */
function Segment3D({
  from,
  to,
  color = "#94A3B8",
  dashed = true,
  lineWidth = 1.5,
  opacity = 0.6,
}: Segment3DProps) {
  const p1 = mathToThree(from);
  const p2 = mathToThree(to);

  return (
    <Line
      points={[p1, p2]}
      color={color}
      dashed={dashed}
      dashScale={8}
      dashSize={0.2}
      gapSize={0.1}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
    />
  );
}

/** 3D 三角形填充面，用于四点共面模式展示 △ABC 截面 */
function TriangleMesh({
  A,
  B,
  C,
  color,
  opacity = 0.35,
}: {
  A: Vec3;
  B: Vec3;
  C: Vec3;
  color: string;
  opacity?: number;
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
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function Vector3DBasisAnimation() {
  const [activeMode, setActiveMode] = useState<TeachingMode>("parallelepiped");
  const [params, setParams] = useState<Record<string, number>>({
    x: 1.5,
    y: 1.2,
    z: 1.8,
    cz: 2.0,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const { x, y, z, cz = 2.0 } = params;

  // 定制基底向量 a, b, c
  const O: Vec3 = { x: 0, y: 0, z: 0 };
  const vecA: Vec3 = { x: 2, y: 0, z: 0 }; // 基底 a (沿 x 轴)
  const vecB: Vec3 = { x: 0.5, y: 2, z: 0 }; // 基底 b (xy 平面斜向)
  const vecC: Vec3 = { x: 0, y: 0.5, z: cz }; // 基底 c (垂直高度分量由 cz 决定)

  // 基底端点 A, B, C (当 x=1, y=1, z=1 时)
  const pointA = vecA;
  const pointB = vecB;
  const pointC = vecC;

  // 计算平行六面体的 8 个顶点
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

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ x: 1.5, y: 1.2, z: 1.8, cz: 2.0 });
  };

  // 根据当前模式过滤左屏显示的参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<TeachingMode, string[]> = {
      parallelepiped: ["x", "y", "z"],
      coplanar: ["x", "y", "z"],
      degeneration: ["x", "y", "z", "cz"],
    };
    const allowedKeys = keysByMode[activeMode] ?? ["x", "y", "z"];

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
        importance: meta.importance as any,
        marks: meta.marks,
      }));
  }, [params, activeMode]);

  // 快捷预设设置
  const handlePresetSelect = (presetKey: string) => {
    switch (presetKey) {
      case "std":
        setParams({ x: 1.5, y: 1.2, z: 1.8, cz: 2.0 });
        setActiveMode("parallelepiped");
        break;
      case "centroid":
        setParams({ x: 0.33, y: 0.33, z: 0.34, cz: 2.0 });
        setActiveMode("coplanar");
        break;
      case "inside":
        setParams({ x: 0.5, y: 0.3, z: 0.2, cz: 2.0 });
        setActiveMode("coplanar");
        break;
      case "plane2d":
        setParams({ x: 1.5, y: 1.2, z: 0, cz: 2.0 });
        setActiveMode("parallelepiped");
        break;
      case "degen":
        setParams({ x: 1.5, y: 1.2, z: 1.8, cz: 0 });
        setActiveMode("degeneration");
        break;
    }
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="教学模式选择">
            <TabSwitcher
              tabs={[
                { key: "parallelepiped", label: "六面体分解" },
                { key: "coplanar", label: "四点共面 (x+y+z=1)" },
                { key: "degeneration", label: "基底共面检验" },
              ]}
              value={activeMode}
              onChange={(m) => setActiveMode(m as TeachingMode)}
            />
          </LeftPanelSection>

          <LeftPanelSection title="经典高考场景预设">
            <SelectGrid
              items={[
                {
                  key: "std",
                  label: "标准分解",
                  description: "P(1.5, 1.2, 1.8)",
                },
                {
                  key: "centroid",
                  label: "△ABC 重心",
                  description: "x=y=z=1/3 共面",
                  fullWidth: false,
                },
                {
                  key: "inside",
                  label: "截面内部点",
                  description: "x+y+z=1 共面",
                },
                {
                  key: "plane2d",
                  label: "z=0 二维退化",
                  description: "P 在 (ab) 面上",
                },
                {
                  key: "degen",
                  label: "基底共面失效",
                  description: "cz=0 向量c共面",
                  fullWidth: true,
                },
              ]}
              value=""
              onChange={handlePresetSelect}
              columns={2}
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="基底分解系数控制"
            subtitle="拖动滑块调节 x, y, z 及基向量垂直高度"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <LeftPanelSection title="3D 视角控制">
            <TabSwitcher
              tabs={[
                { key: "iso", label: "轴测" },
                { key: "front", label: "主视" },
                { key: "top", label: "俯视" },
                { key: "side", label: "左视" },
              ]}
              value={preset}
              onChange={(p) => setCameraPreset(p as any)}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={
            <Legend3D
              title="图例与标注"
              items={[
                {
                  colorKey: "paramPrimary",
                  swatch: "line",
                  label: "基底向量 a (红)",
                },
                {
                  colorKey: "paramSecondary",
                  swatch: "line",
                  label: "基底向量 b (橙)",
                },
                {
                  colorKey: "paramTertiary",
                  swatch: "line",
                  label: "基底向量 c (绿)",
                },
                {
                  colorKey: "highlight",
                  swatch: "line",
                  label: "结果向量 OP (紫)",
                },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          <Scene3DGrid size={5} />

          {/* 原点 O */}
          <PointLabel3D position={O} text="O" />

          {/* 1. 基底向量 a, b, c */}
          <Vector3DArrow from={O} to={vecA} colorKey="paramPrimary" />
          <FormulaLabel3D
            position={{ x: vecA.x + 0.2, y: 0, z: 0 }}
            tex="\vec{a}"
          />
          <PointLabel3D position={pointA} text="A" />

          <Vector3DArrow from={O} to={vecB} colorKey="paramSecondary" />
          <FormulaLabel3D
            position={{ x: vecB.x + 0.2, y: vecB.y + 0.2, z: 0 }}
            tex="\vec{b}"
          />
          <PointLabel3D position={pointB} text="B" />

          <Vector3DArrow from={O} to={vecC} colorKey="paramTertiary" />
          <FormulaLabel3D
            position={{ x: 0, y: vecC.y + 0.2, z: vecC.z + 0.2 }}
            tex="\vec{c}"
          />
          <PointLabel3D position={pointC} text="C" />

          {/* 2. 平行六面体模式与基础分解包络 */}
          {activeMode === "parallelepiped" && (
            <>
              {/* 分解分量路径向量 */}
              <Vector3DArrow from={O} to={box.xa} colorKey="paramPrimary" />
              <Vector3DArrow
                from={box.xa}
                to={box.xy}
                colorKey="paramSecondary"
              />
              <Vector3DArrow
                from={box.xy}
                to={box.P}
                colorKey="paramTertiary"
              />

              {/* 平行六面体 12 条虚线包络边 */}
              <Segment3D from={box.xa} to={box.xy} color="#EF4444" />
              <Segment3D from={box.yb} to={box.xy} color="#D97706" />

              <Segment3D from={box.xa} to={box.xz} color="#EF4444" />
              <Segment3D from={box.zc} to={box.xz} color="#059669" />

              <Segment3D from={box.yb} to={box.yz} color="#D97706" />
              <Segment3D from={box.zc} to={box.yz} color="#059669" />

              <Segment3D from={box.xy} to={box.P} color="#64748B" />
              <Segment3D from={box.xz} to={box.P} color="#64748B" />
              <Segment3D from={box.yz} to={box.P} color="#64748B" />
            </>
          )}

          {/* 3. 四点共面定理 (x+y+z=1) 渲染 */}
          {(activeMode === "coplanar" || coplanarInfo.isCoplanar) && (
            <>
              {/* △ABC 截面多边形 */}
              <TriangleMesh
                A={pointA}
                B={pointB}
                C={pointC}
                color={MATH_COLORS.highlight}
                opacity={0.35}
              />

              {/* △ABC 三条边 */}
              <Segment3D
                from={pointA}
                to={pointB}
                dashed={false}
                color="#8B5CF6"
                lineWidth={2}
              />
              <Segment3D
                from={pointB}
                to={pointC}
                dashed={false}
                color="#8B5CF6"
                lineWidth={2}
              />
              <Segment3D
                from={pointC}
                to={pointA}
                dashed={false}
                color="#8B5CF6"
                lineWidth={2}
              />

              {/* 当为重心时高亮重心 G */}
              {coplanarInfo.isCentroid && (
                <FormulaLabel3D
                  position={{
                    x: (pointA.x + pointB.x + pointC.x) / 3,
                    y: (pointA.y + pointB.y + pointC.y) / 3 + 0.2,
                    z: (pointA.z + pointB.z + pointC.z) / 3,
                  }}
                  tex="\text{重心 } G"
                />
              )}
            </>
          )}

          {/* 4. 组合结果向量 OP */}
          <Vector3DArrow from={O} to={P} colorKey="highlight" />
          <PointLabel3D position={P} text="P" offset={[0.1, 0.1, 0.1]} />
          <FormulaLabel3D
            position={{ x: P.x / 2 + 0.2, y: P.y / 2, z: P.z / 2 + 0.2 }}
            tex="\vec{OP}"
          />

          {/* 3D 点 P（完全由左屏参数与快捷预设控制） */}
          <Point3D position={P} colorKey="highlight" />

          {/* 5. 基底退化/共面验证模式特有高亮 */}
          {activeMode === "degeneration" && Math.abs(cz) < 0.1 && (
            <TriangleMesh
              A={O}
              B={vecA}
              C={vecB}
              color={MATH_COLORS.secondary}
              opacity={0.4}
            />
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
