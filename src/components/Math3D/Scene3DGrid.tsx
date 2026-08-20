import { Line } from "@react-three/drei";
import { MATH_COLORS } from "@/theme/math/colors";
import { PointLabel3D } from "./PointLabel3D";

interface Scene3DGridProps {
  size?: number;
  showLabels?: boolean;
  showGrid?: boolean;
}

export const Scene3DGrid = ({
  size = 5,
  showLabels = true,
  showGrid = false,
}: Scene3DGridProps) => {
  const coneHeight = 0.28;
  const coneRadius = 0.08;
  const labelOffset = size * 0.08 + coneHeight + 0.15;

  return (
    <group>
      {/* ──────────────── 数学 x 轴 (红色)：指向观察者/左前方 (Three.js +Z 轴) ──────────────── */}
      <Line
        points={[
          [0, 0, -size],
          [0, 0, size],
        ]}
        color={MATH_COLORS.axis3D_X}
        lineWidth={1.5}
      />
      {/* x 轴正向箭头锥体 */}
      <mesh
        position={[0, 0, size + coneHeight / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[coneRadius, coneHeight, 16]} />
        <meshBasicMaterial color={MATH_COLORS.axis3D_X} />
      </mesh>

      {/* ──────────────── 数学 y 轴 (绿色)：指向水平向右 (Three.js +X 轴) ──────────────── */}
      <Line
        points={[
          [-size, 0, 0],
          [size, 0, 0],
        ]}
        color={MATH_COLORS.axis3D_Y}
        lineWidth={1.5}
      />
      {/* y 轴正向箭头锥体 */}
      <mesh
        position={[size + coneHeight / 2, 0, 0]}
        rotation={[0, 0, -Math.PI / 2]}
      >
        <coneGeometry args={[coneRadius, coneHeight, 16]} />
        <meshBasicMaterial color={MATH_COLORS.axis3D_Y} />
      </mesh>

      {/* ──────────────── 数学 z 轴 (蓝色)：指向铅垂向上 (Three.js +Y 轴) ──────────────── */}
      <Line
        points={[
          [0, -size, 0],
          [0, size, 0],
        ]}
        color={MATH_COLORS.axis3D_Z}
        lineWidth={1.5}
      />
      {/* z 轴正向箭头锥体 */}
      <mesh position={[0, size + coneHeight / 2, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[coneRadius, coneHeight, 16]} />
        <meshBasicMaterial color={MATH_COLORS.axis3D_Z} />
      </mesh>

      {/* 水平 XOY 网格参考面 (高中数学解析建系默认关闭，保持纯净) */}
      {showGrid && (
        <gridHelper
          args={[size * 2, size * 2, MATH_COLORS.grid, MATH_COLORS.grid]}
        />
      )}

      {/* 坐标轴标签 (纯数学坐标 Vec3) */}
      {showLabels && (
        <>
          {/* 数学 x 轴标签 (红色)：位于数学 x 轴正半轴端点前方 */}
          <PointLabel3D
            position={{ x: size + labelOffset, y: 0, z: 0 }}
            text="x"
            variant="italic"
            fontSize={0.34}
            colorKey="axis3D_X"
          />
          {/* 数学 y 轴标签 (绿色)：位于数学 y 轴正半轴端点右方 */}
          <PointLabel3D
            position={{ x: 0, y: size + labelOffset, z: 0 }}
            text="y"
            variant="italic"
            fontSize={0.34}
            colorKey="axis3D_Y"
          />
          {/* 数学 z 轴标签 (蓝色)：位于数学 z 轴正半轴端点上方 */}
          <PointLabel3D
            position={{ x: 0, y: 0, z: size + labelOffset }}
            text="z"
            variant="italic"
            fontSize={0.34}
            colorKey="axis3D_Z"
          />
        </>
      )}
    </group>
  );
};
