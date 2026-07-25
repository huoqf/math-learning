import { Line } from "@react-three/drei";
import { MATH_COLORS } from "@/theme/math/colors";
import { PointLabel3D } from "./PointLabel3D";

interface Scene3DGridProps {
  size?: number;
  showLabels?: boolean;
}

export const Scene3DGrid = ({
  size = 5,
  showLabels = true,
}: Scene3DGridProps) => {
  const labelOffset = size * 0.1 + 0.2;

  return (
    <group>
      <Line
        points={[
          [-size, 0, 0],
          [size, 0, 0],
        ]}
        color={MATH_COLORS.axis3D_X}
        lineWidth={1.5}
      />
      <Line
        points={[
          [0, -size, 0],
          [0, size, 0],
        ]}
        color={MATH_COLORS.axis3D_Z}
        lineWidth={1.5}
      />
      <Line
        points={[
          [0, 0, -size],
          [0, 0, size],
        ]}
        color={MATH_COLORS.axis3D_Y}
        lineWidth={1.5}
      />
      <gridHelper
        args={[size * 2, size * 2, MATH_COLORS.grid, MATH_COLORS.grid]}
      />
      {showLabels && (
        <>
          <PointLabel3D
            position={{ x: size + labelOffset, y: 0, z: 0 }}
            text="x"
            variant="italic"
            fontSize={0.32}
            colorKey="axis3D_X"
          />
          <PointLabel3D
            position={{ x: 0, y: 0, z: size + labelOffset }}
            text="y"
            variant="italic"
            fontSize={0.32}
            colorKey="axis3D_Y"
          />
          <PointLabel3D
            position={{ x: 0, y: size + labelOffset, z: 0 }}
            text="z"
            variant="italic"
            fontSize={0.32}
            colorKey="axis3D_Z"
          />
        </>
      )}
    </group>
  );
};
