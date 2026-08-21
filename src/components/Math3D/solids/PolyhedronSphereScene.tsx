import { useMemo } from "react";
import * as THREE from "three";
import { Point3D } from "../Point3D";
import { PointLabel3D } from "../PointLabel3D";
import { CompoundLabel3D } from "../CompoundLabel3D";
import { FormulaLabel3D } from "../FormulaLabel3D";
import { Segment3D } from "../Segment3D";
import { CircumSphere } from "./CircumSphere";
import { Cuboid } from "./Cuboid";
import { TriangularPrism } from "./TriangularPrism";
import {
  calculateCornerModel,
  calculateCylinderModel,
  calculateComplementModel,
  calculateVerticalEdgeModel,
  calculateInSphereModel,
} from "@/math3d/polyhedronSphere";
import { InSphere } from "./InSphere";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

interface PolyhedronSphereSceneProps {
  modelType: "corner" | "cylinder" | "complement" | "verticalEdge" | "inSphere";
  params: Record<string, number>;
  showComplementFrame?: boolean;
  showSphere?: boolean;
  showRadiusLines?: boolean;
}

/**
 * 渲染三棱锥 P-ABC 的 4 个半透明 Mesh 实体面 (完全基于主题 Token)
 */
function TetrahedronSolidMesh({
  P,
  A,
  B,
  C,
  colorKey = "primary",
  opacity = 0.18,
}: {
  P: Vec3;
  A: Vec3;
  B: Vec3;
  C: Vec3;
  colorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
}) {
  const positions = useMemo(() => {
    const pP = mathToThree(P);
    const pA = mathToThree(A);
    const pB = mathToThree(B);
    const pC = mathToThree(C);

    return new Float32Array([
      // 底面 ABC
      ...pA,
      ...pB,
      ...pC,
      // 侧面 PAC
      ...pP,
      ...pA,
      ...pC,
      // 侧面 PBC
      ...pP,
      ...pB,
      ...pC,
      // 斜面 PAB
      ...pP,
      ...pA,
      ...pB,
    ]);
  }, [P, A, B, C]);

  const colorHex = MATH_COLORS[colorKey] ?? MATH_COLORS.primary;

  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <meshStandardMaterial
        color={colorHex}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export function PolyhedronSphereScene({
  modelType,
  params,
  showComplementFrame = true,
  showSphere = true,
  showRadiusLines = true,
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
  const verticalEdgeData = useMemo(
    () => calculateVerticalEdgeModel(a, b, h),
    [a, b, h],
  );
  const inSphereData = useMemo(
    () => calculateInSphereModel(a, b, c),
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
        {/* 半透明三棱锥实体面 */}
        <TetrahedronSolidMesh
          P={P}
          A={A}
          B={B}
          C={C}
          colorKey="paramPrimary"
          opacity={0.15}
        />

        {/* 三棱锥 P-ABC 的实线棱 (规范 Segment3D) */}
        {linesPyramid.map(([from, to], idx) => (
          <Segment3D
            key={`pyr-edge-${idx}`}
            from={from}
            to={to}
            colorKey="paramPrimary"
            lineWidth={3}
          />
        ))}

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
            {/* 长方体体对角线 P-P' */}
            <Segment3D
              from={P}
              to={oppositeP}
              colorKey="paramSecondary"
              lineWidth={2.5}
              dashed
            />
            <Point3D position={oppositeP} colorKey="secondary" />
            <FormulaLabel3D position={oppositeP} tex="P'" />
          </group>
        )}

        {/* 球心 O 与外接球 */}
        <Point3D position={center} colorKey="highlight" />
        <PointLabel3D position={center} text="O" />
        <Segment3D
          from={center}
          to={oppositeP}
          colorKey="highlight"
          lineWidth={3}
        />

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
            <Segment3D
              from={bottomCenter}
              to={topCenter}
              colorKey="paramTertiary"
              lineWidth={2}
              dashed
            />
            <Point3D position={bottomCenter} colorKey="secondary" />
            <CompoundLabel3D position={bottomCenter} base="O" subscript="1" />
            <Point3D position={topCenter} colorKey="secondary" />
            <CompoundLabel3D position={topCenter} base="O" subscript="2" />

            {/* 勾股直角三角形 O-O1-A */}
            <Segment3D
              from={bottomCenter}
              to={A}
              colorKey="paramSecondary"
              lineWidth={2.5}
            />
            <Segment3D
              from={center}
              to={bottomCenter}
              colorKey="paramTertiary"
              lineWidth={2.5}
            />
            <Segment3D
              from={center}
              to={A}
              colorKey="highlight"
              lineWidth={3}
            />
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
  if (modelType === "complement") {
    const { tetrahedronVertices, boxDimensions, center, radius, isValid } =
      complementData;
    const [A, B, C, D] = tetrahedronVertices;

    const tetrahedronEdges: [Vec3, Vec3, keyof typeof MATH_COLORS][] = [
      [A, B, "paramPrimary"], // 对棱 a (AB)
      [C, D, "paramPrimary"], // 对棱 a (CD)
      [A, C, "primary"], // 对棱 b (AC)
      [B, D, "primary"], // 对棱 b (BD)
      [A, D, "paramTertiary"], // 对棱 c (AD)
      [B, C, "paramTertiary"], // 对棱 c (BC)
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
        {tetrahedronEdges.map(([from, to, colorKey], idx) => (
          <Segment3D
            key={`tet-edge-${idx}`}
            from={from}
            to={to}
            colorKey={colorKey}
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
            {/* 长方体面对角线 A-B */}
            <Segment3D
              from={A}
              to={B}
              colorKey="paramSecondary"
              lineWidth={2}
              dashed
            />
          </group>
        )}

        {/* 球心 O 与外接球 */}
        <Point3D position={center} colorKey="highlight" />
        <PointLabel3D position={center} text="O" />
        <Segment3D from={center} to={B} colorKey="highlight" lineWidth={3} />

        {showSphere && (
          <CircumSphere center={center} radius={radius} opacity={0.18} />
        )}
      </group>
    );
  }

  if (modelType === "verticalEdge") {
    // 4. 侧棱垂直底面模型（汉堡模型 / 垂直底面侧棱三棱锥 P-ABC）
    const { bottomVertices, topP, bottomCenter, center, radius } =
      verticalEdgeData;
    const { A, B, C } = bottomVertices;

    const linesPyramid: [Vec3, Vec3][] = [
      [topP, A],
      [topP, B],
      [topP, C],
      [A, B],
      [B, C],
      [C, A],
    ];

    return (
      <group>
        {/* 半透明三棱锥实体面 */}
        <TetrahedronSolidMesh
          P={topP}
          A={A}
          B={B}
          C={C}
          colorKey="paramPrimary"
          opacity={0.15}
        />

        {/* 三棱锥 P-ABC 的实线棱 */}
        {linesPyramid.map(([from, to], idx) => (
          <Segment3D
            key={`vert-edge-${idx}`}
            from={from}
            to={to}
            colorKey="paramPrimary"
            lineWidth={3}
          />
        ))}

        {/* 顶点 P, A, B, C */}
        <Point3D position={topP} colorKey="primary" />
        <PointLabel3D position={topP} text="P" />
        <Point3D position={A} colorKey="primary" />
        <PointLabel3D position={A} text="A" />
        <Point3D position={B} colorKey="primary" />
        <PointLabel3D position={B} text="B" />
        <Point3D position={C} colorKey="primary" />
        <PointLabel3D position={C} text="C" />

        {/* 底面外接圆心 O1 与柱体辅助线条 */}
        {showComplementFrame && (
          <group>
            {/* 补形套柱辅助线条 */}
            <TriangularPrism
              legA={a}
              legB={b}
              height={h}
              colorKey="secondary"
              opacity={0.08}
            />

            {/* 轴线 O1-O */}
            <Segment3D
              from={bottomCenter}
              to={center}
              colorKey="paramTertiary"
              lineWidth={2.5}
              dashed
            />
            <Point3D position={bottomCenter} colorKey="secondary" />
            <CompoundLabel3D position={bottomCenter} base="O" subscript="1" />

            {/* 底面外接圆半径 r_base 线段 O1-B */}
            <Segment3D
              from={bottomCenter}
              to={B}
              colorKey="paramSecondary"
              lineWidth={2.5}
            />
            {/* 勾股外接球半径线段 O-B */}
            <Segment3D
              from={center}
              to={B}
              colorKey="highlight"
              lineWidth={3}
            />
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

  // 5. 内切球模型 (等体积法 - 剖分 4 个面上相切)
  const { pyramidVertices, center, inRadius } = inSphereData;
  const { P, A, B, C } = pyramidVertices;
  const r = inRadius;

  const linesPyramid: [Vec3, Vec3][] = [
    [P, A],
    [P, B],
    [P, C],
    [A, B],
    [B, C],
    [C, A],
  ];

  // 求解内切球在 4 个面上的垂直切点:
  // 1. 底面 ABC (z=0): T1 = (r, r, 0)
  const T1: Vec3 = { x: r, y: r, z: 0 };
  // 2. 侧面 PAC (y=0): T2 = (r, 0, r)
  const T2: Vec3 = { x: r, y: 0, z: r };
  // 3. 侧面 PBC (x=0): T3 = (0, r, r)
  const T3: Vec3 = { x: 0, y: r, z: r };
  // 4. 斜面 PAB (bc x + ac y + ab z = abc):
  const normLen = Math.sqrt(b * b * c * c + a * a * c * c + a * a * b * b);
  const nx = (b * c) / normLen;
  const ny = (a * c) / normLen;
  const nz = (a * b) / normLen;
  const T4: Vec3 = {
    x: center.x + r * nx,
    y: center.y + r * ny,
    z: center.z + r * nz,
  };

  return (
    <group>
      {/* 半透明三棱锥容器实体面 */}
      <TetrahedronSolidMesh
        P={P}
        A={A}
        B={B}
        C={C}
        colorKey="primary"
        opacity={0.22}
      />

      {/* 三棱锥棱 */}
      {linesPyramid.map(([from, to], idx) => (
        <Segment3D
          key={`in-edge-${idx}`}
          from={from}
          to={to}
          colorKey="primary"
          lineWidth={3.5}
        />
      ))}

      {/* 顶点 P, A, B, C */}
      <Point3D position={P} colorKey="primary" radius={0.06} />
      <PointLabel3D position={P} text="P" />
      <Point3D position={A} colorKey="primary" radius={0.06} />
      <PointLabel3D position={A} text="A" />
      <Point3D position={B} colorKey="primary" radius={0.06} />
      <PointLabel3D position={B} text="B" />
      <Point3D position={C} colorKey="primary" radius={0.06} />
      <PointLabel3D position={C} text="C" />

      {/* 内切球心 O_in */}
      <Point3D position={center} colorKey="highlight" radius={0.055} />
      <CompoundLabel3D position={center} base="O" subscript="in" />

      {/* 4 个切点与 4 条垂直半径垂线段 r_in */}
      {showRadiusLines && (
        <group>
          {/* 切点 T1 (底面 ABC) */}
          <Point3D position={T1} colorKey="secondary" radius={0.045} />
          <CompoundLabel3D position={T1} base="T" subscript="1" />
          <Segment3D
            from={center}
            to={T1}
            colorKey="paramPrimary"
            lineWidth={2.5}
          />

          {/* 切点 T2 (侧面 PAC) */}
          <Point3D position={T2} colorKey="secondary" radius={0.045} />
          <CompoundLabel3D position={T2} base="T" subscript="2" />
          <Segment3D
            from={center}
            to={T2}
            colorKey="paramPrimary"
            lineWidth={2.5}
          />

          {/* 切点 T3 (侧面 PBC) */}
          <Point3D position={T3} colorKey="secondary" radius={0.045} />
          <CompoundLabel3D position={T3} base="T" subscript="3" />
          <Segment3D
            from={center}
            to={T3}
            colorKey="paramPrimary"
            lineWidth={2.5}
          />

          {/* 切点 T4 (斜面 PAB) */}
          <Point3D position={T4} colorKey="secondary" radius={0.045} />
          <CompoundLabel3D position={T4} base="T" subscript="4" />
          <Segment3D
            from={center}
            to={T4}
            colorKey="paramPrimary"
            lineWidth={2.5}
          />
        </group>
      )}

      {showSphere && (
        <InSphere center={center} radius={inRadius} opacity={0.35} />
      )}
    </group>
  );
}
