import { Html } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { KatexFormula } from "@/components/UI/KatexFormula";
import { mathToThree } from "@/math3d/coordinateConvention";
import type { Vec3 } from "@/math3d/vector3";

interface FormulaLabel3DProps {
  position: Vec3;
  tex: string;
  offset?: [number, number, number];
}

const MIN_SCALE = 0.65;
const MAX_SCALE = 1.5;

export const FormulaLabel3D = ({
  position,
  tex,
  offset = [0.2, 0.2, 0],
}: FormulaLabel3DProps) => {
  const { camera, invalidate } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(1);

  useFrame(() => {
    if (!groupRef.current) return;
    const dist = camera.position.distanceTo(groupRef.current.position);
    const next = THREE.MathUtils.clamp(dist * 0.1, MIN_SCALE, MAX_SCALE);
    if (Math.abs(next - scale) > 0.02) {
      setScale(next);
      invalidate();
    }
  });

  const [x, y, z] = mathToThree(position);

  return (
    <group
      ref={groupRef}
      position={[x + offset[0], y + offset[1], z + offset[2]]}
    >
      <Html center zIndexRange={[100, 0]} style={{ pointerEvents: "none" }}>
        <div
          style={{
            transform: `scale(${scale})`,
            background: "rgba(255,255,255,0.9)",
            padding: "2px 7px",
            borderRadius: "5px",
            boxShadow: "0 1px 4px rgba(15,23,42,0.18)",
            whiteSpace: "nowrap",
            transition: "transform 0.06s linear",
          }}
        >
          <KatexFormula formula={tex} mode="inline" />
        </div>
      </Html>
    </group>
  );
};
