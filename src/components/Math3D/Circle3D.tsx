import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

export interface Circle3DProps {
  /** 圆心（数学坐标系 Vec3） */
  center: Vec3;
  /** 圆半径 */
  radius: number;
  /** 圆所在平面的法向量（数学坐标系 Vec3） */
  normal: Vec3;
  /** 主题颜色 Token */
  colorKey?: keyof typeof MATH_COLORS;
  /** 填充透明度（默认 0.08，0 表示不填充） */
  fillOpacity?: number;
  /** 线宽（默认 1.8） */
  lineWidth?: number;
  /** 是否为虚线 */
  dashed?: boolean;
  /** 分段数（默认 64） */
  segments?: number;
}

/**
 * 3D 空间平滑截面圆组件
 * 自动根据法向量构建切向正交基，并转换为 Three.js 场景渲染
 */
export const Circle3D = ({
  center,
  radius,
  normal,
  colorKey = "primary",
  fillOpacity = 0.08,
  lineWidth = 1.8,
  dashed = false,
  segments = 64,
}: Circle3DProps) => {
  const color = MATH_COLORS[colorKey] ?? MATH_COLORS.primary;

  const { linePoints, fillGeometry } = useMemo(() => {
    // 1. 在数学坐标系下构建单位切向基向量 u, v
    const n = new THREE.Vector3(normal.x, normal.y, normal.z).normalize();
    const up =
      Math.abs(n.z) < 0.99
        ? new THREE.Vector3(0, 0, 1)
        : new THREE.Vector3(0, 1, 0);
    const u = new THREE.Vector3().crossVectors(up, n).normalize();
    const v = new THREE.Vector3().crossVectors(n, u).normalize();

    // 2. 生成圆周离散点（通过 mathToThree 投射到 Three.js 坐标系）
    const threePoints: [number, number, number][] = [];
    const centerThree = mathToThree(center);

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const mathPt: Vec3 = {
        x: center.x + radius * (u.x * cosT + v.x * sinT),
        y: center.y + radius * (u.y * cosT + v.y * sinT),
        z: center.z + radius * (u.z * cosT + v.z * sinT),
      };

      threePoints.push(mathToThree(mathPt));
    }

    // 3. 构建平整圆盘填充几何体（直接复用圆周点构建三角形扇，100% 杜绝坐标计算误差与拉丝）
    let geom: THREE.BufferGeometry | null = null;
    if (fillOpacity > 0) {
      const flatFillPositions: number[] = [];
      for (let i = 0; i < segments; i++) {
        // 三角形扇: center -> point[i] -> point[i+1]
        flatFillPositions.push(
          ...centerThree,
          ...threePoints[i],
          ...threePoints[i + 1],
        );
      }

      geom = new THREE.BufferGeometry();
      geom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(flatFillPositions, 3),
      );
      geom.computeVertexNormals();
    }

    return { linePoints: threePoints, fillGeometry: geom };
  }, [center, radius, normal, segments, fillOpacity]);

  return (
    <group>
      {/* 圆周轮廓线 */}
      <Line
        points={linePoints}
        color={color}
        lineWidth={lineWidth}
        dashed={dashed}
        dashScale={20}
        transparent
        opacity={0.85}
      />

      {/* 圆盘轻量半透明填充面 */}
      {fillGeometry && fillOpacity > 0 && (
        <mesh geometry={fillGeometry}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={fillOpacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};
