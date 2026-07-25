import { Html } from "@react-three/drei";
import { KatexFormula } from "@/components/UI/KatexFormula";
import { mathToThree } from "@/math3d/coordinateConvention";
import { useFontScale3D } from "@/hooks/useFontScale3D";
import type { Vec3 } from "@/math3d/vector3";

interface Label3DProps {
  position: Vec3;
  tex: string;
  offset?: [number, number, number];
}

export const Label3D = ({
  position,
  tex,
  offset = [0.15, 0.15, 0],
}: Label3DProps) => {
  const distanceFactor = useFontScale3D();
  const [x, y, z] = mathToThree(position);
  return (
    <Html
      position={[x + offset[0], y + offset[1], z + offset[2]]}
      center
      occlude="blending"
      distanceFactor={distanceFactor}
      style={{ pointerEvents: "none" }}
    >
      <KatexFormula formula={tex} mode="inline" />
    </Html>
  );
};
