/**
 * 空间点线面位置关系的基本事实与推论（空间公理体系）纯数学层
 *
 * 教材编号口径（人教 A 版 2019 必修第二册 8.4.1 P125-127，全项目统一，勿再改回）：
 * - **基本事实 1**：过不在一条直线上的三个点，有且只有一个平面
 * - **基本事实 2**：如果一条直线上的两个点在一个平面内，那么这条直线在这个平面内
 * - **基本事实 3**：如果两个不重合的平面有一个公共点，那么它们有且只有一条过该点的公共直线
 * - **基本事实 4**（8.5.1）：平行于同一条直线的两条直线平行
 * - 「两点确定一条直线」是**初中**内容，教材只把它当作三个推论的辅助前提，**不占用基本事实编号**
 *
 * 本模块同时提供中屏绘制几何（`buildAxiomsElements`）与内容包围盒
 * （`solidAxiomsSceneBounds`）——两者共用同一批顶点与延长规则，
 * 杜绝"页面画一套、相机算一套"导致的取景出框。
 * 纯数学函数，零 DOM / React 依赖。
 */

import {
  type Vec3,
  sub,
  cross,
  norm,
  dot,
  normalize,
  add,
  scale,
} from "./vector3";
import { boundsOf, expandBounds, type Bounds3D } from "./sceneBounds";

export type AxiomsMode = "determination" | "intersection" | "spatialLines";

export type AxiomsSubType =
  "threePoints" | "lineAndPoint" | "intersectingLines" | "parallelLines";

export interface PlaneEquation {
  /** 法向量 (A, B, C) */
  normal: Vec3;
  /** 平面常数项 D: Ax + By + Cz + D = 0 */
  D: number;
}

export interface PlaneDeterminationResult {
  /** 确定平面的基准几何要素点集 */
  referencePoints: Vec3[];
  /** 确定的平面方程 */
  plane: PlaneEquation;
  /** 测试动点 P */
  testPoint: Vec3;
  /** 动点 P 到平面的有向/绝对距离 */
  distanceToPlane: number;
  /** 动点 P 是否共面 */
  isCoplanar: boolean;
  /** 平面法向量模长 */
  normalLength: number;
  /** 构型说明 */
  description: string;
}

export interface PlaneIntersectionResult {
  /** 平面 alpha 法向量 */
  normalAlpha: Vec3;
  /** 平面 beta 法向量 */
  normalBeta: Vec3;
  /** 两平面二面角（锐角或直角）度数 */
  dihedralDeg: number;
  /** 交线方向向量 */
  lineDirection: Vec3;
  /** 交线上已知基准点 */
  pointOnLine: Vec3;
  /** 两平面的公共测试点 */
  commonPoint: Vec3;
  /** 公共测试点是否严格在交线上 */
  isPointOnIntersectionLine: boolean;
}

/** 等角定理结论：两角相等 / 互补 / 两者都不是 */
export type EqualAngleRelation = "equal" | "supplementary" | "neither";

export interface SpatialLinesResult {
  /** 基准角 ∠AOB 两边方向向量 */
  dir1: Vec3;
  dir2: Vec3;
  /** 平移角的对应边方向（dir3 ∥ dir1；dir4 由"同向/反向"开关决定） */
  dir3: Vec3;
  dir4: Vec3;
  /** 基准角 ∠AOB 度数（0°~180°） */
  angle1Deg: number;
  /** 平移角 ∠A'O'B' 实测度数（0°~180°，反向时即互补角） */
  angle2Deg: number;
  /** 由叉积**实算**的平行关系（不再有硬编码恒真值） */
  isParallel12: boolean;
  isParallel23: boolean;
  isParallel13: boolean;
  /** 等角定理判定 */
  equalAngleCheck: {
    angle1Deg: number;
    angle2Deg: number;
    relation: EqualAngleRelation;
    isOAParallel: boolean;
    isOBParallel: boolean;
  };
  /** 第二组角的两边是否整体反向（用于展示"互补"分支） */
  flipSecondRay: boolean;
}

// ============================================================================
// 一、确定平面的四种基本构型
// ============================================================================

/** 确定平面的四种构型的基准点（几何单一来源：计算平面与绘制骨架都取这里） */
export function determinationReferencePoints(subType: AxiomsSubType): {
  A: Vec3;
  B: Vec3;
  C: Vec3;
} {
  switch (subType) {
    case "threePoints":
      return {
        A: { x: 0, y: 0, z: 0 },
        B: { x: 3, y: 0, z: 0 },
        C: { x: 1, y: 2.5, z: 0 },
      };
    case "lineAndPoint":
      // 直线 l 过 A(0,0,0), B(3,0,0)，点 C(1.5,2.2,0) 在直线外
      return {
        A: { x: 0, y: 0, z: 0 },
        B: { x: 3, y: 0, z: 0 },
        C: { x: 1.5, y: 2.2, z: 0 },
      };
    case "intersectingLines":
      // 相交直线 l₁(过 A,B) 与 l₂(过 A,C)，交点为 A
      return {
        A: { x: 0, y: 0, z: 0 },
        B: { x: 3, y: 0.5, z: 0 },
        C: { x: 0.8, y: 2.5, z: 0 },
      };
    default:
      // 平行直线 l₁(过 A,B) 与 l₂(过 C,D)，AB ∥ CD
      return {
        A: { x: 0, y: 0, z: 0 },
        B: { x: 3, y: 0, z: 0 },
        C: { x: 0.5, y: 2, z: 0 },
      };
  }
}

/** 构型说明（教材编号口径见文件头注释） */
export function determinationDescription(subType: AxiomsSubType): string {
  switch (subType) {
    case "threePoints":
      return "基本事实 1：过不在同一直线上的三点 A, B, C，有且只有一个平面 α。";
    case "lineAndPoint":
      return "推论 1：经过一条直线 l 和这条直线外一点 C，有且只有一个平面 α。";
    case "intersectingLines":
      return "推论 2：经过两条相交直线 l₁ 与 l₂，有且只有一个平面 α。";
    default:
      return "推论 3：经过两条平行直线 l₁ 与 l₂，有且只有一个平面 α。";
  }
}

/**
 * 确定平面的四种基本构型几何计算
 * @param subType 构型
 * @param tParam 动点离面高度偏移
 */
export function calculatePlaneDetermination(
  subType: AxiomsSubType,
  tParam: number = 0,
): PlaneDeterminationResult {
  const { A, B, C } = determinationReferencePoints(subType);

  // 计算三点法向量 n = AB × AC
  const vecAB = sub(B, A);
  const vecAC = sub(C, A);
  const nRaw = cross(vecAB, vecAC);
  const nLen = norm(nRaw);
  const normal = nLen < 1e-9 ? { x: 0, y: 0, z: 1 } : normalize(nRaw);
  const D = -dot(normal, A);

  // 动点 P(x, y, z)，当 tParam = 0 时刚好在平面内 (z=0)
  const P: Vec3 = {
    x: 1.5,
    y: 1.0,
    z: tParam, // 高度偏离
  };

  const dist = Math.abs(dot(normal, P) + D);
  const isCoplanar = dist < 1e-4;

  return {
    referencePoints: [A, B, C],
    plane: { normal, D },
    testPoint: P,
    distanceToPlane: dist,
    isCoplanar,
    normalLength: nLen,
    description: determinationDescription(subType),
  };
}

/**
 * 两相交平面公共交线定理计算（基本事实 3）
 * 平面 alpha: z = 0 (水平面)
 * 平面 beta: 绕 x 轴倾斜 tiltDeg 度的平面
 */
export function calculatePlaneIntersection(
  tiltDeg: number = 35,
  pointX: number = 1.2,
): PlaneIntersectionResult {
  const rad = (tiltDeg * Math.PI) / 180;
  const normalAlpha: Vec3 = { x: 0, y: 0, z: 1 };
  const normalBeta: Vec3 = { x: 0, y: -Math.sin(rad), z: Math.cos(rad) };

  // 交线方向 u = n_alpha × n_beta = (sin(rad), 0, 0) => 归一化为 (1, 0, 0) (x 轴)
  const lineDir: Vec3 = { x: 1, y: 0, z: 0 };
  const pointOnLine: Vec3 = { x: 0, y: 0, z: 0 };
  const commonPoint: Vec3 = { x: pointX, y: 0, z: 0 };

  const distAlpha = Math.abs(dot(normalAlpha, commonPoint));
  const distBeta = Math.abs(dot(normalBeta, commonPoint));
  const isPointOnIntersectionLine = distAlpha < 1e-5 && distBeta < 1e-5;

  const cosD = Math.abs(dot(normalAlpha, normalBeta));
  const dihedral = (Math.acos(Math.max(-1, Math.min(1, cosD))) * 180) / Math.PI;

  return {
    normalAlpha,
    normalBeta,
    dihedralDeg: dihedral,
    lineDirection: lineDir,
    pointOnLine,
    commonPoint,
    isPointOnIntersectionLine,
  };
}

// ============================================================================
// 二、空间平行传递性与等角定理（基本事实 4 + 等角定理）
// ============================================================================

/** 空间基准角边长 */
export const SPATIAL_ANGLE_ARM_LENGTH = 2.5;
/** 平移角的平移高度 */
export const SPATIAL_ANGLE_LIFT = 2.5;
/** 第三条平行线（传递性链条）的 z 位置：置于基准面下方，避免与角重叠 */
export const SPATIAL_RAIL_Z = -1.4;
/** 第三条平行线两端 x 坐标 */
export const SPATIAL_RAIL_X: [number, number] = [-1.2, 3.2];

/**
 * 空间平行传递性与等角定理计算
 *
 * ## 与旧实现的差别（P2-4 修复）
 * 旧版把 `isParallel13` 与 `equalAngleCheck` 直接写成常量 `true`，
 * 看板因此**结构上不可能给出否定结论**，且滑块上限 120° 也永远看不到
 * 等角定理里的"互补"分支。本版：
 * - 平行关系全部由**方向向量叉积**实算（改一处构造，判定就会跟着变）；
 * - 增加 `flipSecondRay` 开关：把平移角的一边整体反向，即可展示
 *   "两对应平行角相等**或互补**"的后半句。
 *
 * @param angleParamDeg 空间两线转角 α（度）
 * @param flipSecondRay 平移角的一边是否反向（展示互补情形）
 */
export function calculateSpatialLinesAndAngles(
  angleParamDeg: number = 60,
  flipSecondRay: boolean = false,
): SpatialLinesResult {
  const rad = (angleParamDeg * Math.PI) / 180;

  // 基准角 ∠AOB：OA 沿 x 轴，OB 与 OA 成 α
  const dir1: Vec3 = { x: 1, y: 0, z: 0 };
  const dir2: Vec3 = { x: Math.cos(rad), y: Math.sin(rad), z: 0 };
  // 平移角 ∠A'O'B'：O'A' 与 OA 同向平行，O'B' 为 ±OB（反向即得互补分支）
  const dir3: Vec3 = { ...dir1 };
  const dir4: Vec3 = flipSecondRay
    ? { x: -dir2.x, y: -dir2.y, z: -dir2.z }
    : { ...dir2 };

  /** 两方向向量是否平行（叉积模长趋零） */
  const isParallel = (u: Vec3, v: Vec3) => norm(cross(u, v)) < 1e-6;

  const angleBetweenDeg = (u: Vec3, v: Vec3) => {
    const c = dot(u, v) / Math.max(1e-9, norm(u) * norm(v));
    return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
  };

  const angle1Deg = angleBetweenDeg(dir1, dir2);
  const angle2Deg = angleBetweenDeg(dir3, dir4);

  // 第三条平行线：与 l₁ 同向，几何上真实存在，供传递性链条 l₁∥l₂∥l₃ 使用
  const railDir: Vec3 = { x: 1, y: 0, z: 0 };

  let relation: EqualAngleRelation = "neither";
  if (Math.abs(angle1Deg - angle2Deg) < 1e-6) relation = "equal";
  else if (Math.abs(angle1Deg + angle2Deg - 180) < 1e-6)
    relation = "supplementary";

  return {
    dir1,
    dir2,
    dir3,
    dir4,
    angle1Deg,
    angle2Deg,
    // 三条直线：l₁ = 基准角第一边；l₂ = 平移角对应边（∥ l₁）；l₃ = 第三条平行线
    isParallel12: isParallel(dir1, dir3),
    isParallel23: isParallel(dir3, railDir),
    isParallel13: isParallel(dir1, railDir),
    equalAngleCheck: {
      angle1Deg,
      angle2Deg,
      relation,
      isOAParallel: isParallel(dir1, dir3),
      isOBParallel: isParallel(dir2, dir4) || isParallel(dir2, scale(dir4, -1)),
    },
    flipSecondRay,
  };
}

// ============================================================================
// 三、中屏绘制几何（页面与包围盒的**单一来源**）
// ============================================================================

/** 直线上两端各延长多少（数学单位），使"直线"读起来是线而非线段 */
export const AXIOMS_LINE_EXTEND = 0.8;
/** 平面 α 示意面片相对构型基准点的外扩量 */
export const AXIOMS_PATCH_PAD = 0.6;
/** 两平面相交模式的面片范围（交线必须落在两者之内） */
export const INTERSECTION_PATCH = {
  xMin: -1,
  xMax: 3,
  halfWidth: 2,
};

export type AxiomsSegmentKind =
  "linePrimary" | "lineSecondary" | "lineHighlight" | "aux";

/** 点标注键（纯 ASCII，页面映射到 PointLabel3D / FormulaLabel3D） */
export type AxiomsMarkerKey = "A" | "B" | "C" | "P" | "O" | "Op" | "Ap" | "Bp";

export interface AxiomsSegment {
  from: Vec3;
  to: Vec3;
  kind: AxiomsSegmentKind;
  dashed?: boolean;
}

export interface AxiomsMarker {
  at: Vec3;
  key: AxiomsMarkerKey;
}

export interface AxiomsLineLabel {
  at: Vec3;
  /** KaTeX 源码（下标等用真下标渲染，避免 PointLabel3D 字体缺字） */
  tex: string;
}

export interface AxiomsFace {
  points: Vec3[];
  kind: "facePrimary" | "faceSecondary";
}

export interface AxiomsElements {
  faces: AxiomsFace[];
  segments: AxiomsSegment[];
  markers: AxiomsMarker[];
  lineLabels: AxiomsLineLabel[];
  /** 动点（决定"共面与否"的测试点） */
  movingPoint?: Vec3;
  /** 动点是否共面（配色用） */
  movingPointCoplanar?: boolean;
  /** 动点脱离平面时的垂足（画垂线虚线） */
  movingPointFoot?: Vec3;
}

export interface AxiomsSceneParams {
  tParam: number;
  tiltDeg: number;
  angleParamDeg: number;
  /** 等角定理的"反向"开关（仅 spatialLines 模式使用） */
  flipSecondRay: boolean;
}

/** 沿线段两端各延长 ext（"直线"而非"线段"） */
function extendLine(from: Vec3, to: Vec3, ext: number): [Vec3, Vec3] {
  const dir = normalize(sub(to, from));
  return [add(from, scale(dir, -ext)), add(to, scale(dir, ext))];
}

/** 由一批点生成 z = 0 平面上的示意面片（比内容外扩 pad） */
function patchFromPoints(points: Vec3[], pad: number): Vec3[] {
  const b = expandBounds(boundsOf(points), pad);
  return [
    { x: b.min.x, y: b.min.y, z: 0 },
    { x: b.max.x, y: b.min.y, z: 0 },
    { x: b.max.x, y: b.max.y, z: 0 },
    { x: b.min.x, y: b.max.y, z: 0 },
  ];
}

/** 模式一：平面的确定（四种构型）的骨架几何 */
function buildDeterminationElements(
  subType: AxiomsSubType,
  params: AxiomsSceneParams,
): AxiomsElements {
  const { A, B, C } = determinationReferencePoints(subType);
  const det = calculatePlaneDetermination(subType, params.tParam);
  const P = det.testPoint;

  const segments: AxiomsSegment[] = [];
  const markers: AxiomsMarker[] = [
    { at: A, key: "A" },
    { at: B, key: "B" },
    { at: C, key: "C" },
  ];
  const lineLabels: AxiomsLineLabel[] = [];

  if (subType === "threePoints") {
    segments.push(
      { from: A, to: B, kind: "linePrimary" },
      { from: A, to: C, kind: "lineSecondary" },
      { from: B, to: C, kind: "aux", dashed: true },
    );
  } else if (subType === "lineAndPoint") {
    const [l0, l1] = extendLine(A, B, AXIOMS_LINE_EXTEND);
    segments.push(
      { from: l0, to: l1, kind: "linePrimary" },
      { from: C, to: { x: C.x, y: 0, z: 0 }, kind: "aux", dashed: true },
    );
    lineLabels.push({ at: l1, tex: "l" });
  } else if (subType === "intersectingLines") {
    const [p0, p1] = extendLine(A, B, AXIOMS_LINE_EXTEND);
    const [q0, q1] = extendLine(A, C, AXIOMS_LINE_EXTEND);
    segments.push(
      { from: p0, to: p1, kind: "linePrimary" },
      { from: q0, to: q1, kind: "lineSecondary" },
    );
    lineLabels.push({ at: p1, tex: "l_1" }, { at: q1, tex: "l_2" });
  } else {
    const D = add(C, sub(B, A));
    const [p0, p1] = extendLine(A, B, AXIOMS_LINE_EXTEND);
    const [q0, q1] = extendLine(C, D, AXIOMS_LINE_EXTEND);
    segments.push(
      { from: p0, to: p1, kind: "linePrimary" },
      { from: q0, to: q1, kind: "lineSecondary" },
    );
    lineLabels.push({ at: p1, tex: "l_1" }, { at: q1, tex: "l_2" });
  }

  // 动点脱离平面时的垂足（画垂线虚线用）
  const movingPointFoot: Vec3 | undefined = det.isCoplanar
    ? undefined
    : { x: P.x, y: P.y, z: 0 };

  // 面片范围由**全部会被绘制的平面内点**派生（含"直线"的延长端点、标注锚点与垂足），
  // 若只按 A/B/C 三点算，`parallelLines` 构型的 l₂ 会延长到面片之外，
  // 出现"直线跑到自己所在平面之外"的自相矛盾画面。
  const patchPoints: Vec3[] = [A, B, C, P];
  for (const s of segments) patchPoints.push(s.from, s.to);
  for (const l of lineLabels) patchPoints.push(l.at);
  if (movingPointFoot) patchPoints.push(movingPointFoot);
  const patch = patchFromPoints(patchPoints, AXIOMS_PATCH_PAD);

  return {
    faces: [{ points: patch, kind: "facePrimary" }],
    segments,
    markers,
    lineLabels,
    movingPoint: P,
    movingPointCoplanar: det.isCoplanar,
    movingPointFoot,
  };
}

/** 模式二：两平面相交必有一条交线（基本事实 3） */
function buildIntersectionElements(params: AxiomsSceneParams): AxiomsElements {
  const { xMin, xMax, halfWidth: w } = INTERSECTION_PATCH;
  const rad = (params.tiltDeg * Math.PI) / 180;
  const sinT = Math.sin(rad);
  const cosT = Math.cos(rad);

  const planeAlpha: Vec3[] = [
    { x: xMin, y: -w, z: 0 },
    { x: xMax, y: -w, z: 0 },
    { x: xMax, y: w, z: 0 },
    { x: xMin, y: w, z: 0 },
  ];
  const planeBeta: Vec3[] = [
    { x: xMin, y: -w * cosT, z: -w * sinT },
    { x: xMax, y: -w * cosT, z: -w * sinT },
    { x: xMax, y: w * cosT, z: w * sinT },
    { x: xMin, y: w * cosT, z: w * sinT },
  ];

  // 交线严格取在两片示意面片之内（否则会"穿过"自己所在的平面，视觉自相矛盾）
  const res = calculatePlaneIntersection(params.tiltDeg);

  return {
    faces: [
      { points: planeAlpha, kind: "facePrimary" },
      { points: planeBeta, kind: "faceSecondary" },
    ],
    segments: [
      {
        from: { x: xMin, y: 0, z: 0 },
        to: { x: xMax, y: 0, z: 0 },
        kind: "lineHighlight",
      },
    ],
    markers: [{ at: res.commonPoint, key: "P" }],
    lineLabels: [{ at: { x: xMax, y: 0, z: 0 }, tex: "l" }],
  };
}

/** 模式三：空间平行传递性与等角定理（基本事实 4 + 等角定理） */
function buildSpatialLinesElements(params: AxiomsSceneParams): AxiomsElements {
  const res = calculateSpatialLinesAndAngles(
    params.angleParamDeg,
    params.flipSecondRay,
  );
  const L = SPATIAL_ANGLE_ARM_LENGTH;
  const lift = SPATIAL_ANGLE_LIFT;

  const O1: Vec3 = { x: 0, y: 0, z: 0 };
  const A1 = scale(res.dir1, L);
  const B1 = scale(res.dir2, L);

  const O2: Vec3 = { x: 0, y: 0, z: lift };
  const A2 = add(O2, scale(res.dir3, L));
  const B2 = add(O2, scale(res.dir4, L));

  // 第三条平行线：与 l₁ 同向的真实线段，构成 l₁∥l₂∥l₃ 的传递性链条
  const railA: Vec3 = { x: SPATIAL_RAIL_X[0], y: 0, z: SPATIAL_RAIL_Z };
  const railB: Vec3 = { x: SPATIAL_RAIL_X[1], y: 0, z: SPATIAL_RAIL_Z };

  return {
    faces: [],
    segments: [
      { from: O1, to: A1, kind: "linePrimary" },
      { from: O1, to: B1, kind: "lineSecondary" },
      { from: O2, to: A2, kind: "linePrimary" },
      { from: O2, to: B2, kind: "lineSecondary" },
      { from: railA, to: railB, kind: "lineHighlight" },
      // 空间平移对应关系（同向/反向由 dir4 决定，虚线如实反映对应边）
      { from: O1, to: O2, kind: "aux", dashed: true },
      { from: A1, to: A2, kind: "aux", dashed: true },
      { from: B1, to: B2, kind: "aux", dashed: true },
    ],
    markers: [
      { at: O1, key: "O" },
      { at: A1, key: "A" },
      { at: B1, key: "B" },
      { at: O2, key: "Op" },
      { at: A2, key: "Ap" },
      { at: B2, key: "Bp" },
    ],
    lineLabels: [
      { at: A1, tex: "l_1" },
      { at: B1, tex: "l_2" },
      { at: railB, tex: "l_3" },
    ],
  };
}

/** 中屏绘制几何（按模式分派）。页面与包围盒都必须使用本函数的输出。 */
export function buildAxiomsElements(
  mode: AxiomsMode,
  subType: AxiomsSubType,
  params: AxiomsSceneParams,
): AxiomsElements {
  if (mode === "determination") {
    return buildDeterminationElements(subType, params);
  }
  if (mode === "intersection") {
    return buildIntersectionElements(params);
  }
  return buildSpatialLinesElements(params);
}

/** 从中屏几何中取出所有会被绘制的顶点（用于包围盒，含面片角点与标注锚点） */
export function axiomsElementPoints(el: AxiomsElements): Vec3[] {
  const pts: Vec3[] = [];
  for (const f of el.faces) pts.push(...f.points);
  for (const s of el.segments) pts.push(s.from, s.to);
  for (const m of el.markers) pts.push(m.at);
  for (const l of el.lineLabels) pts.push(l.at);
  if (el.movingPoint) pts.push(el.movingPoint);
  if (el.movingPointFoot) pts.push(el.movingPointFoot);
  return pts;
}

/**
 * 中屏内容包围盒（数学坐标）——供 `<CameraFit>` 计算"恰好装得下"的机位。
 * 直接由 `buildAxiomsElements` 的输出来算，天然与页面绘制同源。
 */
export function solidAxiomsSceneBounds(
  mode: AxiomsMode,
  subType: AxiomsSubType,
  params: AxiomsSceneParams,
): Bounds3D {
  return boundsOf(
    axiomsElementPoints(buildAxiomsElements(mode, subType, params)),
  );
}
