import { useMemo } from "react";
import * as THREE from "three";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

interface InSphereProps {
  center: Vec3;
  radius: number;
}

export const InSphere = ({ center, radius }: InSphereProps) => {
  const pos = mathToThree(center);

  const wireframeGeo = useMemo(
    () => new THREE.SphereGeometry(radius, 32, 24),
    [radius],
  );

  return (
    <group renderOrder={10}>
      {/* 实体球体，提高透明度 */}
      <mesh position={pos}>
        <sphereGeometry args={[radius, 48, 32]} />
        <meshStandardMaterial
          color={MATH_COLORS.inSphereShell}
          transparent
          opacity={0.35}
          roughness={0.4}
          metalness={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* 线框增强边界可读性 */}
      <mesh position={pos} geometry={wireframeGeo}>
        <meshBasicMaterial
          color={MATH_COLORS.highlight}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
};
