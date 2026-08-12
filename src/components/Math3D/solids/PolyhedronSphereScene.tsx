import { useMemo } from "react";
import { Point3D } from "../Point3D";
import { PointLabel3D } from "../PointLabel3D";
import { CompoundLabel3D } from "../CompoundLabel3D";
import { Vector3DArrow } from "../Vector3DArrow";
import { CircumSphere } from "./CircumSphere";
import { Cuboid } from "./Cuboid";
import { TriangularPrism } from "./TriangularPrism";
import {
  calculateCornerModel,
  calculateCylinderModel,
  calculateComplementModel,
} from "@/math3d/polyhedronSphere";
import { mathToThree } from "@/math3d/coordinateConvention";
import { Line } from "@react-three/drei";
import type { Vec3 } from "@/math3d/vector3";

interface PolyhedronSphereSceneProps {
  modelType: "corner" | "cylinder" | "complement";
  params: Record<string, number>;
  showComplementFrame?: boolean;
  showSphere?: boolean;
}

export function PolyhedronSphereScene({
  modelType,
  params,
  showComplementFrame = true,
  showSphere = true,
}: PolyhedronSphereSceneProps) {
  const a = params.a ?? 3;
  const b = params.b ?? 4;
  const c = params.c ?? 5;
  const h = params.h ?? 4;

  const cornerData = useMemo(() => calculateCornerModel(a, b, c), [a, b, c]);
  const cylinderData = useMemo(
    () => calculateCylinderModel(a, b, h),
    [a, b, h],
  );
  const complementData = useMemo(
    () => calculateComplementModel(a, b, c),
    [a, b, c],
  );

  if (modelType === "corner") {
    // 1. 墙角模型
    const { P, A, B, C } = cornerData.pyramidVertices;
    const { center, radius } = cornerData;
    const oppositeP: Vec3 = { x: a, y: b, z: c };

    const linesPyramid: [Vec3, Vec3][] = [
      [P, A],
      [P, B],
      [P, C],
      [A, B],
      [B, C],
      [C, A],
    ];

    return (
      <group>
        {/* 三棱锥 P-ABC 的实线棱 */}
        {linesPyramid.map(([from, to], idx) => {
          const p1 = mathToThree(from);
          const p2 = mathToThree(to);
          return (
            <Line
              key={`pyr-edge-${idx}`}
              points={[p1, p2]}
              color="#EF4444"
              lineWidth={3}
            />
          );
        })}

        {/* 顶点 P, A, B, C */}
        <Point3D position={P} colorKey="primary" />
        <PointLabel3D position={P} text="P" />
        <Point3D position={A} colorKey="primary" />
        <PointLabel3D position={A} text="A" />
        <Point3D position={B} colorKey="primary" />
        <PointLabel3D position={B} text="B" />
        <Point3D position={C} colorKey="primary" />
        <PointLabel3D position={C} text="C" />

        {/* 补形长方体框架 */}
        {showComplementFrame && (
          <group>
            <Cuboid a={a} b={b} c={c} colorKey="secondary" opacity={0.12} />
            {/* 长方体对角线 P-P' */}
            <Line
              points={[mathToThree(P), mathToThree(oppositeP)]}
              color="#F59E0B"
              lineWidth={2}
              dashed
              dashScale={10}
            />
            <Point3D position={oppositeP} colorKey="secondary" />
            <PointLabel3D position={oppositeP} text="P'" />
          </group>
        )}

        {/* 球心 O 与外接球 */}
        <Point3D position={center} colorKey="highlight" />
        <PointLabel3D position={center} text="O" />
        <Vector3DArrow from={center} to={oppositeP} colorKey="highlight" />

        {showSphere && (
          <CircumSphere center={center} radius={radius} opacity={0.18} />
        )}
      </group>
    );
  }

  if (modelType === "cylinder") {
    // 2. 柱体模型（直三棱柱，原点为直角顶点 C）
    const {
      bottomVertices,
      topVertices,
      bottomCenter,
      topCenter,
      center,
      radius,
    } = cylinderData;
    const [C, A, B] = bottomVertices; // C(0,0,0) 为直角顶点, A(a,0,0), B(0,b,0)
    const [C1, A1, B1] = topVertices;

    return (
      <group>
        {/* 直三棱柱主体 */}
        <TriangularPrism
          legA={a}
          legB={b}
          height={h}
          colorKey="primary"
          opacity={0.15}
        />

        {/* 下底面顶点 C, A, B */}
        <Point3D position={C} colorKey="primary" />
        <PointLabel3D position={C} text="C" />
        <Point3D position={A} colorKey="primary" />
        <PointLabel3D position={A} text="A" />
        <Point3D position={B} colorKey="primary" />
        <PointLabel3D position={B} text="B" />

        {/* 上底面顶点 C1, A1, B1 */}
        <Point3D position={C1} colorKey="primary" />
        <CompoundLabel3D position={C1} base="C" subscript="1" />
        <Point3D position={A1} colorKey="primary" />
        <CompoundLabel3D position={A1} base="A" subscript="1" />
        <Point3D position={B1} colorKey="primary" />
        <CompoundLabel3D position={B1} base="B" subscript="1" />

        {/* 轴线与底面外接圆心 O1, O2 */}
        {showComplementFrame && (
          <group>
            {/* 轴线 O1-O2 */}
            <Line
              points={[mathToThree(bottomCenter), mathToThree(topCenter)]}
              color="#10B981"
              lineWidth={2}
              dashed
              dashScale={12}
            />
            <Point3D position={bottomCenter} colorKey="secondary" />
            <CompoundLabel3D position={bottomCenter} base="O" subscript="1" />
            <Point3D position={topCenter} colorKey="secondary" />
            <CompoundLabel3D position={topCenter} base="O" subscript="2" />

            {/* 勾股直角三角形 O-O1-A */}
            <Line
              points={[mathToThree(bottomCenter), mathToThree(A)]}
              color="#F59E0B"
              lineWidth={2.5}
            />
            <Line
              points={[mathToThree(center), mathToThree(bottomCenter)]}
              color="#10B981"
              lineWidth={2.5}
            />
            <Vector3DArrow from={center} to={A} colorKey="highlight" />
          </group>
        )}

        {/* 球心 O 与外接球 */}
        <Point3D position={center} colorKey="highlight" />
        <PointLabel3D position={center} text="O" />

        {showSphere && (
          <CircumSphere center={center} radius={radius} opacity={0.18} />
        )}
      </group>
    );
  }

  // 3. 补形模型 (对棱相等四面体 A-BCD)
  const { tetrahedronVertices, boxDimensions, center, radius, isValid } =
    complementData;
  const [A, B, C, D] = tetrahedronVertices;

  const tetrahedronEdges: [Vec3, Vec3, string][] = [
    [A, B, "#EF4444"], // 对棱 a (AB)
    [C, D, "#EF4444"], // 对棱 a (CD)
    [A, C, "#3B82F6"], // 对棱 b (AC)
    [B, D, "#3B82F6"], // 对棱 b (BD)
    [A, D, "#10B981"], // 对棱 c (AD)
    [B, C, "#10B981"], // 对棱 c (BC)
  ];

  return (
    <group>
      {/* 4 个四面体顶点 A, B, C, D */}
      <Point3D position={A} colorKey="highlight" />
      <PointLabel3D position={A} text="A" />
      <Point3D position={B} colorKey="highlight" />
      <PointLabel3D position={B} text="B" />
      <Point3D position={C} colorKey="highlight" />
      <PointLabel3D position={C} text="C" />
      <Point3D position={D} colorKey="highlight" />
      <PointLabel3D position={D} text="D" />

      {/* 6 条四面体对棱 (相同颜色标出相等对棱) */}
      {tetrahedronEdges.map(([from, to, color], idx) => (
        <Line
          key={`tet-edge-${idx}`}
          points={[mathToThree(from), mathToThree(to)]}
          color={color}
          lineWidth={3.5}
        />
      ))}

      {/* 补形长方体 */}
      {showComplementFrame && isValid && (
        <group>
          <Cuboid
            a={boxDimensions.x}
            b={boxDimensions.y}
            c={boxDimensions.z}
            colorKey="secondary"
            opacity={0.12}
          />
          {/* 长方体对角线 A-B */}
          <Line
            points={[mathToThree(A), mathToThree(B)]}
            color="#F59E0B"
            lineWidth={2}
            dashed
            dashScale={10}
          />
        </group>
      )}

      {/* 球心 O 与外接球 */}
      <Point3D position={center} colorKey="highlight" />
      <PointLabel3D position={center} text="O" />
      <Vector3DArrow from={center} to={B} colorKey="highlight" />

      {showSphere && (
        <CircumSphere center={center} radius={radius} opacity={0.18} />
      )}
    </group>
  );
}
