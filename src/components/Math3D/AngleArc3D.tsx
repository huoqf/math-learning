import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

export interface AngleArc3DProps {
  vertex: Vec3;
  dirA: Vec3;
  dirB: Vec3;
  radius?: number;
  colorKey?: keyof typeof MATH_COLORS;
  isRight?: boolean;
}

export const AngleArc3D = ({
  vertex,
  dirA,
  dirB,
  radius = 0.6,
  colorKey = "highlight",
  isRight = false,
}: AngleArc3DProps) => {
  const points = useMemo(() => {
    const o = new THREE.Vector3(...mathToThree(vertex));
    const a = new THREE.Vector3(...mathToThree(dirA)).normalize();
    const b = new THREE.Vector3(...mathToThree(dirB)).normalize();

    if (isRight) {
      // 空间直角方框折线：o + a*r -> o + a*r + b*r -> o + b*r
      const p1 = a.clone().multiplyScalar(radius).add(o);
      const p2 = a.clone().add(b).multiplyScalar(radius).add(o);
      const p3 = b.clone().multiplyScalar(radius).add(o);
      return [p1, p2, p3];
    }

    const axis = new THREE.Vector3().crossVectors(a, b).normalize();
    const angle = a.angleTo(b);
    const segments = 24;

    return Array.from({ length: segments + 1 }, (_, i) => {
      const q = new THREE.Quaternion().setFromAxisAngle(
        axis,
        (i / segments) * angle,
      );
      return a.clone().applyQuaternion(q).multiplyScalar(radius).add(o);
    });
  }, [vertex, dirA, dirB, radius, isRight]);

  return <Line points={points} color={MATH_COLORS[colorKey]} lineWidth={2} />;
};
