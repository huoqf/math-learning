import { useMemo } from "react";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";

interface TriangularPrismProps {
  /** 直角边 a（x 轴方向） */
  legA: number;
  /** 直角边 b（y 轴方向，depth） */
  legB: number;
  /** 棱柱高（z 轴方向） */
  height: number;
  colorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
}

/**
 * 直三棱柱：底面为直角边 legA、legB 的直角三角形。
 *
 * 坐标约定（与 Cuboid/RegularPyramid 对齐）：
 *  - 底面在 z=0，顶面在 z=height（数学坐标，z 向上）
 *  - 直角顶点在原点 (0,0,0)，两直角边分别沿 +x / +y
 *  - 通过 mathToThree 在渲染边界转换为 three.js 坐标（y 向上）
 */
export const TriangularPrism = ({
  legA,
  legB,
  height,
  colorKey = "primary",
  opacity = 0.25,
}: TriangularPrismProps) => {
  const geometry = useMemo(() => {
    // 数学坐标下的顶点（z 向上）
    // 底面直角三角形：C(直角) = (0,0,0), A = (a,0,0), B = (0,b,0)
    const bottomC = new THREE.Vector3(0, 0, 0);
    const bottomA = new THREE.Vector3(legA, 0, 0);
    const bottomB = new THREE.Vector3(0, legB, 0);

    // 顶面
    const topC = new THREE.Vector3(0, 0, height);
    const topA = new THREE.Vector3(legA, 0, height);
    const topB = new THREE.Vector3(0, legB, height);

    // 转换为 three.js 坐标
    const bC = mathToThree(bottomC);
    const bA = mathToThree(bottomA);
    const bB = mathToThree(bottomB);
    const tC = mathToThree(topC);
    const tA = mathToThree(topA);
    const tB = mathToThree(topB);

    const positions: number[] = [];
    const push = (
      p0: [number, number, number],
      p1: [number, number, number],
      p2: [number, number, number],
    ) => {
      positions.push(...p0, ...p1, ...p2);
    };

    // 底面（法线朝下）
    push(bC, bB, bA);
    // 顶面（法线朝上）
    push(tC, tA, tB);

    // 三个侧面矩形，各拆两个三角形
    const bottom = [bC, bA, bB];
    const top = [tC, tA, tB];
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3;
      push(bottom[i], bottom[j], top[j]);
      push(bottom[i], top[j], top[i]);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.computeVertexNormals();
    return geo;
  }, [legA, legB, height]);

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
