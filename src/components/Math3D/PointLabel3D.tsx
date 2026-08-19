import { Text, Billboard } from "@react-three/drei";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";
import { FONT_3D } from "@/assets/fonts";
import { useLabelRegistry } from "./internal/useLabelRegistry";
import type { Vec3 } from "@/math3d/vector3";

interface PointLabel3DProps {
  position: Vec3;
  text: string;
  variant?: "regular" | "italic";
  colorKey?: keyof typeof MATH_COLORS;
  offset?: [number, number, number];
  fontSize?: number;
}

export const PointLabel3D = ({
  position,
  text,
  variant = "italic",
  colorKey = "label",
  offset = [0.18, 0.18, 0],
  fontSize = 0.28,
}: PointLabel3DProps) => {
  const [x, y, z] = mathToThree(position);

  useLabelRegistry(
    { x: x + offset[0], y: y + offset[1], z: z + offset[2] },
    text,
  );

  return (
    <Billboard position={[x + offset[0], y + offset[1], z + offset[2]]} follow>
      <Text
        font={variant === "italic" ? FONT_3D.italic : FONT_3D.regular}
        fontSize={fontSize}
        color={MATH_COLORS[colorKey]}
        anchorX="left"
        anchorY="middle"
        renderOrder={999}
        material-depthTest={false}
        material-transparent
      >
        {text}
      </Text>
    </Billboard>
  );
};
