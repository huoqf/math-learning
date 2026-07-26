import { Edges } from "@react-three/drei";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";

interface CuboidProps {
  a: number;
  b: number;
  c: number;
  colorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
}

/**
 * 长方体组件
 *
 * a = x 方向棱长, b = y 方向棱长, c = z 方向棱长（竖直）
 * three.js boxGeometry args: [width(x), height(z竖直), depth(y)]
 */
export const Cuboid = ({
  a,
  b,
  c,
  colorKey = "primary",
  opacity = 0.25,
}: CuboidProps) => (
  <mesh position={mathToThree({ x: 0, y: 0, z: c / 2 })}>
    <boxGeometry args={[a, c, b]} />
    <meshStandardMaterial
      color={MATH_COLORS[colorKey]}
      transparent
      opacity={opacity}
      side={2}
      depthWrite={false}
    />
    <Edges color={MATH_COLORS.line} />
  </mesh>
);
