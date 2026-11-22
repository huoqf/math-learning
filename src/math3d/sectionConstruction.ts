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

export type SectionPresetKind =
  "free" | "cubeHexagon" | "cubeTrapezoid" | "cubeTriangle" | "tetraSection";

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

export interface ControlEdgePair {
  start: Vec3;
  end: Vec3;
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
 * 获取当前截面情景下 P, Q, R 三动点所在棱的起点与终点（SSOT）
 * 解决过去 P, Q, R 永远锁死在三条平行侧棱导致正六边形/正三角形/等腰梯形失真的缺陷。
 */
export function getControlEdgeEndpoints(
  solidKind: SolidKindType,
  a: number,
  b: number,
  c: number,
  preset: SectionPresetKind = "free",
): [ControlEdgePair, ControlEdgePair, ControlEdgePair] {
  const { baseVertices, topVertices } = getPolyhedronEdgeEndpoints(
    solidKind,
    a,
    b,
    c,
  );
  const [A, B, C, D] = baseVertices;
  const [A1, , C1, D1] = topVertices;

  if (solidKind === "cuboid" && preset === "cubeHexagon") {
    // 正方体正六边形截面：P ∈ AB, Q ∈ BC, R ∈ CC1
    return [
      { start: A, end: B },
      { start: B, end: C },
      { start: C, end: C1 },
    ];
  }

  if (solidKind === "cuboid" && preset === "cubeTrapezoid") {
    // 正方体等腰梯形截面：P ∈ D1A1 (从 D1 算起), Q ∈ D1C1 (从 D1 算起), R ∈ DA (从 D 算起)
    return [
      { start: D1, end: A1 },
      { start: D1, end: C1 },
      { start: D, end: A },
    ];
  }

  if (solidKind === "cuboid" && preset === "cubeTriangle") {
    // 正方体角截正三角形：共顶点 A 的三条邻棱 AA1, AB, AD
    return [
      { start: A, end: A1 },
      { start: A, end: B },
      { start: A, end: D },
    ];
  }

  // 默认（free 与 tetraSection 等）：前三条侧棱
  return [
    { start: baseVertices[0], end: topVertices[0] },
    { start: baseVertices[1], end: topVertices[1] },
    { start: baseVertices[2], end: topVertices[2] },
  ];
}

function pointOnEdge(edge: ControlEdgePair, t: number): Vec3 {
  const clampT = Math.max(0.05, Math.min(0.95, t));
  return add(edge.start, scale(sub(edge.end, edge.start), clampT));
}

function pointSegT(p: Vec3, a: Vec3, b: Vec3): number {
  const ab = sub(b, a);
  const lenSq = dot(ab, ab);
  if (lenSq < 1e-9) return -1;
  return dot(sub(p, a), ab) / lenSq;
}

/**
 * 通用多面体三点交轨作图推演算法
 * 核心：严格遵循高中作图规范，Step 2 作出的延长线与外点在后续步骤持续累计保留。
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
  preset: SectionPresetKind = "free",
): ConstructionStepInfo {
  const { baseVertices, topVertices } = getPolyhedronEdgeEndpoints(
    solidKind,
    a,
    b,
    c,
  );
  const [edgeP, edgeQ, edgeR] = getControlEdgeEndpoints(
    solidKind,
    a,
    b,
    c,
    preset,
  );

  const P = pointOnEdge(edgeP, posP);
  const Q = pointOnEdge(edgeQ, posQ);
  const R = pointOnEdge(edgeR, posR);

  // ================= 专型 1：正方体角截正三角形（直接连线法 2 步） =================
  if (solidKind === "cuboid" && preset === "cubeTriangle") {
    const stepOptions: ConstructionStepOption[] = [
      { step: 1, label: "Step 1", description: "同面连线" },
      { step: 2, label: "Step 2", description: "闭合正三角形" },
    ];
    const clampedStep = Math.max(1, Math.min(2, currentStep));
    if (clampedStep === 1) {
      return {
        step: 1,
        totalSteps: 2,
        method: "direct",
        methodName: "直接连线法",
        stepOptions,
        title: "Step 1: 相邻表面同面连线",
        description:
          "点 P ∈ AA₁、Q ∈ AB 同在前面 ABB₁A₁ 内，直接连结 PQ；点 Q ∈ AB、R ∈ AD 同在底面 ABCD 内，直接连结 QR。",
        rationale:
          "基本事实 1（两点确定直线在平面内）：三点两两处于相邻表面，截线可直接同面连出，无需任何交轨外点。",
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

    return {
      step: 2,
      totalSteps: 2,
      method: "direct",
      methodName: "直接连线法",
      stepOptions,
      title: "Step 2: 闭合生成正三角形截面",
      description:
        "点 R ∈ AD 与 P ∈ AA₁ 同在左侧面 ADD₁A₁ 内，连结 RP 即首尾封闭为 △PQR（等距时三边均为 √2·AP）。",
      rationale:
        "基本事实 1：RP ⊂ 左侧面 ADD₁A₁，三条截线两两共面，直接封闭为三角形截面。",
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

  // ================= 专型 2：正方体等腰梯形（面面平行线法 3 步） =================
  if (solidKind === "cuboid" && preset === "cubeTrapezoid") {
    const [A, , C, D] = baseVertices;
    const [, , C1] = topVertices;
    // 在底面过 R 沿 PQ 方向作平行线交 DC（或 BC）于点 S
    const dirPQ = sub(Q, P);
    const farPoint = add(R, scale(dirPQ, 5));
    let S_pt: Vec3 = C;
    const hitDC = intersectLines3D(R, farPoint, D, C);
    const hitBC = intersectLines3D(R, farPoint, baseVertices[1], C);
    if (hitDC.isValid) {
      const tDC = pointSegT(hitDC.point, D, C);
      if (tDC >= -0.02 && tDC <= 1.02) {
        S_pt = hitDC.point;
      } else if (hitBC.isValid) {
        S_pt = hitBC.point;
      }
    } else if (hitBC.isValid) {
      S_pt = hitBC.point;
    }

    // 检查是否额外穿过侧棱 AA1/CC1（仅当 posR < posP 时可能穿透侧面）
    const isFourSided = Math.abs(pointSegT(S_pt, D, C) - 0.5) <= 0.52;
    const stepOptions: ConstructionStepOption[] = [
      { step: 1, label: "Step 1", description: "同面连线" },
      { step: 2, label: "Step 2", description: "平行引线" },
      { step: 3, label: "Step 3", description: "封闭梯形" },
    ];
    const clampedStep = Math.max(1, Math.min(3, currentStep));

    if (clampedStep === 1) {
      return {
        step: 1,
        totalSteps: 3,
        method: "parallel",
        methodName: "面面平行线法",
        stepOptions,
        title: "Step 1: 同面直接连结 PQ 与 PR",
        description:
          "点 P ∈ D₁A₁、Q ∈ D₁C₁ 同在顶面 A₁B₁C₁D₁ 内，连结 PQ；点 P ∈ D₁A₁、R ∈ DA 同在左侧面 ADD₁A₁ 内，连结 PR。",
        rationale:
          "基本事实 1：同面两点连线即为表面截线，分别得到顶面截线 PQ 与左侧面截线 PR。",
        activeLines: [
          { from: P, to: Q, type: "solid", colorKey: "highlight", label: "PQ" },
          { from: P, to: R, type: "solid", colorKey: "highlight", label: "PR" },
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
        title: "Step 2: 利用面面平行性质作平行截线 RS",
        description:
          "由于底面 ABCD ∥ 顶面 A₁B₁C₁D₁，截面与两平行底面的交线必然平行！过 R 在底面内直接作 RS ∥ PQ，交底棱 DC 于点 S。",
        rationale:
          "面面平行性质定理：两平行平面同时与第三平面相交，所得交线互相平行（RS ∥ PQ），直接定位底面交点 S。",
        activeLines: [
          { from: P, to: Q, type: "solid", colorKey: "highlight", label: "PQ" },
          { from: P, to: R, type: "solid", colorKey: "highlight", label: "PR" },
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
        partialPolygon: [P, Q, S_pt, R],
      };
    }

    return {
      step: 3,
      totalSteps: 3,
      method: "parallel",
      methodName: "面面平行线法",
      stepOptions,
      title: "Step 3: 连结 QS 封闭等腰梯形截面",
      description: isFourSided
        ? "点 Q ∈ D₁C₁ 与 S ∈ DC 同在后侧面 CDD₁C₁ 内，连结 QS，四条截线首尾闭合生成等腰梯形 PQSR（当 D₁P = D₁Q 时 PR = QS）。"
        : "连结后侧面截线 QS 并封闭截面轮廓，注意调节 R 至更靠近 A（即 posR > posP）可保持严格四边形等腰梯形。",
      rationale:
        "多面体各面截线依次封闭成梯形截面：上底 PQ ∥ 下底 RS，且由对称全等 Rt△ 证得两腰 PR = QS（D₁P = D₁Q 时）。",
      activeLines: [
        { from: P, to: Q, type: "solid", colorKey: "accent" },
        { from: Q, to: S_pt, type: "solid", colorKey: "accent" },
        { from: S_pt, to: R, type: "solid", colorKey: "accent" },
        { from: R, to: P, type: "solid", colorKey: "accent" },
      ],
      activePoints: [
        { position: P, label: "P" },
        { position: Q, label: "Q" },
        { position: R, label: "R" },
        { position: S_pt, label: "S" },
        ...(C1 && A ? [] : []),
      ],
      partialPolygon: [P, Q, S_pt, R],
    };
  }

  // ================= 专型 3：正方体正六边形（标准交轨延长线法 4 步） =================
  if (solidKind === "cuboid" && preset === "cubeHexagon") {
    const [A, , C, D] = baseVertices;
    const [A1, , C1, D1] = topVertices;

    // 1. 底面交线 PQ 延长分别交 AD 于 K1、交 DC 于 K2
    const k1Res = intersectLines3D(P, Q, A, D);
    const k2Res = intersectLines3D(P, Q, D, C);
    const hasK1 = k1Res.isValid;
    const hasK2 = k2Res.isValid;
    const K1 = k1Res.point;
    const K2 = k2Res.point;

    // 2. 在后面 CDD1C1 内，连结 K2 与 R，交 C1D1 于 M，并延长交 DD1 于 K3
    let M: Vec3 = { x: a / 2, y: b, z: c };
    let hasM = false;
    let K3: Vec3 = { x: 0, y: b, z: 1.5 * c };
    let hasK3 = false;
    if (hasK2) {
      const mRes = intersectLines3D(K2, R, D1, C1);
      if (mRes.isValid) {
        M = mRes.point;
        hasM = true;
      }
      const k3Res = intersectLines3D(K2, R, D, D1);
      if (k3Res.isValid) {
        K3 = k3Res.point;
        hasK3 = true;
      }
    }

    // 3. 在左侧面 ADD1A1 内，连结 K1 与 K3，分别交 AA1 于 E、交 A1D1 于 N
    let E: Vec3 = { x: 0, y: 0, z: c / 2 };
    let N: Vec3 = { x: 0, y: b / 2, z: c };
    if (hasK1 && hasK3) {
      const eRes = intersectLines3D(K1, K3, A, A1);
      if (eRes.isValid) E = eRes.point;
      const nRes = intersectLines3D(K1, K3, A1, D1);
      if (nRes.isValid) N = nRes.point;
    }

    const step2ExtLines: ConstructionLine[] = [];
    const step2ExtPoints: ConstructionPoint[] = [];
    if (hasK1) {
      step2ExtLines.push(
        {
          from: P,
          to: K1,
          type: "extension",
          colorKey: "warning",
          label: "PQ延长线",
        },
        {
          from: A,
          to: K1,
          type: "extension",
          colorKey: "warning",
          label: "AD延长线",
        },
      );
      step2ExtPoints.push({ position: K1, label: "K₁", isExternal: true });
    }
    if (hasK2) {
      step2ExtLines.push(
        {
          from: Q,
          to: K2,
          type: "extension",
          colorKey: "warning",
          label: "PQ延长线",
        },
        {
          from: C,
          to: K2,
          type: "extension",
          colorKey: "warning",
          label: "DC延长线",
        },
      );
      step2ExtPoints.push({ position: K2, label: "K₂", isExternal: true });
    }

    const stepOptions: ConstructionStepOption[] = [
      { step: 1, label: "Step 1", description: "同面连线" },
      { step: 2, label: "Step 2", description: "延长求交" },
      { step: 3, label: "Step 3", description: "交轨定顶点" },
      { step: 4, label: "Step 4", description: "封闭正六边形" },
    ];
    const step = Math.max(1, Math.min(4, currentStep));

    if (step === 1) {
      return {
        step: 1,
        totalSteps: 4,
        method: "intersection",
        methodName: "交轨延长线法",
        stepOptions,
        title: "Step 1: 同面直接连结 PQ 与 QR",
        description:
          "点 P ∈ AB、Q ∈ BC 同在底面 ABCD 内，连结 PQ；点 Q ∈ BC、R ∈ CC₁ 同在右侧面 BCC₁B₁ 内，连结 QR。",
        rationale:
          "基本事实 1：同面两点连线即为表面截线，分别确定底面与右侧面的截线段 PQ、QR。",
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

    if (step === 2) {
      return {
        step: 2,
        totalSteps: 4,
        method: "intersection",
        methodName: "交轨延长线法",
        stepOptions,
        title: "Step 2: 延长底面截线 PQ 求交轨外点 K₁, K₂",
        description:
          "在底面内反向延长 PQ 交 AD 延长线于外点 K₁，正向延长交 DC 延长线于外点 K₂（K₁, K₂ 同时落在截面与侧面内）。",
        rationale:
          "基本事实 3（交线/交轨原理）：K₁ ∈ 面 ADD₁A₁ ∩ 截面，K₂ ∈ 面 CDD₁C₁ ∩ 截面，成为跨向背面与左侧面的关键桥梁。",
        activeLines: [
          { from: P, to: Q, type: "solid", colorKey: "highlight", label: "PQ" },
          { from: Q, to: R, type: "solid", colorKey: "highlight", label: "QR" },
          ...step2ExtLines,
        ],
        activePoints: [
          { position: P, label: "P" },
          { position: Q, label: "Q" },
          { position: R, label: "R" },
          ...step2ExtPoints,
        ],
        partialPolygon: [P, Q, R],
      };
    }

    const step3ExtLines: ConstructionLine[] = [...step2ExtLines];
    const step3Points: ConstructionPoint[] = [
      { position: P, label: "P" },
      { position: Q, label: "Q" },
      { position: R, label: "R" },
      ...step2ExtPoints,
    ];
    if (hasK2 && hasM) {
      step3ExtLines.push({
        from: K2,
        to: hasK3 ? K3 : M,
        type: "dashed",
        colorKey: "secondary",
        label: "K₂R 交轨线",
      });
      step3Points.push({ position: M, label: "M" });
    }
    if (hasK3) {
      step3ExtLines.push({
        from: D1,
        to: K3,
        type: "extension",
        colorKey: "warning",
        label: "DD₁延长线",
      });
      step3Points.push({ position: K3, label: "K₃", isExternal: true });
    }
    if (hasK1 && hasK3) {
      step3ExtLines.push({
        from: K1,
        to: K3,
        type: "dashed",
        colorKey: "secondary",
        label: "K₁K₃ 交轨线",
      });
      step3Points.push({ position: N, label: "N" });
      step3Points.push({ position: E, label: "E" });
    }

    if (step === 3) {
      return {
        step: 3,
        totalSteps: 4,
        method: "intersection",
        methodName: "交轨延长线法",
        stepOptions,
        title: "Step 3: 跨面交轨确定其余三顶点 M, N, E",
        description:
          "在后面 CDD₁C₁ 内连结 K₂R 交 C₁D₁ 于 M 并延交 DD₁ 延长线于 K₃；再在左侧面 ADD₁A₁ 内连结 K₁K₃ 交 A₁D₁ 于 N、交 AA₁ 于 E。",
        rationale:
          "基本事实 3：两点确定两平面唯一交线。由 K₂R 破出背面截线 RM，由 K₁K₃ 破出左侧面截线 NE。",
        activeLines: [
          { from: P, to: Q, type: "solid", colorKey: "highlight" },
          { from: Q, to: R, type: "solid", colorKey: "highlight" },
          { from: R, to: M, type: "solid", colorKey: "highlight" },
          { from: M, to: N, type: "solid", colorKey: "highlight" },
          { from: N, to: E, type: "solid", colorKey: "highlight" },
          { from: E, to: P, type: "solid", colorKey: "highlight" },
          ...step3ExtLines,
        ],
        activePoints: step3Points,
        partialPolygon: [P, Q, R, M, N, E],
      };
    }

    // Step 4: 闭合正六边形
    const hexagonPts = [P, Q, R, M, N, E];
    const finalLines: ConstructionLine[] = [
      ...step3ExtLines.map((l) => ({ ...l, type: "dashed" as const })),
    ];
    for (let i = 0; i < hexagonPts.length; i++) {
      finalLines.push({
        from: hexagonPts[i],
        to: hexagonPts[(i + 1) % hexagonPts.length],
        type: "solid",
        colorKey: "accent",
      });
    }

    return {
      step: 4,
      totalSteps: 4,
      method: "intersection",
      methodName: "交轨延长线法",
      stepOptions,
      title: "Step 4: 闭合生成正六边形截面 P-Q-R-M-N-E",
      description:
        "六条表面截线顺次首尾相接，在正方体六个表面各留下一条对角半截线（全为棱中点时边长恒为 √2a/2），构成正六边形截面！",
      rationale:
        "各对边严格平行（PQ ∥ MN、QR ∥ EP、RM ∥ NE），且相邻边夹角 120°，同时验证面面平行与基本事实 3 闭环。",
      activeLines: finalLines,
      activePoints: step3Points,
      partialPolygon: hexagonPts,
    };
  }

  // ================= 通用自由探索模式（兼容三侧棱与多种凸多面体） =================
  const A0 = baseVertices[0];
  const B0 = baseVertices[1];
  const C0 = baseVertices[2];

  // 1. 求直线 PQ 与底棱 A0B0 延长线的交点 K1
  const { point: K1, isValid: hasK1 } = intersectLines3D(P, Q, A0, B0);

  // 2. 求直线 QR 与底棱 B0C0 延长线的交点 K2
  const { point: K2, isValid: hasK2 } = intersectLines3D(Q, R, B0, C0);

  // 3. 底面交线与底面多边形其余棱的交点
  const bottomPoints: { point: Vec3; label: string }[] = [];
  const N_edges = baseVertices.length;

  if (hasK1 && hasK2) {
    for (let i = 2; i < N_edges; i++) {
      const eStart = baseVertices[i];
      const eEnd = baseVertices[(i + 1) % N_edges];
      const { point: ip, isValid } = intersectLines3D(K1, K2, eStart, eEnd);
      if (isValid) {
        const t = pointSegT(ip, eStart, eEnd);
        if (t >= -0.02 && t <= 1.02) {
          const lbl = bottomPoints.length === 0 ? "N" : "M";
          bottomPoints.push({ point: ip, label: lbl });
        }
      }
    }
  } else if (!hasK1 && hasK2) {
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
        const t = pointSegT(ip, eStart, eEnd);
        if (t >= -0.02 && t <= 1.02) {
          const lbl = bottomPoints.length === 0 ? "N" : "M";
          bottomPoints.push({ point: ip, label: lbl });
        }
      }
    }
  } else if (hasK1 && !hasK2) {
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
        const t = pointSegT(ip, eStart, eEnd);
        if (t >= -0.02 && t <= 1.02) {
          const lbl = bottomPoints.length === 0 ? "N" : "M";
          bottomPoints.push({ point: ip, label: lbl });
        }
      }
    }
  }

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

  // 1. 直接连线法 (direct, 2步)：正四面体三侧棱点天然两两共面
  const isDirectTriangle = solidKind === "tetrahedron";

  // 2. 面面平行线法 (parallel, 3步)：截线段严格平行于底棱/顶棱，无需交轨外点即可过 R 直接引平行截线
  const fourthZRatio = posP + posR - posQ;
  const isParallelFourthEdge =
    !isDirectTriangle &&
    solidKind === "cuboid" &&
    fourthZRatio >= 0.02 &&
    fourthZRatio <= 0.98 &&
    (Math.abs(posP - posQ) < 0.05 || (!hasK1 && !hasK2));

  const method: ConstructionMethodType = isDirectTriangle
    ? "direct"
    : isParallelFourthEdge
      ? "parallel"
      : "intersection";

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

  if (method === "parallel") {
    const stepOptions: ConstructionStepOption[] = [
      { step: 1, label: "Step 1", description: "同面连线" },
      { step: 2, label: "Step 2", description: "平行引线" },
      { step: 3, label: "Step 3", description: "封闭截面" },
    ];
    const clampedStep = Math.max(1, Math.min(3, currentStep));

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
          "点 P, Q 同在多面体前侧面内，连结线段 PQ；点 Q, R 同在右侧表面内，连结线段 QR。",
        rationale:
          "基本事实 1：已知点 P、Q 同在前面，线段 PQ 为已知截线段；同理 QR 为右侧面截线段。",
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
          "由于长方体相对侧面互相平行，切面与两个平行平面相交时交线互相平行！过点 R 在后侧面内直接引线段 RS ∥ PQ，交第四侧棱 DD₁ 于点 S。",
        rationale:
          "面面平行性质定理：两平行平面被第三平面所截，交线互相平行（RS ∥ PQ），无需作外点延长线！",
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

    return {
      step: 3,
      totalSteps: 3,
      method: "parallel",
      methodName: "面面平行线法",
      stepOptions,
      title: "Step 3: 连结闭合平行四边形截面",
      description:
        "连结点 S 与点 P，四段截线顺次首尾相接，封闭生成四边形截面（当侧棱均被严格截断时为平行四边形）。",
      rationale:
        "多面体相对表面交线分别平行（PQ ∥ RS 且 QR ∥ SP），满足两组对边平行闭环。",
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

  // 分流 3：交轨延长线法 (4 步)
  const stepOptions: ConstructionStepOption[] = [
    { step: 1, label: "Step 1", description: "同面连线" },
    { step: 2, label: "Step 2", description: "延长求交" },
    { step: 3, label: "Step 3", description: "底面交线" },
    { step: 4, label: "Step 4", description: "封闭截面" },
  ];
  const step = Math.max(1, Math.min(4, currentStep));

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
  const extraFourthPoint =
    bottomPoints.length === 0 &&
    solidKind === "cuboid" &&
    fourthZRatio >= 0 &&
    fourthZRatio <= 1
      ? [sub(R, sub(Q, P))]
      : [];
  const finalPolygon = [
    P,
    Q,
    R,
    ...bottomPoints.map((b) => b.point),
    ...extraFourthPoint,
  ];
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
