import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ProfilePoint } from "@/math3d/rotationProfiles";
import { rimRadiusAtZ } from "@/math3d/rotationProfiles";
import { MATH_COLORS } from "@/theme/math/colors";

export interface RotationOutlineProps {
  /** 旋转体截面母线点序列（r >= 0, z 沿旋转轴递增） */
  profile: ProfilePoint[];
  /** 轮廓线主题颜色 Token（默认 MATH_COLORS.line 几何墨线） */
  color?: string;
  /** 圆周分段采样精度（默认 64） */
  segments?: number;
  /** 该端是否存在真实平面端面（圆柱/圆台=true，圆锥顶面=false，球=false） */
  hasTopCap?: boolean;
  hasBottomCap?: boolean;
  /** 端面视为"退化锥尖"的最小半径阈值（默认 1e-3） */
  ringRadiusEps?: number;
}

/** 轮廓线沿半径微小外扩量，防止与曲面网格产生微观浮点共面冲突 */
const RADIAL_EPS = 0.003;

/**
 * 采样水平圆弧点集
 */
function sampleArc(
  r: number,
  y: number,
  thetaStart: number,
  thetaEnd: number,
  segments: number,
): [number, number, number][] {
  const rr = r + RADIAL_EPS;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = thetaStart + ((thetaEnd - thetaStart) * i) / segments;
    pts.push([rr * Math.cos(t), y, rr * Math.sin(t)]);
  }
  return pts;
}

/**
 * 严格、安全地更新 THREE.Line 的顶点缓冲区与绘制范围，彻底杜绝 WebGL 脏数据残留
 */
function updateLine(
  line: THREE.Line,
  pts: [number, number, number][],
  isDashed = false,
) {
  if (pts.length < 2) {
    line.visible = false;
    line.geometry.setDrawRange(0, 0);
    return;
  }
  const arr = new Float32Array(pts.length * 3);
  for (let i = 0; i < pts.length; i++) {
    arr[i * 3] = pts[i][0];
    arr[i * 3 + 1] = pts[i][1];
    arr[i * 3 + 2] = pts[i][2];
  }
  line.geometry.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  line.geometry.setDrawRange(0, pts.length);
  line.geometry.computeBoundingSphere();
  if (isDashed) {
    line.computeLineDistances();
  }
  line.visible = true;
}

/**
 * 创建高品质几何轮廓线条对象（实线 / 虚线图元）
 */
function createLineObject(color: string, dashed: boolean): THREE.Line {
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
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
    }),
  );
}

/**
 * 旋转体与球体视角跟随轮廓线组件（第一性原理数学解析解）
 *
 * 覆盖几何体范式：
 * 1. 【球体 Sphere】：
 *    - 面对相机的外轮廓正圆（Billboard 严丝合缝闭合，零离轴视差）；
 *    - 水平赤道截面大圆（前实后虚高反差拆分）。
 * 2. 【圆柱 Cylinder】：
 *    - 侧母线：水平视距大于底面半径时生成左右两条相切竖直母线；正俯视/正仰视清空；
 *    - 端面圆：面对相机的端面整圈实线；背对相机的端面在侧视下前实后虚，正俯仰视下整圈虚线。
 * 3. 【圆锥 Cone】：
 *    - 侧母线：仅在视点处于底面与锥顶之间的侧视区间时生成，两端严格连接锥顶与底圆切点；
 *    - 俯视/仰视：彻底禁用母线（绝无穿刺弦），底面圆整圈实线作为最大外轮廓。
 * 4. 【圆台 Frustum】：
 *    - 侧母线：仅在视点处于有效侧视锥区间时生成，两端严格连接顶底切点；
 *    - 端面圆：正俯视大圆外露整圈实线+内圆整圈实线；正仰视大圆整圈实线+内圆整圈虚线；侧视前实后虚。
 */
export function RotationOutline({
  profile,
  color = MATH_COLORS.line,
  segments = 64,
  hasTopCap = true,
  hasBottomCap = true,
  ringRadiusEps = 1e-3,
}: RotationOutlineProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // 1. 几何体拓扑类型判定
  const isSphere = !hasTopCap && !hasBottomCap;
  const sphereRadius = useMemo(() => {
    if (!isSphere) return 0;
    return profile.reduce((max, p) => Math.max(max, p.r), 0);
  }, [isSphere, profile]);

  const zMin = profile[0].z;
  const zMax = profile[profile.length - 1].z;
  const zCenter = (zMin + zMax) / 2;

  const rTop = useMemo(() => rimRadiusAtZ(profile, zMax), [profile, zMax]);
  const rBottom = useMemo(() => rimRadiusAtZ(profile, zMin), [profile, zMin]);
  const hasTopRing = hasTopCap && rTop > ringRadiusEps;
  const hasBottomRing = hasBottomCap && rBottom > ringRadiusEps;

  // 2. 线条图元实例管理
  const leftLine = useMemo(() => createLineObject(color, false), [color]);
  const rightLine = useMemo(() => createLineObject(color, false), [color]);
  const topSolid = useMemo(() => createLineObject(color, false), [color]);
  const topDashed = useMemo(() => createLineObject(color, true), [color]);
  const bottomSolid = useMemo(() => createLineObject(color, false), [color]);
  const bottomDashed = useMemo(() => createLineObject(color, true), [color]);

  // 球体专属图元
  const sphereRimLine = useMemo(() => createLineObject(color, false), [color]);
  const equatorSolid = useMemo(() => createLineObject(color, false), [color]);
  const equatorDashed = useMemo(() => createLineObject(color, true), [color]);

  useFrame(() => {
    // 将相机全局坐标转换为当前几何体局部坐标
    let localCamPos = camera.position.clone();
    if (groupRef.current) {
      groupRef.current.updateWorldMatrix(true, false);
      localCamPos = groupRef.current.worldToLocal(localCamPos);
    }
    const cx = localCamPos.x;
    const cy = localCamPos.y;
    const cz = localCamPos.z;
    const thetaCam = Math.atan2(cz, cx);
    const horizDist = Math.hypot(cx, cz) || 1e-4;

    // ─────────────────────────────────────────────────────────────
    // 范式 1：球体（Sphere）解析解
    // ─────────────────────────────────────────────────────────────
    if (isSphere) {
      const dy = cy - zCenter;
      const d = Math.hypot(cx, dy, cz) || 1e-4;

      // 构造垂直于视线的精确正交基 u, v
      const nx = cx / d;
      const ny = dy / d;
      const nz = cz / d;

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

      // 1.1 面向相机的外轮廓透视切圆解析解（严格满足 N·V=0，零视差脱节）
      const ratio = d > sphereRadius ? sphereRadius / d : 0.999;
      const hRim = sphereRadius * ratio; // 切圆沿视线方向从球心的位移 h_rim = R^2 / d
      const rRim =
        (sphereRadius + RADIAL_EPS) * Math.sqrt(Math.max(0, 1 - ratio * ratio)); // 切圆半径 r_rim = R * sqrt(1 - R^2 / d^2)

      // 切圆中心坐标
      const centerRimX = cx * (hRim / d);
      const centerRimY = zCenter + dy * (hRim / d);
      const centerRimZ = cz * (hRim / d);

      const rimPts: [number, number, number][] = [];
      const numPts = segments * 2;
      for (let i = 0; i <= numPts; i++) {
        const phi = (i / numPts) * Math.PI * 2;
        const cosP = Math.cos(phi);
        const sinP = Math.sin(phi);
        rimPts.push([
          centerRimX + rRim * (ux * cosP + vx * sinP),
          centerRimY + rRim * (uy * cosP + vy * sinP),
          centerRimZ + rRim * (uz * cosP + vz * sinP),
        ]);
      }
      updateLine(sphereRimLine, rimPts, false);

      // 清空柱/锥/台图元
      updateLine(leftLine, [], false);
      updateLine(rightLine, [], false);
      updateLine(topSolid, [], false);
      updateLine(topDashed, [], true);
      updateLine(bottomSolid, [], false);
      updateLine(bottomDashed, [], true);

      // 1.2 水平赤道截面大圆（前实后虚拆分）
      updateLine(
        equatorSolid,
        sampleArc(
          sphereRadius,
          zCenter,
          thetaCam - Math.PI / 2,
          thetaCam + Math.PI / 2,
          segments,
        ),
        false,
      );
      updateLine(
        equatorDashed,
        sampleArc(
          sphereRadius,
          zCenter,
          thetaCam + Math.PI / 2,
          thetaCam + (Math.PI * 3) / 2,
          segments,
        ),
        true,
      );
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 范式 2：柱 / 锥 / 台（Cylinder, Cone, Frustum）解析解
    // ─────────────────────────────────────────────────────────────
    sphereRimLine.visible = false;
    equatorSolid.visible = false;
    equatorDashed.visible = false;

    const dr = rBottom - rTop;
    const h = zMax - zMin;

    const k = h > 1e-5 ? dr / h : 0;
    const rCam = rBottom - k * (cy - zMin);

    let hasGeneratrix = false;
    let deltaTheta = Math.PI / 2;

    // 2.1 侧相切母线存在性严格判定
    if (Math.abs(dr) < 1e-4) {
      // 圆柱（Cylinder）：当水平视距大于底面半径时存在两条相切母线
      if (horizDist > rBottom + 1e-3) {
        deltaTheta = Math.acos(Math.min(1, rBottom / horizDist));
        hasGeneratrix = true;
      }
    } else {
      // 圆锥 / 圆台（Cone / Frustum）：视点必须处于有效侧视锥高度区间内
      const Hv = zMin + (rBottom * h) / dr;
      const inHeightZone =
        dr > 0
          ? cy > zMin && cy < Hv // 正圆锥/圆台：锥顶在上方 Hv
          : cy < zMax && cy > Hv; // 倒圆台：锥顶在下方 Hv

      if (inHeightZone && horizDist > 1e-3) {
        const cosVal = rCam / horizDist;
        if (Math.abs(cosVal) < 1 - 1e-4) {
          deltaTheta = Math.acos(cosVal);
          hasGeneratrix = true;
        }
      }
    }

    const thetaL = thetaCam - deltaTheta;
    const thetaR = thetaCam + deltaTheta;

    // 退化端面（如圆锥尖顶）半径精准归零，防止顶部分叉
    const rTopEff = rTop > ringRadiusEps ? rTop + RADIAL_EPS : 0;
    const rBotEff = rBottom > ringRadiusEps ? rBottom + RADIAL_EPS : 0;

    if (hasGeneratrix) {
      // 左右相切母线：两端精准连接顶底切点
      const pBotL: [number, number, number] = [
        rBotEff * Math.cos(thetaL),
        zMin,
        rBotEff * Math.sin(thetaL),
      ];
      const pTopL: [number, number, number] = [
        rTopEff * Math.cos(thetaL),
        zMax,
        rTopEff * Math.sin(thetaL),
      ];
      const pBotR: [number, number, number] = [
        rBotEff * Math.cos(thetaR),
        zMin,
        rBotEff * Math.sin(thetaR),
      ];
      const pTopR: [number, number, number] = [
        rTopEff * Math.cos(thetaR),
        zMax,
        rTopEff * Math.sin(thetaR),
      ];

      updateLine(leftLine, [pBotL, pTopL], false);
      updateLine(rightLine, [pBotR, pTopR], false);
    } else {
      updateLine(leftLine, [], false);
      updateLine(rightLine, [], false);
    }

    // 2.2 顶面圆与底面圆的虚实线状态解算
    const isTopFacing = cy >= zMax;
    const isBottomFacing = cy <= zMin;

    const resolveRing = (isTop: boolean) => {
      const zSelf = isTop ? zMax : zMin;
      const rSelf = isTop ? rTop : rBottom;
      const zOther = isTop ? zMin : zMax;
      const rOther = isTop ? rBottom : rTop;
      const isFacing = isTop ? isTopFacing : isBottomFacing;

      // 规则 A：若端面直接正对相机（最前端无遮挡），100% 绘制为整圈实线
      if (isFacing) {
        return {
          solidPts: sampleArc(rSelf, zSelf, 0, Math.PI * 2, segments * 2),
          dashedPts: [] as [number, number, number][],
        };
      }

      // 规则 B：若背对相机且存在相切侧母线，朝向相机的前半弧为实线，背向相机的后半弧为虚线
      if (hasGeneratrix) {
        return {
          solidPts: sampleArc(
            rSelf,
            zSelf,
            thetaCam - deltaTheta,
            thetaCam + deltaTheta,
            segments,
          ),
          dashedPts: sampleArc(
            rSelf,
            zSelf,
            thetaCam + deltaTheta,
            thetaCam - deltaTheta + Math.PI * 2,
            segments,
          ),
        };
      }

      // 规则 C：若背对相机且无侧母线（正俯视 / 正仰视），由穿过遮挡面的投影解算
      const denom = zSelf - cy;
      const t = Math.abs(denom) > 1e-4 ? (zOther - cy) / denom : -1;

      if (t > 0 && t < 1) {
        const dFront = (1 - t) * horizDist + t * rSelf;
        const dBack = Math.abs((1 - t) * horizDist - t * rSelf);

        // 若最前点完全在遮挡面内部：100% 整圈虚线
        if (dFront <= rOther + 1e-4) {
          return {
            solidPts: [] as [number, number, number][],
            dashedPts: sampleArc(rSelf, zSelf, 0, Math.PI * 2, segments * 2),
          };
        }

        // 若最后点完全在遮挡面外侧且自身半径更大：100% 整圈实线
        if (dBack >= rOther - 1e-4 && rSelf > rOther) {
          return {
            solidPts: sampleArc(rSelf, zSelf, 0, Math.PI * 2, segments * 2),
            dashedPts: [] as [number, number, number][],
          };
        }
      }

      // 兜底半实半虚
      return {
        solidPts: sampleArc(
          rSelf,
          zSelf,
          thetaCam - Math.PI / 2,
          thetaCam + Math.PI / 2,
          segments,
        ),
        dashedPts: sampleArc(
          rSelf,
          zSelf,
          thetaCam + Math.PI / 2,
          thetaCam + (Math.PI * 3) / 2,
          segments,
        ),
      };
    };

    if (hasTopRing) {
      const { solidPts, dashedPts } = resolveRing(true);
      updateLine(topSolid, solidPts, false);
      updateLine(topDashed, dashedPts, true);
    } else {
      updateLine(topSolid, [], false);
      updateLine(topDashed, [], true);
    }

    if (hasBottomRing) {
      const { solidPts, dashedPts } = resolveRing(false);
      updateLine(bottomSolid, solidPts, false);
      updateLine(bottomDashed, dashedPts, true);
    } else {
      updateLine(bottomSolid, [], false);
      updateLine(bottomDashed, [], true);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={leftLine} renderOrder={20} />
      <primitive object={rightLine} renderOrder={20} />
      <primitive object={topSolid} renderOrder={20} />
      <primitive object={topDashed} renderOrder={12} />
      <primitive object={bottomSolid} renderOrder={20} />
      <primitive object={bottomDashed} renderOrder={12} />
      <primitive object={sphereRimLine} renderOrder={20} />
      <primitive object={equatorSolid} renderOrder={20} />
      <primitive object={equatorDashed} renderOrder={13} />
    </group>
  );
}
