import { useMemo } from "react";
import * as THREE from "three";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

interface Plane3DProps {
  origin: Vec3;
  uAxis: Vec3;
  vAxis: Vec3;
  width?: number;
  height?: number;
  colorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
}

export const Plane3D = ({
  origin,
  uAxis,
  vAxis,
  width = 4,
  height = 4,
  colorKey = "secondary",
  opacity = 0.35,
}: Plane3DProps) => {
  const { position, quaternion } = useMemo(() => {
    const o = new THREE.Vector3(...mathToThree(origin));
    const u = new THREE.Vector3(...mathToThree(uAxis)).normalize();
    const v = new THREE.Vector3(...mathToThree(vAxis)).normalize();
    const n = new THREE.Vector3().crossVectors(u, v).normalize();
    const basis = new THREE.Matrix4().makeBasis(u, v, n);
    return {
      position: o,
      quaternion: new THREE.Quaternion().setFromRotationMatrix(basis),
    };
  }, [origin, uAxis, vAxis]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color={MATH_COLORS[colorKey]}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};
