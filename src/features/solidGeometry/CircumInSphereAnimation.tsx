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
  Point3D,
  PointLabel3D,
  FormulaLabel3D,
  Vector3DArrow,
  Legend3D,
  CameraRig,
} from "@/components/Math3D";
import {
  Cuboid,
  RegularPyramid,
  TriangularPrism,
  Cone,
  Cylinder,
  SphereBySphereType,
} from "@/components/Math3D/solids";
import { use3DViewport } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { circumInSphereMeta } from "@/data/registries/solidGeometry";
import {
  cuboidCircumRadius,
  regularPyramidCircumRadius,
  coneCircumRadius,
} from "@/math3d/solidGeometry";
import type { Vec3 } from "@/math3d/vector3";

type SphereType = "circum" | "inscribed";
type ShapeType =
  "cuboid" | "regularPyramid" | "triangularPrism" | "cone" | "cylinder";

export default function CircumInSphereAnimation() {
  const [sphereType, setSphereType] = useState<SphereType>("circum");
  const [shape, setShape] = useState<ShapeType>("cuboid");
  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 2,
    c: 2,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const { a, b, c } = params;

  // 球半径与球心坐标精准解算
  const { radius, center } = useMemo<{ radius: number; center: Vec3 }>(() => {
    if (sphereType === "circum") {
      // ── 外接球模式 ──
      if (shape === "cuboid") {
        const r = cuboidCircumRadius(a, b, c);
        return { radius: r, center: { x: a / 2, y: b / 2, z: c / 2 } };
      } else if (shape === "regularPyramid") {
        const rBase = a / Math.sqrt(2);
        const r = regularPyramidCircumRadius(rBase, c);
        // 球心在高上，z_O = c - R (因顶点在 z=c, 底面在 z=0)
        return { radius: r, center: { x: 0, y: 0, z: c - r } };
      } else if (shape === "triangularPrism") {
        const rBase = Math.sqrt(a * a + b * b) / 2;
        const r = Math.sqrt(rBase * rBase + (c / 2) ** 2);
        return { radius: r, center: { x: a / 2, y: b / 2, z: c / 2 } };
      } else if (shape === "cone") {
        const r = coneCircumRadius(a, c);
        return { radius: r, center: { x: 0, y: 0, z: c - r } };
      } else {
        // cylinder
        const r = Math.sqrt(a * a + (c / 2) ** 2);
        return { radius: r, center: { x: 0, y: 0, z: c / 2 } };
      }
    } else {
      // ── 内切球模式 ──
      if (shape === "cuboid") {
        const r = Math.min(a, b, c) / 2;
        return { radius: r, center: { x: a / 2, y: b / 2, z: c / 2 } };
      } else if (shape === "regularPyramid") {
        const hs = Math.sqrt(c * c + (a / 2) ** 2);
        const vSolid = (1 / 3) * a * a * c;
        const sTotal = a * a + 2 * a * hs;
        const r = (3 * vSolid) / sTotal;
        return { radius: r, center: { x: 0, y: 0, z: r } };
      } else if (shape === "triangularPrism") {
        const rBaseIn = (a + b - Math.sqrt(a * a + b * b)) / 2;
        const r = Math.min(rBaseIn, c / 2);
        return {
          radius: r,
          center: { x: rBaseIn, y: rBaseIn, z: c / 2 },
        };
      } else if (shape === "cone") {
        const l = Math.sqrt(a * a + c * c);
        const r = (a * c) / (a + l);
        return { radius: r, center: { x: 0, y: 0, z: r } };
      } else {
        // cylinder
        const r = Math.min(a, c / 2);
        return { radius: r, center: { x: 0, y: 0, z: c / 2 } };
      }
    }
  }, [sphereType, shape, a, b, c]);

  // 组装右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-ball", params, {
        sphereType,
        shape,
      }),
    [params, sphereType, shape],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ a: 3, b: 2, c: 2 });
  };

  // 左屏参数配置
  const paramConfigs = useMemo<ParamConfig[]>(
    () =>
      circumInSphereMeta.map((meta) => ({
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
          <LeftPanelSection title="球切接类型">
            <TabSwitcher
              tabs={[
                { key: "circum", label: "外接球 (Circum)" },
                { key: "inscribed", label: "内切球 (Inscribed)" },
              ]}
              value={sphereType}
              onChange={(t) => setSphereType(t as SphereType)}
            />
          </LeftPanelSection>

          <LeftPanelSection title="几何体模型选择">
            <SelectGrid
              items={[
                { key: "cuboid", label: "长方体/正方体" },
                { key: "regularPyramid", label: "正四棱锥" },
                { key: "triangularPrism", label: "直三棱柱" },
                { key: "cone", label: "圆锥" },
                { key: "cylinder", label: "圆柱" },
              ]}
              value={shape}
              onChange={(k) => setShape(k as ShapeType)}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          <LeftPanelSection title="几何参数调节" subtitle="调节底面尺寸与高度">
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
              title="切接球图例"
              items={[
                { colorKey: "primary", swatch: "area", label: "几何体主体" },
                {
                  colorKey:
                    sphereType === "circum" ? "sphereShell" : "inSphereShell",
                  swatch: "sphere",
                  label: sphereType === "circum" ? "外接球" : "内切球",
                },
                { colorKey: "highlight", swatch: "point", label: "O：球心" },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          <Scene3DGrid size={5} />

          {/* 渲染几何体实体 */}
          {shape === "cuboid" && (
            <Cuboid a={a} b={b} c={c} colorKey="primary" opacity={0.2} />
          )}
          {shape === "regularPyramid" && (
            <RegularPyramid
              sides={4}
              baseRadius={a / Math.sqrt(2)}
              height={c}
              colorKey="primary"
            />
          )}
          {shape === "cone" && (
            <Cone radius={a} height={c} colorKey="primary" />
          )}
          {shape === "triangularPrism" && (
            <TriangularPrism legA={a} legB={b} height={c} colorKey="primary" />
          )}
          {shape === "cylinder" && (
            <Cylinder radius={a} height={c} colorKey="primary" />
          )}

          {/* 渲染球体 */}
          <SphereBySphereType
            sphereType={sphereType}
            center={center}
            radius={radius}
          />

          {/* 渲染球心点 O */}
          <Point3D position={center} colorKey="highlight" />
          <PointLabel3D position={center} text="O" />

          {/* 绘制球半径/辅连线 */}
          {sphereType === "circum" ? (
            <Vector3DArrow
              from={center}
              to={
                shape === "regularPyramid" || shape === "cone"
                  ? { x: 0, y: 0, z: c }
                  : shape === "cylinder"
                    ? { x: a, y: 0, z: c }
                    : shape === "triangularPrism"
                      ? { x: 0, y: 0, z: c }
                      : { x: a, y: b, z: c }
              }
              colorKey="highlight"
            />
          ) : (
            <Vector3DArrow
              from={center}
              to={{ x: center.x, y: center.y, z: 0 }}
              colorKey="highlight"
            />
          )}

          <FormulaLabel3D
            position={{ x: center.x + 0.3, y: center.y, z: center.z + 0.3 }}
            tex={`${sphereType === "circum" ? "R" : "r_{in}"}=${radius.toFixed(2)}`}
          />
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title={`${
            shape === "cuboid"
              ? "长方体"
              : shape === "regularPyramid"
                ? "正四棱锥"
                : shape === "triangularPrism"
                  ? "直三棱柱"
                  : shape === "cone"
                    ? "圆锥"
                    : "圆柱"
          }${sphereType === "circum" ? "外接球" : "内切球"}高考指标`}
        />
      }
    />
  );
}
