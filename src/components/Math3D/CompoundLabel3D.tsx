import { Billboard, Text } from "@react-three/drei";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";
import { FONT_3D } from "@/assets/fonts";
import type { Vec3 } from "@/math3d/vector3";

interface CompoundLabel3DProps {
  position: Vec3;
  base: string;
  subscript?: string;
  variant?: "regular" | "italic";
  colorKey?: keyof typeof MATH_COLORS;
  fontSize?: number;
  offset?: [number, number, number];
}

export const CompoundLabel3D = ({
  position,
  base,
  subscript,
  variant = "italic",
  colorKey = "label",
  fontSize = 0.26,
  offset = [0.16, 0.16, 0],
}: CompoundLabel3DProps) => {
  const [x, y, z] = mathToThree(position);
  const color = MATH_COLORS[colorKey];

  return (
    <Billboard position={[x + offset[0], y + offset[1], z + offset[2]]} follow>
      <Text
        font={variant === "italic" ? FONT_3D.italic : FONT_3D.regular}
        fontSize={fontSize}
        color={color}
        anchorX="left"
        anchorY="middle"
        material-depthTest={false}
        renderOrder={999}
      >
        {base}
      </Text>
      {subscript && (
        <Text
          font={FONT_3D.regular}
          fontSize={fontSize * 0.62}
          color={color}
          anchorX="left"
          anchorY="middle"
          position={[fontSize * base.length * 0.58, -fontSize * 0.28, 0]}
          material-depthTest={false}
          renderOrder={999}
        >
          {subscript}
        </Text>
      )}
    </Billboard>
  );
};
