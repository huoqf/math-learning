import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mathToThree } from "@/math3d/coordinateConvention";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

export interface SphereProps {
  /** 球心（数学坐标系 Vec3） */
  center?: Vec3;
  /** 球半径 R */
  radius: number;
  /** 主题颜色 Token */
  colorKey?: keyof typeof MATH_COLORS;
  /** 半透明透明度（默认 0.10，清爽透彻） */
  opacity?: number;
  /** 是否显示高中数学习惯的大圆线（透视外轮廓实线 + 水平赤道前实后虚圆） */
  showOutline?: boolean;
  /** 是否关闭深度测试（内切球传 false，避免被外层实体遮挡） */
  depthTest?: boolean;
}

const SEGMENTS = 64;

/**
 * 高中立体几何标准球体组件（数学严密闭式解）：
 * 1. 清爽通透半透明球壳（depthWrite=false，完全消除内部多面体遮挡与塑料高光反光）
 * 2. 视角跟随的标准透视切圆（Billboard Silhouette Circle，粗细 1.8px）
 * 3. 水平赤道截面大圆（前实后虚，精准过球心所在水平面，严格绑定球体语义色彩）
 */
export const Sphere = ({
  center = { x: 0, y: 0, z: 0 },
  radius,
  colorKey = "sphereShell",
  opacity = 0.1,
  showOutline = true,
  depthTest = true,
}: SphereProps) => {
  const pos = mathToThree(center);
  const color = MATH_COLORS[colorKey] ?? MATH_COLORS.sphereShell;
  const [cx, cy, cz] = pos;

  const rimRef = useRef<THREE.LineLoop>(null);
  const solidEquatorRef = useRef<THREE.Line>(null);
  const dashedEquatorRef = useRef<THREE.Line>(null);

  // 1. 切圆基础几何体与 LineLoop
  const rimLineLoop = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const theta = (i / SEGMENTS) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      linewidth: 1.8,
      depthTest,
      depthWrite: false,
    });
    return new THREE.LineLoop(geom, mat);
  }, [color, depthTest]);

  // 2. 赤道实线（面向观察者半圈）
  const solidEquatorLine = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      linewidth: 1.6,
      depthTest,
      depthWrite: false,
    });
    return new THREE.Line(geom, mat);
  }, [color, depthTest]);

  // 3. 赤道虚线（背向观察者半圈）
  const dashedEquatorLine = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const mat = new THREE.LineDashedMaterial({
      color,
      transparent: true,
      opacity: 0.45,
      dashSize: 0.15,
      gapSize: 0.1,
      linewidth: 1.2,
      depthTest,
      depthWrite: false,
    });
    return new THREE.Line(geom, mat);
  }, [color, depthTest]);

  useFrame(({ camera }) => {
    if (!showOutline) return;

    const cam = camera.position;
    const dx = cam.x - cx;
    const dy = cam.y - cy;
    const dz = cam.z - cz;
    const dist = Math.hypot(dx, dy, dz);

    if (dist <= radius) return;

    // ── 1. 透视切圆（Billboard Rim Circle）精准解析解 ──
    const scaleFactor = (radius * radius) / (dist * dist);
    rimLineLoop.position.set(
      cx + dx * scaleFactor,
      cy + dy * scaleFactor,
      cz + dz * scaleFactor,
    );
    const rRim = radius * Math.sqrt(Math.max(0.001, 1 - scaleFactor));
    rimLineLoop.scale.set(rRim, rRim, rRim);
    rimLineLoop.quaternion.copy(camera.quaternion);

    // ── 2. 水平赤道大圆（精确在 Y = cy 水平面上，前实后虚拆分）──
    const phiCam = Math.atan2(dz, dx);
    const halfSeg = SEGMENTS / 2;

    // 前半圆弧 [phiCam - PI/2, phiCam + PI/2] (面向相机实线)
    const solidPts: THREE.Vector3[] = [];
    for (let i = 0; i <= halfSeg; i++) {
      const t = phiCam - Math.PI / 2 + (Math.PI * i) / halfSeg;
      solidPts.push(
        new THREE.Vector3(
          cx + radius * Math.cos(t),
          cy,
          cz + radius * Math.sin(t),
        ),
      );
    }
    solidEquatorLine.geometry.setFromPoints(solidPts);

    // 后半圆弧 [phiCam + PI/2, phiCam + 3PI/2] (背向相机虚线)
    const dashedPts: THREE.Vector3[] = [];
    for (let i = 0; i <= halfSeg; i++) {
      const t = phiCam + Math.PI / 2 + (Math.PI * i) / halfSeg;
      dashedPts.push(
        new THREE.Vector3(
          cx + radius * Math.cos(t),
          cy,
          cz + radius * Math.sin(t),
        ),
      );
    }
    dashedEquatorLine.geometry.setFromPoints(dashedPts);
    dashedEquatorLine.computeLineDistances();
  });

  return (
    <group renderOrder={10}>
      {/* 半透明清爽球体曲面 */}
      <mesh position={pos}>
        <sphereGeometry args={[radius, SEGMENTS, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          roughness={0.9}
          metalness={0.0}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={depthTest}
        />
      </mesh>

      {showOutline && (
        <>
          <primitive object={rimLineLoop} ref={rimRef} />
          <primitive object={solidEquatorLine} ref={solidEquatorRef} />
          <primitive object={dashedEquatorLine} ref={dashedEquatorRef} />
        </>
      )}
    </group>
  );
};
