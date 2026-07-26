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
  Point3D,
  Plane3D,
  AngleArc3D,
  PointLabel3D,
  CameraRig,
} from "@/components/Math3D";
import { Cuboid } from "@/components/Math3D/solids";
import { use3DViewport } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { spatialAngleMeta } from "@/data/registries/solidGeometry";
import type { Vec3 } from "@/math3d/vector3";

export default function SpatialAngleAnimation() {
  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 2,
    c: 2,
    ex: 1.2,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const { a, b, c, ex } = params;

  const A: Vec3 = { x: 0, y: 0, z: 0 };
  const B: Vec3 = { x: a, y: 0, z: 0 };
  const D: Vec3 = { x: 0, y: b, z: 0 };
  const E: Vec3 = { x: 0, y: 0, z: ex };

  const mathData = useMemo(
    () => buildMathQuantities("anim-solid-angle", params),
    [params],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ a: 3, b: 2, c: 2, ex: 1.2 });
  };

  const paramConfigs = useMemo<ParamConfig[]>(
    () =>
      spatialAngleMeta.map((meta) => ({
        key: meta.key,
        label: meta.label,
        value: params[meta.key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        description: meta.description,
      })),
    [params],
  );

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="参数调节"
            subtitle="调节长方体尺寸与截面点位置"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <LeftPanelSection title="视角切换">
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
        <ThreeDCanvas cameraPosition={cameraPosition}>
          <CameraRig ref={controlsRef} />
          <Scene3DGrid size={5} />

          <Cuboid a={a} b={b} c={c} colorKey="primary" opacity={0.12} />

          <Plane3D
            origin={A}
            uAxis={{ x: 1, y: 0, z: 0 }}
            vAxis={{ x: 0, y: 1, z: 0 }}
            width={Math.max(a, b) + 1}
            height={Math.max(a, b) + 1}
            colorKey="secondary"
            opacity={0.15}
          />

          <Plane3D
            origin={B}
            uAxis={{ x: D.x - B.x, y: D.y - B.y, z: 0 }}
            vAxis={{ x: 0, y: 0, z: 1 }}
            width={Math.max(a, b, c) + 1}
            height={c + 1}
            colorKey="highlight"
            opacity={0.2}
          />

          <Point3D
            position={E}
            draggable
            constrain={(raw) => ({
              x: 0,
              y: 0,
              z: Math.min(Math.max(raw.z, 0.3), c),
            })}
            onDrag={(next) => setParams((p) => ({ ...p, ex: next.z }))}
            colorKey="highlight"
          />

          <PointLabel3D position={A} text="A" />
          <PointLabel3D position={B} text="B" />
          <PointLabel3D position={D} text="D" />
          <PointLabel3D position={E} text="E" />

          <AngleArc3D
            vertex={B}
            dirA={{ x: D.x - B.x, y: D.y - B.y, z: 0 }}
            dirB={{ x: E.x - B.x, y: E.y - B.y, z: E.z - B.z }}
          />
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title="空间角指标看板"
        />
      }
    />
  );
}
