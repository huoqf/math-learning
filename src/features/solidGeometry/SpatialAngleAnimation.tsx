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
  FormulaLabel3D,
  Vector3DArrow,
  LinePlaneAngle3D,
  Legend3D,
  CameraRig,
} from "@/components/Math3D";
import { Cuboid } from "@/components/Math3D/solids";
import { use3DViewport } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { spatialAngleMeta } from "@/data/registries/solidGeometry";
import type { Vec3 } from "@/math3d/vector3";

type AngleMode = "skewLines" | "linePlane" | "dihedral";

export default function SpatialAngleAnimation() {
  const [activeMode, setActiveMode] = useState<AngleMode>("skewLines");
  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 2,
    c: 2,
    ex: 1.2,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const { a, b, c, ex } = params;

  // 长方体顶点坐标解算
  const A: Vec3 = { x: 0, y: 0, z: 0 };
  const B: Vec3 = { x: a, y: 0, z: 0 };
  const C: Vec3 = { x: a, y: b, z: 0 };
  const D: Vec3 = { x: 0, y: b, z: 0 };
  const A1: Vec3 = { x: 0, y: 0, z: c };
  const B1: Vec3 = { x: a, y: 0, z: c };
  const E: Vec3 = { x: 0, y: 0, z: ex }; // AA1 上的动点 E

  // 组装右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-angle", params, {
        mode: activeMode,
      }),
    [params, activeMode],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ a: 3, b: 2, c: 2, ex: 1.2 });
  };

  // 左屏参数配置
  const paramConfigs = useMemo<ParamConfig[]>(
    () =>
      spatialAngleMeta.map((meta) => ({
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

  // 截面 BDE 法向量解算 (用于二面角与线面角)
  const n2X = b * ex;
  const n2Y = a * ex;
  const n2Z = a * b;
  const n2Len = Math.sqrt(n2X * n2X + n2Y * n2Y + n2Z * n2Z);
  const n2Normalized: Vec3 = {
    x: (n2X / n2Len) * 2,
    y: (n2Y / n2Len) * 2,
    z: (n2Z / n2Len) * 2,
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="空间角模式选择">
            <TabSwitcher
              tabs={[
                { key: "skewLines", label: "异面直线角" },
                { key: "linePlane", label: "线面角" },
                { key: "dihedral", label: "二面角" },
              ]}
              value={activeMode}
              onChange={(mode) => setActiveMode(mode as AngleMode)}
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="建系与几何尺寸参数"
            subtitle="调节长方体棱长与动点 E 高度"
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
              title="3D 空间角图例"
              items={[
                {
                  colorKey: "primary",
                  swatch: "line",
                  label: "直线方向向量 u",
                },
                {
                  colorKey: activeMode === "skewLines" ? "accent" : "secondary",
                  swatch: "line",
                  label: activeMode === "skewLines" ? "方向向量 v" : "法向量 n",
                },
                {
                  colorKey: "secondary",
                  swatch: "area",
                  label: "基准平面/截面",
                },
                {
                  colorKey: "highlight",
                  swatch: "line",
                  label: "所求空间角弧/动点",
                },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          <Scene3DGrid size={5} />

          {/* 长方体实体主体框架 */}
          <Cuboid a={a} b={b} c={c} colorKey="primary" opacity={0.08} />

          {/* 空间直角坐标系顶点坐标标注 */}
          <PointLabel3D position={A} text="O(0,0,0)" />
          <PointLabel3D position={B} text={`B(${a},0,0)`} />
          <PointLabel3D position={D} text={`D(0,${b},0)`} />
          <PointLabel3D position={C} text={`C(${a},${b},0)`} />
          <PointLabel3D position={A1} text={`A1(0,0,${c})`} />
          <PointLabel3D position={B1} text={`B1(${a},0,${c})`} />
          <PointLabel3D position={E} text={`E(0,0,${ex.toFixed(1)})`} />

          {/* 可拖拽 3D 动点 E */}
          <Point3D
            position={E}
            draggable
            constrain={(raw) => ({
              x: 0,
              y: 0,
              z: Math.min(Math.max(raw.z, 0.2), c),
            })}
            onDrag={(next) => setParams((p) => ({ ...p, ex: next.z }))}
            colorKey="highlight"
          />

          {/* 模式一：异面直线所成的角 */}
          {activeMode === "skewLines" && (
            <>
              {/* 异面直线 1: DE */}
              <Vector3DArrow from={D} to={E} colorKey="primary" />
              {/* 异面直线 2: AB1 */}
              <Vector3DArrow from={A} to={B1} colorKey="accent" />
              {/* 向量公式标注 */}
              <FormulaLabel3D
                position={{ x: 0, y: b / 2, z: ex / 2 }}
                tex="\vec{u}=\vec{DE}"
              />
              <FormulaLabel3D
                position={{ x: a / 2, y: 0, z: c / 2 }}
                tex="\vec{v}=\vec{AB_1}"
              />
              {/* 角弧标示度 */}
              <AngleArc3D
                vertex={A}
                dirA={{ x: B1.x - A.x, y: B1.y - A.y, z: B1.z - A.z }}
                dirB={{ x: 0, y: D.y - A.y, z: E.z - A.z }}
                radius={0.8}
                colorKey="highlight"
              />
            </>
          )}

          {/* 模式二：直线与平面所成的角 (线面角) */}
          {activeMode === "linePlane" && (
            <>
              {/* 底面 ABCD */}
              <Plane3D
                origin={A}
                uAxis={{ x: 1, y: 0, z: 0 }}
                vAxis={{ x: 0, y: 1, z: 0 }}
                width={a + 0.5}
                height={b + 0.5}
                colorKey="secondary"
                opacity={0.18}
              />
              {/* 线面角：斜线 BE、投影线 BA、垂线 EA、法向量 n0、角弧 */}
              <LinePlaneAngle3D
                lineStart={B}
                lineEnd={E}
                footPoint={A}
                planeNormal={{ x: 0, y: 0, z: 1 }}
                arcRadius={0.8}
              />
            </>
          )}

          {/* 模式三：二面角 */}
          {activeMode === "dihedral" && (
            <>
              {/* 底面 ABCD */}
              <Plane3D
                origin={A}
                uAxis={{ x: 1, y: 0, z: 0 }}
                vAxis={{ x: 0, y: 1, z: 0 }}
                width={a + 0.5}
                height={b + 0.5}
                colorKey="secondary"
                opacity={0.15}
              />
              {/* 截面 BDE */}
              <Plane3D
                origin={B}
                uAxis={{ x: D.x - B.x, y: D.y - B.y, z: 0 }}
                vAxis={{ x: E.x - B.x, y: E.y - B.y, z: E.z - B.z }}
                width={Math.max(a, b) + 1}
                height={c + 1}
                colorKey="paramTertiary"
                opacity={0.25}
              />
              {/* 截面法向量 n_2 */}
              <Vector3DArrow
                from={{ x: a / 3, y: b / 3, z: ex / 3 }}
                to={{
                  x: a / 3 + n2Normalized.x,
                  y: b / 3 + n2Normalized.y,
                  z: ex / 3 + n2Normalized.z,
                }}
                colorKey="primary"
              />
              <FormulaLabel3D
                position={{
                  x: a / 3 + n2Normalized.x,
                  y: b / 3 + n2Normalized.y,
                  z: ex / 3 + n2Normalized.z + 0.3,
                }}
                tex="\vec{n_2}"
              />
              {/* 底面法向量 n_1 */}
              <Vector3DArrow
                from={{ x: a / 3, y: b / 3, z: 0 }}
                to={{ x: a / 3, y: b / 3, z: 1.8 }}
                colorKey="secondary"
              />
              {/* 二面角交线/棱 BD */}
              <Vector3DArrow from={B} to={D} colorKey="highlight" />
              {/* 二面角弧 */}
              <AngleArc3D
                vertex={B}
                dirA={{ x: D.x - B.x, y: D.y - B.y, z: 0 }}
                dirB={{ x: E.x - B.x, y: E.y - B.y, z: E.z - B.z }}
                radius={0.9}
                colorKey="highlight"
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
          title="空间角向量求解看板"
        />
      }
    />
  );
}
