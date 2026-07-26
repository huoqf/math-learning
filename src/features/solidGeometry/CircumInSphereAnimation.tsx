import { useState, useMemo } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  SelectGrid,
  TabSwitcher,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  PointLabel3D,
  CompoundLabel3D,
  FormulaLabel3D,
  Legend3D,
  CameraRig,
} from "@/components/Math3D";
import {
  Cuboid,
  CircumSphere,
  RegularPyramid,
  Cone,
} from "@/components/Math3D/solids";
import { use3DViewport } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { circumInSphereMeta } from "@/data/registries/solidGeometry";
import {
  cuboidCircumRadius,
  regularPyramidCircumRadius,
  coneCircumRadius,
  regularPolygonCircumRadius,
} from "@/math3d/solidGeometry";

type ShapeType = "cuboid" | "regularTetra" | "cone";

export default function CircumInSphereAnimation() {
  const [shape, setShape] = useState<ShapeType>("cuboid");
  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 2,
    c: 2,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const { a, b, c } = params;

  const circumRadius = useMemo(() => {
    switch (shape) {
      case "cuboid":
        return cuboidCircumRadius(a, b, c);
      case "regularTetra":
        return regularPyramidCircumRadius(regularPolygonCircumRadius(a, 4), c);
      case "cone":
        return coneCircumRadius(a, c);
      default:
        return cuboidCircumRadius(a, b, c);
    }
  }, [shape, a, b, c]);

  const mathData = useMemo(
    () => buildMathQuantities("anim-solid-ball", params),
    [params],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ a: 3, b: 2, c: 2 });
  };

  const paramConfigs = useMemo<ParamConfig[]>(
    () =>
      circumInSphereMeta.map((meta) => ({
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

  const sphereCenter = {
    x: shape === "cuboid" ? a / 2 : 0,
    y: shape === "cuboid" ? b / 2 : 0,
    z: c / 2,
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="几何体选择"
            subtitle="选择要研究的几何体类型"
          >
            <SelectGrid
              items={[
                { key: "cuboid", label: "长方体" },
                { key: "regularTetra", label: "正四棱锥" },
                { key: "cone", label: "圆锥" },
              ]}
              value={shape}
              onChange={(k) => setShape(k as ShapeType)}
              variant="filled"
            />
          </LeftPanelSection>

          <LeftPanelSection title="参数调节" subtitle="调节几何体尺寸">
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
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={
            <Legend3D
              title="图例"
              items={[
                { colorKey: "primary", swatch: "area", label: "几何体" },
                { colorKey: "sphereShell", swatch: "sphere", label: "外接球" },
                { colorKey: "accent", swatch: "point", label: "O：球心" },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          <Scene3DGrid size={5} />

          {shape === "cuboid" && (
            <Cuboid a={a} b={b} c={c} colorKey="primary" opacity={0.25} />
          )}
          {shape === "regularTetra" && (
            <RegularPyramid
              sides={4}
              baseRadius={a}
              height={c}
              colorKey="primary"
            />
          )}
          {shape === "cone" && (
            <Cone radius={a} height={c} colorKey="primary" />
          )}

          <CircumSphere center={sphereCenter} radius={circumRadius} />

          {shape === "cuboid" && (
            <>
              <PointLabel3D position={{ x: 0, y: 0, z: 0 }} text="A" />
              <PointLabel3D position={{ x: a, y: 0, z: 0 }} text="B" />
              <PointLabel3D position={{ x: a, y: b, z: 0 }} text="C" />
              <PointLabel3D position={{ x: 0, y: b, z: 0 }} text="D" />
              <CompoundLabel3D
                position={{ x: 0, y: 0, z: c }}
                base="A"
                subscript="1"
              />
              <CompoundLabel3D
                position={{ x: a, y: 0, z: c }}
                base="B"
                subscript="1"
              />
              <CompoundLabel3D
                position={{ x: a, y: b, z: c }}
                base="C"
                subscript="1"
              />
              <CompoundLabel3D
                position={{ x: 0, y: b, z: c }}
                base="D"
                subscript="1"
              />
            </>
          )}

          <FormulaLabel3D
            position={{ x: a + 0.5, y: b / 2, z: c / 2 }}
            tex={`R=${circumRadius.toFixed(2)}`}
          />
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title="外接球指标看板"
        />
      }
    />
  );
}
