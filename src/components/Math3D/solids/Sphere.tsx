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
  /** 主题颜色 Token（用于半透明球壳曲面） */
  colorKey?: keyof typeof MATH_COLORS;
  /** 轮廓线主题颜色 Token（默认 line，符合全项目几何墨线规范） */
  outlineColorKey?: keyof typeof MATH_COLORS;
  /** 半透明透明度（默认 0.08，清爽透彻） */
  opacity?: number;
  /** 是否显示高中数学习惯的大圆线（透视外轮廓实线 + 水平赤道前实后虚圆） */
  showOutline?: boolean;
  /** 是否显示竖直极轴 (NS 虚线) */
  showPolarAxis?: boolean;
  /** 是否关闭深度测试（内切球传 false，避免被外层实体遮挡） */
  depthTest?: boolean;
}

const SEGMENTS = 64;

/**
 * 高中立体几何标准球体组件（数学严密闭式解）：
 * 1. 清爽通透半透明球壳（depthWrite=false，完全消除内部多面体遮挡与塑料高光反光）
 * 2. 严丝合缝的外轮廓透视切圆（使用全项目统一的标准几何墨线 MATH_COLORS.line）
 * 3. 水平赤道截面大圆（前实后虚高反差，精确在球心水平面上）
 * 4. 竖直极轴连线 N-S（穿过球心的竖直虚线）
 */
export const Sphere = ({
  center = { x: 0, y: 0, z: 0 },
  radius,
  colorKey = "sphereShell",
  outlineColorKey = "line",
  opacity = 0.08,
  showOutline = true,
  showPolarAxis = true,
  depthTest = true,
}: SphereProps) => {
  const pos = mathToThree(center);
  const color = MATH_COLORS[colorKey] ?? MATH_COLORS.sphereShell;
  const lineHex = MATH_COLORS[outlineColorKey] ?? MATH_COLORS.line;
  const [cx, cy, cz] = pos;

  const rimRef = useRef<THREE.LineLoop>(null);
  const solidEquatorRef = useRef<THREE.Line>(null);
  const dashedEquatorRef = useRef<THREE.Line>(null);
  const polarAxisRef = useRef<THREE.Line>(null);

  // 1. 切圆基础几何体与 LineLoop (外轮廓实线)
  const rimLineLoop = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const mat = new THREE.LineBasicMaterial({
      color: lineHex,
      transparent: true,
      opacity: 0.9,
      linewidth: 1.8,
      depthTest,
      depthWrite: false,
    });
    return new THREE.LineLoop(geom, mat);
  }, [lineHex, depthTest]);

  // 2. 赤道实线（面向观察者半圈，标准几何线）
  const solidEquatorLine = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const mat = new THREE.LineBasicMaterial({
      color: lineHex,
      transparent: true,
      opacity: 0.9,
      linewidth: 1.6,
      depthTest,
      depthWrite: false,
    });
    return new THREE.Line(geom, mat);
  }, [lineHex, depthTest]);

  // 3. 赤道虚线（背向观察者半圈，标准几何虚线）
  const dashedEquatorLine = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const mat = new THREE.LineDashedMaterial({
      color: lineHex,
      transparent: true,
      opacity: 0.75,
      dashSize: 0.12,
      gapSize: 0.08,
      linewidth: 1.4,
      depthTest,
      depthWrite: false,
    });
    return new THREE.Line(geom, mat);
  }, [lineHex, depthTest]);

  // 4. 竖直极轴虚线
  const polarAxisLine = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const mat = new THREE.LineDashedMaterial({
      color: lineHex,
      transparent: true,
      opacity: 0.65,
      dashSize: 0.12,
      gapSize: 0.08,
      linewidth: 1.2,
      depthTest,
      depthWrite: false,
    });
    return new THREE.Line(geom, mat);
  }, [lineHex, depthTest]);

  useFrame(({ camera }) => {
    if (!showOutline) return;

    const cam = camera.position;
    const dx = cam.x - cx;
    const dy = cam.y - cy;
    const dz = cam.z - cz;
    const d = Math.hypot(dx, dy, dz);

    if (d <= radius || d < 0.001) return;

    // ── 1. 透视切圆（Billboard Rim Circle）正交基解析解 ──
    const nx = dx / d;
    const ny = dy / d;
    const nz = dz / d;

    // 构造垂直于视线的正交基 u, v
    const upX = Math.abs(ny) > 0.99 ? 1 : 0;
    const upY = Math.abs(ny) > 0.99 ? 0 : 1;
    const upZ = 0;

    let ux = upY * nz - upZ * ny;
    let uy = upZ * nx - upX * nz;
    let uz = upX * ny - upY * nx;
    const uLen = Math.hypot(ux, uy, uz) || 1;
    ux /= uLen;
    uy /= uLen;
    uz /= uLen;

    const vx = ny * uz - nz * uy;
    const vy = nz * ux - nx * uz;
    const vz = nx * uy - ny * ux;

    const hRim = (radius * radius) / d;
    const rRim =
      (radius * Math.sqrt(Math.max(0.001, d * d - radius * radius))) / d;
    const centerRimX = cx + nx * hRim;
    const centerRimY = cy + ny * hRim;
    const centerRimZ = cz + nz * hRim;

    const rimPts: THREE.Vector3[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const phi = (i / SEGMENTS) * Math.PI * 2;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);
      rimPts.push(
        new THREE.Vector3(
          centerRimX + rRim * (ux * cosP + vx * sinP),
          centerRimY + rRim * (uy * cosP + vy * sinP),
          centerRimZ + rRim * (uz * cosP + vz * sinP),
        ),
      );
    }
    rimLineLoop.geometry.setFromPoints(rimPts);
    if (rimLineLoop.geometry.attributes.position) {
      rimLineLoop.geometry.attributes.position.needsUpdate = true;
    }

    // ── 2. 水平赤道大圆（精确在 Y = cy 水平面上，前实后虚拆分）──
    const phiCam = Math.atan2(dz, dx);
    const halfSeg = SEGMENTS / 2;

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
    if (solidEquatorLine.geometry.attributes.position) {
      solidEquatorLine.geometry.attributes.position.needsUpdate = true;
    }

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
    if (dashedEquatorLine.geometry.attributes.position) {
      dashedEquatorLine.geometry.attributes.position.needsUpdate = true;
    }
    dashedEquatorLine.computeLineDistances();

    // ── 3. 竖直极轴连线 N-S ──
    if (showPolarAxis) {
      const polarPts = [
        new THREE.Vector3(cx, cy - radius, cz),
        new THREE.Vector3(cx, cy + radius, cz),
      ];
      polarAxisLine.geometry.setFromPoints(polarPts);
      if (polarAxisLine.geometry.attributes.position) {
        polarAxisLine.geometry.attributes.position.needsUpdate = true;
      }
      polarAxisLine.computeLineDistances();
    }
  });

  return (
    <group renderOrder={10}>
      {/* 半透明通透球体曲面 */}
      <mesh position={pos}>
        <sphereGeometry args={[radius, SEGMENTS, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          roughness={1.0}
          metalness={0.0}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={depthTest}
        />
      </mesh>

      {/* 高中数学习惯大圆线与极轴系统 */}
      {showOutline && (
        <>
          <primitive object={rimLineLoop} ref={rimRef} />
          <primitive object={solidEquatorLine} ref={solidEquatorRef} />
          <primitive object={dashedEquatorLine} ref={dashedEquatorRef} />
          {showPolarAxis && (
            <primitive object={polarAxisLine} ref={polarAxisRef} />
          )}
        </>
      )}
    </group>
  );
};
