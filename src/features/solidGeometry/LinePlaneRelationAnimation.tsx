import { useState, useMemo } from "react";
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
  Plane3D,
  PointLabel3D,
  FormulaLabel3D,
  AngleArc3D,
  Legend3D,
  CameraRig,
} from "@/components/Math3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { linePlaneRelationMeta } from "@/data/registries/solidGeometry";
import { getLineDirection } from "@/math3d/lineRelation";
import type { Vec3 } from "@/math3d/vector3";

type TeachingMode = "parallel" | "perpendicular" | "vector";

export default function LinePlaneRelationAnimation() {
  const [activeMode, setActiveMode] = useState<TeachingMode>("parallel");
  const [params, setParams] = useState<Record<string, number>>({
    zHeight: 2,
    thetaDeg: 0,
    phiDeg: 30,
    intersectType: 1, // 1: 相交, 0: 平行(反例)
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const zHeight = params.zHeight ?? 2;
  const thetaDeg = params.thetaDeg ?? 0;
  const phiDeg = params.phiDeg ?? 30;
  const intersectType = params.intersectType ?? 1;

  // 组装右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-position", params, {
        mode: activeMode,
      }),
    [params, activeMode],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({
      zHeight: 2,
      thetaDeg: activeMode === "perpendicular" ? 90 : 0,
      phiDeg: 30,
      intersectType: 1,
    });
  };

  // 左屏参数列表配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return linePlaneRelationMeta.map((meta) => {
      // 垂直模式下强化 θ = 90° 标记
      let currentVal = params[meta.key] ?? meta.defaultValue ?? 0;
      return {
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: currentVal,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance as any,
        marks: meta.marks,
      };
    });
  }, [params]);

  // 3D 几何向量解算
  const lineDir = getLineDirection(thetaDeg, phiDeg);
  const startPoint: Vec3 = {
    x: -lineDir.x * 2.5,
    y: -lineDir.y * 2.5,
    z: zHeight - lineDir.z * 2.5,
  };
  const endPoint: Vec3 = {
    x: lineDir.x * 2.5,
    y: lineDir.y * 2.5,
    z: zHeight + lineDir.z * 2.5,
  };
  const midPoint: Vec3 = { x: 0, y: 0, z: zHeight };

  // 面内平行线 m (平行模式)
  const lineMStart: Vec3 = { x: -2.5, y: 0, z: 0 };
  const lineMEnd: Vec3 = { x: 2.5, y: 0, z: 0 };

  // 面内直线 a 与 b (垂直模式)
  // 直线 a 沿 x 轴 (-2.5,0,0) -> (2.5,0,0)
  const lineAStart: Vec3 = { x: -2.5, y: 0, z: 0 };
  const lineAEnd: Vec3 = { x: 2.5, y: 0, z: 0 };

  // 直线 b: 若相交，沿 y 轴 (0,-2.5,0) -> (0,2.5,0); 若平行，沿 (x, 1.5, 0)
  const lineBStart: Vec3 =
    intersectType === 1 ? { x: 0, y: -2.5, z: 0 } : { x: -2.5, y: 1.5, z: 0 };
  const lineBEnd: Vec3 =
    intersectType === 1 ? { x: 0, y: 2.5, z: 0 } : { x: 2.5, y: 1.5, z: 0 };

  // 法向量 n
  const normalOrigin: Vec3 = { x: 0, y: 0, z: 0 };
  const normalEnd: Vec3 = { x: 0, y: 0, z: 2.5 };

  // 线面角弧与投影点
  const projPoint: Vec3 = { x: endPoint.x, y: endPoint.y, z: zHeight };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="判定定理模式选择">
            <TabSwitcher
              tabs={[
                { key: "parallel", label: "线面平行" },
                { key: "perpendicular", label: "线面垂直" },
                { key: "vector", label: "向量与线面角" },
              ]}
              value={activeMode}
              onChange={(mode) => {
                setActiveMode(mode as TeachingMode);
                if (mode === "perpendicular") {
                  setParams((p) => ({ ...p, thetaDeg: 90, zHeight: 0 }));
                } else if (mode === "parallel") {
                  setParams((p) => ({ ...p, thetaDeg: 0, zHeight: 2 }));
                }
              }}
            />
          </LeftPanelSection>

          {activeMode === "perpendicular" && (
            <LeftPanelSection title="平面内两线关系 (高考对比)">
              <SelectGrid
                items={[
                  {
                    key: "1",
                    label: "两线相交 (a ∩ b = P)",
                    description: "满足判定定理必要条件，锁定 l ⊥ α",
                  },
                  {
                    key: "0",
                    label: "两线平行 (a ∥ b)",
                    description: "高考易错反例：l 可左右倾斜斜交",
                  },
                ]}
                value={String(intersectType)}
                onChange={(val) =>
                  setParams((p) => ({ ...p, intersectType: Number(val) }))
                }
                columns={1}
              />
            </LeftPanelSection>
          )}

          <LeftPanelSection
            title="姿态与姿势参数"
            subtitle="调节高度与空间角度"
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
              title="3D 几何图例"
              items={[
                { colorKey: "secondary", swatch: "area", label: "基准平面 α" },
                { colorKey: "highlight", swatch: "line", label: "目标直线 l" },
                {
                  colorKey: "primary",
                  swatch: "line",
                  label:
                    activeMode === "parallel" ? "面内平行线 m" : "面内线 a, b",
                },
                ...(activeMode === "parallel"
                  ? [
                      {
                        colorKey: "paramTertiary" as const,
                        swatch: "area" as const,
                        label: "辅助面 β (过 l, m)",
                      },
                    ]
                  : []),
                ...(activeMode === "vector"
                  ? [
                      {
                        colorKey: "paramPrimary" as const,
                        swatch: "line" as const,
                        label: "法向量 n",
                      },
                    ]
                  : []),
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          <Scene3DGrid size={5} />

          {/* 1. 主基准平面 α */}
          <Plane3D
            origin={{ x: 0, y: 0, z: 0 }}
            uAxis={{ x: 1, y: 0, z: 0 }}
            vAxis={{ x: 0, y: 1, z: 0 }}
            width={6}
            height={6}
            colorKey="secondary"
            opacity={0.2}
          />
          <FormulaLabel3D position={{ x: 2.7, y: 2.7, z: 0.1 }} tex="\alpha" />

          {/* 2. 目标直线 l */}
          <Vector3DArrow from={startPoint} to={endPoint} colorKey="highlight" />
          <FormulaLabel3D
            position={{
              x: endPoint.x + 0.2,
              y: endPoint.y + 0.2,
              z: endPoint.z + 0.2,
            }}
            tex="l"
          />

          {/* 3. 平行模式下的面内线 m 及辅助交面 β */}
          {activeMode === "parallel" && (
            <>
              <Vector3DArrow
                from={lineMStart}
                to={lineMEnd}
                colorKey="primary"
              />
              <FormulaLabel3D position={{ x: 2.6, y: 0.2, z: 0 }} tex="m" />
              {/* 过 l 和 m 的辅助交面 β */}
              <Plane3D
                origin={{ x: 0, y: 0, z: zHeight / 2 }}
                uAxis={{ x: 1, y: 0, z: 0 }}
                vAxis={{ x: 0, y: 0, z: 1 }}
                width={6}
                height={Math.max(1, zHeight * 1.5)}
                colorKey="paramTertiary"
                opacity={0.15}
              />
              <FormulaLabel3D
                position={{ x: 2.5, y: 0.1, z: zHeight / 2 + 0.5 }}
                tex="\beta"
              />
            </>
          )}

          {/* 4. 垂直模式下的面内线 a, b */}
          {activeMode === "perpendicular" && (
            <>
              <Vector3DArrow
                from={lineAStart}
                to={lineAEnd}
                colorKey="primary"
              />
              <FormulaLabel3D position={{ x: 2.6, y: 0.2, z: 0 }} tex="a" />

              <Vector3DArrow
                from={lineBStart}
                to={lineBEnd}
                colorKey="primary"
              />
              <FormulaLabel3D
                position={{
                  x: lineBEnd.x + 0.2,
                  y: lineBEnd.y + 0.2,
                  z: 0,
                }}
                tex="b"
              />

              {intersectType === 1 && (
                <PointLabel3D position={{ x: 0, y: 0, z: 0 }} text="P" />
              )}
            </>
          )}

          {/* 5. 向量模式下的法向量 n 与角弧 */}
          {activeMode === "vector" && (
            <>
              <Vector3DArrow
                from={normalOrigin}
                to={normalEnd}
                colorKey="paramPrimary"
              />
              <FormulaLabel3D
                position={{ x: 0.2, y: 0.2, z: 2.6 }}
                tex="\vec{n}"
              />

              {thetaDeg > 0 && thetaDeg < 90 && (
                <AngleArc3D
                  vertex={midPoint}
                  dirA={{
                    x: endPoint.x - midPoint.x,
                    y: endPoint.y - midPoint.y,
                    z: endPoint.z - midPoint.z,
                  }}
                  dirB={{
                    x: projPoint.x - midPoint.x,
                    y: projPoint.y - midPoint.y,
                    z: 0,
                  }}
                  radius={0.8}
                  colorKey="paramSecondary"
                />
              )}
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
          title="空间线面位置关系看板"
        />
      }
    />
  );
}
