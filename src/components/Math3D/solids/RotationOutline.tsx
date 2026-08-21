import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ProfilePoint } from "@/math3d/rotationProfiles";
import { rimRadiusAtZ } from "@/math3d/rotationProfiles";
import { MATH_COLORS } from "@/theme/math/colors";

interface RotationOutlineProps {
  profile: ProfilePoint[];
  color?: string;
  segments?: number;
  /** 该端是否存在真实平面端面（圆柱/圆锥/圆台=true，球=false） */
  hasTopCap?: boolean;
  hasBottomCap?: boolean;
  /** 端面视为"无需画环"的半径阈值：覆盖圆锥锥尖 */
  ringRadiusEps?: number;
}

/** 轮廓线沿半径方向的微小外扩量，避免与半透明主体表面深度重合（z-fighting） */
const RADIAL_EPS = 0.004;

function sampleArc(
  r: number,
  z: number,
  thetaStart: number,
  thetaEnd: number,
  segments: number,
): [number, number, number][] {
  const rr = r + RADIAL_EPS;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = thetaStart + ((thetaEnd - thetaStart) * i) / segments;
    pts.push([rr * Math.cos(t), z, rr * Math.sin(t)]);
  }
  return pts;
}

function setLinePoints(line: THREE.Line, pts: [number, number, number][]) {
  line.geometry.setFromPoints(
    pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  );
}

function makeLineObject(color: string, dashed: boolean): THREE.Line {
  const geom = new THREE.BufferGeometry();
  if (dashed) {
    return new THREE.Line(
      geom,
      new THREE.LineDashedMaterial({
        color,
        transparent: true,
        opacity: 0.75,
        dashSize: 0.08,
        gapSize: 0.06,
        depthTest: false,
      }),
    );
  }
  return new THREE.Line(
    geom,
    new THREE.LineBasicMaterial({
      color,
      depthTest: true,
      depthWrite: false,
    }),
  );
}

/**
 * 旋转体视角跟随轮廓线（内部组件，由 RotationSolid 调用）
 *
 * 1. 柱/锥/台：左/右轮廓母线（实线）+ 顶圆/底圆前实后虚拆分。
 * 2. 球体：
 *    - 面向相机的外轮廓正圆（恒实线，消除局部坐标系旋转导致的斜割线伪影）；
 *    - XOY 水平赤道大圆（朝向相机的半圈为实线，背向相机的半圈为虚线）。
 */
export function RotationOutline({
  profile,
  color = MATH_COLORS.line,
  segments = 48,
  hasTopCap = true,
  hasBottomCap = true,
  ringRadiusEps = 1e-3,
}: RotationOutlineProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  const isSphere = !hasTopCap && !hasBottomCap;
  const sphereRadius = useMemo(() => {
    if (!isSphere) return 0;
    return profile.reduce((max, p) => Math.max(max, p.r), 0);
  }, [isSphere, profile]);

  const zMin = profile[0].z;
  const zMax = profile[profile.length - 1].z;

  const rTop = useMemo(() => rimRadiusAtZ(profile, zMax), [profile, zMax]);
  const rBottom = useMemo(() => rimRadiusAtZ(profile, zMin), [profile, zMin]);
  const hasTopRing = hasTopCap && rTop > ringRadiusEps;
  const hasBottomRing = hasBottomCap && rBottom > ringRadiusEps;

  const leftLine = useMemo(() => makeLineObject(color, false), [color]);
  const rightLine = useMemo(() => makeLineObject(color, false), [color]);
  const topSolid = useMemo(() => makeLineObject(color, false), [color]);
  const topDashed = useMemo(() => makeLineObject(color, true), [color]);
  const bottomSolid = useMemo(() => makeLineObject(color, false), [color]);
  const bottomDashed = useMemo(() => makeLineObject(color, true), [color]);

  // 球体专属：赤道大圆实线弧与虚线弧（与球体语义颜色统一）
  const equatorSolid = useMemo(() => makeLineObject(color, false), [color]);
  const equatorDashed = useMemo(() => makeLineObject(color, true), [color]);

  useFrame(() => {
    // 关键修复：将相机世界坐标转换为当前局部坐标系的相对坐标
    let localCamPos = camera.position.clone();
    if (groupRef.current) {
      groupRef.current.updateWorldMatrix(true, false);
      localCamPos = groupRef.current.worldToLocal(localCamPos);
    }
    const cx = localCamPos.x;
    const cy = localCamPos.y;
    const cz = localCamPos.z;
    const thetaCam = Math.atan2(cz, cx);
    const d = Math.hypot(cx, cy, cz) || 1;

    if (isSphere) {
      // ── 球体精准透视投影轮廓圆 ──
      const R = sphereRadius + RADIAL_EPS;
      // 局部相机方向单位向量 (cx, cy, cz) 与局部距离 d
      const nx = cx / d;
      const ny = cy / d;
      const nz = cz / d;

      // 构造垂直于视线的正交基 u, v
      const upX = Math.abs(ny) > 0.99 ? 1 : 0;
      const upY = Math.abs(ny) > 0.99 ? 0 : 1;
      const upZ = 0;

      // u = up × n
      let ux = upY * nz - upZ * ny;
      let uy = upZ * nx - upX * nz;
      let uz = upX * ny - upY * nx;
      const uLen = Math.hypot(ux, uy, uz) || 1;
      ux /= uLen;
      uy /= uLen;
      uz /= uLen;

      // v = n × u
      const vx = ny * uz - nz * uy;
      const vy = nz * ux - nx * uz;
      const vz = nx * uy - ny * ux;

      const silhouettePts: [number, number, number][] = [];
      const numPts = segments * 2;

      // 透视投影下，视线切锥与球面的交线为一个垂直于相机视线的正圆：
      // 切圆圆心位于相机方向偏移 hRim = R^2 / d 处
      // 切圆半径为 rRim = R * sqrt(1 - R^2 / d^2)
      if (d > R) {
        const hRim = (R * R) / d;
        const rRim = (R * Math.sqrt(d * d - R * R)) / d;
        const centerRimX = nx * hRim;
        const centerRimY = ny * hRim;
        const centerRimZ = nz * hRim;

        for (let i = 0; i <= numPts; i++) {
          const phi = (i / numPts) * Math.PI * 2;
          const cosP = Math.cos(phi);
          const sinP = Math.sin(phi);
          silhouettePts.push([
            centerRimX + rRim * (ux * cosP + vx * sinP),
            centerRimY + rRim * (uy * cosP + vy * sinP),
            centerRimZ + rRim * (uz * cosP + vz * sinP),
          ]);
        }
      } else {
        // 相机进入球体内（退化保护）
        for (let i = 0; i <= numPts; i++) {
          const phi = (i / numPts) * Math.PI * 2;
          const cosP = Math.cos(phi);
          const sinP = Math.sin(phi);
          silhouettePts.push([
            R * (ux * cosP + vx * sinP),
            R * (uy * cosP + vy * sinP),
            R * (uz * cosP + vz * sinP),
          ]);
        }
      }

      setLinePoints(leftLine, silhouettePts);
      leftLine.visible = true;
      rightLine.visible = false;
      topSolid.visible = false;
      topDashed.visible = false;
      bottomSolid.visible = false;
      bottomDashed.visible = false;

      // 2. 水平赤道大圆：前实后虚拆分
      const rEq = sphereRadius + RADIAL_EPS;
      // 朝向相机的半圆弧：thetaCam - PI/2 -> thetaCam + PI/2
      setLinePoints(
        equatorSolid,
        sampleArc(
          rEq,
          0,
          thetaCam - Math.PI / 2,
          thetaCam + Math.PI / 2,
          segments,
        ),
      );
      // 背向相机的半圆弧：thetaCam + PI/2 -> thetaCam + 3PI/2
      setLinePoints(
        equatorDashed,
        sampleArc(
          rEq,
          0,
          thetaCam + Math.PI / 2,
          thetaCam + (Math.PI * 3) / 2,
          segments,
        ),
      );
      equatorDashed.computeLineDistances();
      equatorSolid.visible = true;
      equatorDashed.visible = true;
      return;
    }

    // ── 柱/锥/台精准透视轮廓线解析解 ──
    equatorSolid.visible = false;
    equatorDashed.visible = false;

    const dr = rBottom - rTop;
    const h = zMax - zMin;
    const horizDist = Math.hypot(cx, cz) || 1e-4;

    let deltaTheta = Math.PI / 2; // 默认垂直于视线两侧 (圆柱)
    let hasTangentGeneratrix = true; // 是否存在真实的相切侧母线

    if (Math.abs(dr) > 1e-4 && h > 1e-4) {
      // 锥顶高度 Hv (在局部 Z 轴/Three Y 轴上的坐标)
      const Hv = zMin + (rBottom * h) / dr;
      const slope = Math.abs(dr) / h;
      const val = slope * (Math.abs(Hv - cy) / horizDist);
      if (val >= 1) {
        // 相机处于轴向俯视/仰视不可切锥区，侧面无切母线轮廓
        hasTangentGeneratrix = false;
      } else {
        deltaTheta = Math.acos(val);
      }
    }

    let thetaL = thetaCam - deltaTheta;
    let thetaR = thetaCam + deltaTheta;

    if (hasTangentGeneratrix) {
      thetaL = thetaCam - deltaTheta;
      thetaR = thetaCam + deltaTheta;

      // 左侧与右侧透视轮廓母线 (精确直连顶底圆切点)
      const pBotL: [number, number, number] = [
        (rBottom + RADIAL_EPS) * Math.cos(thetaL),
        zMin,
        (rBottom + RADIAL_EPS) * Math.sin(thetaL),
      ];
      const pTopL: [number, number, number] = [
        (rTop + RADIAL_EPS) * Math.cos(thetaL),
        zMax,
        (rTop + RADIAL_EPS) * Math.sin(thetaL),
      ];
      const pBotR: [number, number, number] = [
        (rBottom + RADIAL_EPS) * Math.cos(thetaR),
        zMin,
        (rBottom + RADIAL_EPS) * Math.sin(thetaR),
      ];
      const pTopR: [number, number, number] = [
        (rTop + RADIAL_EPS) * Math.cos(thetaR),
        zMax,
        (rTop + RADIAL_EPS) * Math.sin(thetaR),
      ];

      setLinePoints(leftLine, [pBotL, pTopL]);
      setLinePoints(rightLine, [pBotR, pTopR]);
      leftLine.visible = true;
      rightLine.visible = true;
    } else {
      leftLine.visible = false;
      rightLine.visible = false;
    }

    const applyRing = (
      solid: THREE.Line,
      dashed: THREE.Line,
      fullyVisible: boolean,
      r: number,
      z: number,
      t1: number,
      t2: number,
    ) => {
      if (fullyVisible) {
        setLinePoints(solid, sampleArc(r, z, 0, Math.PI * 2, segments * 2));
        solid.visible = true;
        dashed.visible = false;
        return;
      }
      setLinePoints(solid, sampleArc(r, z, t1, t2, segments));
      setLinePoints(dashed, sampleArc(r, z, t2, t1 + Math.PI * 2, segments));
      dashed.computeLineDistances();
      solid.visible = true;
      dashed.visible = true;
    };

    const topFullyVisible = cy > zMax || !hasTangentGeneratrix;
    const bottomFullyVisible = cy < zMin || !hasTangentGeneratrix;

    if (hasTopRing) {
      applyRing(
        topSolid,
        topDashed,
        topFullyVisible,
        rTop,
        zMax,
        thetaL,
        thetaR,
      );
    } else {
      topSolid.visible = false;
      topDashed.visible = false;
    }

    if (hasBottomRing) {
      applyRing(
        bottomSolid,
        bottomDashed,
        bottomFullyVisible,
        rBottom,
        zMin,
        thetaL,
        thetaR,
      );
    } else {
      bottomSolid.visible = false;
      bottomDashed.visible = false;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={leftLine} renderOrder={10} />
      <primitive object={rightLine} renderOrder={10} />
      <primitive object={topSolid} renderOrder={10} />
      <primitive object={topDashed} renderOrder={12} />
      <primitive object={bottomSolid} renderOrder={10} />
      <primitive object={bottomDashed} renderOrder={12} />
      <primitive object={equatorSolid} renderOrder={11} />
      <primitive object={equatorDashed} renderOrder={13} />
    </group>
  );
}
