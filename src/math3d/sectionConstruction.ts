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

export type ConstructionMethodType = "direct" | "parallel" | "intersection";

export interface ConstructionStepOption {
  step: number;
  label: string;
  description: string;
}

export interface ConstructionStepInfo {
  step: number;
  totalSteps: number;
  method: ConstructionMethodType;
  methodName: string; // "直接连线法" | "面面平行线法" | "交轨延长线法"
  stepOptions: ConstructionStepOption[];
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

  // 3. 底面交线与底面多边形其余棱的交点（兼顾交轨法与面面平行性质定理）
  const bottomPoints: { point: Vec3; label: string }[] = [];
  const N_edges = baseVertices.length;

  if (hasK1 && hasK2) {
    // 两个交轨点均存在：连结 K1K2 求解底面各棱交点
    for (let i = 2; i < N_edges; i++) {
      const eStart = baseVertices[i];
      const eEnd = baseVertices[(i + 1) % N_edges];
      const { point: ip, isValid } = intersectLines3D(K1, K2, eStart, eEnd);
      if (isValid) {
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
  } else if (!hasK1 && hasK2) {
    // PQ 平行于底棱 A0B0：由线面平行性质，底面交线必过 K2 且平行于 PQ
    const dir = sub(Q, P);
    const virtualK1 = add(K2, scale(dir, 5));
    for (let i = 2; i < N_edges; i++) {
      const eStart = baseVertices[i];
      const eEnd = baseVertices[(i + 1) % N_edges];
      const { point: ip, isValid } = intersectLines3D(
        K2,
        virtualK1,
        eStart,
        eEnd,
      );
      if (isValid) {
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
  } else if (hasK1 && !hasK2) {
    // QR 平行于底棱 B0C0：由线面平行性质，底面交线必过 K1 且平行于 QR
    const dir = sub(R, Q);
    const virtualK2 = add(K1, scale(dir, 5));
    for (let i = 2; i < N_edges; i++) {
      const eStart = baseVertices[i];
      const eEnd = baseVertices[(i + 1) % N_edges];
      const { point: ip, isValid } = intersectLines3D(
        K1,
        virtualK2,
        eStart,
        eEnd,
      );
      if (isValid) {
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

  // ================= 判定高中三大作图法 =================
  // 1. 直接连线法 (direct, 2步)：三点两两同面，如正四面体截面、正方体角截三角形
  const isDirectTriangle =
    solidKind === "tetrahedron" ||
    (posP <= 0.45 && posQ <= 0.45 && posR <= 0.15);

  // 2. 面面平行线法 (parallel, 3步)：截线段平行于底棱/底面，如正方体等腰梯形
  const isParallelTrapezoid =
    !isDirectTriangle &&
    solidKind === "cuboid" &&
    Math.abs(posP - posQ) < 0.05 &&
    posR > 0.4;

  const method: ConstructionMethodType = isDirectTriangle
    ? "direct"
    : isParallelTrapezoid
      ? "parallel"
      : "intersection";

  // ================= 分流 1：直接连线法 (2 步) =================
  if (method === "direct") {
    const stepOptions: ConstructionStepOption[] = [
      { step: 1, label: "Step 1", description: "同面连线" },
      { step: 2, label: "Step 2", description: "闭合截面" },
    ];
    const clampedStep = Math.max(1, Math.min(2, currentStep));

    if (clampedStep === 1) {
      return {
        step: 1,
        totalSteps: 2,
        method: "direct",
        methodName: "直接连线法",
        stepOptions,
        title: "Step 1: 同面直接连线",
        description:
          "点 P, Q 同在左侧表面内，连结线段 PQ；点 Q, R 同在相邻表面内，连结线段 QR。",
        rationale:
          "基本事实 1（同面连线原理）：如果一条直线上的两点在一个平面内，那么这条直线在此平面内。已知点 P、Q 同面，PQ 为第一截线段；同理 QR 为第二截线段。",
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

    // Step 2: 直接闭合
    return {
      step: 2,
      totalSteps: 2,
      method: "direct",
      methodName: "直接连线法",
      stepOptions,
      title: "Step 2: 连结闭合三角形截面",
      description:
        "已知点 R, P 亦同在多面体的第三个侧表面内，直接连结线段 RP，首尾相接闭合生成三角形截面（无需作任何空间延长线或交轨外点）。",
      rationale:
        "基本事实 1：点 R、P 同在第三表面内，线段 RP 即为第三截线段。截线直接封闭成三角形截面，作图一步到位！",
      activeLines: [
        { from: P, to: Q, type: "solid", colorKey: "accent", label: "PQ" },
        { from: Q, to: R, type: "solid", colorKey: "accent", label: "QR" },
        { from: R, to: P, type: "solid", colorKey: "accent", label: "RP" },
      ],
      activePoints: [
        { position: P, label: "P" },
        { position: Q, label: "Q" },
        { position: R, label: "R" },
      ],
      partialPolygon: [P, Q, R],
    };
  }

  // ================= 分流 2：面面平行线法 (3 步) =================
  if (method === "parallel") {
    const stepOptions: ConstructionStepOption[] = [
      { step: 1, label: "Step 1", description: "同面连线" },
      { step: 2, label: "Step 2", description: "平行引线" },
      { step: 3, label: "Step 3", description: "封闭截面" },
    ];
    const clampedStep = Math.max(1, Math.min(3, currentStep));

    // 计算对面平行线段端点 S_pt
    const dirPQ = sub(Q, P);
    const S_pt = sub(R, dirPQ);

    if (clampedStep === 1) {
      return {
        step: 1,
        totalSteps: 3,
        method: "parallel",
        methodName: "面面平行线法",
        stepOptions,
        title: "Step 1: 同面直接连线",
        description:
          "点 P, Q 同在多面体前侧面内且 PQ ∥ 底面，连结线段 PQ；点 Q, R 在相邻侧面内，连结线段 QR。",
        rationale:
          "基本事实 1：已知点 P、Q 同面前截面上，线段 PQ 为已知截线段；同理 QR 为侧表面截线段。",
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

    if (clampedStep === 2) {
      return {
        step: 2,
        totalSteps: 3,
        method: "parallel",
        methodName: "面面平行线法",
        stepOptions,
        title: "Step 2: 利用面面平行性质定理作平行截线",
        description:
          "由于长方体相对表面互相平行，切面与两个平行平面相交时交线互相平行！故过点 R 在相对表面内直接引线段 RS ∥ PQ，交第四侧棱于点 S。",
        rationale:
          "面面平行性质定理：两平行平面被第三平面所截，交线互相平行。由面面平行直接得出截线平行，无需作外点延长线！",
        activeLines: [
          { from: P, to: Q, type: "solid", colorKey: "highlight", label: "PQ" },
          { from: Q, to: R, type: "solid", colorKey: "highlight", label: "QR" },
          {
            from: R,
            to: S_pt,
            type: "dashed",
            colorKey: "warning",
            label: "RS ∥ PQ",
          },
        ],
        activePoints: [
          { position: P, label: "P" },
          { position: Q, label: "Q" },
          { position: R, label: "R" },
          { position: S_pt, label: "S" },
        ],
        partialPolygon: [P, Q, R, S_pt],
      };
    }

    // Step 3: 封闭截面
    return {
      step: 3,
      totalSteps: 3,
      method: "parallel",
      methodName: "面面平行线法",
      stepOptions,
      title: "Step 3: 连结闭合等腰梯形截面",
      description:
        "连结点 S 与点 P，截面四段截线顺次首尾相接，封闭生成等腰梯形截面！",
      rationale:
        "多面体表面截线首尾相接封闭成多边形，对边 RS ∥ PQ 满足平行约束，生成梯形截面。",
      activeLines: [
        { from: P, to: Q, type: "solid", colorKey: "accent" },
        { from: Q, to: R, type: "solid", colorKey: "accent" },
        { from: R, to: S_pt, type: "solid", colorKey: "accent" },
        { from: S_pt, to: P, type: "solid", colorKey: "accent" },
      ],
      activePoints: [
        { position: P, label: "P" },
        { position: Q, label: "Q" },
        { position: R, label: "R" },
        { position: S_pt, label: "S" },
      ],
      partialPolygon: [P, Q, R, S_pt],
    };
  }

  // ================= 分流 3：交轨延长线法 (4 步) =================
  const stepOptions: ConstructionStepOption[] = [
    { step: 1, label: "Step 1", description: "同面连线" },
    { step: 2, label: "Step 2", description: "延长求交" },
    { step: 3, label: "Step 3", description: "底面交线" },
    { step: 4, label: "Step 4", description: "封闭截面" },
  ];
  const step = Math.max(1, Math.min(4, currentStep));

  // Step 1: 同面直接连线
  if (step === 1) {
    return {
      step: 1,
      totalSteps: 4,
      method: "intersection",
      methodName: "交轨延长线法",
      stepOptions,
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

  // Step 2: 延长求交确定底面外点
  if (step === 2) {
    return {
      step: 2,
      totalSteps: 4,
      method: "intersection",
      methodName: "交轨延长线法",
      stepOptions,
      title: "Step 2: 交轨法延长相交求外点",
      description:
        "延长侧面截线 PQ 与底面对应棱所在的直线，相交于外点 K₁；同理延长 QR 与底面对应棱直线相交于外点 K₂（K₁、K₂ 落在棱的延长线上，为辅助外点）。",
      rationale:
        "基本事实 3（交线/交轨原理）：截线 PQ 与底棱共面于侧面，其延长线必相交于公共点 K₁；同理求得 K₂。K₁、K₂ 既在截面内又在底面内，是两平面的公共交轨点。",
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

  // Step 3: 确定底面交线与棱交点
  if (step === 3) {
    const lines: ConstructionLine[] = [
      { from: P, to: Q, type: "solid", colorKey: "highlight", label: "PQ" },
      { from: Q, to: R, type: "solid", colorKey: "highlight", label: "QR" },
      ...step2ExtensionLines,
    ];

    const points: ConstructionPoint[] = [
      { position: P, label: "P" },
      { position: Q, label: "Q" },
      { position: R, label: "R" },
      ...step2ExternalPoints,
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
      method: "intersection",
      methodName: "交轨延长线法",
      stepOptions,
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

  // Step 4: 封闭生成完整截面多边形
  const finalPolygon = [P, Q, R, ...bottomPoints.map((b) => b.point)];
  const lines: ConstructionLine[] = [
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
    method: "intersection",
    methodName: "交轨延长线法",
    stepOptions,
    title: "Step 4: 闭合生成完整截面多边形",
    description: `截面在多面体各表面的交线顺次闭合，生成 ${finalPolygon.length} 边形截面！各面交线满足平行与共面约束。`,
    rationale:
      "多面体表面截线首尾相接封闭成多边形（应用基本事实 1 与基本事实 3 依次封闭各面交线）。",
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
