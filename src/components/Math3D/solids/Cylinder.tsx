import { Edges } from "@react-three/drei";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";

interface CylinderProps {
  radius: number;
  height: number;
  colorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
  segments?: number;
}

export const Cylinder = ({
  radius,
  height,
  colorKey = "primary",
  opacity = 0.3,
  segments = 32,
}: CylinderProps) => (
  <mesh position={mathToThree({ x: 0, y: 0, z: height / 2 })}>
    <cylinderGeometry args={[radius, radius, height, segments]} />
    <meshStandardMaterial
      color={MATH_COLORS[colorKey]}
      transparent
      opacity={opacity}
      side={2}
    />
    <Edges color={MATH_COLORS.line} />
  </mesh>
);
