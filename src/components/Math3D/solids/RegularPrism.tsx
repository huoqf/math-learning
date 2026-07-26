import { useMemo } from "react";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";

interface RegularPrismProps {
  sides?: number;
  baseRadius: number;
  height: number;
  colorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
}

/**
 * 正 n 棱柱 3D 渲染组件
 *
 * 坐标与 buildRegularPrismPolyhedron 保持绝对 100% 对齐：
 * 底面顶点位于 z=0，顶面顶点位于 z=height，角度由 (i/sides)*2π 分配。
 */
export const RegularPrism = ({
  sides = 3,
  baseRadius,
  height,
  colorKey = "primary",
  opacity = 0.25,
}: RegularPrismProps) => {
  const geometry = useMemo(() => {
    const bottomPts: THREE.Vector3[] = [];
    const topPts: THREE.Vector3[] = [];

    for (let i = 0; i < sides; i++) {
      const t = (i / sides) * Math.PI * 2;
      const x = baseRadius * Math.cos(t);
      const y = baseRadius * Math.sin(t);

      const bPt = mathToThree({ x, y, z: 0 });
      const tPt = mathToThree({ x, y, z: height });

      bottomPts.push(new THREE.Vector3(...bPt));
      topPts.push(new THREE.Vector3(...tPt));
    }

    const positions: number[] = [];
    const push = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    };

    // 下底面（扇形剖分）
    for (let i = 1; i < sides - 1; i++) {
      push(bottomPts[0], bottomPts[i + 1], bottomPts[i]);
    }
    // 上底面
    for (let i = 1; i < sides - 1; i++) {
      push(topPts[0], topPts[i], topPts[i + 1]);
    }

    // 侧面矩形
    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      const b1 = bottomPts[i];
      const b2 = bottomPts[next];
      const t1 = topPts[i];
      const t2 = topPts[next];

      push(b1, b2, t2);
      push(b1, t2, t1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.computeVertexNormals();
    return geo;
  }, [sides, baseRadius, height]);

  const color = MATH_COLORS[colorKey];

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
      <Edges color={MATH_COLORS.line} threshold={15} />
    </mesh>
  );
};
