import { Edges } from "@react-three/drei";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";

interface RegularPyramidProps {
  sides: number;
  baseRadius: number;
  height: number;
  colorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
}

export const RegularPyramid = ({
  sides,
  baseRadius,
  height,
  colorKey = "primary",
  opacity = 0.3,
}: RegularPyramidProps) => (
  <mesh
    position={mathToThree({ x: 0, y: 0, z: height / 2 })}
    rotation={[0, Math.PI / sides, 0]}
  >
    <coneGeometry args={[baseRadius, height, sides]} />
    <meshStandardMaterial
      color={MATH_COLORS[colorKey]}
      transparent
      opacity={opacity}
      side={2}
    />
    <Edges color={MATH_COLORS.line} />
  </mesh>
);
