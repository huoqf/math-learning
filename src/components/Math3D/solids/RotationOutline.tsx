import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ProfilePoint } from "@/math3d/rotationProfiles";
import { rimRadiusAtZ } from "@/math3d/rotationProfiles";
import { computeSilhouette } from "@/math3d/silhouette";
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

function getCameraFrame(camera: THREE.Camera) {
  const cx = camera.position.x;
  const cy = camera.position.y;
  const cz = camera.position.z;
  const horiz = Math.hypot(cx, cz);
  return {
    thetaCam: Math.atan2(cz, cx),
    beta: Math.atan2(cy, horiz),
  };
}

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

  // 球体专属：赤道大圆实线弧与虚线弧
  const equatorSolid = useMemo(
    () => makeLineObject(MATH_COLORS.primary, false),
    [],
  );
  const equatorDashed = useMemo(
    () => makeLineObject(MATH_COLORS.primary, true),
    [],
  );

  useFrame(() => {
    const { thetaCam, beta } = getCameraFrame(camera);

    if (isSphere) {
      // ── 球体标准绘制模式 ──
      // 1. 面向相机的外轮廓圆 (Billboard 正圆，恒为实线)
      const R = sphereRadius + RADIAL_EPS;
      // 相机方向单位向量 (cx, cy, cz)
      const cx = camera.position.x;
      const cy = camera.position.y;
      const cz = camera.position.z;
      const camLen = Math.hypot(cx, cy, cz) || 1;
      const nx = cx / camLen;
      const ny = cy / camLen;
      const nz = cz / camLen;

      // 构造垂直于视线的正交基 u, v
      // 先取一个与 n 不共线的辅助向量 (通常取 Y 轴，若视线正对 Y 轴则取 X 轴)
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

    // ── 柱/锥/台绘制模式 ──
    equatorSolid.visible = false;
    equatorDashed.visible = false;

    const { left, right, zRange } = computeSilhouette(profile, thetaCam, beta);

    if (!zRange || left.length === 0) {
      [
        leftLine,
        rightLine,
        topSolid,
        topDashed,
        bottomSolid,
        bottomDashed,
      ].forEach((obj) => {
        obj.visible = false;
      });
      return;
    }

    setLinePoints(
      leftLine,
      left.map((p) => {
        const r = p.r + RADIAL_EPS;
        return [r * Math.cos(p.theta), p.z, r * Math.sin(p.theta)] as [
          number,
          number,
          number,
        ];
      }),
    );
    setLinePoints(
      rightLine,
      right.map((p) => {
        const r = p.r + RADIAL_EPS;
        return [r * Math.cos(p.theta), p.z, r * Math.sin(p.theta)] as [
          number,
          number,
          number,
        ];
      }),
    );
    leftLine.visible = true;
    rightLine.visible = true;

    // 数组严格连续，端点直接取首尾
    const bottomBoundary = left[0];
    const topBoundary = left[left.length - 1];

    const applyRing = (
      solid: THREE.Line,
      dashed: THREE.Line,
      fullyVisible: boolean,
      r: number,
      z: number,
      thetaL: number,
      thetaR: number,
    ) => {
      if (fullyVisible) {
        setLinePoints(solid, sampleArc(r, z, 0, Math.PI * 2, segments * 2));
        solid.visible = true;
        dashed.visible = false;
        return;
      }
      setLinePoints(solid, sampleArc(r, z, thetaL, thetaR, segments));
      setLinePoints(
        dashed,
        sampleArc(r, z, thetaR, thetaL + Math.PI * 2, segments),
      );
      dashed.computeLineDistances();
      solid.visible = true;
      dashed.visible = true;
    };

    const topFullyVisible = beta > 0;
    const bottomFullyVisible = beta < 0;

    if (hasTopRing) {
      const phi = Math.abs(topBoundary.theta - thetaCam);
      applyRing(
        topSolid,
        topDashed,
        topFullyVisible,
        rTop,
        zMax,
        thetaCam - phi,
        thetaCam + phi,
      );
    } else {
      topSolid.visible = false;
      topDashed.visible = false;
    }

    if (hasBottomRing) {
      const phi = Math.abs(bottomBoundary.theta - thetaCam);
      applyRing(
        bottomSolid,
        bottomDashed,
        bottomFullyVisible,
        rBottom,
        zMin,
        thetaCam - phi,
        thetaCam + phi,
      );
    } else {
      bottomSolid.visible = false;
      bottomDashed.visible = false;
    }
  });

  return (
    <group>
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
