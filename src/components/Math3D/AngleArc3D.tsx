import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

interface AngleArc3DProps {
  vertex: Vec3;
  dirA: Vec3;
  dirB: Vec3;
  radius?: number;
  colorKey?: keyof typeof MATH_COLORS;
}

export const AngleArc3D = ({
  vertex,
  dirA,
  dirB,
  radius = 0.6,
  colorKey = "highlight",
}: AngleArc3DProps) => {
  const points = useMemo(() => {
    const o = new THREE.Vector3(...mathToThree(vertex));
    const a = new THREE.Vector3(...mathToThree(dirA)).normalize();
    const b = new THREE.Vector3(...mathToThree(dirB)).normalize();

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
  }, [vertex, dirA, dirB, radius]);

  return <Line points={points} color={MATH_COLORS[colorKey]} lineWidth={2} />;
};
