/**
 * src/math3d/rotationUnfold.ts
 * 旋转体侧面连续展平（等距可展弯曲）与表面最短测地线计算纯函数库
 * 零 React / DOM / Three 依赖，专供 RotationBodyAnimation 与右屏 Builder 复用
 */

import { calculateUnfoldParams } from "./rotationProfiles";
import type { Vec3 } from "./vector3";

export type UnfoldSolidType = "cylinder" | "cone" | "frustum";

export interface RotationUnfoldInput {
  type: UnfoldSolidType;
  r1: number;
  r2?: number;
  height: number;
  /** 展平进度 ∈ [0, 1]：0 为闭合 3D 旋转体，1 为完全展开的平面矩形/扇形/扇环 */
  unfoldProgress: number;
  gridU?: number;
  gridV?: number;
  pathSegments?: number;
}

export interface RotationUnfoldResult {
  type: UnfoldSolidType;
  unfoldProgress: number;
  generatorLength: number;
  unfoldAngleDeg: number;
  unfoldAngleRad: number;
  effectiveChordAngleRad: number;
  outerRadius2D: number;
  innerRadius2D: number;
  /** 绕侧面一周最短路径实际测地线长度 */
  minPathLength: number;
  /** 圆台展开扇环直接弦长（余弦定理参考值，未绕开内孔截断） */
  chordLawOfCosinesLength: number;
  /** 路径是否发生临界退化（圆锥 α > π 过锥顶，或圆台弦被上底小圆遮挡沿顶边贴合） */
  pathRegime:
    | "cylinder_diagonal"
    | "cone_chord"
    | "cone_apex_degenerate"
    | "frustum_chord"
    | "frustum_tangent_arc";
  /** 网格点阵 (gridV + 1) x (gridU + 1)，math coords (z 竖直向上) */
  gridPoints: Vec3[][];
  /** 表面最短路径 3D 采样点集 */
  geodesicPoints: Vec3[];
  /** 左侧剪开缝边界线 (u = 0) */
  seamLeftLine: Vec3[];
  /** 右侧剪开缝边界线 (u = 1) */
  seamRightLine: Vec3[];
  /** 底面圆弧展开线 (v = 0) */
  bottomArcLine: Vec3[];
  /** 顶面圆弧展开线 (v = 1) */
  topArcLine: Vec3[];
  /** 路径起点与终点（标注 A 与 B/A₁） */
  startPoint: Vec3;
  endPoint: Vec3;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * 圆柱侧面等距连续展开映射：
 * 将 (u, v) ∈ [0,1]^2 映射到保持弧长与母线长不变的 3D 弯曲/平面点坐标
 */
function evalCylinderPoint(
  r: number,
  h: number,
  p: number,
  u: number,
  v: number,
): Vec3 {
  const s = (2 * u - 1) * Math.PI * r;
  const z = v * h;
  const remain = 1 - p;
  if (remain < 1e-4) {
    return { x: s, y: 0, z };
  }
  const rCurr = r / remain;
  const phi = (2 * u - 1) * Math.PI * remain;
  return {
    x: rCurr * Math.sin(phi),
    y: r * remain - rCurr * (1 - Math.cos(phi)),
    z,
  };
}

/**
 * 圆锥/圆台（可展锥面）等距连续展开映射：
 * 给定展开扇形极坐标 (rho, psi) —— rho 为距虚拟锥顶母线长，psi ∈ [-alpha/2, +alpha/2]，
 * 当 p 从 0 -> 1 时，扇角倍率 kappa 从 sin(gamma0) = alpha/(2π) 渐变到 1，
 * 并绕 X 轴平滑旋转 -p*(π/2)，使闭态竖直放置、展平态正对前视/等轴相机立于 x-z 平面。
 */
function evalConicalPoint(
  outerR: number,
  innerR: number,
  alpha: number,
  hConeAxis: number,
  p: number,
  rho: number,
  psi: number,
  invertedTopWider: boolean,
): Vec3 {
  const kappa0 = Math.min(0.9999, Math.max(1e-4, alpha / (2 * Math.PI)));
  const kappa = (1 - p) * kappa0 + p * 1;
  const phi = psi / kappa;
  const cosGamma = Math.sqrt(Math.max(0, 1 - kappa * kappa));

  // 局部锥顶坐标：对称中心母线 psi=0 落在 +y 背面，切缝 psi=±alpha/2 在 -y 前侧展开
  const lx = rho * kappa * Math.sin(phi);
  const lyLocal = rho * kappa * Math.cos(phi);
  const lzLocal = -rho * cosGamma;

  // 平滑倾斜角度 tilt = -p * (π/2)，将展平后的扇形立于 x-z 平面朝向 -y 观众
  const tilt = -(Math.PI / 2) * p;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);

  const ry = lyLocal * cosT - lzLocal * sinT;
  const rz = lyLocal * sinT + lzLocal * cosT;

  // 竖直偏移使底面贴近 z = 0：p=0 时锥顶位于 hConeAxis，p=1 时底部中点在 z = 0
  const apexZ = (1 - p) * hConeAxis + p * outerR;
  const pt: Vec3 = {
    x: lx,
    y: ry,
    z: apexZ + rz,
  };

  // 若圆台出现上大下小 (r2 > r1)，按上下翻转保持实体底在 z=0 顶在 z=h
  if (invertedTopWider) {
    const span = (1 - p) * hConeAxis + p * (outerR - innerR);
    return {
      x: pt.x,
      y: pt.y,
      z: span - pt.z,
    };
  }
  return pt;
}

/**
 * 计算旋转体侧面展开图网格、测地线最短路径点集与精准路径长度
 */
export function buildRotationUnfoldData(
  input: RotationUnfoldInput,
): RotationUnfoldResult {
  const r1 = Math.max(0.05, input.r1);
  const r2Raw = input.r2 !== undefined ? Math.max(0.01, input.r2) : 0;
  const height = Math.max(0.1, input.height);
  const p = clamp01(input.unfoldProgress);
  const gridU = Math.max(12, input.gridU ?? 36);
  const gridV = Math.max(6, input.gridV ?? 14);
  const pathSegments = Math.max(24, input.pathSegments ?? 48);

  // 退化为圆柱：类型本就是 cylinder，或圆台两底半径几乎相等
  const isDegenerateCylinder =
    input.type === "cylinder" ||
    (input.type === "frustum" && Math.abs(r1 - r2Raw) < 1e-3);

  if (isDegenerateCylinder) {
    const r = input.type === "frustum" ? 0.5 * (r1 + r2Raw) : r1;
    const unfold = calculateUnfoldParams("cylinder", r, r, height);

    const gridPoints: Vec3[][] = [];
    for (let iv = 0; iv <= gridV; iv++) {
      const v = iv / gridV;
      const row: Vec3[] = [];
      for (let iu = 0; iu <= gridU; iu++) {
        const u = iu / gridU;
        row.push(evalCylinderPoint(r, height, p, u, v));
      }
      gridPoints.push(row);
    }

    const geodesicPoints: Vec3[] = [];
    for (let k = 0; k <= pathSegments; k++) {
      const t = k / pathSegments;
      geodesicPoints.push(evalCylinderPoint(r, height, p, t, t));
    }

    const seamLeftLine = gridPoints.map((row) => row[0]);
    const seamRightLine = gridPoints.map((row) => row[gridU]);
    const bottomArcLine = gridPoints[0];
    const topArcLine = gridPoints[gridV];

    return {
      type: input.type,
      unfoldProgress: p,
      generatorLength: unfold.generatorLength,
      unfoldAngleDeg: unfold.unfoldAngleDeg,
      unfoldAngleRad: unfold.unfoldAngleRad,
      effectiveChordAngleRad: Math.PI,
      outerRadius2D: 0,
      innerRadius2D: 0,
      minPathLength: unfold.shortestPathAround,
      chordLawOfCosinesLength: unfold.shortestPathAround,
      pathRegime: "cylinder_diagonal",
      gridPoints,
      geodesicPoints,
      seamLeftLine,
      seamRightLine,
      bottomArcLine,
      topArcLine,
      startPoint: geodesicPoints[0],
      endPoint: geodesicPoints[geodesicPoints.length - 1],
    };
  }

  if (input.type === "cone") {
    const unfold = calculateUnfoldParams("cone", r1, 0, height);
    const l = unfold.generatorLength;
    const alpha = unfold.unfoldAngleRad;
    const effectiveChordAngleRad = Math.min(alpha, 2 * Math.PI - alpha);

    // 当 α <= π 时为凸扇形内直线弦；当 α > π 时过锥顶退化为两母线 2l（与 calculateUnfoldParams 一致）
    const isApexDegenerate = alpha > Math.PI + 1e-6;
    const minPathLength = isApexDegenerate
      ? unfold.shortestPathAround
      : Math.sqrt(
          Math.max(0, 2 * l * l * (1 - Math.cos(effectiveChordAngleRad))),
        );

    const gridPoints: Vec3[][] = [];
    for (let iv = 0; iv <= gridV; iv++) {
      const v = iv / gridV; // v=0 为底面 (rho=l), v=1 为锥顶 (rho=0)
      const rho = l * (1 - v);
      const row: Vec3[] = [];
      for (let iu = 0; iu <= gridU; iu++) {
        const u = iu / gridU;
        const psi = (u - 0.5) * alpha;
        row.push(evalConicalPoint(l, 0, alpha, height, p, rho, psi, false));
      }
      gridPoints.push(row);
    }

    const geodesicPoints: Vec3[] = [];
    const p0x = l * Math.sin(-alpha / 2);
    const p0y = -l * Math.cos(-alpha / 2);
    const p1x = l * Math.sin(alpha / 2);
    const p1y = -l * Math.cos(alpha / 2);

    for (let k = 0; k <= pathSegments; k++) {
      const t = k / pathSegments;
      let rho: number;
      let psi: number;
      if (!isApexDegenerate) {
        // 平面 2D 直线参数插值，绝不越界出扇形
        const px = p0x + (p1x - p0x) * t;
        const py = p0y + (p1y - p0y) * t;
        rho = Math.hypot(px, py);
        psi = rho < 1e-6 ? 0 : Math.atan2(px, -py);
      } else {
        // α > π：退化为沿左侧母线爬到锥顶再沿右侧母线下到底面（长度 2l）
        if (t <= 0.5) {
          rho = l * (1 - 2 * t);
          psi = -alpha / 2;
        } else {
          rho = l * (2 * t - 1);
          psi = alpha / 2;
        }
      }
      geodesicPoints.push(
        evalConicalPoint(l, 0, alpha, height, p, rho, psi, false),
      );
    }

    const seamLeftLine = gridPoints.map((row) => row[0]);
    const seamRightLine = gridPoints.map((row) => row[gridU]);
    const bottomArcLine = gridPoints[0];
    const topArcLine = gridPoints[gridV];

    return {
      type: "cone",
      unfoldProgress: p,
      generatorLength: l,
      unfoldAngleDeg: unfold.unfoldAngleDeg,
      unfoldAngleRad: alpha,
      effectiveChordAngleRad,
      outerRadius2D: l,
      innerRadius2D: 0,
      minPathLength,
      chordLawOfCosinesLength: minPathLength,
      pathRegime: isApexDegenerate ? "cone_apex_degenerate" : "cone_chord",
      gridPoints,
      geodesicPoints,
      seamLeftLine,
      seamRightLine,
      bottomArcLine,
      topArcLine,
      startPoint: geodesicPoints[0],
      endPoint: geodesicPoints[geodesicPoints.length - 1],
    };
  }

  // frustum (圆台：底半径 r1，顶半径 r2Raw)
  const inverted = r2Raw > r1;
  const rMax = Math.max(r1, r2Raw);
  const rMin = Math.min(r1, r2Raw);
  const unfold = calculateUnfoldParams("frustum", rMax, rMin, height);
  const l = unfold.generatorLength;
  const alpha = unfold.unfoldAngleRad;
  const effectiveChordAngleRad = Math.min(alpha, 2 * Math.PI - alpha);

  const deltaR = rMax - rMin;
  const outerR = (rMax / deltaR) * l;
  const innerR = (rMin / deltaR) * l;
  const fullConeAxisHeight = (rMax / deltaR) * height;

  // 余弦定理弦长（有效弦角 min(α, 2π - α) 防 α > π 时符号翻转）
  const chordLawOfCosinesLength = Math.sqrt(
    Math.max(
      0,
      outerR * outerR +
        innerR * innerR -
        2 * outerR * innerR * Math.cos(effectiveChordAngleRad),
    ),
  );

  // 判断直线是否被内圆 (上底小圆 R_inner) 遮挡：切角 phiTangent = arccos(R_inner / R_outer)
  const cosRatio = Math.min(1, Math.max(0, innerR / Math.max(1e-6, outerR)));
  const phiTangent = Math.acos(cosRatio);
  const isTangentArc =
    effectiveChordAngleRad > phiTangent + 1e-6 || alpha > Math.PI + 1e-6;

  // 若内孔遮挡或张角 > π，扇环表面真实测地线 = 外端点到内圆切线段 + 贴合内圆弧段
  const minPathLength = isTangentArc
    ? Math.sqrt(Math.max(0, outerR * outerR - innerR * innerR)) +
      innerR * Math.max(0, alpha - phiTangent)
    : chordLawOfCosinesLength;

  const gridPoints: Vec3[][] = [];
  for (let iv = 0; iv <= gridV; iv++) {
    const v = iv / gridV; // v=0 对应 rMax 侧 (outerR)，v=1 对应 rMin 侧 (innerR)
    const rho = outerR - v * l;
    const row: Vec3[] = [];
    for (let iu = 0; iu <= gridU; iu++) {
      const u = iu / gridU;
      const psi = (u - 0.5) * alpha;
      row.push(
        evalConicalPoint(
          outerR,
          innerR,
          alpha,
          fullConeAxisHeight,
          p,
          rho,
          psi,
          inverted,
        ),
      );
    }
    gridPoints.push(row);
  }

  // 从 rMax 端 (-alpha/2) 到 rMin 端 (+alpha/2) 的表面测地线
  const geodesicPoints: Vec3[] = [];
  const tangentLen = Math.sqrt(Math.max(0, outerR * outerR - innerR * innerR));
  const tangentFrac =
    isTangentArc && minPathLength > 1e-6 ? tangentLen / minPathLength : 1;

  const startX = outerR * Math.sin(-alpha / 2);
  const startY = -outerR * Math.cos(-alpha / 2);
  const endPsiChord = alpha / 2;
  const chordEndX = innerR * Math.sin(endPsiChord);
  const chordEndY = -innerR * Math.cos(endPsiChord);

  const tanPsi = -alpha / 2 + phiTangent;
  const tanX = innerR * Math.sin(tanPsi);
  const tanY = -innerR * Math.cos(tanPsi);

  for (let k = 0; k <= pathSegments; k++) {
    const t = k / pathSegments;
    let rho: number;
    let psi: number;
    if (!isTangentArc) {
      const px = startX + (chordEndX - startX) * t;
      const py = startY + (chordEndY - startY) * t;
      rho = Math.hypot(px, py);
      psi = Math.atan2(px, -py);
    } else if (t <= tangentFrac) {
      const s = tangentFrac > 1e-6 ? t / tangentFrac : 1;
      const px = startX + (tanX - startX) * s;
      const py = startY + (tanY - startY) * s;
      rho = Math.hypot(px, py);
      psi = Math.atan2(px, -py);
    } else {
      const s =
        tangentFrac < 1 - 1e-6 ? (t - tangentFrac) / (1 - tangentFrac) : 1;
      rho = innerR;
      psi = tanPsi + (alpha / 2 - tanPsi) * s;
    }

    geodesicPoints.push(
      evalConicalPoint(
        outerR,
        innerR,
        alpha,
        fullConeAxisHeight,
        p,
        rho,
        psi,
        inverted,
      ),
    );
  }

  const seamLeftLine = gridPoints.map((row) => row[0]);
  const seamRightLine = gridPoints.map((row) => row[gridU]);
  const bottomArcLine = gridPoints[0];
  const topArcLine = gridPoints[gridV];

  return {
    type: "frustum",
    unfoldProgress: p,
    generatorLength: l,
    unfoldAngleDeg: unfold.unfoldAngleDeg,
    unfoldAngleRad: alpha,
    effectiveChordAngleRad,
    outerRadius2D: outerR,
    innerRadius2D: innerR,
    minPathLength,
    chordLawOfCosinesLength,
    pathRegime: isTangentArc ? "frustum_tangent_arc" : "frustum_chord",
    gridPoints,
    geodesicPoints,
    seamLeftLine,
    seamRightLine,
    bottomArcLine,
    topArcLine,
    startPoint: geodesicPoints[0],
    endPoint: geodesicPoints[geodesicPoints.length - 1],
  };
}
