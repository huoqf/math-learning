import React from "react";
import { Plane3D } from "@/components/Math3D/Plane3D";
import { Vector3DArrow } from "@/components/Math3D/Vector3DArrow";
import { CompoundLabel3D } from "@/components/Math3D/CompoundLabel3D";
import { Point3D } from "@/components/Math3D/Point3D";
import { Polygon3DFace } from "@/components/Math3D/Polygon3DFace";
import { AngleArc3D } from "@/components/Math3D/AngleArc3D";
import { projectPointOnSegment } from "@/math3d/vector3";

interface SurfaceGaokaoModelSceneProps {
  modelType: "pyramid" | "cube";
  pyramidA: number;
  pyramidB: number;
  pyramidH: number;
  posO: number;
  draggable?: boolean;
  onDragO?: (pos: number) => void;
}

export const SurfaceGaokaoModelScene: React.FC<
  SurfaceGaokaoModelSceneProps
> = ({
  modelType,
  pyramidA,
  pyramidB,
  pyramidH,
  posO,
  draggable = false,
  onDragO,
}) => {
  if (modelType === "cube") {
    // 正方体对角面平行模型：面 A1C1D // 面 AB1C
    const s = 3;
    const A = { x: -s / 2, y: -s / 2, z: 0 };
    const B = { x: s / 2, y: -s / 2, z: 0 };
    const C = { x: s / 2, y: s / 2, z: 0 };
    const D = { x: -s / 2, y: s / 2, z: 0 };

    const A1 = { x: -s / 2, y: -s / 2, z: s };
    const B1 = { x: s / 2, y: -s / 2, z: s };
    const C1 = { x: s / 2, y: s / 2, z: s };
    const D1 = { x: -s / 2, y: s / 2, z: s };

    return (
      <group>
        {/* 正方体 12 条框架棱线 */}
        {/* 下底面 */}
        <Vector3DArrow from={A} to={B} colorKey="grid" />
        <Vector3DArrow from={B} to={C} colorKey="grid" />
        <Vector3DArrow from={C} to={D} colorKey="grid" />
        <Vector3DArrow from={D} to={A} colorKey="grid" />
        {/* 上底面 */}
        <Vector3DArrow from={A1} to={B1} colorKey="grid" />
        <Vector3DArrow from={B1} to={C1} colorKey="grid" />
        <Vector3DArrow from={C1} to={D1} colorKey="grid" />
        <Vector3DArrow from={D1} to={A1} colorKey="grid" />
        {/* 侧棱 */}
        <Vector3DArrow from={A} to={A1} colorKey="grid" />
        <Vector3DArrow from={B} to={B1} colorKey="grid" />
        <Vector3DArrow from={C} to={C1} colorKey="grid" />
        <Vector3DArrow from={D} to={D1} colorKey="grid" />

        {/* 截面 1: 面 AB1C (高中经典对角截面，填充半透明面与高亮边框) */}
        <Polygon3DFace
          points={[A, B1, C]}
          colorKey="paramPrimary"
          opacity={0.22}
        />
        <Vector3DArrow from={A} to={B1} colorKey="paramPrimary" />
        <Vector3DArrow from={B1} to={C} colorKey="paramPrimary" />
        <Vector3DArrow from={C} to={A} colorKey="paramPrimary" />

        {/* 截面 2: 面 A1C1D (高中经典平行截面，填充半透明面与高亮边框) */}
        <Polygon3DFace
          points={[A1, C1, D]}
          colorKey="paramSecondary"
          opacity={0.22}
        />
        <Vector3DArrow from={A1} to={C1} colorKey="paramSecondary" />
        <Vector3DArrow from={C1} to={D} colorKey="paramSecondary" />
        <Vector3DArrow from={D} to={A1} colorKey="paramSecondary" />

        {/* 几何基准特征点 */}
        <Point3D position={A} colorKey="secondary" radius={0.045} />
        <Point3D position={B} colorKey="secondary" radius={0.045} />
        <Point3D position={C} colorKey="secondary" radius={0.045} />
        <Point3D position={D} colorKey="secondary" radius={0.045} />
        <Point3D position={A1} colorKey="secondary" radius={0.045} />
        <Point3D position={B1} colorKey="secondary" radius={0.045} />
        <Point3D position={C1} colorKey="secondary" radius={0.045} />
        <Point3D position={D1} colorKey="secondary" radius={0.045} />

        {/* 顶点标签（严格符合高中正方体命名与数学斜体下标格式） */}
        <CompoundLabel3D position={A} base="A" offset={[-0.22, -0.22, 0]} />
        <CompoundLabel3D position={B} base="B" offset={[0.22, -0.22, 0]} />
        <CompoundLabel3D position={C} base="C" offset={[0.22, 0.22, 0]} />
        <CompoundLabel3D position={D} base="D" offset={[-0.22, 0.22, 0]} />
        <CompoundLabel3D
          position={A1}
          base="A"
          subscript="1"
          offset={[-0.22, -0.22, 0.2]}
        />
        <CompoundLabel3D
          position={B1}
          base="B"
          subscript="1"
          offset={[0.22, -0.22, 0.2]}
        />
        <CompoundLabel3D
          position={C1}
          base="C"
          subscript="1"
          offset={[0.22, 0.22, 0.2]}
        />
        <CompoundLabel3D
          position={D1}
          base="D"
          subscript="1"
          offset={[-0.22, 0.22, 0.2]}
        />
      </group>
    );
  }

  // 四棱锥侧面垂直底面模型
  const A = { x: -pyramidA / 2, y: -pyramidB / 2, z: 0 };
  const B = { x: pyramidA / 2, y: -pyramidB / 2, z: 0 };
  const C = { x: pyramidA / 2, y: pyramidB / 2, z: 0 };
  const D = { x: -pyramidA / 2, y: pyramidB / 2, z: 0 };

  const O = { x: -pyramidA / 2, y: -pyramidB / 2 + pyramidB * posO, z: 0 };
  const P = {
    x: -pyramidA / 2,
    y: -pyramidB / 2 + pyramidB * posO,
    z: pyramidH,
  };

  return (
    <group>
      {/* 矩形底面 ABCD */}
      <Plane3D
        origin={{ x: 0, y: 0, z: 0 }}
        uAxis={{ x: 1, y: 0, z: 0 }}
        vAxis={{ x: 0, y: 1, z: 0 }}
        width={pyramidA}
        height={pyramidB}
        colorKey="secondary"
        opacity={0.16}
      />

      {/* 垂直侧面 PAD */}
      <Plane3D
        origin={{ x: -pyramidA / 2, y: 0, z: pyramidH / 2 }}
        uAxis={{ x: 0, y: 1, z: 0 }}
        vAxis={{ x: 0, y: 0, z: 1 }}
        width={pyramidB}
        height={pyramidH}
        colorKey="paramTertiary"
        opacity={0.18}
      />

      {/* 底面矩形棱线 */}
      <Vector3DArrow from={A} to={B} colorKey="secondary" />
      <Vector3DArrow from={B} to={C} colorKey="secondary" />
      <Vector3DArrow from={C} to={D} colorKey="secondary" />
      <Vector3DArrow from={D} to={A} colorKey="secondary" />

      {/* 侧棱 PA, PB, PC, PD */}
      <Vector3DArrow from={P} to={A} colorKey="paramTertiary" />
      <Vector3DArrow from={P} to={B} colorKey="secondary" />
      <Vector3DArrow from={P} to={C} colorKey="secondary" />
      <Vector3DArrow from={P} to={D} colorKey="paramTertiary" />

      {/* 四棱锥高线 PO 垂直于交线 AD（核心辅助线） */}
      <Vector3DArrow from={P} to={O} colorKey="paramPrimary" />

      {/* 垂足 O 处的双直角角弧: 1. PO ⊥ AD  2. PO ⊥ AB (底面) */}
      <AngleArc3D
        vertex={O}
        dirA={{ x: 0, y: 1, z: 0 }}
        dirB={{ x: 0, y: 0, z: 1 }}
        radius={0.45}
        colorKey="paramPrimary"
      />
      <AngleArc3D
        vertex={O}
        dirA={{ x: 1, y: 0, z: 0 }}
        dirB={{ x: 0, y: 0, z: 1 }}
        radius={0.45}
        colorKey="paramSecondary"
      />

      {/* 顶点实体点 */}
      <Point3D position={P} colorKey="paramPrimary" radius={0.05} />
      <Point3D position={A} colorKey="secondary" radius={0.045} />
      <Point3D position={B} colorKey="secondary" radius={0.045} />
      <Point3D position={C} colorKey="secondary" radius={0.045} />
      <Point3D position={D} colorKey="secondary" radius={0.045} />

      {/* 垂足 O 点 (严格使用 projectPointOnSegment 约束在底棱 A->D 上滑动) */}
      <Point3D
        position={O}
        colorKey="highlight"
        draggable={draggable}
        constrain={(raw) => projectPointOnSegment(raw, A, D).point}
        onDrag={(next) => {
          const proj = projectPointOnSegment(next, A, D);
          onDragO?.(Number(proj.t.toFixed(2)));
        }}
      />

      {/* 顶点与垂足标签 */}
      <CompoundLabel3D
        position={P}
        base="P"
        offset={[0, 0, 0.22]}
        colorKey="paramPrimary"
      />
      <CompoundLabel3D
        position={A}
        base="A"
        offset={[-0.22, -0.22, 0]}
        colorKey="label"
      />
      <CompoundLabel3D
        position={B}
        base="B"
        offset={[0.22, -0.22, 0]}
        colorKey="label"
      />
      <CompoundLabel3D
        position={C}
        base="C"
        offset={[0.22, 0.22, 0]}
        colorKey="label"
      />
      <CompoundLabel3D
        position={D}
        base="D"
        offset={[-0.22, 0.22, 0]}
        colorKey="label"
      />
      <CompoundLabel3D
        position={O}
        base="O"
        offset={[-0.26, 0, 0]}
        colorKey="highlight"
      />
    </group>
  );
};
