/**
 * 多面体截面作图步骤推演纯函数算法层
 * 涵盖：同面直接连线法、交轨延长线法 (公理3)、面面平行性质定理法
 */

import type { Vec3 } from "./vector3";
import { add, sub, scale, dot, cross } from "./vector3";

export interface ConstructionLine {
  from: Vec3;
  to: Vec3;
  type: "solid" | "dashed" | "extension" | "parallel";
  colorKey?: "primary" | "secondary" | "accent" | "highlight" | "warning";
  label?: string;
}

export interface ConstructionPoint {
  position: Vec3;
  label: string;
  isExternal?: boolean;
}

export interface ConstructionStepInfo {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  rationale: string; // 数学定理依据 (公理1/公理2/公理3/平行性质)
  activeLines: ConstructionLine[];
  activePoints: ConstructionPoint[];
  partialPolygon: Vec3[];
}

/**
 * 求解两条共面直线 (p1-p2) 与 (q1-q2) 在三维空间或底面内的延长线交点
 */
export function intersectLines3D(
  p1: Vec3,
  p2: Vec3,
  q1: Vec3,
  q2: Vec3,
): { point: Vec3; isValid: boolean } {
  const u = sub(p2, p1);
  const v = sub(q2, q1);
  const w = sub(q1, p1);

  const uvCross = cross(u, v);
  const lenSq = dot(uvCross, uvCross);
  if (lenSq < 1e-7) {
    return { point: { x: 0, y: 0, z: 0 }, isValid: false };
  }

  const dCross = cross(w, v);
  const t = dot(dCross, uvCross) / lenSq;
  return {
    point: add(p1, scale(u, t)),
    isValid: true,
  };
}

export type SolidKindType =
  "cuboid" | "pyramid" | "tetrahedron" | "prism" | "frustum";

/**
 * 获取多面体真实侧棱端点 (A0, B0, C0 底端点与 A1, B1, C1 顶端点)
 * 与 sectionIntersection.ts 及场景 3D 渲染几何严格 1:1 对齐
 */
export function getPolyhedronEdgeEndpoints(
  kind: SolidKindType,
  a: number,
  b: number,
  c: number,
): {
  baseVertices: Vec3[];
  topVertices: Vec3[];
} {
  if (kind === "pyramid") {
    const sides = 4;
    const r = 2.2;
    const base: Vec3[] = Array.from({ length: sides }, (_, i) => {
      const t = (i / sides) * Math.PI * 2;
      return { x: r * Math.cos(t), y: r * Math.sin(t), z: 0 };
    });
    const apex: Vec3 = { x: 0, y: 0, z: c };
    return { baseVertices: base, topVertices: [apex, apex, apex, apex] };
  }

  if (kind === "tetrahedron") {
    const sides = 3;
    const r = 2.2;
    const base: Vec3[] = Array.from({ length: sides }, (_, i) => {
      const t = (i / sides) * Math.PI * 2;
      return { x: r * Math.cos(t), y: r * Math.sin(t), z: 0 };
    });
    // 正四面体高严格满足 h = √2 * r 保证 6 条棱等长
    const h = c > 0 ? c : r * Math.SQRT2;
    const apex: Vec3 = { x: 0, y: 0, z: h };
    return { baseVertices: base, topVertices: [apex, apex, apex] };
  }

  if (kind === "prism") {
    const sides = 3;
    const r = 2.0;
    const base: Vec3[] = Array.from({ length: sides }, (_, i) => {
      const t = (i / sides) * Math.PI * 2;
      return { x: r * Math.cos(t), y: r * Math.sin(t), z: 0 };
    });
    const top: Vec3[] = base.map((p) => ({ ...p, z: c }));
    return { baseVertices: base, topVertices: top };
  }

  if (kind === "frustum") {
    const sides = 4;
    const r1 = 2.2;
    const r2 = 1.2;
    const base: Vec3[] = Array.from({ length: sides }, (_, i) => {
      const t = (i / sides) * Math.PI * 2;
      return { x: r1 * Math.cos(t), y: r1 * Math.sin(t), z: 0 };
    });
    const top: Vec3[] = Array.from({ length: sides }, (_, i) => {
      const t = (i / sides) * Math.PI * 2;
      return { x: r2 * Math.cos(t), y: r2 * Math.sin(t), z: c };
    });
    return { baseVertices: base, topVertices: top };
  }

  // 默认长方体: A(0,0,0), B(a,0,0), C(a,b,0), D(0,b,0)
  const base: Vec3[] = [
    { x: 0, y: 0, z: 0 },
    { x: a, y: 0, z: 0 },
    { x: a, y: b, z: 0 },
    { x: 0, y: b, z: 0 },
  ];
  const top: Vec3[] = base.map((p) => ({ ...p, z: c }));
  return { baseVertices: base, topVertices: top };
}

/**
 * 通用多面体三点交轨作图推演算法
 * 核心：严格遵循高中作图规范，Step 2 作出的延长线与外点 K1, K2 在 Step 3、Step 4 必须持续累计保留！
 */
export function buildPolyhedronConstructionSteps(
  solidKind: SolidKindType,
  a: number,
  b: number,
  c: number,
  posP: number,
  posQ: number,
  posR: number,
  currentStep: number,
): ConstructionStepInfo {
  const { baseVertices, topVertices } = getPolyhedronEdgeEndpoints(
    solidKind,
    a,
    b,
    c,
  );

  // 侧棱1: base[0] -> top[0]; 侧棱2: base[1] -> top[1]; 侧棱3: base[2] -> top[2]
  const A0 = baseVertices[0];
  const B0 = baseVertices[1];
  const C0 = baseVertices[2];

  const A1 = topVertices[0];
  const B1 = topVertices[1];
  const C1 = topVertices[2];

  // 计算已知控制点 P, Q, R
  const P = add(A0, scale(sub(A1, A0), posP));
  const Q = add(B0, scale(sub(B1, B0), posQ));
  const R = add(C0, scale(sub(C1, C0), posR));

  // 1. 求直线 PQ 与底棱 A0B0 延长线的交点 K1
  // P 与 Q 在侧面 A0B0B1A1 内，PQ 与 A0B0 必共面
  const { point: K1, isValid: hasK1 } = intersectLines3D(P, Q, A0, B0);

  // 2. 求直线 QR 与底棱 B0C0 延长线的交点 K2
  // Q 与 R 在侧面 B0C0C1B1 内，QR 与 B0C0 必共面
  const { point: K2, isValid: hasK2 } = intersectLines3D(Q, R, B0, C0);

  // 3. 底面交线 K1K2 与底面多边形其余棱的交点
  const bottomPoints: { point: Vec3; label: string }[] = [];
  const N_edges = baseVertices.length;

  if (hasK1 && hasK2) {
    // 遍历底面除第1、2条边外的其余各边
    for (let i = 2; i < N_edges; i++) {
      const eStart = baseVertices[i];
      const eEnd = baseVertices[(i + 1) % N_edges];
      const { point: ip, isValid } = intersectLines3D(K1, K2, eStart, eEnd);
      if (isValid) {
        // 判断交点是否在底棱线段内
        const segVec = sub(eEnd, eStart);
        const segLenSq = dot(segVec, segVec);
        const pVec = sub(ip, eStart);
        const t = dot(pVec, segVec) / segLenSq;
        if (t >= -0.02 && t <= 1.02) {
          const lbl = bottomPoints.length === 0 ? "N" : "M";
          bottomPoints.push({ point: ip, label: lbl });
        }
      }
    }
  }

  // 构造 Step 2 的延长线段（必须在 Step 2, Step 3, Step 4 中持续保留）
  const step2ExtensionLines: ConstructionLine[] = [];
  const step2ExternalPoints: ConstructionPoint[] = [];

  if (hasK1) {
    step2ExtensionLines.push(
      {
        from: Q,
        to: K1,
        type: "extension",
        colorKey: "warning",
        label: "PQ延长线",
      },
      {
        from: B0,
        to: K1,
        type: "extension",
        colorKey: "warning",
        label: "底棱延长线",
      },
    );
    step2ExternalPoints.push({ position: K1, label: "K₁", isExternal: true });
  }

  if (hasK2) {
    step2ExtensionLines.push(
      {
        from: R,
        to: K2,
        type: "extension",
        colorKey: "warning",
        label: "QR延长线",
      },
      {
        from: C0,
        to: K2,
        type: "extension",
        colorKey: "warning",
        label: "底棱延长线",
      },
    );
    step2ExternalPoints.push({ position: K2, label: "K₂", isExternal: true });
  }

  const step = Math.max(1, Math.min(4, currentStep));

  // ================= Step 1: 同面直接连线 =================
  if (step === 1) {
    return {
      step: 1,
      totalSteps: 4,
      title: "Step 1: 同面直接连线",
      description:
        "点 P, Q 同在多面体前侧面内，连结线段 PQ；点 Q, R 同在相邻侧面内，连结线段 QR。",
      rationale:
        "基本事实 1（同面连线原理）：如果一条直线上的两点在一个平面内，那么这条直线在此平面内。已知点 P、Q 共面，故线段 PQ 必在该侧表面上，为截面的第一段截线。",
      activeLines: [
        { from: P, to: Q, type: "solid", colorKey: "highlight", label: "PQ" },
        { from: Q, to: R, type: "solid", colorKey: "highlight", label: "QR" },
      ],
      activePoints: [
        { position: P, label: "P" },
        { position: Q, label: "Q" },
        { position: R, label: "R" },
      ],
      partialPolygon: [P, Q, R],
    };
  }

  // ================= Step 2: 延长求交确定底面外点 =================
  if (step === 2) {
    return {
      step: 2,
      totalSteps: 4,
      title: "Step 2: 交轨法延长相交求外点",
      description:
        "延长侧面截线 PQ 与底面对应棱所在的直线，相交于外点 K₁；同理延长 QR 与底面对应棱直线相交于外点 K₂（K₁、K₂ 通常落在棱的延长线上，为辅助虚点）。",
      rationale:
        "基本事实 3（交线/交轨原理）：截线 PQ 与底棱共面于侧面，其延长线必相交于公共点 K₁；同理求得 K₂。K₁、K₂ 既在截面内又在底面内，是两平面的公共点。",
      activeLines: [
        { from: P, to: Q, type: "solid", colorKey: "highlight", label: "PQ" },
        { from: Q, to: R, type: "solid", colorKey: "highlight", label: "QR" },
        ...step2ExtensionLines,
      ],
      activePoints: [
        { position: P, label: "P" },
        { position: Q, label: "Q" },
        { position: R, label: "R" },
        ...step2ExternalPoints,
      ],
      partialPolygon: [P, Q, R],
    };
  }

  // ================= Step 3: 确定底面交线与棱交点 =================
  if (step === 3) {
    const lines: ConstructionLine[] = [
      { from: P, to: Q, type: "solid", colorKey: "highlight", label: "PQ" },
      { from: Q, to: R, type: "solid", colorKey: "highlight", label: "QR" },
      ...step2ExtensionLines, // 【重要：完整保留 Step 2 的延长线痕迹】
    ];

    const points: ConstructionPoint[] = [
      { position: P, label: "P" },
      { position: Q, label: "Q" },
      { position: R, label: "R" },
      ...step2ExternalPoints, // 【重要：完整保留 Step 2 的外点 K1, K2】
    ];

    if (hasK1 && hasK2) {
      lines.push({
        from: K1,
        to: K2,
        type: "dashed",
        colorKey: "secondary",
        label: "底面交轨线 K₁K₂",
      });
    }

    bottomPoints.forEach((bp) => {
      points.push({ position: bp.point, label: bp.label });
    });

    if (bottomPoints.length >= 1) {
      lines.push({
        from: R,
        to: bottomPoints[0].point,
        type: "solid",
        colorKey: "highlight",
      });
    }
    if (bottomPoints.length >= 2) {
      lines.push({
        from: bottomPoints[0].point,
        to: bottomPoints[1].point,
        type: "solid",
        colorKey: "highlight",
      });
      lines.push({
        from: bottomPoints[1].point,
        to: P,
        type: "solid",
        colorKey: "highlight",
      });
    } else if (bottomPoints.length === 1) {
      lines.push({
        from: bottomPoints[0].point,
        to: P,
        type: "solid",
        colorKey: "highlight",
      });
    }

    return {
      step: 3,
      totalSteps: 4,
      title: "Step 3: 确定底面交线与棱交点",
      description:
        "连结外点直线 K₁K₂ 作为截面在底面内的交线，交底面棱于内点 M、N，得到底面截线段。",
      rationale:
        "基本事实 3：两点确定一条直线，直线 K₁K₂ 即为截面与底面的交线；交线与底面多边形各边内部的实际交点即为截面在底面上的顶点。",
      activeLines: lines,
      activePoints: points,
      partialPolygon: [P, Q, R, ...bottomPoints.map((b) => b.point)],
    };
  }

  // ================= Step 4: 封闭生成完整截面多边形 =================
  const finalPolygon = [P, Q, R, ...bottomPoints.map((b) => b.point)];
  const lines: ConstructionLine[] = [
    { from: P, to: Q, type: "solid", colorKey: "accent", label: "PQ" },
    { from: Q, to: R, type: "solid", colorKey: "accent", label: "QR" },
    // 在 Step 4 中保留细延长线痕迹
    ...step2ExtensionLines.map((l) => ({ ...l, type: "dashed" as const })),
  ];

  if (hasK1 && hasK2) {
    lines.push({ from: K1, to: K2, type: "dashed", colorKey: "secondary" });
  }

  for (let i = 0; i < finalPolygon.length; i++) {
    const pA = finalPolygon[i];
    const pB = finalPolygon[(i + 1) % finalPolygon.length];
    lines.push({ from: pA, to: pB, type: "solid", colorKey: "accent" });
  }

  return {
    step: 4,
    totalSteps: 4,
    title: "Step 4: 闭合生成完整截面多边形",
    description: `截面在多面体各表面的交线顺次闭合，生成 ${finalPolygon.length} 边形截面！各面交线满足平行与共面约束。`,
    rationale:
      "多面体表面截线首尾相接，封闭生成截面多边形（在柱体中应用面面平行性质定理保证平行面截线互相平行；在锥体中利用基本事实 1 与基本事实 3 依次封闭各面交线）。",
    activeLines: lines,
    activePoints: [
      ...finalPolygon.map((p, idx) => ({
        position: p,
        label: ["P", "Q", "R", "N", "M", "E", "F"][idx] ?? `T_{${idx}}`,
      })),
      ...step2ExternalPoints,
    ],
    partialPolygon: finalPolygon,
  };
}

/** 兼容旧版长方体推演接口 */
export function buildCuboidConstructionSteps(
  a: number,
  b: number,
  c: number,
  posP: number,
  posQ: number,
  posR: number,
  currentStep: number,
): ConstructionStepInfo {
  return buildPolyhedronConstructionSteps(
    "cuboid",
    a,
    b,
    c,
    posP,
    posQ,
    posR,
    currentStep,
  );
}
