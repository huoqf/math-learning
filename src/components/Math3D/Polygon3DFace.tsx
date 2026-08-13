import { useMemo } from "react";
import * as THREE from "three";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

interface Polygon3DFaceProps {
  /**
   * 按顺序传入多边形 3D 顶点 (支持 3 个或 4 个顶点)
   */
  points: Vec3[];
  colorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
}

export function Polygon3DFace({
  points,
  colorKey = "primary",
  opacity = 0.3,
}: Polygon3DFaceProps) {
  const geometry = useMemo(() => {
    if (points.length < 3) return null;
    const threePoints = points.map((p) => new THREE.Vector3(...mathToThree(p)));

    if (threePoints.length === 3) {
      const geom = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        threePoints[0].x,
        threePoints[0].y,
        threePoints[0].z,
        threePoints[1].x,
        threePoints[1].y,
        threePoints[1].z,
        threePoints[2].x,
        threePoints[2].y,
        threePoints[2].z,
      ]);
      geom.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      geom.computeVertexNormals();
      return geom;
    }

    if (threePoints.length === 4) {
      const geom = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        // 三角形 1: 0 -> 1 -> 2
        threePoints[0].x,
        threePoints[0].y,
        threePoints[0].z,
        threePoints[1].x,
        threePoints[1].y,
        threePoints[1].z,
        threePoints[2].x,
        threePoints[2].y,
        threePoints[2].z,
        // 三角形 2: 0 -> 2 -> 3
        threePoints[0].x,
        threePoints[0].y,
        threePoints[0].z,
        threePoints[2].x,
        threePoints[2].y,
        threePoints[2].z,
        threePoints[3].x,
        threePoints[3].y,
        threePoints[3].z,
      ]);
      geom.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      geom.computeVertexNormals();
      return geom;
    }

    return null;
  }, [points]);

  if (!geometry) return null;

  const colorHex = MATH_COLORS[colorKey] ?? MATH_COLORS.primary;

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color={colorHex}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
