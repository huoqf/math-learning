import { Edges } from "@react-three/drei";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";

interface ConeProps {
  radius: number;
  height: number;
  colorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
  segments?: number;
}

export const Cone = ({
  radius,
  height,
  colorKey = "primary",
  opacity = 0.3,
  segments = 32,
}: ConeProps) => (
  <mesh position={mathToThree({ x: 0, y: 0, z: height / 2 })}>
    <coneGeometry args={[radius, height, segments]} />
    <meshStandardMaterial
      color={MATH_COLORS[colorKey]}
      transparent
      opacity={opacity}
      side={2}
    />
    <Edges color={MATH_COLORS.line} />
  </mesh>
);
