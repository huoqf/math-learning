import { useState, useMemo } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  Vector3DArrow,
  Point3D,
  Plane3D,
  PointLabel3D,
  FormulaLabel3D,
  Legend3D,
  CameraRig,
} from "@/components/Math3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { vector3dBasisMeta } from "@/data/registries/vector3d";
import type { Vec3 } from "@/math3d/vector3";

export default function Vector3DBasisAnimation() {
  const [params, setParams] = useState<Record<string, number>>({
    x: 1.5,
    y: 1.2,
    z: 1.8,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const { x, y, z } = params;

  // 定义基底向量 a, b, c (不共面)
  const O: Vec3 = { x: 0, y: 0, z: 0 };
  const vecA: Vec3 = { x: 2, y: 0, z: 0 }; // 沿 x 轴
  const vecB: Vec3 = { x: 0.5, y: 2, z: 0 }; // 沿 xy 平面斜向
  const vecC: Vec3 = { x: 0, y: 0.5, z: 2 }; // 沿 z 轴向上

  // 分解多项式点
  const pA: Vec3 = { x: x * vecA.x, y: x * vecA.y, z: x * vecA.z };
  const pB: Vec3 = {
    y: y * vecB.y + pA.y,
    x: pA.x + y * vecB.x,
    z: pA.z + y * vecB.z,
  };
  const P: Vec3 = {
    x: x * vecA.x + y * vecB.x + z * vecC.x,
    y: x * vecA.y + y * vecB.y + z * vecC.y,
    z: x * vecA.z + y * vecB.z + z * vecC.z,
  };

  const mathData = useMemo(
    () => buildMathQuantities("anim-vector3d-basis", params),
    [params],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ x: 1.5, y: 1.2, z: 1.8 });
  };

  const paramConfigs = useMemo<ParamConfig[]>(
    () =>
      vector3dBasisMeta.map((meta) => ({
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
      })),
    [params],
  );

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="基底分解系数"
            subtitle="调节向量 OP 在三个基底上的系数 x, y, z"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <LeftPanelSection title="3D 视角选择">
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
              title="向量图例"
              items={[
                {
                  colorKey: "paramPrimary",
                  swatch: "line",
                  label: "基底向量 a",
                },
                {
                  colorKey: "paramSecondary",
                  swatch: "line",
                  label: "基底向量 b",
                },
                {
                  colorKey: "paramTertiary",
                  swatch: "line",
                  label: "基底向量 c",
                },
                {
                  colorKey: "highlight",
                  swatch: "line",
                  label: "分解结果向量 OP",
                },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          <Scene3DGrid size={5} />

          {/* 1. 三个基底向量 a, b, c */}
          <Vector3DArrow from={O} to={vecA} colorKey="paramPrimary" />
          <FormulaLabel3D
            position={{ x: vecA.x + 0.2, y: 0, z: 0 }}
            tex="\vec{a}"
          />

          <Vector3DArrow from={O} to={vecB} colorKey="paramSecondary" />
          <FormulaLabel3D
            position={{ x: vecB.x + 0.2, y: vecB.y + 0.2, z: 0 }}
            tex="\vec{b}"
          />

          <Vector3DArrow from={O} to={vecC} colorKey="paramTertiary" />
          <FormulaLabel3D
            position={{ x: 0, y: vecC.y + 0.2, z: vecC.z + 0.2 }}
            tex="\vec{c}"
          />

          {/* 原点 O */}
          <PointLabel3D position={O} text="O" />

          {/* 2. 平行六面体分解路径 */}
          {/* x*a 路径 */}
          <Vector3DArrow from={O} to={pA} colorKey="primary" />
          {/* + y*b 路径 */}
          <Vector3DArrow from={pA} to={pB} colorKey="secondary" />
          {/* + z*c 路径 */}
          <Vector3DArrow from={pB} to={P} colorKey="paramTertiary" />

          {/* 3. 组合结果向量 OP */}
          <Vector3DArrow from={O} to={P} colorKey="highlight" />
          <PointLabel3D position={P} text="P" offset={[0.1, 0.1, 0.1]} />
          <FormulaLabel3D
            position={{ x: P.x / 2 + 0.2, y: P.y / 2, z: P.z / 2 + 0.2 }}
            tex="\vec{OP}"
          />

          {/* 可拖拽 3D 控制点 P */}
          <Point3D
            position={P}
            draggable
            onDrag={(next) => {
              // 简易解算 x, y, z
              setParams({
                x: Number((next.x / vecA.x).toFixed(1)),
                y: Number((next.y / vecB.y).toFixed(1)),
                z: Number((next.z / vecC.z).toFixed(1)),
              });
            }}
            colorKey="highlight"
          />

          {/* 4. 当 x+y+z = 1 时的高亮四点共面 */}
          {Math.abs(x + y + z - 1) < 0.05 && (
            <Plane3D
              origin={vecA}
              uAxis={{ x: vecB.x - vecA.x, y: vecB.y - vecA.y, z: 0 }}
              vAxis={{ x: vecC.x - vecA.x, y: vecC.y - vecA.y, z: vecC.z }}
              width={4}
              height={4}
              colorKey="highlight"
              opacity={0.3}
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
          title="空间向量分解看板"
        />
      }
    />
  );
}
