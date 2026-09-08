import React from "react";
import {
  Scene3DGrid,
  Segment3D,
  Vector3DArrow,
  Plane3D,
  Point3D,
  CompoundLabel3D,
  FormulaLabel3D,
  AngleArc3D,
} from "@/components/Math3D";
import { getLineDirection } from "@/math3d/lineRelation";
import type { Vec3 } from "@/math3d/vector3";
import { PyramidModelScene } from "./components/PyramidModelScene";

export type LinePlaneTeachingMode =
  "parallel" | "perpendicular" | "gaokaoPyramid" | "vector";

interface LinePlaneRelationSceneProps {
  activeMode: LinePlaneTeachingMode;
  subTheorem: "judge" | "prop";
  showAxes: boolean;
  showAuxPlane: boolean;
  showAngleArc: boolean;
  draggable: boolean;
  thetaDeg: number;
  phiDeg: number;
  zHeight: number;
  intersectType: number;
  inPlaneType: number;
  step: number;
  lambdaE: number;
  lambdaF: number;
  pyramidA: number;
  pyramidB: number;
  pyramidH: number;
  onDragE: (value: number) => void;
  onDragF: (value: number) => void;
}

/**
 * 线面平行/垂直 · 高考母题 · 向量法 的 3D 场景渲染层
 *
 * 集中承载 all 纯几何解算与 3D 图元拼装（不包含左屏/右屏数据与交互调度），
 * 使编排层保持"薄"，视觉与几何逻辑单一职责、可独立复用与测试。
 */
export const LinePlaneRelationScene: React.FC<LinePlaneRelationSceneProps> = ({
  activeMode,
  subTheorem,
  showAxes,
  showAuxPlane,
  showAngleArc,
  draggable,
  thetaDeg,
  phiDeg,
  zHeight,
  intersectType,
  inPlaneType,
  step,
  lambdaE,
  lambdaF,
  pyramidA,
  pyramidB,
  pyramidH,
  onDragE,
  onDragF,
}) => {
  // 3D 几何向量解算
  const effectiveZ = inPlaneType === 0 ? 0 : zHeight;
  const lineDir = getLineDirection(thetaDeg, phiDeg);
  const lineLen = 2.6;
  const startPoint: Vec3 = {
    x: -lineDir.x * lineLen,
    y: -lineDir.y * lineLen,
    z: effectiveZ - lineDir.z * lineLen,
  };
  const endPoint: Vec3 = {
    x: lineDir.x * lineLen,
    y: lineDir.y * lineLen,
    z: effectiveZ + lineDir.z * lineLen,
  };
  const midPoint: Vec3 = { x: 0, y: 0, z: effectiveZ };

  const lineMStart: Vec3 = { x: -2.6, y: 0, z: 0 };
  const lineMEnd: Vec3 = { x: 2.6, y: 0, z: 0 };

  const phiRadB = (phiDeg * Math.PI) / 180;
  const lineBStart: Vec3 =
    intersectType === 1
      ? { x: -2.6 * Math.cos(phiRadB), y: -2.6 * Math.sin(phiRadB), z: 0 }
      : { x: -2.6, y: 1.5, z: 0 };
  const lineBEnd: Vec3 =
    intersectType === 1
      ? { x: 2.6 * Math.cos(phiRadB), y: 2.6 * Math.sin(phiRadB), z: 0 }
      : { x: 2.6, y: 1.5, z: 0 };

  const testMRad = (phiDeg * Math.PI) / 180;
  const testMEnd: Vec3 = {
    x: 2.5 * Math.cos(testMRad),
    y: 2.5 * Math.sin(testMRad),
    z: 0,
  };

  const normalEnd: Vec3 = { x: 0, y: 0, z: 2.5 };
  const projPoint: Vec3 = { x: endPoint.x, y: endPoint.y, z: effectiveZ };

  return (
    <>
      {/* 真实响应 showAxes 状态！ */}
      {showAxes && <Scene3DGrid size={5} showGrid={false} />}

      {/* 模式 1：高考四棱锥母题 */}
      {activeMode === "gaokaoPyramid" && (
        <PyramidModelScene
          lambdaE={lambdaE}
          lambdaF={lambdaF}
          a={pyramidA}
          b={pyramidB}
          h={pyramidH}
          draggable={draggable}
          onDragE={onDragE}
          onDragF={onDragF}
        />
      )}

      {/* 模式 2：非四棱锥通用场景 */}
      {activeMode !== "gaokaoPyramid" && (
        <>
          {/* 基准平面 α */}
          <Plane3D
            origin={{ x: 0, y: 0, z: 0 }}
            uAxis={{ x: 1, y: 0, z: 0 }}
            vAxis={{ x: 0, y: 1, z: 0 }}
            width={5.6}
            height={5.6}
            colorKey="secondary"
            opacity={0.22}
          />
          <FormulaLabel3D position={{ x: 2.3, y: 2.3, z: 0.05 }} tex="\alpha" />

          {/* 空间直线 l (空间几何直线无箭头) */}
          <Segment3D
            from={startPoint}
            to={endPoint}
            colorKey="paramPrimary"
            lineWidth={3}
          />
          <FormulaLabel3D
            position={{
              x: endPoint.x + 0.15,
              y: endPoint.y + 0.15,
              z: endPoint.z + 0.1,
            }}
            tex="l"
          />

          {/* 线面平行 */}
          {activeMode === "parallel" && (
            <>
              <Segment3D
                from={lineMStart}
                to={lineMEnd}
                colorKey="paramSecondary"
                lineWidth={2.5}
              />
              <FormulaLabel3D
                position={{
                  x: lineMEnd.x + 0.15,
                  y: lineMEnd.y + 0.15,
                  z: 0.05,
                }}
                tex="m"
              />
              {subTheorem === "prop" && step > 0.05 && showAuxPlane && (
                <>
                  <Plane3D
                    origin={{ x: 0, y: 0, z: (effectiveZ * step) / 2 }}
                    uAxis={{ x: 1, y: 0, z: 0 }}
                    vAxis={{ x: 0, y: 0, z: 1 }}
                    width={5.6}
                    height={Math.max(0.5, effectiveZ * step)}
                    colorKey="paramTertiary"
                    opacity={0.22}
                  />
                  <FormulaLabel3D
                    position={{
                      x: 2.3,
                      y: 0.1,
                      z: Math.max(0.5, effectiveZ * step) + 0.1,
                    }}
                    tex="\beta"
                  />
                  {/* 截线 m */}
                  <Segment3D
                    from={{ x: -2.6, y: 0, z: effectiveZ * step }}
                    to={{ x: 2.6, y: 0, z: effectiveZ * step }}
                    colorKey="paramSecondary"
                    lineWidth={2.5}
                  />
                </>
              )}
            </>
          )}

          {/* 线面垂直 */}
          {activeMode === "perpendicular" && (
            <>
              {subTheorem === "judge" ? (
                <>
                  {/* 直线 a */}
                  <Segment3D
                    from={lineMStart}
                    to={lineMEnd}
                    colorKey="paramSecondary"
                    lineWidth={2.5}
                  />
                  <FormulaLabel3D
                    position={{
                      x: lineMEnd.x + 0.15,
                      y: lineMEnd.y + 0.15,
                      z: 0.05,
                    }}
                    tex="a"
                  />

                  {/* 直线 b */}
                  <Segment3D
                    from={lineBStart}
                    to={lineBEnd}
                    colorKey="paramSecondary"
                    lineWidth={2.5}
                  />
                  <FormulaLabel3D
                    position={{
                      x: lineBEnd.x + 0.15,
                      y: lineBEnd.y + 0.15,
                      z: 0.05,
                    }}
                    tex="b"
                  />

                  {/* 交点 P 与两条直角标记 */}
                  {intersectType === 1 && (
                    <>
                      <Point3D
                        position={{ x: 0, y: 0, z: 0 }}
                        colorKey="paramPrimary"
                        radius={0.05}
                      />
                      <CompoundLabel3D
                        position={{ x: 0, y: 0, z: 0 }}
                        base="P"
                        colorKey="paramPrimary"
                        offset={[-0.2, -0.2, 0]}
                      />

                      {showAngleArc && (
                        <>
                          {/* 直角标记 1: l ⊥ a */}
                          <AngleArc3D
                            vertex={{ x: 0, y: 0, z: 0 }}
                            dirA={{ x: 0, y: 0, z: 1 }}
                            dirB={{ x: 1, y: 0, z: 0 }}
                            radius={0.45}
                            colorKey="paramPrimary"
                          />

                          {/* 直角标记 2: l ⊥ b */}
                          <AngleArc3D
                            vertex={{ x: 0, y: 0, z: 0 }}
                            dirA={{ x: 0, y: 0, z: 1 }}
                            dirB={{
                              x: Math.cos(Math.PI / 4),
                              y: Math.sin(Math.PI / 4),
                              z: 0,
                            }}
                            radius={0.6}
                            colorKey="paramSecondary"
                          />
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* 垂足 O */}
                  <Point3D
                    position={{ x: 0, y: 0, z: 0 }}
                    colorKey="paramPrimary"
                    radius={0.05}
                  />
                  <CompoundLabel3D
                    position={{ x: 0, y: 0, z: 0 }}
                    base="O"
                    colorKey="paramPrimary"
                    offset={[-0.2, -0.2, 0]}
                  />

                  {/* 面内任意直线 m */}
                  <Segment3D
                    from={{ x: -testMEnd.x, y: -testMEnd.y, z: 0 }}
                    to={testMEnd}
                    colorKey="paramSecondary"
                    lineWidth={2.5}
                  />
                  <FormulaLabel3D
                    position={{
                      x: testMEnd.x + 0.15,
                      y: testMEnd.y + 0.15,
                      z: 0.05,
                    }}
                    tex="m"
                  />

                  {/* 直角标记 l ⊥ m */}
                  {showAngleArc && (
                    <AngleArc3D
                      vertex={{ x: 0, y: 0, z: 0 }}
                      dirA={{ x: 0, y: 0, z: 2.5 }}
                      dirB={{ x: testMEnd.x, y: testMEnd.y, z: 0 }}
                      radius={0.55}
                      colorKey="highlight"
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* 空间向量法 */}
          {activeMode === "vector" && (
            <>
              <Vector3DArrow
                from={{ x: 0, y: 0, z: 0 }}
                to={normalEnd}
                colorKey="highlight"
              />
              <FormulaLabel3D
                position={{ x: 0.15, y: 0.15, z: 2.6 }}
                tex="\\vec{n}"
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
        </>
      )}
    </>
  );
};
