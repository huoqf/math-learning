/**
 * 旋转体“侧面展开最短路径（化曲为直）”3D 可展弯曲子场景
 * 消费 src/math3d/rotationUnfold.ts 的连续等距展开网格与表面最短路径采样点
 */
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { FormulaLabel3D, Point3D, PointLabel3D } from "@/components/Math3D";
import { DepthPrepassMesh } from "@/components/Math3D/solids";
import { mathToThree } from "@/math3d/coordinateConvention";
import { buildRotationUnfoldData } from "@/math3d/rotationUnfold";
import type { Vec3 } from "@/math3d/vector3";
import { MATH_COLORS } from "@/theme";

interface RotationUnfoldModeSceneProps {
  shape: "rectangle" | "rightTriangle" | "rightTrapezoid";
  r1: number;
  r2: number;
  height: number;
  unfoldProgress: number;
}

const toThreeVectors = (pts: Vec3[]): THREE.Vector3[] =>
  pts.map((pt) => new THREE.Vector3(...mathToThree(pt)));

export default function RotationUnfoldModeScene({
  shape,
  r1,
  r2,
  height,
  unfoldProgress,
}: RotationUnfoldModeSceneProps) {
  const unfoldType =
    shape === "rectangle"
      ? "cylinder"
      : shape === "rightTriangle"
        ? "cone"
        : "frustum";

  const unfoldData = useMemo(
    () =>
      buildRotationUnfoldData({
        type: unfoldType,
        r1,
        r2,
        height,
        unfoldProgress,
      }),
    [unfoldType, r1, r2, height, unfoldProgress],
  );

  const surfaceGeometry = useMemo(() => {
    const grid = unfoldData.gridPoints;
    const rows = grid.length;
    const cols = rows > 0 ? grid[0].length : 0;
    const geo = new THREE.BufferGeometry();
    if (rows < 2 || cols < 2) return geo;

    const positions: number[] = [];
    const indices: number[] = [];
    for (let iv = 0; iv < rows; iv++) {
      for (let iu = 0; iu < cols; iu++) {
        const [x, y, z] = mathToThree(grid[iv][iu]);
        positions.push(x, y, z);
      }
    }
    for (let iv = 0; iv < rows - 1; iv++) {
      for (let iu = 0; iu < cols - 1; iu++) {
        const a = iv * cols + iu;
        const b = a + 1;
        const c = (iv + 1) * cols + iu + 1;
        const d = (iv + 1) * cols + iu;
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [unfoldData.gridPoints]);

  useEffect(() => {
    return () => {
      surfaceGeometry.dispose();
    };
  }, [surfaceGeometry]);

  const geodesicPts3 = useMemo(
    () => toThreeVectors(unfoldData.geodesicPoints),
    [unfoldData.geodesicPoints],
  );
  const seamLeftPts3 = useMemo(
    () => toThreeVectors(unfoldData.seamLeftLine),
    [unfoldData.seamLeftLine],
  );
  const seamRightPts3 = useMemo(
    () => toThreeVectors(unfoldData.seamRightLine),
    [unfoldData.seamRightLine],
  );
  const bottomArcPts3 = useMemo(
    () => toThreeVectors(unfoldData.bottomArcLine),
    [unfoldData.bottomArcLine],
  );
  const topArcPts3 = useMemo(
    () => toThreeVectors(unfoldData.topArcLine),
    [unfoldData.topArcLine],
  );

  const endLabelTex =
    shape === "rectangle" ? "A_1" : shape === "rightTriangle" ? "A'" : "B";

  return (
    <group renderOrder={5}>
      <DepthPrepassMesh geometry={surfaceGeometry} />
      <mesh geometry={surfaceGeometry}>
        <meshStandardMaterial
          color={MATH_COLORS.primary}
          transparent
          opacity={0.28}
          roughness={0.55}
          metalness={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 底圆弧与顶圆弧边界 */}
      <Line points={bottomArcPts3} color={MATH_COLORS.line} lineWidth={2} />
      {shape !== "rightTriangle" && (
        <Line points={topArcPts3} color={MATH_COLORS.line} lineWidth={2} />
      )}

      {/* 剖开剪缝母线 */}
      <Line
        points={seamLeftPts3}
        color={MATH_COLORS.paramSecondary}
        lineWidth={2.4}
      />
      <Line
        points={seamRightPts3}
        color={MATH_COLORS.paramSecondary}
        lineWidth={2.4}
      />

      {/* 表面最短路径折线/曲线 */}
      <Line
        points={geodesicPts3}
        color={MATH_COLORS.paramPrimary}
        lineWidth={3.6}
      />

      {/* 起点 A 与终点 A_1 / A' / B */}
      <Point3D position={unfoldData.startPoint} colorKey="paramPrimary" />
      <PointLabel3D
        position={unfoldData.startPoint}
        text="A"
        offset={[-0.2, -0.15, 0.1]}
      />
      <Point3D position={unfoldData.endPoint} colorKey="paramTertiary" />
      <FormulaLabel3D
        position={unfoldData.endPoint}
        tex={endLabelTex}
        offset={[0.18, 0.1, 0.12]}
      />
    </group>
  );
}
