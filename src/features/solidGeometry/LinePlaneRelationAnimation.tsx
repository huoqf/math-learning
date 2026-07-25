import { useState, useMemo } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  Vector3DArrow,
  Plane3D,
  PointLabel3D,
  Legend3D,
  CameraRig,
} from "@/components/Math3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { linePlaneRelationMeta } from "@/data/registries/solidGeometry";
import type { Vec3 } from "@/math3d/vector3";

export default function LinePlaneRelationAnimation() {
  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    lineParam: 0.5,
  });

  const { cameraPosition, setCameraPreset, controlsRef } = use3DViewport("iso");

  const { a, lineParam } = params;

  const lineDir: Vec3 = { x: 1, y: lineParam, z: 0 };
  const pointOnLine: Vec3 = { x: 0, y: 0, z: a };

  const mathData = useMemo(
    () => buildMathQuantities("anim-solid-position", params),
    [params],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ a: 3, lineParam: 0.5 });
  };

  const paramConfigs = useMemo<ParamConfig[]>(
    () =>
      linePlaneRelationMeta.map((meta) => ({
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

  const lineEnd: Vec3 = {
    x: pointOnLine.x + lineDir.x * 2,
    y: pointOnLine.y + lineDir.y * 2,
    z: pointOnLine.z + lineDir.z * 2,
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="参数调节" subtitle="调节直线方向与平面位置">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <LeftPanelSection title="视角切换">
            <div className="flex gap-2">
              {(["iso", "front", "top", "side"] as const).map((p) => (
                <button
                  key={p}
                  className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 font-medium"
                  onClick={() => setCameraPreset(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={
            <Legend3D
              items={[
                { colorKey: "secondary", swatch: "area", label: "平面 α" },
                { colorKey: "highlight", swatch: "line", label: "直线 l" },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          <Scene3DGrid size={5} />

          <Plane3D
            origin={{ x: 0, y: 0, z: 0 }}
            uAxis={{ x: 1, y: 0, z: 0 }}
            vAxis={{ x: 0, y: 1, z: 0 }}
            width={6}
            height={6}
            colorKey="secondary"
            opacity={0.2}
          />

          <Vector3DArrow from={pointOnLine} to={lineEnd} colorKey="highlight" />

          <PointLabel3D position={pointOnLine} text="P" />
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title="线面位置关系看板"
        />
      }
    />
  );
}
