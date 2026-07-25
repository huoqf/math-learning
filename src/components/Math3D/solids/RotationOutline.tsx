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
 * 六条线：左/右轮廓母线（恒实线）+ 顶圆/底圆实弧与虚弧。
 * 轮廓母线基于"曲面法线 ⊥ 视线"物理条件计算，直线母线退化为固定角度，
 * 曲线母线（球）连续变化。端面圆前实后虚拆分由 hasTopCap/hasBottomCap 显式控制。
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

  useFrame(() => {
    const { thetaCam, beta } = getCameraFrame(camera);
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
    </group>
  );
}
